// ==========================================
// Per-frame gameplay update (updateGame) and gate/switch logic
// ==========================================

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

