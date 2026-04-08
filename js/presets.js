(function(){
  'use strict';
  window.MORPHEUS = window.MORPHEUS || {};

  var STORAGE_KEY = 'morpheus_presets';

  function getPresets() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch(e) { return {}; }
  }

  function savePresets(presets) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  }

  function getCurrentConfig() {
    var config = {};

    // Soundbank
    var activeBank = document.querySelector('.card-btn.active-btn');
    if (activeBank) config.soundbank = activeBank.getAttribute('data-bank');

    // Binaural
    var activeBin = document.querySelector('#binaural-selector .freq-btn.active');
    if (activeBin) config.binaural = activeBin.getAttribute('data-hz');

    // Solfeggio
    var activeSolf = document.querySelector('.solfeggio-btn.active');
    if (activeSolf) config.solfeggio = activeSolf.getAttribute('data-freq');

    // Nature
    var activeNature = document.querySelector('#nature-selector .freq-btn.active');
    if (activeNature) config.nature = activeNature.getAttribute('data-nature');

    // Noise
    var activeNoise = document.querySelector('#noise-selector .freq-btn.active');
    if (activeNoise) config.noise = activeNoise.getAttribute('data-noise');

    // Isochronic
    var activeIso = document.querySelector('#iso-selector .freq-btn.active');
    if (activeIso) config.isochronic = activeIso.getAttribute('data-iso');

    // Axiom
    var axiomEl = document.getElementById('set-axiom');
    if (axiomEl) config.axiom = axiomEl.value;

    // Duration
    var durEl = document.getElementById('duration-slider');
    if (durEl) config.duration = durEl.value;

    // Mixer volumes
    var sliders = document.querySelectorAll('.mixer-slider');
    if (sliders.length) {
      config.mixer = {};
      sliders.forEach(function(s) {
        config.mixer[s.getAttribute('data-layer')] = parseInt(s.value, 10);
      });
    }

    return config;
  }

  function applyConfig(config) {
    if (!config) return;

    // Soundbank
    if (config.soundbank) {
      var btn = document.querySelector('.card-btn[data-bank="' + config.soundbank + '"]');
      if (btn) btn.click();
    }

    // Binaural
    if (config.binaural) {
      var bin = document.querySelector('#binaural-selector .freq-btn[data-hz="' + config.binaural + '"]');
      if (bin) bin.click();
    }

    // Solfeggio
    if (config.solfeggio) {
      var solf = document.querySelector('.solfeggio-btn[data-freq="' + config.solfeggio + '"]');
      if (solf) solf.click();
    }

    // Nature
    if (config.nature) {
      var nat = document.querySelector('#nature-selector .freq-btn[data-nature="' + config.nature + '"]');
      if (nat) nat.click();
    }

    // Noise
    if (config.noise) {
      var noise = document.querySelector('#noise-selector .freq-btn[data-noise="' + config.noise + '"]');
      if (noise) noise.click();
    }

    // Isochronic
    if (config.isochronic) {
      var iso = document.querySelector('#iso-selector .freq-btn[data-iso="' + config.isochronic + '"]');
      if (iso) iso.click();
    }

    // Axiom
    if (config.axiom) {
      var axiomEl = document.getElementById('set-axiom');
      if (axiomEl) {
        axiomEl.value = config.axiom;
        axiomEl.dispatchEvent(new Event('change'));
      }
    }

    // Duration
    if (config.duration) {
      var durEl = document.getElementById('duration-slider');
      if (durEl) {
        durEl.value = config.duration;
        durEl.dispatchEvent(new Event('input'));
      }
    }

    // Mixer
    if (config.mixer) {
      Object.keys(config.mixer).forEach(function(layer) {
        var slider = document.querySelector('.mixer-slider[data-layer="' + layer + '"]');
        if (slider) {
          slider.value = config.mixer[layer];
          slider.dispatchEvent(new Event('input'));
        }
      });
    }
  }

  function renderSelect() {
    var select = document.getElementById('preset-select');
    if (!select) return;

    var presets = getPresets();
    var val = select.value;
    select.innerHTML = '<option value="">-- Select Preset --</option>';
    Object.keys(presets).forEach(function(name) {
      var opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      select.appendChild(opt);
    });
    if (val && presets[val]) select.value = val;
  }

  function init() {
    var select = document.getElementById('preset-select');
    var saveBtn = document.getElementById('preset-save-btn');

    if (select) {
      select.addEventListener('change', function() {
        if (!select.value) return;
        var presets = getPresets();
        var config = presets[select.value];
        if (config) applyConfig(config);
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', function() {
        var name = prompt('Preset name:');
        if (!name || !name.trim()) return;
        name = name.trim();
        var presets = getPresets();
        presets[name] = getCurrentConfig();
        savePresets(presets);
        renderSelect();
        if (select) select.value = name;
      });
    }

    renderSelect();
  }

  MORPHEUS.Presets = {
    init: init,
    renderSelect: renderSelect,
    getCurrentConfig: getCurrentConfig,
    applyConfig: applyConfig
  };
})();
