import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sevaStore } from '../../services/store';
import { Complaint, IssueCluster, Department } from '../../types';
import { StatusBadge, PriorityBadge, SlaBadge } from '../../components/common/StatusBadge';
import { SlaTrackerWidget } from '../components/SlaTrackerWidget';
import { 
  Flame, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Users, 
  Building2, 
  ArrowRight, 
  Activity, 
  TrendingUp, 
  ShieldAlert, 
  FileText, 
  Layers,
  MapPin,
  Sparkles,
  ExternalLink,
  Crown,
  Filter,
  CheckCircle,
  AlertOctagon,
  UserCheck,
  ShieldCheck
} from 'lucide-react';

export const GovernmentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [clusters, setClusters] = useState<IssueCluster[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('ALL');
  
  const currentUser = sevaStore.getCurrentUser();
  const isAdmin = currentUser.role === 'ADMIN';

  const loadData = () => {
    setComplaints(sevaStore.getComplaints());
    setClusters(sevaStore.getClusters());
    setDepartments(sevaStore.getDepartments());
  };

  useEffect(() => {
    loadData();
    const unsub = sevaStore.subscribe(loadData);
    return unsub;
  }, []);

  // Initialize selected dept from user if department admin
  useEffect(() => {
    if (currentUser.role === 'DEPARTMENT_ADMIN' && currentUser.departmentId) {
      setSelectedDeptId(currentUser.departmentId);
    }
  }, [currentUser]);

  // Filter complaints based on selected department
  const filteredComplaints = selectedDeptId === 'ALL'
    ? complaints
    : complaints.filter(c => c.departmentId === selectedDeptId);

  // Compute Granular KPIs
  const totalComplaints = filteredComplaints.length;
  const criticalCount = filteredComplaints.filter(c => c.priority === 'CRITICAL').length;
  const highCount = filteredComplaints.filter(c => c.priority === 'HIGH').length;
  
  const pendingCount = filteredComplaints.filter(c => 
    c.status === 'SUBMITTED' || 
    c.status === 'AWAITING_CITIZEN_EVIDENCE' || 
    c.status === 'VERIFIED'
  ).length;

  const inProgressCount = filteredComplaints.filter(c => 
    c.status === 'DISPATCHED' || 
    c.status === 'IN_PROGRESS' || 
    c.status === 'OFFICER_RESOLVED' ||
    c.status === 'RE_INSPECTED'
  ).length;

  const overdueCount = filteredComplaints.filter(c => 
    c.slaStatus === 'OVERDUE' && c.status !== 'RESOLVED' && c.status !== 'CLOSED'
  ).length;

  const escalatedCount = filteredComplaints.filter(c => 
    c.status === 'ESCALATED' || 
    c.status === 'RESOLUTION_REJECTED' || 
    c.escalationLevel !== 'NONE'
  ).length;

  const resolvedCount = filteredComplaints.filter(c => c.status === 'RESOLVED').length;
  const closedCount = filteredComplaints.filter(c => c.status === 'CLOSED').length;

  const totalActive = pendingCount + inProgressCount + overdueCount;
  const totalClosedOrResolved = resolvedCount + closedCount;

  const slaCompliancePercent = Math.round(
    ((Math.max(1, totalComplaints) - overdueCount) / Math.max(1, totalComplaints)) * 100
  );

  const officers = sevaStore.getOfficers();
  const totalOfficersCount = selectedDeptId === 'ALL'
    ? officers.length
    : officers.filter(o => o.departmentId === selectedDeptId).length;

  // Triggered High-Priority List
  const triggeredItems = filteredComplaints.filter(
    c => (c.priority === 'CRITICAL' || c.slaStatus === 'OVERDUE' || c.status === 'RESOLUTION_REJECTED' || c.status === 'ESCALATED') &&
         c.status !== 'RESOLVED' && c.status !== 'CLOSED'
  ).slice(0, 5);

  const recentComplaints = filteredComplaints.slice(0, 6);

  return (
    <div className="min-h-screen bg-slate-950 pb-16">
      
      {/* Top Banner */}
      <div className="border-b border-slate-800 bg-slate-900/80 px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-tight">
                Operations Command Center
              </h1>
              <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border ${
                isAdmin 
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold'
                  : 'bg-blue-950 text-blue-300 border-blue-800'
              }`}>
                {isAdmin ? 'ADMIN (Sriram Venkatesan)' : currentUser.role.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Live Civic Intelligence • 18 Government Departments • Real-Time SLA Monitoring
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => navigate('/government/triggered')}
              className="px-3 py-1.5 rounded-lg border border-rose-700/80 bg-rose-950/60 text-rose-300 text-xs font-bold flex items-center gap-2 hover:bg-rose-900 transition-colors shadow-lg shadow-rose-950/50 cursor-pointer"
            >
              <Flame className="w-4 h-4 text-rose-400 animate-pulse" />
              <span>{escalatedCount + criticalCount} Triggered</span>
            </button>

            <button
              onClick={() => navigate('/government/complaints')}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow-md cursor-pointer"
            >
              All Grievance Records &rarr;
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        
        {/* Department Switcher Bar */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <Filter className="w-4 h-4 text-amber-400" />
              <span>Department Scope:</span>
              <span className="text-amber-400 font-mono">
                {selectedDeptId === 'ALL' ? 'ALL DEPARTMENTS (18 Total)' : departments.find(d => d.id === selectedDeptId)?.name}
              </span>
            </div>

            {isAdmin && (
              <span className="text-[11px] text-amber-300/90 font-mono bg-amber-950/60 border border-amber-800/60 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
                ⚡ Primary Admin Full Oversight Access
              </span>
            )}
          </div>

          {/* Department Quick Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin text-xs">
            <button
              type="button"
              onClick={() => setSelectedDeptId('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedDeptId === 'ALL'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              ALL DEPARTMENTS ({departments.length})
            </button>

            {departments.map((dept) => {
              const isSelected = selectedDeptId === dept.id;
              return (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => setSelectedDeptId(dept.id)}
                  className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {dept.name.split(' ')[0]} ({complaints.filter(c => c.departmentId === dept.id).length})
                </button>
              );
            })}
          </div>
        </div>

        {/* 12 Granular KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          
          {/* Total Complaints */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">TOTAL COMPLAINTS</span>
              <FileText className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-xl font-black text-white font-mono">{totalComplaints}</div>
            <span className="text-[9px] text-slate-500 font-mono">Logged across scope</span>
          </div>

          {/* Critical */}
          <div className="rounded-xl border border-rose-900/60 bg-rose-950/25 p-3.5 space-y-1">
            <div className="flex items-center justify-between text-rose-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">CRITICAL</span>
              <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            </div>
            <div className="text-xl font-black text-rose-300 font-mono">{criticalCount}</div>
            <span className="text-[9px] text-rose-400/80 font-mono">Life-safety hazard</span>
          </div>

          {/* High Priority */}
          <div className="rounded-xl border border-amber-900/60 bg-amber-950/20 p-3.5 space-y-1">
            <div className="flex items-center justify-between text-amber-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">HIGH</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-black text-amber-300 font-mono">{highCount}</div>
            <span className="text-[9px] text-amber-500 font-mono">Urgent civic defects</span>
          </div>

          {/* Pending Verification */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">PENDING</span>
              <Clock className="w-3.5 h-3.5 text-yellow-400" />
            </div>
            <div className="text-xl font-black text-yellow-400 font-mono">{pendingCount}</div>
            <span className="text-[9px] text-slate-500 font-mono">Awaiting dispatch</span>
          </div>

          {/* In Progress */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">IN PROGRESS</span>
              <Activity className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="text-xl font-black text-sky-400 font-mono">{inProgressCount}</div>
            <span className="text-[9px] text-slate-500 font-mono">Field works active</span>
          </div>

          {/* Overdue / SLA Breached */}
          <div className="rounded-xl border border-red-900/80 bg-red-950/30 p-3.5 space-y-1">
            <div className="flex items-center justify-between text-red-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">OVERDUE</span>
              <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
            </div>
            <div className="text-xl font-black text-red-400 font-mono">{overdueCount}</div>
            <span className="text-[9px] text-red-400/80 font-mono">Breached SLA timer</span>
          </div>

          {/* Escalated */}
          <div className="rounded-xl border border-purple-900/80 bg-purple-950/30 p-3.5 space-y-1">
            <div className="flex items-center justify-between text-purple-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">ESCALATED</span>
              <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-xl font-black text-purple-300 font-mono">{escalatedCount}</div>
            <span className="text-[9px] text-purple-400/80 font-mono">Supervisor review</span>
          </div>

          {/* Resolved */}
          <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/20 p-3.5 space-y-1">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">RESOLVED</span>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-black text-emerald-400 font-mono">{resolvedCount}</div>
            <span className="text-[9px] text-emerald-500 font-mono">Citizen confirmed</span>
          </div>

          {/* Closed */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">CLOSED</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-xl font-black text-slate-300 font-mono">{closedCount}</div>
            <span className="text-[9px] text-slate-500 font-mono">Archived lifecycle</span>
          </div>

          {/* Total Departments */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">DEPARTMENTS</span>
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-xl font-black text-white font-mono">{departments.length}</div>
            <span className="text-[9px] text-slate-500 font-mono">Configured bodies</span>
          </div>

          {/* Total Officers */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">OFFICERS</span>
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-xl font-black text-blue-400 font-mono">{totalOfficersCount}</div>
            <span className="text-[9px] text-slate-500 font-mono">Field ward personnel</span>
          </div>

          {/* SLA Compliance */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">SLA COMPLIANCE</span>
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-black text-amber-400 font-mono">{slaCompliancePercent}%</div>
            <span className="text-[9px] text-slate-500 font-mono">Target: &gt;90%</span>
          </div>

        </div>

        {/* Live SLA Countdown & Velocity Engine Widget */}
        <SlaTrackerWidget />

        {/* Emergency / Triggered Attention Queue */}
        <div className="rounded-xl border border-rose-800/60 bg-slate-900/70 p-4 sm:p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Emergency & Escalation Queue ({triggeredItems.length})
              </h2>
            </div>
            <button
              onClick={() => navigate('/government/triggered')}
              className="text-xs text-rose-400 hover:underline font-medium cursor-pointer"
            >
              View all triggered records &rarr;
            </button>
          </div>

          {triggeredItems.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500">
              No critical or overdue triggers in the current department scope.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {triggeredItems.map((comp) => (
                <div
                  key={comp.id}
                  onClick={() => navigate(`/government/complaints/${comp.id}`)}
                  className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-800/40 px-2 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {comp.token}
                      </span>
                      <PriorityBadge priority={comp.priority} size="sm" />
                      {comp.status === 'RESOLUTION_REJECTED' && (
                        <span className="text-[10px] font-bold bg-rose-950 text-rose-300 px-2 py-0.5 rounded border border-rose-700">
                          CITIZEN REJECTED PROOF
                        </span>
                      )}
                      {comp.slaStatus === 'OVERDUE' && (
                        <span className="text-[10px] font-bold bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-700">
                          SLA BREACHED
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-white">{comp.title}</h4>
                    <div className="text-[11px] text-slate-400 font-mono flex items-center gap-3">
                      <span>📍 {comp.location.address || comp.location.area}</span>
                      <span>🏛️ {comp.departmentName}</span>
                      <span>👤 Officer: {comp.assignedOfficerName || 'UNASSIGNED'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded cursor-pointer">
                      Inspect & Dispatch &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 18 Departments Breakdown Matrix (Visible on ALL DEPARTMENTS) */}
        {selectedDeptId === 'ALL' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                18 Department Oversight Matrix
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">Click to filter dashboard</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {departments.map((dept) => {
                const deptComplaints = complaints.filter(c => c.departmentId === dept.id);
                const deptActive = deptComplaints.filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED').length;
                const deptResolved = deptComplaints.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED').length;

                return (
                  <div
                    key={dept.id}
                    onClick={() => setSelectedDeptId(dept.id)}
                    className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 hover:border-amber-500/60 cursor-pointer transition-all space-y-2 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-blue-400 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">
                        {dept.code}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">
                        {dept.slaComplianceRate || 92}%
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white line-clamp-1">{dept.name}</h4>

                    <div className="grid grid-cols-2 gap-1 pt-1.5 border-t border-slate-800/80 text-center">
                      <div className="rounded bg-slate-950 p-1 border border-slate-800">
                        <div className="text-xs font-mono font-bold text-amber-400">{deptActive}</div>
                        <div className="text-[8px] text-slate-500 uppercase">Active</div>
                      </div>
                      <div className="rounded bg-slate-950 p-1 border border-slate-800">
                        <div className="text-xs font-mono font-bold text-emerald-400">{deptResolved}</div>
                        <div className="text-[8px] text-slate-500 uppercase">Resolved</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Live Incoming Grievance Feed */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              Live Incoming Grievance Feed ({recentComplaints.length})
            </h3>
            <button
              onClick={() => navigate('/government/complaints')}
              className="text-xs text-blue-400 hover:underline cursor-pointer"
            >
              View Data Grid &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentComplaints.map((comp) => (
              <div
                key={comp.id}
                onClick={() => navigate(`/government/complaints/${comp.id}`)}
                className="rounded-lg border border-slate-800 bg-slate-950 p-3.5 hover:border-slate-700 cursor-pointer transition-all space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-amber-400">
                      {comp.token}
                    </span>
                    <PriorityBadge priority={comp.priority} size="sm" />
                  </div>
                  <h5 className="text-xs font-bold text-white line-clamp-1">{comp.title}</h5>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{comp.aiSummary || comp.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>📍 {comp.location.area}</span>
                  <StatusBadge status={comp.status} mode="government" size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>

    </div>
  );
};
