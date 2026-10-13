// ==========================================
// GAME STATE, ENGINE & ARROW KEYS FALLBACK
// ==========================================

let buttons = [];
let levelIndex = 0, level, player, deaths = 0;
let levelAttempts = Array(12).fill(0);
let state = 'play', stateTimer = 0, gameTime = 0, lastFrame = 0;
let tutorialReturnState = 'start';
let settingsOpen = false;
let gameSettings = { screenShake: true, particles: true };
let gearIcon = null;
let message = 'Reach the green door. Trust nothing.';
let messageUntil = 0, messageShownAt = 0, messageDismissOnMove = false, messagePinned = false;
let particles = [], shake = 0;
let lastJump = false, jumpQueuedUntil = 0;
let walkCycle = 0, stepTimer = 0.5, landImpulse = 0, impactSpeed = 0;
let doorImpact = 0;
let doorHumOpen = 0;
let winPhase = 0, winT = 0, winOpen = 0, winClose = 0, playerSwallow = 0;
let skinIndex = 0, titleT = 0;
const THEMES = ['bare', 'hell', 'nature'];
let themeIndex = 1, natureUnlocked = false;
let titleFocus = 'skin';
let stamina = STAM_MAX, stamDelay = 0, exhausted = false, sprinting = false;
let sprintCarry = 0, wasSprinting = false, lastSprintDirection = 0, lastSprintExtra = 0;
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

function updateSprintCarry(dt, move, baseSpeed, speedMultiplier = 1) {
  if (sprinting && move !== 0) {
    sprintCarry = 0;
    lastSprintDirection = move;
    lastSprintExtra = baseSpeed * (SPRINT_MULT - 1) * speedMultiplier;
    wasSprinting = true;
    return 0;
  }

  if (wasSprinting) {
    sprintCarry = lastSprintDirection * lastSprintExtra;
    wasSprinting = false;
  }

  sprintCarry *= exp(-3.2 * dt);
  if (abs(sprintCarry) < 1) sprintCarry = 0;
  return sprintCarry;
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

const GameStorage = {
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem(key);
      return v !== null ? v : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, val) {
    try {
      localStorage.setItem(key, String(val));
    } catch {}
  },
  getBool(key, fallback = true) {
    const v = GameStorage.get(key);
    return v !== null ? v !== 'false' : fallback;
  },
  getNum(key, fallback = 0) {
    const v = GameStorage.get(key);
    if (v === null) return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }
};

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont('monospace');
  layout();
  buildBackdrop(FIELD.w);
  loadArtwork();

  const savedSkin = GameStorage.getNum('larpdevil.skin', -1);
  if (savedSkin >= 0 && savedSkin < SKINS.length) skinIndex = savedSkin;
  natureUnlocked = GameStorage.get('larpdevil.natureUnlocked') === 'true';
  const savedTheme = THEMES.indexOf(GameStorage.get('larpdevil.theme'));
  if (savedTheme >= 0 && (savedTheme !== 2 || natureUnlocked)) themeIndex = savedTheme;
  musicEnabled = GameStorage.getBool('larpdevil.musicEnabled', true);
  soundEffectsEnabled = GameStorage.getBool('larpdevil.soundEffectsEnabled', true);
  gameSettings.screenShake = GameStorage.getBool('larpdevil.screenShake', true);
  gameSettings.particles = GameStorage.getBool('larpdevil.particles', true);

  resetLevel(false);
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

function resetLevel(countAttempt = true) {
  const attempt = countAttempt ? ++levelAttempts[levelIndex] : levelAttempts[levelIndex];
  level = buildLevel(levelIndex);
  buildBackdrop(max(level.worldW, FIELD.w));
  camX = 0;
  stamina = STAM_MAX;
  stamDelay = 0;
  exhausted = false;
  sprinting = false;
  sprintCarry = 0;
  wasSprinting = false;
  lastSprintDirection = 0;
  lastSprintExtra = 0;
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
  resetTimeFreeze(levelIndex);
  jumpQueuedUntil = 0;
  lastJump = false;
  walkCycle = 0;
  stepTimer = 0.5;
  landImpulse = 0;
  doorImpact = 0;
  doorHumOpen = 0;
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
  if (isFibonacciAttempt(attempt)) {
    message = level.hint;
    messageUntil = millis() + 2800;
    messageShownAt = millis();
    messageDismissOnMove = true;
    messagePinned = false;
    playNotificationSound();
  } else {
    message = '';
    messageUntil = 0;
    messageDismissOnMove = false;
    messagePinned = false;
  }
}

function isFibonacciAttempt(attempt) {
  if (attempt < 1) return false;
  let previous = 1;
  let current = 2;
  while (current < attempt) {
    const next = previous + current;
    previous = current;
    current = next;
  }
  return attempt === 1 || attempt === current;
}

