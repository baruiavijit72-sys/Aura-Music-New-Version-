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
  Check,
  Gem,
  Disc,
  Square,
  Circle,
  Hexagon,
  Waves,
  Activity,
  Sparkles
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
  const [artShape, setArtShape] = useState<'vinyl' | 'card' | 'halo' | 'cyber'>(() => {
    return (localStorage.getItem('aura_player_shape') as any) || 'vinyl';
  });
  const [visualizerStyle, setVisualizerStyle] = useState<'bars' | 'wave' | 'dots'>(() => {
    return (localStorage.getItem('aura_viz_style') as any) || 'bars';
  });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleSelectShape = (shape: 'vinyl' | 'card' | 'halo' | 'cyber') => {
    setArtShape(shape);
    localStorage.setItem('aura_player_shape', shape);
  };

  const handleToggleVizStyle = () => {
    const nextStyle: Record<'bars' | 'wave' | 'dots', 'bars' | 'wave' | 'dots'> = {
      bars: 'wave',
      wave: 'dots',
      dots: 'bars'
    };
    const updated = nextStyle[visualizerStyle];
    setVisualizerStyle(updated);
    localStorage.setItem('aura_viz_style', updated);
  };

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

      if (visualizerStyle === 'bars') {
        const barWidth = (canvas.width / 32);
        let x = 0;
        for (let i = 0; i < 32; i++) {
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
      } else if (visualizerStyle === 'wave') {
        ctx.beginPath();
        const sliceWidth = canvas.width / 32;
        let x = 0;
        for (let i = 0; i < 32; i++) {
          const val = isPlaying ? (dataArray[i] > 0 ? dataArray[i] : Math.sin(Date.now() / 250 + i * 0.5) * 40 + 128) : 128;
          const y = (val / 255) * (canvas.height - 8) + 4;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#0284c7';
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (visualizerStyle === 'dots') {
        const step = canvas.width / 24;
        for (let i = 0; i < 24; i++) {
          const val = isPlaying ? (dataArray[i * 2] || 35) : 15;
          const pulse = isPlaying ? Math.sin(Date.now() / 200 + i * 0.6) * 6 : 0;
          const yOffset = (canvas.height / 2) + pulse;
          const radius = Math.max(2.5, (val / 255) * 5.5);

          ctx.beginPath();
          ctx.arc(i * step + step / 2, yOffset, radius, 0, Math.PI * 2);
          ctx.fillStyle = i % 2 === 0 ? '#ec4899' : '#a855f7';
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#ec4899';
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      animFrame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animFrame);
  }, [isPlaying, visualizerStyle]);

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

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open_vip_modal'))}
              title="AURA VIP Lossless DSP"
              className="px-2 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-600/20 border border-amber-400/40 hover:border-amber-300 text-amber-300 flex items-center gap-1 text-[11px] font-bold transition active:scale-95 shadow cursor-pointer"
            >
              <Gem className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>VIP</span>
            </button>

            <button
              onClick={() => setShowLyrics(!showLyrics)}
              title="Toggle Lyrics"
              className={`p-2 rounded-xl transition cursor-pointer ${
                showLyrics ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <FileText className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenEQ}
              title="10-Band Equalizer"
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
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
              {/* Interactive Player Shape & Design Theme Switcher */}
              <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-2xl mb-4 shadow-inner">
                <button
                  onClick={() => handleSelectShape('vinyl')}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                    artShape === 'vinyl'
                      ? 'bg-amber-400 text-black shadow-md font-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Spinning Vinyl LP Record"
                >
                  <Disc className={`w-3.5 h-3.5 ${isPlaying && artShape === 'vinyl' ? 'animate-spin' : ''}`} />
                  <span>Vinyl</span>
                </button>

                <button
                  onClick={() => handleSelectShape('card')}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                    artShape === 'card'
                      ? 'bg-indigo-600 text-white shadow-md font-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Modern Studio Card"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Card</span>
                </button>

                <button
                  onClick={() => handleSelectShape('halo')}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                    artShape === 'halo'
                      ? 'bg-pink-600 text-white shadow-md font-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Pulsing Halo Disc"
                >
                  <Circle className="w-3.5 h-3.5" />
                  <span>Halo</span>
                </button>

                <button
                  onClick={() => handleSelectShape('cyber')}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                    artShape === 'cyber'
                      ? 'bg-cyan-500 text-black shadow-md font-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Cyber Hexagon Diamond"
                >
                  <Hexagon className="w-3.5 h-3.5" />
                  <span>Cyber</span>
                </button>
              </div>

              {/* SHAPE 1: VINYL LP RECORD (ঘূর্ণায়মান ভিনাইল ডিস্ক) */}
              {artShape === 'vinyl' && (
                <div className="relative flex items-center justify-center my-2">
                  {/* Turntable Stylus / Tonearm Indicator */}
                  <div 
                    className={`absolute -top-3 -right-2 z-20 transition-all duration-700 origin-top-right pointer-events-none ${
                      isPlaying ? 'rotate-6 translate-x-1' : '-rotate-12 opacity-60'
                    }`}
                  >
                    <div className="w-1.5 h-16 bg-gradient-to-b from-zinc-200 via-zinc-400 to-zinc-600 rounded-full shadow-lg" />
                    <div className="w-4 h-5 bg-amber-400 rounded-sm -ml-1.5 -mt-1 shadow-md border border-amber-300 flex items-center justify-center">
                      <div className="w-1 h-1 bg-red-500 rounded-full" />
                    </div>
                  </div>

                  {/* 360° Rotating Vinyl Disc */}
                  <div 
                    className={`w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-[#0a0c10] border-4 border-zinc-800 shadow-[0_15px_40px_rgba(0,0,0,0.85)] relative flex items-center justify-center transition-all ${
                      isPlaying ? 'animate-[spin_12s_linear_infinite]' : ''
                    }`}
                    style={{
                      boxShadow: `0 0 35px ${track.coverGradient[0]}33, 0 20px 40px rgba(0,0,0,0.9)`
                    }}
                  >
                    {/* Concentric Audio Grooves */}
                    <div className="absolute inset-3 rounded-full border border-white/5 pointer-events-none" />
                    <div className="absolute inset-6 rounded-full border border-white/5 pointer-events-none" />
                    <div className="absolute inset-10 rounded-full border border-white/5 pointer-events-none" />
                    <div className="absolute inset-14 rounded-full border border-white/10 pointer-events-none" />
                    
                    {/* Opposing Radial Light Reflections */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/[0.04] via-transparent to-white/[0.04] pointer-events-none" />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/[0.03] via-transparent to-white/[0.03] pointer-events-none" />

                    {/* Center Album Art Label */}
                    <div 
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-full shadow-inner flex flex-col items-center justify-center relative overflow-hidden border-2 border-zinc-700/60"
                      style={{
                        background: `linear-gradient(135deg, ${track.coverGradient[0]}, ${track.coverGradient[1]})`
                      }}
                    >
                      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
                      <span className="text-xl sm:text-2xl font-black text-white/95 tracking-tighter relative z-10">AURA</span>
                      <span className="text-[8px] font-bold text-amber-300 uppercase tracking-widest relative z-10">{track.format}</span>
                      
                      {/* Spindle Center Hole */}
                      <div className="w-5 h-5 rounded-full bg-zinc-950 border-2 border-zinc-400 shadow-inner mt-1 relative z-10 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SHAPE 2: MODERN STUDIO CARD (মডার্ন স্টুডিও কার্ড) */}
              {artShape === 'card' && (
                <div 
                  className="w-56 h-56 sm:w-64 sm:h-64 rounded-3xl shadow-2xl flex items-center justify-center relative overflow-hidden transition-all duration-500 hover:scale-105 my-2"
                  style={{
                    background: `linear-gradient(135deg, ${track.coverGradient[0]}, ${track.coverGradient[1]})`,
                    boxShadow: `0 20px 45px ${track.coverGradient[0]}44, 0 10px 25px rgba(0,0,0,0.8)`
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
              )}

              {/* SHAPE 3: PULSING HALO DISC (সার্কুলার নিয়ন রিং) */}
              {artShape === 'halo' && (
                <div className="relative flex items-center justify-center my-2">
                  <div 
                    className={`absolute -inset-3 rounded-full opacity-60 blur-md transition-all pointer-events-none ${
                      isPlaying ? 'animate-pulse' : 'opacity-20'
                    }`}
                    style={{
                      background: `linear-gradient(135deg, ${track.coverGradient[0]}, ${track.coverGradient[1]})`
                    }}
                  />
                  <div 
                    className="w-56 h-56 sm:w-64 sm:h-64 rounded-full shadow-2xl flex items-center justify-center relative overflow-hidden border-2 border-white/20"
                    style={{
                      background: `linear-gradient(135deg, ${track.coverGradient[0]}, ${track.coverGradient[1]})`
                    }}
                  >
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
                    <div className="text-center p-4 relative z-10">
                      <span className="text-5xl font-black text-white/50 tracking-tighter">AURA</span>
                      <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 border border-white/20 backdrop-blur-md">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">{track.format}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SHAPE 4: CYBER HEXAGON / DIAMOND (সাইবার জ্যামিতিক হেক্সাগন) */}
              {artShape === 'cyber' && (
                <div className="relative flex items-center justify-center my-2">
                  <div 
                    className="w-56 h-56 sm:w-64 sm:h-64 shadow-2xl flex items-center justify-center relative transition-all"
                    style={{
                      clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                      background: `linear-gradient(135deg, ${track.coverGradient[0]}, ${track.coverGradient[1]})`,
                      boxShadow: `0 0 40px ${track.coverGradient[1]}55`
                    }}
                  >
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
                    <div className="text-center p-4 relative z-10">
                      <div className="px-2 py-0.5 rounded bg-cyan-400/20 border border-cyan-400/40 text-cyan-300 text-[9px] font-mono font-bold uppercase mb-1">
                        CYBER ACOUSTIC
                      </div>
                      <span className="text-4xl sm:text-5xl font-black text-white/70 tracking-tighter">AURA</span>
                      <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/60 border border-white/20">
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span className="text-[10px] font-bold text-white font-mono uppercase">{track.format} • 96kHz</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Waveform Visualizer Canvas with Mode Toggler */}
              <div className="w-full max-w-sm mt-3 flex flex-col items-center">
                <div 
                  onClick={handleToggleVizStyle}
                  className="w-full cursor-pointer group relative"
                  title="Click to toggle visualizer mode (Bars / Wave / Dots)"
                >
                  <canvas 
                    ref={canvasRef} 
                    width={320} 
                    height={36} 
                    className="w-full h-9 rounded-xl opacity-90 transition-opacity group-hover:opacity-100"
                  />
                  <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500 mt-1 px-1">
                    <span className="flex items-center gap-1 text-zinc-400 group-hover:text-amber-300 transition">
                      <Activity className="w-2.5 h-2.5" />
                      <span className="capitalize">{visualizerStyle} Visualizer</span>
                    </span>
                    <span className="text-zinc-600 group-hover:text-zinc-400 transition">Tap to change style</span>
                  </div>
                </div>
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
