# MORPHEUS — Complete Industrialization Prompt for Devin

## Repository
`https://github.com/ramlimicheal/MORPHEUS`

Clone it. Read every file. Understand the architecture before writing a single line.

---

## What MORPHEUS Is

MORPHEUS is a **neural entrainment and subconscious reprogramming engine**. It runs as a local-first, offline-sovereign web application. Users configure audio layers (binaural beats, solfeggio frequencies, ambient soundscapes, color noise, generative MIDI synth), set a personal axiom/affirmation, upload vision board images, and enter timed immersive sessions that combine all layers with a canvas-based visualizer and Lottie animations.

**Tech stack:** Vanilla HTML + CSS + JS. No frameworks. No build tools. Served via `python3 -m http.server 8888` for CORS bypass. Web Audio API for all audio synthesis. Canvas 2D for visualizations. Lottie for animation overlays. localStorage for persistence.

---

## Current Architecture (What Exists)

```
MORPHEUS/
├── index.html              # Single-page app, sidebar + main dashboard layout
├── css/morpheus.css         # Complete design system (dark mode, Inter + JetBrains Mono)
├── js/
│   ├── app.js              # Main App class — tab routing, session lifecycle, UI binding
│   ├── audio-engine.js     # Web Audio API binaural beat generator (carrier + offset oscillators)
│   ├── ambient-engine.js   # Endel soundbank loader, nature layers, color noise, solfeggio, generative MIDI synth
│   ├── visualizer.js       # Canvas 2D visualizer (modes: idle, breathing, hold, waveform, surge, drift, lock)
│   ├── protocols.js        # 8 neural protocols with ProtocolRunner state machine
│   ├── session.js          # Timed session manager (start/stop/tick/complete lifecycle)
│   ├── memory.js           # localStorage persistence (sessions, settings, stats, streaks)
│   ├── rhythm-engine.js    # Ultradian 90-min BRAC cycle tracker
│   ├── vision-board.js     # Image upload/storage (base64 in localStorage, max 8)
│   └── lottie.min.js       # Lottie player library
├── assets/
│   ├── audio/              # Endel-style ambient soundbank files (.opus)
│   ├── animations/         # Lottie JSON animation files
│   ├── midi/               # MIDI sequence files for generative synth
│   ├── thumbnails/         # Card background images (abstract_nebula, neural_geometric, dark_fluid)
│   └── generative_sequences.json  # Pre-parsed MIDI data for the generative engine
├── morpheus_engine.py      # Python MIDI parser + sequence exporter
├── start_engine.sh         # Launch script (python3 http.server + open browser)
└── README.md
```

### Key Design Patterns
- **IIFE module pattern**: Every JS file wraps in `(function(){ ... })()` and attaches to `window.MORPHEUS`
- **No dependencies except Lottie**: Everything is hand-rolled
- **CSS custom properties**: Full design token system in `:root`
- **Dashboard layout**: Fixed sidebar (260px) + scrollable main content area
- **Immersive session mode**: Full-screen overlay (`#session-active`) with Lottie + Canvas + VB slideshow

### 8 Neural Protocols (in protocols.js)
1. **Somatic Shock** — Wim Hof-style breathwork (30 breaths → retention hold → recovery)
2. **Twilight Drift** — Theta-state induction at hypnagogic boundary
3. **Entrainment** — Raw binaural beat tuning (Delta/Theta/Alpha/Beta)
4. **The Crucible** — Central governor bypass, push past fatigue
5. **Frequency Lock** — Somatic marker encoding, body-first belief installation
6. **Pattern Interrupt** — Amygdala hijack reversal, break negative loops
7. **Ultradian Sync** — 90-min BRAC cycle tracking
8. **Dream Forge** — Lucid dreaming prep (MILD technique + reality testing)

---

## What Needs To Be Built (The Mission)

### PHASE 1: Mobile-First Responsive Overhaul
**Priority: CRITICAL**

The current UI is desktop-only (fixed sidebar, 260px). It needs to work beautifully on mobile (iPhone/Android) since the primary use case is lying in bed with headphones.

**Requirements:**
- Collapsible sidebar → hamburger menu on screens < 768px
- Bottom action bar repositions properly on mobile
- Touch-friendly controls (minimum 44px tap targets)
- Session overlay must work fullscreen on mobile Safari (handle notch, safe areas)
- Cards stack single-column on mobile
- Add `<meta name="apple-mobile-web-app-capable" content="yes">` for PWA-like behavior
- Test viewport units (use `dvh` instead of `vh` for mobile Safari)

### PHASE 2: Progressive Web App (PWA)
**Priority: HIGH**

Convert to installable PWA so users can add to home screen and use offline.

**Requirements:**
- Create `manifest.json` with app name, icons (generate 192x192 and 512x512 PNG icons), theme color `#0A0A0A`, background color `#000000`, display `standalone`
- Create `sw.js` service worker that caches ALL assets on install (html, css, js, audio files, animations, midi files, thumbnails)
- Use Cache-First strategy for audio/animation assets, Network-First for HTML
- Register service worker in index.html
- Add install prompt UI (subtle banner at top)

### PHASE 3: Analytics Dashboard
**Priority: HIGH**

Build a dedicated analytics/stats view (new sidebar tab "Analytics" with chart icon).

**Requirements:**
- **Session History Table**: Date, Duration, Protocol/Session type, Axiom used, Journal excerpt — sortable, scrollable
- **Streak Calendar**: GitHub-style contribution heatmap showing daily session activity (last 90 days). Green = session done, empty = missed. Use canvas or pure CSS grid.
- **Weekly Summary Cards**: Total minutes this week, sessions this week, average session length, longest streak
- **Trend Chart**: Simple line/bar chart showing session minutes per day for last 30 days. Build with Canvas 2D — NO chart libraries.
- All data comes from `localStorage` via the existing `memory.js` module
- Export data as JSON button

