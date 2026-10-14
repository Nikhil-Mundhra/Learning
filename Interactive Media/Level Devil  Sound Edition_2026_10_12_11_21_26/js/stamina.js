// ==========================================
// Stamina, sprint carry and camera follow
// ==========================================

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

