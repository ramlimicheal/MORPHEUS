(function(){
  'use strict';
  window.MORPHEUS = window.MORPHEUS || {};

  var PATTERNS = {
    '478': { name: '4-7-8 Relaxing', phases: [
      { label: 'INHALE', duration: 4000 },
      { label: 'HOLD',   duration: 7000 },
      { label: 'EXHALE', duration: 8000 }
    ]},
    'box': { name: 'Box Breathing', phases: [
      { label: 'INHALE', duration: 4000 },
      { label: 'HOLD',   duration: 4000 },
      { label: 'EXHALE', duration: 4000 },
      { label: 'HOLD',   duration: 4000 }
    ]},
    'wim': { name: 'Wim Hof', phases: [
      { label: 'INHALE', duration: 1500 },
      { label: 'EXHALE', duration: 1500 }
    ]}
  };

  var active = false;
  var timer = null;
  var phaseIdx = 0;
  var currentPattern = null;
  var guideEl = null;
  var circleEl = null;
  var textEl = null;

  function setPhase(idx) {
    if (!currentPattern || !active) return;
    var phases = currentPattern.phases;
    phaseIdx = idx % phases.length;
    var phase = phases[phaseIdx];

    if (textEl) textEl.textContent = phase.label;

    if (circleEl) {
      circleEl.style.transition = 'transform ' + phase.duration + 'ms ease-in-out';
      if (phase.label === 'INHALE') {
        circleEl.style.transform = 'scale(1.5)';
      } else if (phase.label === 'EXHALE') {
        circleEl.style.transform = 'scale(0.6)';
      } else {
        // HOLD — keep current scale
      }
    }

    timer = setTimeout(function() {
      if (active) setPhase(phaseIdx + 1);
    }, phase.duration);
  }

  function start(patternKey) {
    stop();
    if (!patternKey || patternKey === 'none') return;

    currentPattern = PATTERNS[patternKey];
    if (!currentPattern) return;

    guideEl = document.getElementById('breathing-guide');
    circleEl = document.getElementById('breathing-circle');
    textEl = document.getElementById('breathing-text');

    if (guideEl) guideEl.classList.remove('hidden');
    active = true;

    // Reset circle
    if (circleEl) {
      circleEl.style.transition = 'none';
      circleEl.style.transform = 'scale(0.6)';
    }

    // Small delay to let CSS reset
    setTimeout(function() {
      setPhase(0);
    }, 50);
  }

  function stop() {
    active = false;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    currentPattern = null;
    phaseIdx = 0;
    if (!guideEl) guideEl = document.getElementById('breathing-guide');
    if (guideEl) guideEl.classList.add('hidden');
  }

  function init() {
    guideEl = document.getElementById('breathing-guide');
    circleEl = document.getElementById('breathing-circle');
    textEl = document.getElementById('breathing-text');
  }

  MORPHEUS.Breathing = {
    init: init,
    start: start,
    stop: stop,
    PATTERNS: PATTERNS
  };
})();
