import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { sevaStore } from '../../services/store';
import { Complaint, Department } from '../../types';
import { 
  calculateSlaInfo, 
  getSlaSeverityStyles, 
  SlaSeverity, 
  SlaCountdownInfo 
} from '../../utils/slaUtils';
import { PriorityBadge, StatusBadge } from '../../components/common/StatusBadge';
import { 
  Clock, 
  AlertTriangle, 
  Flame, 
  CheckCircle2, 
  Send, 
  FastForward, 
  ExternalLink, 
  Search, 
  Filter, 
  ChevronRight, 
  Zap, 
  ShieldAlert, 
  RefreshCw, 
  Timer, 
  CalendarClock, 
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Sliders,
  Check,
  Bug
} from 'lucide-react';
import { DeveloperSettingsModal } from './DeveloperSettingsModal';

interface SlaTrackerWidgetProps {
  initialFilter?: 'ALL' | 'CRITICAL' | 'APPROACHING' | 'BREACHED';
  compactMode?: boolean;
}

export const SlaTrackerWidget: React.FC<SlaTrackerWidgetProps> = ({ 
  initialFilter = 'ALL',
  compactMode = false 
}) => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  
  // Real-time second counter
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [timeOffsetHours, setTimeOffsetHours] = useState<number>(0);
  
  // UI Filters
  const [activeTab, setActiveTab] = useState<'ALL' | 'BREACHED' | 'CRITICAL' | 'APPROACHING' | 'HIGH_PRIORITY'>(
    initialFilter === 'BREACHED' ? 'BREACHED' :
    initialFilter === 'CRITICAL' ? 'CRITICAL' :
    initialFilter === 'APPROACHING' ? 'APPROACHING' : 'ALL'
  );
  const [selectedDeptId, setSelectedDeptId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');
  const [showSimulator, setShowSimulator] = useState<boolean>(false);
  const [showDevModal, setShowDevModal] = useState<boolean>(false);

  // Action Modals State
  const [expediteModalItem, setExpediteModalItem] = useState<SlaCountdownInfo | null>(null);
  const [expediteCustomNote, setExpediteCustomNote] = useState<string>('');
  const [extensionModalItem, setExtensionModalItem] = useState<SlaCountdownInfo | null>(null);
  const [extensionHours, setExtensionHours] = useState<number>(12);
  const [extensionReason, setExtensionReason] = useState<string>('');
  const [actionToast, setActionToast] = useState<{ message: string; type: 'success' | 'alert' } | null>(null);

  // Load data
  const loadData = () => {
    setComplaints(sevaStore.getComplaints());
    setDepartments(sevaStore.getDepartments());
  };

  useEffect(() => {
    loadData();
    const unsub = sevaStore.subscribe(loadData);
    return unsub;
  }, []);

  // Tick every second for live countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto dismiss toast
  useEffect(() => {
    if (actionToast) {
      const t = setTimeout(() => setActionToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [actionToast]);

  // Reference time including any test simulation offset
  const referenceTime = currentTime + timeOffsetHours * 3600 * 1000;

  // Compute calculated SLA for all active complaints
  const calculatedItems = useMemo(() => {
    const activeComplaints = complaints.filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED');
    
    return activeComplaints.map(c => calculateSlaInfo(c, referenceTime));
  }, [complaints, referenceTime]);

  // Statistics
  const breachedItems = useMemo(() => calculatedItems.filter(i => i.severity === 'BREACHED'), [calculatedItems]);
  const criticalItems = useMemo(() => calculatedItems.filter(i => i.severity === 'CRITICAL_WARNING'), [calculatedItems]);
  const approachingItems = useMemo(() => calculatedItems.filter(i => i.severity === 'APPROACHING_BREACH'), [calculatedItems]);
  const healthyItems = useMemo(() => calculatedItems.filter(i => i.severity === 'HEALTHY'), [calculatedItems]);

  // Filtered List
  const filteredItems = useMemo(() => {
    return calculatedItems.filter(item => {
      // Tab filter
      if (activeTab === 'BREACHED' && item.severity !== 'BREACHED') return false;
      if (activeTab === 'CRITICAL' && item.severity !== 'CRITICAL_WARNING') return false;
      if (activeTab === 'APPROACHING' && item.severity !== 'APPROACHING_BREACH' && item.severity !== 'CRITICAL_WARNING') return false;
      if (activeTab === 'HIGH_PRIORITY' && item.priority !== 'CRITICAL' && item.priority !== 'HIGH') return false;

      // Department filter
      if (selectedDeptId !== 'ALL' && item.departmentId !== selectedDeptId) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesToken = item.token.toLowerCase().includes(q);
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesArea = item.locationArea.toLowerCase().includes(q);
        const matchesOfficer = (item.assignedOfficerName || '').toLowerCase().includes(q);
        const matchesDept = item.departmentName.toLowerCase().includes(q);
        if (!matchesToken && !matchesTitle && !matchesArea && !matchesOfficer && !matchesDept) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      // Sort by urgent remaining time (negative / breached first, then lowest remaining)
      return a.remainingMs - b.remainingMs;
    });
  }, [calculatedItems, activeTab, selectedDeptId, searchQuery]);

  // Handle Expedite Reminder Submission
  const handleSendExpedite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expediteModalItem) return;

    const res = sevaStore.sendSlaExpediteReminder(expediteModalItem.complaintId, expediteCustomNote);
    if (res.success) {
      setActionToast({ message: res.message, type: 'success' });
    }
    setExpediteModalItem(null);
    setExpediteCustomNote('');
  };

  // Quick 1-Click Ping
  const handleQuickExpedite = (item: SlaCountdownInfo, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = sevaStore.sendSlaExpediteReminder(item.complaintId);
    if (res.success) {
      setActionToast({ message: `⚡ 1-Click Expedite sent for ${item.token}!`, type: 'success' });
    }
  };

  // Handle SLA Extension Submission
  const handleExtendSla = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extensionModalItem) return;

    const updated = sevaStore.extendSlaDeadline(
      extensionModalItem.complaintId, 
      extensionHours, 
      extensionReason || 'Government operational variance or specialized equipment transit delay.'
    );

    if (updated) {
      setActionToast({ 
        message: `⏱️ SLA window extended by +${extensionHours} hours for ${updated.token}`, 
        type: 'success' 
      });
    }
    setExtensionModalItem(null);
    setExtensionReason('');
  };

  // Handle Quick Escalation
  const handleEscalateSupervisor = (item: SlaCountdownInfo, e: React.MouseEvent) => {
    e.stopPropagation();
    sevaStore.escalateComplaint(
      item.complaintId, 
      'LEVEL_1_SUPERVISOR', 
      `Automated SLA Escalation: Item ${item.isBreached ? 'has breached' : 'is at critical risk of breaching'} time-to-resolution window.`
    );
    setActionToast({ message: `🚨 ${item.token} escalated to Level 1 Department Supervisor`, type: 'alert' });
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 shadow-2xl overflow-hidden">
      
      {/* Toast Notification */}
      {actionToast && (
        <div className={`px-4 py-2 text-xs font-bold flex items-center justify-between transition-all ${
          actionToast.type === 'alert' 
            ? 'bg-rose-600 text-white' 
            : 'bg-emerald-600 text-white'
        }`}>
          <div className="flex items-center gap-2">
            {actionToast.type === 'alert' ? <AlertTriangle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            <span>{actionToast.message}</span>
          </div>
          <button onClick={() => setActionToast(null)} className="text-white/80 hover:text-white">&times;</button>
        </div>
      )}

      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-950/80 border border-blue-800 text-blue-400">
                <Timer className="w-5 h-5 text-blue-400 animate-[spin_12s_linear_infinite]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                    SLA Countdown & Resolution Velocity Engine
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    LIVE 1s TICK
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Dynamic time-to-resolution tracking with predictive breach alerts and 1-click field crew dispatch
                </p>
              </div>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowDevModal(true)}
              className="px-2.5 py-1.5 rounded-lg border border-rose-900 bg-rose-950/60 text-rose-300 hover:bg-rose-900/80 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Open QA Developer Simulator to force SLA breach scenarios"
            >
              <Bug className="w-3.5 h-3.5 text-rose-400" />
              <span>Simulate Breach</span>
            </button>

            <button
              onClick={() => setShowSimulator(!showSimulator)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                showSimulator || timeOffsetHours > 0
                  ? 'border-amber-600 bg-amber-950/60 text-amber-300'
                  : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800'
              }`}
              title="Test future timeline breach triggers"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{timeOffsetHours > 0 ? `Sim: +${timeOffsetHours}h` : 'Fast-Forward'}</span>
            </button>

            <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-xs">
              <button
                onClick={() => setViewMode('CARDS')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  viewMode === 'CARDS' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('TABLE')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  viewMode === 'TABLE' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Table
              </button>
            </div>
          </div>

        </div>

        {/* SLA Simulator Bar (Expandable) */}
        {showSimulator && (
          <div className="mt-4 p-3 rounded-lg bg-amber-950/30 border border-amber-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-300 font-medium">
              <FastForward className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>SLA Timeline Fast-Forward:</strong> Test automatic deadline warnings and overdue triggers
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[0, 2, 4, 8, 24].map(hours => (
                <button
                  key={hours}
                  onClick={() => setTimeOffsetHours(hours)}
                  className={`px-2.5 py-1 rounded border font-mono font-bold text-xs transition-colors ${
                    timeOffsetHours === hours
                      ? 'bg-amber-600 border-amber-400 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {hours === 0 ? 'Live (0h)' : `+${hours} Hours`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SLA Metrics Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
          
          <div 
            onClick={() => setActiveTab('BREACHED')}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              activeTab === 'BREACHED'
                ? 'border-rose-600 bg-rose-950/50 ring-1 ring-rose-500'
                : 'border-slate-800 bg-slate-950/80 hover:border-rose-800/80'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-rose-400 mb-1">
              <span className="font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Breached (Overdue)
              </span>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            </div>
            <div className="text-2xl font-black text-rose-300 font-mono">{breachedItems.length}</div>
            <span className="text-[10px] text-rose-400/80">Immediate supervisor escalation</span>
          </div>

          <div 
            onClick={() => setActiveTab('CRITICAL')}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              activeTab === 'CRITICAL'
                ? 'border-amber-500 bg-amber-950/50 ring-1 ring-amber-400'
                : 'border-slate-800 bg-slate-950/80 hover:border-amber-800/80'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-amber-400 mb-1">
              <span className="font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Critical (&lt; 4 Hours)
              </span>
            </div>
            <div className="text-2xl font-black text-amber-300 font-mono">{criticalItems.length}</div>
            <span className="text-[10px] text-amber-400/80">Approaching breach threshold</span>
          </div>

          <div 
            onClick={() => setActiveTab('APPROACHING')}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              activeTab === 'APPROACHING'
                ? 'border-yellow-600 bg-yellow-950/40 ring-1 ring-yellow-500'
                : 'border-slate-800 bg-slate-950/80 hover:border-yellow-800/80'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-yellow-400 mb-1">
              <span className="font-bold flex items-center gap-1">
                <CalendarClock className="w-3.5 h-3.5" />
                Approaching (&lt; 12H)
              </span>
            </div>
            <div className="text-2xl font-black text-yellow-300 font-mono">{approachingItems.length}</div>
            <span className="text-[10px] text-yellow-400/80">Expedite work-in-progress</span>
          </div>

          <div 
            onClick={() => setActiveTab('ALL')}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              activeTab === 'ALL'
                ? 'border-blue-600 bg-blue-950/40 ring-1 ring-blue-500'
                : 'border-slate-800 bg-slate-950/80 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-blue-400 mb-1">
              <span className="font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Active Queue SLA
              </span>
            </div>
            <div className="text-2xl font-black text-white font-mono">{calculatedItems.length}</div>
            <span className="text-[10px] text-slate-400">{healthyItems.length} on track (&gt;12h)</span>
          </div>

        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 sm:px-5 border-b border-slate-800 bg-slate-950 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
              activeTab === 'ALL'
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Active ({calculatedItems.length})
          </button>
          
          <button
            onClick={() => setActiveTab('BREACHED')}
            className={`px-3 py-1 rounded-md font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              activeTab === 'BREACHED'
                ? 'bg-rose-700 text-white font-bold shadow-lg shadow-rose-950'
                : 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/50 border border-rose-800/60'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            Breached ({breachedItems.length})
          </button>

          <button
            onClick={() => setActiveTab('CRITICAL')}
            className={`px-3 py-1 rounded-md font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              activeTab === 'CRITICAL'
                ? 'bg-amber-600 text-white font-bold shadow-lg shadow-amber-950'
                : 'bg-amber-950/40 text-amber-300 hover:bg-amber-900/50 border border-amber-800/60'
            }`}
          >
            <Clock className="w-3 h-3" />
            Critical &lt; 4h ({criticalItems.length})
          </button>

          <button
            onClick={() => setActiveTab('APPROACHING')}
            className={`px-3 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
              activeTab === 'APPROACHING'
                ? 'bg-yellow-600 text-slate-950 font-bold'
                : 'bg-slate-900 text-yellow-400 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            Approaching &lt; 12h ({approachingItems.length})
          </button>

          <button
            onClick={() => setActiveTab('HIGH_PRIORITY')}
            className={`px-3 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
              activeTab === 'HIGH_PRIORITY'
                ? 'bg-red-700 text-white font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Critical Priority Tickets
          </button>
        </div>

        {/* Search & Dept Selector */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search token, officer, area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Main SLA Content */}
      <div className="p-4 sm:p-5">
        
        {filteredItems.length === 0 ? (
          <div className="py-12 text-center rounded-xl border border-dashed border-slate-800 bg-slate-950/40">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
            <h4 className="text-sm font-bold text-white">No grievances matching active SLA filter</h4>
            <p className="text-xs text-slate-400 mt-1">All civic issues in this selection are resolved or within healthy limits.</p>
            <button
              onClick={() => { setActiveTab('ALL'); setSelectedDeptId('ALL'); setSearchQuery(''); }}
              className="mt-3 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded"
            >
              Reset SLA Filters
            </button>
          </div>
        ) : viewMode === 'CARDS' ? (
          
          /* Cards Grid Mode */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredItems.map((item) => {
              const styles = getSlaSeverityStyles(item.severity);

              return (
                <div
                  key={item.complaintId}
                  className={`rounded-xl border ${styles.cardBorder} ${styles.cardBg} p-4 transition-all hover:shadow-xl relative flex flex-col justify-between group`}
                >
                  
                  {/* Top Metadata Header */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {item.token}
                      </span>
                      
                      <div className="flex items-center gap-1.5">
                        <PriorityBadge priority={item.priority} size="sm" />
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border whitespace-nowrap ${styles.badgeBg} ${styles.badgeText} ${styles.badgeBorder} ${styles.pulseEffect ? 'animate-pulse' : ''}`}>
                          {styles.label}
                        </span>
                      </div>
                    </div>

                    <h4 
                      onClick={() => navigate(`/government/complaints/${item.complaintId}`)}
                      className="text-xs font-bold text-white line-clamp-2 hover:text-blue-400 cursor-pointer transition-colors"
                    >
                      {item.title}
                    </h4>

                    <div className="text-[11px] text-slate-400 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="truncate">🏛️ {item.departmentName}</span>
                        <span className="text-slate-500 font-mono">📍 {item.locationArea}</span>
                      </div>
                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <span>👤 Officer: <strong className="text-slate-300">{item.assignedOfficerName || 'UNASSIGNED'}</strong></span>
                        <StatusBadge status={item.status} mode="government" size="sm" />
                      </div>
                    </div>
                  </div>

                  {/* Countdown Display & Progress Section */}
                  <div className="my-3 pt-3 border-t border-slate-800/80 space-y-2.5">
                    
                    {/* Big Countdown Timer */}
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                          {item.isBreached ? 'SLA Elapsed / Overdue' : 'Time To Resolution Window'}
                        </div>
                        <div className={`text-xl font-mono tracking-tight ${styles.timerTextColor}`}>
                          {item.formattedCountdown}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500 uppercase font-mono">Target SLA</div>
                        <div className="text-xs font-mono font-bold text-slate-300">{item.slaHours}h window</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800 flex">
                        <div
                          className={`h-full transition-all duration-1000 ${styles.progressBarColor}`}
                          style={{ width: `${Math.min(100, item.percentElapsed)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>{item.percentElapsed}% elapsed</span>
                        <span className="text-slate-500">Deadline: {item.formattedDeadline}</span>
                      </div>
                    </div>

                    {/* AI Velocity Estimate */}
                    <div className="p-2 rounded bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1 font-mono text-[10px]">
                        <Sparkles className="w-3 h-3 text-blue-400" />
                        AI Work Velocity:
                      </span>
                      <span className="font-mono font-bold text-blue-300 text-[10px]">
                        {item.aiPredictedResolutionLabel}
                      </span>
                    </div>

                  </div>

                  {/* Action Controls */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
                    
                    <button
                      onClick={(e) => handleQuickExpedite(item, e)}
                      className="px-2.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                      title="Send high-priority dispatch reminder to officer"
                    >
                      <Zap className="w-3 h-3 fill-current" />
                      <span>1-Click Ping</span>
                    </button>

                    <div className="flex items-center gap-1">
                      
                      <button
                        onClick={(e) => { e.stopPropagation(); setExtensionModalItem(item); }}
                        className="px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1"
                        title="Extend SLA deadline with justification"
                      >
                        <Clock className="w-3 h-3" />
                        <span>Extend</span>
                      </button>

                      {item.isBreached && (
                        <button
                          onClick={(e) => handleEscalateSupervisor(item, e)}
                          className="px-2 py-1.5 rounded bg-rose-950 border border-rose-700 hover:bg-rose-900 text-rose-300 text-[11px] font-bold flex items-center gap-1"
                          title="Escalate ticket to Department Supervisor"
                        >
                          <Flame className="w-3 h-3 text-rose-400" />
                          <span>Escalate</span>
                        </button>
                      )}

                      <button
                        onClick={() => navigate(`/government/complaints/${item.complaintId}`)}
                        className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                        title="Open incident workspace"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>

                    </div>

                  </div>

                </div>
              );
            })}
          </div>

        ) : (

          /* High-Density Table Mode */
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Ticket Token</th>
                  <th className="py-2.5 px-3">Grievance & Area</th>
                  <th className="py-2.5 px-3">Department & Officer</th>
                  <th className="py-2.5 px-3">Priority / Status</th>
                  <th className="py-2.5 px-3">Live Countdown Timer</th>
                  <th className="py-2.5 px-3 text-right">Quick SLA Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredItems.map((item) => {
                  const styles = getSlaSeverityStyles(item.severity);

                  return (
                    <tr 
                      key={item.complaintId}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => navigate(`/government/complaints/${item.complaintId}`)}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-amber-400 whitespace-nowrap">
                        {item.token}
                      </td>
                      
                      <td className="py-3 px-3 max-w-xs">
                        <div className="font-bold text-white truncate">{item.title}</div>
                        <div className="text-[10px] text-slate-400 font-mono">📍 {item.locationArea}</div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="text-slate-300 font-medium truncate">{item.departmentName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">👤 {item.assignedOfficerName || 'UNASSIGNED'}</div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <PriorityBadge priority={item.priority} size="sm" />
                          <StatusBadge status={item.status} mode="government" size="sm" />
                        </div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap font-mono">
                        <div className={`text-sm ${styles.timerTextColor}`}>
                          {item.formattedCountdown}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {item.percentElapsed}% elapsed • Deadline: {item.formattedDeadline}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => handleQuickExpedite(item, e)}
                            className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1"
                          >
                            <Zap className="w-3 h-3" />
                            <span>Ping</span>
                          </button>

                          <button
                            onClick={() => setExtensionModalItem(item)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                          >
                            Extend
                          </button>

                          <button
                            onClick={() => navigate(`/government/complaints/${item.complaintId}`)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        )}

      </div>

      {/* Expedite Modal */}
      {expediteModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Issue SLA Expedite Notice</h3>
              </div>
              <button onClick={() => setExpediteModalItem(null)} className="text-slate-400 hover:text-white">&times;</button>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-amber-400">{expediteModalItem.token}</span>
                <span className="text-rose-400 font-mono">{expediteModalItem.formattedCountdown}</span>
              </div>
              <h4 className="text-xs font-bold text-white">{expediteModalItem.title}</h4>
              <p className="text-[11px] text-slate-400">Assigned Officer: {expediteModalItem.assignedOfficerName || 'Field Division'}</p>
            </div>

            <form onSubmit={handleSendExpedite} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Custom Dispatch Directive (Optional)</label>
                <textarea
                  rows={3}
                  value={expediteCustomNote}
                  onChange={(e) => setExpediteCustomNote(e.target.value)}
                  placeholder="e.g. Traffic corridor hazard — deploy rapid response gang within 30 minutes."
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setExpediteModalItem(null)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transmit Priority Alert</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SLA Extension Modal */}
      {extensionModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Extend SLA Window</h3>
              </div>
              <button onClick={() => setExtensionModalItem(null)} className="text-slate-400 hover:text-white">&times;</button>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-amber-400">{extensionModalItem.token}</span>
                <span className="text-slate-400">Current SLA: {extensionModalItem.slaHours}h</span>
              </div>
              <h4 className="text-xs font-bold text-white">{extensionModalItem.title}</h4>
            </div>

            <form onSubmit={handleExtendSla} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Additional SLA Hours</label>
                <select
                  value={extensionHours}
                  onChange={(e) => setExtensionHours(Number(e.target.value))}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value={6}>+6 Hours (Same Day Shift)</option>
                  <option value={12}>+12 Hours (Overnight Window)</option>
                  <option value={24}>+24 Hours (Next Day Completion)</option>
                  <option value={48}>+48 Hours (Major Civil Works / Excavation)</option>
                  <option value={72}>+72 Hours (Inter-Agency Pipeline Re-laying)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Official Municipal Justification</label>
                <textarea
                  required
                  rows={3}
                  value={extensionReason}
                  onChange={(e) => setExtensionReason(e.target.value)}
                  placeholder="e.g. Heavy monsoon rain halted bitumen hot-mix application. Specialized asphalt paver arriving tomorrow morning."
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setExtensionModalItem(null)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Authorize SLA Extension</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Developer & QA Simulator Modal */}
      <DeveloperSettingsModal
        isOpen={showDevModal}
        onClose={() => setShowDevModal(false)}
      />

    </div>
  );
};
