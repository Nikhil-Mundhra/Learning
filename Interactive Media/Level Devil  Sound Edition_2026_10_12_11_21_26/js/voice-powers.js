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
    // REWIND POWER: REVERSE WORLD TIME BY UP TO 2 SECONDS
    // The player is NOT affected and remains fully movable!
    // ------------------------------------------
    if (!timeFreezeUsed && !rewindActive && (isHumming || humKey) && timeHistory.length > 5) {
      rewindActive = true;
      rewindTargetTime = max(0, gameTime - 2.0);
      playRewindSound();
      if (backgroundMusic) backgroundMusic.playbackRate = 0.5;
    }

    if (rewindActive) {
      // Step backwards through world history (2 snapshots per frame = ~2x rewind speed)
      const steps = min(timeHistory.length, 2);
      for (let s = 0; s < steps; s++) {
        if (timeHistory.length > 0) {
          const snap = timeHistory.pop();
          gameTime = snap.time;
          if (snap.traps) {
            snap.traps.forEach((st, i) => {
              const t = level.traps[i];
              if (t) {
                t.x = st.x;
                t.y = st.y;
                t.active = st.active;
                t.timer = st.timer;
                t.value = st.value;
                t.done = st.done;
                t.nearTimer = st.nearTimer;
              }
            });
          }
          if (snap.platforms) {
            snap.platforms.forEach((sp, i) => {
              const p = level.platforms[i];
              if (p) {
                if (p.kind !== 'moving') p.x = sp.x;
                p.timer = sp.timer;
                p.gone = sp.gone;
              }
            });
          }
          if (snap.door && level.door) {
            level.door.x = snap.door.x;
            level.door.y = snap.door.y;
            level.door.locked = snap.door.locked;
          }
          if (snap.gateEvent && level.gateEvent) {
            level.gateEvent.phase = snap.gateEvent.phase;
            level.gateEvent.timer = snap.gateEvent.timer;
            level.gateEvent.closedY = snap.gateEvent.closedY;
          }
          if (snap.exitSwitch && level.exitSwitch) {
            level.exitSwitch.active = snap.exitSwitch.active;
          }
          if (snap.hiddenLadder && level.hiddenLadder) {
            level.hiddenLadder.revealed = snap.hiddenLadder.revealed;
          }
        }
      }

      if (timeHistory.length === 0 || gameTime <= rewindTargetTime) {
        rewindActive = false;
        timeFreezeUsed = true; // Single use per level/reset
        playUnfreezeSound();
        if (backgroundMusic) backgroundMusic.playbackRate = 1.0;
      }

      // Player remains completely movable - do not freeze or return true!
      return false;
    } else if (!timeFreezeUsed) {
      // Record rolling snapshot of the world over the past ~2.6 seconds
      timeHistory.push({
        time: gameTime,
        traps: level.traps.map(t => ({
          x: t.x,
          y: t.y,
          active: t.active,
          timer: t.timer,
          value: t.value,
          done: t.done,
          nearTimer: t.nearTimer
        })),
        platforms: level.platforms.map(p => ({
          x: p.x,
          timer: p.timer,
          gone: p.gone
        })),
        door: level.door ? {
          x: level.door.x,
          y: level.door.y,
          locked: level.door.locked
        } : null,
        gateEvent: level.gateEvent ? {
          phase: level.gateEvent.phase,
          timer: level.gateEvent.timer,
          closedY: level.gateEvent.closedY
        } : null,
        exitSwitch: level.exitSwitch ? {
          active: level.exitSwitch.active
        } : null,
        hiddenLadder: level.hiddenLadder ? {
          revealed: level.hiddenLadder.revealed
        } : null
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

