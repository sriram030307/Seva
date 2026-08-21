import React, { useState, useEffect } from 'react';
import { sevaStore } from '../../services/store';
import { Complaint } from '../../types';
import { 
  Bug, 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  Zap, 
  CheckCircle2, 
  Terminal, 
  Flame, 
  ChevronRight, 
  X,
  Sparkles,
  Sliders,
  ShieldAlert,
  Database,
  Layers
} from 'lucide-react';

interface DeveloperSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeveloperSettingsModal: React.FC<DeveloperSettingsModalProps> = ({ isOpen, onClose }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string>('AUTO_RANDOM');
  const [breachCount, setBreachCount] = useState<number>(3);
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState(sevaStore.getAuditLogs().slice(0, 5));

  useEffect(() => {
    if (isOpen) {
      setComplaints(sevaStore.getComplaints().filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED'));
      setAuditLogs(sevaStore.getAuditLogs().slice(0, 5));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const showFeedback = (msg: string) => {
    setNotificationStatus(msg);
    setComplaints(sevaStore.getComplaints().filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED'));
    setAuditLogs(sevaStore.getAuditLogs().slice(0, 5));
    setTimeout(() => setNotificationStatus(null), 4000);
  };

  // Trigger Force SLA Breach
  const handleTriggerBreach = () => {
    if (selectedTicketId === 'AUTO_RANDOM') {
      const res = sevaStore.simulateSlaBreachScenario(breachCount);
      showFeedback(`🚨 Successfully forced SLA BREACH on ${res.count} items (${res.affectedTokens.join(', ')})! Alert notifications generated.`);
    } else {
      const res = sevaStore.simulateSlaBreachScenario(1, [selectedTicketId]);
      showFeedback(`🚨 Forced SLA BREACH on specific ticket ${res.affectedTokens.join(', ')}! Overdue trigger fired.`);
    }
  };

  // Trigger Approaching Breach (< 2 hours)
  const handleTriggerApproaching = () => {
    const res = sevaStore.simulateApproachingBreachScenario(2);
    showFeedback(`⚠️ Simulated Approaching Breach (< 2 hours remaining) on ${res.affectedTokens.join(', ')}.`);
  };

  // Reset all to healthy
  const handleResetHealthy = () => {
    const res = sevaStore.resetAllSlaTimersToHealthy();
    showFeedback(`✅ Restored ${res.count} active grievances to healthy SLA (+24h).`);
  };

  // Full demo reset
  const handleFullReset = () => {
    sevaStore.resetToSeed();
    showFeedback('🔄 All municipal records, triggers, and notifications reset to clean initial seed data.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-amber-500/40 bg-slate-950 p-5 sm:p-6 shadow-2xl space-y-5 text-slate-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-950/80 border border-amber-600/80 text-amber-400">
              <Bug className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Developer & QA Simulation Control Center
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-700">
                  DEV MODE ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Simulate critical SLA breach scenarios, force past deadlines, and test municipal escalation pipelines.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert Toast */}
        {notificationStatus && (
          <div className="p-3 rounded-lg bg-slate-900 border border-amber-500 text-xs font-semibold text-amber-300 flex items-start gap-2 animate-fadeIn">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{notificationStatus}</span>
          </div>
        )}

        {/* Section 1: SLA Breach Forcing */}
        <div className="p-4 rounded-xl border border-rose-900/60 bg-rose-950/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wide">
              <AlertTriangle className="w-4 h-4" />
              <span>Simulate SLA Breach Scenarios (Overdue)</span>
            </div>
            <span className="text-[10px] font-mono text-rose-300/80 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
              Forces Deadline = -4.5 Hours
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Immediately rewinds the SLA deadline for active tickets into the past. This fires live countdown breach alerts, shifts status to <strong>OVERDUE</strong>, and dispatches high-priority notifications to assigned field crews.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase font-mono mb-1">
                Target Ticket Scope
              </label>
              <select
                value={selectedTicketId}
                onChange={(e) => setSelectedTicketId(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:border-rose-500 focus:outline-none font-mono"
              >
                <option value="AUTO_RANDOM">⚡ Auto Random Batch ({breachCount} tickets)</option>
                {complaints.map(c => (
                  <option key={c.id} value={c.id}>
                    [{c.token}] {c.title.substring(0, 32)}...
                  </option>
                ))}
              </select>
            </div>

            {selectedTicketId === 'AUTO_RANDOM' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase font-mono mb-1">
                  Number of Grievances to Breach
                </label>
                <div className="flex items-center gap-2">
                  {[1, 3, 5, 8].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setBreachCount(num)}
                      className={`flex-1 py-2 rounded-lg border text-xs font-mono font-bold transition-colors ${
                        breachCount === num
                          ? 'bg-rose-600 border-rose-400 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {num} Tickets
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleTriggerBreach}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-950 transition-colors"
            >
              <Flame className="w-4 h-4 fill-current" />
              <span>Force Past Deadline (Trigger Breach)</span>
            </button>

            <button
              type="button"
              onClick={handleTriggerApproaching}
              className="px-3.5 py-2 rounded-lg bg-amber-950 border border-amber-700 hover:bg-amber-900 text-amber-300 font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Trigger Near-Breach (&lt; 2h)</span>
            </button>
          </div>
        </div>

        {/* Section 2: Quick Reset Actions */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wide">
            SLA Restoration & Test State Clean-up
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleResetHealthy}
              className="px-3.5 py-2 rounded-lg bg-emerald-950/80 border border-emerald-700 text-emerald-300 hover:bg-emerald-900 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Reset All SLAs to Healthy (+24h)</span>
            </button>

            <button
              type="button"
              onClick={handleFullReset}
              className="px-3.5 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-rose-400 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Full Demo Store Reset</span>
            </button>
          </div>
        </div>

        {/* Section 3: Live Audit Log Verification */}
        <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-950 font-mono text-[11px] space-y-2">
          <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1.5">
            <span className="flex items-center gap-1.5 font-bold text-amber-400">
              <Terminal className="w-3.5 h-3.5" />
              Latest Simulated Audit Trail
            </span>
            <span className="text-[10px] text-slate-500">Immutable Ledger</span>
          </div>

          <div className="space-y-1.5 max-h-28 overflow-y-auto">
            {auditLogs.map((log) => (
              <div key={log.id} className="text-slate-400 truncate">
                <span className="text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>{' '}
                <span className="text-blue-400">[{log.action}]</span>{' '}
                <span className="text-slate-300">{log.details}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
          >
            Close Developer Panel
          </button>
        </div>

      </div>
    </div>
  );
};
