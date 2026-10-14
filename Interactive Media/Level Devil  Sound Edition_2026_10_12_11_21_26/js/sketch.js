// ==========================================
// Entry point: p5 setup(), draw() loop, layout, level reset
// ==========================================

function layout() {
  view.s = windowHeight / H;
  view.visW = windowWidth / view.s;
  view.oy = 0;
  view.slackTop = 0;
  FIELD.x = 0;
  FIELD.w = view.visW;
}

function setup() {
  // p5 1.9.4's accessible grid output ignores translate() and indexes its 10x10
  // grid with negative locations for sprites drawn at negative local coords
  // (doors, player), crashing draw(). Screen-reader output is intentionally
  // disabled; the Web Editor's "Accessible Outputs" setting can enable it.
  if (typeof p5 !== 'undefined' && p5.prototype) {
    p5.prototype._updateGridOutput = function () {};
    p5.prototype._updateTextOutput = function () {};
    p5.prototype._updateAccsOutput = function () {};
  }
  const cnv = createCanvas(windowWidth, windowHeight);
  textFont('monospace');
  layout();
  buildBackdrop(FIELD.w);
  loadArtwork();

  if (cnv && cnv.elt) {
    cnv.elt.setAttribute('tabindex', '0');
    cnv.elt.style.outline = 'none';
    cnv.elt.focus();
  }
  if (typeof window !== 'undefined') {
    window.focus();
  }

  // TEMP DIAGNOSTIC: remove once input works in the Web Editor.
  if (typeof document !== 'undefined') {
    const badge = document.createElement('div');
    badge.style.cssText = 'position:fixed;left:2px;top:2px;z-index:99999;font:10px monospace;' +
      'color:#0f0;background:rgba(0,0,0,.75);padding:2px 4px;pointer-events:none;white-space:pre';
    document.body.appendChild(badge);
    let lastKey = '-';
    window.addEventListener('keydown', e => { lastKey = e.code || e.key; }, true);
    setInterval(() => {
      badge.textContent = 'v3 focus:' + document.hasFocus() + ' key:' + lastKey;
    }, 200);
  }

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
    push();
    translate(0, view.oy);
    scale(view.s);
    drawTitle();
    pop();
    return;
  }

  if (state === 'tutorialControls' || state === 'tutorialAudio') {
    if (state === 'tutorialAudio') {
      updateHumCalibration(dt, keyAny('h', 'H'));
    }
    updateParticles(dt);
    push();
    translate(0, view.oy);
    scale(view.s);
    drawTutorial();
    pop();
    return;
  }

  if (state === 'ending') {
    updateEnding(dt);
    updateParticles(dt);
    push();
    translate(0, view.oy);
    scale(view.s);
    drawEnding();
    pop();
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

  if (typeof document !== 'undefined' && !document.hasFocus()) {
    push();
    fill(0, 0, 0, 160);
    rect(FIELD.x, FIELD.y, FIELD.w, FIELD.h);
    fill('#ffffff');
    textAlign(CENTER, CENTER);
    textSize(18);
    text('CLICK GAME TO ACTIVATE CONTROLS', FIELD.x + FIELD.w / 2, FIELD.y + FIELD.h / 2);
    textSize(11);
    fill(C.amber);
    text('(Click anywhere in this window to focus keyboard)', FIELD.x + FIELD.w / 2, FIELD.y + FIELD.h / 2 + 28);
    pop();
  }

  pop();
}

function controlled() {
  return level.doorMode ? level.door : player;
}

