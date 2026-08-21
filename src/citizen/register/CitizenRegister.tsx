import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  auth, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  db, 
  doc, 
  setDoc, 
  isFirebaseConfigured 
} from '../../services/firebase';
import { sevaStore } from '../../services/store';
import { UserProfile } from '../../types';
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  MapPin, 
  Globe, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Building,
  ShieldCheck
} from 'lucide-react';

export const CitizenRegister: React.FC = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState<'en' | 'ta' | 'hi' | 'te'>('ta');
  const [address, setAddress] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fullName.trim() || !email.trim() || !mobileNumber.trim() || !password) {
      setErrorMsg('Please fill in all mandatory fields.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      let uid = `cit_${Date.now()}`;
      
      // Attempt Firebase Authentication if configured
      if (auth && isFirebaseConfigured()) {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
          if (userCredential.user) {
            uid = userCredential.user.uid;
            await updateProfile(userCredential.user, {
              displayName: fullName.trim()
            });
          }
        } catch (firebaseErr: any) {
          console.warn('Firebase Auth registration note:', firebaseErr);
          if (firebaseErr.code === 'auth/email-already-in-use') {
            setErrorMsg('This email address is already registered. Please login instead.');
            setIsLoading(false);
            return;
          }
          // Continue in resilient mode if network/demo fallback
        }
      }

      const newCitizen: UserProfile = {
        id: uid,
        name: fullName.trim(),
        email: email.trim(),
        phone: mobileNumber.startsWith('+91') ? mobileNumber.trim() : `+91 ${mobileNumber.trim()}`,
        role: 'CITIZEN',
        area: address.trim() || 'Madipakkam, Chennai',
        preferredLanguage: preferredLanguage,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fullName.trim())}`
      };

      // Write to Firestore if connected
      if (db && isFirebaseConfigured()) {
        try {
          const userDocRef = doc(db, 'users', uid);
          await setDoc(userDocRef, {
            uid,
            name: newCitizen.name,
            email: newCitizen.email,
            phone: newCitizen.phone,
            role: 'CITIZEN',
            area: newCitizen.area,
            preferredLanguage: newCitizen.preferredLanguage,
            avatarUrl: newCitizen.avatarUrl,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }, { merge: true });

          const citizenDocRef = doc(db, 'citizens', uid);
          await setDoc(citizenDocRef, {
            citizenId: uid,
            uid,
            name: newCitizen.name,
            email: newCitizen.email,
            phone: newCitizen.phone,
            address: address.trim(),
            preferredLanguage: newCitizen.preferredLanguage,
            totalReportsSubmitted: 0,
            activeReportsCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (fsErr) {
          console.warn('Firestore citizen record creation note:', fsErr);
        }
      }

      // Update SEVA Store
      sevaStore.setCurrentUser(newCitizen);
      setSuccessMsg('Account registered successfully! Redirecting to Citizen Portal...');
      
      setTimeout(() => {
        navigate('/citizen/home');
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
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
          SEVA Citizen Registration
        </h1>
        <p className="mt-1 text-xs text-slate-400 font-mono">
          Empowering Every Citizen • AI Grievance Intake & Verification
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-sm">
          
          {errorMsg && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-3.5 flex items-start gap-3 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3.5 flex items-start gap-3 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Sriram Venkatesan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 pl-10 pr-3.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 pl-10 pr-3.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mobile Number <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    placeholder="98401 23456"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 pl-10 pr-3.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 pl-10 pr-3.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Confirm Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 pl-10 pr-3.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Preferred Language
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
                  <select
                    value={preferredLanguage}
                    onChange={(e: any) => setPreferredLanguage(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 pl-10 pr-3.5 text-sm text-white focus:border-amber-500 focus:outline-none appearance-none"
                  >
                    <option value="ta">தமிழ் (Tamil)</option>
                    <option value="en">English</option>
                    <option value="hi">हिंदी (Hindi)</option>
                    <option value="te">తెలుగు (Telugu)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Residential Area / Locality
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="e.g. Madipakkam, Ward 168"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 pl-10 pr-3.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Creating Account...</span>
              ) : (
                <>
                  <span>CREATE CITIZEN ACCOUNT</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800/80 text-center">
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
              <Link to="/citizen/login" className="text-amber-400 font-semibold hover:underline">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
