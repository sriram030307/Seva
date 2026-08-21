import React from 'react';
import { Mic, Volume2, Sparkles, AlertCircle } from 'lucide-react';

interface AudioVisualizerProps {
  isListening: boolean;
  isSpeaking: boolean;
  languageName: string;
  durationSec: number;
  stageName: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isListening,
  isSpeaking,
  languageName,
  durationSec,
  stageName
}) => {
  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      {/* Central Interactive Voice Sphere */}
      <div className="relative flex items-center justify-center mb-6">
        
        {/* Outer Ripple Rings */}
        {isListening && (
          <>
            <div className="absolute h-44 w-44 rounded-full border border-amber-500/20 animate-ping" />
            <div className="absolute h-36 w-36 rounded-full border-2 border-amber-500/40 animate-pulse" />
          </>
        )}

        {isSpeaking && (
          <>
            <div className="absolute h-44 w-44 rounded-full border border-blue-500/20 animate-ping" />
            <div className="absolute h-36 w-36 rounded-full border-2 border-blue-500/40 animate-pulse" />
          </>
        )}

        {/* Core Avatar Sphere */}
        <div className={`relative flex h-28 w-28 items-center justify-center rounded-full border-4 shadow-2xl transition-all duration-300 ${
          isListening 
            ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-amber-500/40 scale-105 animate-voice-ripple'
            : isSpeaking
            ? 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-blue-500/40 scale-105'
            : 'bg-slate-900 border-slate-700 text-slate-400'
        }`}>
          {isListening ? (
            <Mic className="h-10 w-10 animate-bounce" />
          ) : isSpeaking ? (
            <Volume2 className="h-10 w-10 animate-pulse" />
          ) : (
            <Sparkles className="h-10 w-10" />
          )}
        </div>
      </div>

      {/* Dynamic Soundwave Equalizer Bars */}
      <div className="flex items-center justify-center gap-1.5 h-10 mb-4">
        {[20, 45, 80, 60, 95, 75, 40, 90, 65, 30, 85, 50].map((height, i) => (
          <div
            key={i}
            className={`w-1.5 rounded-full transition-all duration-150 ${
              isListening
                ? 'bg-amber-400'
                : isSpeaking
                ? 'bg-blue-400'
                : 'bg-slate-800'
            }`}
            style={{
              height: isListening || isSpeaking ? `${Math.max(6, (height * ((i % 3) + 1)) % 36)}px` : '4px',
              animation: (isListening || isSpeaking) ? `listening-wave 1.${(i % 5) + 2}s ease-in-out ${i * 0.08}s infinite` : 'none'
            }}
          />
        ))}
      </div>

      {/* State & Language Indicator Badges */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
          isListening
            ? 'bg-amber-950/80 text-amber-300 border-amber-600 animate-pulse'
            : isSpeaking
            ? 'bg-blue-950/80 text-blue-300 border-blue-600 animate-pulse'
            : 'bg-slate-900 text-slate-400 border-slate-800'
        }`}>
          <span className={`h-2 w-2 rounded-full ${isListening ? 'bg-amber-400' : isSpeaking ? 'bg-blue-400' : 'bg-slate-600'}`} />
          {isListening ? 'SEVA LISTENING...' : isSpeaking ? 'SEVA SPEAKING...' : 'STANDBY'}
        </span>

        <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-slate-900 text-slate-300 border border-slate-800">
          🗣️ {languageName}
        </span>

        <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-slate-900 text-slate-300 border border-slate-800">
          ⏱️ {formatTime(durationSec)}
        </span>
      </div>

      <div className="mt-2 text-xs font-mono text-slate-400">
        Stage: <strong className="text-slate-200">{stageName}</strong>
      </div>
    </div>
  );
};
