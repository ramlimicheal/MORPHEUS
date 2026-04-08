(function(){
  'use strict';
  window.MORPHEUS = window.MORPHEUS || {};

  var sortKey = 'ts';
  var sortAsc = false;

  function getSessions() {
    try {
      var data = JSON.parse(localStorage.getItem('morpheus_sessions') || '[]');
      return Array.isArray(data) ? data : [];
    } catch(e) { return []; }
  }

  function dayKey(d) {
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }

  function weeklySummary() {
    var sessions = getSessions();
    var now = new Date();
    var weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0,0,0,0);

    var weekSessions = sessions.filter(function(s) {
      return new Date(s.ts) >= weekStart;
    });

    var totalSec = weekSessions.reduce(function(a, s) { return a + (s.durationSec || 0); }, 0);
    var totalMin = Math.round(totalSec / 60);
    var count = weekSessions.length;
    var avg = count > 0 ? Math.round(totalMin / count) : 0;

    // Longest streak
    var days = {};
    sessions.forEach(function(s) {
      var k = dayKey(new Date(s.ts));
      days[k] = true;
    });
    var streak = 0, maxStreak = 0;
    var d = new Date();
    for (var i = 0; i < 365; i++) {
      var k = dayKey(d);
      if (days[k]) {
        streak++;
        if (streak > maxStreak) maxStreak = streak;
      } else {
        streak = 0;
      }
      d.setDate(d.getDate() - 1);
    }

    return { totalMin: totalMin, count: count, avg: avg, streak: maxStreak };
  }

  function renderSummary() {
    var s = weeklySummary();
    var el = function(id, val) {
      var e = document.getElementById(id);
      if (e) e.textContent = val;
    };
    el('a-total-min', s.totalMin);
    el('a-total-sessions', s.count);
    el('a-avg-len', s.avg);
    el('a-longest-streak', s.streak + 'd');
  }

  function renderCalendar() {
    var grid = document.getElementById('calendar-grid');
    var months = document.getElementById('calendar-months');
    if (!grid) return;

    var sessions = getSessions();
    var dayMap = {};
    sessions.forEach(function(s) {
      var k = dayKey(new Date(s.ts));
      dayMap[k] = (dayMap[k] || 0) + 1;
    });

    grid.innerHTML = '';
    if (months) months.innerHTML = '';

    var today = new Date();
    var start = new Date(today);
    start.setDate(start.getDate() - 89);

    var lastMonth = -1;
    for (var i = 0; i < 90; i++) {
      var d = new Date(start);
      d.setDate(start.getDate() + i);
      var k = dayKey(d);
      var count = dayMap[k] || 0;

      var cell = document.createElement('div');
      cell.className = 'calendar-cell';
      if (count > 0) {
        var intensity = Math.min(count, 4);
        cell.classList.add('level-' + intensity);
      }
      cell.title = k + ': ' + count + ' session(s)';
      grid.appendChild(cell);

      if (months && d.getMonth() !== lastMonth) {
        lastMonth = d.getMonth();
        var label = document.createElement('span');
        label.textContent = d.toLocaleString('default', { month: 'short' });
        months.appendChild(label);
      }
    }
  }

  function renderTrendChart() {
    var canvas = document.getElementById('trend-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    var rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width || 600;
    canvas.height = 200;

    var sessions = getSessions();
    var dayMap = {};
    sessions.forEach(function(s) {
      var k = dayKey(new Date(s.ts));
      dayMap[k] = (dayMap[k] || 0) + (s.durationSec || 0) / 60;
    });

    var days = [];
    var values = [];
    var today = new Date();
    for (var i = 29; i >= 0; i--) {
      var d = new Date(today);
      d.setDate(d.getDate() - i);
      var k = dayKey(d);
      days.push(d.getDate());
      values.push(Math.round(dayMap[k] || 0));
    }

    var maxVal = Math.max.apply(null, values) || 1;
    var w = canvas.width;
    var h = canvas.height;
    var pad = 40;
    var barW = (w - pad * 2) / 30;

    // Background
    ctx.fillStyle = '#151515';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = '#252525';
    ctx.lineWidth = 1;
    for (var g = 0; g < 4; g++) {
      var gy = pad + (h - pad * 2) * g / 3;
      ctx.beginPath();
      ctx.moveTo(pad, gy);
      ctx.lineTo(w - pad, gy);
      ctx.stroke();
    }

    // Bars
    values.forEach(function(v, idx) {
      var barH = (v / maxVal) * (h - pad * 2);
      var x = pad + idx * barW + 2;
      var y = h - pad - barH;

      var gradient = ctx.createLinearGradient(x, y, x, h - pad);
      gradient.addColorStop(0, '#8b5cf6');
      gradient.addColorStop(1, '#4c1d95');
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barW - 4, barH);
    });

    // X-axis labels
    ctx.fillStyle = '#666';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    days.forEach(function(d, idx) {
      if (idx % 5 === 0) {
        ctx.fillText(d, pad + idx * barW + barW / 2, h - 10);
      }
    });

    // Y-axis label
    ctx.fillText(maxVal + 'm', 15, pad);
    ctx.fillText('0', 15, h - pad);
  }

  function renderHistory() {
    var tbody = document.getElementById('history-tbody');
    if (!tbody) return;

    var sessions = getSessions().slice();
    sessions.sort(function(a, b) {
      var va = a[sortKey] || '';
      var vb = b[sortKey] || '';
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortAsc ? va - vb : vb - va;
      }
      va = String(va).toLowerCase();
      vb = String(vb).toLowerCase();
      return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    });

    tbody.innerHTML = '';
    sessions.forEach(function(s) {
      var tr = document.createElement('tr');
      var date = new Date(s.ts);
      var dur = Math.round((s.durationSec || 0) / 60);
      tr.innerHTML = '<td>' + date.toLocaleDateString() + '</td>' +
        '<td>' + dur + 'm</td>' +
        '<td>' + (s.mode || 'session') + '</td>' +
        '<td>' + (s.axiom || '-') + '</td>' +
        '<td>' + (s.journal || '-').substring(0, 50) + '</td>';
      tbody.appendChild(tr);
    });
  }

  function initSorting() {
    var ths = document.querySelectorAll('#history-table th[data-sort]');
    ths.forEach(function(th) {
      th.style.cursor = 'pointer';
      th.addEventListener('click', function() {
        var key = th.getAttribute('data-sort');
        if (sortKey === key) {
          sortAsc = !sortAsc;
        } else {
          sortKey = key;
          sortAsc = false;
        }
        // Update arrows
        ths.forEach(function(t) {
          var arrow = t.querySelector('.sort-arrow');
          if (arrow) arrow.textContent = '';
        });
        var arrow = th.querySelector('.sort-arrow');
        if (arrow) arrow.textContent = sortAsc ? '\u25b2' : '\u25bc';
        renderHistory();
      });
    });
  }

  function exportJSON() {
    var sessions = getSessions();
    var blob = new Blob([JSON.stringify(sessions, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'morpheus_sessions_' + dayKey(new Date()) + '.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function render() {
    renderSummary();
    renderCalendar();
    renderTrendChart();
    renderHistory();
  }

  function init() {
    initSorting();
    var exportBtn = document.getElementById('export-json-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', exportJSON);
    }
    render();
  }

  MORPHEUS.Analytics = {
    init: init,
    render: render,
    exportJSON: exportJSON
  };
})();
