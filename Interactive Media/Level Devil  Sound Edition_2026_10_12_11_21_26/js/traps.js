// ==========================================
// Trap triggers and per-trap update logic
// ==========================================

function checkTrapTrigger(t, victim, dt) {
  if (typeof rewindActive !== 'undefined' && rewindActive) return;
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

