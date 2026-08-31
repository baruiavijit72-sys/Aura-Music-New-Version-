import React, { useEffect, useRef } from 'react';
import { Edit3, Music } from 'lucide-react';

interface LyricsViewProps {
  lyricsLrc: string;
  currentTime: number;
  onSeek: (seconds: number) => void;
  onEditLyrics: () => void;
}

interface ParsedLyricLine {
  time: number; // in seconds
  text: string;
}

export const LyricsView: React.FC<LyricsViewProps> = ({
  lyricsLrc,
  currentTime,
  onSeek,
  onEditLyrics
}) => {
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Parse LRC into array of timestamps and lines
  const parseLRC = (lrc: string): ParsedLyricLine[] => {
    if (!lrc) return [];
    const lines = lrc.split('\n');
    const result: ParsedLyricLine[] = [];

    const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      let match;
      let hasTime = false;
      while ((match = timeRegex.exec(line)) !== null) {
        hasTime = true;
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const millis = match[3] ? parseInt(match[3].padEnd(3, '0').slice(0, 3), 10) : 0;
        const totalSeconds = minutes * 60 + seconds + millis / 1000;
        const text = line.replace(/\[\d{2}:\d{2}(?:\.\d{2,3})?\]/g, '').trim();
        result.push({ time: totalSeconds, text });
      }

      if (!hasTime && line) {
        result.push({ time: 0, text: line });
      }
    }

    return result.sort((a, b) => a.time - b.time);
  };

  const parsedLyrics = parseLRC(lyricsLrc);

  // Find active line index
  let activeIndex = -1;
  for (let i = 0; i < parsedLyrics.length; i++) {
    if (currentTime >= parsedLyrics[i].time) {
      activeIndex = i;
    } else {
      break;
    }
  }

  // Smooth auto-scroll to active line
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeIndex]);

  return (
    <div className="flex flex-col h-full max-h-[380px] bg-zinc-950/80 rounded-2xl border border-white/10 p-4 overflow-hidden relative">
      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-2">
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Live Synced LRC Lyrics</span>
        </div>
        <button
          onClick={onEditLyrics}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white px-2 py-1 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 transition"
        >
          <Edit3 className="w-3 h-3" />
          <span>Edit LRC</span>
        </button>
      </div>

      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto space-y-4 py-8 text-center scroll-smooth pr-1"
      >
        {parsedLyrics.length === 0 ? (
          <div className="py-12 text-zinc-500 text-sm">
            <p>No synced lyrics found for this track.</p>
            <button
              onClick={onEditLyrics}
              className="mt-3 px-3 py-1.5 rounded-xl bg-indigo-600/30 text-indigo-300 text-xs font-semibold hover:bg-indigo-600/50"
            >
              Add LRC Lyrics
            </button>
          </div>
        ) : (
          parsedLyrics.map((item, index) => {
            const isActive = index === activeIndex;
            return (
              <div
                key={index}
                ref={isActive ? activeLineRef : null}
                onClick={() => onSeek(item.time)}
                className={`cursor-pointer transition-all duration-300 py-1.5 px-3 rounded-xl ${
                  isActive
                    ? 'text-lg sm:text-xl font-extrabold text-white scale-105 bg-indigo-500/20 shadow-md shadow-indigo-500/20'
                    : 'text-sm sm:text-base font-medium text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                }`}
              >
                {item.text || '♪ ♪ ♪'}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
