// ==========================================
// World rendering: platforms, doors, ladders, messages, player
// ==========================================

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