### PHASE 4: Enhanced Audio Engine
**Priority: MEDIUM**

**Requirements:**
- **Isochronic Tones**: Add isochronic tone generator (amplitude-modulated single tone, no stereo requirement). Add as new selector in session config.
- **Volume Mixer**: Replace individual hardcoded volumes with a visual mixer panel. Each active layer gets a horizontal slider (0-100%). Layers: Soundbank, Binaural Beat, Solfeggio, Nature, Noise, Synth, Custom Music.
- **Crossfade**: When switching soundbanks or ending session, crossfade audio over 3 seconds instead of abrupt stop.
- **Audio Visualizer Connection**: Connect the Canvas visualizer to actual Web Audio `AnalyserNode` FFT data instead of synthetic sine waves. The visualizer should react to real audio.

### PHASE 5: Session Enhancements
**Priority: MEDIUM**

**Requirements:**
- **Guided Voice**: Add text-to-speech capability using Web Speech API (`SpeechSynthesisUtterance`). At configurable intervals (every 60s, 120s, 300s), speak the axiom aloud in a calm, low-pitched voice. Add toggle in settings.
- **Session Presets**: Let users save their current configuration (selected layers, axiom, duration) as a named preset. Store in localStorage. Show preset selector dropdown above "Activate Override" button.
- **Breathing Guide Overlay**: During immersive session, add optional visual breathing guide (expanding/contracting circle with "INHALE" / "EXHALE" text). Configurable rhythm: 4-7-8, Box breathing (4-4-4-4), or Wim Hof (rapid).
- **Session Reminder**: Use `Notification API` to send a daily reminder at user's configured wake time + 30 minutes. Request permission in settings.

### PHASE 6: Vision Board Upgrade
**Priority: LOW**

**Requirements:**
- **Drag & Drop reorder**: Allow reordering vision board images via drag and drop
- **Full-screen preview**: Click a VB thumbnail to see it full-screen
- **Transition effects**: During session slideshow, use Ken Burns effect (slow zoom + pan) instead of simple opacity fade
- **Image compression**: Before storing in localStorage, resize images to max 800px width and compress to JPEG @ 70% quality using Canvas. This prevents localStorage overflow.

---

## Code Style Rules

1. **No frameworks, no npm, no build tools.** Pure vanilla JS/CSS/HTML.
2. **IIFE module pattern.** Every new JS file must wrap in `(function(){ 'use strict'; window.MORPHEUS = window.MORPHEUS || {}; ... })();`
3. **CSS custom properties only.** No hardcoded colors. Use the existing `:root` tokens or extend them.
4. **Inter + JetBrains Mono fonts only.** Already loaded via Google Fonts.
5. **Dark theme only.** Background `#0A0A0A`, cards `#151515`. No light mode.
6. **Lucide icons.** Already loaded via CDN. Use `<i data-lucide="icon-name">` and call `lucide.createIcons()` after DOM updates.
7. **No placeholder images.** If you need an icon/image asset, create it or use an SVG.
8. **Mobile-first media queries.** Base styles = mobile, then `@media (min-width: 768px)` for desktop.
9. **Smooth transitions everywhere.** Use `var(--transition)` (0.2s ease-out). No jarring UI changes.
10. **localStorage is the only persistence layer.** No server, no database.

---

## File Modification Rules

- **DO NOT delete or rename existing files.** Only modify and add.
- **DO NOT change the existing module interface** (e.g., `MORPHEUS.AudioEngine`, `MORPHEUS.Session`, etc.) — extend, don't break.
- **New JS modules** go in `js/` directory.
- **New CSS** goes in `css/morpheus.css` (extend existing file) or a new `css/responsive.css` if the responsive additions are large.
- **Test on Chrome AND Safari** (mobile Safari has Web Audio quirks — require user gesture before AudioContext).

---

## Verification Checklist

When you're done, verify ALL of these:

- [ ] App loads at `http://localhost:8888/` with no console errors
- [ ] Sidebar collapses to hamburger on mobile viewport (375px width)
- [ ] All 8 audio layer types play correctly (soundbank, binaural, solfeggio, nature, noise, synth, custom music, isochronic)
- [ ] Session starts, timer counts, progress bar fills, session ends correctly
- [ ] Vision board images upload, display, and appear in session slideshow
- [ ] Journal modal appears after session completion
- [ ] Analytics tab shows session history, streak calendar, and trend chart
- [ ] PWA installs from Chrome (Add to Home Screen)
- [ ] Service worker caches assets and app works offline
- [ ] Volume mixer controls all audio layers independently
- [ ] Session presets save and load correctly
- [ ] Breathing guide overlay works during active session
- [ ] All protocols (Somatic, Twilight, Entrainment, Crucible, Lock, Interrupt, Ultradian, Dream) function correctly
- [ ] Canvas visualizer responds to real audio FFT data
- [ ] No localStorage quota errors with vision board images (compression working)
- [ ] Responsive layout works on: iPhone SE (375px), iPhone 14 Pro (393px), iPad (768px), Desktop (1440px)

---

## Execution Order

1. Phase 1 (Responsive) — do this FIRST, everything else builds on it
2. Phase 2 (PWA) — do immediately after responsive
3. Phase 3 (Analytics) — independent, can be done in parallel
4. Phase 4 (Audio) — requires careful Web Audio API work
5. Phase 5 (Session) — depends on Phase 4 for mixer
6. Phase 6 (Vision Board) — lowest priority, do last

**Commit after each phase with a clear message like `[Phase 1] Mobile-first responsive overhaul`.**

Push to `main` branch on `https://github.com/ramlimicheal/MORPHEUS`.
