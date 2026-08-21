import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sevaStore } from '../../services/store';
import { Complaint, ComplaintStatus } from '../../types';
import { StatusBadge, PriorityBadge, SlaBadge } from '../../components/common/StatusBadge';
import { 
  FileText, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Camera, 
  Search, 
  Mic, 
  ChevronRight,
  Filter,
  Layers
} from 'lucide-react';

export const CitizenReports: React.FC = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [tab, setTab] = useState<'ALL' | 'ACTION_REQUIRED' | 'ACTIVE' | 'RESOLVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const currentUser = sevaStore.getCurrentUser();

  const loadData = () => {
    const all = sevaStore.getComplaints();
    // Filter for current user's submitted reports + related reports
    setComplaints(all.filter(c => c.citizenId === currentUser.id));
  };

  useEffect(() => {
    loadData();
    const unsub = sevaStore.subscribe(loadData);
    return unsub;
  }, [currentUser.id]);

  const filteredComplaints = complaints.filter((c) => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchToken = c.token.toLowerCase().includes(q);
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchDept = c.departmentName.toLowerCase().includes(q);
      if (!matchToken && !matchTitle && !matchDept) return false;
    }

    // Tabs
    if (tab === 'ACTION_REQUIRED') {
      return c.status === 'AWAITING_CITIZEN_VERIFICATION' || c.status === 'AWAITING_CITIZEN_EVIDENCE';
    }
    if (tab === 'ACTIVE') {
      return c.status !== 'RESOLVED' && c.status !== 'CLOSED' && c.status !== 'REJECTED';
    }
    if (tab === 'RESOLVED') {
      return c.status === 'RESOLVED' || c.status === 'CLOSED';
    }
    return true;
  });

  const actionCount = complaints.filter(
    c => c.status === 'AWAITING_CITIZEN_VERIFICATION' || c.status === 'AWAITING_CITIZEN_EVIDENCE'
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 pb-16">
      
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              My Grievance Reports
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Track the live remediation status, inspection proof, and SLA targets of your reports.
            </p>
          </div>

          <button
            onClick={() => navigate('/citizen/voice')}
            className="px-4 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-md hover:bg-amber-400 shadow-md shadow-amber-500/20 flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Report New Issue</span>
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 space-y-6">
        
        {/* Search & Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Tab Navigation */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
            <button
              onClick={() => setTab('ALL')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                tab === 'ALL' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Reports ({complaints.length})
            </button>
            <button
              onClick={() => setTab('ACTION_REQUIRED')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                tab === 'ACTION_REQUIRED' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Action Required
              {actionCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                  {actionCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab('ACTIVE')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                tab === 'ACTIVE' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setTab('RESOLVED')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                tab === 'RESOLVED' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Resolved
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search token, category, or title..."
              className="w-full sm:w-64 rounded-md border border-slate-800 bg-slate-900 pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
            />
          </div>

        </div>

        {/* Complaints List */}
        {filteredComplaints.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400 space-y-3">
            <Layers className="mx-auto h-10 w-10 text-slate-600" />
            <h4 className="text-sm font-bold text-slate-200">No grievance reports found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {tab === 'ACTION_REQUIRED' 
                ? 'All your reports are in progress with field departments. No pending citizen action.' 
                : 'You have not submitted any reports matching this filter.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredComplaints.map((comp) => {
              const isActionRequired = comp.status === 'AWAITING_CITIZEN_VERIFICATION' || comp.status === 'AWAITING_CITIZEN_EVIDENCE';

              return (
                <div
                  key={comp.id}
                  onClick={() => navigate(`/citizen/reports/${comp.id}`)}
                  className={`rounded-xl border p-4 sm:p-5 cursor-pointer transition-all hover:border-amber-500/80 group ${
                    isActionRequired
                      ? 'border-amber-500/80 bg-amber-950/20'
                      : 'border-slate-800 bg-slate-900/70 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-amber-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                        {comp.token}
                      </span>
                      <PriorityBadge priority={comp.priority} size="sm" />
                      {comp.language && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                          {comp.language}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <SlaBadge slaStatus={comp.slaStatus} />
                      <StatusBadge status={comp.status} mode="citizen" size="sm" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                      {comp.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {comp.aiSummary || comp.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
                    <div className="flex items-center gap-4">
                      <span>📍 {comp.location.address || comp.location.area}</span>
                      <span>🏛️ {comp.departmentName}</span>
                    </div>

                    <div className="flex items-center gap-2 text-amber-400 font-semibold font-sans">
                      {isActionRequired && (
                        <span className="text-rose-400 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> ACTION REQUIRED &rarr;
                        </span>
                      )}
                      <span>View Tracker &rarr;</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

    </div>
  );
};
