import React from 'react';

export type AppIconTheme = 'cosmic-clef' | 'disney-celestial';

interface AuraAppIconProps {
  size?: number | string;
  className?: string;
  variant?: 'full' | 'glyph' | 'minimal';
  theme?: AppIconTheme | string;
  animated?: boolean;
  glow?: boolean;
  onClick?: () => void;
  id?: string;
}

/**
 * Signature Aura Music App Icon
 * Flagship Disney+ Hotstar-inspired celestial design featuring:
 * - Midnight sapphire & cosmic twilight chassis
 * - Sweeping luminous stardust arc
 * - Radiant treble clef acoustic harmonic ribbon
 * - Specular diamond star flares & audio frequency waves
 */
export const AuraAppIcon: React.FC<AuraAppIconProps> = ({
  size = 48,
  className = '',
  variant = 'full',
  animated = false,
  glow = true,
  onClick,
  id = 'aura-app-icon',
}) => {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;
  const numSize = typeof size === 'number' ? size : parseInt(String(size), 10) || 48;

  return (
    <div
      id={id}
      onClick={onClick}
      style={{ width: pixelSize, height: pixelSize }}
      className={`relative select-none flex items-center justify-center flex-shrink-0 group ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {/* Dynamic Ambient Volumetric Cyan-Sapphire Stardust Glow */}
      {glow && (
        <div
          className={`absolute -inset-2 rounded-[32%] bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 opacity-45 blur-xl transition-all duration-700 pointer-events-none ${
            animated ? 'animate-pulse' : 'group-hover:opacity-80 group-hover:scale-110'
          }`}
          style={{ zIndex: 0 }}
        />
      )}

      {/* Master Vector Icon */}
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full relative z-10 drop-shadow-2xl overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Midnight Sapphire Cosmic Chassis */}
          <linearGradient id="aura_cosmosBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0a193d" />
            <stop offset="45%" stopColor="#040d24" />
            <stop offset="100%" stopColor="#010614" />
          </linearGradient>

          {/* Celestial Stardust Arc Gradient (Disney+ style) */}
          <linearGradient id="aura_stardustArc" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.2" />
            <stop offset="35%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="85%" stopColor="#fef08a" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.4" />
          </linearGradient>

          {/* Platinum / Ice Specular Rim */}
          <linearGradient id="aura_iceRim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#38bdf8" stopOpacity="0.7" />
            <stop offset="70%" stopColor="#818cf8" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#fde047" stopOpacity="0.85" />
          </linearGradient>

          {/* Central Celestial Nebula Flare */}
          <radialGradient id="aura_nebulaFlare" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
            <stop offset="35%" stopColor="#1e40af" stopOpacity="0.3" />
            <stop offset="70%" stopColor="#0f172a" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          {/* Glowing Treble Clef Ribbon (Cyan to Violet to Gold) */}
          <linearGradient id="aura_clefGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00e5ff" />
            <stop offset="35%" stopColor="#38bdf8" />
            <stop offset="70%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>

          {/* Diamond White Core Glow */}
          <linearGradient id="aura_coreGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="60%" stopColor="#f0f9ff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.85" />
          </linearGradient>

          {/* Specular Sheen */}
          <linearGradient id="aura_glassSheen" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.35" />
          </linearGradient>

          {/* High-Fidelity Neon Bloom Filter */}
          <filter id="aura_neonFilter" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="6.5" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {variant === 'full' && (
          <>
            {/* Outer Squircle Chassis */}
            <rect
              x="6"
              y="6"
              width="188"
              height="188"
              rx="48"
              fill="url(#aura_cosmosBg)"
            />

            {/* Core Celestial Nebula Lighting */}
            <rect
              x="6"
              y="6"
              width="188"
              height="188"
              rx="48"
              fill="url(#aura_nebulaFlare)"
            />

            {/* Twinkling Starlight Field */}
            <g opacity="0.75">
              <circle cx="34" cy="40" r="1.3" fill="#ffffff" />
              <circle cx="164" cy="36" r="1.6" fill="#fde047" />
              <circle cx="46" cy="164" r="1.2" fill="#38bdf8" />
              <circle cx="158" cy="156" r="1.4" fill="#a5f3fc" />
              <circle cx="174" cy="96" r="1" fill="#ffffff" />
              <circle cx="26" cy="110" r="1.2" fill="#fde047" />
              <circle cx="84" cy="22" r="1.4" fill="#38bdf8" />
              <circle cx="124" cy="178" r="1.3" fill="#ffffff" />
            </g>

            {/* Concentric Sonic Resonance Orbit Rings */}
            <g opacity="0.6">
              <circle
                cx="100"
                cy="100"
                r="64"
                stroke="url(#aura_clefGrad)"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                opacity="0.35"
              />
              <circle
                cx="100"
                cy="100"
                r="50"
                stroke="#38bdf8"
                strokeWidth="1.8"
                opacity="0.45"
              />
              <circle
                cx="100"
                cy="100"
                r="36"
                stroke="#818cf8"
                strokeWidth="1.2"
                strokeDasharray="2 4"
                opacity="0.4"
              />
            </g>

            {/* Sweeping Disney+ Hotstar Stardust Arc */}
            <g filter="url(#aura_neonFilter)">
              <path
                d="M 18 140 C 40 40, 150 25, 184 105"
                stroke="url(#aura_stardustArc)"
                strokeWidth="2.8"
                strokeLinecap="round"
                fill="none"
              />
              {/* Comet Head Star Sparkle */}
              <circle cx="106" cy="35" r="3.2" fill="#ffffff" />
              <circle cx="106" cy="35" r="6" stroke="#fef08a" strokeWidth="1.2" opacity="0.8" />
              <line x1="106" y1="28" x2="106" y2="42" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />
              <line x1="99" y1="35" x2="113" y2="35" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />
            </g>

            {/* Horizontal Soundwave Harmonics */}
            <g opacity="0.8" filter="url(#aura_neonFilter)">
              <path
                d="M 16 100 C 36 82, 56 118, 76 92 C 86 80, 95 106, 100 100 C 105 94, 114 118, 124 106 C 144 82, 164 118, 184 100"
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
                opacity="0.8"
              />
            </g>
          </>
        )}

        {/* --- Iconic Glowing Treble Clef Graphic --- */}
        <g id="aura-clef-artwork" filter="url(#aura_neonFilter)">
          {/* Outer Neon Glow Halo Stroke */}
          <path
            d="M 100 24 
               C 92 48, 86 64, 86 86 
               C 86 112, 108 126, 122 110 
               C 134 96, 126 76, 108 76 
               C 88 76, 76 96, 76 116 
               C 76 142, 98 158, 118 152 
               C 130 148, 134 136, 126 128 
               C 120 122, 110 126, 112 134 
               C 114 140, 120 140, 122 138
               M 100 24 
               L 100 162 
               C 100 174, 90 182, 80 178 
               C 72 174, 70 164, 76 158 
               C 82 152, 92 156, 90 166"
            stroke="url(#aura_clefGrad)"
            strokeWidth="7.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Inner Specular Laser Core Line */}
          <path
            d="M 100 24 
               C 92 48, 86 64, 86 86 
               C 86 112, 108 126, 122 110 
               C 134 96, 126 76, 108 76 
               C 88 76, 76 96, 76 116 
               C 76 142, 98 158, 118 152 
               C 130 148, 134 136, 126 128 
               C 120 122, 110 126, 112 134 
               C 114 140, 120 140, 122 138
               M 100 24 
               L 100 162 
               C 100 174, 90 182, 80 178 
               C 72 174, 70 164, 76 158 
               C 82 152, 92 156, 90 166"
            stroke="url(#aura_coreGlow)"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Clef Beacon Stars */}
          <circle cx="100" cy="24" r="3.6" fill="#ffffff" />
          <circle cx="100" cy="24" r="6.2" stroke="#38bdf8" strokeWidth="1.2" opacity="0.85" />
          <circle cx="82" cy="168" r="4.5" fill="#38bdf8" />
          <circle cx="82" cy="168" r="2.2" fill="#ffffff" />
        </g>

        {variant === 'full' && (
          <>
            {/* Top Curved Specular Glass Reflection */}
            <path
              d="M 6 52 C 6 26 26 6 52 6 L 148 6 C 174 6 194 26 194 52 L 194 88 C 150 74 72 78 6 118 Z"
              fill="url(#aura_glassSheen)"
            />

            {/* Precision Micro Chamfer Rim Border */}
            <rect
              x="6"
              y="6"
              width="188"
              height="188"
              rx="48"
              stroke="url(#aura_iceRim)"
              strokeWidth="2"
              fill="none"
            />
          </>
        )}
      </svg>

      {/* Outer Orbit Rings when Animated */}
      {animated && numSize >= 75 && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[126%] h-[126%] rounded-full border border-cyan-400/25 border-t-cyan-300 border-r-blue-400/40 animate-spin [animation-duration:9s]" />
          <div className="w-[148%] h-[148%] rounded-full border border-dashed border-indigo-400/20 border-b-yellow-300/45 animate-spin [animation-duration:15s] [animation-direction:reverse]" />
        </div>
      )}
    </div>
  );
};

export default AuraAppIcon;
