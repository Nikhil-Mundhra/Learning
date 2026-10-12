// ==========================================
// GAME STATE, ENGINE & ARROW KEYS FALLBACK
// ==========================================

let buttons = [];
let levelIndex = 0, level, player, deaths = 0;
let state = 'play', stateTimer = 0, gameTime = 0, lastFrame = 0;
let message = 'Reach the green door. Trust nothing.';
let messageUntil = 0, particles = [], shake = 0;
let lastJump = false, jumpQueuedUntil = 0;
let walkCycle = 0, walkDust = 0, jumpSquash = 0, landSquash = 0;

function setup() {
  const s = min(1, windowWidth / W, windowHeight / H);
  createCanvas(floor(W * s), floor(H * s));
  textFont('monospace');
  resetLevel();
}

function windowResized() {
  const s = min(1, windowWidth / W, windowHeight / H);
  resizeCanvas(floor(W * s), floor(H * s));
}

function resetLevel() {
  level = buildLevel(levelIndex);
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
  message = level.hint;
  messageUntil = millis() + 3300;
}

function draw() {
  const now = millis();
  const dt = min((now - (lastFrame || now)) / 1000, 0.04);
  lastFrame = now;

  processAudio(now);

  if (state === 'play') {
    updateGame(dt, now);
  } else if (state === 'dead' || state === 'won') {
    stateTimer -= dt;
    if (stateTimer <= 0) {
      if (state === 'won') levelIndex = (levelIndex + 1) % 12;
      resetLevel();
    }
  }

  updateParticles(dt);
  push();
  scale(width / W, height / H);
  drawScene();
  pop();
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

  const reversed = level.traps.some(t =>
    t.type === 'reverse' &&
    t.active &&
    p.x + p.w > t.x &&
    p.x < t.x + t.w
  );

  // ------------------------------------------
  // INPUT SYSTEM: ARROW KEYS & WASD FALLBACK
  // ------------------------------------------
  const rightPressed = keyIsDown(RIGHT_ARROW) || keyIsDown(68); // 68: 'D'
  const leftPressed = keyIsDown(LEFT_ARROW) || keyIsDown(65);   // 65: 'A'
  const downPressed = keyIsDown(DOWN_ARROW) || keyIsDown(83);   // 83: 'S'
  const upPressed = keyIsDown(UP_ARROW) || keyIsDown(87) || keyIsDown(32); // 87: 'W', 32: Space

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

  p.vx = move * 215;
  if (move !== 0) p.face = move > 0 ? 1 : -1;

  // Jump Input: Arrow Up, W, or Space buffers a jump
  if (upPressed && !lastJump) {
    jumpQueuedUntil = now + 155;
  }
  lastJump = upPressed;

  // Jump execution with coyote time
  if (jumpQueuedUntil > now && (p.grounded || p.coyote > 0)) {
    p.vy = -390;
    p.grounded = false;
    p.coyote = 0;
    jumpQueuedUntil = 0;
    jumpSquash = 0.45;
    burst(p.x + p.w / 2, p.y + p.h, C.amber, 8);
    for (let i = 0; i < 8; i++) {
      particles.push({
        x: p.x + p.w / 2 + random(-8, 8),
        y: p.y + p.h,
        vx: random(-80, 80),
        vy: random(-120, -40),
        life: random(0.3, 0.55),
        color: C.amber,
        s: random(3, 6)
      });
    }
  }

  // Horizontal movement & collision
  const oldX = p.x;
  const oldY = p.y;
  p.x = constrain(p.x + p.vx * dt, 41, W - 40 - p.w);

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
  p.grounded = false;
  p.vy = min(p.vy + 950 * dt, 620);
  p.y += p.vy * dt;

  for (const q of level.platforms) {
    if (!isSolid(q) || p.x + p.w <= q.x || p.x >= q.x + q.w) continue;

    if (p.vy >= 0 && oldY + p.h <= q.y + 9 && p.y + p.h >= q.y) {
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
      landSquash = 0.35;
      burst(p.x + p.w / 2, p.y + p.h, C.amber, 12);
      for (let i = 0; i < 6; i++) {
        particles.push({
          x: p.x + random(p.w * 0.2, p.w * 0.8),
          y: p.y + p.h,
          vx: random(-60, 60) * (p.face > 0 ? -1 : 1),
          vy: random(-80, -20),
          life: random(0.3, 0.6),
          color: C.muted,
          s: random(3, 7)
        });
      }
    }
  } else {
    p.coyote = wasGrounded ? 0.09 : max(0, p.coyote - dt);
  }

  // Walking animation & dust
  if (p.grounded && abs(p.vx) > 10) {
    walkCycle += dt * 14 * (abs(p.vx) / 215);
    walkDust -= dt;
    if (walkDust <= 0) {
      walkDust = 0.08;
      particles.push({
        x: p.x + (p.face > 0 ? p.w * 0.8 : p.w * 0.2),
        y: p.y + p.h - 2,
        vx: random(-30, 30) - p.vx * 0.3,
        vy: random(-40, -10),
        life: random(0.15, 0.3),
        color: C.muted,
        s: random(2, 5)
      });
    }
  } else {
    walkCycle = lerp(walkCycle, 0, dt * 8);
  }

  // Jump squash animation
  if (jumpSquash > 0) jumpSquash = max(0, jumpSquash - dt * 4);
  if (landSquash > 0) landSquash = max(0, landSquash - dt * 6);

  // Platform expiration
  for (const q of level.platforms) {
    if (q.kind === 'crumble' && q.timer && gameTime - q.timer > 0.56) {
      q.gone = true;
    }
  }

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
  for (const t of level.traps) {
    if (!t.active && player.x + player.w >= t.trigger) {
      t.active = true;
      t.timer = gameTime;

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
        overlap(player, {
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

      if (overlap(player, { ...t, y: t.y + t.value })) {
        die();
      }
    }

    if (t.type === 'saw') {
      t.value = sin(gameTime * 2.2) * 92;
      if (circleRect(t.x + t.value + t.w / 2, t.y + t.h / 2, t.w * 0.43, player)) {
        die();
      }
    }

    if (t.type === 'laser' && t.active && age > 0.68 && age % 2.05 < 1.08 && overlap(player, t)) {
      die();
    }

    if (t.type === 'spring' && player.vy >= 0 && overlap(player, { x: t.x, y: t.y - 7, w: t.w, h: 16 })) {
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
  state = 'dead';
  stateTimer = 0.7;
  deaths++;
  shake = 8;
  burst(player.x + 12, player.y + 15, C.danger, 16);
}

function win() {
  if (state !== 'play') return;
  state = 'won';
  stateTimer = 1;
  burst(level.door.x + 14, level.door.y + 20, C.green, 20);
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
  text('LEVEL DEVIL  /  SOUND EDITION', 40, 29);

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
    shake ? random(-shake, shake) : 0,
    shake ? random(-shake, shake) : 0
  );
  drawWorld();
  pop();

  // Speed lines when moving fast
  if (state === 'play' && abs(player.vx) > 180) {
    drawSpeedLines();
  }

  drawControls();

  if (state === 'dead' || state === 'won') {
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

function drawSpeedLines() {
  const p = player;
  const lines = 5;
  const intensity = min(1, (abs(p.vx) - 180) / 80);
  stroke(255, 180, 60, 60 * intensity);
  strokeWeight(1.5);
  for (let i = 0; i < lines; i++) {
    const x = p.face > 0 ? p.x - 10 - i * 12 : p.x + p.w + 10 + i * 12;
    const y = p.y + random(4, p.h - 4);
    const len = random(15, 30) * intensity;
    line(x, y, x - p.face * len, y + random(-3, 3));
  }
  noStroke();
}

function drawWorld() {
  noStroke();
  fill('#efe5d3');
  rect(42, 144, 876, 331, 11);

  stroke(C.line);
  strokeWeight(2);
  noFill();
  rect(42, 144, 876, 331, 11);
  noStroke();

  fill(C.muted);
  textSize(12);
  textAlign(LEFT, CENTER);
  text(
    millis() < messageUntil
      ? message
      : 'CONTROLS: Use sounds OR Arrow Keys / WASD (↑ to jump, ↓ to stop)',
    61, 164
  );

  fill(C.line);
  for (let i = 0; i < 7; i++) {
    rect(94 + i * 122, 191, 2, 2);
  }

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
  fill(C.green);
  rect(d.x, d.y, d.w, d.h, 3);
  fill(C.ink);
  rect(d.x + 5, d.y + 6, d.w - 10, d.h - 6, 2);
  fill(C.amber);
  circle(d.x + d.w - 8, d.y + 27, 4);

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
  const moving = abs(p.vx) > 10 && p.grounded;
  const legPhase = sin(walkCycle);
  const armPhase = sin(walkCycle + PI);

  // Squash & stretch factors
  const squashY = 1 - jumpSquash * 0.45 + landSquash * 0.25;
  const stretchX = 1 + jumpSquash * 0.25 - landSquash * 0.15;
  const h = p.h * squashY;
  const w = p.w * stretchX;
  const cx = p.x + p.w / 2;
  const cy = p.y + p.h - h / 2;

  push();
  translate(cx, cy);
  scale(p.face, 1);

  // Shadow
  if (p.grounded) {
    noStroke();
    fill(37, 39, 44, 60);
    ellipse(0, h / 2 + 2, w * 0.7, 6 * squashY);
  }

  // Legs (animated when walking)
  const legY = h / 2 - 4;
  const legSwing = moving ? legPhase * 10 : 0;
  const legSpread = moving ? abs(legPhase) * 4 : 0;

  // Back leg
  fill(C.amberDark);
  rect(-w / 2 + 3 + legSpread, legY + legSwing * 0.5, 6, h * 0.45 - legSwing * 0.5, 2);
  // Front leg
  rect(-w / 2 + 3 - legSpread, legY - legSwing * 0.5, 6, h * 0.45 + legSwing * 0.5, 2);

  // Body
  fill(C.amber);
  rect(-w / 2 + 2, -h / 2, w - 4, h - 8, 4);

  // Body highlight
  fill(255, 200, 100, 40);
  rect(-w / 2 + 4, -h / 2 + 3, w - 8, 6, 2);

  // Eyes
  fill(C.ink);
  const eyeX = w / 2 - 8;
  const blink = (state === 'won' || frameCount % 120 < 3) ? 1 : 0;
  rect(eyeX, -h / 2 + 9, 3, blink ? 1 : 4);

  // Arms (swing opposite to legs when walking)
  const armSwing = moving ? armPhase * 8 : 0;
  fill(C.amberDark);
  rect(-w / 2 - 4, -h / 2 + 8 + armSwing * 0.5, 5, h * 0.35, 2);
  fill(C.amber);
  rect(-w / 2 + w - 1, -h / 2 + 8 - armSwing * 0.5, 5, h * 0.35, 2);

  // Feet accent
  fill(C.ink);
  rect(-w / 2 + 3 + legSpread, legY + h * 0.45 - 2 + legSwing * 0.5, 6, 2);
  rect(-w / 2 + 3 - legSpread, legY + h * 0.45 - 2 - legSwing * 0.5, 6, 2);

  pop();
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
    '←/→ or A/D MOVE  ·  ↑/W/SPACE JUMP  ·  ↓/S STOP  ·  R RESTART',
    944, 586
  );

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
  return clickAt(mouseX * W / width, mouseY * H / height);
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