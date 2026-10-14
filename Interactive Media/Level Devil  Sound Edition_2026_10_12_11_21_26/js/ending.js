// ==========================================
// Ending scene construction and rendering
// ==========================================

function buildEndingScene() {
  randomSeed(90210);
  endHills = [];
  endTrees = [];
  endPollen = [];

  const bands = [
    { base: 450, amp: 40, col: C.hillFar, smooth: true, step: 28, waves: [[1.1, 1], [2.7, 0.4]] },
    { base: 482, amp: 28, col: C.hillMid, smooth: true, step: 24, waves: [[0.9, 1], [2.2, 0.36]] },
    { base: FLOOR, amp: 16, col: C.hillNear, smooth: true, step: 20, waves: [[0.7, 1]] }
  ];

  for (const b of bands) {
    const pts = [];
    const wave = 230 + random(150);
    const freqs = b.waves.map(w => w[0] * (0.8 + random(0.42)));
    const amps = b.waves.map(w => w[1]);
    const phases = b.waves.map(() => random(TWO_PI));
    const norm = amps.reduce((acc, v) => acc + v, 0);
    for (let x = FIELD.x - 120; x <= FIELD.x + FIELD.w + 120; x += b.step) {
      let h = 0;
      for (let i = 0; i < freqs.length; i++) {
        h += sin((x / wave) * TWO_PI * freqs[i] + phases[i]) * amps[i];
      }
      pts.push({ x, y: b.base - b.amp * (0.5 + 0.5 * (h / norm)) });
    }
    endHills.push({ ...b, pts });
  }

  for (let i = 0; i < 11; i++) {
    const far = random() < 0.45;
    endTrees.push({
      x: FIELD.x + 40 + i * 78 + random(-20, 20),
      y: far ? 468 + random(-10, 14) : FLOOR - 4 + random(-6, 8),
      h: far ? random(30, 52) : random(46, 82),
      w: far ? random(11, 18) : random(17, 27),
      trunk: far ? C.bark : '#5a4632',
      leaf: far ? C.hillMid : random() < 0.5 ? C.leaf : C.leafLight,
      lobes: far ? 3 : 4,
      ph: random(TWO_PI)
    });
  }

  for (let i = 0; i < 46; i++) {
    endPollen.push({
      x: random(FIELD.x, FIELD.x + FIELD.w),
      y: random(FIELD.y + 20, FIELD.y + FIELD.h),
      s: random(1.2, 3),
      ph: random(TWO_PI),
      sp: random(0.1, 0.34)
    });
  }
}

