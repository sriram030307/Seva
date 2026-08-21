import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { MapPin, Layers, Mic, FileText, User } from 'lucide-react';

export const CitizenLayout: React.FC = () => {
  const location = useLocation();

  const mobileNavItems = [
    { label: 'Home', path: '/citizen/home', icon: MapPin },
    { label: 'Map', path: '/citizen/map', icon: Layers },
    { label: 'SEVA Voice', path: '/citizen/voice', icon: Mic, highlight: true },
    { label: 'Reports', path: '/citizen/reports', icon: FileText },
    { label: 'Profile', path: '/citizen/profile', icon: User }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      <Navbar mode="citizen" />
      
      <div className="flex-1">
        <Outlet />
      </div>

      {/* Mobile Bottom Quick-Access Dock */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-slate-950/95 backdrop-blur-md px-2 py-1.5 flex items-center justify-around">
        {mobileNavItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/citizen/home' && location.pathname.startsWith(item.path));
          const Icon = item.icon;

          if (item.highlight) {
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative -top-3 flex flex-col items-center justify-center p-2 rounded-full bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/40"
              >
                <Icon className="w-5 h-5" />
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-md text-[10px] font-medium transition-colors ${
                isActive ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
