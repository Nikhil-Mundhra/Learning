// ==========================================
// Backdrop generation, artwork loading and image caching
// ==========================================

function buildBackdrop(worldW = FIELD.w) {
  randomSeed(1337 + levelIndex);
  noiseSeed(1337 + levelIndex);
  const span = worldW;
  bgBands = [];
  bgMotes = [];
  bgHorns = [];
  bgEmbers = [];

  const bands = [
    {
      depth: 0.08, base: 402, amp: 68, col: C.ridgeFar, smooth: false,
      step: 30, rim: 0.22, ridge: 1.75, waves: [[1.3, 1], [3.1, 0.44], [6.7, 0.2]]
    },
    {
      depth: 0.17, base: 434, amp: 48, col: C.ridgeMid, smooth: true,
      step: 26, rim: 0.34, ridge: 1.1, waves: [[1.0, 1], [2.6, 0.4], [5.1, 0.17]]
    },
    {
      depth: 0.29, base: 460, amp: 30, col: C.ridgeNear, smooth: true,
      step: 22, rim: 0.46, ridge: 1, waves: [[0.8, 1], [2.1, 0.36]]
    }
  ];

  for (const b of bands) {
    const pts = [];
    const wave = 230 + random(150);
    const freqs = b.waves.map(w => w[0] * (0.8 + random(0.42)));
    const amps = b.waves.map(w => w[1]);
    const phases = b.waves.map(() => random(TWO_PI));
    const norm = amps.reduce((acc, v) => acc + v, 0);
    const x0 = FIELD.x - 120;
    const x1 = FIELD.x + span + 120;

    for (let x = x0; x <= x1; x += b.step) {
      let h = 0;
      for (let i = 0; i < freqs.length; i++) {
        h += sin((x / wave) * TWO_PI * freqs[i] + phases[i]) * amps[i];
      }
      const t = pow(0.5 + 0.5 * (h / norm), b.ridge);
      pts.push({ x, y: b.base - b.amp * t });
    }
    bgBands.push({ ...b, pts });
  }

  for (let i = 0; i < 74; i++) {
    bgMotes.push({
      x: random(FIELD.x, FIELD.x + span),
      y: random(FIELD.y + 30, FIELD.y + FIELD.h),
      s: random(1, 3.2),
      depth: random(0.1, 0.62),
      ph: random(TWO_PI),
      sp: random(0.18, 0.75)
    });
  }

  for (let i = 0; i < 8; i++) {
    bgEmbers.push({
      x: random(FIELD.x + 40, FIELD.x + span - 40),
      y: random(FIELD.y + 60, FIELD.y + FIELD.h - 40),
      s: random(2.2, 4.4),
      depth: random(0.2, 0.5),
      ph: random(TWO_PI),
      sp: random(0.12, 0.34)
    });
  }

  const hornCount = max(13, round(span / 66));
  for (let i = 0; i < hornCount; i++) {
    const depth = 0.16 + random(0, 0.3);
    bgHorns.push({
      x: FIELD.x + 34 + i * 66 + random(-18, 18),
      y: 424 + depth * 90 + random(-5, 5),
      h: 26 + depth * 80,
      w: random(17, 31),
      curve: random(0.35, 0.8) * (i % 2 ? 1 : -1),
      depth,
      col: depth < 0.26 ? C.ridgeFar : depth < 0.36 ? C.ridgeMid : C.ridgeNear
    });
  }
}

function roundPath(x, y, w, h, r) {
  const c = drawingContext;
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function loadArtwork() {
  gearIcon = new Image();
  gearIcon.onload = () => redraw();
  gearIcon.onerror = () => {
    console.error('Unable to load gear.svg');
  };
  gearIcon.src = 'assets/images/gear.svg';

  loadImage('assets/images/hell.png', img => {
    bgArt = img;
    bgCache = null;
  }, () => {
    console.warn('[larp-devil] hell.png not found, using procedural backdrop');
  });

  loadImage('assets/images/nature.png', img => {
    endArt = img;
    endCache = null;
  }, () => {
    console.warn('[larp-devil] nature.png not found, using procedural ending');
  });
}

function ensureCache(img, cache, w, h = 0) {
  const scale = Math.max(w / img.width, h / img.height);
  const targetW = Math.ceil(img.width * scale);
  const targetH = Math.ceil(img.height * scale);
  if (cache && cache.img === img && cache.w >= targetW && cache.h >= targetH) return cache;
  const cv = document.createElement('canvas');
  cv.width = targetW;
  cv.height = targetH;
  const g = cv.getContext('2d');
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = 'high';
  g.drawImage(img.elt || img.canvas, 0, 0, cv.width, cv.height);
  return { img, canvas: cv, w: cv.width, h: cv.height };
}

function blitArt(ctx, img, cache, fx, fy, fw, fh, driftX, focus, dim) {
  const c = ensureCache(img, cache, fw * 1.3 + 2, fh);
  const dw = c.w;
  const dh = c.h;

  let dx = fx - (dw - fw) / 2 - driftX;
  const lo = fx + fw - dw;
  const hi = fx;
  dx = dx < lo ? lo : dx > hi ? hi : dx;

  const dy = fy + (fh - dh) * focus;

  ctx.drawImage(c.canvas, dx, dy, dw, dh);

  if (dim > 0) {
    ctx.fillStyle = `rgba(30, 24, 34, ${dim})`;
    ctx.fillRect(fx, fy, fw, fh);
  }
  return c;
}

function ridgePath(ctx, pts, px, floorY, smooth) {
  const n = pts.length;
  ctx.beginPath();
  ctx.moveTo(pts[0].x + px, floorY === null ? pts[0].y : floorY);
  if (floorY !== null) ctx.lineTo(pts[0].x + px, pts[0].y);

  if (smooth) {
    for (let i = 1; i < n - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2 + px;
      const my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x + px, pts[i].y, mx, my);
    }
  } else {
    for (let i = 1; i < n; i++) ctx.lineTo(pts[i].x + px, pts[i].y);
  }

  ctx.lineTo(pts[n - 1].x + px, pts[n - 1].y);
  if (floorY !== null) {
    ctx.lineTo(pts[n - 1].x + px, floorY);
    ctx.closePath();
  }
}

