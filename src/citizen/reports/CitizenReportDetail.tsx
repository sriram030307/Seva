import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { sevaStore } from '../../services/store';
import { Complaint, ComplaintStatus, EvidenceRecord } from '../../types';
import { StatusBadge, PriorityBadge, SlaBadge, AIVerificationBadge } from '../../components/common/StatusBadge';
import { ImageComparator } from '../../components/common/ImageComparator';
import { EvidenceUploader } from '../../components/common/EvidenceUploader';
import { SlaCountdownBadge } from '../../government/components/SlaCountdownBadge';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Camera, 
  MapPin, 
  Clock, 
  User, 
  Building2, 
  Sparkles, 
  AlertTriangle, 
  FileText, 
  History,
  ShieldCheck,
  Phone,
  Crown,
  Send,
  AlertCircle
} from 'lucide-react';

export const CitizenReportDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = sevaStore.getCurrentUser();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [showEvidenceUploadModal, setShowEvidenceUploadModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  
  // Citizen Escalation to Main Head Modal
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalationReason, setEscalationReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadData = () => {
    if (!id) return;
    const found = sevaStore.getComplaintById(id);
    if (found) {
      setComplaint(found);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = sevaStore.subscribe(loadData);
    return unsub;
  }, [id]);

  if (!complaint) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-400">
        <h2 className="text-base font-bold text-white mb-2">Complaint Not Found</h2>
        <p className="text-xs text-slate-500 mb-4">The requested grievance record does not exist.</p>
        <button
          onClick={() => navigate('/citizen/reports')}
          className="px-4 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded"
        >
          &larr; Back to My Reports
        </button>
      </div>
    );
  }

  const isResolved = complaint.status === 'RESOLVED' || complaint.status === 'CLOSED';
  const isOverdue = complaint.slaStatus === 'OVERDUE';
  const daysOpen = Math.floor((Date.now() - new Date(complaint.createdAt).getTime()) / (24 * 3600 * 1000));

  // Handle Citizen Approved Resolution
  const handleApproveResolution = () => {
    setIsProcessing(true);
    try {
      sevaStore.verifyAndResolveComplaint(complaint.id, currentUser.id, true);

      // Trigger Confetti Celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      setIsProcessing(false);
      setToastMsg('🎉 Resolution approved & ticket successfully verified!');
      setTimeout(() => setToastMsg(null), 3500);
    } catch (e) {
      console.error(e);
      setIsProcessing(false);
    }
  };

  // Handle Citizen Rejected Resolution
  const handleRejectResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) return;

    setIsProcessing(true);
    try {
      sevaStore.verifyAndResolveComplaint(complaint.id, currentUser.id, false, rejectReason);
      setShowRejectModal(false);
      setIsProcessing(false);
      setToastMsg('⚠️ Resolution contested. Department supervisor notified for re-inspection.');
      setTimeout(() => setToastMsg(null), 3500);
    } catch (e) {
      console.error(e);
      setIsProcessing(false);
    }
  };

  // Handle Citizen Escalation to Main Head
  const handleEscalateToMainHead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!escalationReason.trim()) return;

    setIsProcessing(true);
    try {
      sevaStore.escalateToMainHeadByCitizen(complaint.id, escalationReason);
      setShowEscalateModal(false);
      setEscalationReason('');
      setIsProcessing(false);
      setToastMsg('👑 Escalated to Municipal Chief Administrator (K. Rajasekaran, IAS). Special inquiry underway.');
      setTimeout(() => setToastMsg(null), 4000);
    } catch (e) {
      console.error(e);
      setIsProcessing(false);
    }
  };

  const handleUploadCitizenEvidence = (evidence: any) => {
    sevaStore.addCitizenEvidence(complaint.id, evidence);
    setShowEvidenceUploadModal(false);
  };

  // Progress Steps calculation
  const steps: Array<{ key: ComplaintStatus; label: string }> = [
    { key: 'NEW', label: 'Reported' },
    { key: 'VERIFIED', label: 'Geo-Verified' },
    { key: 'ASSIGNED', label: 'Assigned' },
    { key: 'IN_PROGRESS', label: 'In Progress' },
    { key: 'AI_VERIFICATION', label: 'AI Check' },
    { key: 'AWAITING_CITIZEN_VERIFICATION', label: 'Citizen Verification' },
    { key: 'RESOLVED', label: 'Resolved' }
  ];

  const getStepIndex = (status: ComplaintStatus) => {
    switch (status) {
      case 'NEW':
      case 'AWAITING_CITIZEN_EVIDENCE':
        return 0;
      case 'VERIFIED':
        return 1;
      case 'ASSIGNED':
        return 2;
      case 'IN_PROGRESS':
      case 'AWAITING_RESOLUTION_EVIDENCE':
        return 3;
      case 'AI_VERIFICATION':
        return 4;
      case 'AWAITING_CITIZEN_VERIFICATION':
      case 'RESOLUTION_REJECTED':
      case 'ESCALATED':
        return 5;
      case 'RESOLVED':
      case 'CLOSED':
        return 6;
      default:
        return 0;
    }
  };

  const currentStepIdx = getStepIndex(complaint.status);

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-20 right-4 left-4 sm:left-auto sm:w-96 z-50 bg-slate-900 border border-amber-500 text-amber-200 text-xs font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Bar Navigation */}
      <div className="border-b border-slate-800 bg-slate-900/80 px-4 py-3 sm:px-6 sticky top-16 z-30 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <button
            onClick={() => navigate('/citizen/reports')}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Reports</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-amber-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
              {complaint.token}
            </span>
            <PriorityBadge priority={complaint.priority} size="sm" />
            <StatusBadge status={complaint.status} mode="citizen" size="sm" />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 space-y-6">
        
        {/* Prolonged & Main Head Escalation Banner */}
        {complaint.escalatedToMainHead ? (
          <div className="rounded-2xl border-2 border-amber-500 bg-gradient-to-r from-amber-950/70 via-slate-900 to-slate-900 p-5 shadow-2xl space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold shrink-0">
                <Crown className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-amber-200 uppercase tracking-wider">
                    👑 Case Under Chief Administrator Review (Main Head)
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Executive Oversight
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Your grievance was escalated to the State Civic Administration Head (K. Rajasekaran, IAS) due to prolonged delay. Executive directives have been enforced on the department.
                </p>
                <div className="text-[11px] font-mono text-amber-400 pt-1">
                  Escalation Reason: "{complaint.citizenEscalationReason || 'Delay in field remediation'}"
                </div>
                {complaint.adminActionTaken && (
                  <div className="mt-2 p-2.5 rounded-lg bg-slate-950/80 border border-amber-500/50 text-xs text-emerald-300">
                    ⚡ <strong>Executive Order Issued:</strong> [{complaint.adminActionTaken.actionType}] {complaint.adminActionTaken.note}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (!isResolved && (isOverdue || daysOpen >= 1)) ? (
          /* Option to Escalate to Main Head */
          <div className="rounded-2xl border border-amber-500/60 bg-amber-950/20 p-4 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold shrink-0">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Experiencing Delay? Escalate to Municipal Chief Administrator
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  If this grievance is prolonged or the department has not taken timely action, you can escalate directly to the Commissioner for executive intervention.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowEscalateModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 text-xs font-black rounded-lg shadow-md whitespace-nowrap shrink-0 flex items-center gap-1.5 uppercase"
            >
              <Crown className="w-4 h-4" />
              <span>Escalate to Main Head</span>
            </button>
          </div>
        ) : null}

        {/* Urgent Action Callout: Citizen Final Verification Authority */}
        {complaint.status === 'AWAITING_CITIZEN_VERIFICATION' && (
          <div className="rounded-2xl border-2 border-amber-500 bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold shrink-0 mt-0.5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-white">
                  Government Marked Issue as Solved — Your Verification Required
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The municipal department and field officer have uploaded resolution proof. SEVA AI has completed initial visual analysis. As the reporting citizen, <strong>you hold the final sign-off authority</strong> to close or contest this resolution.
                </p>
              </div>
            </div>

            {/* Action Choice Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={handleApproveResolution}
                disabled={isProcessing}
                className="w-full sm:flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-transform active:scale-98"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>✅ YES, ISSUE IS RESOLVED (Close Ticket)</span>
              </button>

              <button
                onClick={() => setShowRejectModal(true)}
                disabled={isProcessing}
                className="w-full sm:w-auto py-3 px-5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                <span>❌ NO, REJECT RESOLUTION (Contest)</span>
              </button>
            </div>
          </div>
        )}

        {/* Action Callout: Citizen Photo Evidence Needed */}
        {complaint.status === 'AWAITING_CITIZEN_EVIDENCE' && (
          <div className="rounded-2xl border-2 border-amber-500/80 bg-slate-900 p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500 text-slate-950 font-bold shrink-0">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Add Geo-Tagged Photo Evidence
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Uploading site photos ensures 100% location accuracy and speeds up department assignment.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowEvidenceUploadModal(true)}
              className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-lg hover:bg-amber-400 shadow-md whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <Camera className="w-4 h-4" />
              <span>Capture / Upload Photo</span>
            </button>
          </div>
        )}

        {/* Resolved Banner */}
        {complaint.status === 'RESOLVED' && (
          <div className="rounded-xl border border-emerald-500/60 bg-emerald-950/30 p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-xs text-emerald-300">
              <strong>Ticket Officially Resolved:</strong> Verified by citizen on {new Date(complaint.updatedAt).toLocaleString()}.
            </div>
          </div>
        )}

        {/* Step-by-Step Progress Pipeline */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 shadow-xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Remediation Pipeline
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {steps.map((step, idx) => {
              const isPast = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              return (
                <div
                  key={step.key}
                  className={`flex flex-col items-center text-center p-2 rounded-lg border transition-all ${
                    isCurrent
                      ? 'border-amber-500 bg-amber-950/40 text-amber-300 font-bold shadow-md shadow-amber-500/10'
                      : isPast
                      ? 'border-emerald-800/80 bg-emerald-950/20 text-emerald-400'
                      : 'border-slate-800 bg-slate-950 text-slate-500'
                  }`}
                >
                  <div className="text-[10px] font-mono mb-1">
                    {isPast ? '✓' : idx + 1}
                  </div>
                  <span className="text-[11px] leading-tight">
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Issue Overview & Details Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {complaint.title}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Category: <strong className="text-slate-200">{complaint.category}</strong> • Subcategory: <strong className="text-slate-200">{complaint.subcategory.replace(/_/g, ' ')}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <SlaCountdownBadge complaint={complaint} showDetails={false} />
              <SlaBadge slaStatus={complaint.slaStatus} />
            </div>
          </div>

          <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/80 p-3.5 rounded-lg border border-slate-800">
            <strong className="text-amber-400 block mb-1">AI Voice Summary:</strong>
            {complaint.aiSummary || complaint.description}
          </div>

          {/* Department & Officer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-1">
              <span className="text-slate-400 flex items-center gap-1 font-mono text-[10px] uppercase">
                <Building2 className="w-3 h-3 text-amber-400" /> Assigned Department
              </span>
              <div className="font-bold text-white">{complaint.departmentName}</div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-1">
              <span className="text-slate-400 flex items-center gap-1 font-mono text-[10px] uppercase">
                <User className="w-3 h-3 text-amber-400" /> Field Officer
              </span>
              <div className="font-bold text-white">
                {complaint.assignedOfficerName || 'Assignment In Queue'}
              </div>
              {complaint.assignedOfficerBadge && (
                <div className="text-[10px] font-mono text-slate-400">Badge: {complaint.assignedOfficerBadge}</div>
              )}
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-1">
              <span className="text-slate-400 flex items-center gap-1 font-mono text-[10px] uppercase">
                <Clock className="w-3 h-3 text-amber-400" /> SLA Target
              </span>
              <div className="font-bold text-white">{complaint.slaHours} Hours</div>
              <div className="text-[10px] font-mono text-slate-400">Created: {new Date(complaint.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        {/* Visual Evidence Comparison Section */}
        <ImageComparator
          citizenEvidence={complaint.citizenEvidence}
          governmentEvidence={complaint.governmentEvidence}
          aiVerification={complaint.aiVerification}
          ticketToken={complaint.token}
        />

        {/* Chronological Audit Trail */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 shadow-xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
            <History className="w-4 h-4 text-amber-400" />
            Audit Trail & Event Timeline
          </h3>

          <div className="space-y-3 relative before:absolute before:inset-0 before:left-2.5 before:w-0.5 before:bg-slate-800">
            {(complaint.auditTrail || sevaStore.getAuditLogsForComplaint(complaint.id) || []).map((item) => (
              <div key={item.id} className="relative flex items-start gap-3 pl-6">
                <div className="absolute left-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-amber-400 ring-4 ring-slate-950" />
                <div className="flex-1 rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="font-bold text-white">{item.action?.replace(/_/g, ' ') || 'ACTION'}</span>
                    <span className="font-mono text-[10px]">{item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A'}</span>
                  </div>
                  <p className="text-slate-300">{item.details}</p>
                  <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                    Actor: {item.performedBy || item.userName || 'System'} ({item.performedByRole || item.role || 'OFFICER'})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* Citizen Escalation Modal */}
      {showEscalateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border-2 border-amber-500 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    Escalate to Chief Administrator
                  </h3>
                  <p className="text-[10px] text-amber-400 font-mono">
                    Direct Appeal: K. Rajasekaran, IAS (Main Head)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEscalateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Submit an official citizen escalation regarding unresolved delay on ticket <strong>{complaint.token}</strong>. The Chief Administrator will review department records and issue executive action.
            </p>

            <form onSubmit={handleEscalateToMainHead} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Reason for Escalation / Prolonged Impact:
                </label>
                <textarea
                  value={escalationReason}
                  onChange={(e) => setEscalationReason(e.target.value)}
                  placeholder="e.g. Issue has been unresolved for several days. Water leak is spreading to main road and department has not responded with repair team."
                  rows={4}
                  className="w-full rounded-md border border-slate-800 bg-slate-950 p-2.5 text-xs text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEscalateModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || !escalationReason.trim()}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5 uppercase"
                >
                  <Crown className="w-4 h-4" />
                  <span>Submit Escalation Appeal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Citizen Rejection Feedback Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-400" />
                Contest Resolution Proof
              </h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Please provide constructive feedback explaining why the issue is not yet resolved. A senior supervisor will review your report.
            </p>

            <form onSubmit={handleRejectResolution} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Reason for Rejection
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g., The pothole was only filled with loose sand and washed away, or the street light bulb is still flickering..."
                  rows={4}
                  className="w-full rounded-md border border-slate-800 bg-slate-950 p-2.5 text-xs text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg shadow-md"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Citizen Evidence Upload Modal */}
      {showEvidenceUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl">
            <EvidenceUploader
              currentLocation={complaint.location}
              uploaderRole="CITIZEN"
              ticketToken={complaint.token}
              onUpload={handleUploadCitizenEvidence}
              onCancel={() => setShowEvidenceUploadModal(false)}
            />
          </div>
        </div>
      )}

    </div>
  );
};
