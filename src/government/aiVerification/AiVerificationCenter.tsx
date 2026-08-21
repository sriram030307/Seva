import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Eye, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Sparkles, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Camera, 
  Check, 
  X, 
  RefreshCw,
  Search,
  ExternalLink,
  Layers,
  FileText,
  Crown,
  Building2,
  Send,
  AlertCircle
} from 'lucide-react';
import { sevaStore } from '../../services/store';
import { Complaint, AIVerificationResult, DepartmentHeadRecommendation, AdminDecisionType } from '../../types';
import { sevaAiVisionService } from '../../services/aiVisionService';

export const AiVerificationCenter: React.FC = () => {
  const navigate = useNavigate();
  const complaints = sevaStore.getComplaints();
  const currentUser = sevaStore.getCurrentUser();

  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING_DEPT_REVIEW' | 'PENDING_ADMIN_DECISION' | 'RESOLVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [reAnalyzingId, setReAnalyzingId] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Recommendation modal state for Dept Head
  const [deptHeadModalComp, setDeptHeadModalComp] = useState<Complaint | null>(null);
  const [deptHeadRec, setDeptHeadRec] = useState<DepartmentHeadRecommendation>('APPROVE_FOR_ADMIN_REVIEW');
  const [deptHeadReason, setDeptHeadReason] = useState('');

  // Admin Decision modal state
  const [adminModalComp, setAdminModalComp] = useState<Complaint | null>(null);
  const [adminDecision, setAdminDecision] = useState<AdminDecisionType>('APPROVE_RESOLUTION');
  const [adminReason, setAdminReason] = useState('');

  const isAdmin = currentUser.role === 'ADMIN';
  const isDeptHead = currentUser.role === 'DEPARTMENT_ADMIN' || currentUser.role === 'ADMIN';

  // Evidence cases that have both citizen and government evidence or are in review
  const evidenceCases = complaints.filter((c) => {
    const hasEvidence = Boolean(c.citizenEvidence && c.governmentEvidence);
    if (filterStatus === 'PENDING_DEPT_REVIEW') return hasEvidence && (!c.departmentHeadReviewStatus || c.departmentHeadReviewStatus === 'PENDING');
    if (filterStatus === 'PENDING_ADMIN_DECISION') return hasEvidence && c.departmentHeadReviewStatus === 'RECOMMENDED' && (!c.adminReviewStatus || c.adminReviewStatus === 'PENDING');
    if (filterStatus === 'RESOLVED') return c.status === 'RESOLVED' || c.status === 'CLOSED';
    return hasEvidence;
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

  const handleReRunAiVerification = async (c: Complaint) => {
    if (!c.citizenEvidence || !c.governmentEvidence) return;
    setReAnalyzingId(c.id);

    try {
      const result = await sevaAiVisionService.compareEvidence(c.citizenEvidence, c.governmentEvidence);
      await sevaStore.verifyAiResolution(c.id, result);
      setActionSuccessMsg(`AI Vision Re-Analysis completed for ${c.token}: Status ${result.result || result.status} (${result.confidence}% confidence).`);
      setTimeout(() => setActionSuccessMsg(''), 5000);
    } catch (e) {
      console.error('Error in AI verification:', e);
    } finally {
      setReAnalyzingId(null);
    }
  };

  const handleSubmitDeptHeadRec = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptHeadModalComp || !deptHeadReason.trim()) return;

    sevaStore.submitDepartmentHeadRecommendation(deptHeadModalComp.id, {
      recommendation: deptHeadRec,
      reason: deptHeadReason.trim()
    });

    setActionSuccessMsg(`Recommendation [${deptHeadRec.replace(/_/g, ' ')}] submitted for ${deptHeadModalComp.token}. Forwarded to Main Admin.`);
    setDeptHeadModalComp(null);
    setDeptHeadReason('');
    setTimeout(() => setActionSuccessMsg(''), 5000);
  };

  const handleSubmitAdminDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminModalComp || !adminReason.trim()) return;

    sevaStore.submitAdminFinalDecision(adminModalComp.id, {
      decision: adminDecision,
      reason: adminReason.trim()
    });

    setActionSuccessMsg(`Main Admin Final Decision [${adminDecision.replace(/_/g, ' ')}] logged for ${adminModalComp.token}.`);
    setAdminModalComp(null);
    setAdminReason('');
    setTimeout(() => setActionSuccessMsg(''), 5000);
  };

  const getStatusBadge = (status?: AIVerificationResult) => {
    switch (status) {
      case 'MATCHED':
      case 'LIKELY_RESOLVED':
        return <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-bold">✓ DEFINITIVE MATCH</span>;
      case 'LIKELY_MATCH':
      case 'POSSIBLY_RESOLVED':
        return <span className="px-2.5 py-1 rounded-full bg-blue-950 text-blue-300 border border-blue-800 text-[11px] font-bold">✓ LIKELY MATCH</span>;
      case 'UNCERTAIN':
        return <span className="px-2.5 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[11px] font-bold">⚠ UNCERTAIN REPAIR</span>;
      case 'MISMATCH':
      case 'NOT_RESOLVED':
        return <span className="px-2.5 py-1 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-[11px] font-bold">✕ EVIDENCE MISMATCH</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-[11px] font-medium">PENDING ANALYSIS</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              Geo-Tagged Resolution Verification Command Center
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 font-mono">
                {evidenceCases.length} Active Records
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Multi-modal AI comparison with Department Head Recommendation and Main Admin Final Authority
            </p>
          </div>
        </div>

        {/* Multi-Level Authority Rule Indicator */}
        <div className="flex items-center gap-2 text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300">
          <Crown className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Final Decision Authority: <strong className="text-amber-300">Main Administrator</strong></span>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-3 rounded-xl bg-blue-950/80 border border-blue-800 text-blue-300 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterStatus === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Evidence Pairs
          </button>
          <button
            onClick={() => setFilterStatus('PENDING_DEPT_REVIEW')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterStatus === 'PENDING_DEPT_REVIEW' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Pending Dept Head Review
          </button>
          <button
            onClick={() => setFilterStatus('PENDING_ADMIN_DECISION')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterStatus === 'PENDING_ADMIN_DECISION' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Pending Admin Decision
          </button>
          <button
            onClick={() => setFilterStatus('RESOLVED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterStatus === 'RESOLVED' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Approved & Closed
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search ticket, title, area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Evidence Cards List */}
      <div className="space-y-6">
        {evidenceCases.map((c) => {
          const ai = c.aiVerification;
          const isReAnalyzing = reAnalyzingId === c.id;

          return (
            <div key={c.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 shadow-xl">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-amber-400 px-2.5 py-1 rounded bg-slate-950 border border-slate-800">
                    {c.token}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white">{c.title}</h3>
                    <p className="text-xs text-slate-400">
                      {c.departmentName} • {c.location.area}, {c.location.city}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge(ai?.status)}
                  <button
                    onClick={() => handleReRunAiVerification(c)}
                    disabled={isReAnalyzing}
                    className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 transition-colors disabled:opacity-50"
                    title="Re-run AI Multi-Modal Verification"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isReAnalyzing ? 'animate-spin text-blue-400' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Side-by-Side Visual Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Citizen Before Evidence */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5 text-amber-400">
                      <Camera className="w-3.5 h-3.5" />
                      BEFORE: Citizen Baseline Evidence
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {c.citizenEvidence?.capturedAt ? new Date(c.citizenEvidence.capturedAt).toLocaleString('en-IN') : 'Logged'}
                    </span>
                  </div>

                  <div className="relative h-48 rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
                    <img
                      src={c.citizenEvidence?.imageUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600'}
                      alt="Citizen Evidence"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-slate-950/80 backdrop-blur-sm text-[10px] font-mono text-slate-300 border border-slate-700 flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-amber-400" />
                      <span>{c.citizenEvidence?.latitude.toFixed(4)}, {c.citizenEvidence?.longitude.toFixed(4)}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Uploaded by: <strong className="text-slate-300">{c.citizenName}</strong></span>
                    <span className="text-emerald-400 font-medium">✓ GPS Verified</span>
                  </div>
                </div>

                {/* Government Resolution After Evidence */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      AFTER: Government Resolution Evidence
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {c.governmentEvidence?.capturedAt ? new Date(c.governmentEvidence.capturedAt).toLocaleString('en-IN') : 'Uploaded'}
                    </span>
                  </div>

                  <div className="relative h-48 rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
                    <img
                      src={c.governmentEvidence?.imageUrl || 'https://images.unsplash.com/photo-1541888946425-d0fbb180ef6f?w=600'}
                      alt="Government Resolution Evidence"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-slate-950/80 backdrop-blur-sm text-[10px] font-mono text-slate-300 border border-slate-700 flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-emerald-400" />
                      <span>{c.governmentEvidence?.latitude.toFixed(4)}, {c.governmentEvidence?.longitude.toFixed(4)}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Officer: <strong className="text-slate-300">{c.assignedOfficerName || 'Field Unit'}</strong></span>
                    <span className="text-emerald-400 font-medium">✓ Geo-Tagged Upload</span>
                  </div>
                </div>
              </div>

              {/* AI Vision Multi-Metric Scorecard */}
              {ai && (
                <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span className="flex items-center gap-1.5 text-blue-400">
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Assistive Vision Analysis & Metric Verification
                    </span>
                    <span className="font-mono text-slate-400 text-[11px]">
                      Confidence: <strong className="text-blue-300">{ai.confidence}%</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">Visual Match</span>
                      <span className="text-sm font-bold text-blue-400 font-mono">{ai.visualSimilarityScore || Math.round(ai.visualSimilarity * 100)}%</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">GPS Proximity</span>
                      <span className="text-sm font-bold text-emerald-400 font-mono">{ai.locationMatchScore || Math.round(ai.locationConsistency * 100)}%</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">Repair Detected</span>
                      <span className={`text-sm font-bold ${ai.repairDetected ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {ai.repairDetected ? 'YES' : 'NO'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">Evidence Match</span>
                      <span className="text-sm font-bold text-purple-400 font-mono">{ai.evidenceMatchScore || Math.round(ai.overallConfidence * 100)}%</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                    <strong className="text-slate-400 font-semibold block mb-0.5">Engineering & AI Synthesis:</strong>
                    {ai.analysisNotes || ai.reason}
                  </div>
                </div>
              )}

              {/* Department Head & Admin Status Ribbon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Dept Head Recommendation Status */}
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-950 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-300 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-purple-400" />
                      Dept Head Recommendation
                    </span>
                    <span className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold ${
                      c.departmentHeadReviewStatus === 'RECOMMENDED' ? 'bg-purple-950 text-purple-400 border border-purple-800' : 'bg-slate-900 text-slate-400'
                    }`}>
                      {c.departmentHeadReviewStatus || 'PENDING'}
                    </span>
                  </div>
                  {c.departmentHeadRecommendation ? (
                    <div className="text-slate-300 text-[11px] pt-1">
                      <strong>Recommendation:</strong> {c.departmentHeadRecommendation.replace(/_/g, ' ')}
                      <p className="text-slate-400 text-[10px] mt-0.5">{c.departmentHeadReviewReason}</p>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-[10px]">Awaiting Department Head review of evidence pair.</p>
                  )}
                </div>

                {/* Main Admin Final Decision Status */}
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-950 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300 flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      Main Admin Executive Final Decision
                    </span>
                    <span className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold ${
                      c.adminReviewStatus === 'APPROVED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                      c.adminReviewStatus === 'REJECTED' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                      'bg-slate-900 text-slate-400'
                    }`}>
                      {c.adminReviewStatus || 'PENDING'}
                    </span>
                  </div>
                  {c.adminDecision ? (
                    <div className="text-slate-300 text-[11px] pt-1">
                      <strong>Final Decision:</strong> {c.adminDecision.replace(/_/g, ' ')}
                      <p className="text-slate-400 text-[10px] mt-0.5">{c.adminDecisionReason}</p>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-[10px]">Main Admin final decision required to close complaint.</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => navigate(`/government/complaints/${c.id}`)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs text-slate-300 flex items-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>Ticket Details & Audit</span>
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Dept Head Button */}
                  {isDeptHead && (
                    <button
                      onClick={() => setDeptHeadModalComp(c)}
                      className="px-3.5 py-1.5 rounded-lg border border-purple-800 bg-purple-950/60 hover:bg-purple-900/80 text-xs font-semibold text-purple-200 flex items-center gap-1.5 transition-colors"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Dept Head Recommendation</span>
                    </button>
                  )}

                  {/* Main Admin Final Decision Button */}
                  {isAdmin && (
                    <button
                      onClick={() => setAdminModalComp(c)}
                      className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      <span>Main Admin Final Decision</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {evidenceCases.length === 0 && (
          <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/40">
            <Camera className="w-12 h-12 text-blue-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No Evidence Pairs Awaiting Verification</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              When field officers submit resolution photographs, multi-modal AI vision will automatically pair and analyze them here.
            </p>
          </div>
        )}
      </div>

      {/* Dept Head Recommendation Modal */}
      {deptHeadModalComp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-400" />
                Department Head Recommendation
              </h3>
              <button
                onClick={() => setDeptHeadModalComp(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-1">
              <p>Ticket: <strong className="text-amber-400">{deptHeadModalComp.token}</strong> — {deptHeadModalComp.title}</p>
              <p className="text-slate-400 text-[11px]">Note: The Department Head submits a recommendation. Final decision is rendered by Main Admin.</p>
            </div>

            <form onSubmit={handleSubmitDeptHeadRec} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Recommendation:</label>
                <select
                  value={deptHeadRec}
                  onChange={(e) => setDeptHeadRec(e.target.value as DepartmentHeadRecommendation)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="APPROVE_FOR_ADMIN_REVIEW">Approve Resolution (Recommend Admin Approval)</option>
                  <option value="REJECT_REQUEST_MORE_EVIDENCE">Reject Resolution (Request More Evidence)</option>
                  <option value="FIELD_INSPECTION_REQUIRED">Request Senior Field Inspection</option>
                  <option value="NOT_RESOLVED">Mark as Unresolved / Defective Remediation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Engineering Justification & Assessment Notes:</label>
                <textarea
                  rows={3}
                  required
                  value={deptHeadReason}
                  onChange={(e) => setDeptHeadReason(e.target.value)}
                  placeholder="Provide technical evaluation of the repair quality, road level alignment, materials used..."
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeptHeadModalComp(null)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg"
                >
                  <Send className="w-3.5 h-3.5" />
                  Forward to Main Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Admin Final Decision Modal */}
      {adminModalComp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border-2 border-amber-500/80 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                Main Admin Executive Final Decision
              </h3>
              <button
                onClick={() => setAdminModalComp(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 text-xs text-amber-300">
              <strong>Apex Authority:</strong> Main Admin holds exclusive final authority to approve resolution and notify the citizen.
            </div>

            <form onSubmit={handleSubmitAdminDecision} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Executive Final Decision:</label>
                <select
                  value={adminDecision}
                  onChange={(e) => setAdminDecision(e.target.value as AdminDecisionType)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none font-medium"
                >
                  <option value="APPROVE_RESOLUTION">Approve Resolution (Close Complaint & Notify Citizen)</option>
                  <option value="REJECT_RESOLUTION">Reject Resolution (Remediation Ineffective)</option>
                  <option value="REQUEST_FIELD_INSPECTION">Order Mandatory Field Physical Inspection</option>
                  <option value="REQUEST_MORE_EVIDENCE">Request Additional Detailed Evidence</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Executive Decision Justification:</label>
                <textarea
                  rows={3}
                  required
                  value={adminReason}
                  onChange={(e) => setAdminReason(e.target.value)}
                  placeholder="State municipal justification and closing notes..."
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAdminModalComp(null)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                >
                  <Crown className="w-3.5 h-3.5" />
                  Execute Final Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
