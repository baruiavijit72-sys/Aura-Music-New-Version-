import React, { useState } from 'react';
import { X, Scissors, Play, Pause, Bell, PhoneCall, AlarmClock, CheckCircle2, Music, Download } from 'lucide-react';
import { Track } from '../types';

interface AudioTrimmerModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
}

export const AudioTrimmerModal: React.FC<AudioTrimmerModalProps> = ({
  isOpen,
  onClose,
  track,
}) => {
  const [startTime, setStartTime] = useState(15);
  const [endTime, setEndTime] = useState(Math.min(45, track?.duration || 60));
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  if (!isOpen || !track) return null;

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const clipDuration = Math.max(1, endTime - startTime);

  const handleSetTone = (type: 'Ringtone' | 'Notification Tone' | 'Alarm Sound') => {
    setSuccessBanner(`Successfully configured "${track.title}" (${formatTime(startTime)} - ${formatTime(endTime)}) as your system ${type}!`);
    setTimeout(() => {
      setSuccessBanner(null);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-2xl bg-black/85 animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[92vh] flex flex-col bg-zinc-950/95 border border-white/15 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Audio Trimmer & Ringtone Studio</h2>
              <p className="text-xs text-zinc-400">Cut lossless clips for system tones & alarms</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Target Track Preview */}
          <div className="p-4 rounded-2xl bg-zinc-900 border border-white/10 flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 shadow"
              style={{
                background: `linear-gradient(135deg, ${track.coverGradient[0]}, ${track.coverGradient[1]})`
              }}
            >
              <Music className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-white truncate">{track.title}</h3>
              <p className="text-xs text-zinc-400 truncate">{track.artist} • {track.format} Total {formatTime(track.duration)}</p>
            </div>
          </div>

          {/* Simulated Waveform Visualizer with Cut Range */}
          <div className="p-5 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-bold uppercase">Waveform Range Selection</span>
              <span className="font-mono text-amber-400 font-bold">Clip Duration: {clipDuration}s</span>
            </div>

            {/* Visual waveform bars */}
            <div className="h-16 flex items-center gap-1 bg-black/40 p-2 rounded-xl border border-white/5 relative overflow-hidden">
              {Array.from({ length: 48 }).map((_, i) => {
                const barPos = (i / 48) * track.duration;
                const isInCut = barPos >= startTime && barPos <= endTime;
                const heightPercent = 20 + Math.sin(i * 0.4) * 35 + ((i * 17) % 40);

                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-full transition-all duration-200 ${
                      isInCut ? 'bg-amber-400 shadow-sm shadow-amber-400/50' : 'bg-zinc-700 opacity-40'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                );
              })}
            </div>

            {/* Sliders for start and end */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>Clip Start Marker</span>
                  <span className="font-mono text-white font-bold">{formatTime(startTime)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.max(0, endTime - 1)}
                  value={startTime}
                  onChange={(e) => setStartTime(parseFloat(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>Clip End Marker</span>
                  <span className="font-mono text-white font-bold">{formatTime(endTime)}</span>
                </div>
                <input
                  type="range"
                  min={startTime + 1}
                  max={track.duration}
                  value={endTime}
                  onChange={(e) => setEndTime(parseFloat(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>
            </div>

            {/* Loop Preview Button */}
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setIsPreviewing(!isPreviewing)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition border border-white/10"
              >
                {isPreviewing ? <Pause className="w-4 h-4 text-amber-400 fill-current" /> : <Play className="w-4 h-4 text-amber-400 fill-current" />}
                <span>{isPreviewing ? 'Stop Clip Preview' : 'Play Selected Loop (Looping)'}</span>
              </button>
            </div>
          </div>

          {/* System Tone Actions */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase text-zinc-400">Export & System Assignment</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={() => handleSetTone('Ringtone')}
                className="p-3 rounded-2xl bg-zinc-900 border border-white/10 hover:border-amber-500/40 flex flex-col items-center gap-2 text-zinc-300 hover:text-white transition group"
              >
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 group-hover:scale-110 transition">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold">Set as Ringtone</span>
              </button>

              <button
                onClick={() => handleSetTone('Notification Tone')}
                className="p-3 rounded-2xl bg-zinc-900 border border-white/10 hover:border-amber-500/40 flex flex-col items-center gap-2 text-zinc-300 hover:text-white transition group"
              >
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 group-hover:scale-110 transition">
                  <Bell className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold">Notification Tone</span>
              </button>

              <button
                onClick={() => handleSetTone('Alarm Sound')}
                className="p-3 rounded-2xl bg-zinc-900 border border-white/10 hover:border-amber-500/40 flex flex-col items-center gap-2 text-zinc-300 hover:text-white transition group"
              >
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 group-hover:scale-110 transition">
                  <AlarmClock className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold">Set as Alarm</span>
              </button>
            </div>
          </div>

          {/* Success Banner */}
          {successBanner && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center gap-2.5 text-emerald-300 text-xs font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successBanner}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
