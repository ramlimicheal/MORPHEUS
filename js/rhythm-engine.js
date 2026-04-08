(function() {
  'use strict';
  window.MORPHEUS = window.MORPHEUS || {};

  class RhythmEngine {
    constructor(wakeTime) {
      this.setWakeTime(wakeTime || '06:00');
      this.CYCLE_MIN = 90;
      this.REST_MIN = 20;
    }

    setWakeTime(t) {
      const [h, m] = t.split(':').map(Number);
      this.wakeHour = h; this.wakeMin = m;
    }

    /** Minutes since wake */
    _minSinceWake() {
      const now = new Date();
      const wake = new Date(now);
      wake.setHours(this.wakeHour, this.wakeMin, 0, 0);
      if (now < wake) wake.setDate(wake.getDate() - 1);
      return Math.floor((now - wake) / 60000);
    }

    /** Current cycle index (0-based) and position within cycle */
    currentCycle() {
      const elapsed = this._minSinceWake();
      const full = this.CYCLE_MIN + this.REST_MIN; // 110 min total
      const cycleIndex = Math.floor(elapsed / full);
      const posInCycle = elapsed % full;
      const inWork = posInCycle < this.CYCLE_MIN;
      const workMin = inWork ? posInCycle : this.CYCLE_MIN;
      const restMin = inWork ? 0 : posInCycle - this.CYCLE_MIN;

      return {
        cycle: cycleIndex,
        elapsed,
        position: posInCycle,
        totalCycleMin: full,
        inWork,
        workMin,
        restMin,
        progressPct: Math.round((posInCycle / full) * 100),
        phase: inWork ? (posInCycle < 45 ? 'RAMP' : posInCycle < 75 ? 'PEAK' : 'DECLINE') : 'REST',
        suggestion: this._suggest(inWork, posInCycle, this.CYCLE_MIN)
      };
    }

    _suggest(inWork, pos, cycleLen) {
      if (!inWork) return 'REST PHASE — Run Somatic or Twilight for recovery';
      if (pos < 15) return 'RAMP UP — Frequency Lock to anchor intention';
      if (pos < 45) return 'RISING — Save protocols, ride the peak';
      if (pos < 75) return 'PEAK FOCUS — Entrainment Beta/Gamma for max output';
      return 'DECLINING — Crucible to push past fatigue wall';
    }

    /** Formatted string for display */
    statusLine() {
      const c = this.currentCycle();
      return `Cycle ${c.cycle + 1} · ${c.phase} · ${c.workMin}/${this.CYCLE_MIN}min`;
    }
  }

  window.MORPHEUS.RhythmEngine = RhythmEngine;
})();
