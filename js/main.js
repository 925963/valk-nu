// Wires the platformer engine to a real <canvas> with plain DOM events.
// Replaces the design prototype's ref/prop plumbing.
(function () {
  'use strict';

  // Palette/mode from the handoff's cfgs.c (green-phosphor terminal).
  const cfg = {
    mode: 'term',
    palette: {
      bg: ['#020402'],
      ground: '#0f5e2a', platform: '#0f5e2a', platformTop: '#1f8f3d',
      gem: '#33ff66', star: '#7dffab', enemy: '#1f8f3d', flag: '#33ff66', flagpole: '#1f8f3d',
      player: '#33ff66', playerBoost: '#7dffab', text: '#33ff66',
    },
  };

  const canvas = document.getElementById('game-canvas');
  const screen = document.getElementById('game-screen');
  const game = window.createGame(canvas, cfg);

  // --- Keyboard controls (desktop) ---
  const KEY_MAP = {
    ArrowLeft: 'left',
    ArrowRight: 'right',
    ArrowUp: 'jump',
    ' ': 'jump',
    Spacebar: 'jump',
  };

  screen.addEventListener('keydown', function (e) {
    const action = KEY_MAP[e.key];
    if (!action) return;
    e.preventDefault(); // stop page scroll on arrows/space
    game.setKey(action, true);
  });

  screen.addEventListener('keyup', function (e) {
    const action = KEY_MAP[e.key];
    if (!action) return;
    e.preventDefault();
    game.setKey(action, false);
  });

  // --- On-screen buttons (touch / mouse) ---
  function bindHold(el, action) {
    if (!el) return;
    const down = function (e) { e.preventDefault(); game.setKey(action, true); };
    const up = function (e) { e.preventDefault(); game.setKey(action, false); };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointerleave', up);   // dragged-off finger doesn't stick
    el.addEventListener('pointercancel', up);
  }

  bindHold(document.getElementById('btn-left'), 'left');
  bindHold(document.getElementById('btn-right'), 'right');
  bindHold(document.getElementById('btn-jump'), 'jump');

  const resetBtn = document.getElementById('btn-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', function () { game.reset(); });
  }
})();
