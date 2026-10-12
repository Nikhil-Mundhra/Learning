// ==========================================
// GAME STATE, ENGINE & ARROW KEYS FALLBACK
// ==========================================

let buttons = [];
let levelIndex = 0, level, player, deaths = 0;
let state = 'play', stateTimer = 0, gameTime = 0, lastFrame = 0;
let message = 'Reach the green door. Trust nothing.';
let messageUntil = 0, particles = [], shake = 0;
let lastJump = false, jumpQueuedUntil = 0;
let walkCycle = 0, stepTimer = 0.5, landImpulse = 0, impactSpeed = 0;
let doorImpact = 0;
let winPhase = 0, winT = 0, winOpen = 0, winClose = 0, playerSwallow = 0;
let skinIndex = 0, titleT = 0;
let stamina = STAM_MAX, stamDelay = 0, exhausted = false, sprinting = false;
let camX = 0;

function skin() {
  return SKINS[skinIndex];
}

function updateStamina(dt, moving, want) {
  if (want && moving && !exhausted) {
    sprinting = true;
    stamina -= STAM_DRAIN * dt;
    stamDelay = STAM_DELAY;
    if (stamina <= 0) {
      stamina = 0;
      exhausted = true;
      sprinting = false;
    }
  } else {
    sprinting = false;
    stamDelay = max(0, stamDelay - dt);
    if (stamDelay <= 0) stamina = min(STAM_MAX, stamina + STAM_REGEN * dt);
    if (exhausted && stamina >= STAM_RESUME) exhausted = false;
  }
}

function updateCamera() {
  const body = controlled();
  const worldW = level.worldW || FIELD.w;
  const maxX = max(0, worldW - FIELD.w);
  camX = constrain(body.x + body.w / 2 - FIELD.w / 2, 0, maxX);
}

const WIN_APPROACH = 0.4;
const WIN_ENTER = 0.45;
const WIN_CLOSE = 0.5;
const WIN_HOLD = 0.3;
let bgBands = [], bgMotes = [], bgHorns = [], bgEmbers = [];

function setup() {
  const s = min(1, windowWidth / W, windowHeight / H);
  createCanvas(floor(W * s), floor(H * s));
  textFont('monospace');
  buildBackdrop();

  try {
    const saved = Number(localStorage.getItem('larpdevil.skin'));
    if (saved >= 0 && saved < SKINS.length) skinIndex = saved;
  } catch (e) { /* storage unavailable */ }

  resetLevel();
  state = 'title';
}

