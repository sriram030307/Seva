import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sevaStore } from '../../services/store';
import { firebaseCloudFunctionsService, CloudFunctionExecutionLog } from '../../services/firebaseCloudFunctionsService';
import { Complaint, Department, IssueCluster, UserProfile } from '../../types';
import { StatusBadge, PriorityBadge } from '../../components/common/StatusBadge';
import { SlaCountdownBadge } from '../components/SlaCountdownBadge';
import { 
  Crown, 
  ShieldAlert, 
  Flame, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Building2, 
  Users, 
  Activity, 
  TrendingUp, 
  Zap, 
  Scale, 
  FileText, 
  Layers, 
  MapPin, 
  Send, 
  FastForward, 
  RefreshCw, 
  Server, 
  Terminal, 
  ArrowRight,
  Sparkles,
  Search,
  Filter,
  Check
} from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserProfile>(sevaStore.getCurrentUser());
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [clusters, setClusters] = useState<IssueCluster[]>([]);
  const [cloudLogs, setCloudLogs] = useState<CloudFunctionExecutionLog[]>([]);
  const [isCloudRunning, setIsCloudRunning] = useState(false);

  // Executive Mandate Modal State
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showMandateModal, setShowMandateModal] = useState(false);
  const [mandateType, setMandateType] = useState<'DIRECT_OVERRIDE_SANCTION' | 'DEPARTMENT_INQUEST' | 'INTER_DEPT_REROUTE' | 'RAPID_DISPATCH'>('DIRECT_OVERRIDE_SANCTION');
  const [mandateNote, setMandateNote] = useState('');
  const [mandateReassignDept, setMandateReassignDept] = useState('dept-road');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Escalation Queue Filter
  const [escalationTab, setEscalationTab] = useState<'ALL' | 'CITIZEN_ESCALATED' | 'SLA_BREACHED' | 'CRITICAL_RISK' | 'CONTESTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = () => {
    setCurrentUser(sevaStore.getCurrentUser());
    setComplaints(sevaStore.getComplaints());
    setDepartments(sevaStore.getDepartments());
    setClusters(sevaStore.getClusters());
    setCloudLogs(firebaseCloudFunctionsService.getExecutionLogs());
  };

  useEffect(() => {
    loadData();
    const unsubStore = sevaStore.subscribe(loadData);
    const unsubCloud = firebaseCloudFunctionsService.subscribe(() => {
      setCloudLogs(firebaseCloudFunctionsService.getExecutionLogs());
    });
    return () => {
      unsubStore();
      unsubCloud();
    };
  }, []);

  // Compute Global Escalation Metrics
  const totalActive = complaints.filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED').length;
  const overdueBreaches = complaints.filter(c => c.slaStatus === 'OVERDUE' && c.status !== 'RESOLVED' && c.status !== 'CLOSED');
  const citizenEscalatedList = complaints.filter(c => c.escalatedToMainHead && c.status !== 'RESOLVED' && c.status !== 'CLOSED');
  const criticalRiskList = complaints.filter(c => c.priority === 'CRITICAL' && c.status !== 'RESOLVED' && c.status !== 'CLOSED');
  const contestedList = complaints.filter(c => (c.status === 'RESOLUTION_REJECTED' || c.status === 'ESCALATED') && c.status !== 'RESOLVED');

  const totalEscalations = overdueBreaches.length + citizenEscalatedList.length + criticalRiskList.length + contestedList.length;
  const globalSlaCompliance = Math.round(
    ((complaints.length - overdueBreaches.length) / Math.max(1, complaints.length)) * 100
  );

  // Filter Escalation Queue
  const filteredEscalations = complaints.filter(c => {
    if (c.status === 'RESOLVED' || c.status === 'CLOSED') return false;

    if (escalationTab === 'CITIZEN_ESCALATED') {
      if (!c.escalatedToMainHead) return false;
    } else if (escalationTab === 'SLA_BREACHED') {
      if (c.slaStatus !== 'OVERDUE') return false;
    } else if (escalationTab === 'CRITICAL_RISK') {
      if (c.priority !== 'CRITICAL') return false;
    } else if (escalationTab === 'CONTESTED') {
      if (c.status !== 'RESOLUTION_REJECTED' && c.status !== 'ESCALATED') return false;
    } else {
      // ALL Escalations: include anything that is overdue, citizen escalated, critical, or contested
      const isEscalated = c.escalatedToMainHead || c.slaStatus === 'OVERDUE' || c.priority === 'CRITICAL' || c.status === 'RESOLUTION_REJECTED' || (c.prolongedDays && c.prolongedDays >= 2);
      if (!isEscalated) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchToken = c.token.toLowerCase().includes(q);
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchDept = c.departmentName.toLowerCase().includes(q);
      const matchArea = c.location.area.toLowerCase().includes(q);
      if (!matchToken && !matchTitle && !matchDept && !matchArea) return false;
    }

    return true;
  });

  const handleRunCloudFunction = () => {
    setIsCloudRunning(true);
    setTimeout(() => {
      const log = firebaseCloudFunctionsService.executeSlaWatchdog('MANUAL_OVERRIDE');
      setIsCloudRunning(false);
      setToastMessage(`⚡ Firebase Cloud Function Watchdog executed! Scanned ${log.scannedCount} active records. ${log.breachedCount} breaches alerted to Supervisors & Admin.`);
      setTimeout(() => setToastMessage(null), 5000);
    }, 600);
  };

  const handleOpenMandateModal = (comp: Complaint) => {
    setSelectedComplaint(comp);
    setMandateNote('');
    setShowMandateModal(true);
  };

  const handleExecuteMandate = () => {
    if (!selectedComplaint) return;
    sevaStore.adminExecuteActionOnProlongedComplaint(selectedComplaint.id, {
      actionType: mandateType,
      note: mandateNote || 'Direct executive decree issued by Chief Administrator.',
      reassignDeptId: mandateType === 'INTER_DEPT_REROUTE' ? mandateReassignDept : undefined
    });
    setShowMandateModal(false);
    setSelectedComplaint(null);
    setToastMessage(`👑 Executive Order Issued on ${selectedComplaint.token}: Enforced 24h remediation mandate dispatched.`);
    setTimeout(() => setToastMessage(null), 4500);
    loadData();
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-20 selection:bg-amber-500 selection:text-slate-950">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 left-4 sm:left-auto sm:w-[480px] z-50 bg-slate-900 border-2 border-amber-500 text-amber-200 text-xs font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="leading-snug">{toastMessage}</span>
        </div>
      )}

      {/* Super Admin Apex Command Header */}
      <div className="border-b border-amber-500/30 bg-gradient-to-r from-slate-950 via-amber-950/20 to-slate-950 px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-7xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-slate-950 font-black shadow-xl shadow-amber-500/20 ring-2 ring-amber-400">
              <Crown className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white tracking-tight">
                  State Civic Administration & Apex Oversight Command
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black uppercase tracking-wider">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-amber-300 font-mono mt-0.5 flex items-center gap-2">
                <span>Officer: <strong>K. Rajasekaran, IAS</strong> (Municipal Commissioner)</span>
                <span>•</span>
                <span className="text-slate-400">Clearance: IAS-2018-TN-042</span>
              </p>
            </div>
          </div>

          {/* Quick Command Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleRunCloudFunction}
              disabled={isCloudRunning}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-amber-500/60 hover:border-amber-400 hover:bg-slate-800 text-amber-300 text-xs font-bold shadow-lg flex items-center gap-2 transition-all"
              title="Manually trigger Firebase Cloud Function SLA Watchdog"
            >
              <Terminal className={`w-4 h-4 text-amber-400 ${isCloudRunning ? 'animate-spin' : ''}`} />
              <span>{isCloudRunning ? 'Executing Watchdog...' : '⚡ Run Cloud Function Watchdog'}</span>
            </button>

            <button
              onClick={() => navigate('/government/complaints')}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 flex items-center gap-1.5 uppercase transition-all"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>All Civic Complaints</span>
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        
        {/* Top Global Escalation KPI Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          
          {/* Card 1: Citizen Direct Escalations */}
          <div 
            onClick={() => setEscalationTab('CITIZEN_ESCALATED')}
            className={`rounded-2xl border p-4 cursor-pointer transition-all ${
              escalationTab === 'CITIZEN_ESCALATED' 
                ? 'border-amber-400 bg-amber-950/40 shadow-lg shadow-amber-500/20 ring-1 ring-amber-400' 
                : 'border-amber-500/40 bg-slate-900/80 hover:bg-amber-950/20'
            }`}
          >
            <div className="flex items-center justify-between text-amber-400 mb-1">
              <span className="text-[11px] font-mono font-black uppercase tracking-wider">Citizen Appeals</span>
              <Crown className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-black text-amber-300 font-mono">
              {citizenEscalatedList.length}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Escalated to Main Head</span>
          </div>

          {/* Card 2: SLA Breached Overdue */}
          <div 
            onClick={() => setEscalationTab('SLA_BREACHED')}
            className={`rounded-2xl border p-4 cursor-pointer transition-all ${
              escalationTab === 'SLA_BREACHED' 
                ? 'border-rose-400 bg-rose-950/40 shadow-lg shadow-rose-500/20 ring-1 ring-rose-400' 
                : 'border-rose-800/80 bg-rose-950/20 hover:bg-rose-950/30'
            }`}
          >
            <div className="flex items-center justify-between text-rose-400 mb-1">
              <span className="text-[11px] font-mono font-black uppercase tracking-wider">SLA Breaches</span>
              <Flame className="w-4 h-4 text-rose-400 animate-pulse" />
            </div>
            <div className="text-3xl font-black text-rose-300 font-mono">
              {overdueBreaches.length}
            </div>
            <span className="text-[10px] text-rose-400/80 font-mono">Past deadline timestamp</span>
          </div>

          {/* Card 3: Critical Infrastructure Risk */}
          <div 
            onClick={() => setEscalationTab('CRITICAL_RISK')}
            className={`rounded-2xl border p-4 cursor-pointer transition-all ${
              escalationTab === 'CRITICAL_RISK' 
                ? 'border-orange-400 bg-orange-950/40 shadow-lg ring-1 ring-orange-400' 
                : 'border-slate-800 bg-slate-900/80 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-orange-400 mb-1">
              <span className="text-[11px] font-mono font-black uppercase tracking-wider">Critical Risks</span>
              <AlertTriangle className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-3xl font-black text-orange-300 font-mono">
              {criticalRiskList.length}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Safety hazard rating</span>
          </div>

          {/* Card 4: Citizen Contested Resolutions */}
          <div 
            onClick={() => setEscalationTab('CONTESTED')}
            className={`rounded-2xl border p-4 cursor-pointer transition-all ${
              escalationTab === 'CONTESTED' 
                ? 'border-amber-400 bg-amber-950/40 shadow-lg ring-1 ring-amber-400' 
                : 'border-slate-800 bg-slate-900/80 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-mono font-black uppercase tracking-wider">Contested Proof</span>
              <ShieldAlert className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">
              {contestedList.length}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Citizen rejected fix</span>
          </div>

          {/* Card 5: City SLA Compliance */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-mono font-black uppercase tracking-wider">SLA Compliance</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-emerald-400 font-mono">
              {globalSlaCompliance}%
            </div>
            <span className="text-[10px] text-slate-500 font-mono">{totalActive} total active cases</span>
          </div>

        </div>

        {/* Two-Column Command Layout: Global Escalation Queue + Department Accountability Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Global Escalation Monitoring & Executive Intervention Queue (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-2xl border border-amber-500/40 bg-slate-900/70 p-5 shadow-2xl space-y-4">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <h2 className="text-sm font-black text-white uppercase tracking-wider">
                      Global Escalation Queue & Intervention Console
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      City-wide grievances requiring Chief Administrator oversight, executive sanctions, or re-assignment.
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-md bg-amber-950 text-amber-300 border border-amber-800 text-xs font-mono font-bold">
                  {filteredEscalations.length} Active Records
                </span>
              </div>

              {/* Filter Tabs & Search */}
              <div className="space-y-2.5">
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { key: 'ALL', label: 'All Escalations', count: totalEscalations },
                    { key: 'CITIZEN_ESCALATED', label: '👑 Citizen Appeals', count: citizenEscalatedList.length },
                    { key: 'SLA_BREACHED', label: '🚨 Overdue SLA', count: overdueBreaches.length },
                    { key: 'CRITICAL_RISK', label: '⚠️ Critical Hazards', count: criticalRiskList.length },
                    { key: 'CONTESTED', label: 'Contested Proof', count: contestedList.length },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setEscalationTab(tab.key as any)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        escalationTab === tab.key
                          ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-900 text-[10px] font-mono">
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search escalation queue by token, citizen issue, or area..."
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Escalation Cards List */}
              <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                {filteredEscalations.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 rounded-xl border border-dashed border-slate-800">
                    No grievances currently match this escalation filter.
                  </div>
                ) : (
                  filteredEscalations.map((comp) => (
                    <div
                      key={comp.id}
                      className={`rounded-xl border p-4 transition-all ${
                        comp.escalatedToMainHead
                          ? 'border-amber-500/80 bg-amber-950/20 shadow-lg'
                          : comp.slaStatus === 'OVERDUE'
                          ? 'border-rose-800/80 bg-rose-950/15'
                          : 'border-slate-800 bg-slate-950/90'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black text-amber-400">
                              {comp.token}
                            </span>
                            <PriorityBadge priority={comp.priority} size="sm" />
                            {comp.escalatedToMainHead && (
                              <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-amber-500 text-slate-950 font-black">
                                👑 Main Head Escalated
                              </span>
                            )}
                          </div>
                          <h3 className="text-xs font-bold text-white line-clamp-1">
                            {comp.title}
                          </h3>
                        </div>

                        {/* Live SLA Badge */}
                        <SlaCountdownBadge complaint={comp} showDetails={false} />
                      </div>

                      <p className="text-xs text-slate-300 line-clamp-2 mb-3 bg-slate-950/60 p-2 rounded border border-slate-800/60">
                        {comp.aiSummary || comp.description}
                      </p>

                      {/* Citizen Escalation Reason if present */}
                      {comp.citizenEscalationReason && (
                        <div className="mb-3 text-[11px] text-amber-300 font-mono bg-amber-950/40 p-2 rounded border border-amber-800/40">
                          <strong>Citizen Appeal Reason:</strong> "{comp.citizenEscalationReason}"
                        </div>
                      )}

                      {/* Executive Action Taken Tag if already executed */}
                      {comp.adminActionTaken && (
                        <div className="mb-3 text-[11px] text-emerald-300 font-mono bg-emerald-950/40 p-2 rounded border border-emerald-800/40 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span><strong>Mandate Issued:</strong> [{comp.adminActionTaken.actionType}] {comp.adminActionTaken.note}</span>
                        </div>
                      )}

                      {/* Footer Info & Action Button */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
                        <div>
                          <span>📍 {comp.location.area}</span> • <span className="text-slate-300">{comp.departmentName.split('(')[0]}</span>
                          {comp.assignedOfficerName && (
                            <span className="text-slate-500"> • Officer: {comp.assignedOfficerName}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => navigate(`/government/complaints/${comp.id}`)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs"
                          >
                            Details &rarr;
                          </button>

                          <button
                            onClick={() => handleOpenMandateModal(comp)}
                            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 text-xs font-black shadow-md flex items-center gap-1 uppercase"
                          >
                            <Crown className="w-3.5 h-3.5" />
                            <span>Executive Mandate</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          </div>

          {/* Right Column: Department Accountability Leaderboard & Firebase Cloud Watchdog Console (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Department Performance & SLA Compliance Leaderboard */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    Department SLA Compliance & Backlog
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Official Bureau Index</span>
              </div>

              <div className="space-y-2.5">
                {departments.map((dept) => {
                  const deptComplaints = complaints.filter(c => c.departmentId === dept.id);
                  const deptActive = deptComplaints.filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED').length;
                  const deptOverdue = deptComplaints.filter(c => c.slaStatus === 'OVERDUE' && c.status !== 'RESOLVED' && c.status !== 'CLOSED').length;
                  const compliance = deptComplaints.length > 0
                    ? Math.round(((deptComplaints.length - deptOverdue) / deptComplaints.length) * 100)
                    : 100;

                  return (
                    <div 
                      key={dept.id}
                      className="p-3 rounded-xl border border-slate-800 bg-slate-950/80 hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{dept.name.split('(')[0]}</span>
                          {deptOverdue > 0 && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-950 text-rose-400 border border-rose-800 font-bold">
                              {deptOverdue} Overdue
                            </span>
                          )}
                        </div>
                        <span className={`text-xs font-mono font-black ${
                          compliance >= 80 ? 'text-emerald-400' : compliance >= 60 ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {compliance}% SLA
                        </span>
                      </div>

                      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden mb-2">
                        <div 
                          className={`h-full ${
                            compliance >= 80 ? 'bg-emerald-500' : compliance >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${compliance}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>Active: {deptActive} cases</span>
                        <span>Assigned Crew: {dept.officerCount}</span>
                        <button
                          onClick={() => navigate(`/government/complaints?dept=${dept.id}`)}
                          className="text-blue-400 hover:underline"
                        >
                          Audit Dept &rarr;
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Firebase Cloud Function Watchdog Stream & Log Console */}
            <div className="rounded-2xl border border-blue-500/40 bg-slate-900/70 p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-blue-400" />
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">
                      Firebase Cloud Function Watchdog Feed
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      checkSlaBreachWatchdogCron (Node.js 18)
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleRunCloudFunction}
                  disabled={isCloudRunning}
                  className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold transition-all flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isCloudRunning ? 'animate-spin' : ''}`} />
                  <span>Scan Now</span>
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto font-mono text-xs pr-1">
                {cloudLogs.length === 0 ? (
                  <div className="text-slate-500 py-4 text-center">No execution telemetry yet.</div>
                ) : (
                  cloudLogs.map((log) => (
                    <div 
                      key={log.id} 
                      className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/90 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className={`font-bold ${log.status === 'WARNING' ? 'text-amber-400' : 'text-emerald-400'}`}>
                          [{log.triggerType}] {log.functionName}
                        </span>
                        <span className="text-slate-500">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        {log.details}
                      </p>
                      {log.notificationsDispatched && log.notificationsDispatched.length > 0 && (
                        <div className="pt-1 text-[10px] text-blue-300 space-y-0.5 border-t border-slate-900">
                          {log.notificationsDispatched.slice(0, 2).map((n, i) => (
                            <div key={i} className="truncate">
                              ⚡ Alerted: <strong>{n.role}</strong> ({n.target}) - {n.title}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-800/40 text-[10px] text-blue-300 font-mono leading-relaxed">
                ℹ️ <strong>Cloud Function Trigger Policy:</strong> Scans active tickets where status remains 'OPEN', 'NEW', or 'ASSIGNED' past <code>slaDeadline</code>. Dispatches instant push alerts to Department Supervisor and Super Admin.
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* Executive Mandate Modal */}
      {showMandateModal && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border-2 border-amber-500 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    Chief Administrator Executive Order
                  </h3>
                  <p className="text-[10px] text-amber-400 font-mono">
                    Mandate on Ticket: {selectedComplaint.token}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowMandateModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Issue high-level administrative orders on <strong>"{selectedComplaint.title}"</strong> ({selectedComplaint.departmentName}). The department supervisor and assigned field specialist will receive binding 24h remediation instructions.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Select Directive Type:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMandateType('DIRECT_OVERRIDE_SANCTION')}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                      mandateType === 'DIRECT_OVERRIDE_SANCTION'
                        ? 'border-amber-500 bg-amber-950/40 text-amber-300 font-bold'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    ⚡ Fast-Track Sanction
                    <div className="text-[10px] font-normal text-slate-500 mt-0.5">Emergency municipal reserve funds</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMandateType('DEPARTMENT_INQUEST')}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                      mandateType === 'DEPARTMENT_INQUEST'
                        ? 'border-amber-500 bg-amber-950/40 text-amber-300 font-bold'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    📋 Issue Show-Cause Notice
                    <div className="text-[10px] font-normal text-slate-500 mt-0.5">12-hour departmental inquiry</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMandateType('RAPID_DISPATCH')}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                      mandateType === 'RAPID_DISPATCH'
                        ? 'border-amber-500 bg-amber-950/40 text-amber-300 font-bold'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    🚨 Rapid Task Force
                    <div className="text-[10px] font-normal text-slate-500 mt-0.5">Deploy flying remediation gang</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMandateType('INTER_DEPT_REROUTE')}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                      mandateType === 'INTER_DEPT_REROUTE'
                        ? 'border-amber-500 bg-amber-950/40 text-amber-300 font-bold'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    🔄 Inter-Dept Reroute
                    <div className="text-[10px] font-normal text-slate-500 mt-0.5">Reassign to another bureau</div>
                  </button>
                </div>
              </div>

              {mandateType === 'INTER_DEPT_REROUTE' && (
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    Reassign to Department:
                  </label>
                  <select
                    value={mandateReassignDept}
                    onChange={(e) => setMandateReassignDept(e.target.value)}
                    className="w-full rounded border border-slate-800 bg-slate-950 p-2 text-xs text-white"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Executive Directive Note:
                </label>
                <textarea
                  value={mandateNote}
                  onChange={(e) => setMandateNote(e.target.value)}
                  placeholder="e.g. Excessive citizen hardship logged. Special Task Squad deployed under Chief Administrator oversight. Mandatory resolution within 24 hours."
                  rows={3}
                  className="w-full rounded-md border border-slate-800 bg-slate-950 p-2.5 text-xs text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowMandateModal(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteMandate}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5 uppercase"
              >
                <Crown className="w-4 h-4" />
                <span>Issue Executive Directive</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
