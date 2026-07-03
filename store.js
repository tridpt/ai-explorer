// Lưu tiến trình người dùng vào localStorage: phòng đã ghé, điểm quiz cao nhất,
// câu hỏi nhỏ đã trả lời đúng ở mỗi phòng, và lộ trình đang chọn.
const KEY = "ai-explorer-progress";

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY)) || {};
    return {
      visited: s.visited || [],
      bestScore: s.bestScore ?? -1,
      quizAnswered: s.quizAnswered || {}, // { roomId: [chỉ số câu đã đúng] }
      track: s.track || null,             // "beginner" | "full" | "dev"
    };
  } catch {
    return { visited: [], bestScore: -1, quizAnswered: {}, track: null };
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
  save({ visited: [], bestScore: -1, quizAnswered: {}, track: null });
}

// ---------- Quiz nhỏ rải rác ở mỗi phòng ----------
// Ghi nhận một câu hỏi nhỏ đã trả lời ĐÚNG (lưu theo chỉ số câu trong phòng).
export function markMicroQuiz(roomId, qIndex) {
  const s = load();
  const arr = s.quizAnswered[roomId] || [];
  if (!arr.includes(qIndex)) {
    arr.push(qIndex);
    s.quizAnswered[roomId] = arr;
    save(s);
  }
}

// Số câu nhỏ đã trả lời đúng ở một phòng.
export function getMicroCorrect(roomId) {
  return (load().quizAnswered[roomId] || []).length;
}

// Tổng số câu nhỏ đã trả lời đúng trên toàn hành trình.
export function getMicroTotal() {
  const q = load().quizAnswered;
  return Object.values(q).reduce((sum, arr) => sum + arr.length, 0);
}

// ---------- Lộ trình học ----------
export function getTrack() {
  return load().track;
}

export function setTrack(track) {
  const s = load();
  s.track = track;
  save(s);
}
