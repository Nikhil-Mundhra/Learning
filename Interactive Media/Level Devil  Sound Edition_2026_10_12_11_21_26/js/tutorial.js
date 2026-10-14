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
    ? 'Choose your power, then record a continuous 3-second hum whole to calibrate.'
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

function drawAudioTutorial(x, y, cardW, cardH) {
  const center = x + cardW / 2;
  const footerY = y + cardH - 64;

  // Step 1: Select Voice Power (Two Cards side by side)
  const cardW_each = floor((cardW - 60) / 2);
  const card1X = x + 24;
  const card2X = card1X + cardW_each + 12;
  const cardsY = y + 160;
  const cardsH = 76;

  // Card 1: Pause Time
  const isPause = selectedVoicePower === 'pause';
  fill(isPause ? '#3a3e44' : '#292b2e');
  rect(card1X, cardsY, cardW_each, cardsH, 8);
  stroke(isPause ? C.amber : '#43474d');
  strokeWeight(isPause ? 2 : 1);
  noFill();
  rect(card1X, cardsY, cardW_each, cardsH, 8);
  noStroke();

  buttons.push({
    x: card1X, y: cardsY, w: cardW_each, h: cardsH,
    action: () => { selectedVoicePower = 'pause'; }
  });

  fill(isPause ? C.amber : C.white);
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(12);
  text('❄ PAUSE TIME (3s)', card1X + 14, cardsY + 12);
  textStyle(NORMAL);
  fill('#c4c0b6');
  textSize(10);
  text('Freeze traps & time while humming.\nWorld turns grayscale. Unlocks 1s at Lvl 3.', card1X + 14, cardsY + 32);
  if (isPause) {
    textAlign(RIGHT, TOP);
    fill(C.amber);
    textStyle(BOLD);
    textSize(10);
    text('SELECTED ✓', card1X + cardW_each - 12, cardsY + 12);
    textStyle(NORMAL);
  }

  // Card 2: Reverse Time by 2s
  const isRewind = selectedVoicePower === 'rewind';
  fill(isRewind ? '#3a3e44' : '#292b2e');
  rect(card2X, cardsY, cardW_each, cardsH, 8);
  stroke(isRewind ? '#b27cff' : '#43474d');
  strokeWeight(isRewind ? 2 : 1);
  noFill();
  rect(card2X, cardsY, cardW_each, cardsH, 8);
  noStroke();

  buttons.push({
    x: card2X, y: cardsY, w: cardW_each, h: cardsH,
    action: () => { selectedVoicePower = 'rewind'; }
  });

  fill(isRewind ? '#b27cff' : C.white);
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(12);
  text('⏪ REVERSE TIME (2s)', card2X + 14, cardsY + 12);
  textStyle(NORMAL);
  fill('#c4c0b6');
  textSize(10);
  text('Hum to rewind time & position 2s back.\nEscape surprise traps and pits.', card2X + 14, cardsY + 32);
  if (isRewind) {
    textAlign(RIGHT, TOP);
    fill('#b27cff');
    textStyle(BOLD);
    textSize(10);
    text('SELECTED ✓', card2X + cardW_each - 12, cardsY + 12);
    textStyle(NORMAL);
  }

  // Step 2: 3-Second Whole Hum Calibration Module
  const calBoxX = x + 24;
  const calBoxW = cardW - 48;
  const calBoxY = cardsY + cardsH + 12;
  const calBoxH = 110;

  fill('#242629');
  rect(calBoxX, calBoxY, calBoxW, calBoxH, 10);
  stroke('#3f4349');
  strokeWeight(1);
  noFill();
  rect(calBoxX, calBoxY, calBoxW, calBoxH, 10);
  noStroke();

  textAlign(LEFT, TOP);
  fill(C.amber);
  textSize(11);
  textStyle(BOLD);
  text('COMPULSORY: RECORD 3-SECOND HUM WHOLE TO CALIBRATE', calBoxX + 16, calBoxY + 14);
  textStyle(NORMAL);

  if (micState !== 'on') {
    uiButton(calBoxX + 16, calBoxY + 44, 200, 36, 'ENABLE MICROPHONE', 'accent', () => enableMic());
    fill('#c4c0b6');
    textAlign(LEFT, CENTER);
    textSize(10);
    text('Microphone is required to calibrate your hum. (Hold [H] works as keyboard fallback)', calBoxX + 230, calBoxY + 62);
  } else {
    const btnW = 180;
    const btnLabel = humCalibration.recording
      ? 'RECORDING HUM...'
      : humCalibration.recorded
        ? 'RE-RECORD 3S HUM'
        : 'START 3S RECORDING';
    const btnStyle = humCalibration.recording ? 'on' : humCalibration.recorded ? '' : 'accent';

    uiButton(calBoxX + 16, calBoxY + 44, btnW, 36, btnLabel, btnStyle, () => startHumCalibration());

    // 3-Second Progress Bar
    const barX = calBoxX + btnW + 24;
    const barW = calBoxW - btnW - 40;
    const barY = calBoxY + 54;
    const barH = 12;

    fill('#181a1c');
    rect(barX, barY, barW, barH, 6);

    const pct = humCalibration.recorded ? 1.0 : constrain(humCalibration.progress / humCalibration.target, 0, 1);
    const barCol = humCalibration.recorded
      ? C.green
      : humCalibration.recording && isHumming
        ? '#8ae2ff'
        : C.amber;
    fill(barCol);
    rect(barX, barY, max(4, barW * pct), barH, 6);

    // Readout status
    fill(humCalibration.recorded ? C.green : humCalibration.recording && isHumming ? '#8ae2ff' : C.white);
    textAlign(LEFT, CENTER);
    textSize(10);
    text(humCalibration.statusMessage, barX, calBoxY + 38);

    if (humCalibration.recorded) {
      fill('#a0a5ad');
      textSize(9);
      text(`Selected: [${selectedVoicePower === 'pause' ? 'PAUSE TIME' : 'REVERSE TIME'}] • Calibrated! You may proceed to Level 3.`, barX, calBoxY + 76);
    } else if (humCalibration.recording) {
      fill('#c4c0b6');
      textSize(9);
      text(`Progress: ${humCalibration.progress.toFixed(1)}s / 3.0s • Hold steady whole without stopping!`, barX, calBoxY + 76);
    } else {
      fill('#8e9299');
      textSize(9);
      text('Click start, then sustain a continuous hum for 3 full seconds whole.', barX, calBoxY + 76);
    }
  }

  // Notes
  fill('#aaa69b');
  textAlign(CENTER, TOP);
  textSize(10);
  text('• Selected power improves every few levels (Lvl 3: 1s, Lvl 7: 2s, Lvl 10: 3s). Single use per reset.', center, calBoxY + calBoxH + 12);

  // Compulsory Footer Buttons (Cannot proceed until calibrated)
  if (humCalibration.recorded) {
    const action = tutorialReturnState === 'play' ? resumeGame : startGame;
    const label = tutorialReturnState === 'play' ? 'PROCEED TO LEVEL 3  ⏎' : 'START GAME  ⏎';
    uiButton(center - 110, footerY, 220, 36, label, 'accent', action);
  } else {
    // Disabled / Locked button
    fill('#2a2c30');
    rect(center - 150, footerY, 300, 36, 5);
    stroke('#444850');
    strokeWeight(1);
    noFill();
    rect(center - 150, footerY, 300, 36, 5);
    noStroke();

    fill('#888c94');
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(10);
    text('COMPLETE 3S HUM CALIBRATION TO PROCEED', center, footerY + 18);
    textStyle(NORMAL);
  }
}

function resumeGame() {
  jumpQueuedUntil = 0;
  state = 'play';
}

