// Lưu tiến trình người dùng vào localStorage: phòng đã ghé & điểm quiz cao nhất.
const KEY = "ai-explorer-progress";

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || { visited: [], bestScore: -1 };
  } catch {
    return { visited: [], bestScore: -1 };
  }
}

function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
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
    return true; // kỷ lục mới
  }
  return false;
}

export function resetProgress() {
  save({ visited: [], bestScore: -1 });
}
