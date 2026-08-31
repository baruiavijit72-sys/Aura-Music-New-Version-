import React from 'react';
import { X, ListMusic, Trash2, ArrowUp, ArrowDown, Play, Save, Plus } from 'lucide-react';
import { Track } from '../types';

interface QueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  queue: Track[];
  currentTrackId: string | null;
  onSelectTrack: (track: Track) => void;
  onRemoveFromQueue: (index: number) => void;
  onReorderQueue: (fromIndex: number, toIndex: number) => void;
  onClearQueue: () => void;
  onSaveAsPlaylist: () => void;
}

export const QueueModal: React.FC<QueueModalProps> = ({
  isOpen,
  onClose,
  queue,
  currentTrackId,
  onSelectTrack,
  onRemoveFromQueue,
  onReorderQueue,
  onClearQueue,
  onSaveAsPlaylist,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-2xl bg-black/85 animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[92vh] flex flex-col bg-zinc-950/95 border border-white/15 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <ListMusic className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Dynamic Play Queue ({queue.length})</h2>
              <p className="text-xs text-zinc-400">On-the-fly reordering & active playback stack</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between p-3 bg-zinc-900 border-b border-white/10 text-xs">
          <button
            onClick={onSaveAsPlaylist}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 font-semibold transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save as Playlist</span>
          </button>

          <button
            onClick={onClearQueue}
            disabled={queue.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-red-400 hover:bg-red-500/10 font-semibold transition disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Queue</span>
          </button>
        </div>

        {/* Queue List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {queue.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 text-sm">
              Your playback queue is currently empty.
            </div>
          ) : (
            queue.map((track, index) => {
              const isCurrent = track.id === currentTrackId;
              return (
                <div
                  key={`${track.id}-${index}`}
                  className={`flex items-center justify-between p-2.5 sm:p-3 rounded-2xl transition ${
                    isCurrent
                      ? 'bg-indigo-600/20 border border-indigo-500/40 text-white shadow-md'
                      : 'bg-zinc-900/80 border border-white/5 text-zinc-300 hover:bg-zinc-900'
                  }`}
                >
                  <div 
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                    onClick={() => onSelectTrack(track)}
                  >
                    <span className="text-xs font-mono text-zinc-500 w-4 text-center">{index + 1}</span>
                    
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${track.coverGradient[0]}, ${track.coverGradient[1]})`
                      }}
                    >
                      {isCurrent ? <Play className="w-4 h-4 fill-current text-white animate-pulse" /> : <ListMusic className="w-4 h-4 opacity-80" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold truncate ${isCurrent ? 'text-indigo-300' : 'text-white'}`}>
                        {track.title}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">{track.artist} • {track.format}</p>
                    </div>
                  </div>

                  {/* Reordering Controls */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => onReorderQueue(index, Math.max(0, index - 1))}
                      disabled={index === 0}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white disabled:opacity-20 transition"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onReorderQueue(index, Math.min(queue.length - 1, index + 1))}
                      disabled={index === queue.length - 1}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white disabled:opacity-20 transition"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onRemoveFromQueue(index)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 transition"
                      title="Remove from Queue"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
