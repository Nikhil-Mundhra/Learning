// ==========================================
// Keyboard tracking (activeKeys), focus handling and key helpers
// ==========================================

// ==========================================
// BULLETPROOF INPUT SYSTEM & KEYBOARD TRACKING
// ==========================================
const activeKeys = new Set();

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', e => {
    activeKeys.add(e.keyCode);
    activeKeys.add(e.which);
    if (e.code) activeKeys.add(e.code);
    if (e.key) {
      activeKeys.add(e.key);
      activeKeys.add(e.key.toLowerCase());
      activeKeys.add(e.key.toUpperCase());
    }
  }, { capture: true });

  window.addEventListener('keyup', e => {
    activeKeys.delete(e.keyCode);
    activeKeys.delete(e.which);
    if (e.code) activeKeys.delete(e.code);
    if (e.key) {
      activeKeys.delete(e.key);
      activeKeys.delete(e.key.toLowerCase());
      activeKeys.delete(e.key.toUpperCase());
    }
  }, { capture: true });

  window.addEventListener('blur', () => {
    activeKeys.clear();
  });

  // mousePressed()/touchStarted() return false, which makes p5 preventDefault()
  // the click and stops the browser from moving focus into this frame (e.g. the
  // p5 Web Editor preview). Grab focus explicitly, at several points in the
  // event sequence, so it works regardless of preventDefault.
  const grabFocus = () => {
    try { window.focus(); } catch (_) {}
    const cv = document.querySelector('canvas');
    if (cv) {
      if (!cv.hasAttribute('tabindex')) cv.setAttribute('tabindex', '0');
      cv.focus({ preventScroll: true });
    }
  };
  ['pointerdown', 'mousedown', 'touchstart', 'pointerup', 'mouseup', 'click'].forEach(ev =>
    window.addEventListener(ev, grabFocus, { capture: true, passive: true })
  );
}

// Reads only from activeKeys (filled by native keydown/keyup listeners above),
// which already holds keyCodes, e.code and e.key values. p5's keyIsDown() is
// deliberately not used: it warns when given anything but a number.
function keyAny() {
  for (let i = 0; i < arguments.length; i++) {
    if (activeKeys.has(arguments[i])) return true;
  }
  return false;
}

function keyVal() {
  return typeof key === 'string' ? key : '';
}

function codeVal() {
  return typeof code === 'undefined' ? '' : typeof code === 'string' ? code : '';
}

function codeNum() {
  return typeof keyCode === 'number' ? keyCode : -1;
}

function isNavKey(k = keyVal(), c = codeVal(), n = codeNum()) {
  return (
    ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Space'].includes(k) ||
    ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(c) ||
    [32, 37, 38, 39, 40].includes(n)
  );
}

