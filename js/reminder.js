(function(){
  'use strict';
  window.MORPHEUS = window.MORPHEUS || {};

  var enabled = false;
  var checkInterval = null;

  function requestPermission(cb) {
    if (!('Notification' in window)) {
      if (cb) cb(false);
      return;
    }
    if (Notification.permission === 'granted') {
      if (cb) cb(true);
      return;
    }
    if (Notification.permission === 'denied') {
      if (cb) cb(false);
      return;
    }
    Notification.requestPermission().then(function(perm) {
      if (cb) cb(perm === 'granted');
    });
  }

  function sendNotification() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
      new Notification('MORPHEUS — Session Reminder', {
        body: 'Time for your neural entrainment session. Reprogram your subconscious.',
        icon: '/assets/icons/icon-192.png',
        badge: '/assets/icons/icon-192.png',
        tag: 'morpheus-reminder',
        requireInteraction: false
      });
    } catch(e) {
      console.warn('[Reminder] Notification failed:', e);
    }
  }

  function getWakeTime() {
    var el = document.getElementById('set-wake');
    if (el && el.value) return el.value;
    return localStorage.getItem('morpheus_wake_time') || '06:00';
  }

  function getReminderTime() {
    var wake = getWakeTime();
    var parts = wake.split(':');
    var h = parseInt(parts[0], 10) || 6;
    var m = parseInt(parts[1], 10) || 0;
    m += 30;
    if (m >= 60) { h++; m -= 60; }
    if (h >= 24) h -= 24;
    return { h: h, m: m };
  }

  function checkTime() {
    if (!enabled) return;
    var now = new Date();
    var target = getReminderTime();

    if (now.getHours() === target.h && now.getMinutes() === target.m) {
      // Check if already sent today
      var todayKey = 'morpheus_reminder_' + now.toDateString();
      if (!localStorage.getItem(todayKey)) {
        localStorage.setItem(todayKey, '1');
        sendNotification();
      }
    }
  }

  function start() {
    stop();
    if (!enabled) return;
    // Check every 30 seconds
    checkInterval = setInterval(checkTime, 30000);
    checkTime();
  }

  function stop() {
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }
  }

  function init() {
    var toggle = document.getElementById('set-reminder');

    var saved = localStorage.getItem('morpheus_reminder_enabled');
    if (saved === 'true') {
      enabled = true;
      if (toggle) toggle.checked = true;
    }

    if (toggle) {
      toggle.addEventListener('change', function() {
        enabled = toggle.checked;
        localStorage.setItem('morpheus_reminder_enabled', String(enabled));
        if (enabled) {
          requestPermission(function(granted) {
            if (granted) {
              start();
            } else {
              enabled = false;
              toggle.checked = false;
              localStorage.setItem('morpheus_reminder_enabled', 'false');
            }
          });
        } else {
          stop();
        }
      });
    }

    if (enabled) start();
  }

  MORPHEUS.Reminder = {
    init: init,
    start: start,
    stop: stop,
    sendNotification: sendNotification
  };
})();