function drawBackdrop() {
  const ctx = drawingContext;
  const worldW = max(level && level.worldW ? level.worldW : 0, FIELD.w);
  const fx = FIELD.x + camX, fy = FIELD.y, fw = FIELD.w, fh = FIELD.h;
  const drift = -(controlled().x - 76);

  ctx.save();
  ctx.beginPath();
  ctx.rect(fx, fy, fw, fh);
  ctx.clip();

  const art = themeIndex === 1 ? bgArt : themeIndex === 2 ? endArt : null;
  if (art) {
    bgCache = blitArt(
      ctx,
      art,
      bgCache,
      fx,
      fy,
      fw,
      fh,
      -drift * 0.22,
      themeIndex === 2 ? 0.54 : 0.5,
      themeIndex === 2 ? 0.08 : 0.3
    );
  } else {
    const sky = ctx.createLinearGradient(0, fy, 0, fy + fh);
    sky.addColorStop(0, C.skyTop);
    sky.addColorStop(0.58, C.skyLow);
    sky.addColorStop(1, C.halo);
    ctx.fillStyle = sky;
    ctx.fillRect(FIELD.x - 60, fy, worldW + 120, fh);

    const sunX = FIELD.x + worldW * 0.74;
    const sunY = fy + fh * 0.3;
    const sun = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, 168);
    sun.addColorStop(0, 'rgba(255, 233, 184, 0.85)');
    sun.addColorStop(0.45, 'rgba(250, 214, 158, 0.30)');
    sun.addColorStop(1, 'rgba(250, 214, 158, 0)');
    ctx.fillStyle = sun;
    ctx.fillRect(fx, fy, fw, fh);

    const VEIL = [0.36, 0.19, 0.07];
    for (let i = 0; i < bgBands.length; i++) {
      const b = bgBands[i];
      const px = drift * b.depth;

      ridgePath(ctx, b.pts, px, fy + fh, b.smooth);
      ctx.fillStyle = b.col;
      ctx.fill();

      ridgePath(ctx, b.pts, px, null, b.smooth);
      ctx.strokeStyle = `rgba(255, 244, 218, ${b.rim})`;
      ctx.lineWidth = b.smooth ? 1.8 : 1.2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.fillStyle = `rgba(244, 234, 213, ${VEIL[i]})`;
      ctx.fillRect(fx, fy, fw, fh);
    }

    for (const h of bgHorns) {
      const px = drift * h.depth;
      ctx.beginPath();
      ctx.moveTo(h.x + px - h.w / 2, h.y);
      ctx.quadraticCurveTo(
        h.x + px + h.curve * h.w * 1.5,
        h.y - h.h * 0.72,
        h.x + px + h.curve * h.w * 0.55,
        h.y - h.h
      );
      ctx.quadraticCurveTo(
        h.x + px + h.w * 0.15,
        h.y - h.h * 0.5,
        h.x + px + h.w / 2,
        h.y
      );
      ctx.closePath();
      ctx.fillStyle = h.col;
      ctx.fill();
    }
  }


  const t = gameTime;
  for (const e of themeIndex !== 2 ? bgEmbers : []) {
    const px = drift * e.depth;
    const rise = (t * e.sp * 11) % (fh + 60);
    const y = fy + fh - rise + 30;
    const x = e.x + px + sin(t * 0.45 + e.ph) * 11;
    const fade = constrain(rise / 90, 0, 1) * constrain((fh + 60 - rise) / 90, 0, 1);
    fill(255, 206, 130, 34 * fade);
    circle(x, y, e.s * 4.2);
    fill(255, 232, 186, 170 * fade);
    circle(x, y, e.s);
  }

  for (const m of themeIndex !== 2 ? bgMotes : []) {
    const px = drift * m.depth;
    const rise = (t * m.sp * 13) % (fh + 40);
    const y = fy + fh - rise + 20;
    const x = m.x + px + sin(t * 0.7 + m.ph) * 7;
    const fade = constrain(rise / 70, 0, 1) * constrain((fh + 40 - rise) / 70, 0, 1);
    fill(255, 224, 170, min(200, 165 * fade * m.depth * 1.6));
    circle(x, y, m.s);
  }

  const vig = ctx.createRadialGradient(
    fx + fw / 2, fy + fh * 0.52, fh * 0.28,
    fx + fw / 2, fy + fh * 0.52, fh * 1.02
  );
  vig.addColorStop(0, 'rgba(37, 39, 44, 0)');
  vig.addColorStop(1, 'rgba(37, 39, 44, 0.30)');
  ctx.fillStyle = vig;
  ctx.fillRect(fx, fy, fw, fh);
  ctx.restore();
}

