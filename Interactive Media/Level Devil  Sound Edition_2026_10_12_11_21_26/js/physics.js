// ==========================================
// Player/door physics, platforms, ladders, collisions, footsteps
// ==========================================

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

