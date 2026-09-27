/* ==========================================================================
   WEB AUDIO API CINEMATIC SOUNDTRACK & AMBIENT ATMOSPHERE ENGINE
   Synthesizes soft warm chords, wind soundscape, and chime notes without external file dependencies.
   ========================================================================== */

class AudioManager {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.isMuted = false;
    this.masterGain = null;
    this.windGain = null;
    this.chordGain = null;
    this.chimeInterval = null;
  }

  init() {
    if (this.ctx) return;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtx();

    // Master volume control
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Wind Soundscape setup
    this.setupWindSoundscape();

    // Warm Musical Chord setup
    this.setupAmbientHarmonics();
  }

  setupWindSoundscape() {
    // White noise generator filtered for realistic soft breeze
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Low-pass filter for deep wind rumble
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);

    // LFO for periodic wind swaying
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // 12-second swell cycle
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(150, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.windGain);
    this.windGain.connect(this.masterGain);

    whiteNoise.start();
    lfo.start();
  }

  setupAmbientHarmonics() {
    this.chordGain = this.ctx.createGain();
    this.chordGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
    this.chordGain.connect(this.masterGain);

    // Soft warm pentatonic frequencies (D major / F# / A / C# / E) representing warm golden sunrise
    const freqs = [146.83, 220.00, 277.18, 329.63, 440.00, 554.37];

    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      const oscGain = this.ctx.createGain();
      oscGain.gain.setValueAtTime(0.025 / (idx + 1), this.ctx.currentTime);

      osc.connect(oscGain);
      oscGain.connect(this.chordGain);
      osc.start();
    });
  }

  play() {
    if (!this.ctx) this.init();

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isPlaying = true;
    
    // Fade in chord gain smoothly over 4 seconds
    if (this.chordGain) {
      this.chordGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.chordGain.gain.setValueAtTime(this.chordGain.gain.value, this.ctx.currentTime);
      this.chordGain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 4.0);
    }

    // Start periodic subtle chime notes (dew drop sound)
    this.startChimes();
  }

  startChimes() {
    if (this.chimeInterval) clearInterval(this.chimeInterval);

    this.chimeInterval = setInterval(() => {
      if (!this.isPlaying || this.isMuted) return;

      // Play a soft high resonant chime
      const freqs = [587.33, 659.25, 880.00, 1046.50, 1174.66];
      const randomFreq = freqs[Math.floor(Math.random() * freqs.length)];

      const chimeOsc = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();

      chimeOsc.type = 'sine';
      chimeOsc.frequency.setValueAtTime(randomFreq, this.ctx.currentTime);

      chimeGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 2.5);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(this.masterGain);

      chimeOsc.start();
      chimeOsc.stop(this.ctx.currentTime + 2.5);
    }, 4500);
  }

  toggleSound() {
    if (!this.ctx) {
      this.init();
      this.play();
      return true;
    }

    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : 0.4, this.ctx.currentTime + 0.5);
    }

    return !this.isMuted;
  }

  stop() {
    if (this.chordGain) {
      this.chordGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.5);
    }
    if (this.chimeInterval) {
      clearInterval(this.chimeInterval);
    }
    this.isPlaying = false;
  }
}

export const audioManager = new AudioManager();
