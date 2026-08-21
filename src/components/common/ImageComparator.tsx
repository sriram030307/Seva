import React, { useState } from 'react';
import { EvidenceRecord, ImageComparisonResult } from '../../types';
import { AIVerificationBadge } from './StatusBadge';
import { 
  CheckCircle2, 
  Sparkles, 
  MapPin, 
  Clock, 
  User, 
  ShieldCheck, 
  AlertTriangle,
  Layers,
  Columns
} from 'lucide-react';

interface ImageComparatorProps {
  citizenEvidence?: EvidenceRecord;
  governmentEvidence?: EvidenceRecord;
  aiVerification?: ImageComparisonResult;
  ticketToken: string;
}

export const ImageComparator: React.FC<ImageComparatorProps> = ({
  citizenEvidence,
  governmentEvidence,
  aiVerification,
  ticketToken
}) => {
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'slider'>('side-by-side');

  if (!citizenEvidence && !governmentEvidence) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center text-slate-400">
        <Layers className="mx-auto h-10 w-10 text-slate-600 mb-2" />
        <p className="text-sm">No photo evidence uploaded yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 shadow-xl">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white tracking-tight">
              Evidence Verification Analysis
            </h3>
            <span className="text-xs font-mono font-bold text-slate-400 px-2 py-0.5 rounded bg-slate-800">
              {ticketToken}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Citizen Reported Problem (Before) vs Government Resolution Proof (After)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {aiVerification && (
            <AIVerificationBadge result={aiVerification.status} score={aiVerification.evidenceMatchScore} />
          )}

          {citizenEvidence && governmentEvidence && (
            <div className="flex items-center rounded-md border border-slate-800 bg-slate-950 p-0.5 text-xs">
              <button
                onClick={() => setViewMode('side-by-side')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  viewMode === 'side-by-side' ? 'bg-slate-800 text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Side by Side
              </button>
              <button
                onClick={() => setViewMode('slider')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  viewMode === 'slider' ? 'bg-slate-800 text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Split Slider
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Visual Comparison Area */}
      <div className="mt-4">
        {viewMode === 'side-by-side' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Citizen BEFORE Image */}
            <div className="flex flex-col rounded-lg border border-slate-800 bg-slate-950 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                  BEFORE: Citizen Evidence
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {citizenEvidence ? '📍 GPS Verified' : 'Pending Upload'}
                </span>
              </div>
              
              <div className="relative h-64 bg-slate-900 flex items-center justify-center overflow-hidden">
                {citizenEvidence ? (
                  <img
                    src={citizenEvidence.imageUrl}
                    alt="Citizen problem evidence"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4 text-slate-500 text-xs">
                    Citizen has not uploaded a photo yet.
                  </div>
                )}
              </div>

              {citizenEvidence && (
                <div className="p-3 text-xs space-y-1.5 border-t border-slate-800 bg-slate-950">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1"><User className="w-3 h-3 text-slate-500" /> Uploaded by:</span>
                    <span className="text-slate-200 font-medium">{citizenEvidence.uploaderName}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-500" /> Captured:</span>
                    <span className="text-slate-200 font-mono">{new Date(citizenEvidence.capturedAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-500" /> Coordinates:</span>
                    <span className="text-slate-200 font-mono text-[11px]">
                      {citizenEvidence.latitude.toFixed(4)}, {citizenEvidence.longitude.toFixed(4)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Government AFTER Image */}
            <div className="flex flex-col rounded-lg border border-slate-800 bg-slate-950 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  AFTER: Resolution Evidence
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {governmentEvidence ? '🛡️ Geo-Tagged Resolution' : 'Awaiting Work'}
                </span>
              </div>
              
              <div className="relative h-64 bg-slate-900 flex items-center justify-center overflow-hidden">
                {governmentEvidence ? (
                  <img
                    src={governmentEvidence.imageUrl}
                    alt="Government resolution evidence"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4 text-slate-500 text-xs">
                    Department is remediating the issue. Resolution photo pending upload.
                  </div>
                )}
              </div>

              {governmentEvidence && (
                <div className="p-3 text-xs space-y-1.5 border-t border-slate-800 bg-slate-950">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1"><User className="w-3 h-3 text-slate-500" /> Field Officer:</span>
                    <span className="text-slate-200 font-medium">{governmentEvidence.uploaderName}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-500" /> Completed:</span>
                    <span className="text-slate-200 font-mono">{new Date(governmentEvidence.capturedAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-500" /> Site Geo-Pin:</span>
                    <span className="text-slate-200 font-mono text-[11px]">
                      {governmentEvidence.latitude.toFixed(4)}, {governmentEvidence.longitude.toFixed(4)}
                    </span>
                  </div>
                  {governmentEvidence.notes && (
                    <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-900 italic">
                      "{governmentEvidence.notes}"
                    </p>
                  )}
                </div>
              )}
            </div>

          </div>
        ) : (
          /* Slider View */
          citizenEvidence && governmentEvidence && (
            <div className="relative h-96 w-full rounded-lg overflow-hidden border border-slate-800 bg-slate-950 select-none">
              <img
                src={governmentEvidence.imageUrl}
                alt="After repair"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div 
                className="absolute inset-0 overflow-hidden border-r-2 border-amber-400"
                style={{ width: `${sliderPos}%` }}
              >
                <img
                  src={citizenEvidence.imageUrl}
                  alt="Before repair"
                  className="absolute inset-0 h-full w-full object-cover max-w-none"
                  style={{ width: '100%', height: '100%' }}
                />
                <span className="absolute top-3 left-3 bg-amber-950/90 text-amber-300 text-xs font-bold px-2 py-1 rounded border border-amber-700">
                  BEFORE (Citizen)
                </span>
              </div>
              <span className="absolute top-3 right-3 bg-emerald-950/90 text-emerald-300 text-xs font-bold px-2 py-1 rounded border border-emerald-700">
                AFTER (Government)
              </span>

              {/* Interactive Range Slider */}
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPos}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
              />
            </div>
          )
        )}

        {/* AI Inspection Technical Card */}
        {aiVerification && (
          <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/90 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  SEVA AI Computer Vision Inspection
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">
                Confidence: {aiVerification.confidence}%
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 my-3 text-center">
              <div className="rounded border border-slate-800 bg-slate-900/60 p-2">
                <div className="text-[10px] text-slate-400 uppercase">Visual Continuity</div>
                <div className="text-sm font-mono font-bold text-white">{aiVerification.visualSimilarityScore}%</div>
              </div>
              <div className="rounded border border-slate-800 bg-slate-900/60 p-2">
                <div className="text-[10px] text-slate-400 uppercase">Location Proximity</div>
                <div className="text-sm font-mono font-bold text-white">{aiVerification.locationMatchScore}%</div>
              </div>
              <div className="rounded border border-slate-800 bg-slate-900/60 p-2">
                <div className="text-[10px] text-slate-400 uppercase">Defect Remediated</div>
                <div className={`text-sm font-mono font-bold ${aiVerification.repairDetected ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {aiVerification.repairDetected ? 'VERIFIED' : 'FAILED'}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded border border-slate-800 leading-relaxed font-sans">
              <strong className="text-amber-400">AI Model Notes:</strong> {aiVerification.analysisNotes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
