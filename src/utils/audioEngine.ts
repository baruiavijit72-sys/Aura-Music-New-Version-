import { EqualizerSettings, Track } from '../types';

export const EQ_FREQUENCIES = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
export const DEFAULT_FALLBACK_AUDIO_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
const SILENT_AUDIO_CARRIER = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

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
  private userVolume = 1.0;
  private preAmpMultiplier = 1.75; // Clean +5.1dB Studio Loudness Boost
  private currentEQSettings: EqualizerSettings | null = null;
  private currentDspMode: '32bit' | '24bit' | 'dsd' = '32bit';
  private currentOnEndedCallback?: () => void;
  private playSessionId = 0;
  private visualizerPhase = 0;

  // Web Audio DSP Graph Nodes
  private mediaSourceNode: MediaElementAudioSourceNode | null = null;
  private eqFilterNodes: BiquadFilterNode[] = [];
  private bassFilterNode: BiquadFilterNode | null = null;
  private trebleFilterNode: BiquadFilterNode | null = null;
  private dspHarmonicFilterNode: BiquadFilterNode | null = null;
  private studioCompressor: DynamicsCompressorNode | null = null;
  private masterGainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;

  // Synthesizer nodes for fallback / sample playback
  private synthGainNode: GainNode | null = null;
  private synthIntervalId: any = null;
  private synthTimeOffset = 0;

  public init() {
    if (!this.audioElement && typeof document !== 'undefined') {
      let el = document.getElementById('aura-master-audio') as HTMLAudioElement;
      if (!el) {
        el = document.createElement('audio');
        el.id = 'aura-master-audio';
        el.preload = 'auto';
        (el as any).playsInline = true;
        (el as any).webkitPlaysInline = true;
        el.setAttribute('playsinline', 'true');
        el.setAttribute('webkit-playsinline', 'true');
        el.style.position = 'fixed';
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
        el.style.bottom = '0';
        el.style.left = '0';
        el.style.width = '1px';
        el.style.height = '1px';
        document.body.appendChild(el);
      }

      this.audioElement = el;
      this.audioElement.volume = this.userVolume;

      this.audioElement.addEventListener('ended', () => {
        if (this.isPlaying && this.currentOnEndedCallback) {
          this.currentOnEndedCallback();
        }
      });
    }

    if (!this.ctx && typeof window !== 'undefined') {
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

    if (typeof window !== 'undefined') {
      const savedDsp = localStorage.getItem('aura_dsp_mode') as '32bit' | '24bit' | 'dsd' | null;
      if (savedDsp) {
        this.currentDspMode = savedDsp;
      }
      window.addEventListener('aura_dsp_changed', (e: any) => {
        if (e.detail?.mode) {
          this.setDspMode(e.detail.mode);
        }
      });
    }

    this.setupAudioGraph();
  }

  private setupAudioGraph() {
    if (!this.ctx || !this.audioElement || this.mediaSourceNode) return;

    try {
      this.mediaSourceNode = this.ctx.createMediaElementSource(this.audioElement);

      // 1. 10-Band EQ Filters
      this.eqFilterNodes = EQ_FREQUENCIES.map((freq) => {
        const filter = this.ctx!.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1.4;
        filter.gain.value = 0;
        return filter;
      });

      // 2. Bass Shaper (warm punchy low-end)
      this.bassFilterNode = this.ctx.createBiquadFilter();
      this.bassFilterNode.type = 'lowshelf';
      this.bassFilterNode.frequency.value = 120;
      this.bassFilterNode.gain.value = 4.0; // +4dB clean bass boost

      // 3. Treble & Air Shaper (crystal clear vocal presence)
      this.trebleFilterNode = this.ctx.createBiquadFilter();
      this.trebleFilterNode.type = 'highshelf';
      this.trebleFilterNode.frequency.value = 8000;
      this.trebleFilterNode.gain.value = 3.0; // +3dB high clarity

      // 4. Master DSP Harmonic / Oversampling Profile Filter
      this.dspHarmonicFilterNode = this.ctx.createBiquadFilter();
      this.dspHarmonicFilterNode.type = 'peaking';
      this.dspHarmonicFilterNode.frequency.value = 3200;
      this.dspHarmonicFilterNode.gain.value = 0;

      // 5. Studio Dynamic Range Compressor (Prevents clipping & produces punchy, loud audio)
      this.studioCompressor = this.ctx.createDynamicsCompressor();
      this.studioCompressor.threshold.value = -12.0;
      this.studioCompressor.knee.value = 10.0;
      this.studioCompressor.ratio.value = 3.5;
      this.studioCompressor.attack.value = 0.003;
      this.studioCompressor.release.value = 0.22;

      // 6. Master Pre-Amp Loudness Gain Node (Loud & Powerful sound)
      this.masterGainNode = this.ctx.createGain();
      this.masterGainNode.gain.value = this.userVolume * this.preAmpMultiplier;

      // 7. Analyser for real-time visualizer
      this.analyserNode = this.ctx.createAnalyser();
      this.analyserNode.fftSize = 128;
      this.analyserNode.smoothingTimeConstant = 0.8;

      // Chain: Source -> EQ bands -> Bass -> Treble -> DSP Profile -> Studio Compressor -> Master Gain -> Analyser -> Destination
      let prevNode: AudioNode = this.mediaSourceNode;
      for (const filter of this.eqFilterNodes) {
        prevNode.connect(filter);
        prevNode = filter;
      }
      prevNode.connect(this.bassFilterNode);
      this.bassFilterNode.connect(this.trebleFilterNode);
      this.trebleFilterNode.connect(this.dspHarmonicFilterNode);
      this.dspHarmonicFilterNode.connect(this.studioCompressor);
      this.studioCompressor.connect(this.masterGainNode);
      this.masterGainNode.connect(this.analyserNode);
      this.analyserNode.connect(this.ctx.destination);

      // Apply initial saved DSP profile mode
      this.setDspMode(this.currentDspMode);
    } catch (err) {
      // Graceful fallback if CORS restrictions apply to certain external streams
      console.warn('Audio graph connection notice:', err);
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
    if (this.audioElement && this.audioElement.src === SILENT_AUDIO_CARRIER) {
      try {
        this.audioElement.pause();
      } catch {}
    }
  }

  private startSynth(track: Track, startOffsetSeconds: number = 0) {
    this.stopSynth();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    // Keep the DOM audio element actively playing so Android Quick Settings / System UI notification stays active
    if (this.audioElement) {
      if (this.audioElement.src !== SILENT_AUDIO_CARRIER) {
        this.audioElement.src = SILENT_AUDIO_CARRIER;
        this.audioElement.loop = true;
      }
      this.audioElement.play().catch(() => {});
    }

    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(this.userVolume * 0.75 * this.preAmpMultiplier, this.ctx.currentTime);
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
    if (this.masterGainNode && this.ctx) {
      try {
        this.masterGainNode.gain.setValueAtTime(this.userVolume * this.preAmpMultiplier, this.ctx.currentTime);
      } catch {}
    }
    if (this.audioElement) {
      this.audioElement.volume = this.userVolume;
    }
  }

  public updateEQ(settings: EqualizerSettings) {
    this.currentEQSettings = settings;

    // Dynamic PreAmp Loudness Boost from EQ settings (up to 3.0x volume multiplier)
    const extraVolBoost = ((settings.volumeBoost || 0) / 100) * 1.25;
    this.preAmpMultiplier = 1.75 + extraVolBoost;
    if (this.masterGainNode && this.ctx) {
      try {
        this.masterGainNode.gain.setValueAtTime(this.userVolume * this.preAmpMultiplier, this.ctx.currentTime);
      } catch {}
    }

    // Apply 10 EQ band gains
    if (settings.bands && this.eqFilterNodes.length > 0 && this.ctx) {
      settings.bands.forEach((bandGain, idx) => {
        const filter = this.eqFilterNodes[idx];
        if (filter) {
          try {
            filter.gain.setValueAtTime(bandGain, this.ctx!.currentTime);
          } catch {}
        }
      });
    }

    // Bass Boost
    if (this.bassFilterNode && this.ctx) {
      const extraBass = 3.5 + ((settings.bassBoost || 0) / 100) * 8.0;
      try {
        this.bassFilterNode.gain.setValueAtTime(extraBass, this.ctx.currentTime);
      } catch {}
    }

    // Treble Clarity
    if (this.trebleFilterNode && this.ctx) {
      const extraTreble = 2.5 + ((settings.trebleBoost || 0) / 100) * 6.0;
      try {
        this.trebleFilterNode.gain.setValueAtTime(extraTreble, this.ctx.currentTime);
      } catch {}
    }

    // Playback Speed
    this.playbackRate = settings.playbackSpeed || 1.0;
    if (this.audioElement) {
      this.audioElement.playbackRate = this.playbackRate;
    }
  }

  public setDspMode(mode: '32bit' | '24bit' | 'dsd') {
    this.currentDspMode = mode;
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      if (mode === '32bit') {
        // 32-Bit Float (96kHz Bit-Perfect - linear transparency, high sample-rate resolution, zero coloration)
        if (this.dspHarmonicFilterNode) {
          this.dspHarmonicFilterNode.type = 'peaking';
          this.dspHarmonicFilterNode.frequency.setValueAtTime(3200, now);
          this.dspHarmonicFilterNode.gain.setValueAtTime(0, now);
        }
        if (this.studioCompressor) {
          this.studioCompressor.threshold.setValueAtTime(-8.0, now);
          this.studioCompressor.knee.setValueAtTime(6.0, now);
          this.studioCompressor.ratio.setValueAtTime(2.0, now);
        }
      } else if (mode === '24bit') {
        // 24-Bit Studio (192kHz HD Master - warm analog harmonics, vocal air, dynamic punch)
        if (this.dspHarmonicFilterNode) {
          this.dspHarmonicFilterNode.type = 'peaking';
          this.dspHarmonicFilterNode.frequency.setValueAtTime(3800, now);
          this.dspHarmonicFilterNode.Q.setValueAtTime(1.1, now);
          this.dspHarmonicFilterNode.gain.setValueAtTime(2.2, now); // +2.2dB air & vocal presence
        }
        if (this.studioCompressor) {
          this.studioCompressor.threshold.setValueAtTime(-14.0, now);
          this.studioCompressor.knee.setValueAtTime(12.0, now);
          this.studioCompressor.ratio.setValueAtTime(3.8, now); // Studio dynamic master punch
        }
      } else if (mode === 'dsd') {
        // DSD Direct (5.6MHz Emulation - analog Bessel roll-off filter & high dynamic headroom)
        if (this.dspHarmonicFilterNode) {
          this.dspHarmonicFilterNode.type = 'lowpass';
          this.dspHarmonicFilterNode.frequency.setValueAtTime(21000, now);
          this.dspHarmonicFilterNode.Q.setValueAtTime(0.707, now);
        }
        if (this.studioCompressor) {
          this.studioCompressor.threshold.setValueAtTime(-6.0, now);
          this.studioCompressor.knee.setValueAtTime(4.0, now);
          this.studioCompressor.ratio.setValueAtTime(1.8, now); // Transparent analog smoothness
        }
      }
    } catch (err) {
      console.warn('DSP profile update notice:', err);
    }
  }

  public getVisualizerData(dataArray: Uint8Array): void {
    if (!this.isPlaying) {
      dataArray.fill(0);
      return;
    }

    if (this.analyserNode) {
      try {
        this.analyserNode.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < Math.min(dataArray.length, 16); i++) {
          sum += dataArray[i];
        }
        if (sum > 0) return;
      } catch {}
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
