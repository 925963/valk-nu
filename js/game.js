// Original 8-bit-style run/jump platformer engine, palette/mode configurable.
// Adapted from the design-handoff module: exposed as window.createGame instead
// of an ES-module export so it can load via a plain <script> tag (no bundler).
(function () {
  function createGame(canvas, cfg) {
    const ctx = canvas.getContext('2d');
    const W = 320, H = 180;
    ctx.imageSmoothingEnabled = false;

    const GRAV = 0.55, MOVE = 1.7, JUMP = -8.6, BOOST_JUMP = -10.2, FRICTION = 0.82, MAXV = 3.1, BOOST_MAXV = 4.6;

    const platforms = [
      { x: 0, y: 160, w: 320, h: 20 },
      { x: 58, y: 132, w: 46, h: 8 },
      { x: 130, y: 112, w: 46, h: 8 },
      { x: 200, y: 92, w: 46, h: 8 },
      { x: 262, y: 66, w: 44, h: 8 },
    ];
    const gemsInit = [
      { x: 76, y: 110, r: 4 },
      { x: 148, y: 90, r: 4 },
      { x: 218, y: 70, r: 4 },
    ];
    const starInit = { x: 210, y: 44, r: 5 };
    const flag = { x: 288, y: 26, w: 8, h: 40 };
    const enemyInit = { minX: 264, maxX: 300, y: 58, w: 12, h: 10, speed: 0.6 };

    let state = {};
    function reset() {
      state = {
        player: { x: 14, y: 140, w: 10, h: 14, vx: 0, vy: 0, onGround: false, facing: 1 },
        gems: gemsInit.map(g => ({ ...g, got: false })),
        star: { ...starInit, got: false },
        enemy: { ...enemyInit, x: enemyInit.minX, dir: 1, alive: true, squish: 0 },
        score: 0, boostTimer: 0, win: false, dead: false, respawnTimer: 0, t: 0,
      };
    }
    reset();

    const keys = { left: false, right: false, jump: false };
    let jumpLatched = false;

    function aabb(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

    function update() {
      const s = state;
      s.t++;
      if (s.dead) {
        s.respawnTimer--;
        if (s.respawnTimer <= 0) { const g = s.gems, sc = s.score; reset(); s.gems = g; s.score = sc; }
        return;
      }
      if (s.win) return;
      const boosted = s.boostTimer > 0;
      if (boosted) s.boostTimer--;
      const maxv = boosted ? BOOST_MAXV : MAXV;
      const p = s.player;

      if (keys.left) { p.vx -= MOVE * 0.35; p.facing = -1; }
      if (keys.right) { p.vx += MOVE * 0.35; p.facing = 1; }
      p.vx *= FRICTION;
      p.vx = Math.max(-maxv, Math.min(maxv, p.vx));
      if (keys.jump && p.onGround && !jumpLatched) { p.vy = boosted ? BOOST_JUMP : JUMP; jumpLatched = true; }
      if (!keys.jump) jumpLatched = false;

      p.vy += GRAV;
      p.vy = Math.min(p.vy, 8);
      p.x += p.vx;
      p.y += p.vy;
      p.onGround = false;
      if (p.x < 0) p.x = 0;
      if (p.x + p.w > W) p.x = W - p.w;

      for (const pl of platforms) {
        if (aabb(p, pl)) {
          const prevBottom = p.y + p.h - p.vy;
          if (p.vy >= 0 && prevBottom <= pl.y + 1) { p.y = pl.y - p.h; p.vy = 0; p.onGround = true; }
          else if (p.vy < 0 && p.y - p.vy >= pl.y + pl.h - 1) { p.y = pl.y + pl.h; p.vy = 0; }
          else if (p.x + p.w / 2 < pl.x + pl.w / 2) { p.x = pl.x - p.w; }
          else { p.x = pl.x + pl.w; }
        }
      }
      if (p.y > H + 20) { s.dead = true; s.respawnTimer = 40; }

      for (const g of s.gems) if (!g.got && Math.abs((p.x + p.w / 2) - g.x) < 8 && Math.abs((p.y + p.h / 2) - g.y) < 8) { g.got = true; s.score += 10; }
      if (!s.star.got && Math.abs((p.x + p.w / 2) - s.star.x) < 8 && Math.abs((p.y + p.h / 2) - s.star.y) < 8) { s.star.got = true; s.boostTimer = 420; }

      const e = s.enemy;
      if (e.alive) {
        e.x += e.dir * e.speed;
        if (e.x < e.minX) { e.x = e.minX; e.dir = 1; }
        if (e.x + e.w > e.maxX) { e.x = e.maxX - e.w; e.dir = -1; }
        if (aabb(p, e)) {
          const prevBottom = p.y + p.h - p.vy;
          if (p.vy > 0 && prevBottom <= e.y + 4) { e.alive = false; e.squish = 10; p.vy = -5.5; s.score += 20; }
          else { s.dead = true; s.respawnTimer = 40; }
        }
      }
      if (aabb(p, flag)) s.win = true;
    }

    function px(v) { return Math.round(v); }

    function drawBG() {
      const pal = cfg.palette;
      if (pal.bg.length === 1) { ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, W, H); }
      else {
        const bandH = H / pal.bg.length;
        pal.bg.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, i * bandH, W, bandH + 1); });
      }
      if (cfg.mode === 'snes') {
        ctx.fillStyle = pal.hill1; for (let i = 0; i < 4; i++) ctx.fillRect(i * 90 - 20, 118, 70, 42);
        ctx.fillStyle = pal.hill2; for (let i = 0; i < 5; i++) ctx.fillRect(i * 70 - 10, 132, 46, 28);
      }
    }

    function drawRect(x, y, w, h, fill, outline) {
      if (outline) { ctx.fillStyle = outline; ctx.fillRect(px(x) - 1, px(y) - 1, w + 2, h + 2); }
      ctx.fillStyle = fill; ctx.fillRect(px(x), px(y), w, h);
    }

    function draw() {
      const pal = cfg.palette;
      drawBG();
      const outline = cfg.mode === 'term' ? null : '#0a0a0a';
      for (const pl of platforms) {
        drawRect(pl.x, pl.y, pl.w, pl.h, pal.platform, outline);
        ctx.fillStyle = pal.platformTop; ctx.fillRect(px(pl.x), px(pl.y), pl.w, 3);
      }
      const s = state;
      for (const g of s.gems) if (!g.got) {
        ctx.save(); ctx.translate(g.x, g.y + Math.sin((s.t + g.x) / 10) * 2);
        drawRect(-3, -3, 6, 6, pal.gem, outline);
        ctx.restore();
      }
      if (!s.star.got) {
        ctx.save(); ctx.translate(s.star.x, s.star.y + Math.sin(s.t / 8) * 2);
        ctx.fillStyle = outline || pal.star; if (outline) ctx.fillRect(-5, -5, 10, 10);
        ctx.fillStyle = pal.star;
        ctx.fillRect(-4, -1, 8, 2); ctx.fillRect(-1, -4, 2, 8); ctx.fillRect(-3, -3, 6, 1); ctx.fillRect(-3, 2, 6, 1);
        ctx.restore();
      }
      if (s.enemy.alive) {
        const e = s.enemy;
        const sq = e.squish > 0 ? 3 : 0;
        drawRect(e.x, e.y + sq, e.w, e.h - sq, pal.enemy, outline);
        ctx.fillStyle = pal.text; ctx.fillRect(px(e.x + 2), px(e.y + 2), 2, 2); ctx.fillRect(px(e.x + e.w - 4), px(e.y + 2), 2, 2);
      } else if (state.enemy.squish > 0) { state.enemy.squish--; }

      drawRect(flag.x, flag.y, 2, flag.h, pal.flagpole || '#555', outline);
      ctx.fillStyle = pal.flag; ctx.fillRect(px(flag.x + 2), px(flag.y), flag.w, flag.h * 0.4);

      if (!s.dead) {
        const p = s.player;
        const boosted = s.boostTimer > 0;
        const body = boosted ? (pal.playerBoost || pal.player) : pal.player;
        drawRect(p.x, p.y, p.w, p.h, body, outline);
        ctx.fillStyle = pal.text;
        const eyeX = p.facing > 0 ? p.x + p.w - 4 : p.x + 2;
        ctx.fillRect(px(eyeX), px(p.y + 3), 2, 2);
        if (boosted) { ctx.fillStyle = pal.playerBoost; ctx.globalAlpha = 0.35; ctx.fillRect(px(p.x - 2), px(p.y - 2), p.w + 4, p.h + 4); ctx.globalAlpha = 1; }
      }

      if (cfg.mode === 'term') {
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        for (let y = 0; y < H; y += 2) ctx.fillRect(0, y, W, 1);
      } else if (cfg.mode === 'nes') {
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
      }

      ctx.font = '8px monospace';
      ctx.fillStyle = pal.text;
      ctx.fillText((cfg.mode === 'term' ? 'GEMS:' : 'GEM×') + s.score / 10, 6, 12);

      if (s.win) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 70, W, 30);
        ctx.fillStyle = pal.text; ctx.font = '10px monospace';
        ctx.fillText(cfg.mode === 'term' ? '> LEVEL CLEAR' : 'YOU WIN!', W / 2 - 34, 89);
      }
    }

    let raf;
    function loop() { update(); draw(); raf = requestAnimationFrame(loop); }
    loop();

    return {
      setKey(action, down) { keys[action] = down; },
      reset() { reset(); },
      destroy() { cancelAnimationFrame(raf); },
    };
  }

  window.createGame = createGame;
})();
