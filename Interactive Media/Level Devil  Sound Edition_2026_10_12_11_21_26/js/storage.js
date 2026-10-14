// ==========================================
// localStorage wrapper (GameStorage)
// ==========================================

const GameStorage = {
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem(key);
      return v !== null ? v : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, val) {
    try {
      localStorage.setItem(key, String(val));
    } catch {}
  },
  getBool(key, fallback = true) {
    const v = GameStorage.get(key);
    return v !== null ? v !== 'false' : fallback;
  },
  getNum(key, fallback = 0) {
    const v = GameStorage.get(key);
    if (v === null) return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }
};

