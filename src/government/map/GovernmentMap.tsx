import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sevaStore } from '../../services/store';
import { Complaint, IssueCluster, Department } from '../../types';
import { MapLeaflet } from '../../components/common/MapLeaflet';
import { PriorityBadge, StatusBadge } from '../../components/common/StatusBadge';
import { 
  Layers, 
  MapPin, 
  Filter, 
  Building2, 
  AlertTriangle, 
  ExternalLink,
  Flame,
  ShieldCheck
} from 'lucide-react';

export const GovernmentMap: React.FC = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [clusters, setClusters] = useState<IssueCluster[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  const chennaiCenter: [number, number] = [12.9750, 80.2100];

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

  const filteredComplaints = complaints.filter((c) => {
    if (selectedDept !== 'ALL' && c.departmentId !== selectedDept) return false;
    if (selectedPriority !== 'ALL' && c.priority !== selectedPriority) return false;
    if (selectedStatus === 'ACTIVE' && (c.status === 'RESOLVED' || c.status === 'CLOSED')) return false;
    if (selectedStatus === 'RESOLVED' && c.status !== 'RESOLVED' && c.status !== 'CLOSED') return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      
      {/* Control Filter Bar */}
      <div className="border-b border-slate-800 bg-slate-900/90 px-4 py-3 sm:px-6 sticky top-16 z-30 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-blue-400" /> GIS Command Map:
            </span>

            {/* Department Filter */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-white rounded px-2.5 py-1 text-xs focus:border-blue-500 font-medium"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-white rounded px-2.5 py-1 text-xs focus:border-blue-500 font-medium"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">🔴 Critical Only</option>
              <option value="HIGH">🟠 High Only</option>
              <option value="MEDIUM">🟡 Medium Only</option>
              <option value="LOW">🟢 Low Only</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-white rounded px-2.5 py-1 text-xs focus:border-blue-500 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Unresolved</option>
              <option value="RESOLVED">Resolved Only</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>Live Pins: <strong className="text-white">{filteredComplaints.length}</strong></span>
            <span>• Hotspot Clusters: <strong className="text-purple-400">{clusters.length}</strong></span>
          </div>

        </div>
      </div>

      {/* Main Map + Inspector Panel */}
      <div className="mx-auto max-w-7xl w-full p-4 sm:p-6 flex-1 flex flex-col lg:flex-row gap-6 min-w-0 min-h-0">
        
        {/* Full Map */}
        <div className="flex-1 flex flex-col space-y-2 min-w-0 min-h-0">
          <MapLeaflet
            center={chennaiCenter}
            zoom={13}
            complaints={filteredComplaints}
            clusters={clusters}
            onSelectComplaint={(comp) => setSelectedComplaint(comp)}
            heightClass="h-[450px] sm:h-[540px] lg:h-[620px]"
          />
        </div>

        {/* Selected Incident Drawer */}
        <div className="w-full lg:w-96 flex flex-col rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl shrink-0 justify-between">
          {selectedComplaint ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-mono font-bold text-amber-400 bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800">
                  {selectedComplaint.token}
                </span>
                <PriorityBadge priority={selectedComplaint.priority} size="sm" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-white leading-snug">
                  {selectedComplaint.title}
                </h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  {selectedComplaint.aiSummary || selectedComplaint.description}
                </p>
              </div>

              {/* GIS Metadata */}
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs space-y-1.5 font-mono">
                <div className="text-slate-400">📍 <span className="text-slate-200">{selectedComplaint.location.address}</span></div>
                <div className="text-slate-400">🏛️ <span className="text-slate-200">{selectedComplaint.departmentName}</span></div>
                <div className="text-slate-400">👤 Officer: <span className="text-slate-200">{selectedComplaint.assignedOfficerName || 'UNASSIGNED'}</span></div>
                <div className="text-slate-400">👥 Citizen Reports: <span className="text-amber-400 font-bold">{selectedComplaint.relatedReportCount}</span></div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-400">Current Status:</span>
                <StatusBadge status={selectedComplaint.status} mode="government" size="sm" />
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-800">
                <button
                  onClick={() => navigate(`/government/complaints/${selectedComplaint.id}`)}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded shadow transition-colors"
                >
                  Open Incident Workspace &rarr;
                </button>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${selectedComplaint.location.latitude},${selectedComplaint.location.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 bg-slate-950 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium rounded flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                  <span>Open in Google Maps</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-6 text-slate-400 my-auto">
              <MapPin className="h-10 w-10 text-slate-600 mb-2 animate-bounce" />
              <h4 className="text-sm font-bold text-slate-200">Select GIS Incident Marker</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Click on any map pin or multi-citizen cluster to inspect coordinates, assigned field personnel, and SLA timeline.
              </p>
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[10px] text-slate-500 text-center font-mono">
            🏛️ SEVA GIS Engine • Greater Chennai Municipal Corporation
          </div>
        </div>

      </div>
    </div>
  );
};
