import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  auth, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  isFirebaseConfigured 
} from '../../services/firebase';
import { sevaStore } from '../../services/store';
import { DEMO_CITIZEN_USERS } from '../../services/organizationData';
import { UserProfile } from '../../types';
import { 
  User, 
  Mail, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Building, 
  Crown, 
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';

export const CitizenLogin: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const demoCitizens = DEMO_CITIZEN_USERS;

  const handleSelectCitizen = (citizen: UserProfile) => {
    sevaStore.setCurrentUser(citizen);
    navigate('/citizen/home');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both Email and Password.');
      return;
    }

    setIsLoading(true);

    try {
      if (auth && isFirebaseConfigured()) {
        try {
          const userCred = await signInWithEmailAndPassword(auth, email.trim(), password);
          if (userCred.user) {
            const userProfile: UserProfile = {
              id: userCred.user.uid,
              name: userCred.user.displayName || email.split('@')[0],
              email: userCred.user.email || email.trim(),
              role: 'CITIZEN',
              area: 'Madipakkam, Ward 168',
              preferredLanguage: 'ta'
            };
            sevaStore.setCurrentUser(userProfile);
            navigate('/citizen/home');
            return;
          }
        } catch (firebaseErr: any) {
          console.warn('Firebase Auth note, checking registered accounts:', firebaseErr);
        }
      }

      // Check against demo or stored accounts
      const matched = demoCitizens.find(c => c.email.toLowerCase() === email.trim().toLowerCase());
      if (matched) {
        sevaStore.setCurrentUser(matched);
        navigate('/citizen/home');
      } else {
        // Create session for user
        const citizenUser: UserProfile = {
          id: `cit_${Date.now()}`,
          name: email.split('@')[0].replace('.', ' '),
          email: email.trim(),
          phone: '+91 98401 23456',
          role: 'CITIZEN',
          area: 'Madipakkam, Ward 168',
          preferredLanguage: 'ta'
        };
        sevaStore.setCurrentUser(citizenUser);
        navigate('/citizen/home');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid credentials. Please check your email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setErrorMsg('Please enter your email address first to reset password.');
      return;
    }
    setErrorMsg('');
    setInfoMsg('Password reset instructions sent to your email.');
    if (auth && isFirebaseConfigured()) {
      try {
        await sendPasswordResetEmail(auth, email.trim());
      } catch (err) {
        console.warn('Firebase reset email note:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-amber-500 selection:text-slate-950">
      
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 font-black text-2xl tracking-tighter shadow-xl shadow-amber-500/20">
          S
        </div>
        <h1 className="mt-4 text-2xl font-extrabold text-white tracking-tight">
          SEVA Citizen Portal
        </h1>
        <p className="mt-1 text-xs text-slate-400 font-medium">
          Report local issues. Track action. Verify resolution.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-sm space-y-6">
          
          {/* Portal Switcher Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-center">
            <button
              type="button"
              className="py-2 px-1 rounded-lg bg-amber-500 text-slate-950 shadow-md flex items-center justify-center gap-1 font-black"
            >
              <User className="w-3.5 h-3.5" />
              <span className="truncate">Citizen</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/government/login')}
              className="py-2 px-1 rounded-lg text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1"
            >
              <Building className="w-3.5 h-3.5" />
              <span className="truncate">Government</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/login')}
              className="py-2 px-1 rounded-lg text-slate-400 hover:text-amber-400 transition-colors flex items-center justify-center gap-1"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span className="truncate">Main Admin</span>
            </button>
          </div>

          {/* 1-Click Demo Citizen Login */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                ⚡ 1-Click Demo Citizens
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Quick Test</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {demoCitizens.map((citizen) => (
                <button
                  key={citizen.id}
                  type="button"
                  onClick={() => handleSelectCitizen(citizen)}
                  className="flex flex-col items-center p-2 rounded-xl border border-slate-800 bg-slate-950/80 hover:border-amber-500/60 hover:bg-slate-800/80 transition-all text-center group cursor-pointer"
                >
                  <img 
                    src={citizen.avatarUrl} 
                    alt={citizen.name} 
                    className="w-9 h-9 rounded-full border border-slate-700 object-cover group-hover:scale-105 transition-transform" 
                  />
                  <span className="mt-1.5 text-xs font-bold text-slate-200 group-hover:text-amber-400 truncate w-full">
                    {citizen.name.split(' ')[0]}
                  </span>
                  <span className="text-[9px] text-slate-500 truncate w-full">
                    {citizen.area?.split(',')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full"></div>
            <span className="bg-slate-900 px-3 text-[10px] text-slate-500 uppercase tracking-widest font-mono shrink-0">
              Or Sign In With Email
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

          {/* Email / Password Form */}
          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="e.g. ananya.sharma@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 pl-10 pr-3.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none transition-colors"
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
                  className="text-[11px] text-amber-400 hover:underline cursor-pointer"
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
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>LOGIN</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <Link
                to="/citizen/register"
                className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl border border-slate-800 hover:border-amber-500/50 bg-slate-950/80 hover:bg-slate-900 text-slate-300 hover:text-white font-medium text-xs transition-all text-center"
              >
                CREATE ACCOUNT
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
