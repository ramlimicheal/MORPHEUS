(function() {
  'use strict';
  window.MORPHEUS = window.MORPHEUS || {};

  class Session {
    constructor(audio, visualizer, memory) {
      this.audio = audio;
      this.viz = visualizer;
      this.mem = memory;
      this.running = false;
      this.musicBuffer = null;
      this.musicSource = null;
      this.durationSec = 600;
      this.elapsed = 0;
      this.timer = null;
      this.beatPreset = 'theta';
      this.axiom = 'I AM SOVEREIGN';
      this._beatNodes = {};
      this._musicGain = null;
      this.onTick = null;
      this.onComplete = null;
    }

    async loadMusic(file) {
      this.audio._ensure();
      const buf = await file.arrayBuffer();
      this.musicBuffer = await this.audio.ctx.decodeAudioData(buf);
      return this.musicBuffer.duration;
    }

    clearMusic() { this.musicBuffer = null; }

    start() {
      if (this.running) return;
      this.running = true;
      this.elapsed = 0;
      this.audio._ensure();
      const now = this.audio.ctx.currentTime;
      const carrier = this.mem.settings().carrierFreq || 200;
      const preset = this.audio.preset(this.beatPreset);

      // === BINAURAL BEATS (underneath everything) ===
      if (preset && this.beatPreset !== 'none') {
        const beatMaster = this.audio.ctx.createGain();
        beatMaster.gain.setValueAtTime(0, now);
        beatMaster.gain.linearRampToValueAtTime(0.18, now + 4);
        beatMaster.connect(this.audio.ctx.destination);

        const oscL = this.audio.ctx.createOscillator();
        const panL = this.audio.ctx.createStereoPanner();
        oscL.type = 'sine'; oscL.frequency.value = carrier; panL.pan.value = -1;
        oscL.connect(panL).connect(beatMaster);

        const oscR = this.audio.ctx.createOscillator();
        const panR = this.audio.ctx.createStereoPanner();
        oscR.type = 'sine'; oscR.frequency.value = carrier + preset.beat; panR.pan.value = 1;
        oscR.connect(panR).connect(beatMaster);

        oscL.start(); oscR.start();
        this._beatNodes = { oscL, oscR, panL, panR, master: beatMaster };
      }

      // === MUSIC (on top of beats) ===
      if (this.musicBuffer) {
        this.musicSource = this.audio.ctx.createBufferSource();
        this.musicSource.buffer = this.musicBuffer;
        this.musicSource.loop = true;
        this._musicGain = this.audio.ctx.createGain();
        this._musicGain.gain.setValueAtTime(0, now);
        this._musicGain.gain.linearRampToValueAtTime(0.7, now + 4);
        this.musicSource.connect(this._musicGain).connect(this.audio.ctx.destination);
        this.musicSource.start();
      }

      // Visualizer — waveform during session
      this.viz.setMode('waveform');
      this.viz.setColor(0, 240, 255);
      this.viz.setIntensity(0.5);

      // Timer
      this.timer = setInterval(() => {
        this.elapsed++;
        if (this.onTick) this.onTick(this.elapsed, this.durationSec);
        if (this.elapsed >= this.durationSec) this._finish();
      }, 1000);
    }

    _finish() {
      this._fadeAndStop();
      this.mem.log({
        mode: 'session', durationSec: this.elapsed,
        axiom: this.axiom, beatPreset: this.beatPreset,
        hadMusic: !!this.musicBuffer, notes: ''
      });
      if (this.onComplete) this.onComplete(this.elapsed);
    }

    stop() { this._fadeAndStop(); }

    _fadeAndStop() {
      this.running = false;
      clearInterval(this.timer);
      const ctx = this.audio.ctx;
      if (!ctx) return;
      const now = ctx.currentTime;

      // Fade beats
      if (this._beatNodes.master) {
        this._beatNodes.master.gain.linearRampToValueAtTime(0, now + 2);
        setTimeout(() => {
          Object.values(this._beatNodes).forEach(n => {
            try { if (n.stop) n.stop(); } catch(e) {}
            try { n.disconnect(); } catch(e) {}
          });
          this._beatNodes = {};
        }, 2100);
      }

      // Fade music
      if (this._musicGain) {
        this._musicGain.gain.linearRampToValueAtTime(0, now + 2);
        setTimeout(() => {
          try { this.musicSource.stop(); } catch(e) {}
          try { this.musicSource.disconnect(); } catch(e) {}
          this._musicGain = null;
        }, 2100);
      }

      this.viz.setMode('idle');
    }
  }

  window.MORPHEUS.Session = Session;
})();
