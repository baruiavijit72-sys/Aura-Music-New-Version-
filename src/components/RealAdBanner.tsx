import React, { useState, useEffect } from 'react';
import { ExternalLink, X, ShieldCheck } from 'lucide-react';

export interface DynamicRealAd {
  id: string;
  platform: 'facebook' | 'youtube' | 'instagram' | 'google' | 'spotify' | 'amazon' | 'hotstar' | 'meta' | 'netflix';
  platformLabel: string;
  platformColor: string;
  brandName: string;
  brandAvatar: string;
  verified?: boolean;
  headline: string;
  description: string;
  mediaType: 'image' | 'gradient';
  mediaUrl?: string;
  rating?: number;
  badgeText: string;
  ctaText: string;
  linkUrl: string;
  tags?: string[];
}

export const REAL_ONLINE_ADS: DynamicRealAd[] = [
  // 1. YouTube Premium / Music App style Ad
  {
    id: 'ad-yt-music',
    platform: 'youtube',
    platformLabel: 'YouTube',
    platformColor: '#FF0000',
    brandName: 'YouTube Music & Premium',
    brandAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
    verified: true,
    headline: 'Watch & Listen Ad-Free with Background Play',
    description: 'Listen to 100M+ songs and videos with the screen off or while using other apps. Unlimited offline downloads with zero interruptions.',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    rating: 4.8,
    badgeText: 'Sponsored • Google',
    ctaText: 'Try 1 Month Free',
    linkUrl: 'https://www.youtube.com/premium',
    tags: ['Music & Audio', 'No Interruptions']
  },

  // 2. Instagram Story / Reels Official Ad
  {
    id: 'ad-ig-official',
    platform: 'instagram',
    platformLabel: 'Instagram',
    platformColor: '#E1306C',
    brandName: 'Instagram Reels & Stories',
    brandAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    verified: true,
    headline: 'Discover Viral Reels & Trending Audio',
    description: 'Explore what creators worldwide are listening to right now. Create instant 60s clips with trending master tracks and effects.',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1516251193007-45ef944ab0c6?w=600&auto=format&fit=crop&q=80',
    rating: 4.7,
    badgeText: 'Sponsored • Meta',
    ctaText: 'Open Instagram',
    linkUrl: 'https://www.instagram.com',
    tags: ['Trending Audio', 'Reels']
  },

  // 3. Facebook Official Feed Sponsored Ad
  {
    id: 'ad-fb-official',
    platform: 'facebook',
    platformLabel: 'Facebook',
    platformColor: '#1877F2',
    brandName: 'Facebook Video & Groups',
    brandAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    verified: true,
    headline: 'Connect with Music Communities & Artists',
    description: 'Join over 2.9 billion active listeners worldwide. Share playlists, tune into live artist streams, and discover regional indie tracks.',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80',
    rating: 4.5,
    badgeText: 'Sponsored • Facebook App',
    ctaText: 'Join Groups',
    linkUrl: 'https://www.facebook.com',
    tags: ['Community', 'Live Streams']
  },

  // 4. Instagram Gear Ad (Sony ANC Headphones)
  {
    id: 'ad-ig-sony',
    platform: 'instagram',
    platformLabel: 'Instagram Shop',
    platformColor: '#C13584',
    brandName: 'Sony Audio Official',
    brandAvatar: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&auto=format&fit=crop&q=80',
    verified: true,
    headline: 'Sony WH-1000XM5 Noise Cancelling Headphones',
    description: 'Industry-leading noise cancellation with twin HD processors. 30-hour battery and ultra-clear hands-free calls.',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80',
    rating: 4.9,
    badgeText: 'Sponsored Post',
    ctaText: 'Shop Now • 40% Off',
    linkUrl: 'https://www.amazon.com/s?k=sony+wh-1000xm5',
    tags: ['Electronics', 'Hi-Res Audio']
  },

  // 5. Facebook / Spotify Family Plan Ad
  {
    id: 'ad-fb-spotify',
    platform: 'facebook',
    platformLabel: 'Facebook Ads',
    platformColor: '#1877F2',
    brandName: 'Spotify Premium Family',
    brandAvatar: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&auto=format&fit=crop&q=80',
    verified: true,
    headline: 'Music For Everyone In Your Family',
    description: '6 individual accounts with high-res playback, personalized discovery mixes, offline download, and zero ad breaks.',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
    rating: 4.8,
    badgeText: 'Sponsored • Install',
    ctaText: 'Get Premium',
    linkUrl: 'https://www.spotify.com',
    tags: ['Top Ranked', 'Music App']
  },

  // 6. Netflix Series Ad
  {
    id: 'ad-netflix',
    platform: 'netflix',
    platformLabel: 'Netflix',
    platformColor: '#E50914',
    brandName: 'Netflix Original Series',
    brandAvatar: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=100&auto=format&fit=crop&q=80',
    verified: true,
    headline: 'Watch Top Series & Movies in Spatial Audio',
    description: 'Unlimited movies, TV shows, anime & docuseries. Download your favorites and stream in 4K HDR and Dolby Atmos audio.',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80',
    rating: 4.6,
    badgeText: 'Sponsored • Entertainment',
    ctaText: 'Watch Now',
    linkUrl: 'https://www.netflix.com',
    tags: ['Dolby Atmos', '4K HDR']
  },

  // 7. Amazon Music & Prime Ad
  {
    id: 'ad-amazon-prime',
    platform: 'amazon',
    platformLabel: 'Amazon',
    platformColor: '#FF9900',
    brandName: 'Amazon Music Unlimited',
    brandAvatar: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=100&auto=format&fit=crop&q=80',
    verified: true,
    headline: '100M+ Songs in HD & Ultra HD Quality',
    description: 'Hear music the way the artist intended. Lossless FLAC streaming with spatial audio support on Echo & mobile.',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80',
    rating: 4.7,
    badgeText: 'Sponsored • Prime',
    ctaText: 'Try 30 Days Free',
    linkUrl: 'https://www.amazon.com/music/unlimited',
    tags: ['Ultra HD', 'Spatial Audio']
  },

  // 8. YouTube App / Duolingo
  {
    id: 'ad-yt-duolingo',
    platform: 'youtube',
    platformLabel: 'Google Ads',
    platformColor: '#58CC02',
    brandName: 'Duolingo: Learn Languages',
    brandAvatar: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=100&auto=format&fit=crop&q=80',
    verified: true,
    headline: 'Learn 40+ Languages in 5 Mins a Day',
    description: 'Practice speaking, listening and grammar with bite-sized fun lessons. Ranked #1 worldwide education app.',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=80',
    rating: 4.9,
    badgeText: 'Install App • Free',
    ctaText: 'Download Free',
    linkUrl: 'https://www.duolingo.com',
    tags: ['#1 Education', 'Free App']
  }
];

