import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Repeat1, 
  Heart, 
  SlidersHorizontal, 
  Clock, 
  FileText, 
  Volume2, 
  Share2, 
  Scissors, 
  Tags, 
  Gauge, 
  Zap, 
  Check
} from 'lucide-react';
import { Track, PlaybackMode, EqualizerSettings } from '../types';
import { LyricsView } from './LyricsView';
import { audioEngine } from '../utils/audioEngine';

interface NowPlayingModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  playbackMode: PlaybackMode;
  onCyclePlaybackMode: () => void;
  onToggleFavorite: (id: string) => void;
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
  onOpenEQ: () => void;
  onOpenSleepTimer: () => void;
  onOpenTagEditor: (track: Track) => void;
  onOpenAudioTrimmer: (track: Track) => void;
  onOpenP2PWithTrack: (track: Track) => void;
  onOpenLyricsEditor: (track: Track) => void;
  eqSettings: EqualizerSettings;
  onUpdateEQ: (settings: EqualizerSettings) => void;
}

export const NowPlayingModal: React.FC<NowPlayingModalProps> = ({
  isOpen,
  onClose,
  track,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrevious,
  playbackMode,
  onCyclePlaybackMode,
  onToggleFavorite,
  currentTime,
  duration,
  onSeek,
  onOpenEQ,
  onOpenSleepTimer,
  onOpenTagEditor,
  onOpenAudioTrimmer,
  onOpenP2PWithTrack,
  onOpenLyricsEditor,
  eqSettings,
  onUpdateEQ,
}) => {
  const [showLyrics, setShowLyrics] = useState(false);
  const [showSpeedDialog, setShowSpeedDialog] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Format seconds to mm:ss
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Real-time canvas waveform visualizer
  useEffect(() => {
    let animFrame: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = new Uint8Array(64);

    const render = () => {
      audioEngine.getVisualizerData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / 32);
      let x = 0;

      for (let i = 0; i < 32; i++) {
        // Fallback pulsing if web audio buffer synthetic
        const value = isPlaying ? (dataArray[i] > 0 ? dataArray[i] : Math.sin(Date.now() / 200 + i) * 30 + 50) : 10;
        const percent = Math.min(1, value / 255);
        const barHeight = Math.max(4, percent * canvas.height);

        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#6366f1');
        gradient.addColorStop(0.5, '#a855f7');
        gradient.addColorStop(1, '#ec4899');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, (canvas.height - barHeight) / 2, barWidth - 3, barHeight, 3);
        ctx.fill();

        x += barWidth;
      }

      animFrame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animFrame);
  }, [isPlaying]);

  if (!isOpen || !track) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-2xl bg-black/85 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl max-h-[92vh] flex flex-col bg-zinc-950/95 border border-white/15 rounded-3xl shadow-2xl overflow-hidden relative"
      >
        {/* Dynamic Glow Background */}
        <div 
          className="absolute -top-32 -left-32 w-80 h-80 rounded-full blur-[100px] opacity-25 pointer-events-none"
          style={{ background: track.coverGradient[0] }}
        />
        <div 
          className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full blur-[100px] opacity-25 pointer-events-none"
          style={{ background: track.coverGradient[1] }}
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 z-10">
          <button 
            id="btn-close-nowplaying"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center">
            <p className="text-[11px] font-bold tracking-widest text-indigo-400 uppercase">Now Playing Master</p>
            <p className="text-xs text-zinc-400 font-medium truncate max-w-[200px]">{track.album}</p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowLyrics(!showLyrics)}
              title="Toggle Lyrics"
              className={`p-2 rounded-xl transition ${
                showLyrics ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <FileText className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenEQ}
              title="10-Band Equalizer"
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 z-10">
          {showLyrics ? (
            <LyricsView 
              lyricsLrc={track.lyricsLrc}
              currentTime={currentTime}
              onSeek={onSeek}
              onEditLyrics={() => onOpenLyricsEditor(track)}
            />
          ) : (
            <div className="flex flex-col items-center">
              {/* Album Art Card */}
              <div 
                className="w-56 h-56 sm:w-64 sm:h-64 rounded-3xl shadow-2xl flex items-center justify-center relative overflow-hidden transition-transform duration-500 hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${track.coverGradient[0]}, ${track.coverGradient[1]})`
                }}
              >
                <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
                <div className="text-center p-4 relative z-10">
                  <span className="text-5xl font-black text-white/40 tracking-tighter">AURA</span>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-white/20 backdrop-blur-md">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">{track.format}</span>
                  </div>
                </div>
              </div>

              {/* Waveform Visualizer Canvas */}
              <div className="w-full max-w-sm mt-5">
                <canvas 
                  ref={canvasRef} 
                  width={320} 
                  height={36} 
                  className="w-full h-9 rounded-xl opacity-90"
                />
              </div>

              {/* Track Title & Artist */}
              <div className="w-full flex items-center justify-between mt-4">
                <div className="min-w-0 flex-1 pr-3">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white truncate">{track.title}</h2>
                  <p className="text-sm font-medium text-zinc-400 truncate mt-0.5">{track.artist}</p>
                </div>
                <button
                  id="btn-np-favorite"
                  onClick={() => onToggleFavorite(track.id)}
                  className={`p-3 rounded-2xl transition ${
                    track.isFavorite 
                      ? 'text-pink-500 bg-pink-500/20 border border-pink-500/30' 
                      : 'text-zinc-400 hover:text-white bg-zinc-900 border border-white/10'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${track.isFavorite ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Format Badges */}
              <div className="w-full flex items-center gap-2 mt-2 text-[11px] text-zinc-400 font-semibold flex-wrap">
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">{track.bitrate}</span>
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">{track.sampleRate}</span>
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">{track.genre}</span>
              </div>
            </div>
          )}

          {/* Scrubber Progress Bar */}
          <div className="space-y-1.5 pt-2">
            <div className="relative group flex items-center">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => onSeek(parseFloat(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
            <div className="flex justify-between text-xs font-semibold text-zinc-500">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Primary Playback Controls */}
          <div className="flex items-center justify-between px-2 pt-2">
            {/* Playback Mode */}
            <button
              id="btn-np-mode"
              onClick={onCyclePlaybackMode}
              title={`Mode: ${playbackMode}`}
              className={`p-2.5 rounded-xl transition ${
                playbackMode !== 'SEQUENTIAL' ? 'text-indigo-400 bg-indigo-500/15' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {playbackMode === 'SHUFFLE' ? (
                <Shuffle className="w-5 h-5" />
              ) : playbackMode === 'REPEAT_ONE' ? (
                <Repeat1 className="w-5 h-5" />
              ) : (
                <Repeat className={`w-5 h-5 ${playbackMode === 'REPEAT_ALL' ? 'text-indigo-400' : ''}`} />
              )}
            </button>

            {/* Skip -10s */}
            <button
              onClick={() => onSeek(Math.max(0, currentTime - 10))}
              className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 text-xs font-bold"
              title="Rewind 10s"
            >
              -10s
            </button>

            {/* Previous */}
            <button
              id="btn-np-prev"
              onClick={onPrevious}
              className="p-3 rounded-2xl bg-zinc-900 border border-white/10 text-white hover:bg-zinc-800 transition"
            >
              <SkipBack className="w-6 h-6 fill-current" />
            </button>

            {/* Play / Pause Master */}
            <button
              id="btn-np-playpause"
              onClick={onTogglePlay}
              className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/40 hover:scale-105 active:scale-95 transition"
            >
              {isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
            </button>

            {/* Next */}
            <button
              id="btn-np-next"
              onClick={onNext}
              className="p-3 rounded-2xl bg-zinc-900 border border-white/10 text-white hover:bg-zinc-800 transition"
            >
              <SkipForward className="w-6 h-6 fill-current" />
            </button>

            {/* Skip +10s */}
            <button
              onClick={() => onSeek(Math.min(duration, currentTime + 10))}
              className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 text-xs font-bold"
              title="Forward 10s"
            >
              +10s
            </button>

            {/* Sleep Timer */}
            <button
              id="btn-np-sleep"
              onClick={onOpenSleepTimer}
              title="Smart Sleep Timer"
              className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition"
            >
              <Clock className="w-5 h-5" />
            </button>
          </div>

          {/* Secondary Utility Controls */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/10">
            <button
              onClick={() => setShowSpeedDialog(!showSpeedDialog)}
              className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border text-xs font-semibold transition ${
                eqSettings.playbackSpeed !== 1.0
                  ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                  : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              <Gauge className="w-4 h-4" />
              <span>{eqSettings.playbackSpeed}x Speed</span>
            </button>

            <button
              onClick={() => onOpenTagEditor(track)}
              className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white text-xs font-semibold transition"
            >
              <Tags className="w-4 h-4 text-emerald-400" />
              <span>Tag Editor</span>
            </button>

            <button
              onClick={() => onOpenAudioTrimmer(track)}
              className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white text-xs font-semibold transition"
            >
              <Scissors className="w-4 h-4 text-amber-400" />
              <span>Ringtone</span>
            </button>

            <button
              onClick={() => onOpenP2PWithTrack(track)}
              className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white text-xs font-semibold transition"
            >
              <Share2 className="w-4 h-4 text-pink-400" />
              <span>P2P Send</span>
            </button>
          </div>

          {/* Speed & Pitch Controls Panel */}
          {showSpeedDialog && (
            <div className="p-4 rounded-2xl bg-zinc-900 border border-indigo-500/30 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-indigo-400">Playback Speed & Sound Engine</span>
                <span className="text-xs font-bold text-white">{eqSettings.playbackSpeed}x</span>
              </div>
              <div className="flex items-center gap-2">
                {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => onUpdateEQ({ ...eqSettings, playbackSpeed: rate })}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                      eqSettings.playbackSpeed === rate
                        ? 'bg-indigo-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              {/* Gapless & Crossfade Quick Switch */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                  <input
                    type="checkbox"
                    checked={eqSettings.gaplessPlayback}
                    onChange={(e) => onUpdateEQ({ ...eqSettings, gaplessPlayback: e.target.checked })}
                    className="accent-indigo-500 rounded"
                  />
                  <span>Gapless Playback</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-400">Crossfade:</span>
                  <select
                    value={eqSettings.crossfadeSeconds}
                    onChange={(e) => onUpdateEQ({ ...eqSettings, crossfadeSeconds: parseInt(e.target.value, 10) })}
                    className="bg-zinc-800 border border-white/10 rounded px-2 py-0.5 text-xs text-white"
                  >
                    <option value={0}>Off</option>
                    <option value={2}>2 sec</option>
                    <option value={5}>5 sec</option>
                    <option value={8}>8 sec</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
