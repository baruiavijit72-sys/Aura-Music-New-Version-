import React, { useState } from 'react';
import { 
  BarChart3, 
  Clock, 
  TrendingUp, 
  Flame, 
  Radio, 
  Disc, 
  User, 
  Heart, 
  History, 
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Track, ListeningLogEntry } from '../types';

interface AnalyticsViewProps {
  tracks: Track[];
  listeningLogs: ListeningLogEntry[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  tracks,
  listeningLogs,
}) => {
  const [timeWindow, setTimeWindow] = useState<'7d' | '30d' | 'all'>('7d');

  // Compute stats
  const totalPlays = tracks.reduce((acc, t) => acc + t.playCount, 0);
  const totalSkips = tracks.reduce((acc, t) => acc + t.skipCount, 0);
  const totalListeningSecs = tracks.reduce((acc, t) => acc + (t.playCount * t.duration), 0);
  const totalListeningHours = (totalListeningSecs / 3600).toFixed(1);
  const completionRate = totalPlays + totalSkips > 0 
    ? Math.round((totalPlays / (totalPlays + totalSkips)) * 100) 
    : 95;

  // Top Artists
  const artistMap: Record<string, number> = {};
  tracks.forEach(t => {
    artistMap[t.artist] = (artistMap[t.artist] || 0) + t.playCount;
  });
  const sortedArtists = Object.entries(artistMap).sort((a, b) => b[1] - a[1]);

  // Top Genres
  const genreMap: Record<string, number> = {};
  tracks.forEach(t => {
    genreMap[t.genre] = (genreMap[t.genre] || 0) + t.playCount;
  });
  const sortedGenres = Object.entries(genreMap).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6 pb-28">
      {/* Top Header & Range Switcher */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Audio Analytics & Listening Logs</h2>
          <p className="text-xs text-zinc-400">Offline playback metrics & listening patterns</p>
        </div>

        <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-white/10 text-xs">
          {(['7d', '30d', 'all'] as const).map((win) => (
            <button
              key={win}
              onClick={() => setTimeWindow(win)}
              className={`px-3 py-1 rounded-lg font-bold uppercase transition ${
                timeWindow === win ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {win}
            </button>
          ))}
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-3xl bg-zinc-900 border border-white/10 space-y-1">
          <div className="flex items-center gap-2 text-indigo-400">
            <Clock className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase">Time Listened</span>
          </div>
          <p className="text-2xl font-black text-white">{totalListeningHours} <span className="text-xs font-normal text-zinc-400">hrs</span></p>
          <p className="text-[10px] text-zinc-500">Lossless & Studio playback</p>
        </div>

        <div className="p-4 rounded-3xl bg-zinc-900 border border-white/10 space-y-1">
          <div className="flex items-center gap-2 text-purple-400">
            <Flame className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase">Total Plays</span>
          </div>
          <p className="text-2xl font-black text-white">{totalPlays}</p>
          <p className="text-[10px] text-zinc-500">Track stream sessions</p>
        </div>

        <div className="p-4 rounded-3xl bg-zinc-900 border border-white/10 space-y-1">
          <div className="flex items-center gap-2 text-emerald-400">
            <TrendingUp className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase">Completion Rate</span>
          </div>
          <p className="text-2xl font-black text-white">{completionRate}%</p>
          <p className="text-[10px] text-zinc-500">{totalSkips} skips recorded</p>
        </div>

        <div className="p-4 rounded-3xl bg-zinc-900 border border-white/10 space-y-1">
          <div className="flex items-center gap-2 text-pink-400">
            <Disc className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase">Audio Formats</span>
          </div>
          <p className="text-2xl font-black text-white">96kHz <span className="text-xs font-normal text-zinc-400">/ 24-bit</span></p>
          <p className="text-[10px] text-zinc-500">Peak resolution index</p>
        </div>
      </div>

      {/* Top Artists & Genres breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Top Artists */}
        <div className="p-5 rounded-3xl bg-zinc-900 border border-white/10 space-y-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Top Artists</h3>
          </div>

          <div className="space-y-2">
            {sortedArtists.map(([artist, count], i) => (
              <div key={artist} className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/60 border border-white/5">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-indigo-400 w-4">{i + 1}</span>
                  <span className="text-xs font-bold text-white">{artist}</span>
                </div>
                <span className="text-xs font-mono text-zinc-400">{count} plays</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Genres */}
        <div className="p-5 rounded-3xl bg-zinc-900 border border-white/10 space-y-3">
          <div className="flex items-center gap-2">
            <Disc className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Preferred Genres</h3>
          </div>

          <div className="space-y-2">
            {sortedGenres.map(([genre, count], i) => (
              <div key={genre} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-300">{genre}</span>
                  <span className="font-mono text-zinc-400">{count} plays</span>
                </div>
                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-500 h-full rounded-full"
                    style={{ width: `${Math.min(100, (count / (totalPlays || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Listening History Logs */}
      <div className="p-5 rounded-3xl bg-zinc-900 border border-white/10 space-y-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Playback Activity Log</h3>
        </div>

        <div className="space-y-2">
          {listeningLogs.map((log) => (
            <div key={log.id} className="p-3 rounded-2xl bg-zinc-950/60 border border-white/5 flex items-center justify-between gap-3 text-xs">
              <div className="min-w-0">
                <p className="font-bold text-white truncate">{log.trackTitle}</p>
                <p className="text-[11px] text-zinc-400">{log.artist} • {log.genre}</p>
              </div>
              <div className="flex items-center gap-2 text-right">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  log.isSkipped ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {log.isSkipped ? 'SKIPPED' : 'COMPLETED'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
