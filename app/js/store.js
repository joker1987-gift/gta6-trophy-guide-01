// store.js — progress state for the Leonida Platinum tracker.
// Everything lives in one localStorage record: earned trophy ids, per-trophy
// counters for the trophies PSN tracks to a target, the spoiler setting, and
// which trophy is open in the guide pane. First run seeds a small, plausible
// early-game demo state so the guide opens populated; Reset restores it.

export const STORAGE_KEY = 'leonida-platinum-v1';
export const EXPORT_KIND = 'leonida-platinum-progress';

const DEMO_EARNED = [2, 3, 4, 8, 16, 21, 36, 44];
const DEMO_COUNTERS = { 15: 86, 28: 6, 31: 37, 35: 64, 48: 212, 52: 90000, 53: 42000 };

export function demoState() {
  return {
    earned: [...DEMO_EARNED],
    counters: { ...DEMO_COUNTERS },
    spoilers: true,
    selectedId: 28,
    seeded: true,
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = demoState();
      saveState(seed);
      return seed;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.earned) || typeof parsed.counters !== 'object') return demoState();
    return {
      earned: parsed.earned.filter((n) => Number.isInteger(n)),
      counters: parsed.counters || {},
      spoilers: parsed.spoilers !== false,
      selectedId: Number.isInteger(parsed.selectedId) ? parsed.selectedId : 1,
      seeded: !!parsed.seeded,
    };
  } catch {
    return demoState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked: the tracker keeps working for this session */
  }
}

export function isEarned(state, id) {
  return state.earned.includes(id);
}

export function toggleEarned(state, id) {
  state.earned = isEarned(state, id)
    ? state.earned.filter((n) => n !== id)
    : [...state.earned, id].sort((a, b) => a - b);
  saveState(state);
  return isEarned(state, id);
}

export function counterOf(state, trophy) {
  const raw = state.counters[trophy.id];
  return Number.isFinite(raw) ? Math.max(0, Math.min(raw, trophy.target || raw)) : 0;
}

export function setCounter(state, trophy, value) {
  const clamped = Math.max(0, Math.min(Math.floor(value) || 0, trophy.target));
  state.counters[trophy.id] = clamped;
  // Reaching the target earns the trophy. Lowering the count afterwards is
  // bookkeeping, not un-earning: the tick stays until the user clears it.
  if (clamped >= trophy.target && !isEarned(state, trophy.id)) {
    state.earned = [...state.earned, trophy.id].sort((a, b) => a - b);
  }
  saveState(state);
  return clamped;
}

export function exportProgress(state) {
  return JSON.stringify(
    {
      kind: EXPORT_KIND,
      version: 1,
      exportedAt: new Date().toISOString(),
      earned: [...state.earned].sort((a, b) => a - b),
      counters: state.counters,
      spoilers: state.spoilers,
    },
    null,
    2,
  );
}

export function importProgress(text, validIds) {
  const parsed = JSON.parse(text);
  if (!parsed || !Array.isArray(parsed.earned)) throw new Error('That file does not look like exported progress.');
  const earned = parsed.earned.filter((n) => Number.isInteger(n) && validIds.has(n));
  const counters = {};
  if (parsed.counters && typeof parsed.counters === 'object') {
    for (const [key, value] of Object.entries(parsed.counters)) {
      const id = Number(key);
      if (validIds.has(id) && Number.isFinite(value)) counters[id] = Math.max(0, Math.floor(value));
    }
  }
  return { earned, counters, spoilers: parsed.spoilers !== false };
}

// PSN's own weighting: bronze 15, silver 30, gold 90, platinum 180 points.
export const GRADE_POINTS = { bronze: 15, silver: 30, gold: 90, platinum: 180 };

export function progressSummary(state, trophies) {
  const total = trophies.length;
  const earnedList = trophies.filter((t) => isEarned(state, t.id));
  const points = earnedList.reduce((sum, t) => sum + GRADE_POINTS[t.grade], 0);
  const pointsTotal = trophies.reduce((sum, t) => sum + GRADE_POINTS[t.grade], 0);
  const byGrade = {};
  for (const grade of ['platinum', 'gold', 'silver', 'bronze']) {
    byGrade[grade] = {
      earned: earnedList.filter((t) => t.grade === grade).length,
      total: trophies.filter((t) => t.grade === grade).length,
    };
  }
  return {
    earned: earnedList.length,
    total,
    percent: total ? Math.round((earnedList.length / total) * 1000) / 10 : 0,
    points,
    pointsTotal,
    pointsPercent: pointsTotal ? Math.round((points / pointsTotal) * 1000) / 10 : 0,
    byGrade,
    hiddenTotal: trophies.filter((t) => t.hidden).length,
    missableTotal: trophies.filter((t) => t.missable).length,
  };
}
