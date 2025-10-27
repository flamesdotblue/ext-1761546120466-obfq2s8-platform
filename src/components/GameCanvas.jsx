import React from 'react';

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function rand(min, max) { return Math.random() * (max - min) + min; }

const LEVELS = 10;
const BOSS_LEVELS = new Set([3, 6, 9, 10]);

export default function GameCanvas({ onHudUpdate }) {
  const canvasRef = React.useRef(null);
  const [state, setState] = React.useState({
    level: 1,
    score: 0,
    lives: 3,
    paused: false,
    gameOver: false,
    victory: false,
  });

  const gameRef = React.useRef(null);

  const resetLevelState = React.useCallback((level) => {
    const baseSpeed = 2 + Math.min(level - 1, 6) * 0.4; // gentle scaling
    const gravity = 0.35;
    const flap = -6.5;
    return {
      t: 0,
      bird: { x: 120, y: 200, vy: 0, r: 16, shield: 0 },
      pipes: [],
      stars: [], // power-ups for boss damage
      rings: [], // shields
      particles: [],
      bullets: [], // boss projectiles
      boss: BOSS_LEVELS.has(level) ? { x: 560, y: 180, w: 70, h: 70, hp: level === 10 ? 12 : level >= 9 ? 9 : 6, vx: 0, vy: 0, cooldown: 0 } : null,
      speed: baseSpeed,
      gravity,
      flap,
      spawnTimer: 0,
      starTimer: 0,
      ringTimer: 0,
      levelGoal: BOSS_LEVELS.has(level) ? 0 : 12 + Math.floor(level * 1.5),
    };
  }, []);

  const restart = React.useCallback(() => {
    setState({ level: 1, score: 0, lives: 3, paused: false, gameOver: false, victory: false });
    gameRef.current = resetLevelState(1);
    onHudUpdate({ level: 1, score: 0, lives: 3, paused: false, gameOver: false, victory: false });
  }, [onHudUpdate, resetLevelState]);

  React.useEffect(() => {
    gameRef.current = resetLevelState(1);
  }, [resetLevelState]);

  React.useEffect(() => {
    function onKey(e) {
      if (e.repeat) return;
      if ([' ', 'w', 'W', 'ArrowUp'].includes(e.key)) {
        flap();
      } else if (e.key === 'p' || e.key === 'P') {
        togglePause();
      } else if (e.key === 'r' || e.key === 'R') {
        restart();
      }
    }
    window.addEventListener('keydown', onKey);
    const onClick = () => flap();
    window.addEventListener('mousedown', onClick);
    window.addEventListener('touchstart', onClick, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('touchstart', onClick);
    };
  }, [restart]);

  const togglePause = () => {
    setState((s) => {
      const paused = !s.paused;
      onHudUpdate({ paused });
      return { ...s, paused };
    });
  };

  const flap = () => {
    if (state.gameOver || state.victory) return;
    const G = gameRef.current;
    if (!G) return;
    G.bird.vy = state.paused ? G.bird.vy : G.flap;
  };

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const DPR = () => window.devicePixelRatio || 1;
    function resize() {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * DPR());
      canvas.height = Math.floor(rect.height * DPR());
      ctx.setTransform(DPR(), 0, 0, DPR(), 0, 0);
    }
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    let raf;
    function loop() {
      raf = requestAnimationFrame(loop);
      step();
      draw();
    }
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [state.paused, state.gameOver, state.victory]);

  function step() {
    const G = gameRef.current;
    if (!G) return;
    if (state.paused || state.gameOver || state.victory) return;

    G.t += 1;
    const W = canvasRef.current.width / (window.devicePixelRatio || 1);
    const H = canvasRef.current.height / (window.devicePixelRatio || 1);

    // Bird physics
    G.bird.vy += G.gravity;
    G.bird.vy = clamp(G.bird.vy, -10, 10);
    G.bird.y += G.bird.vy;

    // Boundaries
    if (G.bird.y < 0) G.bird.y = 0;
    if (G.bird.y > H - G.bird.r) {
      G.bird.y = H - G.bird.r;
      // ground hit counts as a hit
      damageOrLifeLoss();
    }

    // Spawns for normal levels
    if (!G.boss) {
      G.spawnTimer -= 1;
      if (G.spawnTimer <= 0) {
        const gap = clamp(130 - state.level * 3, 90, 130);
        const topH = rand(40, H - 120 - gap);
        const bottomY = topH + gap;
        G.pipes.push({ x: W + 40, y: 0, w: 60, h: topH, passed: false });
        G.pipes.push({ x: W + 40, y: bottomY, w: 60, h: H - bottomY, passed: false });
        G.spawnTimer = Math.max(85 - state.level * 5, 45);
      }

      // Power-ups
      G.starTimer -= 1;
      if (G.starTimer <= 0) {
        G.stars.push({ x: W + 40, y: rand(40, H - 40), r: 7, vx: -G.speed });
        G.starTimer = 300 - state.level * 10 + rand(-30, 30);
      }
      G.ringTimer -= 1;
      if (G.ringTimer <= 0) {
        G.rings.push({ x: W + 40, y: rand(60, H - 60), r: 12, vx: -G.speed });
        G.ringTimer = 420 - state.level * 10 + rand(-40, 40);
      }
    } else {
      // Boss behavior
      const b = G.boss;
      // Float around
      b.vx += rand(-0.2, 0.2);
      b.vy += rand(-0.2, 0.2);
      b.vx = clamp(b.vx, -1.2, 1.2);
      b.vy = clamp(b.vy, -1.2, 1.2);
      b.x += b.vx;
      b.y += b.vy;
      b.x = clamp(b.x, W * 0.55, W - b.w - 20);
      b.y = clamp(b.y, 30, H - b.h - 30);

      // Launch projectiles
      b.cooldown -= 1;
      const shootRate = state.level === 10 ? 40 : 60;
      if (b.cooldown <= 0) {
        const spread = state.level >= 9 ? 2 : 1;
        for (let i = -spread; i <= spread; i++) {
          G.bullets.push({
            x: b.x + 10,
            y: b.y + b.h / 2 + i * 14,
            vx: -clamp(G.speed + 1 + Math.abs(i) * 0.4, 3, 5),
            vy: rand(-0.5, 0.5),
            r: 6,
          });
        }
        b.cooldown = shootRate;
      }

      // Power-ups more frequent in boss
      G.starTimer -= 1;
      if (G.starTimer <= 0) {
        G.stars.push({ x: W + 40, y: rand(40, H - 40), r: 7, vx: -G.speed * 0.9 });
        G.starTimer = 180 + rand(-40, 20);
      }
      G.ringTimer -= 1;
      if (G.ringTimer <= 0) {
        G.rings.push({ x: W + 40, y: rand(60, H - 60), r: 12, vx: -G.speed * 0.9 });
        G.ringTimer = 260 + rand(-30, 30);
      }
    }

    // Move entities
    for (const p of G.pipes) p.x -= G.speed;
    for (const s of G.stars) s.x += s.vx;
    for (const r of G.rings) r.x += r.vx;
    for (const bl of G.bullets) { bl.x += bl.vx; bl.y += bl.vy; }

    // Remove off-screen
    G.pipes = G.pipes.filter((p) => p.x + p.w > -50);
    G.stars = G.stars.filter((s) => s.x > -30);
    G.rings = G.rings.filter((r) => r.x > -30);
    G.bullets = G.bullets.filter((b) => b.x > -20 && b.y > -20 && b.y < H + 20);

    // Collisions
    // Pipes
    for (let i = 0; i < G.pipes.length; i++) {
      const p = G.pipes[i];
      const hit = circleRect(G.bird.x, G.bird.y, G.bird.r - 2, p.x, p.y, p.w, p.h);
      if (hit) {
        damageOrLifeLoss();
        break;
      }
      // score when passing the pair
      if (!p.passed && p.x + p.w < G.bird.x && p.h > 10) {
        p.passed = true;
        // only count top pipes to avoid double counting
        if (p.y === 0) {
          setState((s) => {
            const score = s.score + 1;
            onHudUpdate({ score });
            return { ...s, score };
          });
          // level goal check
          if (!G.boss && G.levelGoal > 0) {
            G.levelGoal -= 1;
            if (G.levelGoal <= 0) nextLevel();
          }
        }
      }
    }

    // Stars (power-ups)
    for (let i = G.stars.length - 1; i >= 0; i--) {
      const s = G.stars[i];
      if (circleCircle(G.bird.x, G.bird.y, G.bird.r, s.x, s.y, s.r)) {
        // collect -> fire projectile at boss if exists, else +score
        G.stars.splice(i, 1);
        popParticles(G, s.x, s.y, '#38bdf8');
        if (G.boss) {
          // instant hit
          G.boss.hp -= 1;
          if (G.boss.hp <= 0) nextLevel();
        } else {
          setState((s2) => {
            const score = s2.score + 2;
            onHudUpdate({ score });
            return { ...s2, score };
          });
        }
      }
    }

    // Rings (shield)
    for (let i = G.rings.length - 1; i >= 0; i--) {
      const r = G.rings[i];
      if (circleCircle(G.bird.x, G.bird.y, G.bird.r, r.x, r.y, r.r)) {
        G.rings.splice(i, 1);
        G.bird.shield = 1; // blocks one hit
        popParticles(G, r.x, r.y, '#22c55e');
      }
    }

    // Boss collisions
    if (G.boss) {
      // Hit by boss body
      if (rectCircle(G.boss.x, G.boss.y, G.boss.w, G.boss.h, G.bird.x, G.bird.y, G.bird.r)) {
        damageOrLifeLoss();
      }
      // Bullets
      for (let i = G.bullets.length - 1; i >= 0; i--) {
        const b = G.bullets[i];
        if (circleCircle(G.bird.x, G.bird.y, G.bird.r, b.x, b.y, b.r)) {
          G.bullets.splice(i, 1);
          damageOrLifeLoss();
        }
      }
    }

    // Particles update
    for (let i = G.particles.length - 1; i >= 0; i--) {
      const p = G.particles[i];
      p.x += p.vx; p.y += p.vy; p.life -= 1; p.vy += 0.05;
      if (p.life <= 0) G.particles.splice(i, 1);
    }

    function damageOrLifeLoss() {
      if (state.gameOver || state.victory) return;
      if (G.bird.shield > 0) {
        G.bird.shield = 0;
        popParticles(G, G.bird.x, G.bird.y, '#94a3b8');
        // brief knockback
        G.bird.vy = -4;
      } else {
        setState((s) => {
          const lives = s.lives - 1;
          const gameOver = lives <= 0;
          onHudUpdate({ lives, gameOver });
          if (gameOver) return { ...s, lives, gameOver };
          return { ...s, lives };
        });
        // small grace jump
        G.bird.vy = -5;
      }
    }

    function nextLevel() {
      setState((s) => {
        const level = s.level + 1;
        if (level > LEVELS) {
          onHudUpdate({ victory: true });
          return { ...s, victory: true };
        }
        onHudUpdate({ level });
        return { ...s, level };
      });
      const nextLevelIndex = state.level + 1;
      if (nextLevelIndex > LEVELS) {
        setState((s) => ({ ...s, victory: true }));
        return;
      }
      const snapshot = { ...state };
      setTimeout(() => {
        gameRef.current = resetLevelState(nextLevelIndex);
      }, 0);
    }
  }

  function draw() {
    const G = gameRef.current;
    if (!G) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const W = canvas.width / (window.devicePixelRatio || 1);
    const H = canvas.height / (window.devicePixelRatio || 1);

    // Clear
    ctx.clearRect(0, 0, W, H);

    // Background
    const grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, '#e0f2fe');
    grd.addColorStop(1, '#ffffff');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    // Subtle mountains
    ctx.fillStyle = '#bae6fd';
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 20) {
      const y = H - 40 - Math.sin((G.t * 0.02 + x * 0.02)) * 4;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();

    // Pipes
    for (const p of G.pipes) {
      ctx.fillStyle = '#10b981';
      roundRect(ctx, p.x, p.y, p.w, p.h, 8);
      ctx.fill();
      // cap
      ctx.fillStyle = '#059669';
      ctx.fillRect(p.x - 2, p.y + (p.h > 10 ? p.h - 8 : 0), p.w + 4, 10);
    }

    // Power-ups
    for (const s of G.stars) {
      drawStar(ctx, s.x, s.y, 5, s.r, s.r * 0.5, '#38bdf8');
    }
    for (const r of G.rings) {
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Boss
    if (G.boss) {
      const b = G.boss;
      // body
      ctx.fillStyle = '#f59e0b';
      roundRect(ctx, b.x, b.y, b.w, b.h, 12);
      ctx.fill();
      // eyes
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(b.x + b.w * 0.3, b.y + b.h * 0.4, 5, 0, Math.PI * 2);
      ctx.arc(b.x + b.w * 0.7, b.y + b.h * 0.4, 5, 0, Math.PI * 2);
      ctx.fill();
      // HP bar
      const maxHp = state.level === 10 ? 12 : state.level >= 9 ? 9 : 6;
      const w = 80;
      const ratio = clamp(b.hp / maxHp, 0, 1);
      ctx.fillStyle = '#e2e8f0';
      roundRect(ctx, b.x + b.w / 2 - w / 2, b.y - 12, w, 6, 3); ctx.fill();
      ctx.fillStyle = '#ef4444';
      roundRect(ctx, b.x + b.w / 2 - w / 2, b.y - 12, w * ratio, 6, 3); ctx.fill();

      // bullets
      ctx.fillStyle = '#f97316';
      for (const bl of G.bullets) {
        ctx.beginPath();
        ctx.arc(bl.x, bl.y, bl.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Bird
    const bird = G.bird;
    const ang = clamp(bird.vy / 10, -0.6, 0.6);
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(ang);
    ctx.fillStyle = '#0ea5e9';
    ctx.beginPath();
    ctx.arc(0, 0, bird.r, 0, Math.PI * 2);
    ctx.fill();
    // wing
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.ellipse(-2, 2, 10, 6, -0.7, 0, Math.PI * 2);
    ctx.fill();
    // beak
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(bird.r, -2);
    ctx.lineTo(bird.r + 8, 0);
    ctx.lineTo(bird.r, 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Shield indicator
    if (bird.shield > 0) {
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bird.x, bird.y, bird.r + 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Particles
    for (const p of G.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = clamp(p.life / 30, 0, 1);
      ctx.fillRect(p.x, p.y, 2, 2);
      ctx.globalAlpha = 1;
    }

    // Overlay texts
    ctx.fillStyle = '#0f172a';
    ctx.font = '600 14px Inter, system-ui, sans-serif';
    ctx.fillText(`Level ${state.level}${BOSS_LEVELS.has(state.level) ? ' — Boss' : ''}`, 12, 20);

    if (state.paused) banner(ctx, W, H, 'Paused — Press P to resume');
    if (state.gameOver) banner(ctx, W, H, 'Game Over — Press R to restart');
    if (state.victory) banner(ctx, W, H, 'Victory! You beat all 10 levels — Press R to replay');
  }

  function banner(ctx, W, H, text) {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillRect(W / 2 - 170, H / 2 - 24, 340, 48);
    ctx.strokeStyle = '#cbd5e1';
    ctx.strokeRect(W / 2 - 170, H / 2 - 24, 340, 48);
    ctx.fillStyle = '#0f172a';
    ctx.font = '700 14px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, W / 2, H / 2 + 5);
    ctx.textAlign = 'left';
  }

  // Helpers
  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  }

  function circleRect(cx, cy, cr, rx, ry, rw, rh) {
    const testX = clamp(cx, rx, rx + rw);
    const testY = clamp(cy, ry, ry + rh);
    const dx = cx - testX;
    const dy = cy - testY;
    return dx * dx + dy * dy <= cr * cr;
  }

  function rectCircle(rx, ry, rw, rh, cx, cy, cr) {
    return circleRect(cx, cy, cr, rx, ry, rw, rh);
  }

  function circleCircle(ax, ay, ar, bx, by, br) {
    const dx = ax - bx; const dy = ay - by; const r = ar + br;
    return dx * dx + dy * dy <= r * r;
  }

  function drawStar(ctx, x, y, spikes, outerRadius, innerRadius, fill) {
    let rot = Math.PI / 2 * 3;
    let cx = x, cy = y;
    let step = Math.PI / spikes;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      cx = x + Math.cos(rot) * outerRadius;
      cy = y + Math.sin(rot) * outerRadius;
      ctx.lineTo(cx, cy);
      rot += step;
      cx = x + Math.cos(rot) * innerRadius;
      cy = y + Math.sin(rot) * innerRadius;
      ctx.lineTo(cx, cy);
      rot += step;
    }
    ctx.lineTo(x, y - outerRadius);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.restore();
  }

  function popParticles(G, x, y, color) {
    for (let i = 0; i < 18; i++) {
      G.particles.push({ x, y, vx: rand(-1.5, 1.5), vy: rand(-1.5, 1.5), life: 30 + Math.random() * 10, color });
    }
  }

  return (
    <div className="relative">
      <div className="absolute -top-4 left-0 right-0 z-10 flex justify-center">
        <span className="text-xs text-slate-500 bg-white/70 rounded-full px-3 py-1 border border-slate-200">Collect stars to damage bosses. Rings give a 1-hit shield.</span>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full aspect-[16/9] rounded-xl bg-white"
        style={{ touchAction: 'manipulation' }}
        onClick={() => flap()}
        onTouchStart={() => flap()}
      />
    </div>
  );
}
