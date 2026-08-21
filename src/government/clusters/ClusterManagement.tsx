import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sevaStore } from '../../services/store';
import { IssueCluster, Complaint } from '../../types';
import { PriorityBadge } from '../../components/common/StatusBadge';
import { 
  Layers, 
  MapPin, 
  Users, 
  Flame, 
  AlertTriangle, 
  ArrowRight, 
  Building2, 
  CheckCircle2,
  Send,
  Sparkles
} from 'lucide-react';

export const ClusterManagement: React.FC = () => {
  const navigate = useNavigate();
  const [clusters, setClusters] = useState<IssueCluster[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<IssueCluster | null>(null);

  const loadData = () => {
    const cls = sevaStore.getClusters();
    setClusters(cls);
    setComplaints(sevaStore.getComplaints());
    if (cls.length > 0 && !selectedCluster) {
      setSelectedCluster(cls[0]);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = sevaStore.subscribe(loadData);
    return unsub;
  }, []);

  const clusterComplaints = selectedCluster
    ? complaints.filter(c => selectedCluster.complaintIds.includes(c.id) || c.location.area === selectedCluster.area && c.category === selectedCluster.category)
    : [];

  return (
    <div className="min-h-screen bg-slate-950 pb-16">
      
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-600 text-white font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-black text-white tracking-tight">
                Multi-Report Issue Clusters & Civic Hotspots
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              SEVA AI automatically groups duplicate and nearby citizen complaints into consolidated action hotspots.
            </p>
          </div>

          <span className="text-xs font-mono font-bold text-purple-400 px-3 py-1 rounded bg-slate-900 border border-purple-800">
            {clusters.length} Active Hotspot Clusters
          </span>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left List of Clusters (1 col) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Municipal Hotspots
            </h3>

            <div className="space-y-2.5">
              {clusters.map((cl) => {
                const isSelected = selectedCluster?.id === cl.id;
                return (
                  <div
                    key={cl.id}
                    onClick={() => setSelectedCluster(cl)}
                    className={`rounded-xl border p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-950/30 shadow-lg shadow-purple-950/40'
                        : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-mono font-bold text-purple-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {cl.clusterCode}
                      </span>
                      <PriorityBadge priority={cl.riskLevel} size="sm" />
                    </div>

                    <h4 className="text-xs font-bold text-white line-clamp-1">{cl.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
                      <MapPin className="w-3 h-3 text-amber-400" /> {cl.area}
                    </p>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        <Users className="w-3 h-3" /> {cl.reportCount} Citizen Reports
                      </span>
                      <span className="text-slate-500">{cl.radiusMeters}m radius</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Selected Cluster Breakdown (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {selectedCluster ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl space-y-6">
                
                {/* Cluster Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-purple-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                        CLUSTER: {selectedCluster.clusterCode}
                      </span>
                      <PriorityBadge priority={selectedCluster.riskLevel} />
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight mt-1.5">
                      {selectedCluster.title}
                    </h2>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      📍 {selectedCluster.area}, Chennai • Impact Zone: {selectedCluster.radiusMeters}m
                    </p>
                  </div>

                  <div className="text-right font-mono text-xs">
                    <div className="text-2xl font-black text-amber-400">{selectedCluster.reportCount}</div>
                    <div className="text-[10px] text-slate-500 uppercase">Aggregated Reports</div>
                  </div>
                </div>

                {/* AI Root-Cause Analysis Card */}
                <div className="rounded-lg border border-purple-800/60 bg-purple-950/20 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    SEVA AI Root-Cause Intelligence Summary
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    Multiple distinct citizens have flagged recurring {selectedCluster.category} failure in this {selectedCluster.radiusMeters}m sector. Initial pattern suggests chronic structural wear and storm run-off damage. Single master repair dispatch recommended over fragmented individual visits.
                  </p>
                </div>

                {/* Aggregated Citizen Grievances in this Cluster */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    Consolidated Citizen Tickets ({clusterComplaints.length})
                  </h4>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {clusterComplaints.map((comp) => (
                      <div
                        key={comp.id}
                        onClick={() => navigate(`/government/complaints/${comp.id}`)}
                        className="rounded-lg border border-slate-800 bg-slate-950 p-3 hover:border-slate-700 cursor-pointer transition-colors flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5 max-w-md">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-amber-400">{comp.token}</span>
                            <span className="text-[10px] text-slate-400">By {comp.citizenName}</span>
                          </div>
                          <p className="text-white font-medium line-clamp-1">{comp.title}</p>
                        </div>

                        <button className="text-blue-400 hover:underline text-xs font-semibold shrink-0">
                          Inspect &rarr;
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Master Action Dispatch CTA */}
                <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-slate-400 font-mono">
                    Responsible: <strong className="text-slate-200">{selectedCluster.departmentName}</strong>
                  </div>

                  <button
                    onClick={() => {
                      if (clusterComplaints.length > 0) {
                        navigate(`/government/complaints/${clusterComplaints[0].id}`);
                      }
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-purple-900/40 flex items-center justify-center gap-2 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    <span>Dispatch Master Remediation Crew</span>
                  </button>
                </div>

              </div>
            ) : null}
          </div>

        </div>

      </main>

    </div>
  );
};