interface RealAdBannerProps {
  slotIndex?: number;
  format?: 'banner' | 'card' | 'compact' | 'feed';
  className?: string;
}

export const RealAdBanner: React.FC<RealAdBannerProps> = ({ 
  slotIndex = 0, 
  format = 'feed',
  className = '' 
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [adIndex, setAdIndex] = useState(() => slotIndex % REAL_ONLINE_ADS.length);

  // Automatically rotate ad smoothly periodically (every 40s) like real music streaming applications
  useEffect(() => {
    const timer = setInterval(() => {
      setAdIndex((prev) => (prev + 1) % REAL_ONLINE_ADS.length);
    }, 40000);
    return () => clearInterval(timer);
  }, []);

  if (isDismissed) return null;

  const ad = REAL_ONLINE_ADS[adIndex];

  // 1. COMPACT / MINI FORMAT (for inside lists or player)
  if (format === 'compact') {
    return (
      <div className={`relative overflow-hidden rounded-2xl bg-[#12151d] border border-white/10 p-3 shadow-lg group hover:border-white/20 transition-all ${className}`}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span 
              className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase text-white shrink-0 tracking-wider shadow-sm"
              style={{ backgroundColor: ad.platformColor }}
            >
              {ad.platformLabel}
            </span>
            <span className="text-[11px] font-semibold text-zinc-300 truncate">
              {ad.brandName}
            </span>
            <span className="text-[10px] text-zinc-500 shrink-0 font-medium">Sponsored</span>
          </div>

          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
            title="Close Ad"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {ad.mediaUrl && (
            <img 
              src={ad.mediaUrl} 
              alt="" 
              className="w-14 h-14 rounded-xl object-cover shrink-0 border border-white/10" 
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">{ad.headline}</p>
            <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">{ad.description}</p>
            <a
              href={ad.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 mt-1 cursor-pointer"
            >
              <span>{ad.ctaText}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 2. NATIVE SPONSORED CARD (Spotify / YouTube Music style native online ad in feed)
  return (
    <div 
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#161a24] to-[#0e1118] border border-white/10 shadow-xl transition-all duration-300 hover:border-white/20 ${className}`}
    >
      {/* Header bar: Platform tag (Facebook / YouTube / Instagram), Brand info, Verified badge & Close */}
      <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3 border-b border-white/5 bg-black/25">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Brand Avatar */}
          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/20 shrink-0 shadow-sm">
            <img src={ad.brandAvatar} alt={ad.brandName} className="w-full h-full object-cover" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white truncate tracking-tight">{ad.brandName}</span>
              {ad.verified && (
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
              <span 
                className="font-bold px-1.5 py-0.5 rounded text-[9px] text-white shadow-xs"
                style={{ backgroundColor: ad.platformColor }}
              >
                {ad.platformLabel}
              </span>
              <span>•</span>
              <span className="text-zinc-400 font-medium">Sponsored</span>
            </div>
          </div>
        </div>

        {/* Right side dismiss button */}
        <button
          onClick={() => setIsDismissed(true)}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition cursor-pointer"
          title="Close Ad"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Ad Creative: Headline, Description & High-Res Sponsored Image Banner */}
      <div className="p-3.5 sm:p-4 space-y-3">
        <div>
          <h4 className="text-sm sm:text-base font-extrabold text-white tracking-tight leading-snug">
            {ad.headline}
          </h4>
          <p className="text-xs text-zinc-300 line-clamp-2 mt-1 leading-relaxed">
            {ad.description}
          </p>
        </div>

        {/* Visual Media Banner (Natural in-app sponsored visual) */}
        {ad.mediaUrl && (
          <a
            href={ad.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block relative w-full h-36 sm:h-44 rounded-xl overflow-hidden bg-zinc-900 border border-white/10 shadow-inner group cursor-pointer"
          >
            <img 
              src={ad.mediaUrl} 
              alt={ad.headline}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            />
            {/* Gradient bottom overlay with brand tags */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-3 pointer-events-none">
              <div className="flex items-center gap-2">
                {ad.tags?.map((t) => (
                  <span key={t} className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-semibold text-zinc-200">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </a>
        )}

        {/* Bottom CTA Button & Install/Open action */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="min-w-0 text-[11px] text-zinc-500 truncate flex items-center gap-1.5">
            <span className="text-emerald-400 font-semibold">Verified Ad</span>
            <span className="text-zinc-600">•</span>
            <span>Free Preview</span>
          </div>

          <a
            href={ad.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-all duration-200 active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
            style={{ 
              backgroundColor: ad.platformColor,
              boxShadow: `0 4px 15px ${ad.platformColor}40`
            }}
          >
            <span>{ad.ctaText}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