function buildBackdrop(worldW = FIELD.w) {
  randomSeed(1337 + levelIndex);
  noiseSeed(1337 + levelIndex);
  const span = worldW;
  bgBands = [];
  bgMotes = [];
  bgHorns = [];
  bgEmbers = [];

  const bands = [
    { depth: 0.08, base: 396, amp: 62, step: 104, col: C.ridgeFar },
    { depth: 0.17, base: 428, amp: 44, step: 78, col: C.ridgeMid },
    { depth: 0.29, base: 456, amp: 28, step: 62, col: C.ridgeNear }
  ];

  for (const b of bands) {
    const pts = [];
    let x = FIELD.x - 60;
    while (x < FIELD.x + span + 60) {
      pts.push({
        x,
        y: b.base - random(b.amp) - (random() < 0.24 ? b.amp * 0.85 : 0)
      });
      x += b.step * random(0.72, 1.34);
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

function windowResized() {
  const s = min(1, windowWidth / W, windowHeight / H);
  resizeCanvas(floor(W * s), floor(H * s));
}

function resetLevel() {
  level = buildLevel(levelIndex);
  buildBackdrop(level.worldW);
  camX = 0;
  stamina = STAM_MAX;
  stamDelay = 0;
  exhausted = false;
  sprinting = false;
  player = {
    x: 76, y: FLOOR - 32, w: 24, h: 32,
    vx: 0, vy: 0, grounded: true, coyote: 0, face: 1
  };
  level.traps.forEach(t => {
    t.active = false;
    t.timer = 0;
    t.value = 0;
  });
  level.platforms.forEach(p => {
    p.timer = 0;
    p.gone = false;
  });
  state = 'play';
  stateTimer = 0;
  audioX.until = 0;
  jumpQueuedUntil = 0;
  lastJump = false;
  walkCycle = 0;
  stepTimer = 0.5;
  landImpulse = 0;
  doorImpact = 0;
  winPhase = 0;
  winT = 0;
  winOpen = 0;
  winClose = 0;
  playerSwallow = 0;
  level.door.vy = 0;
  level.door.grounded = true;
  level.door.coyote = 0;
  level.door.moving = 0;
  message = level.hint;
  messageUntil = millis() + 3300;
}

function draw() {
  const now = millis();
  const dt = min((now - (lastFrame || now)) / 1000, 0.04);
  lastFrame = now;

  processAudio(now);

  if (state === 'title') {
    titleT += dt;
    updateParticles(dt);
    drawTitle();
    return;
  }

  if (state === 'play') {
    updateGame(dt, now);
  } else if (state === 'won') {
    updateWinAnim(dt);
  } else if (state === 'dead') {
    stateTimer -= dt;
    if (stateTimer <= 0) resetLevel();
  }

  updateParticles(dt);
  push();
  scale(width / W, height / H);
  drawScene();
  pop();
}

function controlled() {
  return level.doorMode ? level.door : player;
}

function updateGame(dt, now) {
  gameTime += dt;
  const p = player;

  // Moving platforms
  for (const q of level.platforms) {
    if (q.kind !== 'moving') continue;

    const oldX = q.x;
    q.x = 285 + (1 - cos(gameTime * 1.05)) * 138;

    if (
      p.grounded &&
      abs(p.y + p.h - q.y) < 3 &&
      p.x + p.w > oldX &&
      p.x < oldX + q.w
    ) {
      p.x += q.x - oldX;
    }
  }

  const body = controlled();
  const reversed = level.traps.some(t =>
    t.type === 'reverse' &&
    t.active &&
    body.x + body.w > t.x &&
    body.x < t.x + t.w
  );

  // ------------------------------------------
  // INPUT SYSTEM: ARROW KEYS & WASD FALLBACK
  // ------------------------------------------
  const rightPressed = keyIsDown(RIGHT_ARROW) || keyIsDown(68); // 68: 'D'
  const leftPressed = keyIsDown(LEFT_ARROW) || keyIsDown(65);   // 65: 'A'
  const downPressed = keyIsDown(DOWN_ARROW) || keyIsDown(83);   // 83: 'S'
  const upPressed = keyIsDown(UP_ARROW) || keyIsDown(87) || keyIsDown(32); // 87: 'W', 32: Space
  const shiftDown =
    keyIsDown(SHIFT) || keyIsDown(16) || keyIsDown('ShiftLeft') || keyIsDown('ShiftRight');

  // Down Arrow halts active audio movement timers immediately (like voice 'DOWN')
  if (downPressed && audioX.until > now) {
    audioX.until = 0;
  }

  let move = 0;
  if (rightPressed || leftPressed) {
    // Arrow keys override voice momentum
    move = (rightPressed ? 1 : 0) - (leftPressed ? 1 : 0);
  } else if (now < audioX.until) {
    // Fall back to voice movement buffer if no arrow keys are held
    move = audioX.value;
  }

  if (reversed) move *= -1;

  // Jump Input: Arrow Up, W, or Space buffers a jump
  if (upPressed && !lastJump) {
    jumpQueuedUntil = now + 155;
  }
  lastJump = upPressed;

  updateStamina(dt, move !== 0, shiftDown);

  if (level.doorMode) {
    const d = level.door;
    const spd = sprinting ? DOOR_SPEED * SPRINT_MULT : DOOR_SPEED;
    d.x = constrain(d.x + move * spd * dt, FIELD.x + 4, level.worldW - 4 - d.w);
    if (move !== 0) d.moving = 1;
    else d.moving = max(0, d.moving - dt * 4);

    if (jumpQueuedUntil > now && (d.grounded || d.coyote > 0)) {
      d.vy = JUMP_V;
      d.grounded = false;
      d.coyote = 0;
      jumpQueuedUntil = 0;
      dustPuff(d.x + d.w / 2, d.y + d.h, 5, 46, 4, C.amber);
    }

    const wasDown = d.grounded;
    impactSpeed = 0;
    d.vy = min(d.vy + GRAVITY * dt, MAX_FALL);
    d.y += d.vy * dt;
    d.grounded = false;

    for (const q of level.platforms) {
      if (!isSolid(q) || d.x + d.w <= q.x || d.x >= q.x + q.w) continue;
      if (d.vy >= 0 && d.y + d.h >= q.y && d.y + d.h <= q.y + 12) {
        impactSpeed = d.vy;
        d.y = q.y - d.h;
        d.vy = 0;
        d.grounded = true;
        break;
      }
    }

    if (d.grounded) {
      d.coyote = 0.09;
      if (!wasDown) {
        doorImpact = min(1, 0.3 + impactSpeed / MAX_FALL);
        dustPuff(d.x + d.w / 2, d.y + d.h, 7, 62, 5, C.muted);
      }
    } else {
      d.coyote = wasDown ? 0.09 : max(0, d.coyote - dt);
    }
    doorImpact = max(0, doorImpact - dt * 4.6);

    updateCamera();
    updateTraps();

    if (state === 'play' && overlap(p, d)) win();
    return;
  }

  const spd = sprinting ? RUN_SPEED * SPRINT_MULT : RUN_SPEED;
  const drift = p.grounded && move !== 0
    ? (noise(gameTime * 1.7, levelIndex * 13) - 0.5) * DRIFT_AMOUNT
    : 0;
  p.vx = move * spd + drift;
  if (move !== 0) p.face = move > 0 ? 1 : -1;

  // Jump execution with coyote time
  if (jumpQueuedUntil > now && (p.grounded || p.coyote > 0)) {
    p.vy = JUMP_V;
    p.grounded = false;
    p.coyote = 0;
    jumpQueuedUntil = 0;
    dustPuff(p.x + p.w / 2, p.y + p.h, 5, 46, 4, skin().base);
  }

  // Horizontal movement & collision
  const oldX = p.x;
  const oldY = p.y;
  p.x = constrain(p.x + p.vx * dt, FIELD.x - 1, level.worldW - 4 - p.w);

  for (const q of level.platforms) {
    if (!isSolid(q) || q.y >= FLOOR || !overlap(p, q)) continue;

    if (oldX + p.w <= q.x + 2) {
      p.x = q.x - p.w;
    } else if (oldX >= q.x + q.w - 2) {
      p.x = q.x + q.w;
    }
  }

  // Vertical movement & gravity
  const wasGrounded = p.grounded;
  impactSpeed = 0;
  p.grounded = false;
  p.vy = min(p.vy + GRAVITY * dt, MAX_FALL);
  p.y += p.vy * dt;

  for (const q of level.platforms) {
    if (!isSolid(q) || p.x + p.w <= q.x || p.x >= q.x + q.w) continue;

    if (p.vy >= 0 && oldY + p.h <= q.y + 9 && p.y + p.h >= q.y) {
      impactSpeed = p.vy;
      p.y = q.y - p.h;
      p.vy = 0;
      p.grounded = true;

      if (q.kind === 'crumble' && !q.timer) q.timer = gameTime;
      if (q.kind === 'conveyor') p.x += 85 * dt;
      break;
    }

    if (p.vy < 0 && oldY >= q.y + q.h - 3 && p.y <= q.y + q.h) {
      p.y = q.y + q.h;
      p.vy = 0;
    }
  }

  if (p.grounded) {
    p.coyote = 0.09;
    if (!wasGrounded) {
      landImpulse = min(1, 0.3 + impactSpeed / MAX_FALL);
      dustPuff(p.x + p.w / 2, p.y + p.h, 7, 62, 5, C.muted);
    }
  } else {
    p.coyote = wasGrounded ? 0.09 : max(0, p.coyote - dt);
  }

  const speed = abs(p.vx);
  const running = p.grounded && speed > 12;

  if (running) {
    walkCycle += dt * (5.2 + speed * 0.026);
    stepTimer -= dt * (speed / RUN_SPEED);
    if (stepTimer <= 0) {
      stepTimer = 0.5;
      dustPuff(
        p.x + (p.face > 0 ? p.w : 0),
        p.y + p.h,
        2,
        26,
        3,
        C.muted
      );
    }
  } else {
    stepTimer = 0.5;
  }

  landImpulse = max(0, landImpulse - dt * 4.6);

  // Platform expiration
  for (const q of level.platforms) {
    if (q.kind === 'crumble' && q.timer && gameTime - q.timer > 0.56) {
      q.gone = true;
    }
  }

  updateCamera();
  updateTraps();

  if (p.y > H + 20) die();
  if (state === 'play' && overlap(p, level.door)) win();
}

function isSolid(q) {
  if (q.gone) return false;
  if (q.kind === 'blink') {
    return floor(gameTime * 1.2) % 2 === 0;
  }
  return true;
}

function updateTraps() {
  const victim = controlled();

  for (const t of level.traps) {
    if (!t.active && victim.x + victim.w >= t.trigger) {
      t.active = true;
      t.timer = gameTime - (t.phase || 0);

      if (t.type === 'reverse') {
        showMessage('THE ARROWS HAVE CHANGED THEIR MINDS', 1400);
      }
      if (t.type === 'vanish') {
        showMessage('LOOK DOWN!', 1400);
      }
    }

    const age = gameTime - t.timer;

    if (t.type === 'vanish' && t.active && age > 0.42) {
      const q = level.platforms.find(p => p.kind === 'vanish');
      if (q) q.gone = true;
    }

    if (t.type === 'pop' && t.active) {
      t.value = min(1, max(0, age - 0.24) * 6);
      if (
        t.value > 0.55 &&
        overlap(victim, {
          x: t.x + 3,
          y: t.y - t.h * t.value,
          w: t.w - 6,
          h: t.h * t.value
        })
      ) {
        die();
      }
    }

    if (t.type === 'fall' && t.active) {
      t.value = age < 0.47
        ? 0
        : min(FLOOR - t.h - t.y, (age - 0.47) * 360);

      if (overlap(victim, { ...t, y: t.y + t.value })) {
        die();
      }
    }

    if (t.type === 'saw') {
      const ph = t.phase || 0;
      t.value = sin((gameTime - ph) * 2.2) * 92;
      if (circleRect(t.x + t.value + t.w / 2, t.y + t.h / 2, t.w * 0.43, victim)) {
        die();
      }
    }

    if (t.type === 'laser' && t.active && age > 0.68 && age % 2.05 < 1.08 && overlap(victim, t)) {
      die();
    }

    if (t.type === 'spring' && !level.doorMode && player.vy >= 0 && overlap(player, { x: t.x, y: t.y - 7, w: t.w, h: 16 })) {
      player.y = t.y - player.h;
      player.vy = -550;
      player.grounded = false;
      burst(t.x + t.w / 2, t.y, C.green, 8);
    }

    if (t.type === 'fake' && overlap(player, t)) {
      showMessage('NICE TRY. WRONG DOOR.', 1400);
    }
  }
}

function circleRect(cx, cy, r, q) {
  const x = constrain(cx, q.x, q.x + q.w);
  const y = constrain(cy, q.y, q.y + q.h);
  return (x - cx) ** 2 + (y - cy) ** 2 < r * r;
}

function overlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function die() {
  if (state !== 'play') return;
  const b = controlled();
  state = 'dead';
  stateTimer = 0.7;
  deaths++;
  shake = 8;
  burst(b.x + b.w / 2, b.y + b.h / 2, C.danger, 16);
}

function win() {
  if (state !== 'play') return;
  state = 'won';
  winPhase = 0;
  winT = 0;
  winOpen = 0;
  winClose = 0;
  playerSwallow = 0;
  burst(level.door.x + 14, level.door.y + 20, C.green, 20);
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - pow(-2 * t + 2, 2) / 2;
}

function updateWinAnim(dt) {
  winT += dt;
  const d = level.door;
  const p = player;

  if (winPhase === 0) {
    winOpen = constrain(winT / WIN_APPROACH, 0, 1);
    const dx = d.x + d.w / 2 - p.w / 2 - p.x;

    if (level.doorMode) {
      const doorErr = p.x + p.w / 2 - d.w / 2 - d.x;
      d.x = constrain(
        d.x + doorErr * min(1, dt * 7),
        FIELD.x + 4,
        W - FIELD.x - 4 - d.w
      );
    } else if (abs(dx) > 1.5) {
      const step = min(abs(dx), 300 * dt);
      p.x += dx > 0 ? step : -step;
      p.face = dx > 0 ? 1 : -1;
      p.vx = dx > 0 ? 300 : -300;
      walkCycle += dt * 13;
    } else {
      p.x = d.x + d.w / 2 - p.w / 2;
      p.vx = 0;
    }

    if (winOpen >= 1 && abs(dx) <= 1.5) {
      winPhase = 1;
      winT = 0;
      stepTimer = 0;
    }
    return;
  }

  if (winPhase === 1) {
    playerSwallow = constrain(winT / WIN_ENTER, 0, 1);
    const t = easeInOut(playerSwallow);
    p.y = lerp(p.y, d.y + (d.h - p.h) / 2, t * 0.5);
    p.vx = 0;
    if (playerSwallow >= 1) {
      winPhase = 2;
      winT = 0;
    }
    return;
  }

  if (winPhase === 2) {
    winClose = constrain(winT / WIN_CLOSE, 0, 1);
    if (random() < 0.3) burst(d.x + d.w / 2, d.y + d.h / 2, C.green, 2);
    if (winClose >= 1) {
      winPhase = 3;
      winT = 0;
      shake = max(shake, 4);
      burst(d.x + d.w / 2, d.y + d.h / 2, C.amber, 14);
    }
    return;
  }

  if (winT >= WIN_HOLD) {
    levelIndex = (levelIndex + 1) % 12;
    resetLevel();
  }
}

function burst(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx: random(-115, 115),
      vy: random(-150, -20),
      life: random(0.25, 0.65),
      color,
      s: random(2, 6)
    });
  }
}