function draw() {
  const now = millis();
  const dt = min((now - (lastFrame || now)) / 1000, 0.04);
  lastFrame = now;

  if (state !== 'play') setLadderSoundActive(false);
  processAudio(now);

  if (state === 'title') {
    titleT += dt;
    updateParticles(dt);
    drawTitle();
    return;
  }

  if (state === 'tutorialControls' || state === 'tutorialAudio') {
    if (state === 'tutorialAudio') {
      updateHumCalibration(dt, keyAny('h', 'H'));
    }
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

function handleVoicePowers(dt, humKey) {
  if (level.doorMode) {
    // In Level 12 (doorMode), the player is stationary and controlling the door.
    // Time freeze/rewind are disabled. Instead, humming opens the door and keeps it open!
    const wantsHum = isHumming || humKey;
    if (wantsHum) {
      doorHumOpen = min(1, doorHumOpen + dt * 3.5);
    } else {
      doorHumOpen = max(0, doorHumOpen - dt * 2.5);
    }
    return false;
  }

  if (selectedVoicePower === 'rewind') {
    // ------------------------------------------
    // REWIND POWER: REVERSE TIME BY 2 SECONDS
    // ------------------------------------------
    if (!timeFreezeUsed && !rewindActive && (isHumming || humKey) && timeHistory.length > 5) {
      rewindActive = true;
      rewindTargetTime = max(0, gameTime - 2.0);
      playRewindSound();
      if (backgroundMusic) backgroundMusic.playbackRate = 0.5;
    }

    if (rewindActive) {
      // Step backwards through timeHistory (rewind speed ~ 2.5x)
      const steps = min(timeHistory.length, 3);
      for (let s = 0; s < steps; s++) {
        if (timeHistory.length > 0) {
          const snap = timeHistory.pop();
          player.x = snap.x;
          player.y = snap.y;
          player.vx = snap.vx;
          player.vy = snap.vy;
          player.grounded = snap.grounded;
          player.face = snap.face;
          stamina = snap.stamina;
          gameTime = snap.time;
          if (snap.traps) {
            snap.traps.forEach((st, i) => {
              if (level.traps[i]) {
                level.traps[i].active = st.active;
                level.traps[i].timer = st.timer;
                level.traps[i].value = st.value;
                level.traps[i].done = st.done;
              }
            });
          }
        }
      }

      if (timeHistory.length === 0 || gameTime <= rewindTargetTime) {
        rewindActive = false;
        timeFreezeUsed = true; // Once per level / reset!
        playUnfreezeSound();
        if (backgroundMusic) backgroundMusic.playbackRate = 1.0;
      }

      updateCamera();
      return true; // Freeze keyboard input & game physics while rewinding!
    } else {
      // Record rolling snapshot of the past ~2.6 seconds
      timeHistory.push({
        time: gameTime,
        x: player.x,
        y: player.y,
        vx: player.vx,
        vy: player.vy,
        grounded: player.grounded,
        face: player.face,
        stamina,
        traps: level.traps.map(t => ({ active: t.active, timer: t.timer, value: t.value, done: t.done }))
      });
      while (timeHistory.length > 1 && timeHistory[0].time < gameTime - 2.6) {
        timeHistory.shift();
      }
    }
  } else {
    // ------------------------------------------
    // PAUSE TIME POWER (UP TO 3 SECONDS)
    // ------------------------------------------
    updateTimeFreeze(dt, humKey);
  }
  return false;
}

function updateMovingPlatforms(p) {
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
}

function handleLadderMovement(p, dt, leftPressed, rightPressed, upPressed, downPressed) {
  const nearbyLadder = (level.ladders || []).find(l =>
    p.x + p.w > l.x - 3 &&
    p.x < l.x + l.w + 3 &&
    p.y + p.h >= l.y - 4 &&
    p.y <= l.y + l.h - p.h + 4
  );
  const climb = (upPressed ? -1 : 0) + (downPressed ? 1 : 0);
  const hiddenLadder = level.hiddenLadder;
  const discoverHiddenLadder = Boolean(
    hiddenLadder &&
    !hiddenLadder.revealed &&
    level.gateEvent?.phase === 'returned' &&
    p.grounded &&
    upPressed &&
    p.y + p.h >= FLOOR - 4 &&
    p.x + p.w > hiddenLadder.x - 18 &&
    p.x < hiddenLadder.x + hiddenLadder.w + 18
  );
  if (discoverHiddenLadder) hiddenLadder.revealed = true;
  const nearRevealedLadder = hiddenLadder?.revealed &&
    p.x + p.w > hiddenLadder.x - 3 &&
    p.x < hiddenLadder.x + hiddenLadder.w + 3 &&
    p.y + p.h >= hiddenLadder.y - 4 &&
    p.y <= hiddenLadder.y + hiddenLadder.h - p.h + 60
    ? hiddenLadder
    : null;
  const ladder = p.ladder || nearbyLadder || nearRevealedLadder;

  if (ladder && (p.onLadder || climb !== 0) && !(leftPressed || rightPressed)) {
    const canClimb = climb < 0
      ? p.y > ladder.y - p.h
      : climb > 0 && p.y < ladder.y + ladder.h - p.h;
    setLadderSoundActive(canClimb);
    p.onLadder = true;
    p.ladder = ladder;
    p.x = ladder.x + (ladder.w - p.w) / 2;
    p.vx = 0;
    p.vy = 0;
    p.grounded = false;

    if (climb !== 0) {
      p.y += climb * 150 * dt;
      if (climb < 0 && p.y <= ladder.y - p.h) {
        p.y = ladder.y - p.h;
        p.grounded = true;
        p.onLadder = false;
        p.ladder = null;
      } else if (climb > 0 && p.y >= ladder.y + ladder.h - p.h) {
        p.y = ladder.y + ladder.h - p.h;
        p.grounded = true;
        p.onLadder = false;
        p.ladder = null;
      }
    }

    lastJump = upPressed;
    updateCamera();
    updateTraps(dt);
    updateExitSwitch();
    if (state === 'play' && !level.door.locked && overlap(p, level.door)) win();
    return true;
  }

  setLadderSoundActive(false);
  if (p.onLadder) {
    p.onLadder = false;
    p.ladder = null;
  }
  return false;
}

function updateDoorModePhysics(dt, move, now, worldDt, p) {
  const d = level.door;
  const spd = sprinting ? DOOR_SPEED * SPRINT_MULT : DOOR_SPEED;
  const carry = updateSprintCarry(dt, move, DOOR_SPEED);
  d.x = constrain(d.x + (move * spd + carry) * dt, level.leftBound, level.worldW - 4 - d.w);
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
      if (q.kind === 'crumble' && !q.timer) q.timer = gameTime;
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
  updateTraps(worldDt);

  if (d.y > H + 20) die();

  if (state === 'play' && overlap(p, d)) {
    if (doorHumOpen >= 0.4) {
      win();
    } else {
      showMessage('HUM TO OPEN THE DOOR!', 800);
    }
  }
}

function resolvePlayerPlatformCollisions(p, dt, oldX, oldY, worldDt) {
  for (const q of level.platforms) {
    if (!isSolid(q) || q.y >= FLOOR || !overlap(p, q)) continue;

    if (oldX + p.w <= q.x + 2) {
      p.x = q.x - p.w;
    } else if (oldX >= q.x + q.w - 2) {
      p.x = q.x + q.w;
    }
  }

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
      if (q.kind === 'conveyor') p.x += 85 * worldDt;
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
}

function updatePlayerFootsteps(p, dt) {
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
}

function updateCrumblingPlatforms() {
  for (const q of level.platforms) {
    if (q.kind === 'crumble' && q.timer && gameTime - q.timer > 0.56) {
      q.gone = true;
    }
  }
}

function updateGame(dt, now) {
  const humKey = keyAny('h', 'H');
  if (handleVoicePowers(dt, humKey)) return;

  const worldDt = timeFreezeActive ? 0 : dt;
  gameTime += worldDt;
  const p = player;

  if (updateGateRelocation(worldDt)) {
    setLadderSoundActive(false);
    return;
  }

  updateMovingPlatforms(p);

  const body = controlled();
  const reversed = level.traps.some(t =>
    t.type === 'reverse' &&
    t.active &&
    body.x + body.w > t.x &&
    body.x < t.x + t.w
  );

  // ------------------------------------------
  // INPUT SYSTEM: ARROW KEYS & WASD
  // ------------------------------------------
  const rightPressed = keyAny(RIGHT_ARROW, 39, 'ArrowRight', 68, 'KeyD', 'd');
  const leftPressed = keyAny(LEFT_ARROW, 37, 'ArrowLeft', 65, 'KeyA', 'a');
  const downPressed = keyAny(DOWN_ARROW, 40, 'ArrowDown', 83, 'KeyS', 's');
  const upPressed = keyAny(UP_ARROW, 38, 'ArrowUp', 87, 'KeyW', 'w', 32, ' ', 'Space');
  const shiftDown = keyAny(SHIFT, 16, 'ShiftLeft', 'ShiftRight');

  if (
    messageDismissOnMove &&
    (leftPressed || rightPressed || upPressed || downPressed)
  ) {
    messageUntil = now;
    messageDismissOnMove = false;
  } else if (
    !messageDismissOnMove &&
    now < messageUntil &&
    (leftPressed || rightPressed || upPressed || downPressed)
  ) {
    messagePinned = true;
  }

  if (handleLadderMovement(p, dt, leftPressed, rightPressed, upPressed, downPressed)) {
    return;
  }

  let move = 0;
  if (rightPressed || leftPressed) {
    move = (rightPressed ? 1 : 0) - (leftPressed ? 1 : 0);
  }

  if (reversed) move *= -1;

  // Jump Input: Arrow Up, W, or Space buffers a jump
  if (upPressed && !lastJump && (!p.ladder || leftPressed || rightPressed)) {
    jumpQueuedUntil = now + 155;
  }
  lastJump = upPressed;

  updateStamina(dt, move !== 0, shiftDown);

  if (level.doorMode) {
    updateDoorModePhysics(dt, move, now, worldDt, p);
    return;
  }

  const reverseMultiplier = reversed ? 1.5 : 1;
  const spd = (sprinting ? RUN_SPEED * SPRINT_MULT : RUN_SPEED) * reverseMultiplier;
  const carry = updateSprintCarry(dt, move, RUN_SPEED, reverseMultiplier);
  const drift = p.grounded && move !== 0
    ? (noise(gameTime * 1.7, levelIndex * 13) - 0.5) * DRIFT_AMOUNT
    : 0;
  p.vx = move * spd + carry + drift;
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
  const rightBound = level.worldW - p.w;
  p.x = constrain(p.x + p.vx * dt, level.leftBound, rightBound);

  resolvePlayerPlatformCollisions(p, dt, oldX, oldY, worldDt);

  updatePlayerFootsteps(p, dt);
  landImpulse = max(0, landImpulse - dt * 4.6);

  updateCrumblingPlatforms();

  updateCamera();
  updateTraps(worldDt, { x: oldX, y: oldY });

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
  updateTraps(dt);
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

function checkTrapTrigger(t, victim, dt) {
  if (t.waitNearSpike && !t.active) {
    const spike = level.traps.find(candidate => candidate.type === 'pop');
    const nearSpike = spike &&
      victim.x + victim.w >= spike.x - 88 &&
      victim.x <= spike.x + spike.w + 88 &&
      victim.y + victim.h >= FLOOR - 4;

    t.nearTimer = nearSpike ? (t.nearTimer || 0) + dt : 0;
    if (t.nearTimer > 1.5) {
      t.active = true;
      t.timer = gameTime;
      t.x = t.sweepDirection === 1
        ? max(level.leftBound, victim.x - random(180, 260))
        : min(victim.x + random(180, 260), level.worldW - t.w - 12);
      showMessage('WALL INCOMING. MOVE!', 1200);
    }
  }

  if (!t.waitNearSpike && !t.active && victim.x + victim.w >= t.trigger) {
    t.active = true;
    t.timer = gameTime - (t.phase || 0);

    if (t.type === 'reverse') {
      showMessage('REVERSED. 50% FASTER!', 1400);
    } else if (t.type === 'vanish') {
      showMessage('LOOK DOWN!', 1400);
    } else if (t.type === 'chaseWall') {
      t.x = t.sweepDirection === 1
        ? max(level.leftBound, victim.x - random(180, 260))
        : min(victim.x + random(180, 260), level.worldW - t.w - 12);
      showMessage('WALL INCOMING. JUMP!', 1200);
    }
  }
}

function updateChaseWall(t, dt, age, previousPlayer) {
  if (!t.active || t.done) return;

  const oldWallX = t.x;
  const oldValue = t.value || 0;
  const oldWallTop = t.y - t.h * oldValue;
  const wasRiding = previousPlayer &&
    oldValue >= 1 &&
    abs(previousPlayer.y + player.h - oldWallTop) <= 4 &&
    previousPlayer.x + player.w > oldWallX &&
    previousPlayer.x < oldWallX + t.w;

  t.value = min(1, age / 0.3);
  if (age >= 1.3) {
    t.x = t.sweepDirection === 1
      ? min(t.stopX ?? level.worldW - t.w, t.x + RUN_SPEED * 2 * dt)
      : max(t.stopX ?? 0, t.x - RUN_SPEED * 2 * dt);
  }

  const wall = {
    x: t.x,
    y: t.y - t.h * t.value,
    w: t.w,
    h: t.h * t.value
  };

  if (previousPlayer && t.value >= 1 && player.vy >= 0 &&
      previousPlayer.y + player.h <= wall.y + 8 &&
      player.y + player.h >= wall.y &&
      player.x + player.w > wall.x && player.x < wall.x + wall.w) {
    player.y = wall.y - player.h;
    player.vy = 0;
    player.grounded = true;
  } else if (wasRiding && player.vy >= 0) {
    player.x += t.x - oldWallX;
    player.y = wall.y - player.h;
    player.vy = 0;
    player.grounded = true;
  } else if (t.value >= 1) {
    const verticalOverlap =
      player.y < wall.y + wall.h && player.y + player.h > wall.y;
    const wasLeft = previousPlayer &&
      previousPlayer.x + player.w <= oldWallX + 1;
    const wasRight = previousPlayer &&
      previousPlayer.x >= oldWallX + t.w - 1;
    const crossedFromLeft = wasLeft &&
      wall.x - (player.x + player.w) <= 0;
    const crossedFromRight = wasRight &&
      player.x - (wall.x + t.w) <= 0;

    if (verticalOverlap &&
        (overlap(player, wall) || crossedFromLeft || crossedFromRight)) {
      if (wasLeft || (!wasRight && player.x + player.w / 2 < wall.x + wall.w / 2)) {
        player.x = wall.x - player.w;
        player.vx = min(player.vx, -RUN_SPEED * 2);
      } else {
        player.x = wall.x + wall.w;
        player.vx = max(player.vx, RUN_SPEED * 2);
      }
    }
  }

  if (t.x + t.w < level.leftBound) t.done = true;
}

function updatePopTrap(t, age, victim) {
  if (!t.active) return;
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

function updateFallTrap(t, age, victim) {
  if (!t.active) return;
  t.value = age < 0.47
    ? 0
    : min(FLOOR - t.h - t.y, (age - 0.47) * 360);

  if (overlap(victim, { ...t, y: t.y + t.value })) {
    die();
  }
}

function updateSawTrap(t, victim) {
  const ph = t.phase || 0;
  const sweep = sin((gameTime - ph) * 2.2);
  t.value = sweep < 0
    ? sweep * (t.leftTravel || 92)
    : sweep * (t.rightTravel || 92);
  if (circleRect(t.x + t.value + t.w / 2, t.y + t.h / 2, t.w * 0.43, victim)) {
    die();
  }
}

function updateLaserTrap(t, age, victim) {
  if (t.active && age > 0.68 && age % 2.05 < 1.08 && overlap(victim, t)) {
    die();
  }
}

function updateSpringTrap(t) {
  if (!level.doorMode && player.vy >= 0 && overlap(player, { x: t.x, y: t.y - 7, w: t.w, h: 16 })) {
    player.y = t.y - player.h;
    player.vy = t.boostMultiplier
      ? JUMP_V * t.boostMultiplier
      : -550;
    player.grounded = false;
    burst(t.x + t.w / 2, t.y, C.green, 8);
    if (t.boostMultiplier) showMessage('SPRING BOOST!', 900);
  }
}

function updateVanishTrap(t, age) {
  if (t.active && age > 0.42) {
    const q = level.platforms.find(p => p.kind === 'vanish');
    if (q) q.gone = true;
  }
}

function updateFakeTrap(t) {
  if (overlap(player, t)) {
    showMessage('NICE TRY. WRONG DOOR.', 1400);
  }
}

function updateTraps(dt = 0, previousPlayer = null) {
  const victim = controlled();

  for (const t of level.traps) {
    checkTrapTrigger(t, victim, dt);
    const age = gameTime - t.timer;

    switch (t.type) {
      case 'chaseWall':
        updateChaseWall(t, dt, age, previousPlayer);
        break;
      case 'pop':
        updatePopTrap(t, age, victim);
        break;
      case 'fall':
        updateFallTrap(t, age, victim);
        break;
      case 'saw':
        updateSawTrap(t, victim);
        break;
      case 'laser':
        updateLaserTrap(t, age, victim);
        break;
      case 'spring':
        updateSpringTrap(t);
        break;
      case 'vanish':
        updateVanishTrap(t, age);
        break;
      case 'fake':
        updateFakeTrap(t);
        break;
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
  playDeathSound();
  burst(b.x + b.w / 2, b.y + b.h / 2, C.danger, 16);
}

function win() {
  if (state !== 'play') return;
  state = 'won';
  playGateSound();
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
      natureUnlocked = true;
      GameStorage.set('larpdevil.natureUnlocked', 'true');
      enterEnding();
      return;
    }
    if (levelIndex === 1) {
      // Completed Level 2 -> Unlock Voice Powers and prompt compulsory hum setup
      levelIndex = 2;
      tutorialReturnState = 'play';
      state = 'tutorialAudio';
      resetLevel(false);
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
  player.y = FLOOR - player.h;
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
    player.y = FLOOR - player.h;
    walkCycle += dt * 13;
    stepTimer -= dt;
    if (stepTimer <= 0) {
      stepTimer = 0.5;
      dustPuff(player.x, FLOOR, 2, 26, 3, C.grass);
    }
  } else {
    player.vx = 0;
  }
}

function burst(x, y, color, count) {
  if (!gameSettings.particles) return;

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
  if (!gameSettings.particles) return;

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
  shake = gameSettings.screenShake ? max(0, shake - dt * 25) : 0;
}

function showMessage(s, duration) {
  const isNewNotification = message !== s || millis() >= messageUntil;
  message = s;
  messageUntil = millis() + duration;
  messageShownAt = millis();
  messageDismissOnMove = false;
  const body = controlled();
  messagePinned = abs(body.vx || 0) > 12 || Boolean(body.moving);
  if (isNewNotification) playNotificationSound();
}

function drawTimeFreezeWorldOverlay() {
  push();
  noStroke();
  // Soft monochrome stasis vignette around the edges
  fill(30, 35, 45, 55);
  rect(0, 0, FIELD.w, 10);
  rect(0, FIELD.h - 10, FIELD.w, 10);
  rect(0, 0, 10, FIELD.h);
  rect(FIELD.w - 10, 0, 10, FIELD.h);

  // Subtle pulsing border
  stroke(220, 230, 245, 140 + 60 * sin(millis() * 0.012));
  strokeWeight(2);
  noFill();
  rect(3, 3, FIELD.w - 6, FIELD.h - 6, 4);
  pop();
}

function drawTimeFreezeHUD() {
  push();
  const bannerW = 230;
  const bannerH = 42;
  const bx = (FIELD.w - bannerW) / 2;
  const by = 12;

  noStroke();
  fill(37, 39, 44, 235);
  rect(bx, by, bannerW, bannerH, 8);

  stroke('#8ae2ff');
  strokeWeight(1.5);
  noFill();
  rect(bx, by, bannerW, bannerH, 8);
  noStroke();

  fill('#8ae2ff');
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(11);
  text(`❄ TIME FROZEN (${timeFreezeLeft.toFixed(1)}s) ❄`, FIELD.w / 2, by + 14);

  // Depleting gauge
  fill('#20242a');
  rect(bx + 14, by + 26, bannerW - 28, 7, 3.5);

  const pct = constrain(timeFreezeLeft / TIME_FREEZE_MAX, 0, 1);
  fill('#8ae2ff');
  rect(bx + 14, by + 26, (bannerW - 28) * pct, 7, 3.5);
  textStyle(NORMAL);
  pop();
}

function drawRewindWorldOverlay() {
  push();
  noStroke();
  // VHS rewind scanlines
  fill(140, 90, 220, 32);
  for (let y = 0; y < FIELD.h; y += 8) {
    rect(0, y, FIELD.w, 3);
  }

  // Cyan/purple pulsing border
  stroke('#b27cff');
  strokeWeight(2.5);
  noFill();
  rect(3, 3, FIELD.w - 6, FIELD.h - 6, 4);
  pop();
}

function drawRewindHUD() {
  push();
  const bannerW = 240;
  const bannerH = 40;
  const bx = (FIELD.w - bannerW) / 2;
  const by = 12;

  noStroke();
  fill(37, 39, 44, 235);
  rect(bx, by, bannerW, bannerH, 8);

  stroke('#b27cff');
  strokeWeight(1.5);
  noFill();
  rect(bx, by, bannerW, bannerH, 8);
  noStroke();

  fill('#dcb5ff');
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(12);
  text('⏪ REWINDING TIME (-2.0s) ⏪', FIELD.w / 2, by + bannerH / 2);
  textStyle(NORMAL);
  pop();
}

function drawScene() {
  background(C.ink);

  const fieldContext = drawingContext;
  fieldContext.save();
  fieldContext.beginPath();
  fieldContext.rect(0, 0, FIELD.w, FIELD.h);
  fieldContext.clip();

  if (timeFreezeActive) {
    fieldContext.filter = 'grayscale(100%) contrast(108%) brightness(92%)';
  } else if (rewindActive) {
    fieldContext.filter = 'hue-rotate(220deg) contrast(125%) brightness(105%)';
  } else {
    fieldContext.filter = 'none';
  }

  fill(C.sky);
  rect(0, 0, FIELD.w, FIELD.h);

  push();
  translate(
    -camX + (shake ? random(-shake, shake) : 0),
    shake ? random(-shake, shake) : 0
  );
  drawWorld();
  pop();

  if (timeFreezeActive) {
    drawTimeFreezeWorldOverlay();
  } else if (rewindActive) {
    drawRewindWorldOverlay();
  }

  fieldContext.restore();
  drawingContext.filter = 'none';

  if (timeFreezeActive) {
    drawTimeFreezeHUD();
  } else if (rewindActive) {
    drawRewindHUD();
  }

  noStroke();
  fill(37, 39, 44, 218);
  const levelLabel = `LEVEL ${String(levelIndex + 1).padStart(2, '0')} / 12  ${level.title}`;
  textSize(11);
  const hudW = max(226, textWidth(levelLabel) + 26);
  rect(12, 12, hudW, 48, 8);

  fill(C.amber);
  textSize(17);
  textStyle(BOLD);
  textAlign(LEFT, CENTER);
  text('LARP DEVIL', 23, 28);
  fill(C.white);
  textStyle(NORMAL);
  textSize(11);
  text(levelLabel, 23, 48);

  const deathsLabel = `DEATHS ${deaths}`;
  const deathsW = textWidth(deathsLabel) + 28;
  fill(37, 39, 44, 218);
  rect(FIELD.w - deathsW - 12, 12, deathsW, 38, 8);
  fill(C.white);
  textAlign(CENTER, CENTER);
  text(deathsLabel, FIELD.w - deathsW / 2 - 12, 31);
  textAlign(LEFT, CENTER);

  drawControls();

  if (state === 'dead' || (state === 'won' && winPhase === 3 && winT >= WIN_HOLD * 0.45)) {
    fill(37, 39, 44, 185);
    rect(0, FIELD.y, FIELD.w, FIELD.h);

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
    y: 190,
    w,
    h: 108
  };
}

function themeRect(i) {
  const w = 164, h = 54, gap = 12;
  const total = THEMES.length * w + (THEMES.length - 1) * gap;
  return {
    x: FIELD.x + (FIELD.w - total) / 2 + i * (w + gap),
    y: 348,
    w,
    h
  };
}

function selectTheme(i) {
  if (i < 0 || i >= THEMES.length || (i === 2 && !natureUnlocked)) return;
  themeIndex = i;
  GameStorage.set('larpdevil.theme', THEMES[i]);
}

function cycleTheme(direction) {
  const available = natureUnlocked ? THEMES.length : THEMES.length - 1;
  themeIndex = (themeIndex + direction + available) % available;
  selectTheme(themeIndex);
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
  GameStorage.set('larpdevil.skin', skinIndex);
  GameStorage.set('larpdevil.theme', THEMES[themeIndex]);
  levelIndex = 0;
  levelAttempts.fill(0);
  resetLevel();
}

function drawTitle() {
  background(C.ink);
  drawBackdrop();

  buttons = [];

  const center = FIELD.w / 2;
  noStroke();
  fill(37, 39, 44, 218);
  rect(center - 345, 48, 690, 500, 16);

  noStroke();
  textAlign(CENTER, CENTER);
  fill(C.white);
  textStyle(BOLD);
  textSize(42);
  text('LARP DEVIL', center, 91);

  textStyle(NORMAL);
  textSize(13);
  fill(C.white);
  text('The exit is a suggestion. Reach the green door anyway.', center, 126);

  textSize(11);
  fill('#d0c8b7');
  text('CHOOSE YOUR SKIN', center, 158);

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

    drawMiniPlayer(r.x + r.w / 2, r.y + 62, 1.05, sk);

    fill(sel ? C.white : C.ink);
    textStyle(sel ? BOLD : NORMAL);
    textSize(10);
    textAlign(CENTER, CENTER);
    text(sk.name, r.x + r.w / 2, r.y + 80);

    if (sel && titleFocus === 'skin') {
      fill(C.amber);
      textSize(13);
      text('▾', r.x + r.w / 2, r.y - 12);
    }
  });

  fill('#d0c8b7');
  textSize(11);
  text('CHOOSE YOUR THEME', center, 322);

  THEMES.forEach((name, i) => {
    const r = themeRect(i);
    const selected = i === themeIndex;
    const locked = i === 2 && !natureUnlocked;

    noStroke();
    if (selected) fill(C.ink);
    else if (locked) fill('#353239');
    else fill(255, 251, 239, 150);
    rect(r.x, r.y, r.w, r.h, 8);

    noFill();
    stroke(selected ? C.amber : locked ? '#625c64' : C.line);
    strokeWeight(selected ? 2 : 1);
    rect(r.x, r.y, r.w, r.h, 8);
    noStroke();

    const preview = i === 0 ? '#d5c4a4' : i === 1 ? '#a74e58' : '#79b268';
    fill(locked ? '#76756f' : preview);
    rect(r.x + 12, r.y + 12, 28, 28, 5);
    fill(selected ? C.white : locked ? '#d0c8b7' : C.ink);
    textStyle(selected ? BOLD : NORMAL);
    textAlign(LEFT, CENTER);
    textSize(11);
    text(name.toUpperCase(), r.x + 50, r.y + 20);
    textSize(9);
    fill(locked ? '#c0b8a8' : selected ? C.amber : C.muted);
    text(locked ? 'FINISH LEVEL 12' : selected ? 'SELECTED' : 'SELECT', r.x + 50, r.y + 37);
    textStyle(NORMAL);

    if (selected) {
      fill(C.amber);
      textAlign(RIGHT, CENTER);
      textSize(14);
      text('✓', r.x + r.w - 12, r.y + r.h / 2);
      if (titleFocus === 'theme') {
        textAlign(CENTER, CENTER);
        textSize(13);
        text('▾', r.x + r.w / 2, r.y - 12);
      }
    }
  });

  uiButton(center - 72, 438, 144, 36, 'BEGIN  ⏎', 'accent', beginTutorial);
  if (titleFocus === 'begin') {
    noFill();
    stroke(C.white);
    strokeWeight(2);
    rect(center - 76, 434, 152, 44, 7);
    noStroke();
  }
  fill('#d0c8b7');
  textAlign(CENTER, CENTER);
  textSize(10);
  text('↑ / ↓ MOVE   ← / → SELECT   ENTER BEGIN', center, 497);
}

function beginTutorial() {
  tutorialReturnState = 'start';
  state = 'tutorialControls';
}

function drawTutorial() {
  background(C.ink);
  drawBackdrop();
  noStroke();
  fill(37, 39, 44, 115);
  rect(0, 0, width, height);
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
  text(audioPage ? 'VOICE POWERS' : 'MOVEMENT CONTROLS', x + cardW - 24, y + 45);

  fill(C.white);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(cardW < 360 ? 16 : cardW < 440 ? 22 : 27);
  text(audioPage ? 'CHOOSE YOUR ABILITY' : 'LEARN THE BASICS', x + cardW / 2, y + 91);
  textStyle(NORMAL);
  fill('#c4c0b6');
  textSize(cardW < 500 ? 11 : 13);
  const subtitle = audioPage
    ? 'Choose your power, then record a continuous 3-second hum whole to calibrate.'
    : 'A few controls are all you need to get moving.';
  const subtitleLines = [''];
  for (const word of subtitle.split(/\s+/)) {
    const current = subtitleLines[subtitleLines.length - 1];
    const next = current ? `${current} ${word}` : word;
    if (current && textWidth(next) > cardW - 56) subtitleLines.push(word);
    else subtitleLines[subtitleLines.length - 1] = next;
  }
  subtitleLines.forEach((line, i) => {
    text(line, x + cardW / 2, y + 122 + (i - (subtitleLines.length - 1) / 2) * 14);
  });

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
    ['HUM  /  H', 'Trigger chosen voice power (1x/level)']
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
  text('Move with keyboard. Voice powers unlock after Level 2.', x + cardW / 2, y + cardH - 94);

  uiButton(x + cardW / 2 - 80, y + cardH - 64, 160, 36, 'START GAME', 'accent', () => {
    startGame();
  });
}

function drawAudioTutorial(x, y, cardW, cardH) {
  const center = x + cardW / 2;
  const footerY = y + cardH - 64;

  // Step 1: Select Voice Power (Two Cards side by side)
  const cardW_each = floor((cardW - 60) / 2);
  const card1X = x + 24;
  const card2X = card1X + cardW_each + 12;
  const cardsY = y + 160;
  const cardsH = 76;

  // Card 1: Pause Time
  const isPause = selectedVoicePower === 'pause';
  fill(isPause ? '#3a3e44' : '#292b2e');
  rect(card1X, cardsY, cardW_each, cardsH, 8);
  stroke(isPause ? C.amber : '#43474d');
  strokeWeight(isPause ? 2 : 1);
  noFill();
  rect(card1X, cardsY, cardW_each, cardsH, 8);
  noStroke();

  buttons.push({
    x: card1X, y: cardsY, w: cardW_each, h: cardsH,
    action: () => { selectedVoicePower = 'pause'; }
  });

  fill(isPause ? C.amber : C.white);
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(12);
  text('❄ PAUSE TIME (3s)', card1X + 14, cardsY + 12);
  textStyle(NORMAL);
  fill('#c4c0b6');
  textSize(10);
  text('Freeze traps & time while humming.\nWorld turns grayscale. Unlocks 1s at Lvl 3.', card1X + 14, cardsY + 32);
  if (isPause) {
    textAlign(RIGHT, TOP);
    fill(C.amber);
    textStyle(BOLD);
    textSize(10);
    text('SELECTED ✓', card1X + cardW_each - 12, cardsY + 12);
    textStyle(NORMAL);
  }

  // Card 2: Reverse Time by 2s
  const isRewind = selectedVoicePower === 'rewind';
  fill(isRewind ? '#3a3e44' : '#292b2e');
  rect(card2X, cardsY, cardW_each, cardsH, 8);
  stroke(isRewind ? '#b27cff' : '#43474d');
  strokeWeight(isRewind ? 2 : 1);
  noFill();
  rect(card2X, cardsY, cardW_each, cardsH, 8);
  noStroke();

  buttons.push({
    x: card2X, y: cardsY, w: cardW_each, h: cardsH,
    action: () => { selectedVoicePower = 'rewind'; }
  });

  fill(isRewind ? '#b27cff' : C.white);
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(12);
  text('⏪ REVERSE TIME (2s)', card2X + 14, cardsY + 12);
  textStyle(NORMAL);
  fill('#c4c0b6');
  textSize(10);
  text('Hum to rewind time & position 2s back.\nEscape surprise traps and pits.', card2X + 14, cardsY + 32);
  if (isRewind) {
    textAlign(RIGHT, TOP);
    fill('#b27cff');
    textStyle(BOLD);
    textSize(10);
    text('SELECTED ✓', card2X + cardW_each - 12, cardsY + 12);
    textStyle(NORMAL);
  }

  // Step 2: 3-Second Whole Hum Calibration Module
  const calBoxX = x + 24;
  const calBoxW = cardW - 48;
  const calBoxY = cardsY + cardsH + 12;
  const calBoxH = 110;

  fill('#242629');
  rect(calBoxX, calBoxY, calBoxW, calBoxH, 10);
  stroke('#3f4349');
  strokeWeight(1);
  noFill();
  rect(calBoxX, calBoxY, calBoxW, calBoxH, 10);
  noStroke();

  textAlign(LEFT, TOP);
  fill(C.amber);
  textSize(11);
  textStyle(BOLD);
  text('COMPULSORY: RECORD 3-SECOND HUM WHOLE TO CALIBRATE', calBoxX + 16, calBoxY + 14);
  textStyle(NORMAL);

  if (micState !== 'on') {
    uiButton(calBoxX + 16, calBoxY + 44, 200, 36, 'ENABLE MICROPHONE', 'accent', () => enableMic());
    fill('#c4c0b6');
    textAlign(LEFT, CENTER);
    textSize(10);
    text('Microphone is required to calibrate your hum. (Hold [H] works as keyboard fallback)', calBoxX + 230, calBoxY + 62);
  } else {
    const btnW = 180;
    const btnLabel = humCalibration.recording
      ? 'RECORDING HUM...'
      : humCalibration.recorded
        ? 'RE-RECORD 3S HUM'
        : 'START 3S RECORDING';
    const btnStyle = humCalibration.recording ? 'on' : humCalibration.recorded ? '' : 'accent';

    uiButton(calBoxX + 16, calBoxY + 44, btnW, 36, btnLabel, btnStyle, () => startHumCalibration());

    // 3-Second Progress Bar
    const barX = calBoxX + btnW + 24;
    const barW = calBoxW - btnW - 40;
    const barY = calBoxY + 54;
    const barH = 12;

    fill('#181a1c');
    rect(barX, barY, barW, barH, 6);

    const pct = humCalibration.recorded ? 1.0 : constrain(humCalibration.progress / humCalibration.target, 0, 1);
    const barCol = humCalibration.recorded
      ? C.green
      : humCalibration.recording && isHumming
        ? '#8ae2ff'
        : C.amber;
    fill(barCol);
    rect(barX, barY, max(4, barW * pct), barH, 6);

    // Readout status
    fill(humCalibration.recorded ? C.green : humCalibration.recording && isHumming ? '#8ae2ff' : C.white);
    textAlign(LEFT, CENTER);
    textSize(10);
    text(humCalibration.statusMessage, barX, calBoxY + 38);

    if (humCalibration.recorded) {
      fill('#a0a5ad');
      textSize(9);
      text(`Selected: [${selectedVoicePower === 'pause' ? 'PAUSE TIME' : 'REVERSE TIME'}] • Calibrated! You may proceed to Level 3.`, barX, calBoxY + 76);
    } else if (humCalibration.recording) {
      fill('#c4c0b6');
      textSize(9);
      text(`Progress: ${humCalibration.progress.toFixed(1)}s / 3.0s • Hold steady whole without stopping!`, barX, calBoxY + 76);
    } else {
      fill('#8e9299');
      textSize(9);
      text('Click start, then sustain a continuous hum for 3 full seconds whole.', barX, calBoxY + 76);
    }
  }

  // Notes
  fill('#aaa69b');
  textAlign(CENTER, TOP);
  textSize(10);
  text('• Selected power improves every few levels (Lvl 3: 1s, Lvl 7: 2s, Lvl 10: 3s). Single use per reset.', center, calBoxY + calBoxH + 12);

  // Compulsory Footer Buttons (Cannot proceed until calibrated)
  if (humCalibration.recorded) {
    const action = tutorialReturnState === 'play' ? resumeGame : startGame;
    const label = tutorialReturnState === 'play' ? 'PROCEED TO LEVEL 3  ⏎' : 'START GAME  ⏎';
    uiButton(center - 110, footerY, 220, 36, label, 'accent', action);
  } else {
    // Disabled / Locked button
    fill('#2a2c30');
    rect(center - 150, footerY, 300, 36, 5);
    stroke('#444850');
    strokeWeight(1);
    noFill();
    rect(center - 150, footerY, 300, 36, 5);
    noStroke();

    fill('#888c94');
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(10);
    text('COMPLETE 3S HUM CALIBRATION TO PROCEED', center, footerY + 18);
    textStyle(NORMAL);
  }
}

function resumeGame() {
  jumpQueuedUntil = 0;
  state = 'play';
}

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
  roundPath(fx, fy, fw, fh, 11);
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

  noFill();
  stroke(46, 86, 48, 80);
  strokeWeight(2);
  roundPath(fx, fy, fw, fh, 11);
  drawingContext.stroke();
  noStroke();
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

  if (themeIndex !== 2) {
    const fog = ctx.createLinearGradient(0, fy + fh - 112, 0, fy + fh);
    fog.addColorStop(0, 'rgba(248, 222, 170, 0)');
    fog.addColorStop(1, 'rgba(248, 222, 170, 0.38)');
    ctx.fillStyle = fog;
    ctx.fillRect(fx, fy + fh - 112, fw, 112);
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

  noFill();
  stroke(58, 52, 42, 90);
  strokeWeight(2);
  roundPath(fx, fy, fw, fh, 11);
  drawingContext.stroke();
  noStroke();
}

function drawWorld() {
  drawBackdrop();

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
    drawLadder(ladder);
  }
  if (level.hiddenLadder?.revealed) drawLadder(level.hiddenLadder);

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

  const open = max(level.doorMode ? doorHumOpen : 0, winOpen * (1 - winClose));

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
  if (state === 'play' && millis() < messageUntil) {
    drawCharacterMessage(message, messagePinned);
  }

  for (const p of particles) {
    fill(p.color);
    rect(p.x, p.y, p.s, p.s);
  }
}

function drawCharacterMessage(content, pinned = false) {
  const p = player;
  const fontSize = 9;
  const lineHeight = 12;
  const paddingX = 8;
  const paddingY = 7;
  const maxWidth = min(240, FIELD.w - 32);
  const innerWidth = maxWidth - paddingX * 2;
  const lines = [];

  textFont('monospace');
  textSize(fontSize);
  textStyle(BOLD);
  for (const paragraph of content.split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && textWidth(candidate) > innerWidth) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
  }

  const boxW = min(maxWidth, max(112, max(lines.map(line => textWidth(line))) + paddingX * 2));
  const boxH = lines.length * lineHeight + paddingY * 2;
  const above = !pinned && p.y > boxH + 36;
  const targetX = pinned ? camX + FIELD.w / 2 : p.x + p.w / 2;
  const targetY = pinned ? FIELD.y + 68 : above ? p.y : p.y + p.h;
  const boxX = pinned
    ? camX + (FIELD.w - boxW) / 2
    : constrain(targetX - boxW / 2, camX + 12, camX + FIELD.w - boxW - 12);
  const boxY = pinned
    ? targetY
    : above
      ? max(10, targetY - boxH - 20)
      : min(FIELD.h - boxH - 10, targetY + 20);
  const anchorX = constrain(targetX, boxX + 14, boxX + boxW - 14);
  const edgeY = above ? boxY + boxH : boxY;
  const tailDirection = above ? 1 : -1;
  const popProgress = constrain((millis() - messageShownAt) / 130, 0, 1);
  const popScale = 0.84 + 0.16 * (1 - sq(1 - popProgress));
  const fade = constrain((messageUntil - millis()) / 180, 0, 1) * (pinned ? 0.58 : 0.72);

  drawingContext.save();
  drawingContext.globalAlpha *= fade;
  push();
  translate(targetX, targetY);
  scale(popScale);
  noStroke();

  if (!pinned) {
    for (let i = 0; i < 7; i++) {
      const width = max(3, 10 - i);
      const y = edgeY + tailDirection * (i * 3) - targetY;
      fill(C.ink);
      rect(anchorX - targetX - width / 2, y, width, 4);
      fill('#f4e8c7');
      rect(anchorX - targetX - max(1, width - 2) / 2, y + 1, max(1, width - 2), 2);
    }
  }

  const x = boxX - targetX;
  const y = boxY - targetY;
  fill('#493a4c');
  rect(x + 3, y + 3, boxW, boxH);
  rect(x, y, boxW, boxH);
  fill('#f4e8c7');
  rect(x + 3, y + 3, boxW - 6, boxH - 6);
  fill('#bd818d');
  rect(x + 3, y + 3, boxW - 6, 2);

  fill(C.ink);
  textSize(fontSize);
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  lines.forEach((line, index) => {
    text(line, x + paddingX, y + paddingY + index * lineHeight);
  });
  textStyle(NORMAL);
  pop();
  drawingContext.restore();
}

function drawLadder(ladder) {
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

function drawPopTrap(t, value) {
  if (!t.active || value <= 0) return;
  fill(C.danger);
  const count = max(1, floor(t.w / 14));
  for (let i = 0; i < count; i++) {
    triangle(
      t.x + i * t.w / count, t.y,
      t.x + (i + 0.5) * t.w / count, t.y - t.h * value,
      t.x + (i + 1) * t.w / count, t.y
    );
  }
}

function drawFallTrap(t, value) {
  const blockY = t.y + value;
  const warning = t.active && gameTime - t.timer < 0.47;
  const spikeCount = max(3, floor(t.w / 10));
  const spikeW = t.w / spikeCount;

  fill(C.danger);
  for (let i = 0; i < spikeCount; i++) {
    const spikeX = t.x + i * spikeW;
    triangle(
      spikeX, blockY + 4,
      spikeX + spikeW / 2, blockY - 3,
      spikeX + spikeW, blockY + 4
    );
  }

  fill('#302d34');
  rect(t.x, blockY, t.w, t.h, 3);
  fill('#493a4c');
  rect(t.x + 2, blockY + 2, t.w - 4, t.h - 4, 2);

  fill(warning ? C.amber : '#bd818d');
  rect(t.x + 2, blockY + 2, t.w - 4, 4);

  if (warning) {
    fill(C.amber);
    textSize(16);
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    text('!', t.x + t.w / 2, blockY + t.h / 2 + 2);
    textStyle(NORMAL);
  }

  fill(C.danger);
  for (let i = 0; i < 3; i++) {
    const spikeY = blockY + 10 + i * 12;
    triangle(t.x + 2, spikeY, t.x - 2, spikeY + 3, t.x + 2, spikeY + 6);
    triangle(t.x + t.w - 2, spikeY, t.x + t.w + 2, spikeY + 3, t.x + t.w - 2, spikeY + 6);
  }

  for (let i = 0; i < spikeCount; i++) {
    const spikeX = t.x + i * spikeW;
    triangle(
      spikeX, blockY + t.h - 1,
      spikeX + spikeW / 2, blockY + t.h + 9,
      spikeX + spikeW, blockY + t.h - 1
    );
  }
}

function drawSawTrap(t, value) {
  const size = t.w / 32;
  push();
  translate(t.x + value + t.w / 2, t.y + t.h / 2);
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
}

function drawLaserTrap(t) {
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
}

function drawSpringTrap(t) {
  fill(C.green);
  rect(t.x, t.y, t.w, t.h + 6, 3);
  fill(C.paper);
  rect(t.x + 5, t.y + 4, t.w - 10, 3);
}

function drawReverseTrap(t) {
  fill(t.active ? C.amberDark : C.muted);
  rect(t.x, t.y + 8, t.w, 4);

  if (t.active) {
    fill(C.amberDark);
    textSize(13);
    textAlign(CENTER, CENTER);
    text('⇄  REVERSED +50% SPEED  ⇄', t.x + t.w / 2, t.y - 12);
  }
}

function drawFakeTrap(t) {
  fill(C.green);
  rect(t.x, t.y, t.w, t.h, 3);
  fill(C.ink);
  rect(t.x + 5, t.y + 6, t.w - 10, t.h - 6, 2);
  fill(C.amber);
  circle(t.x + t.w - 8, t.y + 27, 4);
}

function drawChaseWallTrap(t, value) {
  if (t.active && !t.done && value > 0) {
    const wallY = t.y - t.h * value;
    fill('#493a4c');
    rect(t.x, wallY, t.w, t.h * value, 3);
    fill('#bd818d');
    rect(t.x, wallY + 2, t.w, 3);
  }
}

function drawTrap(t) {
  const value = Number.isFinite(t.value) ? t.value : 0;

  switch (t.type) {
    case 'pop':
      drawPopTrap(t, value);
      break;
    case 'fall':
      drawFallTrap(t, value);
      break;
    case 'saw':
      drawSawTrap(t, value);
      break;
    case 'laser':
      drawLaserTrap(t);
      break;
    case 'spring':
      drawSpringTrap(t);
      break;
    case 'reverse':
      drawReverseTrap(t);
      break;
    case 'fake':
      drawFakeTrap(t);
      break;
    case 'chaseWall':
      drawChaseWallTrap(t, value);
      break;
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
  buttons = [];

  const fw = FIELD.w;
  const R = 16;
  const buttonY = H - 50;
  const row = (bx, bw, label, style, action) => uiButton(bx, buttonY, bw, 34, label, style, action);
  const navX = fw - R - 80;

  row(R, 122, micState === 'on' ? 'VOICE: READY' : 'VOICE SETUP', micState === 'on' ? 'on' : '', () => {
    tutorialReturnState = 'play';
    state = 'tutorialAudio';
  });
  row(R + 130, 72, 'RETRY', '', () => resetLevel());

  const eachW = min(150, max(104, floor((fw - 390) / 2)));
  const gap = 12;
  const totalMetersW = eachW * 2 + gap;
  const startMetersX = (fw - totalMetersW) / 2;

  const stamX = startMetersX;
  const freezeX = startMetersX + eachW + gap;

  // 1. STAMINA (SHIFT SPRINT)
  fill(37, 39, 44, 190);
  rect(stamX - 6, H - 50, eachW + 12, 34, 8);
  fill('#55585b');
  rect(stamX, H - 37, eachW, 7, 3.5);

  const st = stamina / STAM_MAX;
  const barCol = exhausted ? C.danger : st < 0.3 ? C.amberDark : C.green;
  fill(barCol);
  rect(stamX, H - 37, max(4, eachW * st), 7, 3.5);

  fill(exhausted ? C.danger : C.white);
  textAlign(CENTER, CENTER);
  textStyle(exhausted ? BOLD : NORMAL);
  textSize(9);
  text(
    exhausted ? 'WINDED' : sprinting ? 'SPRINTING' : 'SHIFT SPRINT',
    stamX + eachW / 2, H - 44
  );
  textStyle(NORMAL);

  // 2. VOICE POWER METER (PAUSE OR REWIND, OR HUM DOOR IN DOOR MODE)
  fill(37, 39, 44, 190);
  rect(freezeX - 6, H - 50, eachW + 12, 34, 8);
  fill('#55585b');
  rect(freezeX, H - 37, eachW, 7, 3.5);

  if (level.doorMode) {
    if (doorHumOpen > 0) {
      fill('#5bb2a5');
      rect(freezeX, H - 37, max(4, eachW * doorHumOpen), 7, 3.5);
      fill('#5bb2a5');
      textStyle(BOLD);
    } else {
      fill(C.white);
      textStyle(NORMAL);
    }
    textAlign(CENTER, CENTER);
    textSize(9);
    text(
      doorHumOpen >= 0.4 ? '🚪 DOOR OPEN!' : 'HUM: OPEN DOOR',
      freezeX + eachW / 2, H - 44
    );
    textStyle(NORMAL);
  } else if (selectedVoicePower === 'pause') {
    const maxDur = timeFreezeMaxDuration;
    const freezePct = maxDur > 0 ? constrain(timeFreezeLeft / maxDur, 0, 1) : 0;
    if (timeFreezeActive) {
      fill('#8ae2ff');
      rect(freezeX, H - 37, max(4, eachW * freezePct), 7, 3.5);
      fill('#8ae2ff');
      textStyle(BOLD);
    } else if (timeFreezeUsed) {
      fill('#76756f');
      textStyle(NORMAL);
    } else if (maxDur <= 0) {
      fill('#55585b');
      textStyle(NORMAL);
    } else {
      fill(micState === 'on' ? '#5bb2a5' : C.amber);
      rect(freezeX, H - 37, eachW, 7, 3.5);
      fill(C.white);
      textStyle(NORMAL);
    }

    textAlign(CENTER, CENTER);
    textSize(9);
    let pauseLabel = '';
    if (timeFreezeActive) {
      pauseLabel = `❄ FROZEN ${timeFreezeLeft.toFixed(1)}s`;
    } else if (timeFreezeUsed) {
      const usedDisplay = timeFreezeUsedAmount.toFixed(1);
      pauseLabel = `FREEZE USED (${usedDisplay}/3)`;
    } else if (maxDur <= 0) {
      pauseLabel = 'UNLOCKED AT LVL 3';
    } else {
      pauseLabel = `HUM: PAUSE (${Math.round(maxDur)}s)`;
    }

    text(pauseLabel, freezeX + eachW / 2, H - 44);
    textStyle(NORMAL);
  } else {
    // REVERSE TIME (2s)
    if (rewindActive) {
      fill('#b27cff');
      rect(freezeX, H - 37, eachW, 7, 3.5);
      fill('#dcb5ff');
      textStyle(BOLD);
    } else if (timeFreezeUsed) {
      fill('#76756f');
      textStyle(NORMAL);
    } else {
      fill(micState === 'on' ? '#b27cff' : C.amber);
      rect(freezeX, H - 37, eachW, 7, 3.5);
      fill(C.white);
      textStyle(NORMAL);
    }

    textAlign(CENTER, CENTER);
    textSize(9);
    text(
      rewindActive
        ? '⏪ REWINDING 2s'
        : timeFreezeUsed
          ? 'REWIND USED (1/1)'
          : micState === 'on'
            ? 'HUM: REWIND 2s'
            : 'HUM / HOLD "H"',
      freezeX + eachW / 2, H - 44
    );
    textStyle(NORMAL);
  }

  row(navX, 40, '\u2039', '', () => {
    levelIndex = (levelIndex + 11) % 12;
    resetLevel();
  });
  row(navX + 45, 40, '\u203a', '', () => {
    levelIndex = (levelIndex + 1) % 12;
    resetLevel();
  });

  const deathsLabel = `DEATHS ${deaths}`;
  textSize(11);
  const deathsW = textWidth(deathsLabel) + 28;
  const deathsX = fw - deathsW - 12;
  const settingsX = deathsX - 48;
  buttons.push({
    x: settingsX, y: 12, w: 40, h: 38,
    action: () => { settingsOpen = !settingsOpen; }
  });
  noStroke();
  fill(37, 39, 44, 218);
  rect(settingsX, 12, 40, 38, 8);
  if (settingsOpen) {
    noFill();
    stroke(C.green);
    strokeWeight(1.5);
    rect(settingsX + 1, 13, 38, 36, 7);
    noStroke();
  }
  if (gearIcon?.complete && gearIcon.naturalWidth) {
    drawingContext.save();
    drawingContext.filter = 'invert(1)';
    drawingContext.drawImage(gearIcon, settingsX + 7, 18, 26, 26);
    drawingContext.restore();
  }
  drawSettingsPanel(fw, deathsX);
}

function drawSettingsPanel(fieldWidth, deathsX) {
  if (!settingsOpen) return;

  const panelW = 202;
  const panelH = 183;
  const x = max(12, min(fieldWidth - panelW - 12, deathsX + 2));
  const y = 58;

  noStroke();
  fill(37, 39, 44, 238);
  rect(x + 3, y + 3, panelW, panelH, 5);
  fill('#493a4c');
  rect(x, y, panelW, panelH, 5);
  fill(C.paper);
  rect(x + 3, y + 3, panelW - 6, panelH - 6, 3);

  fill(C.ink);
  textAlign(LEFT, CENTER);
  textStyle(BOLD);
  textSize(12);
  text('SETTINGS', x + 12, y + 16);
  textStyle(NORMAL);

  const rowX = x + 9;
  const rowW = panelW - 18;
  const rowH = 29;
  const firstY = y + 30;
  uiButton(rowX, firstY, rowW, rowH, `MUSIC  ${musicEnabled ? 'ON' : 'OFF'}`, musicEnabled ? 'on' : '', () => {
    setMusicEnabled(!musicEnabled);
    GameStorage.set('larpdevil.musicEnabled', musicEnabled);
  });
  uiButton(rowX, firstY + 32, rowW, rowH, `SOUND EFFECTS  ${soundEffectsEnabled ? 'ON' : 'OFF'}`, soundEffectsEnabled ? 'on' : '', () => {
    setSoundEffectsEnabled(!soundEffectsEnabled);
    GameStorage.set('larpdevil.soundEffectsEnabled', soundEffectsEnabled);
  });
  uiButton(rowX, firstY + 64, rowW, rowH, `SCREEN SHAKE  ${gameSettings.screenShake ? 'ON' : 'OFF'}`, gameSettings.screenShake ? 'on' : '', () => {
    gameSettings.screenShake = !gameSettings.screenShake;
    if (!gameSettings.screenShake) shake = 0;
    GameStorage.set('larpdevil.screenShake', gameSettings.screenShake);
  });
  uiButton(rowX, firstY + 96, rowW, rowH, `PARTICLES  ${gameSettings.particles ? 'ON' : 'OFF'}`, gameSettings.particles ? 'on' : '', () => {
    gameSettings.particles = !gameSettings.particles;
    if (!gameSettings.particles) particles = [];
    GameStorage.set('larpdevil.particles', gameSettings.particles);
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
  initAudioContext();
  startBackgroundMusic();

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
        titleFocus = 'skin';
        return false;
      }
    }
    for (let i = 0; i < THEMES.length; i++) {
      const r = themeRect(i);
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
        selectTheme(i);
        titleFocus = 'theme';
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
  if (settingsOpen) settingsOpen = false;
  return false;
}

function touchStarted() {
  initAudioContext();
  startBackgroundMusic();

  if (touches.length) {
    if (state === 'tutorialControls' || state === 'tutorialAudio') {
      return clickAt(touches[0].x, touches[0].y);
    }
    const x = touches[0].x / view.s;
    const y = (touches[0].y - view.oy) / view.s;
    if (state === 'title') {
      for (let i = 0; i < SKINS.length; i++) {
        const r = swatchRect(i);
        if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
          skinIndex = i;
          titleFocus = 'skin';
          return false;
        }
      }
      for (let i = 0; i < THEMES.length; i++) {
        const r = themeRect(i);
        if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
          selectTheme(i);
          titleFocus = 'theme';
          return false;
        }
      }
    }
    return clickAt(x, y);
  }
  return false;
}

function keyPressed() {
  initAudioContext();
  startBackgroundMusic();

  if (settingsOpen && (keyVal() === 'Escape' || codeVal() === 'Escape')) {
    settingsOpen = false;
    return false;
  }

  if (state === 'title') {
    const k = keyVal();
    const c = codeVal();
    const n = codeNum();

    if (c === 'ArrowDown' || k === 'ArrowDown' || n === 40) {
      titleFocus = titleFocus === 'skin' ? 'theme' : 'begin';
      return false;
    }
    if (c === 'ArrowUp' || k === 'ArrowUp' || n === 38) {
      titleFocus = titleFocus === 'begin' ? 'theme' : 'skin';
      return false;
    }

    const direction =
      c === 'ArrowLeft' || k === 'ArrowLeft' || n === 37 || n === 65 ? -1 :
      c === 'ArrowRight' || k === 'ArrowRight' || n === 39 || n === 68 ? 1 :
      0;
    if (direction !== 0) {
      if (titleFocus === 'skin') {
        skinIndex = (skinIndex + direction + SKINS.length) % SKINS.length;
      } else if (titleFocus === 'theme') {
        cycleTheme(direction);
      }
      return false;
    }

    if (n === 13 || n === 32 || k === 'Enter' || k === ' ' || c === 'Space' || c === 'NumpadEnter') {
      beginTutorial();
      return false;
    }
    return true;
  }

  if (state === 'tutorialControls') {
    if ([13, 32].includes(codeNum()) || keyVal() === 'Enter' || keyVal() === ' ' || keyVal() === 'Escape') {
      startGame();
      return false;
    }
    return true;
  }

  if (state === 'tutorialAudio') {
    if ([13, 32].includes(codeNum()) || keyVal() === 'Enter' || keyVal() === ' ') {
      // Must be calibrated to proceed!
      if (humCalibration.recorded) {
        if (tutorialReturnState === 'play') resumeGame();
        else startGame();
      }
      return false;
    }
    if (keyVal() === 'Escape') {
      // Compulsory - cannot escape if not calibrated
      if (humCalibration.recorded) {
        if (tutorialReturnState === 'play') resumeGame();
        else startGame();
      }
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

  if (isNavKey()) {
    return false;
  }
}

function keyReleased() {
  if (isNavKey()) {
    return false;
  }
}