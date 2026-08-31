import React, { useState } from 'react';
import { X, Clock, Moon, CheckCircle2, AlertCircle } from 'lucide-react';

interface SleepTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sleepTimerSeconds: number | null;
  onSetSleepTimer: (seconds: number | null) => void;
}

export const SleepTimerModal: React.FC<SleepTimerModalProps> = ({
  isOpen,
  onClose,
  sleepTimerSeconds,
  onSetSleepTimer,
}) => {
  const [customMinutes, setCustomMinutes] = useState(25);

  if (!isOpen) return null;

  const formatRemaining = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const presets = [
    { label: '5 min', sec: 5 * 60 },
    { label: '15 min', sec: 15 * 60 },
    { label: '30 min', sec: 30 * 60 },
    { label: '45 min', sec: 45 * 60 },
    { label: '60 min', sec: 60 * 60 },
    { label: 'End of Track', sec: -1 }, // special marker
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-2xl bg-black/85 animate-in fade-in duration-200">
      <div className="w-full max-w-md flex flex-col bg-zinc-950/95 border border-white/15 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Smart Sleep Timer</h2>
              <p className="text-xs text-zinc-400">Gentle fade out & automatic stop</p>
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
        <div className="p-5 space-y-5">
          {/* Active Timer Display */}
          {sleepTimerSeconds !== null && sleepTimerSeconds > 0 ? (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 to-zinc-900 border border-purple-500/40 text-center space-y-2">
              <span className="text-xs font-bold uppercase text-purple-400">Timer Running</span>
              <p className="text-3xl font-extrabold text-white font-mono">{formatRemaining(sleepTimerSeconds)}</p>
              <button
                onClick={() => onSetSleepTimer(null)}
                className="px-4 py-1.5 rounded-full bg-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/30 transition"
              >
                Cancel Sleep Timer
              </button>
            </div>
          ) : (
            <p className="text-xs text-zinc-400 text-center">
              Playback will smoothly fade out when the timer reaches zero.
            </p>
          )}

          {/* Presets */}
          <div className="grid grid-cols-3 gap-2">
            {presets.map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  onSetSleepTimer(p.sec);
                  onClose();
                }}
                className="py-2.5 px-3 rounded-2xl bg-zinc-900 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white hover:border-purple-500/40 hover:bg-purple-600/10 transition"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Stepper */}
          <div className="p-4 rounded-2xl bg-zinc-900 border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-zinc-300">Custom Duration</span>
              <span className="font-mono text-purple-400 font-bold">{customMinutes} Minutes</span>
            </div>
            <input
              type="range"
              min="1"
              max="120"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <button
              onClick={() => {
                onSetSleepTimer(customMinutes * 60);
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition"
            >
              Start {customMinutes} Minute Timer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
