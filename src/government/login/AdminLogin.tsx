import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sevaStore } from '../../services/store';
import { MAIN_ADMIN_USER } from '../../services/organizationData';
import { UserProfile } from '../../types';
import { 
  Crown, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight, 
  Building2, 
  Users, 
  KeyRound, 
  FileCheck,
  AlertTriangle,
  Lock,
  Mail
} from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('sriramv2116.sse@saveetha.com');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSelectAdmin = (user: UserProfile) => {
    sevaStore.setCurrentUser(user);
    navigate('/government/dashboard');
  };

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMsg('Please enter your administrator security password.');
      return;
    }
    
    // Set Sriram Venkatesan as Main Admin
    sevaStore.setCurrentUser(MAIN_ADMIN_USER);
    navigate('/government/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-amber-500 selection:text-slate-950">
      
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-slate-950 font-black shadow-2xl shadow-amber-500/30 ring-4 ring-amber-500/20">
          <Crown className="w-9 h-9" />
        </div>
        <h1 className="mt-4 text-2xl font-black text-white tracking-tight">
          SEVA Chief Administrator Command
        </h1>
        <p className="mt-1 text-xs text-amber-400 font-mono font-semibold">
          Apex Executive Command • Multi-Department Oversight & Executive Sanctions
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6 sm:p-8 shadow-2xl space-y-6">
          
          {/* Portal Switcher Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-center">
            <button
              type="button"
              onClick={() => navigate('/citizen/login')}
              className="py-2 px-1 rounded-lg text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="truncate">Citizen</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/government/login')}
              className="py-2 px-1 rounded-lg text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span className="truncate">Officer</span>
            </button>
            <button
              type="button"
              className="py-2 px-1 rounded-lg bg-amber-500 text-slate-950 shadow-md flex items-center justify-center gap-1 font-bold"
            >
              <Crown className="w-3.5 h-3.5" />
              <span className="truncate">Main Admin</span>
            </button>
          </div>

          {/* 1-Click Primary Admin Card */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5" />
              Primary Administrator Account
            </span>

            <button
              type="button"
              onClick={() => handleSelectAdmin(MAIN_ADMIN_USER)}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-amber-500/60 bg-amber-950/20 hover:bg-amber-950/40 hover:border-amber-400 transition-all text-left group cursor-pointer shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={MAIN_ADMIN_USER.avatarUrl}
                    alt={MAIN_ADMIN_USER.name}
                    className="w-12 h-12 rounded-xl border-2 border-amber-500 object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 rounded-full p-0.5">
                    <Crown className="w-3 h-3" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm text-white group-hover:text-amber-400 transition-colors">
                      {MAIN_ADMIN_USER.name}
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                      ADMIN
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    {MAIN_ADMIN_USER.email}
                  </p>
                  <p className="text-[11px] text-amber-300/80 mt-0.5 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    Access: ALL DEPARTMENTS
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
                <span>Enter</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full"></div>
            <span className="bg-slate-900 px-3 text-[10px] text-slate-500 uppercase tracking-widest font-mono shrink-0">
              Or Administrator Password Login
            </span>
          </div>

          {errorMsg && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-3 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleCustomLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Administrator Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 pl-10 pr-3.5 text-sm text-white focus:border-amber-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Passkey / Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 pl-10 pr-3.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <span>ACCESS COMMAND OVERVIEW</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
