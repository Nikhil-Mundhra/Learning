// ==========================================
// Trap rendering
// ==========================================

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

