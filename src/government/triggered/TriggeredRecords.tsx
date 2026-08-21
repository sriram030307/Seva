import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sevaStore } from '../../services/store';
import { Complaint, PriorityLevel } from '../../types';
import { StatusBadge, PriorityBadge, SlaBadge } from '../../components/common/StatusBadge';
import { 
  Flame, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  XCircle, 
  Filter, 
  UserCheck, 
  ArrowRight,
  Search,
  CheckSquare,
  Building2,
  MapPin
} from 'lucide-react';

export const TriggeredRecords: React.FC = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filterType, setFilterType] = useState<'ALL' | 'CRITICAL' | 'SLA_BREACH' | 'CITIZEN_REJECTED' | 'CLUSTERS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [targetOfficerId, setTargetOfficerId] = useState('');

  const officers = sevaStore.getAllDemoUsers().filter(u => u.role === 'OFFICER' || u.role === 'DEPARTMENT_ADMIN' || u.role === 'SUPERVISOR');

  const loadData = () => {
    setComplaints(sevaStore.getComplaints());
  };

  useEffect(() => {
    loadData();
    const unsub = sevaStore.subscribe(loadData);
    return unsub;
  }, []);

  // Filter triggered records
  const triggeredComplaints = complaints.filter((c) => {
    const isCritical = c.priority === 'CRITICAL';
    const isSlaBreach = c.slaStatus === 'OVERDUE' || c.slaStatus === 'DUE_SOON';
    const isCitizenRejected = c.status === 'RESOLUTION_REJECTED' || c.status === 'ESCALATED';
    const isCluster = c.relatedReportCount > 2;

    const isTriggered = (isCritical || isSlaBreach || isCitizenRejected || isCluster) &&
      c.status !== 'RESOLVED' && c.status !== 'CLOSED';

    if (!isTriggered) return false;

    if (filterType === 'CRITICAL' && !isCritical) return false;
    if (filterType === 'SLA_BREACH' && !isSlaBreach) return false;
    if (filterType === 'CITIZEN_REJECTED' && !isCitizenRejected) return false;
    if (filterType === 'CLUSTERS' && !isCluster) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!c.token.toLowerCase().includes(q) && !c.title.toLowerCase().includes(q) && !c.location.area.toLowerCase().includes(q)) {
        return false;
      }
    }

    return true;
  });

  const handleSelectAll = () => {
    if (selectedIds.length === triggeredComplaints.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(triggeredComplaints.map(c => c.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetOfficerId || selectedIds.length === 0) return;

    selectedIds.forEach((id) => {
      sevaStore.assignOfficer(id, targetOfficerId);
    });

    setSelectedIds([]);
    setShowAssignModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-16">
      
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-500 text-white font-bold animate-pulse">
                <Flame className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-black text-white tracking-tight">
                Triggered & Escalated Records Management
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              High-priority queue: Safety hazards, SLA breaches, citizen contested resolutions & hotspot clusters.
            </p>
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-amber-400 font-bold">
                {selectedIds.length} Selected
              </span>
              <button
                onClick={() => setShowAssignModal(true)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Bulk Reassign / Dispatch</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        
        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded font-medium transition-colors ${
                filterType === 'ALL' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Triggered ({triggeredComplaints.length})
            </button>
            <button
              onClick={() => setFilterType('CRITICAL')}
              className={`px-3 py-1.5 rounded font-medium transition-colors ${
                filterType === 'CRITICAL' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              🔴 Safety Critical
            </button>
            <button
              onClick={() => setFilterType('CITIZEN_REJECTED')}
              className={`px-3 py-1.5 rounded font-medium transition-colors ${
                filterType === 'CITIZEN_REJECTED' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              ❌ Citizen Contested
            </button>
            <button
              onClick={() => setFilterType('SLA_BREACH')}
              className={`px-3 py-1.5 rounded font-medium transition-colors ${
                filterType === 'SLA_BREACH' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              ⏱️ SLA Breaches
            </button>
            <button
              onClick={() => setFilterType('CLUSTERS')}
              className={`px-3 py-1.5 rounded font-medium transition-colors ${
                filterType === 'CLUSTERS' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              👥 Multi-Citizen Clusters
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search token, area, or issue..."
              className="w-full sm:w-64 rounded-md border border-slate-800 bg-slate-900 pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

        </div>

        {/* Data Table */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-950 font-mono text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.length > 0 && selectedIds.length === triggeredComplaints.length}
                      onChange={handleSelectAll}
                      className="rounded border-slate-700 bg-slate-900"
                    />
                  </th>
                  <th className="p-3">Ticket Token</th>
                  <th className="p-3">Issue & Trigger Cause</th>
                  <th className="p-3">Location / Area</th>
                  <th className="p-3">Assigned Officer</th>
                  <th className="p-3">SLA Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {triggeredComplaints.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No triggered records matching this criteria.
                    </td>
                  </tr>
                ) : (
                  triggeredComplaints.map((comp) => {
                    const isSelected = selectedIds.includes(comp.id);
                    return (
                      <tr
                        key={comp.id}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          isSelected ? 'bg-slate-800/30' : ''
                        }`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(comp.id)}
                            className="rounded border-slate-700 bg-slate-900"
                          />
                        </td>
                        <td className="p-3 font-mono font-bold text-amber-400 whitespace-nowrap">
                          {comp.token}
                          <div className="mt-0.5">
                            <PriorityBadge priority={comp.priority} size="sm" />
                          </div>
                        </td>
                        <td className="p-3 max-w-sm">
                          <div className="font-bold text-white line-clamp-1">{comp.title}</div>
                          <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{comp.aiSummary}</div>
                          
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {comp.priority === 'CRITICAL' && (
                              <span className="text-[10px] font-bold bg-rose-950 text-rose-300 px-1.5 py-0.2 rounded border border-rose-700">
                                🔴 CRITICAL SAFETY
                              </span>
                            )}
                            {comp.status === 'RESOLUTION_REJECTED' && (
                              <span className="text-[10px] font-bold bg-rose-950 text-rose-300 px-1.5 py-0.2 rounded border border-rose-700">
                                ❌ CONTESTED BY CITIZEN
                              </span>
                            )}
                            {comp.slaStatus === 'OVERDUE' && (
                              <span className="text-[10px] font-bold bg-amber-950 text-amber-300 px-1.5 py-0.2 rounded border border-amber-700">
                                ⏱️ SLA BREACH
                              </span>
                            )}
                            {comp.relatedReportCount > 2 && (
                              <span className="text-[10px] font-bold bg-purple-950 text-purple-300 px-1.5 py-0.2 rounded border border-purple-700">
                                👥 {comp.relatedReportCount} CITIZEN REPORTS
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                          <div>📍 {comp.location.area}</div>
                          <div className="text-slate-500 text-[10px]">{comp.departmentName.split('(')[0]}</div>
                        </td>
                        <td className="p-3 font-mono text-[11px] whitespace-nowrap">
                          {comp.assignedOfficerName ? (
                            <span className="text-slate-200 font-bold">{comp.assignedOfficerName}</span>
                          ) : (
                            <span className="text-rose-400 font-bold">UNASSIGNED</span>
                          )}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <SlaBadge slaStatus={comp.slaStatus} />
                          <div className="mt-1">
                            <StatusBadge status={comp.status} mode="government" size="sm" />
                          </div>
                        </td>
                        <td className="p-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => navigate(`/government/complaints/${comp.id}`)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded shadow transition-colors"
                          >
                            Resolve &rarr;
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* Bulk Reassign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-400" />
                Bulk Reassign {selectedIds.length} Grievance Records
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBulkAssign} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Select Field Officer / Specialist Engineer
                </label>
                <select
                  value={targetOfficerId}
                  onChange={(e) => setTargetOfficerId(e.target.value)}
                  className="w-full rounded border border-slate-800 bg-slate-950 p-2 text-xs text-white"
                  required
                >
                  <option value="">Choose an officer...</option>
                  {officers.map((off) => (
                    <option key={off.id} value={off.id}>
                      {off.name} — {off.departmentName} ({off.badgeNumber || 'Officer'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded"
                >
                  Dispatch to Selected Officer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
