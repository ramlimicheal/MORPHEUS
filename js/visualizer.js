(function() {
  'use strict';
  window.MORPHEUS = window.MORPHEUS || {};

  class Visualizer {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.particles = [];
      this.mode = 'idle';
      this.color = { r: 0, g: 240, b: 255 };
      this.intensity = 0.5;
      this.breathPhase = 0;
      this.holdTime = 0;
      this.maxHold = 60;
      this.time = 0;
      this.running = false;
      this.lottieInstance = null;
      this.lottieContainer = document.getElementById('lottie-viz');
      this._analyser = null;
      this._fftData = null;
      this._resize();
      this._initParticles(70);
      window.addEventListener('resize', () => this._resize());
    }

    _resize() {
      const dpr = window.devicePixelRatio || 1;
      const r = this.canvas.getBoundingClientRect();
      this.canvas.width = r.width * dpr;
      this.canvas.height = r.height * dpr;
      this.ctx.scale(dpr, dpr);
      this.w = r.width; this.h = r.height;
      this.cx = this.w / 2; this.cy = this.h / 2;
    }

    _initParticles(n) {
      this.particles = Array.from({ length: n }, () => ({
        x: Math.random() * (this.w || 800), y: Math.random() * (this.h || 400),
        vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 0.5, alpha: Math.random() * 0.35 + 0.05
      }));
    }

    setMode(m) { this.mode = m; }
    setColor(r, g, b) { this.color = { r, g, b }; }
    setBreathPhase(v) { this.breathPhase = v; }
    setHold(cur, max) { this.holdTime = cur; this.maxHold = max || 60; }
    setIntensity(v) { this.intensity = Math.max(0, Math.min(1, v)); }

    start() { if (this.running) return; this.running = true; this._loop(); }
    stop() { this.running = false; }

    loadLottie(filename) {
      if (this.lottieInstance) {
        this.lottieInstance.destroy();
        this.lottieInstance = null;
      }
      if (!filename || !window.lottie) {
        if(this.lottieContainer) this.lottieContainer.style.display = 'none';
        this.canvas.style.display = 'block';
        return;
      }

      this.canvas.style.display = 'none';
      if(this.lottieContainer) {
        this.lottieContainer.style.display = 'block';
        this.lottieInstance = window.lottie.loadAnimation({
          container: this.lottieContainer,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          path: `assets/animations/${filename}`
        });
      }
    }

    _loop() {
      if (!this.running) return;
      this.time += 0.016;
      this._render();
      requestAnimationFrame(() => this._loop());
    }

    _render() {
      const { ctx, w, h } = this;
      ctx.fillStyle = 'rgba(10, 10, 15, 0.18)';
      ctx.fillRect(0, 0, w, h);
      this._drawParticles();
      switch (this.mode) {
        case 'breathing': this._drawBreathing(); break;
        case 'hold': this._drawHold(); break;
        case 'waveform': this._drawWaveform(); break;
        case 'surge': this._drawSurge(); break;
        case 'drift': this._drawDrift(); break;
        case 'lock': this._drawLock(); break;
        default: this._drawIdle();
      }
    }

    _drawParticles() {
      const { ctx, w, h, color } = this;
      this.particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${p.alpha})`;
        ctx.fill();
      });
    }

    _orb(cx, cy, radius, alpha) {
      const { ctx, color } = this;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 2.5);
      g.addColorStop(0, `rgba(${color.r},${color.g},${color.b},${alpha * 0.2})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(cx - radius * 3, cy - radius * 3, radius * 6, radius * 6);
      const c = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      c.addColorStop(0, `rgba(${color.r},${color.g},${color.b},${alpha})`);
      c.addColorStop(0.6, `rgba(${color.r},${color.g},${color.b},${alpha * 0.2})`);
      c.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = c; ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${color.r},${color.g},${color.b},${alpha * 0.5})`;
      ctx.lineWidth = 1.5; ctx.stroke();
    }

    _drawIdle() {
      const pulse = Math.sin(this.time * 0.8) * 0.12 + 0.88;
      this._orb(this.cx, this.cy, 55 * pulse, 0.4);
    }

    _drawBreathing() {
      const r = 30 + 90 * this.breathPhase;
      this._orb(this.cx, this.cy, r, 0.5);
      // Inner pulse ring
      const { ctx, cx, cy, color } = this;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.35, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${color.r},${color.g},${color.b},0.2)`;
      ctx.lineWidth = 1; ctx.stroke();
    }

    _drawHold() {
      const { ctx, cx, cy, color, holdTime, maxHold, time } = this;
      const progress = Math.min(holdTime / maxHold, 1);
      const R = 75;

      // Compress particles toward center
      this.particles.forEach(p => {
        const dx = cx - p.x, dy = cy - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 40) { p.x += dx * 0.002; p.y += dy * 0.002; }
      });

      // Background ring
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${color.r},${color.g},${color.b},0.1)`;
      ctx.lineWidth = 3; ctx.stroke();

      // Progress arc
      ctx.beginPath();
      ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
      const arcAlpha = progress >= 0.75 ? 0.9 : 0.5;
      ctx.strokeStyle = `rgba(${color.r},${color.g},${color.b},${arcAlpha})`;
      ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.stroke();

      // Core
      const cR = 18 + Math.sin(time * 2) * 3;
      this._orb(cx, cy, cR, 0.6);

      // Timer text
      ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},0.9)`;
      ctx.font = '600 26px "JetBrains Mono"';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(Math.floor(holdTime) + 's', cx, cy);

      // Override halo at 45s+
      if (holdTime >= 45) {
        const pa = (Math.sin(time * 4) + 1) / 2 * 0.4 + 0.2;
        ctx.beginPath(); ctx.arc(cx, cy, R + 18, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${color.r},${color.g},${color.b},${pa})`;
        ctx.lineWidth = 2; ctx.stroke();
      }
    }

    setAnalyser(analyserNode) {
      this._analyser = analyserNode;
      if (analyserNode) {
        this._fftData = new Uint8Array(analyserNode.frequencyBinCount);
      }
    }

    _drawWaveform() {
      const { ctx, w, h, cx, cy, color, time, intensity } = this;

      // Use real FFT data if analyser is connected
      if (this._analyser && this._fftData) {
        this._analyser.getByteFrequencyData(this._fftData);
        const bins = this._fftData;
        const barCount = Math.min(bins.length, 64);
        const barW = w / barCount;

        // Frequency bars
        for (let i = 0; i < barCount; i++) {
          const val = bins[i] / 255;
          const barH = val * (h * 0.5) * intensity;
          const x = i * barW;

          const gradient = ctx.createLinearGradient(x, cy - barH, x, cy + barH);
          gradient.addColorStop(0, `rgba(${color.r},${color.g},${color.b},${val * 0.6})`);
          gradient.addColorStop(0.5, `rgba(139,92,246,${val * 0.4})`);
          gradient.addColorStop(1, `rgba(${color.r},${color.g},${color.b},${val * 0.2})`);
          ctx.fillStyle = gradient;

          // Mirror bars from center
          ctx.fillRect(x, cy - barH / 2, barW - 1, barH);
        }

        // Waveform line on top of bars
        this._analyser.getByteTimeDomainData(this._fftData);
        ctx.beginPath();
        const sliceW = w / bins.length;
        for (let i = 0; i < bins.length; i++) {
          const v = bins[i] / 128.0;
          const y = cy + (v - 1) * (h * 0.25) * intensity;
          i === 0 ? ctx.moveTo(i * sliceW, y) : ctx.lineTo(i * sliceW, y);
        }
        ctx.strokeStyle = `rgba(${color.r},${color.g},${color.b},0.6)`;
        ctx.lineWidth = 2; ctx.stroke();

        // Center glow based on average amplitude
        const avg = bins.reduce((a, b) => a + b, 0) / bins.length / 255;
        this._orb(cx, cy, 15 + avg * 40, 0.2 + avg * 0.3);
        return;
      }

      // Fallback: synthetic waveform (no analyser connected)
      const amp = 35 * intensity;
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const y = cy - 25 + Math.sin(x * 0.02 + time * 3) * amp;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(${color.r},${color.g},${color.b},0.45)`;
      ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const y = cy + 25 + Math.sin(x * 0.02 + time * 3.4) * amp * 0.8;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(139,92,246,0.35)';
      ctx.lineWidth = 2; ctx.stroke();
      const beatR = Math.abs(Math.sin(time * 0.5)) * 40 + 15;
      this._orb(cx, cy, beatR, 0.3);
    }

    _drawSurge() {
      const { ctx, cx, cy, time } = this;
      this.setColor(244, 63, 94); // Rose
      const pulse = Math.sin(time * 6) * 0.3 + 0.7;
      this._orb(cx, cy, 60 * pulse, 0.6);
      // Expanding rings
      for (let i = 0; i < 3; i++) {
        const ringT = (time * 1.5 + i * 1.2) % 3;
        const ringR = ringT * 60;
        const ringA = Math.max(0, 1 - ringT / 3) * 0.3;
        ctx.beginPath(); ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(244,63,94,${ringA})`;
        ctx.lineWidth = 2; ctx.stroke();
      }
    }

    _drawDrift() {
      const { cx, cy, time } = this;
      this.setColor(139, 92, 246); // Violet
      const r = 50 + Math.sin(time * 0.3) * 15;
      this._orb(cx, cy, r, 0.35);
      // Wandering secondary orbs
      for (let i = 0; i < 3; i++) {
        const angle = time * 0.2 + i * 2.09;
        const dist = 90 + Math.sin(time * 0.4 + i) * 20;
        const ox = cx + Math.cos(angle) * dist;
        const oy = cy + Math.sin(angle) * dist;
        this._orb(ox, oy, 12, 0.15);
      }
    }

    _drawLock() {
      const { ctx, cx, cy, color, time } = this;
      // Stable outer ring
      ctx.beginPath(); ctx.arc(cx, cy, 80, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${color.r},${color.g},${color.b},0.5)`;
      ctx.lineWidth = 3; ctx.stroke();
      // Inner stable core
      this._orb(cx, cy, 35, 0.5);
      // Resonance ripples
      for (let i = 0; i < 2; i++) {
        const rippleT = (time * 0.5 + i * 1.5) % 3;
        const rippleR = 80 + rippleT * 30;
        const rippleA = Math.max(0, 1 - rippleT / 3) * 0.2;
        ctx.beginPath(); ctx.arc(cx, cy, rippleR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${color.r},${color.g},${color.b},${rippleA})`;
        ctx.lineWidth = 1; ctx.stroke();
      }
    }
  }

  window.MORPHEUS.Visualizer = Visualizer;
})();
