// Lưu tiến trình người dùng vào localStorage với schema có phiên bản để nâng cấp an toàn.
const KEY = "ai-explorer-progress";
const CURRENT_VERSION = 1;

function initialState() {
  return {
    version: CURRENT_VERSION,
    visited: [],
    bestScore: -1,
    quizAnswered: {},
    track: null,
    roomStats: {},
  };
}

function normalizeState(raw = {}) {
  const validTrack = ["beginner", "full", "dev"].includes(raw.track) ? raw.track : null;
  return {
    version: CURRENT_VERSION,
    visited: Array.isArray(raw.visited) ? raw.visited.filter((id) => typeof id === "string") : [],
    bestScore: Number.isFinite(raw.bestScore) ? raw.bestScore : -1,
    quizAnswered: raw.quizAnswered && typeof raw.quizAnswered === "object" ? raw.quizAnswered : {},
    track: validTrack,
    roomStats: raw.roomStats && typeof raw.roomStats === "object" ? raw.roomStats : {},
  };
}

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    // Dữ liệu cũ chưa có version được chuẩn hóa sang schema hiện tại mà không mất tiến trình.
    return normalizeState(raw || initialState());
  } catch {
    return initialState();
  }
}

function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(normalizeState(state))); } catch {}
}

export function markVisited(id) {
  const s = load();
  if (!s.visited.includes(id)) {
    s.visited.push(id);
    save(s);
  }
}

export function getVisited() {
  return new Set(load().visited);
}

export function getBestScore() {
  return load().bestScore;
}

export function setBestScore(score) {
  const s = load();
  if (score > s.bestScore) {
    s.bestScore = score;
    save(s);
    return true;
  }
  return false;
}

export function resetProgress() {
  save(initialState());
}

export function markMicroQuiz(roomId, qIndex) {
  const s = load();
  const arr = s.quizAnswered[roomId] || [];
  if (!arr.includes(qIndex)) {
    arr.push(qIndex);
    s.quizAnswered[roomId] = arr;
    save(s);
  }
}

export function getMicroSolved(roomId) {
  return new Set(load().quizAnswered[roomId] || []);
}

export function getMicroTotal() {
  const q = load().quizAnswered;
  return Object.values(q).reduce((sum, arr) => sum + arr.length, 0);
}

export function getRoomStat(roomId, key, def = 0) {
  const stats = load().roomStats[roomId] || {};
  return stats[key] ?? def;
}

export function setRoomStatMax(roomId, key, value) {
  const s = load();
  const stats = s.roomStats[roomId] || {};
  if (value > (stats[key] ?? -Infinity)) {
    stats[key] = value;
    s.roomStats[roomId] = stats;
    save(s);
    return true;
  }
  return false;
}

export function getTrack() {
  return load().track;
}

export function setTrack(track) {
  const s = load();
  s.track = track;
  save(s);
}
