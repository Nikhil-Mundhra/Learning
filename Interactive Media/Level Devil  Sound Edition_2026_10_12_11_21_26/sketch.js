// ==========================================
// GAME STATE, ENGINE & ARROW KEYS FALLBACK
// ==========================================

let buttons = [];
let levelIndex = 0, level, player, deaths = 0;
let state = 'play', stateTimer = 0, gameTime = 0, lastFrame = 0;
let tutorialReturnState = 'start';
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
  const visW = FIELD.w;
  const maxX = max(0, worldW - visW);
  camX = constrain(body.x + body.w / 2 - visW / 2, 0, maxX);
}

const WIN_APPROACH = 0.4;
const WIN_ENTER = 0.45;
const WIN_CLOSE = 0.5;
const WIN_HOLD = 0.3;
let bgBands = [], bgMotes = [], bgHorns = [], bgEmbers = [];
let endHills = [], endTrees = [], endPollen = [];
let bgArt = null, endArt = null;
let bgCache = null, endCache = null;
let view = { s: 1, oy: 0, slackTop: 0, visW: W };
let endT = 0;

function layout() {
  view.s = min(windowHeight / H, windowWidth / 700);
  view.visW = windowWidth / view.s;
  view.oy = windowHeight - H * view.s;
  view.slackTop = view.oy / view.s;
  FIELD.x = 0;
  FIELD.w = view.visW;
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont('monospace');
  layout();
  buildBackdrop(FIELD.w);
  loadArtwork();

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

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  layout();
  bgCache = null;
  endCache = null;
  if (level) buildBackdrop(max(level.worldW, FIELD.w));
  if (state === 'ending') buildEndingScene();
}

