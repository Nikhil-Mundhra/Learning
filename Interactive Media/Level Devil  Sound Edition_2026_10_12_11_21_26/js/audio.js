// ==========================================
// WEB AUDIO & VOICE POWERS SYSTEM (PAUSE / REWIND)
// ==========================================

let audioContext, analyser, stream, wave, spectrum;
let noiseFloor = 0.008;
let lastSample = 0, armedAt = 0, micState = 'off';
let audioStatus = 'Enable mic to calibrate your 3-second hum.';

// Selected Voice Ability:
// 'pause'  -> Freeze time up to 3.0 seconds, grayscale world (once per level)
// 'rewind' -> Reverse time by 2.0 seconds (once per level)
let selectedVoicePower = 'pause';

// 3-Second Whole Hum Calibration System
let humCalibration = {
  recorded: false,
  recording: false,
  progress: 0,
  target: 3.0,
  avgPitch: 0,
  samples: [],
  silenceTimer: 0,
  statusMessage: 'Ready to calibrate. Hold a continuous hum for 3 full seconds whole.'
};

// Ability State Management:
// - Single use per level attempt / reset
const TIME_FREEZE_MAX = 3.0;
let timeFreezeMaxDuration = TIME_FREEZE_MAX;
let timeFreezeLeft = TIME_FREEZE_MAX;
let timeFreezeUsed = false;
let timeFreezeUsedAmount = 0;
let timeFreezeActive = false;
let timeFreezeGrace = 0;

function getAbilityMaxDuration(levelIdx = 0) {
  // level 1 (idx 0) -> 0s
  // level 3 (idx 2) -> 1s
  // level 7 (idx 6) -> 2s
  // level 10 (idx 9) -> 3s
  const displayLvl = levelIdx + 1;
  if (displayLvl < 3) return 0;
  if (displayLvl < 7) return 1.0;
  if (displayLvl < 10) return 2.0;
  return 3.0;
}

// Rewind State:
let rewindActive = false;
let rewindTargetTime = 0;
let timeHistory = [];

// Live Hum Detection Telemetry
let isHumming = false;
let humVolume = 0;
let humPitch = 0;
let humConfidence = 0;

// Legacy / Compatibility Stubs
let audioX = { value: 0, until: 0 };
let moveSeconds = 0.75;
let signatures = Array(4).fill(true);
let training = -1, listening = false;

// Audio Assets & Channels
let backgroundMusic;
let musicEnabled = true;
let soundEffectsEnabled = true;
let notificationSound;
let ladderSound;
let deathSound;
let gateSound;
let ladderSoundTimer = null;
let ladderSoundActive = false;
const activeSoundInstances = new Set();

function stopAllSoundEffects() {
  for (const instance of activeSoundInstances) {
    try {
      instance.pause();
      instance.currentTime = 0;
    } catch (e) {}
  }
  activeSoundInstances.clear();
}

function setSoundEffectsEnabled(enabled) {
  soundEffectsEnabled = enabled;
  if (soundEffectsEnabled) return;

  stopAllSoundEffects();
  clearInterval(ladderSoundTimer);
  ladderSoundTimer = null;
  ladderSoundActive = false;
  stopLadderSoundInstances();
}

function playSoundInstance(baseAudio, path, volume) {
  if (!soundEffectsEnabled) return baseAudio;
  initAudioContext();

  if (!baseAudio) {
    baseAudio = new Audio(path);
    baseAudio.preload = 'auto';
    baseAudio.volume = volume;
    baseAudio.addEventListener('error', () => {
      console.error(`Unable to load ${path}`, baseAudio.error);
    });
  }

  try {
    const instance = baseAudio.cloneNode();
    instance.volume = volume;
    activeSoundInstances.add(instance);
    instance.addEventListener('ended', () => activeSoundInstances.delete(instance), { once: true });
    instance.play().catch(error => {
      activeSoundInstances.delete(instance);
      if (error.name === 'AbortError') return;
      console.warn(`Audio playback error for ${path}:`, error);
    });
  } catch (err) {
    console.warn(`Error cloning audio for ${path}:`, err);
  }

  return baseAudio;
}