function dustPuff(x, y, count, spread, size, color) {
  for (let i = 0; i < count; i++) {
    const side = i % 2 ? 1 : -1;
    particles.push({
      x: x + side * random(size * 0.5, size * 2),
      y: y - random(0, 4),
      vx: side * spread * random(0.55, 1),
      vy: -random(10, 55),
      life: random(0.22, 0.42),
      color,
      s: random(size * 0.55, size)
    });
  }
}

function updateParticles(dt) {
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 330 * dt;
    p.life -= dt;
  }
  particles = particles.filter(p => p.life > 0);
  shake = max(0, shake - dt * 25);
}

function showMessage(s, duration) {
  message = s;
  messageUntil = millis() + duration;
}

function drawScene() {
  background(C.paper);
  noStroke();

  fill(C.ink);
  rect(0, 0, W, 76);

  fill(C.amber);
  textSize(22);
  textStyle(BOLD);
  textAlign(LEFT, CENTER);
  text('LARP DEVIL', 40, 29);

  fill(C.white);
  textStyle(NORMAL);
  textSize(12);
  text(`LEVEL ${String(levelIndex + 1).padStart(2, '0')} / 12     ${level.title}`, 42, 57);

  textAlign(RIGHT);
  text(`DEATHS ${deaths}`, 920, 32);
  textAlign(LEFT);

  fill(C.sky);
  rect(0, 76, W, 426);

  push();
  translate(
    -camX + (shake ? random(-shake, shake) : 0),
    shake ? random(-shake, shake) : 0
  );
  drawWorld();
  pop();

  drawControls();

  if (state === 'dead' || (state === 'won' && winPhase === 3 && winT >= WIN_HOLD * 0.45)) {
    fill(37, 39, 44, 185);
    rect(0, 137, W, 357);

    fill(C.white);
    textStyle(BOLD);
    textSize(34);
    textAlign(CENTER, CENTER);
    text(
      state === 'dead'
        ? 'GOTCHA.'
        : levelIndex === 11
          ? 'YOU BEAT THE DEVIL!'
          : 'DOOR UNLOCKED',
      W / 2, 280
    );

    textStyle(NORMAL);
    textSize(14);
    text(state === 'dead' ? 'Try again...' : 'Next level...', W / 2, 319);
  }
}

