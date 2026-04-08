(function() {
  'use strict';
  window.MORPHEUS = window.MORPHEUS || {};

  class App {
    constructor() {
      this.mem = new MORPHEUS.Memory();
      this.audio = new MORPHEUS.AudioEngine();
      this.ambient = new MORPHEUS.AmbientEngine();
      this.rhythm = new MORPHEUS.RhythmEngine(this.mem.settings().wakeTime);
      this.vb = new MORPHEUS.VisionBoard();
      this.viz = null;
      this.sessionViz = null;
      this.runner = null;
      this.session = null;
      this.activeTab = 'session';
      this._sessionDur = 600;
      this._sessionFreq = 'none';
      this._ambientType = 'none';
      this._noiseType = 'none';
      this._solfreq = 'none';
      this._synthMood = 'none';
      this._bankKey = 'none';
      this._isoType = 'none';
    }

    init() {
      this.viz = new MORPHEUS.Visualizer(document.getElementById('visualizer'));
      this.runner = new MORPHEUS.ProtocolRunner(this.audio, this.viz, this.mem);
      this.runner.onUpdate = s => this._onProtocolUpdate(s);
      this.runner.onJournal = (id, cb) => this._showJournal(id, cb);
      this.runner.onComplete = () => this._onProtocolComplete();
      this.session = new MORPHEUS.Session(this.audio, this.viz, this.mem);

      this._bindTabs();
      this._bindSessionSetup();
      this._renderVBGrid();
      this._renderNav();
      this._renderMetrics();
      this._updateUltradian();
      this._bindSettings();
      this._bindMobile();
      this._bindVBFullscreen();
      this.viz.start();

      // Initialize new modules
      if (MORPHEUS.Analytics) MORPHEUS.Analytics.init();
      if (MORPHEUS.Presets) MORPHEUS.Presets.init();
      if (MORPHEUS.Breathing) MORPHEUS.Breathing.init();
      if (MORPHEUS.GuidedVoice) MORPHEUS.GuidedVoice.init();
      if (MORPHEUS.Reminder) MORPHEUS.Reminder.init();
      if (MORPHEUS.Mixer) MORPHEUS.Mixer.init();

      // Hide analytics view initially
      var analyticsView = document.getElementById('analytics-view');
      if (analyticsView) analyticsView.style.display = 'none';

      setInterval(() => this._updateUltradian(), 30000);
      setInterval(() => this._renderMetrics(), 10000);
    }

    // ===== MOBILE HAMBURGER & SIDEBAR =====
    _bindMobile() {
      var hamburger = document.getElementById('hamburger-btn');
      var sidebar = document.querySelector('.sidebar');
      var overlay = document.getElementById('sidebar-overlay');
      if (hamburger && sidebar) {
        hamburger.addEventListener('click', () => {
          sidebar.classList.toggle('open');
          if (overlay) overlay.classList.toggle('visible', sidebar.classList.contains('open'));
        });
      }
      if (overlay) {
        overlay.addEventListener('click', () => {
          if (sidebar) sidebar.classList.remove('open');
          overlay.classList.remove('visible');
        });
      }
    }

    // ===== VB FULLSCREEN PREVIEW =====
    _bindVBFullscreen() {
      var fsOverlay = document.getElementById('vb-fullscreen');
      var fsImg = document.getElementById('vb-fullscreen-img');
      var fsClose = document.getElementById('vb-fullscreen-close');
      if (fsClose && fsOverlay) {
        fsClose.addEventListener('click', () => fsOverlay.classList.remove('visible'));
        fsOverlay.addEventListener('click', (e) => { if (e.target === fsOverlay) fsOverlay.classList.remove('visible'); });
      }
    }

    _openVBFullscreen(url) {
      var fsOverlay = document.getElementById('vb-fullscreen');
      var fsImg = document.getElementById('vb-fullscreen-img');
      if (fsOverlay && fsImg) {
        fsImg.src = url;
        fsOverlay.classList.add('visible');
      }
    }

    // ===== TABS =====
    _bindTabs() {
      document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          this.activeTab = tab.dataset.tab;
          document.getElementById('session-setup').classList.toggle('visible', this.activeTab === 'session');
          document.getElementById('session-setup').classList.toggle('hidden', this.activeTab !== 'session');
          document.getElementById('protocol-list').classList.toggle('hidden', this.activeTab !== 'protocols');

          // Analytics view toggle
          var analyticsView = document.getElementById('analytics-view');
          if (analyticsView) {
            analyticsView.style.display = this.activeTab === 'analytics' ? 'block' : 'none';
            if (this.activeTab === 'analytics' && MORPHEUS.Analytics) MORPHEUS.Analytics.render();
          }

          // Close mobile sidebar on tab click
          var sidebar = document.querySelector('.sidebar');
          var overlay = document.getElementById('sidebar-overlay');
          if (sidebar) sidebar.classList.remove('open');
          if (overlay) overlay.classList.remove('visible');
        });
      });
    }

    // ===== SESSION SETUP =====
    _bindSessionSetup() {
      const settings = this.mem.settings();

      // Music upload
      const musicInput = document.getElementById('music-upload');
      const musicLabel = document.getElementById('music-upload-label');
      const musicInfo = document.getElementById('music-info');

      musicInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        musicLabel.innerHTML = '<span>⏳ Loading...</span>';
        try {
          const dur = await this.session.loadMusic(file);
          const mins = Math.floor(dur / 60);
          const secs = Math.floor(dur % 60);
          musicLabel.classList.add('loaded');
          musicLabel.innerHTML = `<span>✓ ${file.name.slice(0, 25)}</span>`;
          musicInfo.textContent = `Duration: ${mins}:${String(secs).padStart(2, '0')}`;
          musicInfo.classList.remove('hidden');
        } catch(err) {
          musicLabel.innerHTML = '<span>✕ Error loading file</span>';
          setTimeout(() => { musicLabel.innerHTML = '<span>+ Upload Song</span>'; musicLabel.classList.remove('loaded'); }, 2000);
        }
      });

      // Frequency selector
      document.querySelectorAll('#session-freq-selector .freq-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('#session-freq-selector .freq-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this._sessionFreq = btn.dataset.freq;
        });
      });

      // Duration selector
      document.querySelectorAll('.dur-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.dur-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this._sessionDur = parseInt(btn.dataset.dur);
        });
      });

      // Axiom
      const axiomInput = document.getElementById('session-axiom');
      axiomInput.value = settings.axiom;

      // Vision board file input
      const vbInput = document.getElementById('vb-file-input');
      vbInput.addEventListener('change', async (e) => {
        for (const file of e.target.files) {
          try { await this.vb.addImage(file); } catch(err) { break; }
        }
        this._renderVBGrid();
        vbInput.value = '';
      });

      // Ambient layer selectors
      this._bindSelectorGroup('#bank-selector', 'bank', v => {
        // Crossfade when changing banks during session
        if (this.session && this.session.running && this._bankKey !== 'none' && v !== 'none' && v !== this._bankKey) {
          this.ambient.crossfadeBank(v, 3, 0.25);
        }
        this._bankKey = v;
      });
      this._bindSelectorGroup('#ambient-selector', 'ambient', v => this._ambientType = v);
      this._bindSelectorGroup('#noise-selector', 'noise', v => this._noiseType = v);
      this._bindSelectorGroup('#solfeggio-selector', 'sol', v => this._solfreq = v);
      this._bindSelectorGroup('#synth-selector', 'synth', v => this._synthMood = v);

      // Isochronic selector
      this._bindSelectorGroup('#iso-selector', 'iso', v => this._isoType = v);

      // Begin session
      document.getElementById('begin-session').addEventListener('click', () => this._startSession());

      // End session
      document.getElementById('session-end-btn').addEventListener('click', () => this._endSession());
    }

    _bindSelectorGroup(containerSel, dataAttr, setter) {
      document.querySelectorAll(`${containerSel} .freq-btn`).forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll(`${containerSel} .freq-btn`).forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          setter(btn.dataset[dataAttr]);
        });
      });
    }

    // ===== VISION BOARD GRID (with drag & drop) =====
    _renderVBGrid() {
      const grid = document.getElementById('vb-grid');
      grid.innerHTML = '';
      this.vb.getImages().forEach((url, i) => {
        const thumb = document.createElement('div');
        thumb.className = 'vb-thumb';
        thumb.style.backgroundImage = `url(${url})`;
        thumb.draggable = true;
        thumb.dataset.idx = i;

        // Drag & drop reorder
        thumb.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', i);
          thumb.classList.add('dragging');
        });
        thumb.addEventListener('dragend', () => thumb.classList.remove('dragging'));
        thumb.addEventListener('dragover', (e) => { e.preventDefault(); thumb.classList.add('drag-over'); });
        thumb.addEventListener('dragleave', () => thumb.classList.remove('drag-over'));
        thumb.addEventListener('drop', (e) => {
          e.preventDefault();
          thumb.classList.remove('drag-over');
          const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
          const toIdx = i;
          if (fromIdx !== toIdx) {
            this.vb.reorder(fromIdx, toIdx);
            this._renderVBGrid();
          }
        });

        // Fullscreen preview on click
        thumb.addEventListener('click', (e) => {
          if (e.target.classList.contains('vb-remove')) return;
          this._openVBFullscreen(url);
        });

        const rm = document.createElement('button');
        rm.className = 'vb-remove';
        rm.textContent = '✕';
        rm.addEventListener('click', (e) => { e.stopPropagation(); this.vb.removeImage(i); this._renderVBGrid(); });
        thumb.appendChild(rm);
        grid.appendChild(thumb);
      });

      if (this.vb.count() < 8) {
        const add = document.createElement('div');
        add.className = 'vb-add';
        add.textContent = '+';
        add.addEventListener('click', () => document.getElementById('vb-file-input').click());
        grid.appendChild(add);
      }
    }

    // ===== SESSION LIFECYCLE =====
    _startSession() {
      const axiom = document.getElementById('session-axiom').value || 'I AM SOVEREIGN';
      this.session.axiom = axiom;
      this.session.beatPreset = this._sessionFreq;
      this.session.durationSec = this._sessionDur;

      // Show immersive overlay
      const overlay = document.getElementById('session-active');
      overlay.classList.add('visible');

      // Setup session canvas visualizer
      const sCanvas = document.getElementById('session-canvas');
      this.sessionViz = new MORPHEUS.Visualizer(sCanvas);
      this.session.viz = this.sessionViz;
      this.sessionViz.setColor(0, 240, 255);
      this.sessionViz.setMode('waveform');
      this.sessionViz.setIntensity(0.4);
      this.sessionViz.start();

      // Set axiom overlay text
      document.getElementById('session-axiom-overlay').textContent = axiom;

      // Start vision board slideshow
      this.vb.startSlideshow(overlay, 8);

      // Timer callback
      this.session.onTick = (elapsed, total) => {
        const rem = total - elapsed;
        const eM = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const eS = String(elapsed % 60).padStart(2, '0');
        const tM = String(Math.floor(total / 60)).padStart(2, '0');
        const tS = String(total % 60).padStart(2, '0');
        document.getElementById('session-timer').textContent = `${eM}:${eS} / ${tM}:${tS}`;
        document.getElementById('session-progress').style.width = ((elapsed / total) * 100) + '%';
      };

      // Completion callback
      this.session.onComplete = (elapsed) => {
        this._endSession();
        this._showJournal('session', (notes) => {
          // Update the last logged session with notes
          const sessions = JSON.parse(localStorage.getItem('morpheus_sessions'));
          if (sessions && sessions.length > 0) {
            sessions[sessions.length - 1].notes = notes;
            localStorage.setItem('morpheus_sessions', JSON.stringify(sessions));
          }
          this._renderMetrics();
        });
      };

      // Connect AnalyserNode to session visualizer for real FFT
      var analyser = this.audio.getAnalyser();
      if (analyser && this.sessionViz) {
        this.sessionViz.setAnalyser(analyser);
      }

      // Start Endel sound bank
      if (this._bankKey !== 'none') {
        this.ambient.playBank(this._bankKey, 0.25);
        this.ambient.loadLottie(this._bankKey, document.getElementById('lottie-viz'));
      }

      // Start ambient layers
      if (this._ambientType !== 'none') this.ambient.playNature(this._ambientType, 0.2);
      if (this._noiseType !== 'none') this.ambient.playNoise(this._noiseType, 0.15);
      if (this._solfreq !== 'none') this.ambient.playSolfeggio(this._solfreq, 0.1);
      if (this._synthMood !== 'none') this.ambient.startGenerative('C', this._synthMood, 0.12);

      // Start isochronic tones
      if (this._isoType !== 'none') {
        var isoMap = { delta: 2, theta: 6, alpha: 10, beta: 20 };
        var pulseHz = isoMap[this._isoType] || 6;
        this.audio.playIsochronal(settings.carrierFreq || 200, pulseHz);
      }

      // Start breathing guide
      var breathPattern = document.getElementById('set-breathing-pattern');
      if (breathPattern && breathPattern.value !== 'none' && MORPHEUS.Breathing) {
        MORPHEUS.Breathing.start(breathPattern.value);
      }

      // Start guided voice TTS
      if (MORPHEUS.GuidedVoice && MORPHEUS.GuidedVoice.isEnabled()) {
        MORPHEUS.GuidedVoice.start(axiom);
      }

      // Tap interaction on session canvas
      overlay.addEventListener('click', this._tapHandler = () => this.ambient.playTap());

      this.session.start();
    }

    _endSession() {
      this.session.stop();
      // Crossfade stop all ambient layers
      this.ambient.crossfadeStopAll(3);
      if (this.sessionViz) { this.sessionViz.setAnalyser(null); this.sessionViz.stop(); this.sessionViz = null; }

      // Stop breathing guide and guided voice
      if (MORPHEUS.Breathing) MORPHEUS.Breathing.stop();
      if (MORPHEUS.GuidedVoice) MORPHEUS.GuidedVoice.stop();

      const overlay = document.getElementById('session-active');
      overlay.removeEventListener('click', this._tapHandler);
      this.vb.stopSlideshow(overlay);
      overlay.classList.remove('visible');

      document.getElementById('session-progress').style.width = '0%';
      this._renderMetrics();

      // Refresh analytics if visible
      if (MORPHEUS.Analytics && this.activeTab === 'analytics') MORPHEUS.Analytics.render();
    }

    // ===== PROTOCOL NAV =====
    _renderNav() {
      const nav = document.getElementById('protocol-list');
      nav.innerHTML = `
        <div class="topbar" style="position:static; padding:0 0 24px 0; background:transparent; border:none; backdrop-filter:none">
          <h1 class="page-title">Neural Protocols</h1>
        </div>
        <div class="dash-grid" id="protocol-grid"></div>
      `;
      const grid = document.getElementById('protocol-grid');

      Object.values(MORPHEUS.PROTOCOLS).forEach(p => {
        const hash = [...p.name].reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const images = ['abstract_nebula.png', 'neural_geometric.png', 'dark_fluid.png'];
        const bgImg = images[hash % 3];
        const hue = (hash * 37) % 360;

        const card = document.createElement('div');
        card.className = 'dash-card protocol-card';
        card.dataset.id = p.id;
        card.style.cursor = 'pointer';
        card.style.setProperty('--card-bg-img', `url('../assets/thumbnails/${bgImg}')`);
        card.style.setProperty('--card-hue', `${hue}deg`);
        card.innerHTML = `
          <div class="card-header" style="margin-bottom:12px;">
            <span class="card-icon" style="font-size:16px; background:rgba(255,255,255,0.03);"><i data-lucide="${p.icon}" style="width:16px; height:16px;"></i></span>
            <h3 style="font-size:16px;">${p.name}</h3>
          </div>
          <div class="card-desc" style="flex:1;">${p.desc}</div>
          <div style="font-family:var(--font-mono); font-size:11px; color:var(--text-secondary); margin-top:16px; border-top:1px solid var(--border-subtle); padding-top:12px; display:flex; justify-content:space-between; align-items:center;">
             <span style="display:flex; align-items:center; gap:4px;"><i data-lucide="timer" style="width:12px; height:12px;"></i> ${p.duration}</span>
             <span style="color:var(--text-tertiary);">Activate ➔</span>
          </div>
        `;
        card.addEventListener('click', () => this._selectProtocol(p.id));
        grid.appendChild(card);
      });

      if (window.lucide) window.lucide.createIcons();
    }

    _selectProtocol(id) {
      document.querySelectorAll('.protocol-card').forEach(c => c.classList.toggle('active', c.dataset.id === id));
      document.getElementById('zone-idle').classList.add('hidden');
      document.getElementById('zone-active').classList.add('visible');
      const proto = MORPHEUS.PROTOCOLS[id];
      this.viz.setColor(...proto.color);
      this.viz.setMode('idle');
      document.getElementById('zone-title').textContent = proto.name;
      document.getElementById('zone-phase').textContent = 'READY';

      const controls = document.getElementById('protocol-controls');
      const settings = this.mem.settings();

      if (id === 'entrainment') {
        controls.innerHTML = `<div class="ctrl-instructions">${proto.desc}</div>
          <div class="audio-controls">${Object.entries(this.audio.PRESETS).map(([k, v]) => `<button class="freq-btn" data-freq="${k}">${v.label}</button>`).join('')}</div>
          <div class="ctrl-row"><button class="btn primary" id="btn-activate">▶ ACTIVATE</button><button class="btn danger hidden" id="btn-stop">■ STOP</button></div>
          <div class="ctrl-timer hidden" id="timer-display">00:00</div>`;
        controls.querySelector('[data-freq="theta"]').classList.add('active');
        this._selectedFreq = 'theta';
        controls.querySelectorAll('.freq-btn').forEach(b => b.addEventListener('click', () => {
          controls.querySelectorAll('.freq-btn').forEach(x => x.classList.remove('active'));
          b.classList.add('active');
          this._selectedFreq = b.dataset.freq;
          if (this.runner.active) this.audio.rampBeat(this.audio.preset(this._selectedFreq).beat, 3);
        }));
      } else if (id === 'ultradian') {
        const c = this.rhythm.currentCycle();
        controls.innerHTML = `<div class="ctrl-instructions">${c.suggestion}</div><div class="ctrl-timer">${this.rhythm.statusLine()}</div>`;
        return;
      } else {
        controls.innerHTML = `<div class="ctrl-instructions">${proto.desc}</div><div class="ctrl-axiom">${settings.axiom}</div>
          <div class="ctrl-row"><button class="btn primary" id="btn-activate">▶ ACTIVATE</button><button class="btn danger hidden" id="btn-stop">■ STOP</button><button class="btn hidden" id="btn-next">NEXT →</button></div>
          <div class="ctrl-timer hidden" id="timer-display">00:00</div>`;
      }

      const btnAct = document.getElementById('btn-activate');
      const btnStop = document.getElementById('btn-stop');
      if (btnAct) btnAct.addEventListener('click', () => {
        btnAct.classList.add('hidden'); btnStop.classList.remove('hidden');
        document.getElementById('timer-display')?.classList.remove('hidden');
        if (id === 'entrainment') {
          const p = this.audio.preset(this._selectedFreq);
          this.audio.playBinaural(settings.carrierFreq || 200, p.beat);
          this.viz.setMode('waveform'); this.viz.setIntensity(0.7);
          this._entrainTimer = 0;
          this._entrainInterval = setInterval(() => { this._entrainTimer++; const td = document.getElementById('timer-display'); if (td) td.textContent = this._fmtTime(this._entrainTimer); }, 1000);
          this.runner.active = proto;
        } else { this.runner.start(id, settings.axiom); }
        if (proto.lottie) this.viz.loadLottie(proto.lottie);
      });
      if (btnStop) btnStop.addEventListener('click', () => {
        this.viz.loadLottie(null);
        if (id === 'entrainment') { clearInterval(this._entrainInterval); this.audio.stop(); this.viz.setMode('idle'); this.runner.active = null; this.mem.log({ mode: 'entrainment', durationSec: this._entrainTimer, notes: '' }); }
        else { this.runner.stop(); }
        this._resetZone();
      });
      const btnNext = document.getElementById('btn-next');
      if (btnNext) btnNext.addEventListener('click', () => this.runner.nextPhase());
    }

    _onProtocolUpdate(state) {
      const phase = document.getElementById('zone-phase');
      if (phase) phase.textContent = `${state.phase} (${state.phaseIndex + 1}/${state.totalPhases})`;
      const timer = document.getElementById('timer-display');
      if (timer) { timer.classList.remove('hidden');
        if (state.phase === 'BREATHE') timer.textContent = `Breath ${Math.min(state.breathCount, 30)}/30`;
        else if (state.phase === 'HOLD') { timer.textContent = state.holdSec + 's'; if (state.holdSec >= 45) timer.style.color = 'var(--cyan)'; }
        else if (state.phase === 'SURGE') timer.textContent = this._fmtTime(300 - state.elapsed);
        else timer.textContent = this._fmtTime(state.elapsed);
      }
      const instr = document.getElementById('protocol-controls')?.querySelector('.ctrl-instructions');
      if (instr) instr.textContent = this.runner.getInstructions();
      const btnNext = document.getElementById('btn-next');
      if (btnNext) btnNext.classList.toggle('hidden', !['HOLD','DRIFT','LOCK','ANCHOR','PREPARE'].includes(state.phase));
    }

    _onProtocolComplete() { this._resetZone(); this._renderMetrics(); }

    _resetZone() {
      document.querySelectorAll('.protocol-card').forEach(c => c.classList.remove('active'));
      document.getElementById('zone-active').classList.remove('visible');
      document.getElementById('zone-idle').classList.remove('hidden');
      this.viz.setMode('idle'); this.viz.setColor(0, 240, 255);
    }

    // ===== JOURNAL =====
    _showJournal(id, callback) {
      const overlay = document.getElementById('journal-overlay');
      overlay.classList.add('visible');
      const title = overlay.querySelector('.journal-title');
      title.textContent = id === 'session' ? 'Session Complete — Journal' : `${MORPHEUS.PROTOCOLS[id]?.name || 'Session'} — Journal`;
      const textarea = overlay.querySelector('.journal-textarea');
      textarea.value = ''; textarea.focus();
      const save = document.getElementById('journal-save');
      const skip = document.getElementById('journal-skip');
      const done = (notes) => { overlay.classList.remove('visible'); callback(notes); };
      const saveCb = () => { done(textarea.value); save.removeEventListener('click', saveCb); skip.removeEventListener('click', skipCb); };
      const skipCb = () => { done(''); save.removeEventListener('click', saveCb); skip.removeEventListener('click', skipCb); };
      save.addEventListener('click', saveCb);
      skip.addEventListener('click', skipCb);
    }

    // ===== METRICS =====
    _renderMetrics() {
      const s = this.mem.stats();
      document.getElementById('m-total').textContent = s.total;
      document.getElementById('m-streak').textContent = s.streak + 'd';
      document.getElementById('m-hold').textContent = Math.floor(s.totalHoldSec / 60) + 'm';
      document.getElementById('m-last').textContent = s.lastAgo;
      const axiomEl = document.querySelector('.idle-axiom');
      if (axiomEl) axiomEl.textContent = this.mem.settings().axiom;
    }

    _updateUltradian() {
      const c = this.rhythm.currentCycle();
      const fill = document.getElementById('ultradian-fill');
      const label = document.getElementById('ultradian-label');
      if (fill) { fill.style.width = c.progressPct + '%'; fill.style.background = c.inWork ? 'linear-gradient(90deg, var(--emerald), var(--cyan))' : 'linear-gradient(90deg, var(--amber), var(--rose))'; }
      if (label) label.textContent = this.rhythm.statusLine();
    }

    _bindSettings() {
      const btn = document.getElementById('settings-btn');
      const panel = document.getElementById('settings-panel');
      const s = this.mem.settings();
      document.getElementById('set-wake').value = s.wakeTime;
      document.getElementById('set-axiom').value = s.axiom;
      document.getElementById('set-carrier').value = s.carrierFreq;
      document.getElementById('set-volume').value = s.volume;
      btn.addEventListener('click', () => panel.classList.toggle('open'));
      document.addEventListener('click', (e) => { if (panel.classList.contains('open') && !panel.contains(e.target) && e.target !== btn) panel.classList.remove('open'); });
      ['set-wake','set-axiom','set-carrier','set-volume'].forEach(id => {
        document.getElementById(id).addEventListener('change', () => {
          this.mem.updateSettings({ wakeTime: document.getElementById('set-wake').value, axiom: document.getElementById('set-axiom').value, carrierFreq: parseInt(document.getElementById('set-carrier').value) || 200, volume: parseFloat(document.getElementById('set-volume').value) || 0.25 });
          this.rhythm.setWakeTime(document.getElementById('set-wake').value);
          this.audio.setVolume(parseFloat(document.getElementById('set-volume').value) || 0.25);
          this._updateUltradian(); this._renderMetrics();
          document.getElementById('session-axiom').value = document.getElementById('set-axiom').value;
        });
      });
      document.getElementById('zone-close').addEventListener('click', () => { if (this.runner.active) this.runner.stop(); if (this._entrainInterval) clearInterval(this._entrainInterval); this.audio.stop(); this._resetZone(); });
    }

    _fmtTime(s) { const m = Math.floor(Math.abs(s) / 60); const sec = Math.abs(s) % 60; return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`; }
  }

  document.addEventListener('DOMContentLoaded', () => { const app = new App(); app.init(); window.MORPHEUS.app = app; });
})();