function playGateSound() {
  if (!soundEffectsEnabled) return;
  gateSound = playSoundInstance(gateSound, 'assets/audio/good.mp3', 0.55);
}

function playDeathSound() {
  if (!soundEffectsEnabled) return;
  deathSound = playSoundInstance(deathSound, 'assets/audio/glass-breaking.mp3', 0.55);
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
      ladderSound = new Audio('assets/audio/ladder.mp3');
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
  notificationSound = playSoundInstance(notificationSound, 'assets/audio/new-msg.mp3', 0.45);
}

// Procedural Time Freeze & Rewind Synthesizer Sounds
function playFreezeSound() {
  if (!audioContext || !soundEffectsEnabled) return;
  try {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;

    osc.type = 'sine';
    // Glissando warp down to signal time stopping
    osc.frequency.setValueAtTime(540, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.32);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.start(now);
    osc.stop(now + 0.36);
  } catch (e) {
    console.warn('Freeze sound warning:', e);
  }
}

function playUnfreezeSound() {
  if (!audioContext || !soundEffectsEnabled) return;
  try {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;

    osc.type = 'triangle';
    // Bright upward chime to signal time resuming
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.22);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.start(now);
    osc.stop(now + 0.26);
  } catch (e) {
    console.warn('Unfreeze sound warning:', e);
  }
}

function playRewindSound() {
  if (!audioContext || !soundEffectsEnabled) return;
  try {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;

    osc.type = 'sawtooth';
    // Fast flutter / reverse tape effect
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.linearRampToValueAtTime(780, now + 0.15);
    osc.frequency.linearRampToValueAtTime(320, now + 0.35);
    osc.frequency.linearRampToValueAtTime(880, now + 0.6);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.start(now);
    osc.stop(now + 0.65);
  } catch (e) {
    console.warn('Rewind sound warning:', e);
  }
}

function playSuccessSound() {
  if (!audioContext || !soundEffectsEnabled) return;
  try {
    const now = audioContext.currentTime;
    const osc1 = audioContext.createOscillator();
    const osc2 = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(523.25, now);
    osc1.frequency.setValueAtTime(659.25, now + 0.12);
    osc1.frequency.setValueAtTime(783.99, now + 0.24);

    osc2.frequency.setValueAtTime(261.63, now);
    osc2.frequency.setValueAtTime(329.63, now + 0.12);
    osc2.frequency.setValueAtTime(392.00, now + 0.24);

    gain.gain.setValueAtTime(0.26, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audioContext.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.55);
    osc2.stop(now + 0.55);
  } catch (e) {
    console.warn('Success sound warning:', e);
  }
}

