// ==========================================
// Voice/hum powers (time freeze, rewind)
// ==========================================

function handleVoicePowers(dt, humKey) {
  if (level.doorMode) {
    // In Level 12 (doorMode), the player is stationary and controlling the door.
    // Time freeze/rewind are disabled. Instead, humming opens the door and keeps it open!
    const wantsHum = isHumming || humKey;
    if (wantsHum) {
      doorHumOpen = min(1, doorHumOpen + dt * 3.5);
    } else {
      doorHumOpen = max(0, doorHumOpen - dt * 2.5);
    }
    return false;
  }

  if (selectedVoicePower === 'rewind') {
    // ------------------------------------------
    // REWIND POWER: REVERSE TIME BY 2 SECONDS
    // ------------------------------------------
    if (!timeFreezeUsed && !rewindActive && (isHumming || humKey) && timeHistory.length > 5) {
      rewindActive = true;
      rewindTargetTime = max(0, gameTime - 2.0);
      playRewindSound();
      if (backgroundMusic) backgroundMusic.playbackRate = 0.5;
    }

    if (rewindActive) {
      // Step backwards through timeHistory (rewind speed ~ 2.5x)
      const steps = min(timeHistory.length, 3);
      for (let s = 0; s < steps; s++) {
        if (timeHistory.length > 0) {
          const snap = timeHistory.pop();
          player.x = snap.x;
          player.y = snap.y;
          player.vx = snap.vx;
          player.vy = snap.vy;
          player.grounded = snap.grounded;
          player.face = snap.face;
          stamina = snap.stamina;
          gameTime = snap.time;
          if (snap.traps) {
            snap.traps.forEach((st, i) => {
              if (level.traps[i]) {
                level.traps[i].active = st.active;
                level.traps[i].timer = st.timer;
                level.traps[i].value = st.value;
                level.traps[i].done = st.done;
              }
            });
          }
        }
      }

      if (timeHistory.length === 0 || gameTime <= rewindTargetTime) {
        rewindActive = false;
        timeFreezeUsed = true; // Once per level / reset!
        playUnfreezeSound();
        if (backgroundMusic) backgroundMusic.playbackRate = 1.0;
      }

      updateCamera();
      return true; // Freeze keyboard input & game physics while rewinding!
    } else {
      // Record rolling snapshot of the past ~2.6 seconds
      timeHistory.push({
        time: gameTime,
        x: player.x,
        y: player.y,
        vx: player.vx,
        vy: player.vy,
        grounded: player.grounded,
        face: player.face,
        stamina,
        traps: level.traps.map(t => ({ active: t.active, timer: t.timer, value: t.value, done: t.done }))
      });
      while (timeHistory.length > 1 && timeHistory[0].time < gameTime - 2.6) {
        timeHistory.shift();
      }
    }
  } else {
    // ------------------------------------------
    // PAUSE TIME POWER (UP TO 3 SECONDS)
    // ------------------------------------------
    updateTimeFreeze(dt, humKey);
  }
  return false;
}

