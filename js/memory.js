(function() {
  'use strict';
  window.MORPHEUS = window.MORPHEUS || {};

  const KEYS = {
    sessions: 'morpheus_sessions', daily: 'morpheus_daily',
    settings: 'morpheus_settings', streak: 'morpheus_streak'
  };

  const DEFAULTS = {
    sessions: [], daily: {},
    settings: { wakeTime: '06:00', axiom: 'I AM SOVEREIGN', carrierFreq: 200, volume: 0.25 },
    streak: { current: 0, longest: 0, lastDate: null }
  };

  class Memory {
    constructor() {
      Object.entries(KEYS).forEach(([name, key]) => {
        if (localStorage.getItem(key) === null)
          localStorage.setItem(key, JSON.stringify(DEFAULTS[name]));
      });
    }

    log(session) {
      const sessions = this._r(KEYS.sessions);
      const entry = { id: crypto.randomUUID(), ts: Date.now(), ...session };
      sessions.push(entry);
      this._w(KEYS.sessions, sessions);
      this._daily(entry);
      this._streak();
      return entry;
    }

    _daily(e) {
      const d = this._r(KEYS.daily);
      const k = new Date().toISOString().slice(0, 10);
      if (!d[k]) d[k] = { sec: 0, count: 0, holdMax: 0, modes: {} };
      d[k].sec += e.durationSec || 0;
      d[k].count++;
      if (e.holdSec > (d[k].holdMax || 0)) d[k].holdMax = e.holdSec;
      d[k].modes[e.mode] = (d[k].modes[e.mode] || 0) + 1;
      this._w(KEYS.daily, d);
    }

    _streak() {
      const s = this._r(KEYS.streak);
      const today = new Date().toISOString().slice(0, 10);
      if (s.lastDate === today) return;
      const yday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
      s.current = s.lastDate === yday ? s.current + 1 : 1;
      s.lastDate = today;
      if (s.current > s.longest) s.longest = s.current;
      this._w(KEYS.streak, s);
    }

    stats() {
      const sessions = this._r(KEYS.sessions);
      const streak = this._r(KEYS.streak);
      const modes = {}; let totalHold = 0;
      sessions.forEach(s => { modes[s.mode] = (modes[s.mode] || 0) + 1; if (s.holdSec) totalHold += s.holdSec; });
      const last = sessions[sessions.length - 1];
      return {
        total: sessions.length, streak: streak.current,
        longestStreak: streak.longest, totalHoldSec: totalHold,
        lastAgo: last ? this._ago(last.ts) : 'Never', modes,
        notes: sessions.filter(s => s.notes?.trim()).slice(-5).reverse()
      };
    }

    settings() { return this._r(KEYS.settings); }
    updateSettings(p) { const s = this.settings(); Object.assign(s, p); this._w(KEYS.settings, s); }

    _ago(ts) {
      const m = Math.floor((Date.now() - ts) / 6e4);
      if (m < 1) return 'Now'; if (m < 60) return m + 'm ago';
      const h = Math.floor(m / 60);
      return h < 24 ? h + 'h ago' : Math.floor(h / 24) + 'd ago';
    }

    _r(k) { return JSON.parse(localStorage.getItem(k)); }
    _w(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  }

  window.MORPHEUS.Memory = Memory;
})();
