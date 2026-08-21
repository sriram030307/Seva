import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { sevaStore } from '../../services/store';
import { Complaint, Department, CivicCategory, ComplaintStatus, PriorityLevel } from '../../types';
import { StatusBadge, PriorityBadge } from '../../components/common/StatusBadge';
import { SlaCountdownBadge } from '../components/SlaCountdownBadge';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Building2,
  RefreshCw,
  ExternalLink,
  MapPin,
  Clock,
  Flame,
  Crown,
  AlertTriangle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export const ComplaintList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentUser = sevaStore.getCurrentUser();
  const isAdmin = currentUser.role === 'ADMIN';

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Filter States
  const [quickTab, setQuickTab] = useState<'ALL' | 'OVERDUE' | 'MAIN_HEAD_ESCALATED' | 'CRITICAL' | 'AWAITING_VERIFICATION'>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>(searchParams.get('dept') || 'ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 12;

  const loadData = () => {
    setComplaints(sevaStore.getComplaints());
    setDepartments(sevaStore.getDepartments());
  };

  useEffect(() => {
    loadData();
    const unsub = sevaStore.subscribe(loadData);
    return unsub;
  }, []);

  // Quick stats calculation
  const stats = {
    total: complaints.length,
    active: complaints.filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED').length,
    overdue: complaints.filter(c => c.slaStatus === 'OVERDUE' && c.status !== 'RESOLVED' && c.status !== 'CLOSED').length,
    escalatedToMainHead: complaints.filter(c => c.escalatedToMainHead || (c.prolongedDays && c.prolongedDays >= 3)).length,
    critical: complaints.filter(c => c.priority === 'CRITICAL' && c.status !== 'RESOLVED' && c.status !== 'CLOSED').length,
  };

  const filteredComplaints = complaints.filter((c) => {
    // Quick Tab filter
    if (quickTab === 'OVERDUE') {
      if (c.slaStatus !== 'OVERDUE' || c.status === 'RESOLVED' || c.status === 'CLOSED') return false;
    } else if (quickTab === 'MAIN_HEAD_ESCALATED') {
      if (!c.escalatedToMainHead && (!c.prolongedDays || c.prolongedDays < 3)) return false;
    } else if (quickTab === 'CRITICAL') {
      if (c.priority !== 'CRITICAL' || c.status === 'RESOLVED' || c.status === 'CLOSED') return false;
    } else if (quickTab === 'AWAITING_VERIFICATION') {
      if (c.status !== 'AWAITING_CITIZEN_VERIFICATION' && c.status !== 'RESOLUTION_REJECTED') return false;
    }

    if (selectedDept !== 'ALL' && c.departmentId !== selectedDept) return false;
    if (selectedCategory !== 'ALL' && c.category !== selectedCategory) return false;
    if (selectedStatus !== 'ALL' && c.status !== selectedStatus) return false;
    if (selectedPriority !== 'ALL' && c.priority !== selectedPriority) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchToken = c.token.toLowerCase().includes(q);
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchArea = c.location.area.toLowerCase().includes(q);
      const matchOfficer = (c.assignedOfficerName || '').toLowerCase().includes(q);
      const matchReason = (c.citizenEscalationReason || '').toLowerCase().includes(q);
      if (!matchToken && !matchTitle && !matchArea && !matchOfficer && !matchReason) return false;
    }

    return true;
  });

  const totalPages = Math.ceil(filteredComplaints.length / pageSize) || 1;
  const paginatedComplaints = filteredComplaints.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExportCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      ["Token,Title,Category,Priority,Status,Area,Department,Officer,SLA,EscalatedToMainHead"]
        .concat(filteredComplaints.map(c => 
          `"${c.token}","${c.title.replace(/"/g, '""')}","${c.category}","${c.priority}","${c.status}","${c.location.area}","${c.departmentName}","${c.assignedOfficerName || 'Unassigned'}","${c.slaStatus}","${c.escalatedToMainHead ? 'YES' : 'NO'}"`
        )).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SEVA_Grievance_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-16">
      
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Municipal Grievance Data Grid & SLA Command
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprehensive registry of citizen complaints with real-time SLA countdowns, officer assignments, and Main Head escalation tracking.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 text-xs font-semibold hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-4">
        
        {/* Quick Filter Tabs */}
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => { setQuickTab('ALL'); setCurrentPage(1); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
              quickTab === 'ALL'
                ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span>All Grievances</span>
            <span className="px-1.5 py-0.2 rounded bg-slate-950 text-[10px]">{stats.total}</span>
          </button>

          <button
            onClick={() => { setQuickTab('OVERDUE'); setCurrentPage(1); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
              quickTab === 'OVERDUE'
                ? 'bg-rose-600 border-rose-500 text-white shadow-md'
                : 'bg-slate-900 border-slate-800 text-rose-400 hover:bg-rose-950/30'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>SLA Breached (Overdue)</span>
            <span className="px-1.5 py-0.2 rounded bg-slate-950 text-[10px] text-rose-400 font-mono font-bold">
              {stats.overdue}
            </span>
          </button>

          <button
            onClick={() => { setQuickTab('MAIN_HEAD_ESCALATED'); setCurrentPage(1); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
              quickTab === 'MAIN_HEAD_ESCALATED'
                ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-md font-black'
                : 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-amber-950/30'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>👑 Prolonged & Escalated to Main Head</span>
            <span className="px-1.5 py-0.2 rounded bg-slate-950 text-[10px] text-amber-400 font-mono font-bold">
              {stats.escalatedToMainHead}
            </span>
          </button>

          <button
            onClick={() => { setQuickTab('CRITICAL'); setCurrentPage(1); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
              quickTab === 'CRITICAL'
                ? 'bg-amber-600 border-amber-500 text-white shadow-md'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Critical Priority</span>
            <span className="px-1.5 py-0.2 rounded bg-slate-950 text-[10px]">{stats.critical}</span>
          </button>

          <button
            onClick={() => { setQuickTab('AWAITING_VERIFICATION'); setCurrentPage(1); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
              quickTab === 'AWAITING_VERIFICATION'
                ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Citizen Audit / Verification</span>
          </button>
        </div>

        {/* Filters Bar */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3 shadow-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
            
            {/* Search Input */}
            <div className="relative md:col-span-2">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search token, keyword, officer, or area..."
                className="w-full rounded-md border border-slate-800 bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Department Select */}
            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-md border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-blue-500 font-medium"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Priority Select */}
            <select
              value={selectedPriority}
              onChange={(e) => {
                setSelectedPriority(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-md border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-blue-500 font-medium"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            {/* Status Select */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-md border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-blue-500 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">New</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="AI_VERIFICATION">AI Verification</option>
              <option value="AWAITING_CITIZEN_VERIFICATION">Awaiting Citizen Verification</option>
              <option value="RESOLUTION_REJECTED">Resolution Rejected</option>
              <option value="RESOLVED">Resolved</option>
            </select>

          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-1">
            <span>Found <strong>{filteredComplaints.length}</strong> matching records</span>
            {(selectedDept !== 'ALL' || selectedPriority !== 'ALL' || selectedStatus !== 'ALL' || searchQuery || quickTab !== 'ALL') && (
              <button
                onClick={() => {
                  setSelectedDept('ALL');
                  setSelectedPriority('ALL');
                  setSelectedStatus('ALL');
                  setQuickTab('ALL');
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="text-blue-400 hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-950 font-mono text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="p-3">Token & Priority</th>
                  <th className="p-3">Grievance Summary</th>
                  <th className="p-3">Location & Dept</th>
                  <th className="p-3">Field Officer</th>
                  <th className="p-3">Live SLA Countdown</th>
                  <th className="p-3">Workflow Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedComplaints.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No complaints match the specified filters.
                    </td>
                  </tr>
                ) : (
                  paginatedComplaints.map((comp) => (
                    <tr
                      key={comp.id}
                      onClick={() => navigate(`/government/complaints/${comp.id}`)}
                      className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                        comp.escalatedToMainHead ? 'bg-amber-950/15' : comp.slaStatus === 'OVERDUE' ? 'bg-rose-950/10' : ''
                      }`}
                    >
                      <td className="p-3 font-mono font-bold text-amber-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{comp.token}</span>
                          {comp.escalatedToMainHead && (
                            <span title="Citizen Escalated to Main Head" className="text-amber-400 text-xs">👑</span>
                          )}
                        </div>
                        <div className="mt-1">
                          <PriorityBadge priority={comp.priority} size="sm" />
                        </div>
                      </td>
                      
                      <td className="p-3 max-w-xs">
                        <div className="font-bold text-white line-clamp-1">{comp.title}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{comp.aiSummary || comp.description}</div>
                        
                        {comp.escalatedToMainHead && (
                          <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono">
                            <span>👑 Escalated to Chief Admin</span>
                          </div>
                        )}

                        <div className="text-[10px] font-mono text-slate-500 mt-1">
                          Reported: {new Date(comp.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="p-3 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                        <div>📍 {comp.location.area}</div>
                        <div className="text-slate-500 text-[10px]">{comp.departmentName.split('(')[0]}</div>
                      </td>

                      <td className="p-3 font-mono text-[11px] whitespace-nowrap">
                        {comp.assignedOfficerName ? (
                          <div>
                            <span className="text-slate-200 font-bold">{comp.assignedOfficerName}</span>
                            <div className="text-slate-500 text-[10px]">{comp.assignedOfficerBadge || 'Officer'}</div>
                          </div>
                        ) : (
                          <span className="text-rose-400 font-bold">UNASSIGNED</span>
                        )}
                      </td>

                      {/* Live SLA Countdown Widget Column */}
                      <td className="p-3 whitespace-nowrap">
                        <SlaCountdownBadge complaint={comp} />
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <StatusBadge status={comp.status} mode="government" size="sm" />
                      </td>

                      <td className="p-3 text-right whitespace-nowrap">
                        <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded shadow transition-colors">
                          Manage &rarr;
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950 px-4 py-3 text-xs">
              <span className="text-slate-400 font-mono">
                Page {currentPage} of {totalPages} ({filteredComplaints.length} records)
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="rounded border border-slate-800 bg-slate-900 p-1.5 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {Array.from({ length: totalPages }).map((_, idx) => {
                  const p = idx + 1;
                  if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
                    return (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`px-2.5 py-1 rounded font-mono text-xs ${
                          currentPage === p
                            ? 'bg-blue-600 text-white font-bold'
                            : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  }
                  if (p === currentPage - 2 || p === currentPage + 2) {
                    return <span key={p} className="text-slate-600 px-1">...</span>;
                  }
                  return null;
                })}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded border border-slate-800 bg-slate-900 p-1.5 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

      </main>

    </div>
  );
};
