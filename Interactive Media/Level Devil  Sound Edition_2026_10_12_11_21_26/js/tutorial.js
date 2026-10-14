// ==========================================
// Tutorial and audio-setup screens
// ==========================================

function beginTutorial() {
  tutorialReturnState = 'start';
  state = 'tutorialControls';
}

function drawTutorial() {
  background(C.ink);
  drawBackdrop();
  noStroke();
  fill(37, 39, 44, 115);
  rect(0, 0, FIELD.w, H);
  buttons = [];

  const cardW = min(760, FIELD.w - 32);
  const cardH = min(530, H - 32);
  const x = (FIELD.w - cardW) / 2;
  const y = (H - cardH) / 2;
  const audioPage = state === 'tutorialAudio';

  noStroke();
  fill('#303338');
  rect(x, y, cardW, cardH, 16);
  fill(C.amber);
  rect(x + 24, y + 24, 34, 4, 2);

  fill(C.white);
  textAlign(LEFT, CENTER);
  textStyle(BOLD);
  textSize(12);
  text('LARP DEVIL', x + 24, y + 45);
  textStyle(NORMAL);
  fill('#aaa69b');
  textAlign(RIGHT, CENTER);
  textSize(11);
  text(audioPage ? 'VOICE POWERS' : 'MOVEMENT CONTROLS', x + cardW - 24, y + 45);

  fill(C.white);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(cardW < 360 ? 16 : cardW < 440 ? 22 : 27);
  text(audioPage ? 'CHOOSE YOUR ABILITY' : 'LEARN THE BASICS', x + cardW / 2, y + 91);
  textStyle(NORMAL);
  fill('#c4c0b6');
  textSize(cardW < 500 ? 11 : 13);
  const subtitle = audioPage
    ? 'Pick a power with the arrow keys, then record a continuous 3-second hum to calibrate.'
    : 'A few controls are all you need to get moving.';
  const subtitleLines = [''];
  for (const word of subtitle.split(/\s+/)) {
    const current = subtitleLines[subtitleLines.length - 1];
    const next = current ? `${current} ${word}` : word;
    if (current && textWidth(next) > cardW - 56) subtitleLines.push(word);
    else subtitleLines[subtitleLines.length - 1] = next;
  }
  subtitleLines.forEach((line, i) => {
    text(line, x + cardW / 2, y + 122 + (i - (subtitleLines.length - 1) / 2) * 14);
  });

  stroke('#484b4f');
  line(x + 24, y + 148, x + cardW - 24, y + 148);
  noStroke();

  if (audioPage) {
    drawAudioTutorial(x, y, cardW, cardH);
    return;
  }

  const narrow = cardW < 560;
  const contentX = x + 24;
  const contentW = cardW - 48;
  const rowGap = 12;
  const rowH = 62;
  const cols = narrow ? 1 : 2;
  const rowW = cols === 1 ? contentW : (contentW - rowGap) / 2;
  const controls = [
    ['←  →', 'Move left and right'],
    ['↑  W  SPACE', 'Jump. Hold ↑ / W to climb'],
    ['SHIFT', 'Sprint while moving'],
    ['HUM  /  H', 'Trigger chosen voice power (1x/level)']
  ];
  const rowsY = y + 170;

  controls.forEach(([keys, description], i) => {
    const col = i % cols;
    const row = floor(i / cols);
    const rx = contentX + col * (rowW + rowGap);
    const ry = rowsY + row * (rowH + rowGap);
    fill('#3a3d41');
    rect(rx, ry, rowW, rowH, 8);

    fill(C.amber);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(keys.length > 8 ? 10 : 13);
    text(keys, rx + 62, ry + rowH / 2);

    fill(C.white);
    textAlign(LEFT, CENTER);
    textStyle(NORMAL);
    textSize(12);
    text(description, rx + 112, ry + rowH / 2);
  });

  fill('#aaa69b');
  textAlign(CENTER, CENTER);
  textSize(11);
  text('Move with keyboard. Voice powers unlock after Level 2.', x + cardW / 2, y + cardH - 94);

  uiButton(x + cardW / 2 - 80, y + cardH - 64, 160, 36, 'START GAME', 'accent', () => {
    startGame();
  });
}

