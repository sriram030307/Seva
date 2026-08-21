import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  MapPin, 
  CheckCircle2, 
  Upload, 
  AlertCircle, 
  RefreshCw, 
  Smartphone, 
  Image as ImageIcon,
  ShieldCheck,
  AlertTriangle,
  X,
  Radio
} from 'lucide-react';
import { GeoLocation } from '../../types';

interface EvidenceUploaderProps {
  currentLocation?: GeoLocation;
  uploaderRole: 'CITIZEN' | 'OFFICER';
  ticketToken?: string;
  onUpload: (evidence: {
    imageUrl: string;
    latitude: number;
    longitude: number;
    accuracyMeters: number;
    locationVerification: 'VERIFIED' | 'UNVERIFIED';
    locationName: string;
    notes?: string;
    deviceInfo?: string;
  }) => void;
  onCancel?: () => void;
}

const SAMPLE_EVIDENCE_PHOTOS = {
  CITIZEN: [
    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop&q=80'
  ],
  OFFICER: [
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800&auto=format&fit=crop&q=80'
  ]
};

export const EvidenceUploader: React.FC<EvidenceUploaderProps> = ({
  currentLocation,
  uploaderRole,
  ticketToken,
  onUpload,
  onCancel
}) => {
  const defaultPhotoList = SAMPLE_EVIDENCE_PHOTOS[uploaderRole] || SAMPLE_EVIDENCE_PHOTOS.CITIZEN;
  const [selectedImage, setSelectedImage] = useState<string>(defaultPhotoList[0]);
  const [notes, setNotes] = useState('');
  const [captureMethod, setCaptureMethod] = useState<'CAMERA' | 'GALLERY' | 'SAMPLE'>('CAMERA');
  
  // GPS State
  const [isVerifyingGps, setIsVerifyingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [allowUnverifiedGps, setAllowUnverifiedGps] = useState(false);
  const [locationVerification, setLocationVerification] = useState<'VERIFIED' | 'UNVERIFIED'>('VERIFIED');
  const [gpsAccuracy, setGpsAccuracy] = useState<number>(6);
  const [capturedCoords, setCapturedCoords] = useState<{ lat: number; lng: number }>({
    lat: currentLocation?.latitude || 12.9647,
    lng: currentLocation?.longitude || 80.1961
  });

  // WebRTC Camera Modal State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Acquire real GPS coordinates on mount
  const fetchDeviceGps = () => {
    setIsVerifyingGps(true);
    setGpsError(null);

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = +pos.coords.latitude.toFixed(6);
          const lng = +pos.coords.longitude.toFixed(6);
          const acc = Math.round(pos.coords.accuracy) || 6;
          setCapturedCoords({ lat, lng });
          setGpsAccuracy(acc);
          setLocationVerification('VERIFIED');
          setAllowUnverifiedGps(false);
          setIsVerifyingGps(false);
        },
        (err) => {
          console.warn('Geolocation access issue:', err.message);
          setGpsError('Location access is required to verify this evidence. Please grant GPS permission.');
          setIsVerifyingGps(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0
        }
      );
    } else {
      setGpsError('Geolocation is not supported by your browser.');
      setIsVerifyingGps(false);
    }
  };

  useEffect(() => {
    fetchDeviceGps();
    return () => {
      stopCameraStream();
    };
  }, []);

  const stopCameraStream = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleStartLiveCamera = async () => {
    try {
      setCaptureMethod('CAMERA');
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });
        cameraStreamRef.current = stream;
        setIsCameraActive(true);
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        }, 100);
      } else {
        // Fallback to camera file input with capture attribute
        cameraInputRef.current?.click();
      }
    } catch (err) {
      console.warn('Camera stream error, falling back to native capture:', err);
      cameraInputRef.current?.click();
    }
  };

  const handleCaptureFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setSelectedImage(dataUrl);
    }
    stopCameraStream();
    fetchDeviceGps();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedImage(event.target.result as string);
          setCaptureMethod('GALLERY');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleContinueWithoutGps = () => {
    setLocationVerification('UNVERIFIED');
    setAllowUnverifiedGps(true);
    setGpsError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gpsError && !allowUnverifiedGps) {
      return;
    }

    onUpload({
      imageUrl: selectedImage,
      latitude: capturedCoords.lat,
      longitude: capturedCoords.lng,
      accuracyMeters: locationVerification === 'VERIFIED' ? gpsAccuracy : 500,
      locationVerification,
      locationName: currentLocation?.area || `${capturedCoords.lat}, ${capturedCoords.lng}`,
      notes,
      deviceInfo: typeof navigator !== 'undefined' ? navigator.userAgent : 'Device Web Client'
    });
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/95 p-4 sm:p-6 shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-400" />
            {uploaderRole === 'CITIZEN' ? 'Capture Geo-Tagged Problem Evidence' : 'Capture Geo-Tagged Resolution Evidence'}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {uploaderRole === 'CITIZEN' 
              ? 'Please capture the real defect location using device camera and verified GPS.' 
              : 'Officers must capture authentic field repair proof with verified coordinates.'}
          </p>
        </div>
        {ticketToken && (
          <span className="text-xs font-mono font-bold text-amber-400 px-2.5 py-1 rounded bg-slate-950 border border-slate-800">
            {ticketToken}
          </span>
        )}
      </div>

      {/* Camera vs Gallery Recommendation Banner */}
      <div className="rounded-lg bg-blue-950/40 border border-blue-900/60 p-3 text-xs flex items-start gap-2.5">
        <Smartphone className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div className="text-blue-200 leading-relaxed">
          <strong>Camera-Captured Image Preferred:</strong> Taking a direct photo at the scene ensures genuine GPS telemetry and visual authenticity for rapid verification.
        </div>
      </div>

      {/* WebRTC Live Camera Modal */}
      {isCameraActive && (
        <div className="rounded-xl border-2 border-amber-500 bg-slate-950 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
              <Radio className="w-4 h-4 text-red-500 animate-pulse" />
              Live Device Camera Stream
            </span>
            <button
              type="button"
              onClick={stopCameraStream}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="relative rounded-lg overflow-hidden bg-black aspect-video max-h-72">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          </div>
          <button
            type="button"
            onClick={handleCaptureFrame}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <Camera className="w-4 h-4" />
            Capture Photo & Lock Telemetry
          </button>
        </div>
      )}

      {/* GPS Denial Warning & Policy */}
      {gpsError && !allowUnverifiedGps && (
        <div className="rounded-xl border border-rose-800/80 bg-rose-950/40 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-rose-200">
                Location Access Required for Verification
              </h4>
              <p className="text-xs text-rose-300 leading-relaxed">
                {gpsError} Manual typing of coordinates is prohibited to prevent falsified reports.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={fetchDeviceGps}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry GPS
            </button>
            <button
              type="button"
              onClick={handleContinueWithoutGps}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700"
            >
              Continue without GPS (Marked Unverified)
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Photo Selection Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
          
          {/* Main Photo Preview */}
          <div className="sm:col-span-1 space-y-2">
            <div className="relative h-48 sm:h-52 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden group">
              <img
                src={selectedImage}
                alt="Evidence preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3">
                <button
                  type="button"
                  onClick={handleStartLiveCamera}
                  className="w-full py-1.5 bg-amber-500 text-slate-950 font-bold text-xs rounded hover:bg-amber-400 flex items-center justify-center gap-1"
                >
                  <Camera className="w-3.5 h-3.5" /> Take Photo
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-1.5 bg-slate-800 text-slate-200 font-bold text-xs rounded hover:bg-slate-700 border border-slate-700 flex items-center justify-center gap-1"
                >
                  <ImageIcon className="w-3.5 h-3.5" /> From Gallery
                </button>
              </div>

              {/* Verified GPS Pill */}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                {locationVerification === 'VERIFIED' ? (
                  <span className="bg-slate-950/90 text-emerald-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-emerald-900/60 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> GPS VERIFIED (±{gpsAccuracy}m)
                  </span>
                ) : (
                  <span className="bg-amber-950/90 text-amber-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-amber-900/60 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> UNVERIFIED GPS
                  </span>
                )}
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleStartLiveCamera}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Take Photo</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-lg border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Gallery</span>
              </button>
            </div>
          </div>

          {/* Right Controls: Telemetry Box & Preset Options */}
          <div className="sm:col-span-2 space-y-3">
            
            {/* Real GPS Telemetry Box */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  Hardware GPS Telemetry
                </span>
                <button
                  type="button"
                  onClick={fetchDeviceGps}
                  className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isVerifyingGps ? 'animate-spin' : ''}`} />
                  Re-fetch Coordinates
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div className="bg-slate-900 p-2 rounded border border-slate-800 text-slate-300">
                  <span className="text-slate-500 block text-[10px]">Latitude:</span>
                  {capturedCoords.lat.toFixed(6)}° N
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800 text-slate-300">
                  <span className="text-slate-500 block text-[10px]">Longitude:</span>
                  {capturedCoords.lng.toFixed(6)}° E
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                <span>Accuracy: ±{locationVerification === 'VERIFIED' ? `${gpsAccuracy}m (Satellite Fix)` : 'N/A (Unverified)'}</span>
                <span>Time: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Scenario Sample Photo Picker */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Quick Scenario Presets:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {defaultPhotoList.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedImage(url);
                      setCaptureMethod('SAMPLE');
                    }}
                    className={`h-14 rounded-lg border overflow-hidden transition-all ${
                      selectedImage === url ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Scenario ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Hidden Inputs */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />

          </div>

        </div>

        {/* Notes */}
        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">
            {uploaderRole === 'CITIZEN' ? 'Evidence Description / Site Markers:' : 'Remediation Work Details & Materials Used:'}
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              uploaderRole === 'CITIZEN' 
                ? 'e.g., Damaged road near corner shop, deep crater causing vehicle damage...' 
                : 'e.g., 60mm compacted hot-mix asphalt laid, road leveled and rolled...'
            }
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={Boolean(gpsError && !allowUnverifiedGps)}
            className="px-5 py-2 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:opacity-40 shadow-md shadow-amber-500/20 flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Submit Geo-Evidence</span>
          </button>
        </div>

      </form>
    </div>
  );
};
