// ==========================================
// WEB AUDIO RECOGNITION SYSTEM
// ==========================================

let audioContext, analyser, stream, wave, spectrum;
let noiseFloor = 0.008;
let signatures = Array(4).fill(null);
let training = -1, listening = false, capture = null;
let lastSample = 0, armedAt = 0, micState = 'off';
let audioStatus = 'Enable mic, record 4 sounds, then listen. (Or use Arrow Keys)';

let audioX = { value: 0, until: 0 };
let moveSeconds = 0.75;
let backgroundMusic;
let musicEnabled = true;
let soundEffectsEnabled = true;
let notificationSound;
let ladderSound;
let deathSound;
let gateSound;
let ladderSoundTimer = null;
let ladderSoundActive = false;
const ladderSoundInstances = new Set();

function stopLadderSoundInstances() {
  for (const instance of ladderSoundInstances) {
    instance.pause();
    instance.currentTime = 0;
  }
  ladderSoundInstances.clear();
}

function setSoundEffectsEnabled(enabled) {
  soundEffectsEnabled = enabled;
  if (soundEffectsEnabled) return;

  for (const sound of [notificationSound, deathSound, gateSound]) {
    if (!sound) continue;
    sound.pause();
    sound.currentTime = 0;
  }
  clearInterval(ladderSoundTimer);
  ladderSoundTimer = null;
  ladderSoundActive = false;
  stopLadderSoundInstances();
}

function playGateSound() {
  if (!soundEffectsEnabled) return;

  if (!gateSound) {
    gateSound = new Audio('good.mp3');
    gateSound.preload = 'auto';
    gateSound.volume = 0.55;
    gateSound.addEventListener('error', () => {
      console.error('Unable to load good.mp3', gateSound.error);
    });
  }

  gateSound.currentTime = 0;
  gateSound.play().catch(error => {
    if (error.name === 'AbortError') return;
    console.warn('Gate sound could not start:', error);
  });
}

function playDeathSound() {
  if (!soundEffectsEnabled) return;

  if (!deathSound) {
    deathSound = new Audio('glass-breaking.mp3');
    deathSound.preload = 'auto';
    deathSound.volume = 0.55;
    deathSound.addEventListener('error', () => {
      console.error('Unable to load glass-breaking.mp3', deathSound.error);
    });
  }

  deathSound.currentTime = 0;
  deathSound.play().catch(error => {
    if (error.name === 'AbortError') return;
    console.warn('Death sound could not start:', error);
  });
}

function playLadderSound() {
  if (!ladderSound || !soundEffectsEnabled) return;

  const instance = ladderSound.cloneNode();
  instance.volume = ladderSound.volume;
  ladderSoundInstances.add(instance);
  instance.addEventListener('ended', () => ladderSoundInstances.delete(instance), { once: true });
  instance.play().catch(error => {
    ladderSoundInstances.delete(instance);
    if (error.name === 'AbortError') return;
    console.warn('Ladder sound could not start:', error);
  });
}

function setLadderSoundActive(active) {
  active = active && soundEffectsEnabled;
  if (active === ladderSoundActive) return;
  ladderSoundActive = active;

  if (active) {
    if (!ladderSound) {
      ladderSound = new Audio('ladder.mp3');
      ladderSound.preload = 'auto';
      ladderSound.volume = 0.5;
      ladderSound.addEventListener('error', () => {
        console.error('Unable to load ladder.mp3', ladderSound.error);
      });
    }
    playLadderSound();
    ladderSoundTimer = setInterval(playLadderSound, 500);
  } else {
    clearInterval(ladderSoundTimer);
    ladderSoundTimer = null;
  }
}

function playNotificationSound() {
  if (!soundEffectsEnabled) return;

  if (!notificationSound) {
    notificationSound = new Audio('new-msg.mp3');
    notificationSound.preload = 'auto';
    notificationSound.volume = 0.45;
    notificationSound.addEventListener('error', () => {
      console.error('Unable to load new-msg.mp3', notificationSound.error);
    });
  }

  notificationSound.currentTime = 0;
  notificationSound.play().catch(error => {
    if (error.name === 'AbortError') return;
    console.warn('Notification sound could not start:', error);
  });
}

function startBackgroundMusic() {
  if (!musicEnabled) return;

  if (!backgroundMusic) {
    backgroundMusic = new Audio('background-music.mp3');
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.22;
    backgroundMusic.addEventListener('error', () => {
      console.error('Unable to load background-music.mp3', backgroundMusic.error);
    });
  }

  if (backgroundMusic.paused) {
    backgroundMusic.play().catch(error => {
      if (error.name === 'AbortError') return;
      console.warn('Background music could not start:', error);
    });
  }
}

function setMusicEnabled(enabled) {
  musicEnabled = enabled;
  if (!musicEnabled) {
    if (backgroundMusic) backgroundMusic.pause();
    return;
  }

  startBackgroundMusic();
}

