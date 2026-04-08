(function() {
  'use strict';
  window.MORPHEUS = window.MORPHEUS || {};

  /**
   * AmbientEngine — Powered by Endel's extracted audio banks + Web Audio synthesis
   * 
   * ENDEL ASSETS INTEGRATED:
   * - 14 OPUS audio banks (focus, sleep, binaural, nature, brain_massage, etc.)
   * - 9 Lottie animations (mode visualizers)
   * - 231 MIDI files (generative music sequences)
   * 
   * SYNTHESIS LAYER (Web Audio, zero files):
   * - Color noise (white, pink, brown, grey)
   * - 8D spatial panning
   * - Solfeggio frequencies
   * - Tap interaction
   */

  // Endel audio bank catalog
  const ENDEL_BANKS = {
    focus:      { file: 'assets/audio/focus.opus',        label: 'Focus',            icon: '🎯', size: '37MB' },
    sleep:      { file: 'assets/audio/sleep.opus',        label: 'Sleep',            icon: '🌙', size: '30MB' },
    sleep_pure: { file: 'assets/audio/sleep_pure.opus',   label: 'Deep Sleep',       icon: '💤', size: '1.8MB' },
    binaural:   { file: 'assets/audio/binaural.opus',     label: 'Binaural',         icon: '🧠', size: '3MB' },
    nature:     { file: 'assets/audio/nature.opus',       label: 'Nature Recovery',  icon: '🌿', size: '19MB' },
    brain_massage: { file: 'assets/audio/brain_massage.opus', label: 'Brain Massage', icon: '💆', size: '7.7MB' },
    calming_freq:  { file: 'assets/audio/calming_freq.opus',  label: 'Calming Freq',  icon: '🔔', size: '30MB' },
    creativity: { file: 'assets/audio/creativity.opus',   label: 'Creativity',       icon: '🎨', size: '5.5MB' },
    relax:      { file: 'assets/audio/relax.opus',        label: 'Deep Relax',       icon: '🧘', size: '57MB' },
    color_noise:{ file: 'assets/audio/color_noise.opus',  label: 'Color Noise',      icon: '📻', size: '1.8MB' },
    tinnitus:   { file: 'assets/audio/tinnitus.opus',     label: 'Tinnitus Relief',  icon: '👂', size: '5.6MB' },
    asmr:       { file: 'assets/audio/asmr.opus',         label: 'ASMR',             icon: '✨', size: '20MB' },
    spatial_8d: { file: 'assets/audio/spatial_8d.opus',   label: '8D Spatial',        icon: '🎧', size: '21MB' },
    intimacy:   { file: 'assets/audio/intimacy.opus',     label: 'Intimacy',         icon: '💜', size: '3.1MB' },
  };

  // Endel Lottie animation catalog
  const ENDEL_ANIMATIONS = {
    binaural:    'assets/animations/binaural.json',
    focus:       'assets/animations/focus.json',
    sleep:       'assets/animations/sleep.json',
    brain_massage: 'assets/animations/brain_massage.json',
    creativity:  'assets/animations/creativity.json',
    calming_freq: 'assets/animations/calming_frequencies.json',
    relax:       'assets/animations/relax.json',
    tinnitus:    'assets/animations/tinnitus.json',
    activity:    'assets/animations/activity.json',
  };

  // Solfeggio frequency reference
  const SOLFEGGIO = {
    '174': { hz: 174, label: '174 Hz — Pain Relief' },
    '396': { hz: 396, label: '396 Hz — Liberation' },
    '417': { hz: 417, label: '417 Hz — Change' },
    '432': { hz: 432, label: '432 Hz — Cosmic Harmony' },
    '528': { hz: 528, label: '528 Hz — DNA Repair' },
    '639': { hz: 639, label: '639 Hz — Connection' },
    '741': { hz: 741, label: '741 Hz — Intuition' },
    '852': { hz: 852, label: '852 Hz — Spiritual Order' },
    '963': { hz: 963, label: '963 Hz — Crown Activation' },
  };

  class AmbientEngine {
    constructor() {
      this.ctx = null;
      this._nodes = {};
      this._active = new Set();
      this._bufferCache = {};
      this._lottieInstances = {};
    }

    _ensure() {
      if (!this.ctx || this.ctx.state === 'closed') {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    }

    // ================================================
    // ENDEL AUDIO BANK PLAYBACK
    // ================================================
    async playBank(bankKey, volume = 0.3) {
      this._ensure();
      this.stopLayer('bank');

      const bank = ENDEL_BANKS[bankKey];
      if (!bank) return;

      let buffer = this._bufferCache[bankKey];
      if (!buffer) {
        try {
          const resp = await fetch(bank.file);
          const data = await resp.arrayBuffer();
          buffer = await this.ctx.decodeAudioData(data);
          this._bufferCache[bankKey] = buffer;
        } catch (e) {
          console.warn(`[AmbientEngine] Failed to load bank: ${bankKey}`, e);
          // Fallback to synthesized version
          this._synthFallback(bankKey, volume);
          return;
        }
      }

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(Math.min(volume, 0.5), this.ctx.currentTime + 2);

      source.connect(gain).connect(this.ctx.destination);
      source.start();

      this._nodes.bank = { source, gain, bankKey };
      this._active.add('bank');
      return bankKey;
    }

    // ================================================
    // COLOR NOISE (Synthesized — no Endel files needed)
    // ================================================
    playNoise(type = 'white', volume = 0.3) {
      this._ensure();
      this.stopLayer('noise');
      const bufSize = 2 * this.ctx.sampleRate;
      const buffer = this.ctx.createBuffer(2, bufSize, this.ctx.sampleRate);

      for (let ch = 0; ch < 2; ch++) {
        const data = buffer.getChannelData(ch);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        let lastOut = 0;

        for (let i = 0; i < bufSize; i++) {
          const white = Math.random() * 2 - 1;
          if (type === 'white') {
            data[i] = white;
          } else if (type === 'pink') {
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
            b6 = white * 0.115926;
          } else if (type === 'brown') {
            lastOut = (lastOut + (0.02 * white)) / 1.02;
            data[i] = lastOut * 3.5;
          }
        }
      }

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(Math.min(volume, 0.4), this.ctx.currentTime + 2);
      source.connect(gain).connect(this.ctx.destination);
      source.start();
      this._nodes.noise = { source, gain };
      this._active.add('noise');
    }

    // ================================================
    // NATURE SOUNDS (Synth fallback if Endel bank fails)
    // ================================================
    async playNature(type = 'rain', volume = 0.25) {
      this._ensure();
      this.stopLayer('nature');

      // Try Endel bank first
      if (type === 'nature' || type === 'forest') {
        await this.playBank('nature', volume);
        return;
      }

      // Synth fallback for rain, ocean, wind, fire
      this._synthNature(type, volume);
      this._active.add('nature');
    }

    _synthNature(type, vol) {
      const bufSize = 2 * this.ctx.sampleRate;
      const buf = this.ctx.createBuffer(2, bufSize, this.ctx.sampleRate);

      for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch);
        let last = 0;
        for (let i = 0; i < bufSize; i++) {
          const w = Math.random() * 2 - 1;
          if (type === 'ocean') {
            last = (last + (0.02 * w)) / 1.02;
            d[i] = last * 3.5;
          } else {
            d[i] = w; // White noise base for rain/wind/fire
          }
        }
      }

      const src = this.ctx.createBufferSource();
      src.buffer = buf; src.loop = true;

      const filter = this.ctx.createBiquadFilter();
      if (type === 'rain') {
        filter.type = 'bandpass'; filter.frequency.value = 3000; filter.Q.value = 0.5;
      } else if (type === 'ocean') {
        filter.type = 'lowpass'; filter.frequency.value = 600; filter.Q.value = 1;
      } else if (type === 'wind') {
        filter.type = 'bandpass'; filter.Q.value = 2; filter.frequency.value = 1200;
      } else {
        filter.type = 'bandpass'; filter.frequency.value = 2000; filter.Q.value = 0.3;
      }

      // Amplitude modulation (natural variation)
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.value = type === 'ocean' ? 0.08 : 0.15;
      lfoGain.gain.value = type === 'ocean' ? 0.3 : 0.15;
      lfo.connect(lfoGain);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 3);
      lfoGain.connect(gain.gain);

      src.connect(filter).connect(gain).connect(this.ctx.destination);
      lfo.start(); src.start();
      this._nodes.nature = { source: src, gain, extra: [lfo, lfoGain, filter] };
    }

    // ================================================
    // SOLFEGGIO FREQUENCIES
    // ================================================
    playSolfeggio(key = '528', volume = 0.15) {
      this._ensure();
      this.stopLayer('solfeggio');
      const freq = SOLFEGGIO[key]?.hz || 528;
      const now = this.ctx.currentTime;

      const osc1 = this.ctx.createOscillator();
      osc1.type = 'sine'; osc1.frequency.value = freq;
      const osc2 = this.ctx.createOscillator();
      osc2.type = 'sine'; osc2.frequency.value = freq * 2;

      const g1 = this.ctx.createGain();
      g1.gain.setValueAtTime(0, now);
      g1.gain.linearRampToValueAtTime(volume, now + 3);
      const g2 = this.ctx.createGain();
      g2.gain.setValueAtTime(0, now);
      g2.gain.linearRampToValueAtTime(volume * 0.12, now + 3);

      osc1.connect(g1).connect(this.ctx.destination);
      osc2.connect(g2).connect(this.ctx.destination);
      osc1.start(); osc2.start();
      this._nodes.solfeggio = { oscs: [osc1, osc2], gains: [g1, g2] };
      this._active.add('solfeggio');
    }

    // ================================================
    // 8D SPATIAL AUDIO (wraps any source)
    // ================================================
    enable8D(sourceNode) {
      this._ensure();
      const panner = this.ctx.createStereoPanner();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.type = 'sine'; lfo.frequency.value = 0.1;
      lfoGain.gain.value = 1.0;
      lfo.connect(lfoGain).connect(panner.pan);
      lfo.start();
      this._nodes.spatial = { panner, lfo, lfoGain };
      this._active.add('spatial');
      return panner;
    }

    // ================================================
    // TAP INTERACTION (Endel calming_taps equivalent)
    // ================================================
    playTap() {
      this._ensure();
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.08);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    }

    // ================================================
    // GENERATIVE AMBIENT SYNTH (inspired by Endel's MIDI engine)
    // ================================================
    async startGenerative(key = 'C', mood = 'calm', volume = 0.12) {
      this._ensure();
      this.stopLayer('generative');

      const delay = this.ctx.createDelay(2.0);
      delay.delayTime.value = 0.4;
      const feedback = this.ctx.createGain();
      feedback.gain.value = 0.35;
      const masterGain = this.ctx.createGain();
      masterGain.gain.value = volume;

      delay.connect(feedback).connect(delay);
      delay.connect(masterGain);
      masterGain.connect(this.ctx.destination);

      this._nodes.generative = { delay, feedback, masterGain, _timer: null };
      this._active.add('generative');

      try {
        if (!this._midiData) {
          const res = await fetch('assets/generative_sequences.json');
          this._midiData = await res.json();
        }

        // Map UI moods to MIDI JSON moods
        const moodMap = { calm: 'relax', dark: 'focus', ethereal: 'sleep' };
        let targetMood = moodMap[mood] || 'default';
        if (!this._midiData[targetMood] || this._midiData[targetMood].length === 0) {
          targetMood = 'relax';
        }
        
        const sequences = this._midiData[targetMood] || this._midiData['default'];
        
        const playSequence = () => {
          if (!this._nodes.generative) return;
          const seq = sequences[Math.floor(Math.random() * sequences.length)];
          const now = this.ctx.currentTime;
          let maxTime = 0;
          
          for(const note of seq) {
            // MIDI to Frequency (Tuned to 432Hz baseline typically, but standard 440 used here for mapping)
            const freq = 440 * Math.pow(2, (note.n - 69) / 12);
            // Endel uses velocity to dynamically control sustain/volume envelope
            const dur = 2.0 + (note.v / 127) * 4.0; 
            const timeOffset = note.t;
            if (timeOffset > maxTime) maxTime = timeOffset;
            
            const osc = this.ctx.createOscillator();
            // Alternate sine/triangle for that glassy, changing ambient pad sound
            osc.type = Math.random() > 0.4 ? 'sine' : 'triangle';
            osc.frequency.value = freq;

            const env = this.ctx.createGain();
            const startT = now + timeOffset;
            env.gain.setValueAtTime(0, startT);
            // Gentle attack
            env.gain.linearRampToValueAtTime((note.v/127) * 0.20, startT + 1.0);
            // Long physiological release
            env.gain.linearRampToValueAtTime(0, startT + dur);

            osc.connect(env);
            env.connect(delay);
            env.connect(masterGain);
            osc.start(startT);
            osc.stop(startT + dur + 0.5);
          }
          // Chain the next sequence infinitely
          this._nodes.generative._timer = setTimeout(playSequence, (maxTime * 1000) + 2000);
        };
        
        playSequence();
      } catch (e) {
        // FALLBACK: Mathematical intervals if JSON fails to load
        const scales = {
          calm: [0, 2, 4, 7, 9, 12, 14, 16],
          dark: [0, 3, 5, 7, 10, 12, 15, 17],
          ethereal: [0, 2, 4, 6, 7, 11, 12, 14],
        };
        const baseFreqs = { C: 261.63, D: 293.66, E: 329.63, F: 349.23, G: 392, A: 440 };
        const base = baseFreqs[key] || 261.63;
        const intervals = scales[mood] || scales.calm;
        const notes = intervals.map(i => base * Math.pow(2, i / 12));

        const playNote = () => {
          if (!this._nodes.generative) return;
          const freq = notes[Math.floor(Math.random() * notes.length)];
          const osc = this.ctx.createOscillator();
          osc.type = Math.random() > 0.5 ? 'sine' : 'triangle';
          osc.frequency.value = freq * (Math.random() > 0.5 ? 1 : 0.5);

          const env = this.ctx.createGain();
          const now = this.ctx.currentTime;
          const dur = 1.5 + Math.random() * 3;
          env.gain.setValueAtTime(0, now);
          env.gain.linearRampToValueAtTime(0.15 + Math.random() * 0.1, now + 0.3);
          env.gain.linearRampToValueAtTime(0, now + dur);

          osc.connect(env);
          env.connect(delay);
          env.connect(masterGain);
          osc.start(now);
          osc.stop(now + dur + 0.1);

          this._nodes.generative._timer = setTimeout(playNote, 2000 + Math.random() * 3000);
        };
        playNote();
      }
    }

    // ================================================
    // LOTTIE ANIMATION (Endel visualizer integration)
    // ================================================
    async loadLottie(key, container) {
      if (typeof lottie === 'undefined') {
        // Load lottie-web dynamically
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js';
          s.onload = resolve; s.onerror = reject;
          document.head.appendChild(s);
        });
      }

      let animPath = ENDEL_ANIMATIONS[key];
      // If the currently selected audio bank doesn't have a direct 1:1 exported geometry animation,
      // fallback to the smooth fluid relax animation to maintain Endel-like UX.
      if (!animPath) animPath = ENDEL_ANIMATIONS['relax'];
      if (!animPath) return null;

      // Stop existing animation in this container
      if (this._lottieInstances[key]) {
        this._lottieInstances[key].destroy();
      }

      const anim = lottie.loadAnimation({
        container: container,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: animPath,
      });

      this._lottieInstances[key] = anim;
      return anim;
    }

    stopLottie(key) {
      if (this._lottieInstances[key]) {
        this._lottieInstances[key].destroy();
        delete this._lottieInstances[key];
      }
    }

    // ================================================
    // SYNTH FALLBACK (when Endel bank can't load)
    // ================================================
    _synthFallback(bankKey, vol) {
      const map = {
        nature: () => this._synthNature('rain', vol),
        sleep: () => this.playNoise('brown', vol),
        focus: () => this.startGenerative('C', 'calm', vol),
        relax: () => this.playNoise('pink', vol),
        binaural: () => this.playSolfeggio('432', vol),
      };
      (map[bankKey] || map.relax)();
    }

    // ================================================
    // LAYER CONTROL
    // ================================================
    stopLayer(name) {
      const node = this._nodes[name];
      if (!node) return;

      if (node.source) { try { node.source.stop(); } catch(e) {} }
      if (node.oscs) node.oscs.forEach(o => { try { o.stop(); } catch(e) {} });
      if (node.gain) { try { node.gain.disconnect(); } catch(e) {} }
      if (node.gains) node.gains.forEach(g => { try { g.disconnect(); } catch(e) {} });
      if (node.extra) node.extra.forEach(n => { try { if (n.stop) n.stop(); n.disconnect(); } catch(e) {} });
      if (node.lfo) { try { node.lfo.stop(); node.lfo.disconnect(); } catch(e) {} }
      if (node.panner) { try { node.panner.disconnect(); } catch(e) {} }
      if (node.delay) { try { node.delay.disconnect(); } catch(e) {} }
      if (node.feedback) { try { node.feedback.disconnect(); } catch(e) {} }
      if (node.masterGain) { try { node.masterGain.disconnect(); } catch(e) {} }
      if (node._timer) clearTimeout(node._timer);

      delete this._nodes[name];
      this._active.delete(name);
    }

    stopAll() {
      [...this._active].forEach(name => this.stopLayer(name));
      Object.keys(this._lottieInstances).forEach(k => this.stopLottie(k));
    }

    isPlaying(name) { return this._active.has(name); }
    getActiveLayers() { return [...this._active]; }

    // Expose catalogs
    static get BANKS() { return ENDEL_BANKS; }
    static get ANIMATIONS() { return ENDEL_ANIMATIONS; }
    static get SOLFEGGIO() { return SOLFEGGIO; }
  }

  window.MORPHEUS.AmbientEngine = AmbientEngine;
})();
