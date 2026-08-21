import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sevaStore } from '../../services/store';
import { Complaint, IssueCluster, UserProfile, GeoLocation } from '../../types';
import { StatusBadge, PriorityBadge, SlaBadge } from '../../components/common/StatusBadge';
import { MapLeaflet } from '../../components/common/MapLeaflet';
import { 
  Mic, 
  MapPin, 
  FileText, 
  AlertTriangle, 
  Camera, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Navigation, 
  PlusCircle, 
  Clock,
  Layers,
  ChevronRight,
  RefreshCw,
  BellRing
} from 'lucide-react';

const CHENNAI_AREAS: Array<{ name: string; lat: number; lng: number }> = [
  { name: 'Madipakkam', lat: 12.9647, lng: 80.1961 },
  { name: 'Velachery', lat: 12.9785, lng: 80.2217 },
  { name: 'Adyar', lat: 13.0012, lng: 80.2565 },
  { name: 'Guindy', lat: 13.0067, lng: 80.2012 },
  { name: 'Tambaram', lat: 12.9249, lng: 80.1248 },
  { name: 'Chromepet', lat: 12.9516, lng: 80.1462 },
  { name: 'T. Nagar', lat: 13.0418, lng: 80.2341 },
  { name: 'Mylapore', lat: 13.0368, lng: 80.2676 }
];

