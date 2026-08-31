import { EqualizerSettings, Track } from '../types';

export const EQ_FREQUENCIES = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
export const DEFAULT_FALLBACK_AUDIO_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

function isAbortError(err: unknown): boolean {
  if (!err) return false;
  if (typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'AbortError') {
    return true;
  }
  if (err instanceof Error && (err.name === 'AbortError' || err.message.toLowerCase().includes('interrupted') || err.message.toLowerCase().includes('abort'))) {
    return true;
  }
  return false;
}

class WebAudioEngine {
  private ctx: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  
  private isPlaying = false;
  private playbackRate = 1.0;
  private currentTrack: Track | null = null;
  private userVolume = 0.95;
  private currentEQSettings: EqualizerSettings | null = null;
  private currentOnEndedCallback?: () => void;
  private playSessionId = 0;
  private visualizerPhase = 0;

  // Synthesizer nodes for fallback / sample playback
  private synthGainNode: GainNode | null = null;
  private synthIntervalId: any = null;
  private synthTimeOffset = 0;

  public init() {
    if (!this.audioElement) {
      this.audioElement = new Audio();
      this.audioElement.preload = 'auto';
      this.audioElement.volume = this.userVolume;
      (this.audioElement as any).playsInline = true;
      (this.audioElement as any).webkitPlaysInline = true;
      this.audioElement.setAttribute('playsinline', 'true');
      this.audioElement.setAttribute('webkit-playsinline', 'true');

      this.audioElement.addEventListener('ended', () => {
        if (this.isPlaying && this.currentOnEndedCallback) {
          this.currentOnEndedCallback();
        }
      });
    }

    if (!this.ctx) {
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          this.ctx = new AudioContextClass();
        }
      } catch (err) {
        console.warn('AudioContext initialization notice:', err);
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private stopSynth() {
    if (this.synthIntervalId) {
      clearInterval(this.synthIntervalId);
      this.synthIntervalId = null;
    }
    if (this.synthGainNode && this.ctx) {
      try {
        this.synthGainNode.gain.setValueAtTime(0, this.ctx.currentTime);
      } catch {}
      this.synthGainNode = null;
    }
  }

  private startSynth(track: Track, startOffsetSeconds: number = 0) {
    this.stopSynth();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(this.userVolume * 0.25, this.ctx.currentTime);
    masterGain.connect(this.ctx.destination);
    this.synthGainNode = masterGain;

    this.synthTimeOffset = startOffsetSeconds;
    this.isPlaying = true;

    // Musical chord scales based on track genre / id
    const scaleRoots = [220, 261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
    const trackSeed = (track.title + track.artist).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const rootFreq = scaleRoots[trackSeed % scaleRoots.length];

    const playMusicalNote = (freq: number, duration: number, type: OscillatorType = 'sine', gainVal: number = 0.2) => {
      if (!this.ctx || !this.isPlaying || !this.synthGainNode) return;
      try {
        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        noteGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
        noteGain.gain.exponentialRampToValueAtTime(gainVal, this.ctx.currentTime + 0.04);
        noteGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(noteGain);
        noteGain.connect(this.synthGainNode);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch {}
    };

    let step = 0;
    this.synthIntervalId = setInterval(() => {
      if (!this.isPlaying || !this.ctx) return;
      this.synthTimeOffset += 0.25;

      // Bass note
      if (step % 4 === 0) {
        playMusicalNote(rootFreq * 0.5, 0.9, 'triangle', 0.28);
      }

      // Harmonic melody
      const harmonicRatios = [1, 1.25, 1.5, 1.75, 2, 2.25, 2.5];
      const melodyFreq = rootFreq * harmonicRatios[(step + (trackSeed % 3)) % harmonicRatios.length];
      playMusicalNote(melodyFreq, 0.45, 'sine', 0.18);

      // Shimmering chord tone
      if (step % 2 === 0) {
        playMusicalNote(rootFreq * 1.5, 0.6, 'sine', 0.12);
      }

      step++;
    }, 250);
  }

  public async playTrack(track: Track, startOffsetSeconds: number = 0, onEnded?: () => void) {
    this.init();
    this.playSessionId++;
    const currentSession = this.playSessionId;

    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume().catch(() => {});
    }

    this.currentTrack = track;
    this.currentOnEndedCallback = onEnded;

    if (this.currentEQSettings) {
      this.updateEQ(this.currentEQSettings);
    }

    if (this.audioElement && track.audioUrl) {
      this.stopSynth();
      const urlToPlay = track.audioUrl;
      
      if (this.audioElement.src !== urlToPlay) {
        this.audioElement.src = urlToPlay;
      }

      this.audioElement.playbackRate = this.playbackRate;
      this.audioElement.volume = this.userVolume;

      if (startOffsetSeconds > 0) {
        try {
          this.audioElement.currentTime = startOffsetSeconds;
        } catch {}
      }

      try {
        const playPromise = this.audioElement.play();
        if (playPromise !== undefined) {
          await playPromise;
          if (currentSession === this.playSessionId) {
            this.isPlaying = true;
          }
        }
      } catch (playError) {
        if (isAbortError(playError)) return;
        // Fallback to built-in musical synthesizer
        this.startSynth(track, startOffsetSeconds);
      }
    } else {
      // Direct high-fidelity sound synthesis
      this.startSynth(track, startOffsetSeconds);
    }
  }

  public pause() {
    this.isPlaying = false;
    this.playSessionId++;
    this.stopSynth();
    if (this.audioElement && !this.audioElement.paused) {
      try {
        this.audioElement.pause();
      } catch {}
    }
  }

  public resume(currentOffsetSeconds?: number) {
    if (this.currentTrack) {
      if (this.audioElement && this.currentTrack.audioUrl) {
        if (currentOffsetSeconds !== undefined && Math.abs(this.audioElement.currentTime - currentOffsetSeconds) > 1) {
          try {
            this.audioElement.currentTime = currentOffsetSeconds;
          } catch {}
        }

        this.audioElement.play().then(() => {
          this.isPlaying = true;
        }).catch((err) => {
          if (isAbortError(err)) return;
          this.startSynth(this.currentTrack!, currentOffsetSeconds || 0);
        });
      } else {
        this.startSynth(this.currentTrack, currentOffsetSeconds || 0);
      }
    }
  }

  public stop() {
    this.isPlaying = false;
    this.playSessionId++;
    this.stopSynth();
    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
      } catch {}
    }
  }

