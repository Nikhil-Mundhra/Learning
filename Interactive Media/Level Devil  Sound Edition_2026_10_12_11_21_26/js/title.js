// ==========================================
// Title screen, skin/theme selection, game start
// ==========================================

function swatchRect(i) {
  const avail = min(556, FIELD.w - 40);
  const scaleRatio = min(1, avail / 556);
  const w = 92 * scaleRatio, gap = 24 * scaleRatio;
  const total = SKINS.length * w + (SKINS.length - 1) * gap;
  return {
    x: FIELD.x + (FIELD.w - total) / 2 + i * (w + gap),
    y: 190,
    w,
    h: 108 * scaleRatio
  };
}

function themeRect(i) {
  const avail = min(516, FIELD.w - 40);
  const scaleRatio = min(1, avail / 516);
  const w = 164 * scaleRatio, h = 54, gap = 12 * scaleRatio;
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
  const cardW = min(690, FIELD.w - 20);
  noStroke();
  fill(37, 39, 44, 218);
  rect(center - cardW / 2, 48, cardW, 500, 16);

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
    if (sel) fill(C.ink);
    else fill(255, 251, 239, 150);
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

    const pScale = 1.05 * min(1, r.w / 92);
    drawMiniPlayer(r.x + r.w / 2, r.y + 62 * (r.h / 108), pScale, sk);

    fill(sel ? C.white : C.ink);
    textStyle(sel ? BOLD : NORMAL);
    textSize(max(9, 10 * min(1, r.w / 92)));
    textAlign(CENTER, CENTER);
    text(sk.name, r.x + r.w / 2, r.y + 80 * (r.h / 108));

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
  const needsFocus = typeof document !== 'undefined' && typeof document.hasFocus === 'function' && !document.hasFocus();
  if (needsFocus && floor(millis() / 500) % 2 === 0) {
    fill(C.amber);
    text('CLICK ANYWHERE TO ENABLE CONTROLS', center, 497);
  } else {
    text('↑ / ↓ MOVE   ← / → SELECT   ENTER BEGIN', center, 497);
  }
}

