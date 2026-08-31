import React, { useState } from 'react';
import { X, ListMusic, Plus, Image, Sparkles } from 'lucide-react';
import { Playlist, Track } from '../types';

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePlaylist: (playlist: Playlist) => void;
  availableTracks: Track[];
}

const PLAYLIST_GRADIENTS: [string, string][] = [
  ['#6366f1', '#3b82f6'],
  ['#ec4899', '#f43f5e'],
  ['#10b981', '#06b6d4'],
  ['#f59e0b', '#ef4444'],
  ['#8b5cf6', '#d946ef'],
];

export const PlaylistModal: React.FC<PlaylistModalProps> = ({
  isOpen,
  onClose,
  onCreatePlaylist,
  availableTracks,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);
  const [selectedGradient, setSelectedGradient] = useState<[string, string]>(PLAYLIST_GRADIENTS[0]);

  if (!isOpen) return null;

  const toggleTrack = (id: string) => {
    if (selectedTrackIds.includes(id)) {
      setSelectedTrackIds(selectedTrackIds.filter(t => t !== id));
    } else {
      setSelectedTrackIds([...selectedTrackIds, id]);
    }
  };

  const handleCreate = () => {
    if (!name.trim()) return;

    const newPlaylist: Playlist = {
      id: `pl-user-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || 'Custom user playlist',
      isSmart: false,
      trackIds: selectedTrackIds,
      createdAt: Date.now(),
      coverGradient: selectedGradient,
      isPinned: false,
    };

    onCreatePlaylist(newPlaylist);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-2xl bg-black/85 animate-in fade-in duration-200">
      <div className="w-full max-w-lg max-h-[92vh] flex flex-col bg-zinc-950/95 border border-white/15 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <ListMusic className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Create New Playlist</h2>
              <p className="text-xs text-zinc-400">Add songs & custom artwork theme</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-300">Playlist Name</label>
            <input
              type="text"
              placeholder="e.g. Late Night Vibes, Workout Flow..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-300">Description (Optional)</label>
            <input
              type="text"
              placeholder="Brief summary of this playlist..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Palette Picker */}
          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-1.5">Cover Gradient Theme</label>
            <div className="flex items-center gap-2">
              {PLAYLIST_GRADIENTS.map((pal, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedGradient(pal)}
                  className={`w-8 h-8 rounded-xl border-2 transition ${
                    selectedGradient[0] === pal[0] ? 'border-white scale-110 shadow' : 'border-transparent opacity-60'
                  }`}
                  style={{ background: `linear-gradient(135deg, ${pal[0]}, ${pal[1]})` }}
                />
              ))}
            </div>
          </div>

          {/* Track selection */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <span className="text-xs font-bold uppercase text-zinc-400">
              Add Initial Tracks ({selectedTrackIds.length} chosen)
            </span>
            <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
              {availableTracks.map((t) => {
                const isSelected = selectedTrackIds.includes(t.id);
                return (
                  <div
                    key={t.id}
                    onClick={() => toggleTrack(t.id)}
                    className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition ${
                      isSelected ? 'bg-indigo-600/20 border border-indigo-500/30 text-white' : 'bg-zinc-900/60 text-zinc-400 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="accent-indigo-500 rounded"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{t.title}</p>
                        <p className="text-[11px] text-zinc-400 truncate">{t.artist}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-end gap-3 bg-zinc-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition"
          >
            Create Playlist
          </button>
        </div>
      </div>
    </div>
  );
};
