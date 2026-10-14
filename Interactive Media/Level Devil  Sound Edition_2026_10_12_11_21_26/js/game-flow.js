// ==========================================
// Death/win flow, win animation, ending transition, particles, messages
// ==========================================

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
      resetLevel(false); // sets state = 'play', so the tutorial state must be set afterwards
      openAudioTutorial('play');
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

