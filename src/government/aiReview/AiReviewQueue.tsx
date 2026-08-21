import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, 
  ShieldAlert, 
  CheckCircle2, 
  Edit3, 
  RefreshCw, 
  ArrowRight, 
  MapPin, 
  AlertTriangle, 
  Building2, 
  Clock, 
  Search,
  Filter,
  Check,
  X,
  FileCheck
} from 'lucide-react';
import { sevaStore } from '../../services/store';
import { Complaint, UserProfile } from '../../types';

export const AiReviewQueue: React.FC = () => {
  const navigate = useNavigate();
  const complaints = sevaStore.getComplaints();
  const departments = sevaStore.getDepartments();
  const currentUser = sevaStore.getCurrentUser();

  const [filterType, setFilterType] = useState<'ALL' | 'LOW_CONFIDENCE' | 'CRITICAL' | 'DISPUTED' | 'LOCATION_UNCERTAIN'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Find cases requiring human review
  const reviewCases = complaints.filter((c) => {
    const isLowConfidence = c.confidenceScore < 85;
    const isCritical = c.priority === 'CRITICAL';
    const isDisputed = c.status === 'RESOLUTION_REJECTED' || c.escalationLevel !== 'NONE';
    const isLocationUncertain = !c.location.address || c.location.address.includes('Unknown') || c.location.address.includes('Ward');

    if (filterType === 'LOW_CONFIDENCE') return isLowConfidence;
    if (filterType === 'CRITICAL') return isCritical;
    if (filterType === 'DISPUTED') return isDisputed;
    if (filterType === 'LOCATION_UNCERTAIN') return isLocationUncertain;

    return isLowConfidence || isCritical || isDisputed || isLocationUncertain;
  }).filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.token.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.departmentName.toLowerCase().includes(q) ||
      c.location.area.toLowerCase().includes(q)
    );
  });

  const handleApprove = (c: Complaint) => {
    sevaStore.updateComplaintStatus(c.id, c.assignedOfficerId ? 'IN_PROGRESS' : 'ASSIGNED');
    sevaStore.logAuditAction({
      userId: currentUser.id,
      userName: currentUser.name,
      role: currentUser.role,
      action: 'AI_REVIEW_APPROVED',
      entityType: 'COMPLAINT',
      entityId: c.id,
      details: `Officer approved AI classification for ticket ${c.token} with confidence ${c.confidenceScore}%.`
    });
    setActionSuccessMsg(`Approved ticket ${c.token}. Status transitioned to active queue.`);
    setTimeout(() => setActionSuccessMsg(''), 4000);
    setSelectedComplaint(null);
  };

  const handleReassign = (c: Complaint, targetDeptId: string) => {
    const dept = departments.find((d) => d.id === targetDeptId);
    if (!dept) return;

    sevaStore.updateComplaintDepartment(c.id, dept.id, dept.name);
    sevaStore.logAuditAction({
      userId: currentUser.id,
      userName: currentUser.name,
      role: currentUser.role,
      action: 'AI_CLASSIFICATION_OVERRIDDEN',
      entityType: 'COMPLAINT',
      entityId: c.id,
      details: `Officer re-routed ticket ${c.token} from ${c.departmentName} to ${dept.name}. Reason: ${editNotes || 'Manual department adjustment'}.`
    });
    setActionSuccessMsg(`Reassigned ticket ${c.token} to ${dept.name}.`);
    setTimeout(() => setActionSuccessMsg(''), 4000);
    setSelectedComplaint(null);
    setEditNotes('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                Human-in-the-Loop AI Review Queue
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                  {reviewCases.length} Pending
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Inspect AI classifications with low confidence, safety escalations, or citizen disputes before final dispatch
              </p>
            </div>
          </div>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Review Cases' },
            { id: 'LOW_CONFIDENCE', label: 'Low AI Confidence (<85%)' },
            { id: 'CRITICAL', label: 'Critical Safety Flags' },
            { id: 'DISPUTED', label: 'Citizen Disputes' },
            { id: 'LOCATION_UNCERTAIN', label: 'Location Ambiguity' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                filterType === tab.id
                  ? 'bg-purple-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by token, area, title..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Cases Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {reviewCases.map((c) => {
          const isSelected = selectedComplaint?.id === c.id;
          return (
            <div
              key={c.id}
              className={`p-5 rounded-2xl border transition-all ${
                isSelected 
                  ? 'border-purple-500 bg-slate-900 shadow-xl' 
                  : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
              }`}
            >
              {/* Header Badge Row */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-purple-400 bg-purple-950 px-2 py-0.5 rounded border border-purple-900">
                    {c.token}
                  </span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    c.priority === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-900' :
                    c.priority === 'HIGH' ? 'bg-amber-950 text-amber-300 border border-amber-900' :
                    'bg-blue-950 text-blue-300 border border-blue-900'
                  }`}>
                    {c.priority}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{new Date(c.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {/* Title & Description */}
              <h3 className="text-sm font-bold text-white mb-1">{c.title}</h3>
              <p className="text-xs text-slate-400 line-clamp-2 mb-3">{c.description}</p>

              {/* AI Trust Telemetry Bar */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Bot className="w-3.5 h-3.5 text-purple-400" />
                    AI Model Confidence
                  </span>
                  <span className={`font-mono font-bold ${
                    c.confidenceScore >= 90 ? 'text-emerald-400' :
                    c.confidenceScore >= 75 ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {c.confidenceScore}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-900">
                  <div>
                    <span className="text-slate-500">Department:</span>
                    <p className="font-semibold text-slate-300 truncate">{c.departmentName}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Citizen Intent:</span>
                    <p className="font-semibold text-slate-300 truncate">{c.category} • {c.subcategory}</p>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1 border-t border-slate-900">
                  <MapPin className="w-3 h-3 text-purple-400 shrink-0" />
                  <span className="truncate">{c.location.address || c.location.area}, {c.location.city}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
                <button
                  onClick={() => {
                    setSelectedComplaint(isSelected ? null : c);
                    setSelectedDeptId(c.departmentId);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs text-slate-300 flex items-center gap-1.5 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                  <span>{isSelected ? 'Close Reassign' : 'Edit / Reassign'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/government/complaints/${c.id}`)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors"
                  >
                    Inspect Ticket
                  </button>
                  <button
                    onClick={() => handleApprove(c)}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1 shadow-md transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve AI Classification</span>
                  </button>
                </div>
              </div>

              {/* Expandable Reassignment Panel */}
              {isSelected && (
                <div className="mt-4 pt-4 border-t border-purple-500/30 space-y-3 bg-purple-950/20 p-3 rounded-xl">
                  <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Reassign Municipal Department & Priority</span>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Target Department</label>
                    <select
                      value={selectedDeptId}
                      onChange={(e) => setSelectedDeptId(e.target.value)}
                      className="w-full rounded-lg bg-slate-900 border border-slate-700 text-xs text-white px-2.5 py-1.5 focus:border-purple-500 focus:outline-none"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code}) — SLA: {d.defaultSlaHours}h
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Override Audit Notes</label>
                    <input
                      type="text"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Reason for manual reassignment..."
                      className="w-full rounded-lg bg-slate-900 border border-slate-700 text-xs text-white px-2.5 py-1.5 placeholder:text-slate-600 focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setSelectedComplaint(null)}
                      className="px-3 py-1 rounded-lg text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleReassign(c, selectedDeptId)}
                      className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow"
                    >
                      Confirm Reassignment & Log
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {reviewCases.length === 0 && (
          <div className="col-span-full p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/40">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">All AI Classifications Verified</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              No cases currently require human review. All incoming voice grievances meet high confidence and safety thresholds.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
