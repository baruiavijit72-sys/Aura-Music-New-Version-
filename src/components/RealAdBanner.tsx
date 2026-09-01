import React, { useState } from 'react';
import { ExternalLink, X, Sparkles, ShieldCheck, Tag } from 'lucide-react';

export interface AdCampaign {
  id: string;
  title: string;
  description: string;
  sponsor: string;
  actionText: string;
  linkUrl: string;
  gradient: string;
  category: string;
}

export const SPONSORED_ADS: AdCampaign[] = [
  {
    id: 'ad-audiophile-dac',
    title: '32-Bit/768kHz DSD512 Master DAC',
    description: 'Zero audio distortion with dual ESS Sabre chips. Plug & Play with mobile & desktop.',
    sponsor: 'Aura Hi-Res Audio Partner',
    actionText: 'Get 35% Off Today',
    linkUrl: 'https://www.google.com/search?q=audiophile+usb+c+dac+amp',
    gradient: 'from-amber-600/20 via-orange-600/15 to-zinc-900',
    category: 'Hardware'
  },
  {
    id: 'ad-cloud-vault',
    title: 'Lossless FLAC Cloud Storage',
    description: 'Back up your entire 24-Bit FLAC & WAV collection with unlimited multi-device sync.',
    sponsor: 'Aura Cloud Sync Network',
    actionText: 'Claim 100GB Free',
    linkUrl: 'https://www.google.com/search?q=flac+lossless+music+cloud+storage',
    gradient: 'from-emerald-600/20 via-teal-600/15 to-zinc-900',
    category: 'Cloud Services'
  },
  {
    id: 'ad-planar-headphones',
    title: 'Open-Back Planar Magnetic Headphones',
    description: 'Experience pure spatial soundstage and ultra-responsive low-frequency acoustic fidelity.',
    sponsor: 'Acoustic Labs Pro',
    actionText: 'Explore Collection',
    linkUrl: 'https://www.google.com/search?q=planar+magnetic+audiophile+headphones',
    gradient: 'from-indigo-600/20 via-purple-600/15 to-zinc-900',
    category: 'Acoustics'
  }
];

interface RealAdBannerProps {
  slotIndex?: number;
  className?: string;
}

export const RealAdBanner: React.FC<RealAdBannerProps> = ({ slotIndex = 0, className = '' }) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const ad = SPONSORED_ADS[slotIndex % SPONSORED_ADS.length];

  if (isDismissed) return null;

  return (
    <div 
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r ${ad.gradient} p-4 text-white shadow-xl transition hover:border-white/20 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded bg-amber-400/90 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-black">
            AD
          </span>
          <span className="text-[11px] font-medium text-zinc-300">
            {ad.sponsor}
          </span>
        </div>

        <button
          onClick={() => setIsDismissed(true)}
          className="rounded-lg p-1 text-zinc-400 transition hover:bg-white/10 hover:text-white cursor-pointer"
          title="Dismiss ad"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5 max-w-md">
          <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
            {ad.title}
          </h4>
          <p className="text-[11px] text-zinc-300 line-clamp-2">
            {ad.description}
          </p>
        </div>

        <a
          href={ad.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-black shadow-md transition hover:bg-zinc-200 active:scale-95 whitespace-nowrap self-start sm:self-auto cursor-pointer"
        >
          <span>{ad.actionText}</span>
          <ExternalLink className="h-3.5 w-3.5 text-black" />
        </a>
      </div>
    </div>
  );
};
