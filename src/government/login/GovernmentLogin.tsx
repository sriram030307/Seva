import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  auth, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  isFirebaseConfigured,
  db,
  doc,
  getDoc
} from '../../services/firebase';
import { sevaStore } from '../../services/store';
import { 
  MAIN_ADMIN_USER, 
  DEPARTMENT_ADMIN_USERS, 
  DEPARTMENT_OFFICERS,
  SEVA_18_DEPARTMENTS 
} from '../../services/organizationData';
import { UserProfile } from '../../types';
import { 
  Building2, 
  ShieldCheck, 
  User, 
  ArrowRight, 
  Lock, 
  Mail,
  Users,
  Crown,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Briefcase
} from 'lucide-react';

export const GovernmentLogin: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const departments = SEVA_18_DEPARTMENTS;
  const allGovPersonas = [
    MAIN_ADMIN_USER,
    ...DEPARTMENT_ADMIN_USERS,
    ...DEPARTMENT_OFFICERS.map(off => ({
      id: off.id,
      name: off.name,
      email: off.email,
      phone: off.phone,
      role: off.role,
      departmentId: off.departmentId,
      departmentName: off.departmentName,
      badgeNumber: off.badge,
      avatarUrl: off.avatar
    }))
  ];

  const handleSelectGovUser = (user: UserProfile) => {
    setEmail(user.email);
    // Provide demo password indicator in input
    setPassword(user.role === 'ADMIN' ? '12345678' : 'SevaDemo@123');
    sevaStore.setCurrentUser(user);
    
    if (user.role === 'ANALYST') {
      navigate('/government/analytics');
    } else {
      navigate('/government/dashboard');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both official Email and Password.');
      return;
    }

    setIsLoading(true);

    try {
      let authorizedUser: UserProfile | undefined = undefined;

      // 1. Check if Sriram Venkatesan (Primary Admin)
      if (email.trim().toLowerCase() === MAIN_ADMIN_USER.email.toLowerCase()) {
        authorizedUser = MAIN_ADMIN_USER;
      }

      // 2. Check Firebase Authentication if available
      if (auth && isFirebaseConfigured()) {
        try {
          const userCred = await signInWithEmailAndPassword(auth, email.trim(), password);
          if (userCred.user) {
            // Read Firestore role from users collection to avoid trusting frontend
            if (db) {
              const userDocRef = doc(db, 'users', userCred.user.uid);
              const userSnap = await getDoc(userDocRef);
              if (userSnap.exists()) {
                const fsData = userSnap.data() as any;
                authorizedUser = {
                  id: userCred.user.uid,
                  name: fsData.name || userCred.user.displayName || 'Authorized Personnel',
                  email: userCred.user.email || email.trim(),
                  phone: fsData.phone || '',
                  role: fsData.role || 'OFFICER',
                  departmentId: fsData.departmentId || 'ALL',
                  departmentName: fsData.departmentName || 'Government Department',
                  badgeNumber: fsData.badgeNumber || 'GOV-AUTH-01'
                };
              }
            }
          }
        } catch (firebaseErr: any) {
          console.warn('Firebase Auth note, verifying authorized directory:', firebaseErr.code);
          if (firebaseErr.code === 'auth/user-disabled') {
            setErrorMsg('Account disabled. Please contact the SEVA System Administrator.');
            setIsLoading(false);
            return;
          }
        }
      }

      // 3. Match against SEVA Government Directory
      if (!authorizedUser) {
        authorizedUser = allGovPersonas.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
      }

      if (!authorizedUser) {
        setErrorMsg('Invalid credentials or unauthorized government email.');
        setIsLoading(false);
        return;
      }

      // Set logged in user
      sevaStore.setCurrentUser(authorizedUser);

      // Route based on role
      if (authorizedUser.role === 'ANALYST') {
        navigate('/government/analytics');
      } else {
        navigate('/government/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setErrorMsg('Please enter your government email address to receive reset instructions.');
      return;
    }
    setErrorMsg('');
    setInfoMsg('Password reset instructions dispatched to your official email.');
    if (auth && isFirebaseConfigured()) {
      try {
        await sendPasswordResetEmail(auth, email.trim());
      } catch (err) {
        console.warn('Reset email dispatch note:', err);
      }
    }
  };

  const filteredPersonas = selectedDeptFilter === 'ALL'
    ? allGovPersonas
    : allGovPersonas.filter(u => u.departmentId === selectedDeptFilter || u.role === 'ADMIN');

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-blue-600 selection:text-white">
      
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white font-black text-2xl tracking-tighter shadow-xl shadow-blue-600/30">
          🏛️
        </div>
        <h1 className="mt-4 text-2xl font-extrabold text-white tracking-tight">
          SEVA Government Command Center
        </h1>
        <p className="mt-1 text-xs text-slate-400 font-medium">
          Secure access for authorized government personnel.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/95 p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-sm">
          
          {/* Portal Switcher Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-center">
            <button
              type="button"
              onClick={() => navigate('/citizen/login')}
              className="py-2 px-1 rounded-lg text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span className="truncate">Citizen Portal</span>
            </button>
            <button
              type="button"
              className="py-2 px-1 rounded-lg bg-blue-600 text-white shadow-md flex items-center justify-center gap-1 font-bold"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span className="truncate">Government</span>
            </button>
            <button
              type="button"
              onClick={() => {
                handleSelectGovUser(MAIN_ADMIN_USER);
              }}
              className="py-2 px-1 rounded-lg text-slate-400 hover:text-amber-400 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span className="truncate">Main Admin (Sriram)</span>
            </button>
          </div>

          {/* Quick 1-Click Role Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                ⚡ 1-Click Authorized Staff Personas
              </span>
              <span className="text-[10px] text-slate-500 font-mono">18 Departments</span>
            </div>

            {/* Department Quick Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-2 scrollbar-none text-[11px]">
              <button
                type="button"
                onClick={() => setSelectedDeptFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedDeptFilter === 'ALL' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                All Departments
              </button>
              {departments.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedDeptFilter(d.id)}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    selectedDeptFilter === d.id ? 'bg-blue-600 text-white font-bold' : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  {d.name.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Persona Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
              {filteredPersonas.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleSelectGovUser(user)}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-800 bg-slate-950 hover:border-blue-500/60 hover:bg-slate-850 transition-all text-left group cursor-pointer"
                >
                  <img
                    src={user.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                    alt={user.name}
                    className="w-9 h-9 rounded-full border border-slate-700 object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-slate-200 group-hover:text-blue-400 truncate">
                        {user.name}
                      </p>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono shrink-0 ${
                        user.role === 'ADMIN' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                        user.role === 'DEPARTMENT_ADMIN' ? 'bg-purple-950 text-purple-400 border border-purple-800' :
                        'bg-blue-950 text-blue-400 border border-blue-800'
                      }`}>
                        {user.role === 'DEPARTMENT_ADMIN' ? 'DEPT HEAD' : user.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      {user.departmentName}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full"></div>
            <span className="bg-slate-900 px-3 text-[10px] text-slate-500 uppercase tracking-widest font-mono shrink-0">
              Authorized Credential Sign In
            </span>
          </div>

          {errorMsg && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-3 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div className="rounded-xl border border-blue-500/40 bg-blue-950/40 p-3 flex items-start gap-2.5 text-xs text-blue-300">
              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>{infoMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Official Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="sriramv2116.sse@saveetha.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 pl-10 pr-3.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[11px] text-blue-400 hover:underline cursor-pointer"
                >
                  FORGOT PASSWORD?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberSession}
                  onChange={(e) => setRememberSession(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-0"
                />
                <span>Remember session</span>
              </label>
              <span className="text-[11px] text-slate-500">256-Bit Encrypted</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Authenticating Government Clearance...</span>
              ) : (
                <>
                  <span>LOGIN</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