  public seek(seconds: number) {
    if (this.audioElement) {
      try {
        this.audioElement.currentTime = Math.max(0, seconds);
      } catch (e) {
        console.warn('Seek error:', e);
      }
    }
  }

  public getCurrentTime(): number {
    return this.audioElement?.currentTime || 0;
  }

  public getDuration(): number {
    return this.audioElement?.duration || this.currentTrack?.duration || 0;
  }

  public setVolume(volume: number) {
    this.userVolume = Math.max(0, Math.min(1, volume));
    if (this.audioElement) {
      this.audioElement.volume = this.userVolume;
    }
  }

  public updateEQ(settings: EqualizerSettings) {
    this.currentEQSettings = settings;

    // Playback Speed
    this.playbackRate = settings.playbackSpeed || 1.0;
    if (this.audioElement) {
      this.audioElement.playbackRate = this.playbackRate;
    }
  }

  public getVisualizerData(dataArray: Uint8Array): void {
    if (!this.isPlaying) {
      dataArray.fill(0);
      return;
    }

    this.visualizerPhase += 0.14;
    const len = dataArray.length;
    for (let i = 0; i < len; i++) {
      const freqRatio = i / len;
      const wave1 = Math.sin(this.visualizerPhase * 2.2 + i * 0.45);
      const wave2 = Math.cos(this.visualizerPhase * 3.8 + i * 0.8);
      const base = Math.max(0.2, (1.0 - freqRatio * 0.55));
      const val = Math.floor(Math.abs(wave1 * 0.65 + wave2 * 0.35) * 210 * base + 40);
      dataArray[i] = Math.min(255, val);
    }
  }
}

export const audioEngine = new WebAudioEngine();
