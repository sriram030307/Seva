import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Mic, 
  MapPin, 
  FileText, 
  Bell, 
  Shield, 
  Users, 
  AlertOctagon, 
  Building2, 
  Activity, 
  CheckCircle,
  Sparkles,
  ChevronDown,
  Layers,
  BarChart3,
  Flame,
  Bug,
  Sliders,
  Crown,
  Bot,
  Eye
} from 'lucide-react';
import { sevaStore } from '../../services/store';
import { UserProfile, AppNotification } from '../../types';
import { DeveloperSettingsModal } from '../../government/components/DeveloperSettingsModal';

interface NavbarProps {
  mode: 'citizen' | 'government';
}

export const Navbar: React.FC<NavbarProps> = ({ mode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserProfile>(sevaStore.getCurrentUser());
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDevModal, setShowDevModal] = useState(false);

  useEffect(() => {
    const update = () => {
      setCurrentUser(sevaStore.getCurrentUser());
      setNotifications(sevaStore.getNotifications(currentUser.role, currentUser.id));
    };
    update();
    const unsub = sevaStore.subscribe(update);
    return unsub;
  }, [currentUser.role, currentUser.id]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const allDemoUsers = sevaStore.getAllDemoUsers();

  const handleUserSelect = (user: UserProfile) => {
    sevaStore.setCurrentUser(user);
    setShowUserMenu(false);
    if (user.role === 'CITIZEN') {
      navigate('/citizen/home');
    } else if (user.role === 'ADMIN') {
      navigate('/admin/dashboard');
    } else {
      navigate('/government/dashboard');
    }
  };

  const citizenNavLinks = [
    { label: 'Home', path: '/citizen/home', icon: MapPin },
    { label: 'Risk Map', path: '/citizen/map', icon: Layers },
    { label: 'Talk to SEVA', path: '/citizen/voice', icon: Mic, highlight: true },
    { label: 'My Reports', path: '/citizen/reports', icon: FileText },
    { label: 'Profile', path: '/citizen/profile', icon: Users }
  ];

  const adminNavLinks = [
    { label: 'Apex Oversight', path: '/admin/dashboard', icon: Crown, highlight: true },
    { label: 'Triggered Records', path: '/government/triggered', icon: Flame, alertBadge: true },
    { label: 'AI Review', path: '/government/ai-review', icon: Bot },
    { label: 'AI Verification', path: '/government/ai-verification', icon: Eye },
    { label: 'All Complaints', path: '/government/complaints', icon: FileText },
    { label: 'Command Map', path: '/government/map', icon: MapPin },
    { label: 'Analytics', path: '/government/analytics', icon: BarChart3 }
  ];

  const govNavLinks = [
    { label: 'Dashboard', path: '/government/dashboard', icon: Activity },
    { label: 'Triggered Records', path: '/government/triggered', icon: Flame, alertBadge: true },
    { label: 'AI Review', path: '/government/ai-review', icon: Bot },
    { label: 'AI Verification', path: '/government/ai-verification', icon: Eye },
    { label: 'All Complaints', path: '/government/complaints', icon: FileText },
    { label: 'Command Map', path: '/government/map', icon: MapPin },
    { label: 'Analytics', path: '/government/analytics', icon: BarChart3 }
  ];

  const activeLinks = mode === 'citizen' 
    ? citizenNavLinks 
    : (currentUser.role === 'ADMIN' ? adminNavLinks : govNavLinks);

  const getBrandHome = () => {
    if (mode === 'citizen') return '/citizen/home';
    if (currentUser.role === 'ADMIN') return '/admin/dashboard';
    return '/government/dashboard';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        
        {/* Zone 1: Brand Title */}
        <div className="flex items-center gap-3 shrink-0">
          <Link 
            to={getBrandHome()} 
            className="flex items-center gap-2.5 group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-slate-950 font-black text-lg tracking-tighter shadow-md shadow-amber-500/20 group-hover:bg-amber-400 transition-colors">
              S
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight text-white leading-none flex items-center gap-1.5">
                SEVA
                <span className={`text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded border ${
                  mode === 'citizen' 
                    ? 'bg-amber-950/80 text-amber-300 border-amber-800/80' 
                    : currentUser.role === 'ADMIN'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                    : 'bg-blue-950/80 text-blue-300 border-blue-800/80'
                }`}>
                  {mode === 'citizen' ? 'Citizen' : (currentUser.role === 'ADMIN' ? 'Apex Head' : 'Officer')}
                </span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-tight mt-0.5">
                Report. Verify. Resolve.
              </span>
            </div>
          </Link>
        </div>

        {/* Zone 2: Navigation Links (single-line, 4-6 items with overflow protection) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2 shrink-0">
          {activeLinks.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/citizen/home' && item.path !== '/government/dashboard' && location.pathname.startsWith(item.path));
            const Icon = item.icon;

            if (item.highlight) {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors whitespace-nowrap shrink-0 shadow-sm shadow-amber-500/20"
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-amber-400 font-semibold'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${item.alertBadge ? 'text-rose-400' : ''}`} />
                <span>{item.label}</span>
                {item.alertBadge && (
                  <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Zone 3: Primary Actions (Role Switcher, Notifications, Mode Jump) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Quick Portal Switcher Button */}
          <Link
            to={mode === 'citizen' ? '/government/dashboard' : '/citizen/home'}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900/90 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white whitespace-nowrap shrink-0 transition-colors"
            title="Switch Portal"
          >
            {mode === 'citizen' ? (
              <>
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span>Gov Command</span>
              </>
            ) : (
              <>
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>Citizen View</span>
              </>
            )}
          </Link>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="relative rounded-md border border-slate-800 bg-slate-900 p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-slate-950">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-lg border border-slate-800 bg-slate-900 p-2 shadow-2xl z-50">
                <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Notifications ({unreadCount} unread)
                  </span>
                  <button
                    onClick={() => sevaStore.markAllNotificationsAsRead()}
                    className="text-[11px] text-amber-400 hover:underline"
                  >
                    Mark all read
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60 my-1">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          sevaStore.markNotificationAsRead(notif.id);
                          setShowNotifMenu(false);
                          if (notif.actionUrl) navigate(notif.actionUrl);
                        }}
                        className={`p-3 cursor-pointer hover:bg-slate-800/60 rounded-md transition-colors ${
                          !notif.read ? 'bg-slate-800/30' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className={`text-xs font-bold ${
                            notif.type === 'ALERT' ? 'text-rose-400' :
                            notif.type === 'WARNING' ? 'text-amber-400' :
                            notif.type === 'SUCCESS' ? 'text-emerald-400' : 'text-blue-400'
                          }`}>
                            {notif.title}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 shrink-0">
                            {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                          {notif.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Demo Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <img
                src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={currentUser.name}
                className="h-5 w-5 rounded-full object-cover border border-slate-700"
              />
              <span className="hidden sm:inline-block max-w-[110px] truncate font-medium">
                {currentUser.name}
              </span>
              <span className="text-[10px] font-mono text-amber-400 px-1 py-0.2 rounded bg-slate-800">
                {currentUser.role.replace('_', ' ')}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-72 rounded-lg border border-slate-800 bg-slate-900 p-2 shadow-2xl z-50">
                <div className="px-3 py-2 border-b border-slate-800">
                  <div className="text-xs font-bold text-white">{currentUser.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono truncate">{currentUser.email}</div>
                  <div className="mt-1 text-[10px] text-amber-400 font-mono">
                    Active Role: {currentUser.role} {currentUser.badgeNumber ? `(${currentUser.badgeNumber})` : ''}
                  </div>
                </div>

                <div className="py-1">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Switch Role Persona</span>
                    <span className="text-[9px] text-slate-600 font-mono">Scroll to explore</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto pr-1 space-y-1 divide-y divide-slate-800/40">
                    {allDemoUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleUserSelect(u)}
                        className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                          currentUser.id === u.id ? 'bg-slate-800 text-amber-400 font-semibold' : 'text-slate-300'
                        }`}
                      >
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="truncate font-medium">{u.name}</span>
                          <span className="text-[10px] text-slate-500 truncate">{u.departmentName || u.area || u.role}</span>
                        </div>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                          u.role === 'ADMIN' ? 'bg-amber-950 text-amber-400 border border-amber-900' :
                          u.role === 'DEPARTMENT_ADMIN' ? 'bg-purple-950 text-purple-400 border border-purple-900' :
                          u.role === 'OFFICER' ? 'bg-blue-950 text-blue-400 border border-blue-900' :
                          'bg-emerald-950 text-emerald-400 border border-emerald-900'
                        }`}>
                          {u.role === 'DEPARTMENT_ADMIN' ? 'DEPT HEAD' : u.role}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-2 px-1 space-y-1">
                  <button
                    onClick={() => {
                      setShowDevModal(true);
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded text-[11px] font-semibold text-amber-300 hover:bg-amber-950/40 border border-amber-800/40 flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <Bug className="w-3.5 h-3.5 text-amber-400" />
                      <span>Developer & QA Simulator</span>
                    </span>
                    <span className="text-[9px] font-mono bg-amber-950 text-amber-400 px-1 rounded">
                      HOT
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      sevaStore.resetToSeed();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-center px-3 py-1.5 rounded text-[11px] font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                  >
                    Reset Demo Database
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Developer & QA Settings Modal */}
      <DeveloperSettingsModal 
        isOpen={showDevModal} 
        onClose={() => setShowDevModal(false)} 
      />
    </header>
  );
};
