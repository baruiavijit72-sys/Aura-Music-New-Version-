import React, { useState, useEffect } from 'react';
import { ExternalLink, X, ShieldCheck, Sparkles, Volume2 } from 'lucide-react';
import { REAL_ONLINE_ADS } from './RealAdBanner';

interface PersistentAdContainerProps {
  /** Optional slot index to vary the ad shown across pages */
  slotIndex?: number;
  /** Custom additional styling if needed */
  className?: string;
  /** Whether the banner can be dismissed */
  dismissible?: boolean;
}

/**
 * Dedicated Persistent Ad Container that simulates the spacing, docking, and design patterns
 * found in mainstream music streaming applications (such as Spotify Free and YouTube Music web & mobile).
 * 
 * Key Design & Spacing Characteristics:
 * 1. Sits in a dedicated, reserved structural dock right above bottom playback controls (MiniPlayer)
 *    so it NEVER collides with or overlaps core playback controls, track progress scrubbing, or navigation.
 * 2. Features a clean, horizontal banner layout (52px-58px height) mimicking native streaming ads with
 *    brand avatar, sponsored label, creative message, interactive call-to-action, and optional dismiss.
 * 3. Rotates periodically smoothly in the background.
 */
export const PersistentAdContainer: React.FC<PersistentAdContainerProps> = ({
  slotIndex = 0,
  className = '',
  dismissible = true
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [adIndex, setAdIndex] = useState(() => slotIndex % REAL_ONLINE_ADS.length);

  // Background smooth rotation every 35s
  useEffect(() => {
    const timer = setInterval(() => {
      setAdIndex((prev) => (prev + 1) % REAL_ONLINE_ADS.length);
    }, 35000);
    return () => clearInterval(timer);
  }, []);

  if (isDismissed) return null;

  const ad = REAL_ONLINE_ADS[adIndex];

  return (
    <aside 
      aria-label="Sponsored Advertisement"
      className={`w-full max-w-5xl mx-auto px-2 sm:px-4 mb-2 pointer-events-auto select-none transition-all duration-300 ${className}`}
    >
      <div 
        className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-white/10 shadow-lg backdrop-blur-xl bg-gradient-to-r from-[#0c131f]/95 via-[#111827]/95 to-[#0b121e]/95 hover:border-white/20 transition-all duration-300"
      >
        {/* Subtle accent bar at top edge */}
        <div 
          className="h-0.5 w-full opacity-75"
          style={{ backgroundColor: ad.platformColor }}
        />

        <div className="flex items-center justify-between gap-2.5 px-3 py-2 sm:px-4 sm:py-2.5">
          {/* Left: Brand Badge & Creative Info */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {/* Brand Logo / Avatar */}
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden border border-white/15 shrink-0 bg-black shadow-sm">
              <img 
                src={ad.brandAvatar} 
                alt={ad.brandName} 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content Text (Headline & Description truncated cleanly) */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span 
                  className="px-1.5 py-0.2 rounded text-[8px] sm:text-[9px] font-black uppercase text-white tracking-wider shadow-xs"
                  style={{ backgroundColor: ad.platformColor }}
                >
                  {ad.platformLabel}
                </span>

                <span className="text-[10px] text-zinc-400 font-medium hidden xs:inline-block">
                  Sponsored
                </span>

                {ad.verified && (
                  <ShieldCheck className="w-3 h-3 text-blue-400 shrink-0" />
                )}

                <span className="text-[11px] sm:text-xs font-bold text-white truncate max-w-[120px] sm:max-w-xs">
                  {ad.brandName}
                </span>
              </div>

              <p className="text-[11px] sm:text-xs text-zinc-300 font-medium truncate mt-0.5 max-w-md sm:max-w-xl">
                {ad.headline} <span className="text-zinc-400 hidden md:inline">— {ad.description}</span>
              </p>
            </div>
          </div>

          {/* Right: CTA & Dismiss */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={ad.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold text-white shadow-md transition-all active:scale-95 flex items-center gap-1.5 hover:brightness-110 cursor-pointer"
              style={{ 
                backgroundColor: ad.platformColor,
                boxShadow: `0 2px 10px ${ad.platformColor}33`
              }}
            >
              <span>{ad.ctaText}</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>

            {dismissible && (
              <button
                onClick={() => setIsDismissed(true)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="Dismiss ad"
                aria-label="Dismiss ad"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
