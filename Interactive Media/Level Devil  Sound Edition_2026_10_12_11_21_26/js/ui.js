// ==========================================
// HUD controls, settings panel and UI buttons
// ==========================================

function drawControls() {
  noStroke();
  buttons = [];

  const fw = FIELD.w;
  const R = 16;
  const buttonY = H - 50;
  const row = (bx, bw, label, style, action) => uiButton(bx, buttonY, bw, 34, label, style, action);
  const navX = fw - R - 80;

  // Voice setup button moved into the settings panel (see drawSettingsPanel).
  // row(R, 122, micState === 'on' ? 'VOICE: READY' : 'VOICE SETUP', micState === 'on' ? 'on' : '', () => {
  //   tutorialReturnState = 'play';
  //   state = 'tutorialAudio';
  // });
  row(R, 72, 'RETRY', '', () => resetLevel());

  const eachW = min(150, max(104, floor((fw - 390) / 2)));
  const gap = 18; // 12px of box padding (6 per side) + 6px visible gap
  const totalMetersW = eachW * 2 + gap;
  const startMetersX = (fw - totalMetersW) / 2;

  const stamX = startMetersX;
  const freezeX = startMetersX + eachW + gap;

  // 1. STAMINA (SHIFT SPRINT)
  fill(37, 39, 44, 190);
  rect(stamX - 6, H - 50, eachW + 12, 34, 8);
  fill('#55585b');
  rect(stamX, H - 37, eachW, 7, 3.5);

  const st = stamina / STAM_MAX;
  const barCol = exhausted ? C.danger : st < 0.3 ? C.amberDark : C.green;
  fill(barCol);
  rect(stamX, H - 37, max(4, eachW * st), 7, 3.5);

  fill(exhausted ? C.danger : C.white);
  textAlign(CENTER, CENTER);
  textStyle(exhausted ? BOLD : NORMAL);
  textSize(9);
  text(
    exhausted ? 'WINDED' : sprinting ? 'SPRINTING' : 'SHIFT SPRINT',
    stamX + eachW / 2, H - 44
  );
  textStyle(NORMAL);

  // 2. VOICE POWER METER (PAUSE OR REWIND, OR HUM DOOR IN DOOR MODE)
  fill(37, 39, 44, 190);
  rect(freezeX - 6, H - 50, eachW + 12, 34, 8);
  fill('#55585b');
  rect(freezeX, H - 37, eachW, 7, 3.5);

  if (level.doorMode) {
    if (doorHumOpen > 0) {
      fill('#5bb2a5');
      rect(freezeX, H - 37, max(4, eachW * doorHumOpen), 7, 3.5);
      fill('#5bb2a5');
      textStyle(BOLD);
    } else {
      fill(C.white);
      textStyle(NORMAL);
    }
    textAlign(CENTER, CENTER);
    textSize(9);
    text(
      doorHumOpen >= 0.4 ? 'DOOR OPEN!' : 'HUM: OPEN DOOR',
      freezeX + eachW / 2, H - 44
    );
    textStyle(NORMAL);
  } else if (selectedVoicePower === 'pause') {
    const maxDur = timeFreezeMaxDuration;
    const freezePct = maxDur > 0 ? constrain(timeFreezeLeft / maxDur, 0, 1) : 0;
    if (timeFreezeActive) {
      fill('#8ae2ff');
      rect(freezeX, H - 37, max(4, eachW * freezePct), 7, 3.5);
      fill('#8ae2ff');
      textStyle(BOLD);
    } else if (timeFreezeUsed) {
      fill('#76756f');
      textStyle(NORMAL);
    } else if (maxDur <= 0) {
      fill('#55585b');
      textStyle(NORMAL);
    } else {
      fill(micState === 'on' ? '#5bb2a5' : C.amber);
      rect(freezeX, H - 37, eachW, 7, 3.5);
      fill(C.white);
      textStyle(NORMAL);
    }

    textAlign(CENTER, CENTER);
    textSize(9);
    let pauseLabel = '';
    if (timeFreezeActive) {
      pauseLabel = `FROZEN ${timeFreezeLeft.toFixed(1)}s`;
    } else if (timeFreezeUsed) {
      const usedDisplay = timeFreezeUsedAmount.toFixed(1);
      pauseLabel = `FREEZE USED (${usedDisplay}/3)`;
    } else if (maxDur <= 0) {
      pauseLabel = 'UNLOCKED AT LVL 3';
    } else {
      pauseLabel = micState === 'on' ? `HUM: PAUSE (${Math.round(maxDur)}s)` : `HOLD H: PAUSE (${Math.round(maxDur)}s)`;
    }

    text(pauseLabel, freezeX + eachW / 2, H - 44);
    textStyle(NORMAL);
  } else {
    // REVERSE TIME (2s)
    if (rewindActive) {
      fill('#b27cff');
      rect(freezeX, H - 37, eachW, 7, 3.5);
      fill('#dcb5ff');
      textStyle(BOLD);
    } else if (timeFreezeUsed) {
      fill('#76756f');
      textStyle(NORMAL);
    } else {
      fill(micState === 'on' ? '#b27cff' : C.amber);
      rect(freezeX, H - 37, eachW, 7, 3.5);
      fill(C.white);
      textStyle(NORMAL);
    }

    textAlign(CENTER, CENTER);
    textSize(9);
    text(
      rewindActive
        ? 'REWINDING 2s'
        : timeFreezeUsed
          ? 'REWIND USED (1/1)'
          : micState === 'on'
            ? 'HUM: REWIND 2s'
            : 'HOLD H: REWIND',
      freezeX + eachW / 2, H - 44
    );
    textStyle(NORMAL);
  }

  // Previous / next level buttons (disabled). Uncomment to restore level skipping.
  // row(navX, 40, '\u2039', '', () => {
  //   levelIndex = (levelIndex + 11) % 12;
  //   resetLevel();
  // });
  // row(navX + 45, 40, '\u203a', '', () => {
  //   levelIndex = (levelIndex + 1) % 12;
  //   resetLevel();
  // });

  const deathsLabel = `DEATHS ${deaths}`;
  textSize(11);
  const deathsW = textWidth(deathsLabel) + 28;
  const deathsX = fw - deathsW - 12;
  const settingsX = deathsX - 48;
  buttons.push({
    x: settingsX, y: 12, w: 40, h: 38,
    action: () => { settingsOpen = !settingsOpen; }
  });
  noStroke();
  fill(37, 39, 44, 218);
  rect(settingsX, 12, 40, 38, 8);
  if (settingsOpen) {
    noFill();
    stroke(C.green);
    strokeWeight(1.5);
    rect(settingsX + 1, 13, 38, 36, 7);
    noStroke();
  }
  if (gearIcon?.complete && gearIcon.naturalWidth) {
    drawingContext.save();
    drawingContext.filter = 'invert(1)';
    drawingContext.drawImage(gearIcon, settingsX + 7, 18, 26, 26);
    drawingContext.restore();
  }
  drawSettingsPanel(fw, deathsX);
}

