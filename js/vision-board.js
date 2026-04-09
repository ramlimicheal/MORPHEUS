(function() {
  'use strict';
  window.MORPHEUS = window.MORPHEUS || {};

  const KEY = 'morpheus_vision_board';
  const MAX = 8;

  class VisionBoard {
    constructor() { this.images = this._load(); }

    async addImage(file) {
      if (this.images.length >= MAX) throw new Error('Max ' + MAX + ' images');
      const url = await this._compress(file, 800, 0.7);
      this.images.push(url);
      this._save();
      return url;
    }

    removeImage(i) { this.images.splice(i, 1); this._save(); }
    getImages() { return this.images; }
    count() { return this.images.length; }

    reorder(fromIdx, toIdx) {
      if (fromIdx < 0 || toIdx < 0 || fromIdx >= this.images.length || toIdx >= this.images.length) return;
      var item = this.images.splice(fromIdx, 1)[0];
      this.images.splice(toIdx, 0, item);
      this._save();
    }

    /** DOM-based slideshow with Ken Burns effect */
    startSlideshow(container, intervalSec) {
      if (this.images.length === 0) return;
      let idx = 0;
      const layerA = document.createElement('div');
      const layerB = document.createElement('div');
      [layerA, layerB].forEach(l => {
        l.className = 'vb-slide-layer ken-burns';
        container.appendChild(l);
      });

      const kenBurnsStates = [
        { transform: 'scale(1.0) translate(0, 0)', end: 'scale(1.15) translate(-2%, -1%)' },
        { transform: 'scale(1.15) translate(-2%, -1%)', end: 'scale(1.0) translate(1%, 1%)' },
        { transform: 'scale(1.0) translate(1%, 1%)', end: 'scale(1.1) translate(-1%, 2%)' },
        { transform: 'scale(1.1) translate(-1%, 2%)', end: 'scale(1.0) translate(0, 0)' }
      ];
      let kbIdx = 0;

      const show = (layer, i) => {
        layer.style.backgroundImage = `url(${this.images[i]})`;
        var kb = kenBurnsStates[kbIdx % kenBurnsStates.length];
        kbIdx++;
        layer.style.transform = kb.transform;
        // Trigger Ken Burns animation
        requestAnimationFrame(() => {
          layer.style.transition = 'transform ' + ((intervalSec || 8)) + 's ease-in-out, opacity 1.5s ease-in-out';
          layer.style.transform = kb.end;
        });
      };

      show(layerA, 0);
      layerA.style.opacity = '1';

      if (this.images.length > 1) {
        let activeLayer = layerA;
        let inactiveLayer = layerB;

        this._slideTimer = setInterval(() => {
          idx = (idx + 1) % this.images.length;
          show(inactiveLayer, idx);
          inactiveLayer.style.opacity = '1';
          activeLayer.style.opacity = '0';
          [activeLayer, inactiveLayer] = [inactiveLayer, activeLayer];
        }, (intervalSec || 8) * 1000);
      }
    }

    stopSlideshow(container) {
      clearInterval(this._slideTimer);
      container.querySelectorAll('.vb-slide-layer').forEach(l => l.remove());
    }

    _compress(file, maxPx, quality) {
      return new Promise(resolve => {
        const img = new Image();
        const c = document.createElement('canvas');
        img.onload = () => {
          let w = img.width, h = img.height;
          if (w > h) { if (w > maxPx) { h *= maxPx / w; w = maxPx; } }
          else { if (h > maxPx) { w *= maxPx / h; h = maxPx; } }
          c.width = w; c.height = h;
          c.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(c.toDataURL('image/jpeg', quality));
          URL.revokeObjectURL(img.src);
        };
        img.src = URL.createObjectURL(file);
      });
    }

    _load() {
      try { return JSON.parse(localStorage.getItem(KEY)) || []; }
      catch { return []; }
    }
    _save() { localStorage.setItem(KEY, JSON.stringify(this.images)); }
  }

  window.MORPHEUS.VisionBoard = VisionBoard;
})();
