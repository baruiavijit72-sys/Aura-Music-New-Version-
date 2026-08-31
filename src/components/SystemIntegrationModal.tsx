import React, { useState } from 'react';
import { 
  X, 
  Layers, 
  Smartphone, 
  Lock, 
  Bell, 
  Headphones, 
  Car, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Heart, 
  SlidersHorizontal,
  CheckCircle2
} from 'lucide-react';
import { Track } from '../types';

interface SystemIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export const SystemIntegrationModal: React.FC<SystemIntegrationModalProps> = ({
  isOpen,
  onClose,
  currentTrack,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrevious,
}) => {
  const [activeTab, setActiveTab] = useState<'widgets' | 'lockscreen' | 'notification' | 'headphone' | 'car'>('widgets');
  const [widgetSize, setWidgetSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [headphoneAutoPause, setHeadphoneAutoPause] = useState(true);
  const [headphoneAutoResume, setHeadphoneAutoResume] = useState(true);
  const [headphoneState, setHeadphoneState] = useState<'CONNECTED' | 'DISCONNECTED'>('CONNECTED');
  const [banner, setBanner] = useState<string | null>(null);

  if (!isOpen) return null;

  const track = currentTrack || {
    id: 'demo',
    title: 'Midnight Resonance',
    artist: 'Aura Collective',
    album: 'Synthetic Horizons',
    duration: 218,
    source: 'LOCAL' as const,
    format: 'FLAC' as const,
    bitrate: '1411 kbps',
    sampleRate: '96kHz / 24-bit',
    genre: 'Synthwave',
    year: 2026,
    trackNumber: 1,
    playCount: 42,
    skipCount: 1,
    dateAdded: Date.now(),
    isFavorite: true,
    coverGradient: ['#6366f1', '#a855f7'] as [string, string],
    lyricsLrc: '',
    folderPath: '',
    fileSizeBytes: 38400000,
  };

  const handleSimulateHeadphoneDisconnect = () => {
    if (headphoneState === 'CONNECTED') {
      setHeadphoneState('DISCONNECTED');
      if (headphoneAutoPause && isPlaying) {
        onTogglePlay();
      }
      setBanner('Headphones disconnected: Playback automatically paused safely.');
    } else {
      setHeadphoneState('CONNECTED');
      if (headphoneAutoResume && !isPlaying) {
        onTogglePlay();
      }
      setBanner('Headphones reconnected: Playback automatically resumed.');
    }
    setTimeout(() => setBanner(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-2xl bg-black/85 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col bg-zinc-950/95 border border-white/15 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">System Integration & Widgets</h2>
              <p className="text-xs text-zinc-400">Lockscreen, Notification, Widgets & Headphone DSP</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-2.5 bg-zinc-900 border-b border-white/10 overflow-x-auto">
          <button
            onClick={() => setActiveTab('widgets')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              activeTab === 'widgets' ? 'bg-amber-500 text-black font-extrabold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Homescreen Widgets
          </button>

          <button
            onClick={() => setActiveTab('lockscreen')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              activeTab === 'lockscreen' ? 'bg-amber-500 text-black font-extrabold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Lockscreen Player
          </button>

          <button
            onClick={() => setActiveTab('notification')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              activeTab === 'notification' ? 'bg-amber-500 text-black font-extrabold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Notification Panel
          </button>

          <button
            onClick={() => setActiveTab('headphone')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              activeTab === 'headphone' ? 'bg-amber-500 text-black font-extrabold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Headphone Auto-Pause
          </button>

          <button
            onClick={() => setActiveTab('car')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              activeTab === 'car' ? 'bg-amber-500 text-black font-extrabold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Android Auto Mode
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {banner && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center gap-2.5 text-emerald-300 text-xs font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{banner}</span>
            </div>
          )}

          {activeTab === 'widgets' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-zinc-400">Select Widget Layout</span>
                <div className="flex items-center gap-1.5">
                  {(['small', 'medium', 'large'] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => setWidgetSize(size)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition capitalize ${
                        widgetSize === size ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {size} ({size === 'small' ? '2x2' : size === 'medium' ? '4x2' : '4x4'})
                    </button>
                  ))}
                </div>
              </div>

              {/* Simulated Homescreen Widget Box */}
              <div className="p-6 bg-zinc-900 rounded-3xl border border-white/10 flex items-center justify-center min-h-[220px]">
                {widgetSize === 'small' && (
                  <div 
                    className="w-44 h-44 rounded-3xl p-3 flex flex-col justify-between shadow-2xl relative overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${track.coverGradient[0]}, ${track.coverGradient[1]})` }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-white/80 uppercase">Aura Widget</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-black/40 text-white rounded">
                        {track.format}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-white truncate">{track.title}</p>
                      <p className="text-[10px] text-white/80 truncate">{track.artist}</p>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button onClick={onPrevious} className="p-1.5 rounded-full bg-black/30 text-white">
                        <SkipBack className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={onTogglePlay} className="p-2.5 rounded-full bg-white text-black font-bold shadow">
                        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                      </button>
                      <button onClick={onNext} className="p-1.5 rounded-full bg-black/30 text-white">
                        <SkipForward className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {widgetSize === 'medium' && (
                  <div className="w-full max-w-md p-4 rounded-3xl bg-zinc-950/90 border border-white/15 shadow-2xl flex items-center gap-4">
                    <div 
                      className="w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg"
                      style={{ background: `linear-gradient(135deg, ${track.coverGradient[0]}, ${track.coverGradient[1]})` }}
                    >
                      <span className="text-xs font-black text-white/90">AURA</span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate">{track.title}</p>
                      <p className="text-xs text-zinc-400 truncate">{track.artist} • {track.album}</p>
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-indigo-500 h-full w-2/3" />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={onPrevious} className="p-2 rounded-xl text-zinc-300 hover:text-white">
                        <SkipBack className="w-4 h-4" />
                      </button>
                      <button onClick={onTogglePlay} className="p-3 rounded-2xl bg-indigo-600 text-white shadow">
                        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                      </button>
                      <button onClick={onNext} className="p-2 rounded-xl text-zinc-300 hover:text-white">
                        <SkipForward className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {widgetSize === 'large' && (
                  <div className="w-full max-w-md p-5 rounded-3xl bg-zinc-950 border border-white/15 shadow-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Hi-Res Player Widget</span>
                      <span className="text-[10px] font-mono text-zinc-400">{track.bitrate}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold"
                        style={{ background: `linear-gradient(135deg, ${track.coverGradient[0]}, ${track.coverGradient[1]})` }}
                      >
                        {track.format}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-base font-bold text-white truncate">{track.title}</h4>
                        <p className="text-xs text-zinc-400 truncate">{track.artist}</p>
                        <p className="text-[11px] text-zinc-500 truncate mt-0.5">{track.album}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-around pt-2 border-t border-white/10">
                      <button onClick={onPrevious} className="p-2.5 rounded-xl bg-zinc-900 text-zinc-300">
                        <SkipBack className="w-5 h-5" />
                      </button>
                      <button onClick={onTogglePlay} className="p-4 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/40">
                        {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                      </button>
                      <button onClick={onNext} className="p-2.5 rounded-xl bg-zinc-900 text-zinc-300">
                        <SkipForward className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'lockscreen' && (
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase text-zinc-400">Lockscreen Player UI Preview</span>
              <div className="p-6 bg-black rounded-3xl border border-white/20 flex flex-col items-center text-center space-y-4 max-w-sm mx-auto shadow-2xl">
                <div className="text-zinc-400 text-xs font-medium">9:41 AM • Thursday, Aug 27</div>
                <div 
                  className="w-36 h-36 rounded-3xl shadow-xl flex items-center justify-center text-white font-bold text-xl"
                  style={{ background: `linear-gradient(135deg, ${track.coverGradient[0]}, ${track.coverGradient[1]})` }}
                >
                  {track.format}
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">{track.title}</h4>
                  <p className="text-xs text-zinc-400">{track.artist} • {track.album}</p>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={onPrevious} className="p-2 text-zinc-400 hover:text-white"><SkipBack className="w-5 h-5" /></button>
                  <button onClick={onTogglePlay} className="p-3 bg-white text-black rounded-full font-bold">
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                  </button>
                  <button onClick={onNext} className="p-2 text-zinc-400 hover:text-white"><SkipForward className="w-5 h-5" /></button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notification' && (
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase text-zinc-400">Android Notification Media Player Preview</span>
              <div className="p-4 bg-zinc-900 rounded-2xl border border-white/10 max-w-md mx-auto space-y-3 shadow-xl">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span className="font-bold text-white">Aura Music • Hi-Res Engine</span>
                  </div>
                  <span>Now</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{track.title}</p>
                    <p className="text-xs text-zinc-400 truncate">{track.artist} — {track.album}</p>
                  </div>
                  <div 
                    className="w-12 h-12 rounded-xl flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${track.coverGradient[0]}, ${track.coverGradient[1]})` }}
                  />
                </div>
                <div className="flex items-center justify-around pt-2 border-t border-white/10">
                  <button onClick={onPrevious} className="p-2 text-zinc-300"><SkipBack className="w-4 h-4" /></button>
                  <button onClick={onTogglePlay} className="p-2.5 rounded-full bg-indigo-600 text-white">
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  </button>
                  <button onClick={onNext} className="p-2 text-zinc-300"><SkipForward className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'headphone' && (
            <div className="p-5 rounded-3xl bg-zinc-900 border border-white/10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400">
                  <Headphones className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Headphone Auto-Detection Hardware Sensor</h4>
                  <p className="text-xs text-zinc-400">Wired 3.5mm Jack & Bluetooth LE Protocol</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950 border border-white/5 cursor-pointer">
                  <span className="text-xs font-semibold text-zinc-300">Auto-Pause on Headset Disconnect</span>
                  <input
                    type="checkbox"
                    checked={headphoneAutoPause}
                    onChange={(e) => setHeadphoneAutoPause(e.target.checked)}
                    className="accent-indigo-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950 border border-white/5 cursor-pointer">
                  <span className="text-xs font-semibold text-zinc-300">Auto-Resume on Headset Re-connection</span>
                  <input
                    type="checkbox"
                    checked={headphoneAutoResume}
                    onChange={(e) => setHeadphoneAutoResume(e.target.checked)}
                    className="accent-indigo-500 rounded"
                  />
                </label>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSimulateHeadphoneDisconnect}
                  className="w-full py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  <Headphones className="w-4 h-4 text-indigo-400" />
                  <span>Simulate Unplug / Re-plug Headset (Current: {headphoneState})</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'car' && (
            <div className="p-6 bg-zinc-950 rounded-3xl border border-white/15 space-y-4 text-center">
              <div className="flex items-center justify-center gap-2 text-indigo-400">
                <Car className="w-6 h-6" />
                <span className="text-sm font-bold uppercase tracking-wider">Android Auto & Apple CarPlay</span>
              </div>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                High-contrast large touch targets designed for distraction-free navigation while driving.
              </p>
              <div className="p-4 bg-zinc-900 rounded-2xl border border-white/10 flex items-center justify-between gap-4">
                <div className="text-left min-w-0">
                  <span className="text-lg font-black text-white truncate block">{track.title}</span>
                  <span className="text-xs text-zinc-400 truncate block">{track.artist}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={onPrevious} className="p-3 rounded-2xl bg-zinc-800 text-white"><SkipBack className="w-6 h-6" /></button>
                  <button onClick={onTogglePlay} className="p-4 rounded-2xl bg-indigo-600 text-white">
                    {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                  </button>
                  <button onClick={onNext} className="p-3 rounded-2xl bg-zinc-800 text-white"><SkipForward className="w-6 h-6" /></button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
