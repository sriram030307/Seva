import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sevaStore } from '../../services/store';
import { UserProfile } from '../../types';
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Languages, 
  Award, 
  PhoneCall, 
  Building2,
  RefreshCw,
  LogOut
} from 'lucide-react';

export const CitizenProfile: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserProfile>(sevaStore.getCurrentUser());
  const [preferredLang, setPreferredLang] = useState(currentUser.preferredLanguage || 'ta');

  const complaints = sevaStore.getComplaints().filter(c => c.citizenId === currentUser.id);
  const resolvedCount = complaints.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED').length;
  const activeCount = complaints.filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED').length;

  const emergencyContacts = [
    { name: 'Greater Chennai Corporation (Grievance Cell)', number: '1913', desc: 'Roads, Garbage, Streetlights, Animals' },
    { name: 'TANGEDCO (Electricity Board Emergency)', number: '94987 94987', desc: 'Power Outages, Snapped Wires, Sparks' },
    { name: 'CMWSSB (Metro Water & Sewerage Board)', number: '044-45674567', desc: 'Water Contamination, Pipe Bursts, Sewage' },
    { name: 'Disaster Management & Flood Control Cell', number: '1077', desc: 'Severe Waterlogging, Tree Fall, Cyclones' },
    { name: 'State Police Emergency Helpline', number: '100 / 112', desc: 'Immediate Public Safety & Law' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 pb-16">
      
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={currentUser.name}
              className="h-12 w-12 rounded-full object-cover border-2 border-amber-500"
            />
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                {currentUser.name}
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  VERIFIED CITIZEN
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-mono">
                📍 {currentUser.area || 'Madipakkam, Chennai'} • {currentUser.email}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/citizen/login')}
            className="px-3 py-1.5 rounded border border-slate-800 bg-slate-900 text-xs font-medium text-slate-400 hover:text-white flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Switch Profile</span>
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 space-y-6">
        
        {/* Civic Impact Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center">
            <div className="text-2xl font-black text-white font-mono">{complaints.length}</div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider mt-1">Total Reports</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center">
            <div className="text-2xl font-black text-amber-400 font-mono">{activeCount}</div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider mt-1">In Progress</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center">
            <div className="text-2xl font-black text-emerald-400 font-mono">{resolvedCount}</div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider mt-1">Resolved & Verified</div>
          </div>
        </div>

        {/* Preferences & Settings */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Languages className="w-4 h-4 text-amber-400" />
            AI Voice Agent Preferred Language
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { code: 'ta', label: 'Tamil (தமிழ்)' },
              { code: 'en', label: 'English' },
              { code: 'hi', label: 'Hindi (हिंदी)' },
              { code: 'te', label: 'Telugu (తెలుగు)' }
            ].map((lang) => (
              <button
                key={lang.code}
                onClick={() => setPreferredLang(lang.code)}
                className={`p-3 rounded-lg border text-xs font-medium transition-all text-center ${
                  preferredLang === lang.code
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-bold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-900'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Emergency Civic Helplines Directory */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-amber-400" />
            24/7 Official Municipal Emergency Contacts (Chennai)
          </h3>

          <div className="divide-y divide-slate-800/80">
            {emergencyContacts.map((contact, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white">{contact.name}</div>
                  <div className="text-[11px] text-slate-400">{contact.desc}</div>
                </div>
                <span className="font-mono text-xs font-bold text-amber-400 px-3 py-1 rounded bg-slate-950 border border-slate-800 shrink-0">
                  📞 {contact.number}
                </span>
              </div>
            ))}
          </div>
        </div>

      </main>

    </div>
  );
};