// ==========================================
// Voice-setup ("Choose your ability") screen helpers
// ==========================================

// Keyboard focus on the voice-setup screen: 'power' (ability cards), 'record', 'proceed'.
let audioFocus = 'power';
let audioWasCalibrated = false;

function openAudioTutorial(returnState) {
  tutorialReturnState = returnState;
  state = 'tutorialAudio';
  audioWasCalibrated = humCalibration.recorded;
  audioFocus = 'power';
}

function audioRows() {
  return humCalibration.recorded ? ['power', 'record', 'proceed'] : ['power', 'record'];
}

function proceedFromAudioTutorial() {
  if (!humCalibration.recorded) return;
  if (tutorialReturnState === 'play') resumeGame();
  else startGame();
}

function activateRecordButton() {
  if (humCalibration.recording) return;
  startHumCalibration();
}

// Returns true when the key was consumed by the voice-setup screen.
function handleAudioTutorialKey(k, c, n) {
  const up = c === 'ArrowUp' || k === 'ArrowUp' || n === 38 || k === 'w' || k === 'W' || c === 'KeyW';
  const down = c === 'ArrowDown' || k === 'ArrowDown' || n === 40 || k === 's' || k === 'S' || c === 'KeyS';
  const left = c === 'ArrowLeft' || k === 'ArrowLeft' || n === 37 || k === 'a' || k === 'A' || c === 'KeyA';
  const right = c === 'ArrowRight' || k === 'ArrowRight' || n === 39 || k === 'd' || k === 'D' || c === 'KeyD';
  const confirm = n === 13 || n === 32 || k === 'Enter' || k === ' ' || c === 'Space' || c === 'NumpadEnter';

  const rows = audioRows();
  let idx = rows.indexOf(audioFocus);
  if (idx < 0) idx = 0;

  if (up || down) {
    audioFocus = rows[constrain(idx + (down ? 1 : -1), 0, rows.length - 1)];
    return true;
  }
  if ((left || right) && audioFocus === 'power') {
    selectedVoicePower = left ? 'pause' : 'rewind';
    return true;
  }
  if (confirm) {
    if (audioFocus === 'power') audioFocus = 'record';
    else if (audioFocus === 'record') activateRecordButton();
    else if (audioFocus === 'proceed') proceedFromAudioTutorial();
    return true;
  }
  return false;
}

function drawFocusRing(x, y, w, h, r) {
  noFill();
  stroke(245, 171, 69, 80);
  strokeWeight(5);
  rect(x, y, w, h, r + 2);
  stroke(C.white);
  strokeWeight(2);
  rect(x, y, w, h, r);
  noStroke();
}

function audioButton(x, y, w, h, label, variant, focused, action) {
  const mx = mouseX / view.s;
  const my = (mouseY - view.oy) / view.s;
  const hover = mx >= x && mx <= x + w && my >= y && my <= y + h;
  if (action) buttons.push({ x, y, w, h, action });

  const base = variant === 'primary' ? C.amber : variant === 'active' ? C.green : '#4a4d52';
  const edge = variant === 'primary' ? C.amberDark : variant === 'active' ? '#3d7a59' : '#2f3134';

  noStroke();
  fill(edge);
  rect(x, y + 3, w, h, 8);
  fill(base);
  rect(x, y, w, h, 8);
  if (hover) {
    fill(255, 255, 255, 30);
    rect(x, y, w, h, 8);
  }
  fill(variant === 'neutral' ? C.white : C.ink);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(11);
  text(label, x + w / 2, y + h / 2 + 1);
  textStyle(NORMAL);

  if (focused) drawFocusRing(x - 4, y - 4, w + 8, h + 11, 10);
}

function drawPauseIcon(cx, cy, col) {
  noStroke();
  fill(col);
  rect(cx - 9, cy - 10, 6, 20, 2);
  rect(cx + 3, cy - 10, 6, 20, 2);
}

function drawRewindIcon(cx, cy, col) {
  noStroke();
  fill(col);
  triangle(cx - 1, cy - 10, cx - 1, cy + 10, cx - 14, cy);
  triangle(cx + 13, cy - 10, cx + 13, cy + 10, cx, cy);
}