async function enableMic() {
  if (micState === 'on' || micState === 'pending') return;

  micState = 'pending';

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    micState = 'off';
    audioStatus = 'Mic requires HTTPS or localhost; arrow keys work as fallback.';
    return;
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    await audioContext.resume();

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.25;

    audioContext.createMediaStreamSource(stream).connect(analyser);

    wave = new Float32Array(analyser.fftSize);
    spectrum = new Float32Array(analyser.frequencyBinCount);

    micState = 'on';
    audioStatus = 'Record a short, distinct sound for each direction.';
  } catch (e) {
    micState = 'off';
    audioStatus = 'Microphone unavailable: ' + e.message + ' (Use Arrow keys)';
    if (stream) stream.getTracks().forEach(track => track.stop());
  }
}

function beginTraining(i) {
  if (!analyser || training >= 0) {
    audioStatus = !analyser
      ? 'Enable the microphone first.'
      : 'Finish the current recording.';
    return;
  }

  listening = false;
  capture = null;
  audioX.until = 0;
  training = i;
  armedAt = millis() + 450;
  audioStatus = `Get ready: make your ${NAMES[i]} sound after the button release.`;
}

function toggleListening() {
  if (!analyser || signatures.some(s => !s) || training >= 0) {
    audioStatus = 'Record all four sounds before listening.';
    return;
  }

  listening = !listening;
  capture = null;
  audioX.until = 0;
  audioStatus = listening
    ? 'Listening. Make one short, distinct sound.'
    : 'Listening paused.';
}

function soundFeatures() {
  analyser.getFloatTimeDomainData(wave);

  let sum = 0;
  for (const value of wave) sum += value * value;
  const volume = sqrt(sum / wave.length);

  analyser.getFloatFrequencyData(spectrum);

  const profile = Array(BINS).fill(0);
  const nyquist = audioContext.sampleRate / 2;

  for (let i = 0; i < BINS; i++) {
    const lo = max(1, floor(140 * pow(6000 / 140, i / BINS) / nyquist * analyser.fftSize));
    const hi = min(spectrum.length, ceil(140 * pow(6000 / 140, (i + 1) / BINS) / nyquist * analyser.fftSize));

    for (let j = lo; j < hi; j++) {
      profile[i] += pow(10, spectrum[j] / 20);
    }
  }

  const total = profile.reduce((a, b) => a + b, 0) || 1;
  return {
    volume,
    profile: profile.map(v => v / total)
  };
}

function makeSignature(frames, duration) {
  const features = [];

  for (let part = 0; part < 3; part++) {
    const start = floor(part * frames.length / 3);
    const end = max(floor((part + 1) * frames.length / 3), start + 1);
    const selected = frames.slice(start, end);

    for (let band = 0; band < BINS; band++) {
      features.push(
        selected.reduce((sum, f) => sum + f.profile[band], 0) / selected.length
      );
    }
  }

  return { features, duration };
}

function signatureDistance(a, b) {
  let total = 0;
  for (let i = 0; i < a.features.length; i++) {
    total += abs(a.features[i] - b.features[i]);
  }

  return total / 3 + 0.10 * abs(Math.log(a.duration / b.duration));
}

function finishCapture(now) {
  const finished = capture;
  capture = null;

  if (finished.frames.length < 4) {
    audioStatus = 'Too short. Click the direction to record it again.';
    training = -1;
    return;
  }

  const sample = makeSignature(finished.frames, now - finished.started);

  if (training >= 0) {
    signatures[training] = sample;
    audioStatus = `Saved ${NAMES[training]}. ` + (signatures.every(Boolean) ? 'Start listening!' : 'Record the other sounds.');
    training = -1;
  } else if (listening) {
    const ranked = signatures
      .map((s, i) => ({ i, score: signatureDistance(s, sample) }))
      .sort((a, b) => a.score - b.score);

    if (ranked[0].score < 0.65 && ranked[1].score - ranked[0].score > 0.055) {
      const dir = ranked[0].i;

      if (dir === 1 || dir === 2) {
        audioX = {
          value: dir === 1 ? -1 : 1,
          until: now + moveSeconds * 1000
        };
      }
      if (dir === 3) jumpQueuedUntil = now + 250;
      if (dir === 0) audioX.until = 0;

      audioStatus = `Heard ${NAMES[dir]}. ` + (dir === 3 ? 'Jump!' : dir === 0 ? 'Stopped.' : `Moving for ${moveSeconds.toFixed(2)} s.`);
    } else {
      audioStatus = 'Sound unclear: retry, or record more distinct sounds.';
    }
  }
}

function processAudio(now) {
  if (!analyser || (training < 0 && !listening) || now - lastSample < SAMPLE_MS) {
    return;
  }

  lastSample = now;
  const sample = soundFeatures();

  if (now < armedAt) return;

  if (!capture) {
    noiseFloor = 0.995 * noiseFloor + 0.005 * min(sample.volume, 0.04);

    if (sample.volume > max(0.018, noiseFloor * 3.3)) {
      capture = {
        started: now,
        lastLoud: now,
        frames: [sample]
      };
      audioStatus = training >= 0
        ? `Recording ${NAMES[training]}...`
        : 'Recognizing sound...';
    }
    return;
  }

  if (sample.volume > max(0.012, noiseFloor * 2.3)) {
    capture.lastLoud = now;
    capture.frames.push(sample);
  }

  if (now - capture.lastLoud > 180 || now - capture.started > 2200) {
    finishCapture(now);
    armedAt = now + 90;
  }
}