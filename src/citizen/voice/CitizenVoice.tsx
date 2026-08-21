import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { sevaStore } from '../../services/store';
import { 
  elevenlabsVoiceService, 
  VoiceSessionState, 
  ELEVENLABS_AGENT_ID 
} from '../../services/elevenlabsVoiceService';
import { AudioVisualizer } from '../../components/common/AudioVisualizer';
import { EvidenceUploader } from '../../components/common/EvidenceUploader';
import { PriorityBadge, StatusBadge } from '../../components/common/StatusBadge';
import { Complaint, GeoLocation } from '../../types';
import { 
  Mic, 
  MicOff, 
  PhoneOff, 
  Sparkles, 
  Volume2, 
  VolumeX,
  AlertTriangle, 
  CheckCircle2, 
  Camera, 
  MapPin, 
  RefreshCw, 
  Send,
  Layers,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  Radio,
  HelpCircle,
  Globe
} from 'lucide-react';

export const CitizenVoice: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = sevaStore.getCurrentUser();

  // ElevenLabs session state
  const [sessionState, setSessionState] = useState<VoiceSessionState>(
    elevenlabsVoiceService.getState()
  );

  const [showTextInput, setShowTextInput] = useState(false);
  const [manualText, setManualText] = useState('');
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);

  // User location
  const [userLocation, setUserLocation] = useState<GeoLocation>({
    latitude: 12.9647,
    longitude: 80.1961,
    address: 'Madipakkam Main Road, Chennai',
    area: 'Madipakkam',
    landmark: 'Near Koot Road Signal',
    city: 'Chennai',
    state: 'Tamil Nadu'
  });

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Subscribe to ElevenLabs voice session
  useEffect(() => {
    elevenlabsVoiceService.setUserLocation(userLocation);
    const unsub = elevenlabsVoiceService.subscribe((newState) => {
      setSessionState(newState);
    });

    // Auto-start ElevenLabs session on mount if disconnected
    if (elevenlabsVoiceService.getState().status === 'DISCONNECTED') {
      elevenlabsVoiceService.startSession();
    }

    return () => {
      unsub();
      elevenlabsVoiceService.endSession();
    };
  }, []);

  // Request actual browser geolocation if available
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const updatedLoc: GeoLocation = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            address: `${userLocation.area}, Chennai`,
            area: userLocation.area,
            city: 'Chennai',
            state: 'Tamil Nadu'
          };
          setUserLocation(updatedLoc);
          elevenlabsVoiceService.setUserLocation(updatedLoc);
        },
        (err) => {
          console.warn('Geolocation lookup notice (using Chennai area default):', err);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  // Auto-scroll transcript to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessionState.messages]);

  const handleStartTalk = async () => {
    if (sessionState.status === 'DISCONNECTED' || sessionState.status === 'ENDED' || sessionState.status === 'ERROR') {
      await elevenlabsVoiceService.startSession();
    } else if (sessionState.isMuted) {
      elevenlabsVoiceService.setMicMuted(false);
    }
  };

  const handleToggleMute = () => {
    elevenlabsVoiceService.setMicMuted(!sessionState.isMuted);
  };

  const handleEndCall = async () => {
    try {
      await elevenlabsVoiceService.endSession();
    } catch (err) {
      console.warn('Error ending voice session:', err);
    }
    navigate('/citizen/home');
  };

  const handleBack = async () => {
    try {
      await elevenlabsVoiceService.endSession();
    } catch (err) {
      console.warn('Error ending voice session on back:', err);
    }
    navigate('/citizen/home');
  };

  const handleFallbackConnect = () => {
    elevenlabsVoiceService.enableFallbackDemo();
  };

  const handleSendManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualText.trim()) {
      elevenlabsVoiceService.sendTextMessage(manualText.trim());
      setManualText('');
    }
  };

  const handlePhotoUploaded = (evidence: any) => {
    if (sessionState.lastCreatedComplaint) {
      sevaStore.addCitizenEvidence(sessionState.lastCreatedComplaint.id, evidence);
      navigate(`/citizen/reports/${sessionState.lastCreatedComplaint.id}`);
    }
  };

  // Compute status badge labels and colors
  const getStatusDisplay = () => {
    switch (sessionState.status) {
      case 'CONNECTING':
        return {
          label: '🟡 Connecting...',
          pill: 'bg-yellow-950 text-yellow-300 border-yellow-800 animate-pulse',
          desc: 'Initializing secure WebRTC voice stream with SEVA Agent'
        };
      case 'CONNECTED':
        return {
          label: '🟢 Connected',
          pill: 'bg-emerald-950 text-emerald-300 border-emerald-800',
          desc: 'Ready to speak with SEVA'
        };
      case 'LISTENING':
        return {
          label: '🎙️ Listening...',
          pill: 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse',
          desc: 'Speak naturally in Tamil, English, Hindi, or Telugu'
        };
      case 'SEVA_SPEAKING':
        return {
          label: '🔊 SEVA Speaking...',
          pill: 'bg-blue-950 text-blue-300 border-blue-800 animate-pulse',
          desc: 'SEVA voice response is playing'
        };
      case 'PROCESSING':
        return {
          label: '⚙️ Processing...',
          pill: 'bg-purple-950 text-purple-300 border-purple-800 animate-pulse',
          desc: 'Analyzing civic category & validating location'
        };
      case 'ENDED':
        return {
          label: '📞 Call Ended',
          pill: 'bg-slate-900 text-slate-400 border-slate-700',
          desc: 'Conversation metadata saved to Firestore'
        };
      case 'ERROR':
      default:
        return {
          label: '⚠️ Disconnected',
          pill: 'bg-rose-950 text-rose-300 border-rose-800',
          desc: sessionState.errorMessage || 'Voice stream disconnected'
        };
    }
  };

  const statusInfo = getStatusDisplay();
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between">
      
      {/* Top Bar Header */}
      <div className="border-b border-slate-800 bg-slate-900/90 px-4 py-3 sm:px-6 sticky top-0 z-40 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700 cursor-pointer text-xs font-semibold"
              title="Return to Citizen Portal"
              aria-label="Return to Citizen Portal"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20 shrink-0">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black text-white tracking-tight">
                  SEVA Citizen Voice Assistant
                </h1>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${statusInfo.pill}`}>
                  {statusInfo.label}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                <span>📍 {userLocation.area}, Chennai</span>
                <span>•</span>
                <span>Agent: <strong className="text-slate-300">{ELEVENLABS_AGENT_ID.slice(0, 14)}...</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Real Agent Indicator Badge */}
            <span className={`hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-full border ${
              sessionState.isFallbackMode 
                ? 'bg-yellow-950/60 text-yellow-300 border-yellow-800'
                : 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
            }`}>
              <Radio className={`w-3 h-3 ${sessionState.status === 'CONNECTED' || sessionState.status === 'LISTENING' || sessionState.status === 'SEVA_SPEAKING' ? 'animate-ping' : ''}`} />
              <span>{sessionState.isFallbackMode ? 'DEMO / FALLBACK MODE' : 'ELEVENLABS CONNECTED'}</span>
            </span>

            {/* End Call Button */}
            <button
              type="button"
              onClick={handleEndCall}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-950/80 text-rose-300 border border-rose-800/80 hover:bg-rose-900 transition-colors shadow cursor-pointer"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">END CALL</span>
            </button>
          </div>

        </div>
      </div>

      {/* Error / Permission Notification Bar */}
      {sessionState.errorMessage && (
        <div className="border-b border-rose-800/60 bg-rose-950/80 px-4 py-2.5 text-xs text-rose-200">
          <div className="mx-auto max-w-5xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{sessionState.errorMessage}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleStartTalk}
                className="px-2.5 py-1 rounded bg-rose-900 text-white font-bold hover:bg-rose-800 text-[11px]"
              >
                Retry Voice
              </button>
              <button
                type="button"
                onClick={handleFallbackConnect}
                className="px-2.5 py-1 rounded bg-slate-900 text-slate-300 font-medium hover:text-white border border-slate-700 text-[11px]"
              >
                Use Fallback Voice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Voice Canvas */}
      <div className="mx-auto max-w-5xl w-full px-4 py-6 flex-1 flex flex-col lg:flex-row gap-6">
        
        {/* Left Column: Official Voice Telemetry Card */}
        <div className="w-full lg:w-96 flex flex-col items-center justify-start rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shrink-0 space-y-5">
          
          {/* Header Card Box */}
          <div className="w-full text-center border-b border-slate-800 pb-4">
            <div className="text-[11px] font-mono uppercase tracking-widest text-slate-500">
              Government of Tamil Nadu • GCC
            </div>
            <h2 className="text-xl font-black text-white mt-1">SEVA</h2>
            <p className="text-xs text-amber-400 font-bold tracking-wide">
              Citizen Voice Assistant
            </p>
          </div>

          {/* Audio Wave Visualizer */}
          <AudioVisualizer
            isListening={sessionState.status === 'LISTENING'}
            isSpeaking={sessionState.status === 'SEVA_SPEAKING'}
            languageName={sessionState.detectedLanguage}
            durationSec={sessionState.durationSeconds}
            stageName={sessionState.status}
          />

          {/* Status Box */}
          <div className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-2.5 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Status:</span>
              <span className="text-white font-bold">{statusInfo.label}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Language:</span>
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <Globe className="w-3 h-3" />
                {sessionState.detectedLanguage}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Call Duration:</span>
              <span className="text-slate-300 font-bold">{formatDuration(sessionState.durationSeconds)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Agent ID:</span>
              <span className="text-slate-500 text-[10px] truncate max-w-[140px]" title={ELEVENLABS_AGENT_ID}>
                {ELEVENLABS_AGENT_ID}
              </span>
            </div>
          </div>

          {/* Core Spoken Action Controls (TALK, MUTE, END) */}
          <div className="w-full space-y-3 pt-2">
            <div className="grid grid-cols-3 gap-2">
              
              {/* TALK BUTTON */}
              <button
                type="button"
                onClick={handleStartTalk}
                className={`py-3 px-2 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer ${
                  sessionState.status === 'LISTENING'
                    ? 'bg-rose-600 text-white animate-pulse shadow-rose-600/30'
                    : 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/20'
                }`}
              >
                <Mic className="w-4 h-4" />
                <span className="whitespace-nowrap">🎙️ TALK</span>
              </button>

              {/* MUTE BUTTON */}
              <button
                type="button"
                onClick={handleToggleMute}
                disabled={sessionState.status === 'DISCONNECTED' || sessionState.status === 'ENDED'}
                className={`py-3 px-2 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  sessionState.isMuted
                    ? 'bg-rose-950/80 text-rose-300 border-rose-700'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white hover:bg-slate-800'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {sessionState.isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <MicOff className="w-4 h-4 text-slate-400" />}
                <span className="whitespace-nowrap">{sessionState.isMuted ? 'UNMUTE' : '🔇 MUTE'}</span>
              </button>

              {/* END BUTTON */}
              <button
                type="button"
                onClick={handleEndCall}
                className="py-3 px-2 rounded-xl font-bold text-xs bg-rose-950/60 text-rose-300 border border-rose-800/80 hover:bg-rose-900 flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <PhoneOff className="w-4 h-4 text-rose-400" />
                <span className="whitespace-nowrap">📞 END</span>
              </button>

            </div>

            <button
              type="button"
              onClick={() => setShowTextInput(!showTextInput)}
              className="w-full py-2 rounded-lg border border-slate-800 bg-slate-950 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {showTextInput ? 'Hide Text Field' : 'Type Spoken Words / Manual Input'}
            </button>
          </div>

          <div className="text-[10px] text-slate-500 text-center font-mono">
            Supported: தமிழ் • English • हिंदी • తెలుగు
          </div>

        </div>

        {/* Right Column: Live Transcript & Generated Ticket Resolution */}
        <div className="flex-1 flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-6 shadow-xl min-h-[480px]">
          
          <div className="space-y-4 overflow-y-auto max-h-[440px] pr-2 scrollbar-thin">
            
            <div className="border-b border-slate-800/80 pb-3 flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-amber-400" />
                Live Conversational Transcript
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                {sessionState.messages.length} utterances logged
              </span>
            </div>

            {sessionState.messages.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <p className="text-sm font-medium text-slate-400">
                  Click <strong className="text-amber-400">🎙️ TALK</strong> to begin speaking.
                </p>
                <p className="text-xs max-w-sm mx-auto">
                  Example: "Madipakkam main road la oru periya pothole irukku."
                </p>
              </div>
            ) : (
              sessionState.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col space-y-1 ${
                    msg.source === 'citizen' ? 'items-end' : 'items-start'
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 px-1">
                    {msg.source === 'citizen' ? 'Citizen:' : msg.source === 'seva' ? 'SEVA:' : 'System:'}
                  </span>

                  <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                    msg.source === 'citizen'
                      ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none shadow-md shadow-amber-500/10'
                      : msg.source === 'seva'
                      ? 'bg-slate-950 text-slate-200 border border-slate-800 rounded-tl-none whitespace-pre-line shadow-md'
                      : 'bg-blue-950/60 text-blue-200 border border-blue-800/60 rounded-xl text-xs font-mono'
                  }`}>
                    <p>{msg.text}</p>
                    <span className={`text-[10px] font-mono block mt-1.5 ${
                      msg.source === 'citizen' ? 'text-slate-900/70 text-right' : 'text-slate-500'
                    }`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* REAL GENERATED TICKET BANNER */}
          {sessionState.lastCreatedComplaint && (
            <div className="mt-4 rounded-xl border-2 border-emerald-500 bg-slate-950 p-5 space-y-3 shadow-2xl animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-black text-white">
                    Official Ticket Generated
                  </span>
                </div>
                <span className="text-sm font-mono font-black text-amber-400 px-3 py-1 rounded bg-slate-900 border border-amber-500/60 shadow">
                  {sessionState.lastCreatedComplaint.token}
                </span>
              </div>

              <div className="text-xs text-slate-300 space-y-1 bg-slate-900/80 p-3 rounded-lg border border-slate-800 font-mono">
                <div>🏛️ <strong>Routed Department:</strong> {sessionState.lastCreatedComplaint.departmentName}</div>
                <div>⚡ <strong>Assessed Priority:</strong> <PriorityBadge priority={sessionState.lastCreatedComplaint.priority} size="sm" /></div>
                <div>⏱️ <strong>SLA Target:</strong> {sessionState.lastCreatedComplaint.slaHours} hours</div>
                <div>📍 <strong>Location:</strong> {sessionState.lastCreatedComplaint.location.address}</div>
              </div>

              {/* Geo-Evidence CTA */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPhotoUpload(true)}
                  className="w-full sm:flex-1 px-4 py-2.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-amber-400 shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>📷 ADD GEO-IMAGE (Photo Proof)</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => navigate(`/citizen/reports/${sessionState.lastCreatedComplaint?.id}`)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-slate-700 cursor-pointer"
                >
                  Track Grievance Status &rarr;
                </button>
              </div>
            </div>
          )}

          {/* Manual Input Form */}
          {showTextInput && (
            <form
              onSubmit={handleSendManual}
              className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-800"
            >
              <input
                type="text"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Type your message in Tamil, English, Hindi, or Telugu..."
                className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400 cursor-pointer flex items-center gap-1 text-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          )}

        </div>

      </div>

      {/* Photo Evidence Upload Modal */}
      {showPhotoUpload && sessionState.lastCreatedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl">
            <EvidenceUploader
              currentLocation={sessionState.lastCreatedComplaint.location}
              uploaderRole="CITIZEN"
              ticketToken={sessionState.lastCreatedComplaint.token}
              onUpload={handlePhotoUploaded}
              onCancel={() => setShowPhotoUpload(false)}
            />
          </div>
        </div>
      )}

    </div>
  );
};
