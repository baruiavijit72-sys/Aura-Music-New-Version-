import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Volume2, 
  VolumeX, 
  ArrowRight, 
  Sparkles
} from 'lucide-react';

export type SplashSceneType = 'disney-hotstar';

interface SplashScreenProps {
  onComplete: () => void;
  autoDismissMs?: number;
  initialScene?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  autoDismissMs = 4600,
}) => {
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play Disney+ Hotstar-inspired celestial harp & orchestral startup chime
  const playStartupChime = () => {
    if (isSoundMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const now = ctx.currentTime + 0.05;

      // 1. Ascending Magical Celestial Harp Glissando (Disney+ Hotstar style)
      const arpeggio = [
        { freq: 261.63, delay: 0.00, gain: 0.12, type: 'sine' as OscillatorType }, // C4
        { freq: 329.63, delay: 0.08, gain: 0.13, type: 'sine' as OscillatorType }, // E4
        { freq: 392.00, delay: 0.16, gain: 0.14, type: 'sine' as OscillatorType }, // G4
        { freq: 493.88, delay: 0.24, gain: 0.15, type: 'sine' as OscillatorType }, // B4
        { freq: 523.25, delay: 0.32, gain: 0.16, type: 'triangle' as OscillatorType }, // C5
        { freq: 659.25, delay: 0.40, gain: 0.15, type: 'sine' as OscillatorType }, // E5
        { freq: 783.99, delay: 0.48, gain: 0.16, type: 'triangle' as OscillatorType }, // G5
        { freq: 987.77, delay: 0.56, gain: 0.14, type: 'sine' as OscillatorType }, // B5
        { freq: 1046.50, delay: 0.64, gain: 0.18, type: 'triangle' as OscillatorType }, // C6
        { freq: 1318.51, delay: 0.72, gain: 0.14, type: 'sine' as OscillatorType }, // E6
      ];

      arpeggio.forEach(({ freq, delay, gain, type }) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now + delay);
        gainNode.gain.setValueAtTime(0.0001, now + delay);
        gainNode.gain.exponentialRampToValueAtTime(gain, now + delay + 0.06);
        gainNode.gain.exponentialRampToValueAtTime(gain * 0.4, now + delay + 1.2);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, now + delay + 3.2);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 3.4);
      });

      // 2. Warm Celestial Major-9th Orchestral Pad (C - E - G - B - D)
      const chordNotes = [130.81, 164.81, 196.00, 246.94, 293.66];
      chordNotes.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + 0.6);
        gainNode.gain.setValueAtTime(0.0001, now + 0.6);
        gainNode.gain.exponentialRampToValueAtTime(0.08, now + 0.9);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, now + 3.8);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(now + 0.6);
        osc.stop(now + 4.0);
      });

      // 3. Shimmering Stardust Crystal Bell & Resonant Sparkle
      const bellFreqs = [2093.00, 2637.02, 3135.96];
      bellFreqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + 0.8 + idx * 0.1);
        gainNode.gain.setValueAtTime(0.0001, now + 0.8 + idx * 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.05, now + 0.85 + idx * 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, now + 3.2);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(now + 0.8 + idx * 0.1);
        osc.stop(now + 3.4);
      });

      // 4. Subtle Sub-Bass Theater Foundation
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(65.41, now + 0.5); // C2
      subGain.gain.setValueAtTime(0.0001, now + 0.5);
      subGain.gain.exponentialRampToValueAtTime(0.15, now + 0.8);
      subGain.gain.exponentialRampToValueAtTime(0.00001, now + 3.5);
      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(now + 0.5);
      subOsc.stop(now + 3.6);

    } catch (e) {
      console.warn('AudioContext autoplay prevented or unsupported:', e);
    }
  };

  useEffect(() => {
    // Trigger chime on initial mount
    const timer = setTimeout(() => {
      playStartupChime();
    }, 200);

    // Progress bar animation ticker
    const intervalMs = 30;
    const step = 100 / (autoDismissMs / intervalMs);
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + step;
      });
    }, intervalMs);

    // Dismiss splash timer
    const dismissTimer = setTimeout(() => {
      handleComplete();
    }, autoDismissMs);

    return () => {
      clearTimeout(timer);
      clearTimeout(dismissTimer);
      clearInterval(progressInterval);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [autoDismissMs, isSoundMuted]);

  const handleComplete = () => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 600);
  };

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          id="disney-hotstar-splash-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: 'blur(10px)' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#010614] select-none overflow-hidden font-sans text-white"
        >
          {/* ========================================================
              DEEP CINEMATIC MIDNIGHT BACKGROUND WITH CELESTIAL AURA
              ======================================================== */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Multi-layered radial cosmic light */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#072559] via-[#020e26] to-[#010614] opacity-90" />
            
            {/* Center Volumetric Horizon Light Beam */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0.3 }}
              animate={{ opacity: [0, 0.7, 0.45], scaleX: [0.3, 1.2, 1] }}
              transition={{ duration: 2.2, ease: "easeOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[320px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent blur-3xl rounded-full"
            />

            {/* Subtle Ethereal Starfield Grid */}
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:32px_32px]" />

            {/* Floating Celestial Sparkle Particles */}
            {[
              { top: '22%', left: '18%', delay: 0.4, size: 'w-1.5 h-1.5', color: 'bg-white' },
              { top: '35%', left: '78%', delay: 0.8, size: 'w-2 h-2', color: 'bg-amber-200' },
              { top: '68%', left: '25%', delay: 1.2, size: 'w-1.5 h-1.5', color: 'bg-cyan-300' },
              { top: '75%', left: '72%', delay: 0.6, size: 'w-1.5 h-1.5', color: 'bg-white' },
              { top: '18%', left: '60%', delay: 1.0, size: 'w-1 h-1', color: 'bg-sky-300' },
              { top: '82%', left: '42%', delay: 1.4, size: 'w-1 h-1', color: 'bg-amber-100' },
              { top: '28%', left: '88%', delay: 0.3, size: 'w-1.5 h-1.5', color: 'bg-cyan-200' },
              { top: '60%', left: '12%', delay: 0.9, size: 'w-1.5 h-1.5', color: 'bg-white' },
            ].map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0, 0.9, 0.2, 0.9],
                  scale: [0, 1.3, 0.8, 1.2]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: p.delay,
                  ease: "easeInOut"
                }}
                className={`absolute ${p.size} ${p.color} rounded-full shadow-[0_0_8px_#38bdf8]`}
                style={{ top: p.top, left: p.left }}
              />
            ))}
          </div>

          {/* ========================================================
              TOP CONTROLS (AUDIO TOGGLE)
              ======================================================== */}
          <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
            <button
              id="splash-sound-toggle"
              onClick={() => {
                const nextMuted = !isSoundMuted;
                setIsSoundMuted(nextMuted);
                if (!nextMuted) playStartupChime();
              }}
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-300 hover:text-white transition-all backdrop-blur-md cursor-pointer"
              title={isSoundMuted ? "Unmute Startup Chime" : "Mute Startup Chime"}
            >
              {isSoundMuted ? <VolumeX className="w-4 h-4 text-zinc-400" /> : <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" />}
            </button>
          </div>

          {/* ========================================================
              MAIN CENTERPIECE: DISNEY+ HOTSTAR AURA MUSIC LOGO & ARC
              ======================================================== */}
          <div className="relative z-10 flex flex-col items-center justify-center px-4 w-full max-w-2xl">
            
            {/* SVG THEATER CANVAS: SWEEPING STARDUST ARC & COMET */}
            <div className="relative w-[340px] sm:w-[480px] md:w-[560px] h-[220px] sm:h-[260px] flex items-center justify-center">
              
              {/* Dynamic Disney+ Hotstar Stardust Parabolic Arc */}
              <svg 
                viewBox="0 0 600 300" 
                className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
              >
                <defs>
                  {/* Arc Glow Filter */}
                  <filter id="arcGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur1" />
                    <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="blur2" />
                    <feMerge>
                      <feMergeNode in="blur2" />
                      <feMergeNode in="blur1" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>

                  {/* Arc Gradient */}
                  <linearGradient id="stardustGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00e5ff" stopOpacity="0" />
                    <stop offset="25%" stopColor="#38bdf8" stopOpacity="0.7" />
                    <stop offset="55%" stopColor="#ffffff" stopOpacity="1" />
                    <stop offset="80%" stopColor="#fef08a" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.1" />
                  </linearGradient>

                  {/* Core Laser Arc Gradient */}
                  <linearGradient id="coreLaserGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                    <stop offset="40%" stopColor="#ffffff" stopOpacity="1" />
                    <stop offset="70%" stopColor="#fef08a" stopOpacity="1" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Ambient Diffuse Stardust Trail */}
                <motion.path
                  d="M 40 240 C 130 50, 470 40, 560 220"
                  fill="none"
                  stroke="url(#stardustGrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  filter="url(#arcGlow)"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: [0, 0.9, 0.8] }}
                  transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                />

                {/* Razor Sharp Core Stardust Beam */}
                <motion.path
                  d="M 40 240 C 130 50, 470 40, 560 220"
                  fill="none"
                  stroke="url(#coreLaserGrad)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                />

                {/* Traveling Comet Starhead at Arc Apex */}
                <motion.g
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: [0, 1, 1, 0.7], 
                    scale: [0.5, 1.4, 1, 1.1] 
                  }}
                  transition={{ duration: 2.2, delay: 0.6, ease: "easeOut" }}
                >
                  {/* Comet Star Burst Positioned Near Top Center of Arc (x=300, y=78) */}
                  <circle cx="300" cy="78" r="4" fill="#ffffff" filter="url(#arcGlow)" />
                  <circle cx="300" cy="78" r="9" stroke="#fde047" strokeWidth="1.5" opacity="0.8" />
                  <line x1="300" y1="58" x2="300" y2="98" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                  <line x1="280" y1="78" x2="320" y2="78" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                  <line x1="286" y1="64" x2="314" y2="92" stroke="#fef08a" strokeWidth="1.2" strokeLinecap="round" />
                  <line x1="314" y1="64" x2="286" y2="92" stroke="#fef08a" strokeWidth="1.2" strokeLinecap="round" />
                </motion.g>

                {/* Left Origin Sparkle Burst */}
                <motion.g
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: [0, 1, 0], scale: [0.5, 1.8, 0] }}
                  transition={{ duration: 1.2, delay: 0.1, ease: "easeOut" }}
                >
                  <circle cx="40" cy="240" r="6" fill="#00e5ff" filter="url(#arcGlow)" />
                </motion.g>

                {/* Right Landing Sparkle Burst */}
                <motion.g
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: [0, 1, 0], scale: [0.5, 2, 0] }}
                  transition={{ duration: 1.4, delay: 1.5, ease: "easeOut" }}
                >
                  <circle cx="560" cy="220" r="7" fill="#fde047" filter="url(#arcGlow)" />
                </motion.g>
              </svg>

              {/* CELESTIAL EMBLEM & SOUNDWAVE FLUX */}
              <motion.div
                initial={{ opacity: 0, scale: 0.7, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                className="relative z-10 flex flex-col items-center justify-center mt-4"
              >
                {/* Radiant Acoustic Beacon */}
                <div className="relative mb-2 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-400 via-sky-300 to-amber-200 p-0.5 shadow-[0_0_30px_rgba(56,189,248,0.7)] flex items-center justify-center">
                    <div className="w-full h-full bg-[#020b1e] rounded-full flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-cyan-300 animate-pulse" />
                    </div>
                  </div>
                  {/* Concentric Pulsing Sound Rings */}
                  <motion.div
                    animate={{ scale: [1, 1.6, 2], opacity: [0.6, 0.2, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
                    className="absolute inset-0 rounded-full border border-cyan-400/40 pointer-events-none"
                  />
                </div>

                {/* GRAND "AURA" DISPLAY TITLE IN DISNEY+ HOTSTAR ELEGANCE */}
                <div className="relative flex items-center justify-center">
                  <motion.h1
                    initial={{ letterSpacing: '0.08em', opacity: 0, y: 10 }}
                    animate={{ letterSpacing: '0.14em', opacity: 1, y: 0 }}
                    transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                    className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-[0.14em] uppercase text-transparent bg-clip-text bg-gradient-to-b from-white via-sky-100 to-cyan-300 drop-shadow-[0_4px_28px_rgba(56,189,248,0.65)] select-none font-serif"
                  >
                    Aura
                  </motion.h1>

                  {/* Specular Shimmer Gleam Passing Across "AURA" */}
                  <motion.div
                    initial={{ x: '-150%', opacity: 0 }}
                    animate={{ x: '150%', opacity: [0, 0.9, 0] }}
                    transition={{ duration: 1.6, delay: 0.9, ease: "easeInOut" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent skew-x-[-25deg] pointer-events-none"
                  />
                </div>

                {/* "MUSIC" SUBTITLE WITH HORIZONTAL LIGHT BEAMS */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }}
                  className="flex items-center gap-3 sm:gap-4 mt-1"
                >
                  {/* Left Celestial Divider Rule */}
                  <div className="w-10 sm:w-16 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/60 to-white" />
                  
                  {/* Diamond Star Anchor */}
                  <div className="w-1.5 h-1.5 rotate-45 bg-amber-200 shadow-[0_0_6px_#fef08a]" />

                  {/* "MUSIC" Lettering */}
                  <p className="text-xs sm:text-sm md:text-base font-semibold tracking-[0.35em] text-cyan-200 uppercase drop-shadow-[0_0_12px_rgba(56,189,248,0.5)]">
                    Music
                  </p>

                  {/* Diamond Star Anchor */}
                  <div className="w-1.5 h-1.5 rotate-45 bg-amber-200 shadow-[0_0_6px_#fef08a]" />

                  {/* Right Celestial Divider Rule */}
                  <div className="w-10 sm:w-16 h-[1.5px] bg-gradient-to-l from-transparent via-cyan-400/60 to-white" />
                </motion.div>

                {/* Hi-Res Lossless Tagline */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.85 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="mt-2 text-[10px] sm:text-xs tracking-[0.25em] text-cyan-300 font-mono uppercase"
                >
                  Hi-Res Audio Originals & Soundscapes
                </motion.div>

                {/* ELEGANT & STYLISH SIGNATURE: MADE BY AVIJIT (Royal Capsule & Custom Styling) */}
                <motion.div
                  id="splash-author-signature-center"
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="mt-6 flex flex-col items-center justify-center relative group"
                >
                  {/* Glowing Multi-Color Ambient Halo */}
                  <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-amber-500/30 via-rose-500/30 to-cyan-400/30 blur-xl opacity-90 animate-pulse pointer-events-none" />

                  {/* Luxury Royal Surface Capsule */}
                  <div className="relative px-7 py-2.5 rounded-full bg-gradient-to-r from-[#0B0D14] via-[#121420] to-[#0B0D14] border-1.5 border-amber-300/50 shadow-[0_10px_35px_rgba(0,0,0,0.9),0_0_20px_rgba(251,191,36,0.35)] flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow shrink-0" />
                    
                    <span className="text-[11px] sm:text-xs font-black tracking-[0.25em] uppercase text-slate-200">
                      MADE BY
                    </span>

                    <span className="text-cyan-400 text-xs font-black">✦</span>

                    {/* Highly Stylish Avijit Script Signature */}
                    <span 
                      style={{ fontFamily: "'Playfair Display', 'Cinzel', serif", letterSpacing: "0.1em" }}
                      className="text-lg sm:text-xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-rose-100 to-amber-300 drop-shadow-[0_2px_14px_rgba(251,191,36,0.7)] px-1"
                    >
                      AVIJIT
                    </span>

                    <Sparkles className="w-4 h-4 text-rose-400 animate-pulse shrink-0" />
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* ========================================================
              BOTTOM BAR: FIXED ATTRIBUTION, LASER PROGRESS & SKIP ACTION
              ======================================================== */}
          <div className="absolute bottom-6 sm:bottom-8 left-4 sm:left-8 right-4 sm:right-8 z-30 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            
            {/* Bottom Stylish Signature: MADE BY AVIJIT (Always Visible on Mobile & Desktop) */}
            <motion.div 
              id="splash-footer-signature"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-md"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] sm:text-[11px] text-zinc-300 uppercase tracking-widest font-mono">
                Aura Player
              </span>
              <span className="text-zinc-600">•</span>
              <span 
                style={{ fontFamily: "'Playfair Display', serif" }}
                className="text-xs sm:text-sm font-bold italic text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]"
              >
                Made by Avijit
              </span>
            </motion.div>

            {/* Glowing Laser Progress Line */}
            <div className="w-full sm:max-w-xs h-1.5 rounded-full bg-white/10 overflow-hidden relative shadow-inner">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-300 shadow-[0_0_12px_#38bdf8]"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Subtle Skip Arrow Icon Button */}
            <button
              id="splash-skip-button"
              onClick={handleComplete}
              className="hidden sm:flex p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-zinc-300 hover:text-white transition-all backdrop-blur-md items-center justify-center cursor-pointer active:scale-95 shadow-lg shadow-black/40"
              title="Skip Splash Screen"
            >
              <ArrowRight className="w-4 h-4 text-cyan-300" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
