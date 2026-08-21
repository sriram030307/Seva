import React, { useState, useEffect } from 'react';
import { Complaint } from '../../types';
import { sevaStore } from '../../services/store';
import { calculateSlaInfo, getSlaSeverityStyles, SlaCountdownInfo } from '../../utils/slaUtils';
import { 
  Clock, 
  Flame, 
  AlertTriangle, 
  Send, 
  FastForward, 
  CheckCircle2, 
  ShieldAlert, 
  Sparkles,
  CalendarClock,
  Zap,
  Check,
  Crown,
  Scale
} from 'lucide-react';

interface SlaDetailCardProps {
  complaint: Complaint;
  onUpdate?: () => void;
}

export const SlaDetailCard: React.FC<SlaDetailCardProps> = ({ complaint, onUpdate }) => {
  const currentUser = sevaStore.getCurrentUser();
  const isAdmin = currentUser.role === 'ADMIN';
  const isSupervisor = currentUser.role === 'SUPERVISOR' || currentUser.role === 'DEPARTMENT_ADMIN';
  
  // Real-time second counter
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [showExtendModal, setShowExtendModal] = useState<boolean>(false);
  const [extendHours, setExtendHours] = useState<number>(12);
  const [extendReason, setExtendReason] = useState<string>('');
  
  const [showExpediteModal, setShowExpediteModal] = useState<boolean>(false);
  const [expediteNote, setExpediteNote] = useState<string>('');

  const [showAdminActionModal, setShowAdminActionModal] = useState<boolean>(false);
  const [adminActionType, setAdminActionType] = useState<'DIRECT_OVERRIDE_SANCTION' | 'DEPARTMENT_INQUEST' | 'INTER_DEPT_REROUTE' | 'RAPID_DISPATCH'>('DIRECT_OVERRIDE_SANCTION');
  const [adminActionNote, setAdminActionNote] = useState<string>('');
  const [adminSanctionDetails, setAdminSanctionDetails] = useState<string>('');
  const [adminReassignDeptId, setAdminReassignDeptId] = useState<string>('dept-road');
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const slaInfo: SlaCountdownInfo = calculateSlaInfo(complaint, currentTime);
  const styles = getSlaSeverityStyles(slaInfo.severity);
  const isResolved = complaint.status === 'RESOLVED' || complaint.status === 'CLOSED';

  const handleSendExpedite = () => {
    const res = sevaStore.sendSlaExpediteReminder(complaint.id, expediteNote || undefined);
    setShowExpediteModal(false);
    setExpediteNote('');
    setToastMessage(res.message || '⚡ Urgent expedite notice sent to assigned crew & supervisor.');
    setTimeout(() => setToastMessage(null), 3500);
    if (onUpdate) onUpdate();
  };

  const handleExtendSla = () => {
    const res = sevaStore.extendSlaWindow(
      complaint.id, 
      extendHours, 
      extendReason || `Operational extension approved by ${currentUser.name}`
    );
    setShowExtendModal(false);
    setExtendReason('');
    setToastMessage(res.message || `⏱️ SLA deadline extended by +${extendHours} hours.`);
    setTimeout(() => setToastMessage(null), 3500);
    if (onUpdate) onUpdate();
  };

  const handleExecuteAdminAction = () => {
    sevaStore.adminExecuteActionOnProlongedComplaint(complaint.id, {
      actionType: adminActionType,
      note: adminActionNote || 'Direct executive intervention on prolonged citizen grievance.',
      sanctionDetails: adminSanctionDetails || undefined,
      reassignDeptId: adminActionType === 'INTER_DEPT_REROUTE' ? adminReassignDeptId : undefined
    });
    setShowAdminActionModal(false);
    setAdminActionNote('');
    setToastMessage('👑 Executive Mandate Issued: Real-time orders dispatched to Department Head and Citizen.');
    setTimeout(() => setToastMessage(null), 4000);
    if (onUpdate) onUpdate();
  };

  return (
    <div className={`rounded-xl border ${styles.cardBorder} ${styles.cardBg} p-5 shadow-xl space-y-4 relative overflow-hidden`}>
      
      {/* Toast */}
      {toastMessage && (
        <div className="absolute top-3 right-3 left-3 z-20 bg-emerald-950 border border-emerald-500 text-emerald-200 text-xs font-semibold px-3.5 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${styles.badgeBg} ${styles.badgeBorder} border`}>
            {slaInfo.isBreached ? (
              <Flame className={`w-4 h-4 ${styles.iconColor} animate-pulse`} />
            ) : slaInfo.isCriticalWarning ? (
              <AlertTriangle className={`w-4 h-4 ${styles.iconColor} animate-pulse`} />
            ) : (
              <Clock className={`w-4 h-4 ${styles.iconColor}`} />
            )}
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              SLA Resolution Timeline
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Allocated: {complaint.slaHours} Hours • Target: {slaInfo.formattedDeadline}
            </span>
          </div>
        </div>

        <div className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold border ${styles.badgeBg} ${styles.badgeText} ${styles.badgeBorder}`}>
          {styles.label}
        </div>
      </div>

      {/* Main Countdown Ticker */}
      <div className="bg-slate-950/80 rounded-lg p-3.5 border border-slate-800/80 text-center space-y-1">
        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
          {isResolved ? 'Status' : slaInfo.isBreached ? 'Breach Duration (Overdue)' : 'Time Remaining to Resolve'}
        </div>
        <div className={`text-2xl sm:text-3xl font-mono tracking-tight font-black ${styles.timerTextColor}`}>
          {slaInfo.formattedCountdown}
        </div>
        <div className="text-[11px] text-slate-400 font-mono">
          {slaInfo.timeRemainingLabel}
        </div>
      </div>

      {/* Progress Bar */}
      {!isResolved && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Elapsed Window: {slaInfo.percentElapsed}%</span>
            <span>{slaInfo.aiPredictedResolutionLabel}</span>
          </div>
          <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div 
              className={`h-full ${styles.progressBarColor} transition-all duration-1000`}
              style={{ width: `${Math.min(100, Math.max(5, slaInfo.percentElapsed))}%` }}
            />
          </div>
        </div>
      )}

      {/* Citizen Escalation Callout if present */}
      {complaint.escalatedToMainHead && (
        <div className="rounded-lg border border-amber-500/80 bg-amber-950/30 p-3 text-xs space-y-1.5 font-mono">
          <div className="text-amber-300 font-bold flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Escalated to Municipal Chief Administrator</span>
          </div>
          <p className="text-[11px] text-slate-300">
            Citizen escalated after prolonged delay: "{complaint.citizenEscalationReason || 'Prolonged lack of resolution'}"
          </p>
          {complaint.adminActionTaken && (
            <div className="pt-1.5 border-t border-amber-800/40 text-[10px] text-amber-200">
              ⚡ <strong>Executive Order:</strong> [{complaint.adminActionTaken.actionType}] {complaint.adminActionTaken.note} ({new Date(complaint.adminActionTaken.actionDate).toLocaleDateString()})
            </div>
          )}
        </div>
      )}

      {/* Action Buttons for Department Users & Admins */}
      {!isResolved && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => setShowExpediteModal(true)}
            className="w-full py-2 px-3 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Send className="w-3.5 h-3.5 text-amber-400" />
            <span>Expedite Field Crew</span>
          </button>

          <button
            onClick={() => setShowExtendModal(true)}
            className="w-full py-2 px-3 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <CalendarClock className="w-3.5 h-3.5 text-blue-400" />
            <span>Extend SLA Window</span>
          </button>

          {/* Admin Executive Action Button for Main Head or Prolonged Grievances */}
          {(isAdmin || complaint.escalatedToMainHead || slaInfo.isBreached) && (
            <button
              onClick={() => setShowAdminActionModal(true)}
              className="sm:col-span-2 w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 text-xs font-black shadow-md hover:brightness-110 flex items-center justify-center gap-2 transition-all uppercase tracking-wider"
            >
              <Crown className="w-4 h-4" />
              <span>👑 Main Head Executive Intervention</span>
            </button>
          )}
        </div>
      )}

      {/* Expedite Modal */}
      {showExpediteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                Dispatch Urgent SLA Expedite Notice
              </h3>
              <button 
                onClick={() => setShowExpediteModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Send immediate push alert to assigned specialist ({complaint.assignedOfficerName || 'Field Division'}) and departmental supervisor.
            </p>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                Custom Directive Note (Optional):
              </label>
              <textarea
                value={expediteNote}
                onChange={(e) => setExpediteNote(e.target.value)}
                placeholder="e.g. Citizen reported worsening road cave-in. Deploy emergency cold-patch unit immediately."
                rows={3}
                className="w-full rounded-md border border-slate-800 bg-slate-950 p-2.5 text-xs text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowExpediteModal(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSendExpedite}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow-md flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Expedite Alert</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extension Modal */}
      {showExtendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <CalendarClock className="w-4 h-4" />
                Authorize SLA Window Extension
              </h3>
              <button 
                onClick={() => setShowExtendModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1.5">
                Select Additional Window:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[12, 24, 48].map((hrs) => (
                  <button
                    key={hrs}
                    onClick={() => setExtendHours(hrs)}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      extendHours === hrs 
                        ? 'bg-blue-600 border-blue-500 text-white shadow-md' 
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    +{hrs} Hours
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                Official Operational Justification (Logged to Audit Trail):
              </label>
              <textarea
                value={extendReason}
                onChange={(e) => setExtendReason(e.target.value)}
                placeholder="e.g. Heavy monsoon rainfall delayed bitumen asphalt laying; specialized de-watering equipment required."
                rows={3}
                className="w-full rounded-md border border-slate-800 bg-slate-950 p-2.5 text-xs text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowExtendModal(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleExtendSla}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-md flex items-center gap-1.5"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>Grant Extension</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Head Executive Action Modal */}
      {showAdminActionModal && (
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
                    Direct Authority: K. Rajasekaran, IAS (Main Head)
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowAdminActionModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Execute high-level administrative orders on ticket <strong>{complaint.token}</strong>. Directives will be dispatched to the Department Head, Supervisor, and Reporting Citizen with an enforced 24-hour closure mandate.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Select Executive Directive Type:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdminActionType('DIRECT_OVERRIDE_SANCTION')}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                      adminActionType === 'DIRECT_OVERRIDE_SANCTION'
                        ? 'border-amber-500 bg-amber-950/40 text-amber-300 font-bold'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    ⚡ Fast-Track Sanction
                    <div className="text-[10px] font-normal text-slate-500 mt-0.5">Emergency municipal reserve funds</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdminActionType('DEPARTMENT_INQUEST')}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                      adminActionType === 'DEPARTMENT_INQUEST'
                        ? 'border-amber-500 bg-amber-950/40 text-amber-300 font-bold'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    📋 Issue Show-Cause Notice
                    <div className="text-[10px] font-normal text-slate-500 mt-0.5">12-hour departmental inquiry</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdminActionType('RAPID_DISPATCH')}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                      adminActionType === 'RAPID_DISPATCH'
                        ? 'border-amber-500 bg-amber-950/40 text-amber-300 font-bold'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    🚨 Rapid Task Force
                    <div className="text-[10px] font-normal text-slate-500 mt-0.5">Deploy flying remediation gang</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdminActionType('INTER_DEPT_REROUTE')}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                      adminActionType === 'INTER_DEPT_REROUTE'
                        ? 'border-amber-500 bg-amber-950/40 text-amber-300 font-bold'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    🔄 Inter-Dept Reroute
                    <div className="text-[10px] font-normal text-slate-500 mt-0.5">Reassign to another bureau</div>
                  </button>
                </div>
              </div>

              {adminActionType === 'INTER_DEPT_REROUTE' && (
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    Reassign to Department:
                  </label>
                  <select
                    value={adminReassignDeptId}
                    onChange={(e) => setAdminReassignDeptId(e.target.value)}
                    className="w-full rounded border border-slate-800 bg-slate-950 p-2 text-xs text-white"
                  >
                    {sevaStore.getDepartments().map((d) => (
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
                  value={adminActionNote}
                  onChange={(e) => setAdminActionNote(e.target.value)}
                  placeholder="e.g. Prolonged 5-day delay is unacceptable. Special Task Squad deployed under Chief Administrator oversight. Case must be resolved within 24 hours."
                  rows={3}
                  className="w-full rounded-md border border-slate-800 bg-slate-950 p-2.5 text-xs text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowAdminActionModal(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteAdminAction}
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
