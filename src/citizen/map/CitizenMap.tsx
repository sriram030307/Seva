import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sevaStore } from '../../services/store';
import { Complaint, IssueCluster, CivicCategory, PriorityLevel, GeoLocation } from '../../types';
import { MapLeaflet } from '../../components/common/MapLeaflet';
import { PriorityBadge, StatusBadge } from '../../components/common/StatusBadge';
import { 
  Layers, 
  Filter, 
  MapPin, 
  Mic, 
  ExternalLink, 
  AlertTriangle, 
  PlusCircle, 
  CheckCircle2, 
  Clock,
  ChevronRight,
  RefreshCw,
  Search
} from 'lucide-react';

export const CitizenMap: React.FC = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [clusters, setClusters] = useState<IssueCluster[]>([]);
  const [selectedRadiusKm, setSelectedRadiusKm] = useState<number>(5);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ACTIVE');
  const [selectedIssue, setSelectedIssue] = useState<Complaint | null>(null);

  const [userLocation, setUserLocation] = useState<GeoLocation>({
    latitude: 12.9647,
    longitude: 80.1961,
    address: 'Madipakkam Main Road, Chennai',
    area: 'Madipakkam',
    landmark: 'Near Koot Road Signal',
    city: 'Chennai',
    state: 'Tamil Nadu'
  });

  const loadData = () => {
    setComplaints(sevaStore.getComplaints());
    setClusters(sevaStore.getClusters());
  };

  useEffect(() => {
    loadData();
    const unsub = sevaStore.subscribe(loadData);
    return unsub;
  }, []);

  // Filter complaints based on Distance, Category, Priority, and Status
  const filteredComplaints = complaints.filter((c) => {
    // Distance filter
    const dist = sevaStore.calculateDistanceMeters(
      userLocation.latitude,
      userLocation.longitude,
      c.location.latitude,
      c.location.longitude
    );
    if (dist > selectedRadiusKm * 1000) return false;

    // Category filter
    if (selectedCategory !== 'ALL' && c.category !== selectedCategory) return false;

    // Priority filter
    if (selectedPriority !== 'ALL' && c.priority !== selectedPriority) return false;

    // Status filter
    if (selectedStatus === 'ACTIVE' && (c.status === 'RESOLVED' || c.status === 'CLOSED')) return false;
    if (selectedStatus === 'RESOLVED' && c.status !== 'RESOLVED' && c.status !== 'CLOSED') return false;

    return true;
  });

  const categories: Array<{ id: string; label: string }> = [
    { id: 'ALL', label: 'All Categories' },
    { id: 'ROAD', label: 'Roads & Works' },
    { id: 'WATER', label: 'Water & Sewage' },
    { id: 'ELECTRICITY', label: 'Electricity' },
    { id: 'GARBAGE', label: 'Sanitation' },
    { id: 'TRANSPORT', label: 'Transport' },
    { id: 'HEALTHCARE', label: 'Health' },
    { id: 'DISASTER', label: 'Disaster' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      
      {/* Control Filter Bar */}
      <div className="border-b border-slate-800 bg-slate-900/90 px-4 py-3 sm:px-6 sticky top-16 z-30 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3">
          
          {/* Distance Filter Pills */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono font-bold text-slate-400 mr-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-400" /> Radius:
            </span>
            {[1, 2, 5, 10].map((km) => (
              <button
                key={km}
                onClick={() => setSelectedRadiusKm(km)}
                className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-colors ${
                  selectedRadiusKm === km
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-800'
                }`}
              >
                {km} km
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-white rounded-md px-2.5 py-1 text-xs focus:outline-none focus:border-amber-500 font-medium"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-white rounded-md px-2.5 py-1 text-xs focus:outline-none focus:border-amber-500 font-medium"
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
              className="bg-slate-950 border border-slate-800 text-white rounded-md px-2.5 py-1 text-xs focus:outline-none focus:border-amber-500 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Unresolved</option>
              <option value="RESOLVED">Resolved Only</option>
            </select>
          </div>

          {/* Quick Voice CTA */}
          <button
            onClick={() => navigate('/citizen/voice')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/20"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Report in This Area</span>
          </button>

        </div>
      </div>

      {/* Main Map + Side Details Area */}
      <div className="mx-auto max-w-7xl w-full p-4 sm:p-6 flex-1 flex flex-col lg:flex-row gap-6 min-w-0 min-h-0">
        
        {/* Full Interactive Map */}
        <div className="flex-1 flex flex-col space-y-3 min-w-0 min-h-0">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono">
              Displaying <strong className="text-white">{filteredComplaints.length}</strong> verified civic issues within {selectedRadiusKm} km of {userLocation.area}
            </span>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500"></span> Critical</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-500"></span> High</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-500"></span> Medium</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500"></span> Low</span>
            </div>
          </div>

          <MapLeaflet
            center={[userLocation.latitude, userLocation.longitude]}
            zoom={14}
            complaints={filteredComplaints}
            clusters={clusters}
            userLocation={userLocation}
            radiusKm={selectedRadiusKm}
            onSelectComplaint={(comp) => setSelectedIssue(comp)}
            heightClass="h-[450px] sm:h-[540px] lg:h-[600px]"
          />
        </div>

        {/* Selected Issue Drawer / Sidebar */}
        <div className="w-full lg:w-96 flex flex-col rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl shrink-0 justify-between">
          {selectedIssue ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-mono font-bold text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {selectedIssue.token}
                </span>
                <PriorityBadge priority={selectedIssue.priority} size="sm" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-white leading-snug">
                  {selectedIssue.title}
                </h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  {selectedIssue.aiSummary || selectedIssue.description}
                </p>
              </div>

              {/* Geo & Department Metadata */}
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs space-y-1.5 font-mono">
                <div className="text-slate-400">
                  📍 <span className="text-slate-200">{selectedIssue.location.address}</span>
                </div>
                <div className="text-slate-400">
                  🏛️ <span className="text-slate-200">{selectedIssue.departmentName}</span>
                </div>
                <div className="text-slate-400">
                  👥 <span className="text-amber-400 font-bold">{selectedIssue.relatedReportCount} citizen reports</span>
                </div>
                <div className="text-slate-400">
                  ⏱️ First reported: <span className="text-slate-200">{new Date(selectedIssue.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-400">Resolution Status:</span>
                <StatusBadge status={selectedIssue.status} mode="citizen" size="sm" />
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-3 border-t border-slate-800">
                <button
                  onClick={() => navigate(`/citizen/reports/${selectedIssue.id}`)}
                  className="w-full py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded hover:bg-amber-400 transition-colors shadow-md shadow-amber-500/20"
                >
                  View Details & Evidence &rarr;
                </button>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${selectedIssue.location.latitude},${selectedIssue.location.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 bg-slate-950 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium rounded flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                  <span>Open in Google Maps</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-6 text-slate-400 my-auto">
              <MapPin className="h-10 w-10 text-slate-600 mb-2 animate-bounce" />
              <h4 className="text-sm font-bold text-slate-200">Select an Issue Marker</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Click on any map pin or cluster hotspot to inspect verified civic status, reports count, and repair progress.
              </p>
            </div>
          )}

          {/* Privacy Note */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[10px] text-slate-500 text-center font-mono">
            🔒 Citizen privacy protected: Personal contact numbers and private media are encrypted and masked.
          </div>
        </div>

      </div>
    </div>
  );
};
