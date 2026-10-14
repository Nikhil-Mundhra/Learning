// ==========================================
// Top-level scene composition (drawScene)
// ==========================================

function drawScene() {
  background(C.ink);

  const fieldContext = drawingContext;
  fieldContext.save();
  fieldContext.beginPath();
  fieldContext.rect(0, 0, FIELD.w, FIELD.h);
  fieldContext.clip();

  if (timeFreezeActive) {
    fieldContext.filter = 'grayscale(100%) contrast(108%) brightness(92%)';
  } else if (rewindActive) {
    fieldContext.filter = 'hue-rotate(220deg) contrast(125%) brightness(105%)';
  } else {
    fieldContext.filter = 'none';
  }

  fill(C.sky);
  rect(0, 0, FIELD.w, FIELD.h);

  push();
  translate(
    -camX + (shake ? random(-shake, shake) : 0),
    shake ? random(-shake, shake) : 0
  );
  drawWorld();
  pop();

  if (timeFreezeActive) {
    drawTimeFreezeWorldOverlay();
  } else if (rewindActive) {
    drawRewindWorldOverlay();
  }

  fieldContext.restore();
  drawingContext.filter = 'none';

  if (timeFreezeActive) {
    drawTimeFreezeHUD();
  } else if (rewindActive) {
    drawRewindHUD();
  }

  noStroke();
  fill(37, 39, 44, 218);
  const levelLabel = `LEVEL ${String(levelIndex + 1).padStart(2, '0')} / 12  ${level.title}`;
  textSize(11);
  const hudW = max(226, textWidth(levelLabel) + 26);
  rect(12, 12, hudW, 48, 8);

  fill(C.amber);
  textSize(17);
  textStyle(BOLD);
  textAlign(LEFT, CENTER);
  text('LARP DEVIL', 23, 28);
  fill(C.white);
  textStyle(NORMAL);
  textSize(11);
  text(levelLabel, 23, 48);

  const deathsLabel = `DEATHS ${deaths}`;
  const deathsW = textWidth(deathsLabel) + 28;
  fill(37, 39, 44, 218);
  rect(FIELD.w - deathsW - 12, 12, deathsW, 38, 8);
  fill(C.white);
  textAlign(CENTER, CENTER);
  text(deathsLabel, FIELD.w - deathsW / 2 - 12, 31);
  textAlign(LEFT, CENTER);

  drawControls();

  if (state === 'dead' || (state === 'won' && winPhase === 3 && winT >= WIN_HOLD * 0.45)) {
    fill(37, 39, 44, 185);
    rect(0, FIELD.y, FIELD.w, FIELD.h);

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

