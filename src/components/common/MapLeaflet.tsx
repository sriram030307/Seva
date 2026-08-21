import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Complaint, IssueCluster, PriorityLevel } from '../../types';
import { Locate, RotateCcw, AlertTriangle, ExternalLink } from 'lucide-react';

interface MapLeafletProps {
  center: [number, number];
  zoom?: number;
  complaints?: Complaint[];
  clusters?: IssueCluster[];
  userLocation?: { latitude: number; longitude: number; area?: string };
  radiusKm?: number; // 1, 2, 5, 10
  selectedComplaintId?: string;
  onSelectComplaint?: (complaint: Complaint) => void;
  onPickLocation?: (coords: { latitude: number; longitude: number }) => void;
  isPickMode?: boolean;
  heightClass?: string;
  autoFitBounds?: boolean;
}

export const MapLeaflet: React.FC<MapLeafletProps> = ({
  center,
  zoom = 14,
  complaints = [],
  clusters = [],
  userLocation,
  radiusKm,
  selectedComplaintId,
  onSelectComplaint,
  onPickLocation,
  isPickMode = false,
  heightClass = 'h-[500px] sm:h-[560px] lg:h-[600px]',
  autoFitBounds = false
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const pickedMarkerRef = useRef<L.Marker | null>(null);
  const isInitializedRef = useRef<boolean>(false);
  const lastCenterRef = useRef<[number, number]>(center);

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: false,
        attributionControl: false,
        fadeAnimation: true,
        markerZoomAnimation: true
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Dark CartoDB Tiles for high contrast civic telemetry
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);

      mapInstanceRef.current = map;
      markersLayerRef.current = L.layerGroup().addTo(map);
      isInitializedRef.current = true;
      lastCenterRef.current = center;

      // Invalidate size after first paint
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 150);
    }

    // ResizeObserver to handle container resize smoothly without jumping
    let resizeTimer: any = null;
    const resizeObserver = new ResizeObserver(() => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 100);
    });

    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, []);

  // Recenter map ONLY if user explicitly changed center coordinates significantly
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const latDiff = Math.abs(center[0] - lastCenterRef.current[0]);
    const lngDiff = Math.abs(center[1] - lastCenterRef.current[1]);

    // Only update view if coordinates shifted significantly (e.g. user selected different ward or pressed recenter)
    if (latDiff > 0.01 || lngDiff > 0.01) {
      map.setView(center, zoom, { animate: true });
      lastCenterRef.current = center;
    }
  }, [center[0], center[1]]);

  // Click-to-pick coordinate handler
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      if (isPickMode && onPickLocation) {
        onPickLocation({ latitude: e.latlng.lat, longitude: e.latlng.lng });

        if (pickedMarkerRef.current) {
          pickedMarkerRef.current.setLatLng(e.latlng);
        } else {
          const pickIcon = L.divIcon({
            className: 'custom-pick-icon',
            html: `<div class="w-8 h-8 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/50 animate-bounce">📍</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32]
          });
          pickedMarkerRef.current = L.marker(e.latlng, { icon: pickIcon }).addTo(map);
        }
      }
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [isPickMode, onPickLocation]);

  // Render User Location & Radius Circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userLocation && typeof userLocation.latitude === 'number' && typeof userLocation.longitude === 'number') {
      const userLatLng: [number, number] = [userLocation.latitude, userLocation.longitude];

      const userIcon = L.divIcon({
        className: 'user-gps-marker',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-7 h-7 rounded-full bg-blue-500/30 animate-ping"></div>
            <div class="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-md"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng(userLatLng);
      } else {
        userMarkerRef.current = L.marker(userLatLng, { icon: userIcon }).addTo(map);
        userMarkerRef.current.bindTooltip(userLocation.area ? `Your Location (${userLocation.area})` : 'Your Location', {
          permanent: false,
          direction: 'top'
        });
      }

      // Radius Circle
      if (radiusKm) {
        const radiusMeters = radiusKm * 1000;
        if (radiusCircleRef.current) {
          radiusCircleRef.current.setLatLng(userLatLng);
          radiusCircleRef.current.setRadius(radiusMeters);
        } else {
          radiusCircleRef.current = L.circle(userLatLng, {
            radius: radiusMeters,
            color: '#3b82f6',
            weight: 1.5,
            fillColor: '#3b82f6',
            fillOpacity: 0.07,
            dashArray: '4, 6'
          }).addTo(map);
        }
      } else if (radiusCircleRef.current) {
        radiusCircleRef.current.remove();
        radiusCircleRef.current = null;
      }
    }
  }, [userLocation?.latitude, userLocation?.longitude, radiusKm]);

  // Render Complaints & Cluster Pins without modifying map dimensions or center
  useEffect(() => {
    const markersLayer = markersLayerRef.current;
    if (!markersLayer) return;

    markersLayer.clearLayers();

    // Helper for pin styles
    const getPinHtml = (priority: PriorityLevel, count: number = 1, isCluster: boolean = false) => {
      const colors: Record<PriorityLevel, { bg: string; ring: string; border: string }> = {
        CRITICAL: { bg: '#dc2626', ring: 'rgba(220, 38, 38, 0.4)', border: '#fca5a5' },
        HIGH: { bg: '#ea580c', ring: 'rgba(234, 88, 12, 0.35)', border: '#fdba74' },
        MEDIUM: { bg: '#eab308', ring: 'rgba(234, 179, 8, 0.3)', border: '#fef08a' },
        LOW: { bg: '#10b981', ring: 'rgba(16, 185, 129, 0.25)', border: '#86efac' }
      };

      const c = colors[priority] || colors.MEDIUM;

      if (isCluster || count > 1) {
        return `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="absolute -inset-1 rounded-full animate-ping" style="background-color: ${c.ring}"></div>
            <div class="relative flex items-center justify-center w-8 h-8 rounded-full border-2 font-mono font-bold text-xs text-white shadow-xl" style="background-color: ${c.bg}; border-color: ${c.border}">
              ${count}
            </div>
          </div>
        `;
      }

      return `
        <div class="relative flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
          <div class="w-6 h-6 rounded-full border-2 shadow-lg flex items-center justify-center" style="background-color: ${c.bg}; border-color: ${c.border}">
            <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
          </div>
        </div>
      `;
    };

    // Render Clusters
    clusters.forEach((cl) => {
      if (typeof cl.latitude !== 'number' || typeof cl.longitude !== 'number') return;

      const icon = L.divIcon({
        className: 'cluster-pin',
        html: getPinHtml(cl.riskLevel, cl.reportCount, true),
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([cl.latitude, cl.longitude], { icon });

      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${cl.latitude},${cl.longitude}`;

      const popupContent = `
        <div class="p-3 w-64 text-slate-100">
          <div class="flex items-center justify-between gap-1 mb-1">
            <span class="text-[10px] font-mono font-bold text-amber-400 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700">
              CLUSTER ${cl.clusterCode}
            </span>
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${
              cl.riskLevel === 'CRITICAL' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
            }">
              ${cl.riskLevel} (${cl.reportCount} REPORTS)
            </span>
          </div>
          <h4 class="font-bold text-xs text-white leading-snug my-1">${cl.title}</h4>
          <p class="text-[11px] text-slate-400 font-mono">${cl.area}</p>
          <div class="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between">
            <span class="text-[10px] text-slate-400">${cl.departmentName}</span>
            <a href="${googleMapsUrl}" target="_blank" rel="noreferrer" class="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:underline">
              Open Maps ↗
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersLayer.addLayer(marker);
    });

    // Render Individual Complaints
    complaints.forEach((comp) => {
      if (!comp.location || typeof comp.location.latitude !== 'number' || typeof comp.location.longitude !== 'number') return;

      const icon = L.divIcon({
        className: 'complaint-pin',
        html: getPinHtml(comp.priority, comp.relatedReportCount),
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([comp.location.latitude, comp.location.longitude], { icon });

      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${comp.location.latitude},${comp.location.longitude}`;

      const popupHtml = `
        <div class="p-3 w-72 text-slate-100">
          <div class="flex items-center justify-between gap-1 mb-1.5">
            <span class="text-[10px] font-mono font-bold text-amber-400 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
              ${comp.token}
            </span>
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${
              comp.priority === 'CRITICAL' ? 'bg-red-950 text-red-300 border border-red-700' :
              comp.priority === 'HIGH' ? 'bg-amber-950 text-amber-300 border border-amber-700' : 'bg-yellow-950 text-yellow-300 border border-yellow-800'
            }">
              ${comp.priority}
            </span>
          </div>

          <h4 class="font-bold text-xs text-white leading-tight mb-1">${comp.title}</h4>
          <p class="text-[11px] text-slate-300 line-clamp-2 mb-2">${comp.aiSummary || comp.description}</p>
          
          <div class="text-[10px] text-slate-400 font-mono space-y-0.5 bg-slate-900/80 p-1.5 rounded border border-slate-800 mb-2">
            <div>📍 ${comp.location.address || comp.location.area}</div>
            <div>🏛️ ${comp.departmentName}</div>
            <div>⏱️ Status: <strong class="text-slate-200">${comp.status.replace(/_/g, ' ')}</strong></div>
          </div>

          <div class="flex items-center justify-between gap-2 pt-1 border-t border-slate-800">
            <a 
              href="${googleMapsUrl}" 
              target="_blank" 
              rel="noreferrer" 
              class="text-[11px] font-medium text-slate-400 hover:text-amber-400 inline-flex items-center gap-1"
            >
              Open in Google Maps ↗
            </a>
            <button 
              id="btn-view-ticket-${comp.id}"
              class="px-2.5 py-1 text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 rounded transition-colors"
            >
              View Ticket
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-view-ticket-${comp.id}`);
        if (btn && onSelectComplaint) {
          btn.onclick = () => onSelectComplaint(comp);
        }
      });

      markersLayer.addLayer(marker);
    });

  }, [complaints, clusters, onSelectComplaint]);

  // Recenter to user's location
  const handleRecenterUser = () => {
    const map = mapInstanceRef.current;
    if (map && userLocation) {
      map.setView([userLocation.latitude, userLocation.longitude], 15, { animate: true });
    }
  };

  // Reset map view
  const handleResetMap = () => {
    const map = mapInstanceRef.current;
    if (map) {
      map.setView(center, zoom, { animate: true });
    }
  };

  return (
    <div className={`relative w-full max-w-full min-w-0 min-h-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-xl ${heightClass}`}>
      
      {/* Leaflet DOM Anchor */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full min-w-0 min-h-0 relative z-10" 
      />

      {/* Floating Interactive Controls */}
      <div className="absolute top-3 right-3 z-40 flex flex-col gap-1.5">
        {userLocation && (
          <button
            type="button"
            onClick={handleRecenterUser}
            title="Recenter on My Location"
            className="p-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-amber-400 border border-slate-700 shadow-md backdrop-blur-sm transition-colors cursor-pointer"
          >
            <Locate className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          onClick={handleResetMap}
          title="Reset Map View"
          className="p-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700 shadow-md backdrop-blur-sm transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {isPickMode && (
        <div className="absolute top-3 left-3 z-40 bg-slate-950/90 border border-amber-500/60 rounded-lg px-3 py-1.5 text-xs text-amber-300 font-medium shadow-lg backdrop-blur-sm flex items-center gap-2">
          <span>📍 Click anywhere on map to pinpoint grievance location</span>
        </div>
      )}

      {/* Embedded Mini Legend in Bottom-Left */}
      <div className="absolute bottom-3 left-3 z-40 bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-1 text-[10px] font-mono text-slate-400 shadow-md backdrop-blur-sm hidden sm:flex items-center gap-2.5">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Critical</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span> High</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Medium</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Low</span>
      </div>

    </div>
  );
};
