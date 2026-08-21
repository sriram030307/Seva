import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sevaStore } from '../../services/store';
import { Complaint, ComplaintStatus, UserProfile } from '../../types';
import { StatusBadge, PriorityBadge, SlaBadge, AIVerificationBadge } from '../../components/common/StatusBadge';
import { ImageComparator } from '../../components/common/ImageComparator';
import { EvidenceUploader } from '../../components/common/EvidenceUploader';
import { SlaDetailCard } from '../components/SlaDetailCard';
import { 
  ArrowLeft, 
  UserCheck, 
  Camera, 
  MapPin, 
  Clock, 
  Building2, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  History, 
  FileText,
  ShieldAlert,
  Play,
  Check,
  Send,
  AlertCircle
} from 'lucide-react';

export const ComplaintDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = sevaStore.getCurrentUser();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [showResolutionUploader, setShowResolutionUploader] = useState(false);
  const [selectedOfficerId, setSelectedOfficerId] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const officers = sevaStore.getAllDemoUsers().filter(u => u.role === 'OFFICER' || u.role === 'DEPARTMENT_ADMIN' || u.role === 'SUPERVISOR');

  const loadData = () => {
    if (!id) return;
    const found = sevaStore.getComplaintById(id);
    if (found) {
      setComplaint(found);
      setSelectedOfficerId(found.assignedOfficerId || '');
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
        <h2 className="text-base font-bold text-white mb-2">Complaint Record Not Found</h2>
        <button
          onClick={() => navigate('/government/complaints')}
          className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded"
        >
          &larr; Back to Registry
        </button>
      </div>
    );
  }

  // Assign Officer
  const handleAssignOfficer = () => {
    if (!selectedOfficerId) return;
    sevaStore.assignOfficer(complaint.id, selectedOfficerId);
  };

  // Start In Progress Work
  const handleStartWork = () => {
    sevaStore.updateStatus(
      complaint.id, 
      'IN_PROGRESS', 
      `Field remediation work initiated by ${currentUser.name}. Repair crew dispatched to site.`
    );
  };

  // Submit Resolution Evidence
  const handleUploadResolutionEvidence = async (evidence: any) => {
    setIsProcessing(true);
    setShowResolutionUploader(false);

    try {
      await sevaStore.submitResolutionEvidence(complaint.id, currentUser.id, {
        ...evidence,
        uploaderName: currentUser.name
      });
      setIsProcessing(false);
    } catch (e) {
      console.error(e);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      
      {/* Top Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 px-4 py-3 sm:px-6 sticky top-16 z-30 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <button
            onClick={() => navigate('/government/complaints')}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Complaints</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-amber-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
              {complaint.token}
            </span>
            <PriorityBadge priority={complaint.priority} size="sm" />
            <StatusBadge status={complaint.status} mode="government" size="sm" />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 space-y-6">
        
        {/* Citizen Contested Alert Banner */}
        {complaint.status === 'RESOLUTION_REJECTED' && (
          <div className="rounded-2xl border-2 border-rose-600 bg-rose-950/40 p-5 shadow-xl space-y-3 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-rose-600 text-white font-bold shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-rose-200 uppercase tracking-wider">
                  Citizen Contested Resolution — Re-inspection Required
                </h3>
                <p className="text-xs text-rose-300 leading-relaxed">
                  The reporting citizen has rejected the uploaded remediation evidence. Please review the citizen's audit feedback below and dispatch a senior field supervisor.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleStartWork}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow-md"
              >
                Re-Open & Restart Remediation
              </button>
            </div>
          </div>
        )}

        {/* Operational Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Complaint Details & Citizen Telemetry (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Main Overview Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl space-y-4">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    {complaint.title}
                  </h2>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-3 font-mono">
                    <span>Category: <strong className="text-slate-200">{complaint.category}</strong></span>
                    <span>Subcategory: <strong className="text-slate-200">{complaint.subcategory}</strong></span>
                  </div>
                </div>

                <SlaBadge slaStatus={complaint.slaStatus} />
              </div>

              {/* AI Voice Transcript & Semantic Breakdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Citizen Voice Transcript & AI Intelligence
                  </span>
                  {complaint.confidenceScore && (
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">
                      Confidence: {complaint.confidenceScore}%
                    </span>
                  )}
                </div>

                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-xs leading-relaxed space-y-2">
                  <div className="text-slate-300">
                    <strong className="text-slate-400 block mb-0.5">Raw Citizen Dialogue:</strong>
                    "{complaint.description}"
                  </div>

                  <div className="text-slate-300 pt-2 border-t border-slate-900">
                    <strong className="text-amber-400 block mb-0.5">AI Executive Summary:</strong>
                    {complaint.aiSummary}
                  </div>
                </div>
              </div>

              {/* Geo-Location Box */}
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs space-y-1 font-mono">
                <div className="text-slate-300 font-bold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  Site Location:
                </div>
                <div className="text-slate-400">{complaint.location.address}</div>
                <div className="text-[11px] text-slate-500">
                  GPS: {complaint.location.latitude.toFixed(6)}, {complaint.location.longitude.toFixed(6)} • Ward / Zone: {complaint.location.area}
                </div>
              </div>

            </div>

            {/* Evidence Comparison & AI Visual Verification */}
            <ImageComparator
              citizenEvidence={complaint.citizenEvidence}
              governmentEvidence={complaint.governmentEvidence}
              aiVerification={complaint.aiVerification}
              ticketToken={complaint.token}
            />

            {/* Audit History Log */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <History className="w-4 h-4 text-blue-400" />
                Immutable Operational Audit Log
              </h3>

              <div className="space-y-2.5 relative before:absolute before:inset-0 before:left-2 before:w-0.5 before:bg-slate-800">
                {(complaint.auditTrail || sevaStore.getAuditLogsForComplaint(complaint.id) || []).map((item) => (
                  <div key={item.id} className="relative flex items-start gap-3 pl-5 text-xs">
                    <div className="absolute left-1 top-1.5 h-2 w-2 rounded-full bg-blue-400 ring-2 ring-slate-950" />
                    <div className="flex-1 rounded border border-slate-800 bg-slate-950 p-2.5">
                      <div className="flex items-center justify-between text-slate-400 mb-0.5">
                        <span className="font-bold text-slate-200">{item.action?.replace(/_/g, ' ') || 'ACTION'}</span>
                        <span className="font-mono text-[10px]">{item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A'}</span>
                      </div>
                      <p className="text-slate-300">{item.details}</p>
                      <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                        Officer: {item.performedBy || item.userName || 'System'} ({item.performedByRole || item.role || 'OFFICER'})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Dispatch & Remediation Actions (1 col) */}
          <div className="space-y-6">
            
            {/* Officer Assignment Control */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-400" />
                Field Officer Assignment
              </h3>

              <div className="space-y-2">
                <label className="text-xs text-slate-400 block">Assigned Specialist:</label>
                <select
                  value={selectedOfficerId}
                  onChange={(e) => setSelectedOfficerId(e.target.value)}
                  className="w-full rounded border border-slate-800 bg-slate-950 p-2 text-xs text-white"
                >
                  <option value="">Unassigned...</option>
                  {officers.map((off) => (
                    <option key={off.id} value={off.id}>
                      {off.name} — {off.departmentName}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleAssignOfficer}
                  disabled={!selectedOfficerId || selectedOfficerId === complaint.assignedOfficerId}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-xs rounded transition-colors"
                >
                  Confirm Assignment
                </button>
              </div>

              {complaint.assignedOfficerName && (
                <div className="pt-2 border-t border-slate-800/80 text-xs font-mono text-slate-400">
                  Currently assigned to: <strong className="text-slate-200">{complaint.assignedOfficerName}</strong>
                </div>
              )}
            </div>

            {/* Workflow Progression Controls */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Play className="w-4 h-4 text-amber-400" />
                Remediation Workflow
              </h3>

              <div className="space-y-2.5">
                
                {/* Step 1: Start Work */}
                {complaint.status === 'ASSIGNED' && (
                  <button
                    onClick={handleStartWork}
                    className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow-md transition-colors"
                  >
                    ▶️ Start In-Progress Remediation
                  </button>
                )}

                {/* Step 2: Upload Resolution Evidence */}
                {(complaint.status === 'IN_PROGRESS' || complaint.status === 'AWAITING_RESOLUTION_EVIDENCE' || complaint.status === 'RESOLUTION_REJECTED') && (
                  <button
                    onClick={() => setShowResolutionUploader(true)}
                    className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-md flex items-center justify-center gap-2 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Upload Resolution Photo (Trigger AI)</span>
                  </button>
                )}

                {/* Step 3: Awaiting Citizen Verification */}
                {complaint.status === 'AWAITING_CITIZEN_VERIFICATION' && (
                  <div className="rounded-lg border border-amber-500/60 bg-amber-950/30 p-3 text-xs text-amber-300 font-mono">
                    ⏳ Resolution evidence submitted. Waiting for reporting citizen to verify on their portal.
                  </div>
                )}

                {/* Step 4: Resolved */}
                {complaint.status === 'RESOLVED' && (
                  <div className="rounded-lg border border-emerald-500/60 bg-emerald-950/30 p-3 text-xs text-emerald-300 font-mono flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Ticket officially closed & verified.</span>
                  </div>
                )}

              </div>
            </div>

            {/* Interactive SLA Countdown & Velocity Card */}
            <SlaDetailCard complaint={complaint} onUpdate={loadData} />

          </div>

        </div>

      </main>

      {/* Resolution Photo Upload Modal */}
      {showResolutionUploader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl">
            <EvidenceUploader
              currentLocation={complaint.location}
              uploaderRole="OFFICER"
              ticketToken={complaint.token}
              onUpload={handleUploadResolutionEvidence}
              onCancel={() => setShowResolutionUploader(false)}
            />
          </div>
        </div>
      )}

    </div>
  );
};