function drawAbilityCard(x, y, w, h, opts, selected, focused) {
  const { title, desc, accent, icon, power } = opts;
  buttons.push({
    x, y, w, h,
    action: () => { selectedVoicePower = power; audioFocus = 'power'; }
  });

  noStroke();
  fill(selected ? '#363a41' : '#292b2e');
  rect(x, y, w, h, 12);
  if (selected) {
    fill(accent);
    rect(x, y + 14, 4, h - 28, 2);
  }
  stroke(selected ? accent : '#43474d');
  strokeWeight(selected ? 2 : 1);
  noFill();
  rect(x, y, w, h, 12);
  noStroke();

  // Icon medallion
  const ix = x + 40;
  const iy = y + h / 2;
  fill('#202225');
  circle(ix, iy, 46);
  stroke(selected ? accent : '#4f535a');
  strokeWeight(1.5);
  noFill();
  circle(ix, iy, 46);
  noStroke();
  icon(ix, iy, selected ? accent : '#9a9ea6');

  // Text
  fill(selected ? accent : C.white);
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(13);
  text(title, x + 78, y + 16);
  textStyle(NORMAL);
  fill('#c4c0b6');
  textSize(10);
  text(desc, x + 78, y + 40);

  if (selected) {
    // "SELECTED" pill
    textSize(9);
    textStyle(BOLD);
    const pw = textWidth('SELECTED') + 16;
    fill(accent);
    rect(x + w - pw - 10, y + 10, pw, 16, 8);
    fill(C.ink);
    textAlign(CENTER, CENTER);
    text('SELECTED', x + w - pw / 2 - 10, y + 18.5);
    textStyle(NORMAL);
  }

  if (focused) drawFocusRing(x - 4, y - 4, w + 8, h + 8, 14);
}