export const CitizenHome: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserProfile>(sevaStore.getCurrentUser());
  const [myComplaints, setMyComplaints] = useState<Complaint[]>([]);
  const [nearbyComplaints, setNearbyComplaints] = useState<Complaint[]>([]);
  const [clusters, setClusters] = useState<IssueCluster[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);

  // Active Location
  const [userLocation, setUserLocation] = useState<GeoLocation>({
    latitude: 12.9647,
    longitude: 80.1961,
    address: 'Madipakkam Main Road, Chennai',
    area: 'Madipakkam',
    landmark: 'Near Koot Road Signal',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600091'
  });

  const loadData = () => {
    const user = sevaStore.getCurrentUser();
    setCurrentUser(user);
    const complaints = sevaStore.getComplaints();
    setMyComplaints(complaints.filter(c => c.citizenId === user.id));
    setClusters(sevaStore.getClusters());

    // Filter nearby (within 3km)
    const nearby = complaints.filter(c => {
      const dist = sevaStore.calculateDistanceMeters(
        userLocation.latitude,
        userLocation.longitude,
        c.location.latitude,
        c.location.longitude
      );
      return dist <= 3500;
    });
    setNearbyComplaints(nearby.slice(0, 8));
  };

  useEffect(() => {
    loadData();
    const unsub = sevaStore.subscribe(loadData);
    return unsub;
  }, [userLocation.latitude, userLocation.longitude]);

  const handleGetCurrentLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            latitude: +pos.coords.latitude.toFixed(6),
            longitude: +pos.coords.longitude.toFixed(6),
            address: `${userLocation.area || 'Current Location'}, Chennai`,
            area: userLocation.area || 'Madipakkam',
            city: 'Chennai',
            state: 'Tamil Nadu'
          });
          setIsLocating(false);
        },
        () => {
          setIsLocating(false);
        }
      );
    } else {
      setTimeout(() => setIsLocating(false), 500);
    }
  };

  const handleAreaSelect = (areaName: string) => {
    const match = CHENNAI_AREAS.find(a => a.name === areaName) || CHENNAI_AREAS[0];
    setUserLocation({
      latitude: match.lat,
      longitude: match.lng,
      address: `${match.name} Main Road, Chennai`,
      area: match.name,
      landmark: `Near ${match.name} Junction`,
      city: 'Chennai',
      state: 'Tamil Nadu'
    });
  };

  // Urgent action items (e.g. Awaiting Verification or Upload Photo)
  const actionRequiredComplaints = myComplaints.filter(
    c => c.status === 'AWAITING_CITIZEN_VERIFICATION' || c.status === 'AWAITING_CITIZEN_EVIDENCE'
  );

  return (
    <div className="min-h-screen bg-slate-950 pb-16">
      
      {/* Top Location & Greeting Bar */}
      <div className="border-b border-slate-800 bg-slate-900/60 px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Vanakkam, {currentUser.name.split(' ')[0]} 👋
              </h1>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
                Citizen Portal
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Speak to SEVA AI in தமிழ், English, हिंदी or తెలుగు to report civic issues.
            </p>
          </div>

          {/* Location Selector Bar */}
          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 p-1.5 text-xs text-slate-300 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 px-2 py-1 font-mono text-amber-400 shrink-0">
              <MapPin className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Location:</span>
            </div>

            <select
              value={userLocation.area}
              onChange={(e) => handleAreaSelect(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs focus:outline-none focus:border-amber-500 font-medium"
            >
              {CHENNAI_AREAS.map(a => (
                <option key={a.name} value={a.name}>
                  {a.name}, Chennai
                </option>
              ))}
            </select>

            <button
              onClick={handleGetCurrentLocation}
              className="p-1.5 text-slate-400 hover:text-amber-400 rounded hover:bg-slate-900 transition-colors"
              title="Locate via GPS"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>

        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">

        {/* Action Required Banner (If any report needs citizen verification or photo) */}
        {actionRequiredComplaints.length > 0 && (
          <div className="rounded-xl border border-amber-600/80 bg-amber-950/40 p-4 sm:p-5 shadow-xl animate-pulse">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500 text-slate-950 font-bold shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-200">
                    Action Required on {actionRequiredComplaints.length} Grievance{actionRequiredComplaints.length > 1 ? 's' : ''}
                  </h3>
                  <p className="text-xs text-amber-300/80 mt-0.5">
                    {actionRequiredComplaints[0].status === 'AWAITING_CITIZEN_VERIFICATION'
                      ? `Government uploaded repair evidence for ${actionRequiredComplaints[0].token}. Please verify if the issue is solved.`
                      : `Please capture and upload geo-tagged photo evidence for ${actionRequiredComplaints[0].token}.`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate(`/citizen/reports/${actionRequiredComplaints[0].id}`)}
                className="px-4 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-md hover:bg-amber-400 shadow-md transition-colors whitespace-nowrap shrink-0"
              >
                Review Now &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Hero Reporting CTAs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Primary CTA: Talk to SEVA */}
          <div 
            onClick={() => navigate('/citizen/voice')}
            className="md:col-span-2 relative overflow-hidden rounded-2xl border-2 border-amber-500/80 bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 p-6 sm:p-8 cursor-pointer hover:border-amber-400 transition-all group shadow-2xl"
          >
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-400 border border-amber-500/40">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI VOICE GRIEVANCE AGENT</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  🎙️ TALK TO SEVA
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md leading-relaxed">
                  Speak naturally in Tamil, English, Hindi, or Telugu. SEVA AI classifies the issue, detects duplicates, and routes directly to the department.
                </p>
                <div className="pt-2 flex items-center gap-3">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Start Voice Conversation &rarr;
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    (No phone number required)
                  </span>
                </div>
              </div>

              {/* Animated Mic Ring */}
              <div className="relative shrink-0 flex items-center justify-center">
                <div className="absolute h-28 w-28 rounded-full bg-amber-500/20 animate-ping" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-amber-500 text-slate-950 font-bold shadow-xl shadow-amber-500/30 group-hover:scale-105 transition-transform">
                  <Mic className="h-9 w-9" />
                </div>
              </div>
            </div>
          </div>

          {/* Secondary CTA: Manual Report */}
          <div 
            onClick={() => setShowManualModal(true)}
            className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-6 hover:border-slate-700 cursor-pointer transition-all group"
          >
            <div className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-amber-400 group-hover:bg-slate-700">
                <PlusCircle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                📝 Report Manually
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Prefer typing? Fill out a guided form with location pin and photo attachment.
              </p>
            </div>

            <div className="pt-4 flex items-center justify-between text-xs font-medium text-slate-300 group-hover:text-amber-400">
              <span>Open Form</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>

        {/* Active Grievances Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                My Active Reports ({myComplaints.length})
              </h3>
            </div>
            <button
              onClick={() => navigate('/citizen/reports')}
              className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-medium"
            >
              View all reports &rarr;
            </button>
          </div>

          {myComplaints.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-center text-slate-400">
              <p className="text-xs">You have not submitted any grievance yet.</p>
              <button
                onClick={() => navigate('/citizen/voice')}
                className="mt-3 px-4 py-1.5 bg-amber-500 text-slate-950 text-xs font-bold rounded hover:bg-amber-400 inline-flex items-center gap-1.5"
              >
                <Mic className="w-3.5 h-3.5" />
                Report First Issue
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myComplaints.slice(0, 3).map((comp) => (
                <div
                  key={comp.id}
                  onClick={() => navigate(`/citizen/reports/${comp.id}`)}
                  className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 hover:border-slate-700 cursor-pointer transition-all flex flex-col justify-between group space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-mono font-bold text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {comp.token}
                      </span>
                      <PriorityBadge priority={comp.priority} size="sm" />
                    </div>

                    <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-amber-300 transition-colors">
                      {comp.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      {comp.aiSummary || comp.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <StatusBadge status={comp.status} mode="citizen" size="sm" />
                    <SlaBadge slaStatus={comp.slaStatus} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nearby Civic Risks Map Preview */}
        <div className="space-y-3 min-w-0 min-h-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Live Civic Risk Map around {userLocation.area} ({nearbyComplaints.length} issues nearby)
              </h3>
            </div>
            <button
              onClick={() => navigate('/citizen/map')}
              className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-medium"
            >
              Full Screen Map &rarr;
            </button>
          </div>

          <MapLeaflet
            center={[userLocation.latitude, userLocation.longitude]}
            zoom={14}
            complaints={nearbyComplaints}
            clusters={clusters}
            userLocation={userLocation}
            radiusKm={3}
            onSelectComplaint={(comp) => navigate(`/citizen/reports/${comp.id}`)}
            heightClass="h-[360px] sm:h-[400px]"
          />
        </div>

      </main>

      {/* Manual Report Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                Submit Manual Grievance
              </h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as any;
                const category = form.category.value;
                const subcategory = form.subcategory.value;
                const title = form.title.value;
                const description = form.description.value;
                const priority = form.priority.value;

                const newComp = sevaStore.createComplaint({
                  category,
                  subcategory,
                  title,
                  description,
                  aiSummary: `Citizen submitted manual report: ${title}. Located at ${userLocation.area}. Priority: ${priority}.`,
                  location: userLocation,
                  priority
                });

                setShowManualModal(false);
                navigate(`/citizen/reports/${newComp.id}`);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Category</label>
                <select name="category" className="w-full rounded border border-slate-800 bg-slate-950 p-2 text-white">
                  <option value="ROAD">Roads & Footpaths</option>
                  <option value="WATER">Water Supply & Sewerage</option>
                  <option value="ELECTRICITY">Electricity & Lighting</option>
                  <option value="GARBAGE">Garbage & Sanitation</option>
                  <option value="TRANSPORT">Traffic & Transport</option>
                  <option value="HEALTHCARE">Public Health</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Specific Issue</label>
                <input
                  name="subcategory"
                  defaultValue="POTHOLE"
                  placeholder="e.g., POTHOLE, PIPE_BURST, FALLEN_WIRE"
                  className="w-full rounded border border-slate-800 bg-slate-950 p-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Title</label>
                <input
                  name="title"
                  placeholder="Brief summary of the issue..."
                  className="w-full rounded border border-slate-800 bg-slate-950 p-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Detailed Description</label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Provide details about duration, impact, and exact location..."
                  className="w-full rounded border border-slate-800 bg-slate-950 p-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Assessed Severity</label>
                <select name="priority" className="w-full rounded border border-slate-800 bg-slate-950 p-2 text-white">
                  <option value="HIGH">High (Accident hazard / Major outage)</option>
                  <option value="MEDIUM">Medium (Standard civic grievance)</option>
                  <option value="CRITICAL">Critical (Immediate danger to life)</option>
                  <option value="LOW">Low (Minor cosmetic issue)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded hover:bg-amber-400"
                >
                  Generate Ticket Token &rarr;
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