function startBackgroundMusic() {
  if (!musicEnabled) return;

  if (!backgroundMusic) {
    backgroundMusic = new Audio('assets/audio/background-music.mp3');
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

// ==========================================
// STATE MANAGEMENT & CALIBRATION
// ==========================================

function resetTimeFreeze(levelIdx = (typeof levelIndex !== 'undefined' ? levelIndex : 0)) {
  timeFreezeMaxDuration = getAbilityMaxDuration(levelIdx);
  timeFreezeLeft = timeFreezeMaxDuration;
  timeFreezeUsed = false;
  timeFreezeUsedAmount = 0;
  timeFreezeActive = false;
  timeFreezeGrace = 0;
  rewindActive = false;
  rewindTargetTime = 0;
  timeHistory = [];
  if (backgroundMusic) {
    backgroundMusic.playbackRate = 1.0;
  }
}

function startHumCalibration() {
  if (micState !== 'on') {
    enableMic();
    return;
  }
  humCalibration.recording = true;
  humCalibration.progress = 0;
  humCalibration.samples = [];
  humCalibration.silenceTimer = 0;
  humCalibration.statusMessage = 'Humming... keep holding for 3 seconds whole!';
}

function updateHumCalibration(dt, manualHum = false) {
  if (!humCalibration.recording) return;

  const activeHum = isHumming || manualHum;

  if (activeHum) {
    humCalibration.silenceTimer = 0;
    humCalibration.progress += dt;
    if (humPitch > 0) humCalibration.samples.push(humPitch);
    humCalibration.statusMessage = `Recording hum... ${humCalibration.progress.toFixed(1)}s / 3.0s`;

    if (humCalibration.progress >= humCalibration.target) {
      humCalibration.progress = humCalibration.target;
      humCalibration.recording = false;
      humCalibration.recorded = true;
      humCalibration.avgPitch = humCalibration.samples.length > 0
        ? Math.round(humCalibration.samples.reduce((a, b) => a + b, 0) / humCalibration.samples.length)
        : 180;
      humCalibration.statusMessage = `✓ Calibrated 3s hum (~${humCalibration.avgPitch} Hz)! Ability ready.`;
      playSuccessSound();
    }
  } else {
    humCalibration.silenceTimer += dt;
    // If player stops humming for > 0.35s before reaching 3.0s:
    if (humCalibration.silenceTimer > 0.35 && humCalibration.progress > 0) {
      humCalibration.progress = 0;
      humCalibration.samples = [];
      humCalibration.statusMessage = 'Hum dropped! Must hold for 3 seconds whole without stopping.';
    }
  }
}

function updateTimeFreeze(dt, manualHumKey = false) {
  const wantsHum = isHumming || manualHumKey;

  if (!timeFreezeUsed && timeFreezeMaxDuration > 0 && timeFreezeLeft > 0) {
    if (wantsHum) {
      if (!timeFreezeActive) {
        timeFreezeActive = true;
        playFreezeSound();
        if (backgroundMusic) backgroundMusic.playbackRate = 0.72;
      }
      timeFreezeGrace = 0.24; // 240ms grace period for vocal micro-breaks
      const consumed = Math.min(timeFreezeLeft, dt);
      timeFreezeLeft = Math.max(0, timeFreezeLeft - consumed);
      timeFreezeUsedAmount += consumed;
      if (timeFreezeLeft <= 0) {
        timeFreezeActive = false;
        timeFreezeUsed = true;
        playUnfreezeSound();
        if (backgroundMusic) backgroundMusic.playbackRate = 1.0;
      }
    } else if (timeFreezeActive) {
      timeFreezeGrace -= dt;
      if (timeFreezeGrace <= 0) {
        timeFreezeActive = false;
        timeFreezeUsed = true; // Single use per level/reset!
        playUnfreezeSound();
        if (backgroundMusic) backgroundMusic.playbackRate = 1.0;
      } else {
        const consumed = Math.min(timeFreezeLeft, dt);
        timeFreezeLeft = Math.max(0, timeFreezeLeft - consumed);
        timeFreezeUsedAmount += consumed;
        if (timeFreezeLeft <= 0) {
          timeFreezeActive = false;
          timeFreezeUsed = true;
          playUnfreezeSound();
          if (backgroundMusic) backgroundMusic.playbackRate = 1.0;
        }
      }
    }
  } else if (timeFreezeActive) {
    timeFreezeActive = false;
    timeFreezeUsed = true;
    playUnfreezeSound();
    if (backgroundMusic) backgroundMusic.playbackRate = 1.0;
  }
}

function initAudioContext() {
  if (!audioContext) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      audioContext = new AudioCtx();
    }
  }
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
}

// ==========================================
// MICROPHONE INITIALIZATION & ANALYSIS
// ==========================================

async function enableMic() {
  if (micState === 'on' || micState === 'pending') return;

  micState = 'pending';

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    micState = 'off';
    audioStatus = 'Mic requires HTTPS or localhost; hold "H" works as keyboard fallback.';
    return;
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    initAudioContext();
    if (audioContext && audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.2;

    audioContext.createMediaStreamSource(stream).connect(analyser);

    wave = new Float32Array(analyser.fftSize);
    spectrum = new Float32Array(analyser.frequencyBinCount);

    micState = 'on';
    listening = true;
    audioStatus = 'Microphone ready. Hold a hum for 3 seconds whole to calibrate!';
  } catch (e) {
    micState = 'off';
    audioStatus = 'Microphone unavailable: ' + e.message + ' (Hold "H" works as fallback)';
    if (stream) stream.getTracks().forEach(track => track.stop());
  }
}