function resetLevel() {
  level = buildLevel(levelIndex);
  buildBackdrop(max(level.worldW, FIELD.w));
  camX = 0;
  stamina = STAM_MAX;
  stamDelay = 0;
  exhausted = false;
  sprinting = false;
  player = {
    x: 76, y: FLOOR - 32, w: 24, h: 32,
    vx: 0, vy: 0, grounded: true, coyote: 0, face: 1,
    onLadder: false, ladder: null
  };
  if (level.exitSwitch) level.exitSwitch.active = false;
  level.door.locked = Boolean(level.exitSwitch);
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
  if (level.gateReturnX !== undefined) {
    level.gateEvent = { phase: 'waiting', timer: 0, closedY: level.door.y };
  }
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

  if (state === 'tutorialControls' || state === 'tutorialAudio') {
    updateParticles(dt);
    drawTutorial();
    return;
  }

  if (state === 'ending') {
    updateEnding(dt);
    updateParticles(dt);
    drawEnding();
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
  translate(0, view.oy);
  scale(view.s);
  drawScene();
  pop();
}

function controlled() {
  return level.doorMode ? level.door : player;
}

// p5 2.x dropped numeric keycodes from keyIsDown(); 1.x only tracks them.
// Passing both forms is safe: a miss is a plain false, never a throw.
function keyAny() {
  for (let i = 0; i < arguments.length; i++) {
    if (keyIsDown(arguments[i])) return true;
  }
  return false;
}

function keyVal() {
  return typeof key === 'string' ? key : '';
}

function codeVal() {
  return typeof code === 'undefined' ? '' : typeof code === 'string' ? code : '';
}

function codeNum() {
  return typeof keyCode === 'number' ? keyCode : -1;
}

function isDownKey() {
  return codeVal() === 'ArrowDown' || keyVal() === 'ArrowDown' || codeNum() === 40 || codeNum() === 83;
}

function isNavKey() {
  const k = keyVal();
  const c = codeVal();
  const n = codeNum();
  return (
    ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Space'].includes(k) ||
    ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(c) ||
    [32, 37, 38, 39, 40].includes(n)
  );
}

function updateGame(dt, now) {
  gameTime += dt;
  const p = player;

  if (updateGateRelocation(dt)) return;

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
const rightPressed = keyAny(RIGHT_ARROW, 39, 'ArrowRight', 68, 'KeyD', 'd');
const leftPressed = keyAny(LEFT_ARROW, 37, 'ArrowLeft', 65, 'KeyA', 'a');
const downPressed = keyAny(DOWN_ARROW, 40, 'ArrowDown', 83, 'KeyS', 's');
const upPressed = keyAny(UP_ARROW, 38, 'ArrowUp', 87, 'KeyW', 'w', 32, ' ', 'Space');
const shiftDown = keyAny(SHIFT, 16, 'ShiftLeft', 'ShiftRight');

  // Down Arrow halts active audio movement timers immediately (like voice 'DOWN')
  if (downPressed && audioX.until > now) {
    audioX.until = 0;
  }

  const ladder = p.ladder || (level.ladders || []).find(l =>
    p.x + p.w > l.x - 3 &&
    p.x < l.x + l.w + 3 &&
    p.y + p.h >= l.y - 4 &&
    p.y <= l.y + l.h - p.h + 4
  );
  const climb = (upPressed ? -1 : 0) + (downPressed ? 1 : 0);
  if (ladder && (p.onLadder || climb !== 0) && !(leftPressed || rightPressed)) {
    p.onLadder = true;
    p.ladder = ladder;
    p.x = ladder.x + (ladder.w - p.w) / 2;
    p.vx = 0;
    p.vy = 0;
    p.grounded = false;

    if (climb !== 0) {
      p.y += climb * 150 * dt;
      if (p.y <= ladder.y - p.h) {
        p.y = ladder.y - p.h;
        p.grounded = true;
        p.onLadder = false;
        p.ladder = null;
      } else if (p.y >= ladder.y + ladder.h - p.h) {
        p.y = ladder.y + ladder.h - p.h;
        p.grounded = true;
        p.onLadder = false;
        p.ladder = null;
      }
    }

    lastJump = upPressed;
    updateCamera();
    updateTraps();
    updateExitSwitch();
    if (state === 'play' && !level.door.locked && overlap(p, level.door)) win();
    return;
  }
  if (p.onLadder) {
    p.onLadder = false;
    p.ladder = null;
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
  if (upPressed && !lastJump && !ladder) {
    jumpQueuedUntil = now + 155;
  }
  lastJump = upPressed;

  updateStamina(dt, move !== 0, shiftDown);

  if (level.doorMode) {
    const d = level.door;
    const spd = sprinting ? DOOR_SPEED * SPRINT_MULT : DOOR_SPEED;
    d.x = constrain(d.x + move * spd * dt, level.leftBound, level.worldW - 4 - d.w);
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
  const rightBound = level.exitSwitch ||
    (level.gateReturnX !== undefined && level.gateEvent.phase !== 'waiting')
    ? level.worldW - p.w
    : level.door.x - p.w + 10;
  p.x = constrain(p.x + p.vx * dt, level.leftBound, rightBound);

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
  updateExitSwitch();
  if (state === 'play' && !level.door.locked && overlap(p, level.door)) win();
}

function updateGateRelocation(dt) {
  if (level.gateReturnX === undefined) return false;

  const event = level.gateEvent;
  const door = level.door;
  const player = controlled();

  if (
    event.phase === 'waiting' &&
    player.grounded &&
    player.x + player.w >= door.x - 150
  ) {
    event.phase = 'sinking';
    event.timer = 0;
    showMessage('THE GATE IS MOVING. TURN BACK.', 2400);
  }

  if (event.phase === 'waiting') return false;

  const duration = 0.62;
  event.timer = min(duration, event.timer + dt);
  const progress = event.timer / duration;
  const ease = progress * progress * (3 - 2 * progress);
  const hiddenY = FLOOR + door.h + 8;

  if (event.phase === 'sinking') {
    door.y = event.closedY + (hiddenY - event.closedY) * ease;
    if (progress >= 1) {
      door.x = level.gateReturnX;
      event.phase = 'rising';
      event.timer = 0;
    }
  } else if (event.phase === 'rising') {
    door.y = hiddenY + (event.closedY - hiddenY) * ease;
    if (progress >= 1) {
      door.y = event.closedY;
      event.phase = 'returned';
      showMessage('THE GATE IS BACK AT THE START. GO GET IT.', 3200);
    }
  } else {
    return false;
  }

  player.vx = 0;
  player.vy = 0;
  player.grounded = true;
  updateCamera();
  updateTraps();
  if (event.phase !== 'returned') return true;

  lastJump = keyAny(UP_ARROW, 38, 'ArrowUp', 87, 'KeyW', 'w', 32, ' ', 'Space');
  return false;
}

function updateExitSwitch() {
  const exitSwitch = level.exitSwitch;
  if (!exitSwitch || exitSwitch.active || !overlap(player, exitSwitch)) return;

  exitSwitch.active = true;
  level.door.locked = false;
  showMessage('THE DOOR OPENED BEHIND YOU. HEAD BACK.', 2600);
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
    if (levelIndex === 11) {
      enterEnding();
      return;
    }
    levelIndex = (levelIndex + 1) % 12;
    resetLevel();
  }
}

function enterEnding() {
  state = 'ending';
  endT = 0;
  camX = 0;
  winClose = 1;
  playerSwallow = 0;
  const d = level.door;
  d.x = 236;
  d.vy = 0;
  d.grounded = true;
  d.moving = 0;
  player.face = 1;
  player.vx = 0;
  player.vy = 0;
  player.grounded = true;
  player.y = 462 - player.h;
  player.x = d.x - player.w - 2;
  buildEndingScene();
}

function updateEnding(dt) {
  endT += dt;
  const d = level.door;

  if (endT < 1.5) {
    const t = constrain(endT / 1.5, 0, 1);
    player.x = d.x - player.w + t * (150 + d.w);
    player.face = 1;
    player.vx = RUN_SPEED;
    player.grounded = true;
    player.y = 462 - player.h;
    walkCycle += dt * 13;
    stepTimer -= dt;
    if (stepTimer <= 0) {
      stepTimer = 0.5;
      dustPuff(player.x, 462, 2, 26, 3, C.grass);
    }
  } else {
    player.vx = 0;
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
  background(C.ink);
  noStroke();

  fill(C.ink);
  rect(0, -view.slackTop, FIELD.w, 76 + view.slackTop);

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
  text(`DEATHS ${deaths}`, FIELD.w - 40, 32);
  textAlign(LEFT);

  const fieldContext = drawingContext;
  fieldContext.save();
  roundPath(0, 76, FIELD.w, 426, 12);
  fieldContext.clip();
  fill(C.sky);
  rect(0, 76, FIELD.w, 426);

  push();
  translate(
    -camX + (shake ? random(-shake, shake) : 0),
    shake ? random(-shake, shake) : 0
  );
  drawWorld();
  pop();
  fieldContext.restore();

  fieldContext.save();
  roundPath(0, 76, FIELD.w, 426, 12);
  fieldContext.strokeStyle = 'rgba(37, 39, 44, 0.22)';
  fieldContext.lineWidth = 1;
  fieldContext.stroke();
  fieldContext.restore();

  drawControls();

  if (state === 'dead' || (state === 'won' && winPhase === 3 && winT >= WIN_HOLD * 0.45)) {
    fill(37, 39, 44, 185);
    rect(0, 137, FIELD.w, 357);

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

  background(C.ink);
  drawBackdrop();

  buttons = [];

  noStroke();
  fill(C.ink);
  rect(0, -view.slackTop, FIELD.w, 76 + view.slackTop);
  rect(0, 502, FIELD.w, 98);

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
  text('12 LEVELS  ·  1 OF THEM LIES', FIELD.w - 40, 42);
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

  uiButton(FIELD.w / 2 - 72, 512, 144, 36, 'BEGIN  ⏎', 'accent', beginTutorial);

  fill('#aaa69b');
  textAlign(CENTER, CENTER);
  text('← / → CHANGE SKIN     ENTER TO BEGIN', FIELD.w / 2, 565);
}

function beginTutorial() {
  tutorialReturnState = 'start';
  state = 'tutorialControls';
}

function drawTutorial() {
  background(C.ink);
  buttons = [];

  const cardW = min(760, width - 32);
  const cardH = min(530, height - 32);
  const x = (width - cardW) / 2;
  const y = (height - cardH) / 2;
  const audioPage = state === 'tutorialAudio';

  noStroke();
  fill('#303338');
  rect(x, y, cardW, cardH, 16);
  fill(C.amber);
  rect(x + 24, y + 24, 34, 4, 2);

  fill(C.white);
  textAlign(LEFT, CENTER);
  textStyle(BOLD);
  textSize(12);
  text('LARP DEVIL', x + 24, y + 45);
  textStyle(NORMAL);
  fill('#aaa69b');
  textAlign(RIGHT, CENTER);
  textSize(11);
  text(audioPage ? 'VOICE CONTROLS' : 'MOVEMENT CONTROLS', x + cardW - 24, y + 45);

  fill(C.white);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(cardW < 440 ? 22 : 27);
  text(audioPage ? 'TEACH IT YOUR SOUNDS' : 'LEARN THE BASICS', x + cardW / 2, y + 91);
  textStyle(NORMAL);
  fill('#c4c0b6');
  textSize(13);
  text(
    audioPage
      ? 'Optional: record a distinct sound for each direction.'
      : 'A few controls are all you need to get moving.',
    x + cardW / 2, y + 122
  );

  stroke('#484b4f');
  line(x + 24, y + 148, x + cardW - 24, y + 148);
  noStroke();

  if (audioPage) {
    drawAudioTutorial(x, y, cardW, cardH);
    return;
  }

  const narrow = cardW < 560;
  const contentX = x + 24;
  const contentW = cardW - 48;
  const rowGap = 12;
  const rowH = 62;
  const cols = narrow ? 1 : 2;
  const rowW = cols === 1 ? contentW : (contentW - rowGap) / 2;
  const controls = [
    ['←  →', 'Move left and right'],
    ['↑  W  SPACE', 'Jump. Hold ↑ / W to climb'],
    ['SHIFT', 'Sprint while moving'],
    ['↓  S', 'Stop voice-driven movement']
  ];
  const rowsY = y + 170;

  controls.forEach(([keys, description], i) => {
    const col = i % cols;
    const row = floor(i / cols);
    const rx = contentX + col * (rowW + rowGap);
    const ry = rowsY + row * (rowH + rowGap);
    fill('#3a3d41');
    rect(rx, ry, rowW, rowH, 8);

    fill(C.amber);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(keys.length > 8 ? 10 : 13);
    text(keys, rx + 62, ry + rowH / 2);

    fill(C.white);
    textAlign(LEFT, CENTER);
    textStyle(NORMAL);
    textSize(12);
    text(description, rx + 112, ry + rowH / 2);
  });

  fill('#aaa69b');
  textAlign(CENTER, CENTER);
  textSize(11);
  text('Voice controls are optional. Keyboard controls always work.', x + cardW / 2, y + cardH - 94);

  uiButton(x + 24, y + cardH - 64, 130, 36, 'SKIP TUTORIAL', '', () => startGame());
  uiButton(x + cardW - 154, y + cardH - 64, 130, 36, 'CONTINUE', 'accent', () => {
    state = 'tutorialAudio';
  });
}

function drawAudioTutorial(x, y, cardW, cardH) {
  const compact = cardW < 500;
  const center = x + cardW / 2;
  const micY = y + 174;
  const directionsY = y + (compact ? 272 : 238);
  const statusY = y + (compact ? 324 : 287);
  const listenY = y + (compact ? 354 : 321);
  const durationY = y + (compact ? 405 : 371);
  const footerY = y + cardH - 64;

  uiButton(center - 72, micY, 144, 36,
    micState === 'on' ? 'MICROPHONE READY' : 'ENABLE MICROPHONE',
    micState === 'on' ? 'on' : 'accent',
    () => enableMic()
  );

  fill('#c4c0b6');
  textAlign(CENTER, CENTER);
  textSize(11);
  text('Record one short sound for each direction.', center, directionsY - 24);

  const names = ['DOWN', 'LEFT', 'RIGHT', 'UP'];
  const marks = ['↓', '←', '→', '↑'];
  const buttonW = compact ? min(70, (cardW - 66) / 4) : 76;
  const gap = compact ? 6 : 10;
  const buttonsW = buttonW * 4 + gap * 3;
  const startX = center - buttonsW / 2;

  names.forEach((name, i) => {
    const label = `${signatures[i] ? '✓ ' : ''}${marks[i]} ${name}`;
    uiButton(startX + i * (buttonW + gap), directionsY, buttonW, 34, label,
      training === i ? 'accent' : signatures[i] ? 'on' : '',
      () => beginTraining(i)
    );
  });

  fill(C.white);
  textAlign(CENTER, CENTER);
  textSize(11);
  const statusLines = [''];
  for (const word of audioStatus.split(/\s+/)) {
    const current = statusLines[statusLines.length - 1];
    const next = current ? `${current} ${word}` : word;
    if (current && textWidth(next) > cardW - 56) statusLines.push(word);
    else statusLines[statusLines.length - 1] = next;
  }
  const visibleStatus = statusLines.slice(0, 3);
  if (statusLines.length > visibleStatus.length) {
    let last = visibleStatus[visibleStatus.length - 1];
    while (last && textWidth(`${last}…`) > cardW - 56) last = last.slice(0, -1);
    visibleStatus[visibleStatus.length - 1] = `${last}…`;
  }
  visibleStatus.forEach((line, i) => {
    text(line, center, statusY + (i - (visibleStatus.length - 1) / 2) * 14);
  });

  uiButton(center - 72, listenY, 144, 34,
    listening ? 'STOP LISTENING' : 'START LISTENING',
    listening ? 'accent' : '',
    () => toggleListening()
  );

  fill('#c4c0b6');
  textSize(10);
  text('MOVEMENT LENGTH', center - 68, durationY + 1);
  uiButton(center + 13, durationY - 16, 28, 30, '−', '', () => {
    moveSeconds = max(0.25, moveSeconds - 0.1);
  });
  uiButton(center + 45, durationY - 16, 58, 30, `${moveSeconds.toFixed(2)}s`, 'flat', null);
  uiButton(center + 107, durationY - 16, 28, 30, '+', '', () => {
    moveSeconds = min(2, moveSeconds + 0.1);
  });

  if (tutorialReturnState === 'play') {
    uiButton(center - 65, footerY, 130, 36, 'RETURN TO GAME', 'accent', resumeGame);
  } else {
    uiButton(x + 24, footerY, 108, 36, 'BACK', '', () => {
      state = 'tutorialControls';
    });
    uiButton(x + cardW - 154, footerY, 130, 36, 'START GAME', 'accent', () => startGame());
  }
}

function resumeGame() {
  audioX.until = 0;
  jumpQueuedUntil = 0;
  state = 'play';
}

function buildEndingScene() {
  randomSeed(90210);
  endHills = [];
  endTrees = [];
  endPollen = [];

  const bands = [
    { base: 404, amp: 40, col: C.hillFar, smooth: true, step: 28, waves: [[1.1, 1], [2.7, 0.4]] },
    { base: 440, amp: 28, col: C.hillMid, smooth: true, step: 24, waves: [[0.9, 1], [2.2, 0.36]] },
    { base: 470, amp: 16, col: C.hillNear, smooth: true, step: 20, waves: [[0.7, 1]] }
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
      y: far ? 430 + random(-10, 14) : 462 + random(-6, 8),
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
  roundPath(fx, fy, fw, fh, 11);
  ctx.clip();

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
  rect(fx, 462, fw, fh - (462 - fy));
  fill(63, 122, 69, 70);
  rect(fx, 462, fw, 3);

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

  ctx.restore();

  noFill();
  stroke(46, 86, 48, 80);
  strokeWeight(2);
  roundPath(fx, fy, fw, fh, 11);
  drawingContext.stroke();
  noStroke();
}

function drawEnding() {
  const d = level.door;

  noStroke();
  fill(C.paper);
  rect(0, -view.slackTop, FIELD.w, 76 + view.slackTop);
  rect(0, 502, FIELD.w, 98);

  fill(C.grass);
  textSize(22);
  textStyle(BOLD);
  textAlign(LEFT, CENTER);
  text('LARP DEVIL', 40, 29);
  fill(C.muted);
  textStyle(NORMAL);
  textSize(12);
  text('ALL TWELVE LEVELS CLEARED', 42, 57);
  textAlign(RIGHT);
  text(`DEATHS ${deaths}`, FIELD.w - 40, 42);
  textAlign(LEFT, CENTER);

  drawEndingScene();

  push();
  translate(d.x + d.w / 2, 462);
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
  rect(FIELD.x + 150, FIELD.y + 26, FIELD.w - 300, 104, 10);
  drawingContext.fill();

  fill(31, 74, 36, 255 * reveal);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(38);
  text('YOU WALKED OUT', W / 2, FIELD.y + 60);
  textStyle(NORMAL);
  textSize(13);
  text('The door was a suggestion. You took it anyway.', W / 2, FIELD.y + 96);
  textSize(12);
  fill(74, 112, 70, 255 * reveal);
  text(
    `12 LEVELS  \u00b7  ${deaths} DEATH${deaths === 1 ? '' : 'S'}`,
    W / 2,
    FIELD.y + 116
  );

  if (endT > 2.1 && floor(endT * 2) % 2 === 0) {
    fill(31, 74, 36);
    textStyle(BOLD);
    textSize(14);
    text('PRESS ENTER TO PLAY AGAIN', W / 2, 452);
    textStyle(NORMAL);
  }

  buttons = [];
  uiButton(18, 512, 128, 32, 'PLAY AGAIN  \u23ce', 'accent', () => {
    state = 'title';
    titleT = 0;
  });

  fill(C.white);
  textAlign(LEFT, CENTER);
  textSize(11);
  text('Thanks for playing.', 20, 565);
  fill('#aaa69b');
  textAlign(RIGHT);
  text('R RESTARTS THE CURRENT LEVEL IN-GAME', FIELD.w - 20, 565);
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
  loadImage('hell.png', img => {
    bgArt = img;
    bgCache = null;
  }, () => {
    console.warn('[larp-devil] hell.png not found, using procedural backdrop');
  });

  loadImage('nature.png', img => {
    endArt = img;
    endCache = null;
  }, () => {
    console.warn('[larp-devil] nature.png not found, using procedural ending');
  });
}

function ensureCache(img, cache, w) {
  if (cache && cache.img === img && cache.w >= w) return cache;
  const cv = document.createElement('canvas');
  cv.width = Math.ceil(w);
  cv.height = Math.ceil(w / (img.width / img.height));
  const g = cv.getContext('2d');
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = 'high';
  g.drawImage(img.elt || img.canvas, 0, 0, cv.width, cv.height);
  return { img, canvas: cv, w: cv.width, h: cv.height };
}

function blitArt(ctx, img, cache, fx, fy, fw, fh, driftX, focus, dim) {
  const c = ensureCache(img, cache, fw * 1.3 + 2);
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
  roundPath(fx, fy, fw, fh, 11);
  ctx.clip();

  if (bgArt) {
    bgCache = blitArt(ctx, bgArt, bgCache, fx, fy, fw, fh, -drift * 0.22, 0.5, 0.3);
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
      : level.ladders && level.ladders.length
        ? 'UP / W TO CLIMB. DOWN / S TO DESCEND. Find the switch, then return.'
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

    const isGround = q.kind === 'ground';
    fill(q.kind === 'crumble' && q.timer ? C.amber : '#493a4c');
    rect(q.x, q.y, q.w, q.h, isGround ? 0 : 2);
    fill(q.kind === 'conveyor' ? C.amber : '#bd818d');
    rect(q.x, q.y + 2, q.w, 3);

    if (isGround) {
      stroke('#68566b');
      strokeWeight(1);
      for (let x = q.x + 18; x < q.x + q.w; x += 36) {
        line(x, q.y + 10, x + 7, q.y + 16);
      }
      noStroke();
    }

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

  for (const ladder of level.ladders || []) {
    stroke('#69505a');
    strokeWeight(5);
    line(ladder.x + 4, ladder.y + 2, ladder.x + 4, ladder.y + ladder.h);
    line(ladder.x + ladder.w - 4, ladder.y + 2, ladder.x + ladder.w - 4, ladder.y + ladder.h);
    stroke('#d29a86');
    strokeWeight(3);
    for (let y = ladder.y + 8; y < ladder.y + ladder.h; y += 16) {
      line(ladder.x + 4, y, ladder.x + ladder.w - 4, y);
    }
    noStroke();
  }

  if (level.exitSwitch) {
    const s = level.exitSwitch;
    fill(level.door.locked ? '#694954' : C.green);
    rect(s.x, s.y, s.w, s.h, 5);
    fill(level.door.locked ? C.amber : '#dcecd2');
    circle(s.x + s.w / 2, s.y + 11, 8);
    fill(level.door.locked ? '#e69780' : C.green);
    rect(s.x + 8, s.y + 20, s.w - 16, 3, 1);
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

  fill(d.locked ? '#81525a' : C.green);
  rect(-d.w / 2, -d.h, d.w, d.h, 3);

  fill(C.ink);
  rect(-d.w / 2 + 5, -d.h + 6, d.w - 10, d.h - 6, 2);

  const iw = d.w - 10;
  const pw = (iw / 2) * (1 - open);
  fill(d.locked ? '#81525a' : C.green);
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
    const size = t.w / 32;
    push();
    translate(t.x + t.value + t.w / 2, t.y + t.h / 2);
    scale(size);
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
  rect(0, 502, FIELD.w, 98);
  buttons = [];

  const fw = FIELD.w;
  const R = 20;
  const row = (bx, bw, label, style, action) => uiButton(bx, 512, bw, 32, label, style, action);
  const navX = fw - R - 85;
  const meterW = max(145, min(250, fw * 0.25));
  const meterX = max(R + 207, navX - meterW - 28);

  row(R, 112, 'VOICE SETUP', listening ? 'on' : '', () => {
    tutorialReturnState = 'play';
    audioX.until = 0;
    state = 'tutorialAudio';
  });
  row(R + 122, 75, 'RETRY', '', () => resetLevel());

  fill(C.white);
  textAlign(LEFT, CENTER);
  textSize(11);
  text(listening ? 'Voice control is on.' : 'Arrow keys are ready.', 20, 565);

  fill('#aaa69b');
  textAlign(LEFT);
  textSize(10);
  text(
    level.doorMode
      ? '\u2190/\u2192 MOVE DOOR  \u00b7  SHIFT SPRINT  \u00b7  \u2191/W/SPACE HOP'
      : level.ladders && level.ladders.length
        ? '\u2190/\u2192 MOVE  \u00b7  \u2191/W CLIMB  \u00b7  SPACE JUMP'
        : '\u2190/\u2192 MOVE  \u00b7  SHIFT SPRINT  \u00b7  \u2191/W/SPACE JUMP',
    20, 586
  );

  noStroke();
  fill('#55585b');
  rect(meterX, 559, meterW, 9, 4.5);

  const st = stamina / STAM_MAX;
  const barCol = exhausted ? C.danger : st < 0.3 ? C.amberDark : C.green;
  fill(barCol);
  rect(meterX, 559, max(4, meterW * st), 9, 4.5);

  fill(exhausted ? C.danger : '#aaa69b');
  textAlign(RIGHT, CENTER);
  textStyle(exhausted ? BOLD : NORMAL);
  textSize(10);
  text(
    exhausted ? 'WINDED' : sprinting ? 'SPRINT' : 'SHIFT TO SPRINT',
    meterX + meterW - 2, 578
  );
  textStyle(NORMAL);

  row(navX, 40, '\u2039', '', () => {
    levelIndex = (levelIndex + 11) % 12;
    resetLevel();
  });
  row(navX + 45, 40, '\u203a', '', () => {
    levelIndex = (levelIndex + 1) % 12;
    resetLevel();
  });
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
  if (state === 'tutorialControls' || state === 'tutorialAudio') {
    return clickAt(mouseX, mouseY);
  }

  const x = mouseX / view.s;
  const y = (mouseY - view.oy) / view.s;

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
    if (state === 'tutorialControls' || state === 'tutorialAudio') {
      return clickAt(touches[0].x, touches[0].y);
    }
    return clickAt(touches[0].x / view.s, (touches[0].y - view.oy) / view.s);
  }
  return false;
}

function keyPressed() {
  if (state === 'title') {
    const k = keyVal();
    const c = codeVal();
    const n = codeNum();

    if (c === 'ArrowLeft' || k === 'ArrowLeft' || n === 37 || n === 65) {
      skinIndex = (skinIndex + SKINS.length - 1) % SKINS.length;
      return false;
    }
    if (c === 'ArrowRight' || k === 'ArrowRight' || n === 39 || n === 68) {
      skinIndex = (skinIndex + 1) % SKINS.length;
      return false;
    }
    if (n === 13 || n === 32 || k === 'Enter' || k === ' ' || c === 'Space' || c === 'NumpadEnter') {
      beginTutorial();
      return false;
    }
    if (c === 'ArrowDown' || k === 'ArrowDown' || n === 40 || n === 83) {
      beginTutorial();
      return false;
    }
    return true;
  }

  if (state === 'tutorialControls') {
    if ([13, 32].includes(codeNum()) || keyVal() === 'Enter' || keyVal() === ' ') {
      state = 'tutorialAudio';
      return false;
    }
    if (keyVal() === 'Escape') {
      startGame();
      return false;
    }
    return true;
  }

  if (state === 'tutorialAudio') {
    if ([13, 32].includes(codeNum()) || keyVal() === 'Enter' || keyVal() === ' ') {
      if (tutorialReturnState === 'play') resumeGame();
      else startGame();
      return false;
    }
    if (keyVal() === 'Escape') {
      if (tutorialReturnState === 'play') resumeGame();
      else state = 'tutorialControls';
      return false;
    }
    return true;
  }

  if (state === 'ending') {
    const n = codeNum();
    if (n === 13 || n === 32 || keyVal() === 'Enter' || keyVal() === ' ' || codeVal() === 'Space') {
      state = 'title';
      titleT = 0;
      return false;
    }
    return true;
  }

  if (keyVal() === 'r' || keyVal() === 'R') resetLevel();

  if (isDownKey()) {
    audioX.until = 0;
  }

  if (isNavKey()) {
    return false;
  }
}

function keyReleased() {
  if (isNavKey()) {
    return false;
  }
}