function drawAudioTutorial(x, y, cardW, cardH) {
  const center = x + cardW / 2;
  const footerY = y + cardH - 64;

  // Keep keyboard focus valid, and jump to PROCEED once calibration completes.
  if (humCalibration.recorded && !audioWasCalibrated) audioFocus = 'proceed';
  if (!humCalibration.recorded && audioFocus === 'proceed') audioFocus = 'record';
  audioWasCalibrated = humCalibration.recorded;

  // Step 1: choose a voice power
  const gap = 14;
  const cardWEach = floor((cardW - 48 - gap) / 2);
  const card1X = x + 24;
  const card2X = card1X + cardWEach + gap;
  const cardsY = y + 164;
  const cardsH = 92;

  const powerFocused = audioFocus === 'power';
  drawAbilityCard(card1X, cardsY, cardWEach, cardsH, {
    power: 'pause',
    title: 'PAUSE TIME (3s)',
    desc: 'Freeze traps & time while humming.\nWorld turns grayscale. Unlocks 1s at Lvl 3.',
    accent: C.amber,
    icon: drawPauseIcon
  }, selectedVoicePower === 'pause', powerFocused && selectedVoicePower === 'pause');

  drawAbilityCard(card2X, cardsY, cardWEach, cardsH, {
    power: 'rewind',
    title: 'REVERSE TIME (2s)',
    desc: 'Hum to rewind time & position 2s back.\nEscape surprise traps and pits.',
    accent: '#b27cff',
    icon: drawRewindIcon
  }, selectedVoicePower === 'rewind', powerFocused && selectedVoicePower === 'rewind');

  // Step 2: 3-second hum calibration
  const calBoxX = x + 24;
  const calBoxW = cardW - 48;
  const calBoxY = cardsY + cardsH + 16;
  const calBoxH = 112;

  fill('#242629');
  rect(calBoxX, calBoxY, calBoxW, calBoxH, 12);
  stroke('#3f4349');
  strokeWeight(1);
  noFill();
  rect(calBoxX, calBoxY, calBoxW, calBoxH, 12);
  noStroke();

  textAlign(LEFT, TOP);
  fill(C.amber);
  textSize(11);
  textStyle(BOLD);
  text('REQUIRED: RECORD A 3-SECOND HUM TO CALIBRATE', calBoxX + 18, calBoxY + 14);
  textStyle(NORMAL);

  const recordFocused = audioFocus === 'record';
  const btnY = calBoxY + 52;

  const btnW = 196;
  const btnLabel = humCalibration.recording
    ? 'RECORDING (HOLD H)...'
    : humCalibration.recorded
      ? 'RE-RECORD (HOLD H)'
      : 'START (OR HOLD H)';
  const btnVariant = humCalibration.recording ? 'active' : humCalibration.recorded ? 'neutral' : 'primary';

  audioButton(calBoxX + 18, btnY, btnW, 38, btnLabel, btnVariant, recordFocused, () => {
    audioFocus = 'record';
    activateRecordButton();
  });

  if (micState !== 'on') {
    const micX = calBoxX + 18;
    const micY = btnY - 22;
    buttons.push({
      x: micX, y: micY - 4, w: 196, h: 18,
      action: () => enableMic()
    });
    fill('#a0a5ad');
    textAlign(LEFT, CENTER);
    textSize(9);
    text('MIC: OFF (CLICK TO ENABLE)', micX, micY + 5);
  }

  // 3-second progress bar with 1s ticks (always visible for mic or keyboard H)
  const barX = calBoxX + btnW + 36;
  const barW = calBoxW - btnW - 54;
  const barY = btnY + 14;
  const barH = 12;

  fill('#181a1c');
  rect(barX, barY, barW, barH, 6);

  const pct = humCalibration.recorded ? 1.0 : constrain(humCalibration.progress / humCalibration.target, 0, 1);
  const barCol = humCalibration.recorded
    ? C.green
    : humCalibration.recording
      ? '#8ae2ff'
      : C.amber;
  fill(barCol);
  rect(barX, barY, max(barH, barW * pct), barH, 6);

  stroke(0, 0, 0, 90);
  strokeWeight(1);
  line(barX + barW / 3, barY + 2, barX + barW / 3, barY + barH - 2);
  line(barX + (barW * 2) / 3, barY + 2, barX + (barW * 2) / 3, barY + barH - 2);
  noStroke();

  // Status readout
  fill(humCalibration.recorded ? C.green : humCalibration.recording ? '#8ae2ff' : C.white);
  textAlign(LEFT, CENTER);
  textSize(10);
  text(humCalibration.statusMessage || 'Hold H on keyboard (or hum into mic) for 3 full seconds.', barX, calBoxY + 38);

  fill('#8e9299');
  textSize(9);
  if (humCalibration.recorded) {
    text(`Power: ${selectedVoicePower === 'pause' ? 'PAUSE TIME' : 'REVERSE TIME'}. Calibrated. You may continue.`, barX, btnY + 40);
  } else if (humCalibration.recording) {
    text(`${humCalibration.progress.toFixed(1)}s / 3.0s. Hold steady without stopping.`, barX, btnY + 40);
  } else {
    text('Hold H on your keyboard (or click Start to hum) for 3 continuous seconds.', barX, btnY + 40);
  }

  // Note
  fill('#aaa69b');
  textAlign(CENTER, TOP);
  textSize(10);
  text('Your power improves every few levels (Lvl 3: 1s, Lvl 7: 2s, Lvl 10: 3s). One use per attempt.', center, calBoxY + calBoxH + 14);

  // Footer: cannot proceed until calibrated
  if (humCalibration.recorded) {
    const label = tutorialReturnState === 'play' ? 'PROCEED TO LEVEL 3' : 'START GAME';
    audioButton(center - 110, footerY, 220, 38, label, 'primary', audioFocus === 'proceed', proceedFromAudioTutorial);
  } else {
    fill('#2a2c30');
    rect(center - 150, footerY, 300, 38, 8);
    stroke('#444850');
    strokeWeight(1);
    noFill();
    rect(center - 150, footerY, 300, 38, 8);
    noStroke();

    fill('#888c94');
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(10);
    text('COMPLETE CALIBRATION TO CONTINUE', center, footerY + 19);
    textStyle(NORMAL);
  }

  // Keyboard hint bar
  fill('#7f838b');
  textAlign(CENTER, CENTER);
  textSize(9);
  text('ARROW KEYS: navigate     ENTER: confirm     H: hum without a mic', center, y + cardH - 14);
}

function resumeGame() {
  jumpQueuedUntil = 0;
  state = 'play';
}

