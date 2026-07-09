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
      roomStats: s.roomStats || {},       // { roomId: { key: number } } — kỷ lục mini-game từng phòng
    };
  } catch {
    return { visited: [], bestScore: -1, quizAnswered: {}, track: null, roomStats: {} };
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

// Tập chỉ số các câu nhỏ đã trả lời đúng ở một phòng (dùng để đánh dấu đúng câu).
export function getMicroSolved(roomId) {
  return new Set(load().quizAnswered[roomId] || []);
}

// Tổng số câu nhỏ đã trả lời đúng trên toàn hành trình.
export function getMicroTotal() {
  const q = load().quizAnswered;
  return Object.values(q).reduce((sum, arr) => sum + arr.length, 0);
}

// ---------- Kỷ lục mini-game theo phòng ----------
// Đọc một chỉ số (vd điểm cao / streak dài nhất) của một phòng.
export function getRoomStat(roomId, key, def = 0) {
  const stats = load().roomStats[roomId] || {};
  return stats[key] ?? def;
}

// Ghi chỉ số nếu là kỷ lục mới (lớn hơn). Trả về true nếu phá kỷ lục.
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

// ---------- Lộ trình học ----------
export function getTrack() {
  return load().track;
}

export function setTrack(track) {
  const s = load();
  s.track = track;
  save(s);
}