function toggleListening() {
  if (micState !== 'on') {
    enableMic();
    return;
  }
  listening = !listening;
  audioStatus = listening ? 'Listening for humming...' : 'Listening paused.';
}

function beginTraining(i) {
  audioStatus = 'Record your 3-second hum whole to calibrate!';
}

function processAudio(now) {
  if (!analyser || !audioContext || micState !== 'on' || !listening) {
    isHumming = false;
    humVolume = 0;
    humPitch = 0;
    humConfidence = 0;
    return;
  }

  analyser.getFloatTimeDomainData(wave);
  analyser.getFloatFrequencyData(spectrum);

  // 1. RMS Energy Calculation
  let sum = 0;
  for (let i = 0; i < wave.length; i++) {
    sum += wave[i] * wave[i];
  }
  const rms = Math.sqrt(sum / wave.length);
  humVolume = Math.min(1, rms * 16);

  // Dynamically adapt ambient noise floor
  noiseFloor = 0.993 * noiseFloor + 0.007 * Math.min(rms, 0.035);

  const threshold = Math.max(0.015, noiseFloor * 2.1);
  if (rms < threshold) {
    isHumming = false;
    humPitch = 0;
    humConfidence = 0;
    return;
  }

  // 2. Autocorrelation Pitch Detection (Targeting vocal humming 75Hz - 480Hz)
  const sampleRate = audioContext.sampleRate;
  const minPeriod = Math.floor(sampleRate / 480);
  const maxPeriod = Math.floor(sampleRate / 75);

  let bestR = 0;
  let bestPeriod = -1;

  const corrLen = Math.min(512, wave.length - maxPeriod);
  let norm1 = 0;
  for (let i = 0; i < corrLen; i++) norm1 += wave[i] * wave[i];

  if (norm1 > 1e-5) {
    for (let period = minPeriod; period <= maxPeriod; period += 2) {
      let corr = 0;
      let norm2 = 0;
      for (let i = 0; i < corrLen; i++) {
        const w1 = wave[i];
        const w2 = wave[i + period];
        corr += w1 * w2;
        norm2 += w2 * w2;
      }
      const r = corr / (Math.sqrt(norm1 * norm2) + 1e-6);
      if (r > bestR) {
        bestR = r;
        bestPeriod = period;
      }
    }
  }

  const pitch = bestPeriod > 0 ? sampleRate / bestPeriod : 0;
  humPitch = pitch;
  humConfidence = bestR;

  // 3. Spectral Energy Focus (Humming concentrates power below 1400Hz)
  const nyquist = sampleRate / 2;
  const binHz = nyquist / spectrum.length;
  const lowBin = Math.floor(70 / binHz);
  const midBin = Math.min(spectrum.length - 1, Math.ceil(1400 / binHz));

  let lowEnergy = 0;
  let totalEnergy = 0;
  for (let i = 0; i < spectrum.length; i++) {
    const linear = Math.pow(10, spectrum[i] / 20);
    totalEnergy += linear;
    if (i >= lowBin && i <= midBin) lowEnergy += linear;
  }
  const lowMidRatio = totalEnergy > 0 ? lowEnergy / totalEnergy : 0;

  // Voiced pitch with low/mid harmonic energy
  const isVoiced = bestR > 0.54 && pitch >= 75 && pitch <= 450;
  const isConcentrated = lowMidRatio > 0.48;

  isHumming = isVoiced && isConcentrated;

  if (isHumming) {
    audioStatus = `Humming detected! (${Math.round(pitch)} Hz - Voiced)`;
  } else if (micState === 'on') {
    audioStatus = 'Listening: hum steadily into your mic.';
  }
}