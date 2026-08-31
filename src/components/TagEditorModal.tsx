import React, { useState } from 'react';
import { X, Tags, Save, Image, Sparkles, CheckCircle2 } from 'lucide-react';
import { Track } from '../types';

interface TagEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  onSaveTrack: (updatedTrack: Track) => void;
}

const PRESET_PALETTES: [string, string][] = [
  ['#6366f1', '#a855f7'],
  ['#ec4899', '#f43f5e'],
  ['#10b981', '#06b6d4'],
  ['#f59e0b', '#ef4444'],
  ['#3b82f6', '#1d4ed8'],
  ['#8b5cf6', '#d946ef'],
  ['#14b8a6', '#0d9488'],
  ['#64748b', '#334155'],
];

export const TagEditorModal: React.FC<TagEditorModalProps> = ({
  isOpen,
  onClose,
  track,
  onSaveTrack,
}) => {
  const [title, setTitle] = useState(track?.title || '');
  const [artist, setArtist] = useState(track?.artist || '');
  const [album, setAlbum] = useState(track?.album || '');
  const [genre, setGenre] = useState(track?.genre || '');
  const [year, setYear] = useState(track?.year ? track.year.toString() : '2026');
  const [trackNumber, setTrackNumber] = useState(track?.trackNumber ? track.trackNumber.toString() : '1');
  const [lyricsLrc, setLyricsLrc] = useState(track?.lyricsLrc || '');
  const [selectedGradient, setSelectedGradient] = useState<[string, string]>(track?.coverGradient || PRESET_PALETTES[0]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen || !track) return null;

  const handleSave = () => {
    const updated: Track = {
      ...track,
      title: title.trim() || track.title,
      artist: artist.trim() || track.artist,
      album: album.trim() || track.album,
      genre: genre.trim() || track.genre,
      year: parseInt(year, 10) || track.year,
      trackNumber: parseInt(trackNumber, 10) || track.trackNumber,
      lyricsLrc: lyricsLrc,
      coverGradient: selectedGradient,
    };

    onSaveTrack(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-2xl bg-black/85 animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[92vh] flex flex-col bg-zinc-950/95 border border-white/15 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Tags className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Advanced ID3 Tag Editor</h2>
              <p className="text-xs text-zinc-400">Metadata & Embedded Album Art Engine</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Cover Art Artwork Chooser */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900 border border-white/10">
            <div
              className="w-16 h-16 rounded-2xl shadow-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${selectedGradient[0]}, ${selectedGradient[1]})`
              }}
            >
              <Image className="w-6 h-6 text-white/70" />
            </div>

            <div className="flex-1">
              <span className="text-xs font-bold text-zinc-300">Album Art Color Theme</span>
              <p className="text-[11px] text-zinc-400 mb-2">Pick dynamic gradient palette for this song</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {PRESET_PALETTES.map((pal, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedGradient(pal)}
                    className={`w-6 h-6 rounded-full border-2 transition ${
                      selectedGradient[0] === pal[0] ? 'border-white scale-110 shadow' : 'border-transparent opacity-70'
                    }`}
                    style={{ background: `linear-gradient(135deg, ${pal[0]}, ${pal[1]})` }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-zinc-300">Track Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300">Artist</label>
              <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300">Album</label>
              <input
                type="text"
                value={album}
                onChange={(e) => setAlbum(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300">Genre</label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">Year</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">Track #</label>
                <input
                  type="number"
                  value={trackNumber}
                  onChange={(e) => setTrackNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-zinc-300">LRC Synced Lyrics Source</label>
              <textarea
                rows={4}
                value={lyricsLrc}
                onChange={(e) => setLyricsLrc(e.target.value)}
                placeholder="[00:12.00]Lyrics line goes here..."
                className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 flex items-center justify-end gap-3 bg-zinc-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Write ID3 Tags to Storage</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
