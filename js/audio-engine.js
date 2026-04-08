(function() {
  'use strict';
  window.MORPHEUS = window.MORPHEUS || {};

  const PRESETS = {
    delta:  { beat: 2,  label: 'Delta 2Hz',  desc: 'Deep recovery' },
    theta:  { beat: 6,  label: 'Theta 6Hz',  desc: 'Subconscious access' },
    alpha:  { beat: 10, label: 'Alpha 10Hz', desc: 'Relaxed focus' },
    beta:   { beat: 20, label: 'Beta 20Hz',  desc: 'Alert concentration' },
    gamma:  { beat: 40, label: 'Gamma 40Hz', desc: 'Peak cognition' }
  };

  class AudioEngine {
    constructor() { this.ctx = null; this.nodes = {}; this.active = false; this.volume = 0.25; }

    _ensure() {
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === 'suspended') this.ctx.resume();
    }

    playBinaural(carrier = 200, beatHz = 6) {
      this.stop();
      this._ensure();
      const now = this.ctx.currentTime;
      const master = this.ctx.createGain();
      master.gain.setValueAtTime(0, now);
      master.gain.linearRampToValueAtTime(Math.min(this.volume, 0.3), now + 2);
      master.connect(this.ctx.destination);

      const oscL = this.ctx.createOscillator();
      const panL = this.ctx.createStereoPanner();
      oscL.type = 'sine'; oscL.frequency.value = carrier; panL.pan.value = -1;
      oscL.connect(panL).connect(master);

      const oscR = this.ctx.createOscillator();
      const panR = this.ctx.createStereoPanner();
      oscR.type = 'sine'; oscR.frequency.value = carrier + beatHz; panR.pan.value = 1;
      oscR.connect(panR).connect(master);

      oscL.start(); oscR.start();
      this.nodes = { oscL, oscR, panL, panR, master };
      this.active = true;
    }

    playIsochronal(carrier = 200, pulseHz = 6) {
      this.stop();
      this._ensure();
      const now = this.ctx.currentTime;
      const master = this.ctx.createGain();
      master.gain.setValueAtTime(0, now);
      master.gain.linearRampToValueAtTime(Math.min(this.volume, 0.3), now + 2);
      master.connect(this.ctx.destination);

      const osc = this.ctx.createOscillator();
      osc.type = 'sine'; osc.frequency.value = carrier;
      const ampMod = this.ctx.createGain(); ampMod.gain.value = 0.5;
      const lfo = this.ctx.createOscillator();
      lfo.type = 'square'; lfo.frequency.value = pulseHz;
      const lfoG = this.ctx.createGain(); lfoG.gain.value = 0.5;
      lfo.connect(lfoG).connect(ampMod.gain);
      osc.connect(ampMod).connect(master);
      osc.start(); lfo.start();
      this.nodes = { osc, lfo, lfoG, ampMod, master };
      this.active = true;
    }

    rampBeat(newHz, dur = 5) {
      if (!this.active || !this.nodes.oscR) return;
      this.nodes.oscR.frequency.linearRampToValueAtTime(
        this.nodes.oscL.frequency.value + newHz, this.ctx.currentTime + dur
      );
    }

    setVolume(v) {
      this.volume = Math.min(v, 0.3);
      if (this.nodes.master)
        this.nodes.master.gain.linearRampToValueAtTime(this.volume, this.ctx.currentTime + 0.5);
    }

    stop() {
      if (!this.active) return;
      if (this.nodes.master) {
        this.nodes.master.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.8);
        setTimeout(() => {
          Object.values(this.nodes).forEach(n => {
            try { if (n.stop) n.stop(); } catch(e) {}
            try { n.disconnect(); } catch(e) {}
          });
          this.nodes = {};
        }, 900);
      }
      this.active = false;
    }

    preset(name) { return PRESETS[name] || PRESETS.theta; }
    get PRESETS() { return PRESETS; }
  }

  window.MORPHEUS.AudioEngine = AudioEngine;
})();
