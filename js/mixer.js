(function(){
  'use strict';
  window.MORPHEUS = window.MORPHEUS || {};

  var volumes = {
    soundbank: 0.50,
    binaural: 0.36,
    solfeggio: 0.20,
    nature: 0.40,
    noise: 0.30,
    synth: 0.24,
    isochronic: 0.30,
    music: 0.70
  };

  function getVolume(layer) {
    return volumes[layer] !== undefined ? volumes[layer] : 0.5;
  }

  function setVolume(layer, val) {
    volumes[layer] = val;
    applyVolume(layer, val);
  }

  function applyVolume(layer, val) {
    // Apply to audio engine gain nodes if available (use running instances, not constructors)
    var app = MORPHEUS.app;
    var AE = app ? app.audio : null;
    var AMB = app ? app.ambient : null;

    if (!AE) return;

    switch(layer) {
      case 'soundbank':
        if (AMB && AMB._nodes && AMB._nodes.bank && AMB._nodes.bank.gain) AMB._nodes.bank.gain.gain.value = val;
        break;
      case 'binaural':
        if (AE.binauralGain) AE.binauralGain.gain.value = val;
        break;
      case 'solfeggio':
        if (AMB && AMB._nodes && AMB._nodes.solfeggio && AMB._nodes.solfeggio.gains) {
          AMB._nodes.solfeggio.gains.forEach(function(g) { g.gain.value = val; });
        }
        break;
      case 'nature':
        if (AMB && AMB.natureGain) AMB.natureGain.gain.value = val;
        break;
      case 'noise':
        if (AMB && AMB.noiseGain) AMB.noiseGain.gain.value = val;
        break;
      case 'synth':
        if (AMB && AMB.synthGain) AMB.synthGain.gain.value = val;
        break;
      case 'isochronic':
        if (AE.isoGain) AE.isoGain.gain.value = val;
        break;
      case 'music':
        var session = app ? app.session : null;
        if (session && session._musicGain) session._musicGain.gain.value = val;
        break;
    }
  }

  function init() {
    var sliders = document.querySelectorAll('.mixer-slider');
    sliders.forEach(function(slider) {
      var layer = slider.getAttribute('data-layer');
      if (!layer) return;

      // Load saved volume
      var saved = localStorage.getItem('morpheus_vol_' + layer);
      if (saved !== null) {
        var val = parseInt(saved, 10);
        slider.value = val;
        volumes[layer] = val / 100;
        var display = slider.parentElement.querySelector('.mixer-value');
        if (display) display.textContent = val + '%';
      }

      slider.addEventListener('input', function() {
        var val = parseInt(slider.value, 10);
        volumes[layer] = val / 100;
        var display = slider.parentElement.querySelector('.mixer-value');
        if (display) display.textContent = val + '%';
        localStorage.setItem('morpheus_vol_' + layer, val);
        applyVolume(layer, val / 100);
      });
    });
  }

  MORPHEUS.Mixer = {
    init: init,
    getVolume: getVolume,
    setVolume: setVolume,
    volumes: volumes
  };
})();
