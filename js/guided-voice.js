(function(){
  'use strict';
  window.MORPHEUS = window.MORPHEUS || {};

  var intervalId = null;
  var enabled = false;
  var intervalMs = 120000; // default 120s

  function speak(text) {
    if (!('speechSynthesis' in window)) return;
    var utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.85;
    utter.pitch = 0.8;
    utter.volume = 0.7;
    // Try to pick a calm voice
    var voices = speechSynthesis.getVoices();
    var preferred = voices.find(function(v) {
      return v.lang.startsWith('en') && v.name.toLowerCase().indexOf('female') === -1;
    });
    if (preferred) utter.voice = preferred;
    speechSynthesis.speak(utter);
  }

  function start(axiom) {
    stop();
    if (!enabled) return;
    var text = axiom || 'I AM SOVEREIGN';

    // Speak immediately, then at interval
    speak(text);
    intervalId = setInterval(function() {
      speak(text);
    }, intervalMs);
  }

  function stop() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  }

  function setEnabled(val) {
    enabled = !!val;
    if (!enabled) stop();
  }

  function setInterval_(ms) {
    intervalMs = parseInt(ms, 10) * 1000 || 120000;
  }

  function init() {
    var toggle = document.getElementById('set-guided-voice');
    var intervalSelect = document.getElementById('set-voice-interval');

    // Load saved state
    var saved = localStorage.getItem('morpheus_guided_voice');
    if (saved === 'true') {
      enabled = true;
      if (toggle) toggle.checked = true;
    }

    var savedInterval = localStorage.getItem('morpheus_voice_interval');
    if (savedInterval) {
      intervalMs = parseInt(savedInterval, 10) * 1000 || 120000;
      if (intervalSelect) intervalSelect.value = savedInterval;
    }

    if (toggle) {
      toggle.addEventListener('change', function() {
        enabled = toggle.checked;
        localStorage.setItem('morpheus_guided_voice', String(enabled));
      });
    }

    if (intervalSelect) {
      intervalSelect.addEventListener('change', function() {
        intervalMs = parseInt(intervalSelect.value, 10) * 1000 || 120000;
        localStorage.setItem('morpheus_voice_interval', intervalSelect.value);
      });
    }

    // Preload voices
    if ('speechSynthesis' in window) {
      speechSynthesis.getVoices();
    }
  }

  MORPHEUS.GuidedVoice = {
    init: init,
    start: start,
    stop: stop,
    setEnabled: setEnabled,
    setInterval: setInterval_,
    isEnabled: function() { return enabled; }
  };
})();
