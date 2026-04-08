(function() {
  'use strict';
  window.MORPHEUS = window.MORPHEUS || {};

  const PROTOCOLS = {
    somatic: {
      id: 'somatic', name: 'Somatic Shock', icon: 'zap',
      desc: 'Transient Hypofrontality via respiratory alkalosis',
      duration: '8-12 min', color: [0, 240, 255],
      phases: ['BREATHE', 'HOLD', 'RECOVER', 'JOURNAL']
    },
    twilight: {
      id: 'twilight', name: 'Twilight Drift', icon: 'moon',
      desc: 'Theta-state induction at the hypnagogic boundary',
      duration: '10-20 min', color: [139, 92, 246],
      phases: ['PREPARE', 'DRIFT', 'JOURNAL']
    },
    entrainment: {
      id: 'entrainment', name: 'Entrainment', icon: 'volume-2',
      desc: 'Binaural beats & isochronal tones — real-time brainwave tuning',
      duration: '5-30 min', color: [0, 240, 255],
      phases: ['CONFIGURE', 'ENTRAIN', 'JOURNAL']
    },
    crucible: {
      id: 'crucible', name: 'The Crucible', icon: 'flame',
      desc: 'Central Governor bypass — push past fake fatigue signals',
      duration: '5-10 min', color: [244, 63, 94],
      phases: ['PREPARE', 'SURGE', 'JOURNAL']
    },
    lock: {
      id: 'lock', name: 'Frequency Lock', icon: 'target',
      desc: 'Somatic marker encoding — body-first belief installation',
      duration: '2-5 min', color: [16, 185, 129],
      phases: ['ANCHOR', 'LOCK', 'JOURNAL']
    },
    interrupt: {
      id: 'interrupt', name: 'Pattern Interrupt', icon: 'zap-off',
      desc: 'Amygdala hijack reversal — break negative neural loops',
      duration: '2-3 min', color: [245, 158, 11],
      phases: ['DISRUPT', 'GROUND', 'JOURNAL'],
      lottie: 'overthinking.json'
    },
    ultradian: {
      id: 'ultradian', name: 'Ultradian Sync', icon: 'timer',
      desc: 'BRAC 90-min cycle alignment — ride the biological wave',
      duration: 'Continuous', color: [0, 240, 255],
      phases: ['SYNC']
    },
    dream: {
      id: 'dream', name: 'Dream Forge', icon: 'brain',
      desc: 'Lucid dreaming prep — MILD technique + reality testing',
      duration: '5-10 min', color: [139, 92, 246],
      phases: ['REALITY_TEST', 'MILD', 'DESCEND', 'JOURNAL']
    }
  };

  class ProtocolRunner {
    constructor(audio, visualizer, memory) {
      this.audio = audio;
      this.viz = visualizer;
      this.mem = memory;
      this.active = null;
      this.phase = 0;
      this.timer = null;
      this.elapsed = 0;
      this.breathCount = 0;
      this.holdSec = 0;
      this.onUpdate = null; // callback(state)
      this.onComplete = null; // callback(protocolId)
      this.onJournal = null; // callback(protocolId, cb)
      this._tick = this._tick.bind(this);
    }

    start(id, axiom) {
      const proto = PROTOCOLS[id];
      if (!proto) return;
      this.active = proto;
      this.phase = 0;
      this.elapsed = 0;
      this.breathCount = 0;
      this.holdSec = 0;
      this.axiom = axiom;
      this.viz.setColor(...proto.color);
      this._enterPhase();
    }

    stop() {
      clearInterval(this.timer);
      this.audio.stop();
      this.viz.setMode('idle');
      this.viz.setColor(0, 240, 255);
      const proto = this.active;
      this.active = null;
      return proto;
    }

    nextPhase() {
      if (!this.active) return;
      this.phase++;
      if (this.phase >= this.active.phases.length) {
        this._complete();
        return;
      }
      this._enterPhase();
    }

    _enterPhase() {
      clearInterval(this.timer);
      const phaseName = this.active.phases[this.phase];
      const id = this.active.id;
      this.elapsed = 0;

      if (phaseName === 'JOURNAL') {
        this.audio.stop();
        this.viz.setMode('idle');
        if (this.onJournal) {
          this.onJournal(id, (notes) => {
            this.mem.log({
              mode: id, durationSec: this.elapsed,
              holdSec: this.holdSec, axiom: this.axiom, notes
            });
            this._complete();
          });
        } else {
          this._complete();
        }
        return;
      }

      // Protocol-specific phase setup
      if (id === 'somatic') this._setupSomatic(phaseName);
      else if (id === 'twilight') this._setupTwilight(phaseName);
      else if (id === 'entrainment') this._setupEntrainment(phaseName);
      else if (id === 'crucible') this._setupCrucible(phaseName);
      else if (id === 'lock') this._setupLock(phaseName);
      else if (id === 'interrupt') this._setupInterrupt(phaseName);
      else if (id === 'ultradian') this._setupUltradian(phaseName);
      else if (id === 'dream') this._setupDream(phaseName);

      this._emitUpdate();
    }

    _tick() {
      this.elapsed++;
      const id = this.active?.id;
      if (!id) return;

      if (id === 'somatic' && this.active.phases[this.phase] === 'BREATHE') {
        // 2s per breath: 1s in, 1s out. 30 breaths = 60s
        this.breathCount = Math.floor(this.elapsed / 2) + 1;
        const inBreath = this.elapsed % 2 === 0;
        this.viz.setBreathPhase(inBreath ? 1 : 0.2);
        if (this.breathCount > 30) { this.nextPhase(); return; }
      }

      if (id === 'somatic' && this.active.phases[this.phase] === 'HOLD') {
        this.holdSec = this.elapsed;
        this.viz.setHold(this.holdSec, 60);
      }

      if (id === 'somatic' && this.active.phases[this.phase] === 'RECOVER') {
        if (this.elapsed >= 15) { this.nextPhase(); return; }
      }

      if (id === 'twilight' && this.active.phases[this.phase] === 'DRIFT') {
        this.viz.setIntensity(0.3 + Math.sin(this.elapsed * 0.1) * 0.2);
      }

      if (id === 'crucible' && this.active.phases[this.phase] === 'SURGE') {
        if (this.elapsed >= 300) { this.nextPhase(); return; }
        this.viz.setIntensity(0.5 + this.elapsed / 600);
      }

      if (id === 'interrupt' && this.active.phases[this.phase] === 'DISRUPT') {
        if (this.elapsed >= 60) { this.nextPhase(); return; }
      }

      if (id === 'interrupt' && this.active.phases[this.phase] === 'GROUND') {
        if (this.elapsed >= 90) { this.nextPhase(); return; }
      }

      if (id === 'dream' && this.active.phases[this.phase] === 'REALITY_TEST') {
        if (this.elapsed >= 60) { this.nextPhase(); return; }
      }
      if (id === 'dream' && this.active.phases[this.phase] === 'MILD') {
        if (this.elapsed >= 180) { this.nextPhase(); return; }
      }
      if (id === 'dream' && this.active.phases[this.phase] === 'DESCEND') {
        if (this.elapsed >= 120) { this.nextPhase(); return; }
      }

      this._emitUpdate();
    }

    // ===== PROTOCOL SETUPS =====

    _setupSomatic(phase) {
      if (phase === 'BREATHE') {
        this.breathCount = 0;
        this.viz.setMode('breathing');
        this.timer = setInterval(this._tick, 1000);
      } else if (phase === 'HOLD') {
        this.holdSec = 0;
        this.viz.setMode('hold');
        this.audio.playBinaural(200, 6); // Theta during hold
        this.timer = setInterval(this._tick, 1000);
      } else if (phase === 'RECOVER') {
        this.viz.setMode('breathing');
        this.viz.setBreathPhase(0.8);
        this.audio.stop();
        this.timer = setInterval(this._tick, 1000);
      }
    }

    _setupTwilight(phase) {
      if (phase === 'PREPARE') {
        this.viz.setMode('drift');
      } else if (phase === 'DRIFT') {
        this.viz.setMode('drift');
        this.audio.playBinaural(180, 6); // Theta
        this.timer = setInterval(this._tick, 1000);
      }
    }

    _setupEntrainment(phase) {
      if (phase === 'CONFIGURE') {
        this.viz.setMode('waveform');
        this.viz.setIntensity(0.3);
      } else if (phase === 'ENTRAIN') {
        this.viz.setMode('waveform');
        this.viz.setIntensity(0.7);
        this.timer = setInterval(this._tick, 1000);
      }
    }

    _setupCrucible(phase) {
      if (phase === 'PREPARE') {
        this.viz.setMode('surge');
      } else if (phase === 'SURGE') {
        this.viz.setMode('surge');
        this.audio.playBinaural(200, 25); // Beta for energy
        this.timer = setInterval(this._tick, 1000);
      }
    }

    _setupLock(phase) {
      if (phase === 'ANCHOR') {
        this.viz.setMode('lock');
        this.viz.setColor(16, 185, 129);
      } else if (phase === 'LOCK') {
        this.viz.setMode('lock');
        this.audio.playBinaural(200, 10); // Alpha
        this.timer = setInterval(this._tick, 1000);
      }
    }

    _setupInterrupt(phase) {
      if (phase === 'DISRUPT') {
        this.viz.setMode('surge');
        this.viz.setColor(245, 158, 11);
        this.timer = setInterval(this._tick, 1000);
      } else if (phase === 'GROUND') {
        this.viz.setMode('lock');
        this.viz.setColor(16, 185, 129);
        this.audio.playBinaural(200, 10); // Alpha to calm
        this.timer = setInterval(this._tick, 1000);
      }
    }

    _setupUltradian(phase) {
      this.viz.setMode('idle');
    }

    _setupDream(phase) {
      if (phase === 'REALITY_TEST') {
        this.viz.setMode('drift');
        this.timer = setInterval(this._tick, 1000);
      } else if (phase === 'MILD') {
        this.viz.setMode('drift');
        this.audio.playBinaural(160, 4); // Theta-Delta border
        this.timer = setInterval(this._tick, 1000);
      } else if (phase === 'DESCEND') {
        this.viz.setMode('drift');
        this.audio.rampBeat(2, 30); // Ramp down to Delta
        this.timer = setInterval(this._tick, 1000);
      }
    }

    _complete() {
      this.stop();
      if (this.onComplete) this.onComplete(this.active?.id);
    }

    _emitUpdate() {
      if (!this.onUpdate || !this.active) return;
      this.onUpdate({
        protocol: this.active,
        phase: this.active.phases[this.phase],
        phaseIndex: this.phase,
        totalPhases: this.active.phases.length,
        elapsed: this.elapsed,
        breathCount: this.breathCount,
        holdSec: this.holdSec,
        axiom: this.axiom
      });
    }

    getInstructions() {
      if (!this.active) return '';
      const phase = this.active.phases[this.phase];
      const id = this.active.id;
      const I = {
        somatic: { BREATHE: 'Deep power-breaths. In through nose, out through mouth. 30 cycles.', HOLD: 'Full exhale. Hold the vacuum. Wait for the override window at 45s.', RECOVER: 'Recovery breath. Deep inhale. Hold 15 seconds.' },
        twilight: { PREPARE: 'Close your eyes. Do not formulate sentences. Feel the axiom.', DRIFT: 'Theta state active. Let imagery flow. Do not analyze.' },
        entrainment: { CONFIGURE: 'Select target frequency. Put on stereo headphones.', ENTRAIN: 'Headphones required. Close eyes. Surrender to the frequency.' },
        crucible: { PREPARE: 'Continue your task to the point of structural failure.', SURGE: '10% SURGE — Central governor bypassed. Push NOW without hesitation.' },
        lock: { ANCHOR: 'Sit with absolute structural authority. Recall the physical sensation of your axiom being true.', LOCK: 'Frequency locked. Hold the physical state. Let it encode.' },
        interrupt: { DISRUPT: 'Pattern interrupt active. Shake your body. Move asymmetrically. Break the loop.', GROUND: '5-4-3-2-1: Name 5 things you see, 4 you hear, 3 you feel, 2 you smell, 1 you taste.' },
        ultradian: { SYNC: 'Cycle tracking active. Follow the suggested protocol timing.' },
        dream: { REALITY_TEST: 'Look at your hands. Count your fingers. Read text, look away, read again.', MILD: 'Visualize your last dream. Replay it. Recognize you are dreaming.', DESCEND: 'Descending to Delta. Let the body fall asleep while the mind stays aware.' }
      };
      return I[id]?.[phase] || '';
    }
  }

  window.MORPHEUS.PROTOCOLS = PROTOCOLS;
  window.MORPHEUS.ProtocolRunner = ProtocolRunner;
})();
