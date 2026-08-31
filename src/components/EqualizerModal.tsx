import React from 'react';
import { X, SlidersHorizontal, Volume2, Sparkles, RotateCcw, Power } from 'lucide-react';
import { EqualizerSettings } from '../types';
import { EQ_FREQUENCIES } from '../utils/audioEngine';
import { EQ_PRESETS } from '../data/mockAudio';

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  eqSettings: EqualizerSettings;
  onUpdateEQ: (settings: EqualizerSettings) => void;
}

export const EqualizerModal: React.FC<EqualizerModalProps> = ({
  isOpen,
  onClose,
  eqSettings,
  onUpdateEQ,
}) => {
  if (!isOpen) return null;

  const handleBandChange = (index: number, value: number) => {
    const newBands = [...eqSettings.bands];
    newBands[index] = value;
    onUpdateEQ({
      ...eqSettings,
      bands: newBands,
      preset: 'Custom',
    });
  };

  const handlePresetSelect = (presetName: string) => {
    if (EQ_PRESETS[presetName]) {
      onUpdateEQ({
        ...eqSettings,
        preset: presetName,
        bands: [...EQ_PRESETS[presetName]],
      });
    }
  };

  const handleReset = () => {
    onUpdateEQ({
      ...eqSettings,
      preset: 'Flat',
      bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      bassBoost: 0,
      virtualizer3D: 0,
      trebleBoost: 0,
      volumeBoost: 0,
      balance: 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-2xl bg-black/85 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col bg-zinc-950/95 border border-white/15 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">10-Band Studio Equalizer & DSP</h2>
              <p className="text-xs text-zinc-400">Hardware & Software Audio Processing Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Master Toggle */}
            <button
              onClick={() => onUpdateEQ({ ...eqSettings, isEnabled: !eqSettings.isEnabled })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition ${
                eqSettings.isEnabled
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/25'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{eqSettings.isEnabled ? 'DSP ON' : 'BYPASS'}</span>
            </button>

            <button
              onClick={handleReset}
              title="Reset to Flat"
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Preset Selector Chips */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Audio Presets</span>
              <span className="text-xs font-semibold text-zinc-400">Active: {eqSettings.preset}</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {Object.keys(EQ_PRESETS).map((preset) => (
                <button
                  key={preset}
                  onClick={() => handlePresetSelect(preset)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    eqSettings.preset === preset
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* 10-Band Graphic Equalizer */}
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-4">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>+12 dB</span>
              <span className="text-zinc-500 font-mono">0 dB (Flat Reference)</span>
              <span>-12 dB</span>
            </div>

            {/* Vertical Band Sliders */}
            <div className="grid grid-cols-10 gap-1.5 sm:gap-2 h-44 items-end pb-2">
              {EQ_FREQUENCIES.map((freq, index) => {
                const gain = eqSettings.bands[index] || 0;
                return (
                  <div key={freq} className="flex flex-col items-center h-full justify-between">
                    <span className="text-[10px] font-mono text-indigo-300 font-bold">
                      {gain > 0 ? `+${gain}` : gain}
                    </span>
                    <div className="h-32 flex items-center justify-center relative py-1">
                      <input
                        type="range"
                        min="-12"
                        max="12"
                        step="1"
                        value={gain}
                        disabled={!eqSettings.isEnabled}
                        onChange={(e) => handleBandChange(index, parseInt(e.target.value, 10))}
                        className="h-28 w-2 appearance-none bg-zinc-800 rounded-lg cursor-pointer accent-indigo-500 [writing-mode:vertical-lr] [direction:rtl]"
                      />
                    </div>
                    <span className="text-[9px] font-bold text-zinc-400 whitespace-nowrap">
                      {freq < 1000 ? `${freq}` : `${freq / 1000}k`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* DSP Enhancement Dials & Controls */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Bass Boost */}
            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-300">Bass Boost</span>
                <span className="font-mono text-indigo-400 font-bold">{eqSettings.bassBoost}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={eqSettings.bassBoost}
                disabled={!eqSettings.isEnabled}
                onChange={(e) => onUpdateEQ({ ...eqSettings, bassBoost: parseInt(e.target.value, 10) })}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <p className="text-[10px] text-zinc-500">Sub-100Hz punch</p>
            </div>

            {/* 3D Virtualizer */}
            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-300">3D Virtualizer</span>
                <span className="font-mono text-purple-400 font-bold">{eqSettings.virtualizer3D}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={eqSettings.virtualizer3D}
                disabled={!eqSettings.isEnabled}
                onChange={(e) => onUpdateEQ({ ...eqSettings, virtualizer3D: parseInt(e.target.value, 10) })}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <p className="text-[10px] text-zinc-500">Spatial soundstage</p>
            </div>

            {/* Treble Boost */}
            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-300">Treble Boost</span>
                <span className="font-mono text-pink-400 font-bold">{eqSettings.trebleBoost}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={eqSettings.trebleBoost}
                disabled={!eqSettings.isEnabled}
                onChange={(e) => onUpdateEQ({ ...eqSettings, trebleBoost: parseInt(e.target.value, 10) })}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
              />
              <p className="text-[10px] text-zinc-500">10kHz+ crystal clarity</p>
            </div>

            {/* Volume Booster */}
            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-300">Loudness Gain</span>
                <span className="font-mono text-emerald-400 font-bold">+{eqSettings.volumeBoost}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={eqSettings.volumeBoost}
                disabled={!eqSettings.isEnabled}
                onChange={(e) => onUpdateEQ({ ...eqSettings, volumeBoost: parseInt(e.target.value, 10) })}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <p className="text-[10px] text-zinc-500">Hardware preamp boost</p>
            </div>
          </div>

          {/* Stereo Balance & ReplayGain */}
          <div className="p-4 rounded-2xl bg-zinc-900/70 border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-zinc-300">Left / Right Stereo Balance</span>
              <span className="font-mono text-zinc-400 font-bold">
                {eqSettings.balance === 0 ? 'Center (0)' : eqSettings.balance < 0 ? `Left ${Math.abs(eqSettings.balance)}%` : `Right ${eqSettings.balance}%`}
              </span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={eqSettings.balance}
              onChange={(e) => onUpdateEQ({ ...eqSettings, balance: parseInt(e.target.value, 10) })}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-semibold">
              <span>100% Left</span>
              <span>Balanced</span>
              <span>100% Right</span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={eqSettings.replayGain}
                  onChange={(e) => onUpdateEQ({ ...eqSettings, replayGain: e.target.checked })}
                  className="accent-indigo-500 rounded"
                />
                <span className="text-xs font-semibold text-zinc-300">ReplayGain Volume Normalization</span>
              </label>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">
                -14 LUFS Target
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