function drawSettingsPanel(fieldWidth, deathsX) {
  if (!settingsOpen) return;

  const panelW = 202;
  const panelH = 215;
  const x = max(12, min(fieldWidth - panelW - 12, deathsX + 2));
  const y = 58;

  noStroke();
  fill(37, 39, 44, 238);
  rect(x + 3, y + 3, panelW, panelH, 5);
  fill('#493a4c');
  rect(x, y, panelW, panelH, 5);
  fill(C.paper);
  rect(x + 3, y + 3, panelW - 6, panelH - 6, 3);

  fill(C.ink);
  textAlign(LEFT, CENTER);
  textStyle(BOLD);
  textSize(12);
  text('SETTINGS', x + 12, y + 16);
  textStyle(NORMAL);

  const rowX = x + 9;
  const rowW = panelW - 18;
  const rowH = 29;
  const firstY = y + 30;
  uiButton(rowX, firstY, rowW, rowH, `MUSIC  ${musicEnabled ? 'ON' : 'OFF'}`, musicEnabled ? 'on' : '', () => {
    setMusicEnabled(!musicEnabled);
    GameStorage.set('larpdevil.musicEnabled', musicEnabled);
  });
  uiButton(rowX, firstY + 32, rowW, rowH, `SOUND EFFECTS  ${soundEffectsEnabled ? 'ON' : 'OFF'}`, soundEffectsEnabled ? 'on' : '', () => {
    setSoundEffectsEnabled(!soundEffectsEnabled);
    GameStorage.set('larpdevil.soundEffectsEnabled', soundEffectsEnabled);
  });
  uiButton(rowX, firstY + 64, rowW, rowH, `SCREEN SHAKE  ${gameSettings.screenShake ? 'ON' : 'OFF'}`, gameSettings.screenShake ? 'on' : '', () => {
    gameSettings.screenShake = !gameSettings.screenShake;
    if (!gameSettings.screenShake) shake = 0;
    GameStorage.set('larpdevil.screenShake', gameSettings.screenShake);
  });
  uiButton(rowX, firstY + 96, rowW, rowH, `PARTICLES  ${gameSettings.particles ? 'ON' : 'OFF'}`, gameSettings.particles ? 'on' : '', () => {
    gameSettings.particles = !gameSettings.particles;
    if (!gameSettings.particles) particles = [];
    GameStorage.set('larpdevil.particles', gameSettings.particles);
  });
  uiButton(rowX, firstY + 128, rowW, rowH, micState === 'on' ? 'VOICE: READY' : 'VOICE SETUP', micState === 'on' ? 'on' : '', () => {
    settingsOpen = false;
    openAudioTutorial('play');
  });
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