function drawEndingScene() {
  const ctx = drawingContext;
  const fx = FIELD.x, fy = FIELD.y, fw = FIELD.w, fh = FIELD.h;

  ctx.save();
  ctx.beginPath();
  ctx.rect(fx, fy, fw, fh);
  ctx.clip();

  if (!endArt) {
  const sky = ctx.createLinearGradient(0, fy, 0, fy + fh);
  sky.addColorStop(0, C.mint);
  sky.addColorStop(0.55, C.skyGreen);
  sky.addColorStop(1, '#dcecc6');
  ctx.fillStyle = sky;
  ctx.fillRect(fx, fy, fw, fh);

  const sunX = fx + fw * 0.28;
  const sunY = fy + fh * 0.26;
  const glow = ctx.createRadialGradient(sunX, sunY, 6, sunX, sunY, 210);
  glow.addColorStop(0, 'rgba(255, 252, 224, 0.92)');
  glow.addColorStop(0.42, 'rgba(240, 248, 206, 0.34)');
  glow.addColorStop(1, 'rgba(240, 248, 206, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(fx, fy, fw, fh);

  ctx.beginPath();
  ctx.arc(sunX, sunY, 34, 0, TWO_PI);
  ctx.fillStyle = 'rgba(255, 253, 236, 0.85)';
  ctx.fill();

  for (const b of endHills) {
    ridgePath(ctx, b.pts, 0, fy + fh, b.smooth);
    ctx.fillStyle = b.col;
    ctx.fill();
  }

  for (const t of endTrees) {
    const sway = sin(gameTime * 0.6 + t.ph) * 1.8;
    ctx.strokeStyle = t.trunk;
    ctx.lineWidth = Math.max(2, t.w * 0.17);
    ctx.beginPath();
    ctx.moveTo(t.x, t.y);
    ctx.lineTo(t.x + sway, t.y - t.h * 0.52);
    ctx.stroke();

    for (let i = 0; i < t.lobes; i++) {
      const a = -Math.PI / 2 + (i - (t.lobes - 1) / 2) * 0.62;
      const lx = t.x + sway + cos(a) * t.h * 0.2;
      const ly = t.y - t.h * 0.58 + sin(a) * t.h * 0.14;
      ctx.beginPath();
      ctx.ellipse(lx, ly, t.w * (0.62 - i * 0.05), t.h * 0.2, 0, 0, TWO_PI);
      ctx.fillStyle = i % 2 ? t.leaf : C.leafLight;
      ctx.fill();
    }
  }

  noStroke();
  fill(C.grass);
  rect(fx, FLOOR, fw, fh - (FLOOR - fy));
  fill(63, 122, 69, 70);
  rect(fx, FLOOR, fw, 3);

  for (const p of endPollen) {
    const rise = (gameTime * p.sp * 9) % (fh + 50);
    const y = fy + fh - rise + 25;
    const x = p.x + sin(gameTime * 0.5 + p.ph) * 13;
    const fade = constrain(rise / 80, 0, 1) * constrain((fh + 50 - rise) / 80, 0, 1);
    fill(255, 255, 236, 150 * fade);
    circle(x, y, p.s);
  }

  const vig = ctx.createRadialGradient(
    fx + fw / 2, fy + fh * 0.5, fh * 0.32,
    fx + fw / 2, fy + fh * 0.5, fh * 1.05
  );
  vig.addColorStop(0, 'rgba(30, 62, 34, 0)');
  vig.addColorStop(1, 'rgba(30, 62, 34, 0.26)');
  ctx.fillStyle = vig;
  ctx.fillRect(fx, fy, fw, fh);
  } else {
    endCache = blitArt(ctx, endArt, endCache, fx, fy, fw, fh, 0, 0.54, 0.08);
  }
  ctx.restore();
}

function drawEnding() {
  const d = level.door;
  background(C.ink);

  drawEndingScene();

  noStroke();
  fill(255, 251, 239, 220);
  rect(12, 12, 244, 48, 8);
  fill(C.grass);
  textSize(17);
  textStyle(BOLD);
  textAlign(LEFT, CENTER);
  text('LARP DEVIL', 23, 28);
  fill(C.muted);
  textStyle(NORMAL);
  textSize(11);
  text('ALL TWELVE LEVELS CLEARED', 23, 48);
  const deathsLabel = `DEATHS ${deaths}`;
  const deathsW = textWidth(deathsLabel) + 28;
  fill(255, 251, 239, 220);
  rect(FIELD.w - deathsW - 12, 12, deathsW, 38, 8);
  fill(C.grass);
  textAlign(CENTER, CENTER);
  text(deathsLabel, FIELD.w - deathsW / 2 - 12, 31);
  textAlign(LEFT, CENTER);

  push();
  translate(d.x + d.w / 2, FLOOR);
  fill(C.grass);
  rect(-d.w / 2, -d.h, d.w, d.h, 3);
  fill('#2c5c31');
  rect(-d.w / 2 + 5, -d.h + 6, d.w - 10, d.h - 6, 2);
  fill(C.amber);
  circle(d.w / 2 - 8, -d.h + 27, 4);
  pop();

  if (endT < 1.5) drawPlayer();

  const reveal = constrain((endT - 0.7) / 0.7, 0, 1);

  noStroke();
  fill(255, 255, 255, 190 * reveal);
  rect(FIELD.x + 150, FIELD.y + 70, FIELD.w - 300, 104, 10);
  drawingContext.fill();

  fill(31, 74, 36, 255 * reveal);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(38);
  text('YOU WALKED OUT', FIELD.w / 2, FIELD.y + 104);
  textStyle(NORMAL);
  textSize(13);
  text('The door was a suggestion. You took it anyway.', FIELD.w / 2, FIELD.y + 140);
  textSize(12);
  fill(74, 112, 70, 255 * reveal);
  text(
    `12 LEVELS  \u00b7  ${deaths} DEATH${deaths === 1 ? '' : 'S'}`,
    FIELD.w / 2,
    FIELD.y + 160
  );

  if (endT > 2.1 && floor(endT * 2) % 2 === 0) {
    fill(31, 74, 36);
    textStyle(BOLD);
    textSize(14);
    text('PRESS ENTER TO PLAY AGAIN', FIELD.w / 2, H - 90);
    textStyle(NORMAL);
  }

  buttons = [];
  uiButton(18, H - 52, 128, 34, 'PLAY AGAIN  \u23ce', 'accent', () => {
    state = 'title';
    titleT = 0;
  });

}

