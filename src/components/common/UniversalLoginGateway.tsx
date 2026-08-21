import React from 'react';
import { useNavigate } from 'react-router-dom';
import { sevaStore } from '../../services/store';
import { 
  User, 
  Building2, 
  Crown, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  MapPin, 
  Activity, 
  Layers,
  Flame,
  CheckCircle2
} from 'lucide-react';

export const UniversalLoginGateway: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-amber-500 selection:text-slate-950">
      
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center space-y-3">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 font-black text-3xl tracking-tighter shadow-2xl shadow-amber-500/20 ring-4 ring-amber-500/20">
          S
        </div>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            SEVA Civic Intelligence Platform
          </h1>
          <p className="mt-1 text-sm text-slate-400 font-mono">
            Single-Door Unified Authentication Gateway
          </p>
        </div>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Choose your authorization role to enter your designated operational environment.
        </p>
      </div>

      {/* 3 Dedicated Authentication Portal Cards */}
      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Portal 1: Citizen Portal */}
        <div 
          onClick={() => navigate('/citizen/login')}
          className="rounded-2xl border-2 border-amber-500/40 bg-slate-900/90 p-6 flex flex-col justify-between cursor-pointer hover:border-amber-400 hover:bg-slate-900 transition-all group shadow-xl hover:-translate-y-1"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20">
                <User className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 uppercase">
                Citizen Flow
              </span>
            </div>

            <div>
              <h2 className="text-lg font-black text-white group-hover:text-amber-400 transition-colors">
                Citizen Portal
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Voice-guided grievance reporting in Tamil/English, live map tracking, and resolution photo verification.
              </p>
            </div>

            <ul className="space-y-1.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Phone OTP verification</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Multi-lingual voice AI report</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Citizen approval & escalation</span>
              </li>
            </ul>
          </div>

          <button 
            className="mt-6 w-full py-2.5 px-4 rounded-xl bg-amber-500 group-hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md uppercase tracking-wider"
          >
            <span>Citizen Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Portal 2: Officer & Field Specialist */}
        <div 
          onClick={() => navigate('/government/login')}
          className="rounded-2xl border-2 border-blue-500/40 bg-slate-900/90 p-6 flex flex-col justify-between cursor-pointer hover:border-blue-400 hover:bg-slate-900 transition-all group shadow-xl hover:-translate-y-1"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white font-black shadow-lg shadow-blue-600/20">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 uppercase">
                Officer Flow
              </span>
            </div>

            <div>
              <h2 className="text-lg font-black text-white group-hover:text-blue-400 transition-colors">
                Government Officer
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Department field specialists, zonal supervisors, and triage engineers for road, water, power, and sanitation.
              </p>
            </div>

            <ul className="space-y-1.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Department badge & role login</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Field evidence & AI verification</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>SLA countdown & reminders</span>
              </li>
            </ul>
          </div>

          <button 
            className="mt-6 w-full py-2.5 px-4 rounded-xl bg-blue-600 group-hover:bg-blue-500 text-white font-black text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md uppercase tracking-wider"
          >
            <span>Officer Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Portal 3: Super Admin / Main Head */}
        <div 
          onClick={() => navigate('/admin/login')}
          className="rounded-2xl border-2 border-amber-400/80 bg-gradient-to-b from-slate-900 via-amber-950/20 to-slate-950 p-6 flex flex-col justify-between cursor-pointer hover:border-amber-300 hover:shadow-amber-500/20 transition-all group shadow-2xl hover:-translate-y-1"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/30">
                <Crown className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-amber-500 text-slate-950 uppercase tracking-widest">
                Main Head
              </span>
            </div>

            <div>
              <h2 className="text-lg font-black text-white group-hover:text-amber-300 transition-colors">
                Super Admin Portal
              </h2>
              <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
                Municipal Commissioner & Chief Administrator oversight with global escalation monitoring.
              </p>
            </div>

            <ul className="space-y-1.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Global escalation matrix monitoring</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Prolonged complaint interventions</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Automated SLA Cloud Function feed</span>
              </li>
            </ul>
          </div>

          <button 
            className="mt-6 w-full py-2.5 px-4 rounded-xl bg-amber-500 group-hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 uppercase tracking-wider"
          >
            <span>Chief Admin Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      <div className="mt-8 text-center text-[11px] text-slate-500 font-mono">
        Greater Chennai Corporation • Automated Civic Resolution Engine
      </div>
    </div>
  );
};
