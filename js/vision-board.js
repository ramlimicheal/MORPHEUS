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

    /** DOM-based slideshow: sets background-image on container with crossfade */
    startSlideshow(container, intervalSec) {
      if (this.images.length === 0) return;
      let idx = 0;
      // Create two layers for crossfade
      const layerA = document.createElement('div');
      const layerB = document.createElement('div');
      [layerA, layerB].forEach(l => {
        l.className = 'vb-slide-layer';
        container.appendChild(l);
      });

      const show = (layer, i) => {
        layer.style.backgroundImage = `url(${this.images[i]})`;
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
