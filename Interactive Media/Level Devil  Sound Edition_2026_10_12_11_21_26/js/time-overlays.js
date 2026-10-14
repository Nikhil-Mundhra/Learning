// ==========================================
// Time-freeze and rewind overlays and HUDs
// ==========================================

function drawTimeFreezeWorldOverlay() {
  push();
  noStroke();
  // Soft monochrome stasis vignette around the edges
  fill(30, 35, 45, 55);
  rect(0, 0, FIELD.w, 10);
  rect(0, FIELD.h - 10, FIELD.w, 10);
  rect(0, 0, 10, FIELD.h);
  rect(FIELD.w - 10, 0, 10, FIELD.h);

  // Subtle pulsing border
  stroke(220, 230, 245, 140 + 60 * sin(millis() * 0.012));
  strokeWeight(2);
  noFill();
  rect(3, 3, FIELD.w - 6, FIELD.h - 6, 4);
  pop();
}

function drawTimeFreezeHUD() {
  push();
  const bannerW = 230;
  const bannerH = 42;
  const bx = (FIELD.w - bannerW) / 2;
  const by = 12;

  noStroke();
  fill(37, 39, 44, 235);
  rect(bx, by, bannerW, bannerH, 8);

  stroke('#8ae2ff');
  strokeWeight(1.5);
  noFill();
  rect(bx, by, bannerW, bannerH, 8);
  noStroke();

  fill('#8ae2ff');
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(11);
  text(`TIME FROZEN (${timeFreezeLeft.toFixed(1)}s)`, FIELD.w / 2, by + 14);

  // Depleting gauge
  fill('#20242a');
  rect(bx + 14, by + 26, bannerW - 28, 7, 3.5);

  const pct = constrain(timeFreezeLeft / TIME_FREEZE_MAX, 0, 1);
  fill('#8ae2ff');
  rect(bx + 14, by + 26, (bannerW - 28) * pct, 7, 3.5);
  textStyle(NORMAL);
  pop();
}

function drawRewindWorldOverlay() {
  push();
  noStroke();
  // VHS rewind scanlines
  fill(140, 90, 220, 32);
  for (let y = 0; y < FIELD.h; y += 8) {
    rect(0, y, FIELD.w, 3);
  }

  // Cyan/purple pulsing border
  stroke('#b27cff');
  strokeWeight(2.5);
  noFill();
  rect(3, 3, FIELD.w - 6, FIELD.h - 6, 4);
  pop();
}

function drawRewindHUD() {
  push();
  const bannerW = 240;
  const bannerH = 40;
  const bx = (FIELD.w - bannerW) / 2;
  const by = 12;

  noStroke();
  fill(37, 39, 44, 235);
  rect(bx, by, bannerW, bannerH, 8);

  stroke('#b27cff');
  strokeWeight(1.5);
  noFill();
  rect(bx, by, bannerW, bannerH, 8);
  noStroke();

  fill('#dcb5ff');
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(12);
  text('REWINDING TIME (-2.0s)', FIELD.w / 2, by + bannerH / 2);
  textStyle(NORMAL);
  pop();
}

