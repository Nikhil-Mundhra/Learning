// ==========================================
// p5 pointer and keyboard event handlers
// ==========================================

function mousePressed() {
  initAudioContext();
  startBackgroundMusic();

  const x = mouseX / view.s;
  const y = (mouseY - view.oy) / view.s;

  if (state === 'title') {
    for (let i = 0; i < SKINS.length; i++) {
      const r = swatchRect(i);
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
        skinIndex = i;
        titleFocus = 'skin';
        return false;
      }
    }
    for (let i = 0; i < THEMES.length; i++) {
      const r = themeRect(i);
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
        selectTheme(i);
        titleFocus = 'theme';
        return false;
      }
    }
  }

  return clickAt(x, y);
}

function clickAt(x, y) {
  for (const b of buttons) {
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
      if (b.action) b.action();
      return false;
    }
  }
  if (settingsOpen) settingsOpen = false;
  return false;
}

function touchStarted() {
  initAudioContext();
  startBackgroundMusic();

  if (touches.length) {
    const x = touches[0].x / view.s;
    const y = (touches[0].y - view.oy) / view.s;
    if (state === 'title') {
      for (let i = 0; i < SKINS.length; i++) {
        const r = swatchRect(i);
        if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
          skinIndex = i;
          titleFocus = 'skin';
          return false;
        }
      }
      for (let i = 0; i < THEMES.length; i++) {
        const r = themeRect(i);
        if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
          selectTheme(i);
          titleFocus = 'theme';
          return false;
        }
      }
    }
    return clickAt(x, y);
  }
  return false;
}

function keyPressed(e) {
  initAudioContext();
  startBackgroundMusic();

  const k = (e && e.key) || keyVal();
  const c = (e && e.code) || codeVal();
  const n = (e && (e.keyCode || e.which)) || codeNum();

  if (settingsOpen && (k === 'Escape' || c === 'Escape' || n === 27)) {
    settingsOpen = false;
    return false;
  }

  if (state === 'title') {
    if (c === 'ArrowDown' || k === 'ArrowDown' || n === 40 || k === 's' || k === 'S' || c === 'KeyS') {
      titleFocus = titleFocus === 'skin' ? 'theme' : 'begin';
      return false;
    }
    if (c === 'ArrowUp' || k === 'ArrowUp' || n === 38 || k === 'w' || k === 'W' || c === 'KeyW') {
      titleFocus = titleFocus === 'begin' ? 'theme' : 'skin';
      return false;
    }

    const direction =
      (c === 'ArrowLeft' || k === 'ArrowLeft' || n === 37 || k === 'a' || k === 'A' || c === 'KeyA' || n === 65) ? -1 :
      (c === 'ArrowRight' || k === 'ArrowRight' || n === 39 || k === 'd' || k === 'D' || c === 'KeyD' || n === 68) ? 1 :
      0;
    if (direction !== 0) {
      if (titleFocus === 'skin') {
        skinIndex = (skinIndex + direction + SKINS.length) % SKINS.length;
      } else if (titleFocus === 'theme') {
        cycleTheme(direction);
      }
      return false;
    }

    if (n === 13 || n === 32 || k === 'Enter' || k === ' ' || c === 'Space' || c === 'NumpadEnter') {
      beginTutorial();
      return false;
    }
    return true;
  }

  if (state === 'tutorialControls') {
    if (n === 13 || n === 32 || k === 'Enter' || k === ' ' || c === 'Space' || k === 'Escape' || c === 'NumpadEnter') {
      startGame();
      return false;
    }
    return true;
  }

  if (state === 'tutorialAudio') {
    if (n === 13 || n === 32 || k === 'Enter' || k === ' ' || c === 'Space' || c === 'NumpadEnter') {
      // Must be calibrated to proceed!
      if (humCalibration.recorded) {
        if (tutorialReturnState === 'play') resumeGame();
        else startGame();
      }
      return false;
    }
    if (k === 'Escape' || n === 27) {
      // Compulsory - cannot escape if not calibrated
      if (humCalibration.recorded) {
        if (tutorialReturnState === 'play') resumeGame();
        else startGame();
      }
      return false;
    }
    return true;
  }

  if (state === 'ending') {
    if (n === 13 || n === 32 || k === 'Enter' || k === ' ' || c === 'Space') {
      state = 'title';
      titleT = 0;
      return false;
    }
    return true;
  }

  if (k === 'r' || k === 'R' || c === 'KeyR' || n === 82) resetLevel();

  if (isNavKey(k, c, n)) {
    return false;
  }
}

function keyReleased(e) {
  const k = (e && e.key) || keyVal();
  const c = (e && e.code) || codeVal();
  const n = (e && (e.keyCode || e.which)) || codeNum();
  if (isNavKey(k, c, n)) {
    return false;
  }
}