function swatchRect(i) {
  const w = 92, gap = 24;
  const total = SKINS.length * w + (SKINS.length - 1) * gap;
  return {
    x: FIELD.x + (FIELD.w - total) / 2 + i * (w + gap),
    y: 300,
    w,
    h: 108
  };
}

function drawMiniPlayer(cx, baseY, s, sk) {
  const w = 24 * s, h = 32 * s;
  push();
  translate(cx - w / 2, baseY - h);
  noStroke();
  fill(sk.dark);
  rect(0, h - 8 * s, 6 * s, 8 * s, 1.5);
  rect(w - 6 * s, h - 8 * s, 6 * s, 8 * s, 1.5);
  rect(0, 0, w, h, 5 * s);
  fill(sk.base);
  rect(2 * s, 2 * s, w - 4 * s, h - 6 * s, 4 * s);
  fill(C.ink);
  rect(w - 9 * s, 11 * s, 3 * s, 4 * s, 1);
  pop();
}

function startGame() {
  try {
    localStorage.setItem('larpdevil.skin', String(skinIndex));
  } catch (e) { /* storage unavailable */ }
  levelIndex = 0;
  resetLevel();
}

function drawTitle() {
  const fx = FIELD.x, fw = FIELD.w;

  drawBackdrop();

  buttons = [];

  noStroke();
  fill(C.ink);
  rect(0, 0, W, 76);
  rect(0, 502, W, 98);

  fill(C.amber);
  textSize(22);
  textStyle(BOLD);
  textAlign(LEFT, CENTER);
  text('LARP DEVIL', 40, 29);
  fill(C.white);
  textStyle(NORMAL);
  textSize(12);
  text('SOUND EDITION', 42, 57);
  textAlign(RIGHT);
  text('12 LEVELS  ·  1 OF THEM LIES', W - 40, 42);
  textAlign(LEFT, CENTER);

  textAlign(CENTER, CENTER);
  fill(C.ink);
  textStyle(BOLD);
  textSize(46);
  text('LARP DEVIL', W / 2, 212);

  textStyle(NORMAL);
  textSize(13);
  fill(C.ink);
  text('The exit is a suggestion. Reach the green door anyway.', W / 2, 250);

  textSize(11);
  fill(C.muted);
  text('CHOOSE YOUR SKIN', W / 2, 280);

  SKINS.forEach((sk, i) => {
    const r = swatchRect(i);
    const sel = i === skinIndex;

    noStroke();
    fill(sel ? C.ink : 255, 251, 239, sel ? 255 : 150);
    rect(r.x, r.y, r.w, r.h, 8);

    noFill();
    if (sel) {
      stroke(C.amber);
      strokeWeight(2);
    } else {
      stroke(C.line);
      strokeWeight(1);
    }
    rect(r.x, r.y, r.w, r.h, 8);
    noStroke();

    drawMiniPlayer(r.x + r.w / 2, r.y + 68, 1.05, sk);

    fill(sel ? C.white : C.ink);
    textStyle(sel ? BOLD : NORMAL);
    textSize(10);
    textAlign(CENTER, CENTER);
    text(sk.name, r.x + r.w / 2, r.y + 86);

    if (sel) {
      fill(C.amber);
      textSize(13);
      text('▾', r.x + r.w / 2, r.y - 12);
    }
  });

  const blink = floor(titleT * 2) % 2 === 0;
  if (blink) {
    fill(C.ink);
    textStyle(BOLD);
    textSize(13);
    text('PRESS ENTER OR CLICK TO BEGIN', W / 2, 445);
    textStyle(NORMAL);
  }

  uiButton(
    18, 512, 109, 32,
    micState === 'on' ? 'MIC ON' : 'ENABLE MIC',
    micState === 'on' ? 'on' : 'accent',
    () => enableMic()
  );
  uiButton(617, 512, 128, 32, 'BEGIN  ⏎', 'accent', () => startGame());

  fill(C.white);
  textAlign(LEFT, CENTER);
  textSize(11);
  text(audioStatus.slice(0, 86), 20, 565);

  fill('#aaa69b');
  textAlign(RIGHT);
  text('←/→ CHANGE SKIN  ·  ENTER BEGIN  ·  SHIFT SPRINTS IN-GAME', 944, 565);
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

function drawBackdrop() {
  const ctx = drawingContext;
  const worldW = level && level.worldW ? level.worldW : FIELD.w;
  const fx = FIELD.x + camX, fy = FIELD.y, fw = FIELD.w, fh = FIELD.h;
  const drift = -(controlled().x - 76);

  ctx.save();
  roundPath(fx, fy, fw, fh, 11);
  ctx.clip();

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

    ctx.beginPath();
    ctx.moveTo(b.pts[0].x + px, fy + fh);
    for (const pt of b.pts) ctx.lineTo(pt.x + px, pt.y);
    ctx.lineTo(b.pts[b.pts.length - 1].x + px, fy + fh);
    ctx.closePath();
    ctx.fillStyle = b.col;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(b.pts[0].x + px, b.pts[0].y);
    for (const pt of b.pts) ctx.lineTo(pt.x + px, pt.y);
    ctx.strokeStyle = 'rgba(255, 242, 214, 0.42)';
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
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

  const fog = ctx.createLinearGradient(0, fy + fh - 112, 0, fy + fh);
  fog.addColorStop(0, 'rgba(248, 222, 170, 0)');
  fog.addColorStop(1, 'rgba(248, 222, 170, 0.38)');
  ctx.fillStyle = fog;
  ctx.fillRect(fx, fy + fh - 112, fw, 112);

  const t = gameTime;
  for (const e of bgEmbers) {
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

  for (const m of bgMotes) {
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

  noFill();
  stroke(58, 52, 42, 90);
  strokeWeight(2);
  roundPath(fx, fy, fw, fh, 11);
  drawingContext.stroke();
  noStroke();
}

function drawWorld() {
  drawBackdrop();

  const hint = millis() < messageUntil
    ? message
    : level.doorMode
      ? 'CONTROLS: The DOOR is yours. ←/→ or A/D to steer, ↑/W/SPACE to hop'
      : 'CONTROLS: Use sounds OR Arrow Keys / WASD (↑ to jump, ↓ to stop)';

  textSize(12);
  noStroke();
  fill(37, 39, 44, 46);
  roundPath(FIELD.x + 12, FIELD.y + 8, textWidth(hint) + 30, 24, 12);
  drawingContext.fill();

  fill(C.ink);
  textAlign(LEFT, CENTER);
  text(hint, FIELD.x + 27, FIELD.y + 21);

  for (const q of level.platforms) {
    if (!isSolid(q)) {
      if (q.kind === 'blink') {
        stroke(C.line);
        strokeWeight(2);
        line(q.x, q.y + 6, q.x + q.w, q.y + 6);
        noStroke();
      }
      continue;
    }

    fill(q.kind === 'crumble' && q.timer ? C.amber : C.ink);
    rect(q.x, q.y, q.w, q.h, 2);
    fill(q.kind === 'conveyor' ? C.amber : '#918577');
    rect(q.x, q.y + 5, q.w, 3);

    if (q.kind === 'crumble') {
      stroke(C.paper);
      strokeWeight(1);
      for (let x = q.x + 15; x < q.x + q.w; x += 30) {
        line(x, q.y + 2, x - 7, q.y + 11);
      }
      noStroke();
    }

    if (q.kind === 'conveyor') {
      fill(C.paper);
      textSize(12);
      for (let x = q.x + 13; x < q.x + q.w; x += 34) {
        text('›', x, q.y + 6);
      }
    }

    if (q.kind === 'moving') {
      fill(C.amber);
      rect(q.x + 6, q.y + 5, q.w - 12, 3);
    }
  }

  const d = level.door;

  let dsx = 1, dsy = 1;
  if (level.doorMode && !d.grounded) {
    const a = constrain(abs(d.vy) / MAX_FALL, 0, 1);
    if (d.vy < 0) {
      dsy = 1 + 0.13 * a;
      dsx = 1 - 0.09 * a;
    } else {
      dsy = 1 + 0.05 * a;
      dsx = 1 - 0.035 * a;
    }
  }
  dsy -= doorImpact * 0.2;
  dsx += doorImpact * 0.15;

  if (level.doorMode) {
    const pulse = 0.5 + 0.5 * sin(gameTime * 3.2);
    noFill();
    stroke(189, 101, 47, 110 + 120 * pulse);
    strokeWeight(2);
    rect(d.x - 6, d.y - 6, d.w + 12, d.h + 12, 6);
    noStroke();

    const ax = d.x + d.w / 2;
    const dir = d.moving || 0;
    fill(245, 171, 69, 210);
    for (let i = 0; i < 2; i++) {
      const off = (dir >= 0 ? 1 : -1) * (5 + i * 4);
      triangle(
        ax + off,
        d.y - 12,
        ax + off - (dir >= 0 ? 4 : -4),
        d.y - 17,
        ax + off + (dir >= 0 ? 4 : -4),
        d.y - 17
      );
    }
  }

  const open = winOpen * (1 - winClose);

  push();
  translate(d.x + d.w / 2, d.y + d.h);
  scale(dsx, dsy);

  fill(C.green);
  rect(-d.w / 2, -d.h, d.w, d.h, 3);

  fill(C.ink);
  rect(-d.w / 2 + 5, -d.h + 6, d.w - 10, d.h - 6, 2);

  const iw = d.w - 10;
  const pw = (iw / 2) * (1 - open);
  fill(C.green);
  rect(-iw / 2, -d.h + 6, pw, d.h - 6, 1);
  rect(iw / 2 - pw, -d.h + 6, pw, d.h - 6, 1);

  if (pw > 2) {
    fill(0, 0, 0, 55);
    rect(-0.6, -d.h + 6, 1.2, d.h - 6);
    rect(iw / 2 - pw, -d.h + 6, 1.2, d.h - 6);
  }

  if (open < 0.5) {
    fill(C.amber);
    circle(d.w / 2 - 8, -d.h + 27, 4);
  }

  pop();

  for (const t of level.traps) drawTrap(t);
  drawPlayer();

  for (const p of particles) {
    fill(p.color);
    rect(p.x, p.y, p.s, p.s);
  }
}

function drawTrap(t) {
  if (t.type === 'pop') {
    if (t.active && t.value > 0) {
      fill(C.danger);
      const count = max(1, floor(t.w / 14));
      for (let i = 0; i < count; i++) {
        triangle(
          t.x + i * t.w / count, t.y,
          t.x + (i + 0.5) * t.w / count, t.y - t.h * t.value,
          t.x + (i + 1) * t.w / count, t.y
        );
      }
    } else {
      fill(C.amberDark);
      rect(t.x, t.y - 3, t.w, 3);
    }
  } else if (t.type === 'fall') {
    if (t.active && gameTime - t.timer < 0.47) {
      fill(C.danger);
      rect(t.x + 9, t.y - 22, 30, 18, 3);
      fill(C.white);
      textSize(14);
      textAlign(CENTER, CENTER);
      text('!', t.x + 24, t.y - 13);
    }

    fill(C.ink);
    rect(t.x, t.y + t.value, t.w, t.h, 3);
    fill(C.danger);
    triangle(
      t.x + 7, t.y + t.value + t.h,
      t.x + 15, t.y + t.value + t.h + 13,
      t.x + 23, t.y + t.value + t.h
    );
  } else if (t.type === 'saw') {
    push();
    translate(t.x + t.value + t.w / 2, t.y + t.h / 2);
    rotate(gameTime * 5);
    fill(C.danger);

    for (let a = 0; a < 10; a++) {
      const theta = TWO_PI * a / 10;
      triangle(
        cos(theta - 0.17) * 14, sin(theta - 0.17) * 14,
        cos(theta) * 21, sin(theta) * 21,
        cos(theta + 0.17) * 14, sin(theta + 0.17) * 14
      );
    }

    fill(C.ink);
    circle(0, 0, 27);
    fill(C.paper);
    circle(0, 0, 6);
    pop();
  } else if (t.type === 'laser') {
    const age = gameTime - t.timer;
    const on = t.active && age > 0.68 && age % 2.05 < 1.08;

    fill(on ? C.danger : C.amber);
    rect(t.x - 7, t.y - 7, 23, 13, 2);
    rect(t.x - 7, t.y + t.h, 23, 13, 2);

    if (on) {
      fill(220, 93, 78, 80);
      rect(t.x - 6, t.y, t.w + 12, t.h);
      fill(C.danger);
      rect(t.x + 2, t.y, t.w - 4, t.h);
    } else if (t.active) {
      stroke(C.danger);
      strokeWeight(1);
      line(t.x + 4, t.y, t.x + 4, t.y + t.h);
      noStroke();
    }
  } else if (t.type === 'spring') {
    fill(C.green);
    rect(t.x, t.y, t.w, t.h + 6, 3);
    fill(C.paper);
    rect(t.x + 5, t.y + 4, t.w - 10, 3);
  } else if (t.type === 'reverse') {
    fill(t.active ? C.amberDark : C.muted);
    rect(t.x, t.y + 8, t.w, 4);

    if (t.active) {
      fill(C.amberDark);
      textSize(13);
      textAlign(CENTER, CENTER);
      text('⇄  REVERSED  ⇄', t.x + t.w / 2, t.y - 12);
    }
  } else if (t.type === 'fake') {
    fill(C.green);
    rect(t.x, t.y, t.w, t.h, 3);
    fill(C.ink);
    rect(t.x + 5, t.y + 6, t.w - 10, t.h - 6, 2);
    fill(C.amber);
    circle(t.x + t.w - 8, t.y + 27, 4);
  }
}

function drawPlayer() {
  if (state === 'dead') return;

  const p = player;
  const sk = skin();
  const speed = abs(p.vx);
  const running = p.grounded && speed > 12;

  let sx = 1, sy = 1;
  if (!p.grounded) {
    const t = constrain(abs(p.vy) / 620, 0, 1);
    if (p.vy < 0) {
      sy = 1 + 0.13 * t;
      sx = 1 - 0.09 * t;
    } else {
      sy = 1 + 0.05 * t;
      sx = 1 - 0.035 * t;
    }
  }
  const li = level.doorMode ? 0 : landImpulse;
  sy -= li * 0.2;
  sx += li * 0.15;

  const phase = sin(walkCycle);
  const swing = running ? phase * 3.4 : 0;
  const bob = running ? -abs(cos(walkCycle)) * 1.6 : 0;
  const lean = running ? constrain(p.vx / RUN_SPEED, -1, 1) * 0.035 : 0;

  push();
  translate(p.x + p.w / 2, p.y + p.h);
  scale(p.face, 1);
  rotate(lean);
  scale(sx, sy);

  if (playerSwallow > 0) {
    scale(1 - playerSwallow * 0.92, 1 - playerSwallow * 0.92);
    drawingContext.globalAlpha = 1 - playerSwallow * 0.55;
  }

  if (p.grounded) {
    noStroke();
    fill(37, 39, 44, 55);
    ellipse(0, 1.5, p.w * (0.62 - landImpulse * 0.1), 5 - landImpulse * 1.4);
  }

  // Legs
  fill(sk.dark);
  rect(-p.w / 2, -8, 6, 8, 1.5);
  rect(1, -8, 6, 8, 1.5);
  rect(-p.w / 2 + swing, -8, 6, 8 - max(0, swing) * 0.9, 1.5);
  rect(1 - swing, -8, 6, 8 - max(0, -swing) * 0.9, 1.5);

  // Trailing arm
  if (running) {
    rect(-p.w / 2 - 1 + phase * 2, -p.h + 15 + bob, 5, 11, 2);
  }

  // Body
  fill(sk.dark);
  rect(-p.w / 2, -p.h, p.w, p.h, 5);

  fill(sk.base);
  rect(-p.w / 2 + 2, -p.h + 2 + bob, p.w - 4, p.h - 6, 4);

  // Eye
  fill(C.ink);
  const blink = frameCount % 150 < 4;
  rect(4, -p.h + 11 + bob, 3, blink ? 1 : 4, 1);

  pop();

  if (level.doorMode) {
    stroke(118, 117, 111, 165);
    strokeWeight(1.5);
    const g = 5, a = 8;
    const x0 = p.x - g, y0 = p.y - g, x1 = p.x + p.w + g, y1 = p.y + p.h + g;
    line(x0, y0, x0 + a, y0);
    line(x0, y0, x0, y0 + a);
    line(x1, y0, x1 - a, y0);
    line(x1, y0, x1, y0 + a);
    line(x0, y1, x0 + a, y1);
    line(x0, y1, x0, y1 - a);
    line(x1, y1, x1 - a, y1);
    line(x1, y1, x1, y1 - a);
    noStroke();
  }

  noStroke();
  fill(255, 255, 255, 90);
  rect(
    p.x + p.w / 2 - p.w * 0.32,
    p.y + p.h - p.h * sy + 3 + bob * sy,
    4,
    2,
    1
  );
}

function drawControls() {
  noStroke();
  fill(C.ink);
  rect(0, 502, W, 98);
  buttons = [];

  uiButton(
    18, 512, 109, 32,
    micState === 'on' ? 'MIC ON' : 'ENABLE MIC',
    micState === 'on' ? 'on' : 'accent',
    () => enableMic()
  );

  NAMES.forEach((name, i) => {
    uiButton(
      137 + i * 83, 512, 75, 32,
      (signatures[i] ? '✓ ' : '') + name,
      training === i ? 'accent' : signatures[i] ? 'on' : '',
      () => beginTraining(i)
    );
  });

  uiButton(
    480, 512, 128, 32,
    listening ? 'STOP LISTEN' : 'START LISTEN',
    listening ? 'accent' : '',
    () => toggleListening()
  );

  uiButton(617, 512, 75, 32, 'RETRY', '', () => resetLevel());
  uiButton(
    701, 512, 28, 32, '−', '',
    () => moveSeconds = max(0.25, moveSeconds - 0.1)
  );
  uiButton(
    730, 512, 65, 32,
    `${moveSeconds.toFixed(2)}s`, 'flat', null
  );
  uiButton(
    797, 512, 28, 32, '+', '',
    () => moveSeconds = min(2, moveSeconds + 0.1)
  );
  uiButton(
    835, 512, 40, 32, '‹', '',
    () => {
      levelIndex = (levelIndex + 11) % 12;
      resetLevel();
    }
  );
  uiButton(
    877, 512, 40, 32, '›', '',
    () => {
      levelIndex = (levelIndex + 1) % 12;
      resetLevel();
    }
  );

  fill(C.white);
  textAlign(LEFT, CENTER);
  textSize(11);
  text(audioStatus.slice(0, 86), 20, 565);

  fill('#aaa69b');
  textAlign(RIGHT);
  text(
    level.doorMode
      ? '←/→ MOVE DOOR  ·  SHIFT SPRINT  ·  ↑/W/SPACE HOP  ·  R RESTART'
      : '←/→ MOVE  ·  SHIFT SPRINT  ·  ↑/W/SPACE JUMP  ·  ↓/S STOP  ·  R RESTART',
    944, 586
  );

  noStroke();
  fill('#55585b');
  rect(300, 559, 200, 9, 4.5);

  const st = stamina / STAM_MAX;
  const barCol = exhausted ? C.danger : st < 0.3 ? C.amberDark : C.green;
  fill(barCol);
  rect(300, 559, max(4, 200 * st), 9, 4.5);

  if (exhausted) {
    fill(C.danger);
    textAlign(LEFT, CENTER);
    textStyle(BOLD);
    textSize(10);
    text('WINDED', 508, 563);
    textStyle(NORMAL);
  } else {
    fill('#aaa69b');
    textAlign(LEFT, CENTER);
    textSize(10);
    text(sprinting ? 'SPRINT' : 'SHIFT TO SPRINT', 508, 563);
  }

  fill('#55585b');
  rect(858, 559, 81, 5, 3);
  fill(C.green);
  rect(858, 559, min(81, noiseFloor * 1400), 5, 3);
}

function uiButton(x, y, w, h, label, style, action) {
  buttons.push({ x, y, w, h, action });

  fill(
    style === 'accent' ? C.amber :
    style === 'on' ? C.green :
    style === 'flat' ? '#34373a' :
    '#46484b'
  );
  rect(x, y, w, h, 5);

  fill(
    style === 'accent' || style === 'on'
      ? C.ink
      : C.white
  );
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(11);
  text(label, x + w / 2, y + h / 2 + 1);
  textStyle(NORMAL);
}

function mousePressed() {
  const x = mouseX * W / width;
  const y = mouseY * H / height;

  if (state === 'title') {
    for (let i = 0; i < SKINS.length; i++) {
      const r = swatchRect(i);
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
        skinIndex = i;
        return false;
      }
    }
  }

  return clickAt(x, y);
}

function clickAt(x, y) {
  for (const b of buttons) {
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
      if (b.action) b.action();
      return false;
    }
  }
  return false;
}

function touchStarted() {
  if (touches.length) {
    return clickAt(touches[0].x * W / width, touches[0].y * H / height);
  }
  return false;
}

function keyPressed() {
  if (state === 'title') {
    if (keyCode === LEFT_ARROW || keyCode === 65) {
      skinIndex = (skinIndex + SKINS.length - 1) % SKINS.length;
      return false;
    }
    if (keyCode === RIGHT_ARROW || keyCode === 68) {
      skinIndex = (skinIndex + 1) % SKINS.length;
      return false;
    }
    if (keyCode === 13 || keyCode === ENTER || keyCode === 32) {
      startGame();
      return false;
    }
    if (keyCode === DOWN_ARROW || keyCode === 83) {
      startGame();
      return false;
    }
    return true;
  }

  if (key === 'r' || key === 'R') resetLevel();

  // Instant halt on Down Arrow or S
  if (keyCode === DOWN_ARROW || keyCode === 83) {
    audioX.until = 0;
  }

  // Prevent browser viewport scrolling when pressing game navigation keys
  if ([UP_ARROW, DOWN_ARROW, LEFT_ARROW, RIGHT_ARROW, 32].includes(keyCode)) {
    return false;
  }
}

function keyReleased() {
  if ([UP_ARROW, DOWN_ARROW, LEFT_ARROW, RIGHT_ARROW, 32].includes(keyCode)) {
    return false;
  }
}