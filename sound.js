// Âm thanh tổng hợp bằng Web Audio (không cần file ngoài) + hiệu ứng confetti ăn mừng.
let ctx = null;
function safeGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function safeSet(k, v) { try { localStorage.setItem(k, v); } catch { /* Safari private mode */ } }
let muted = safeGet("ai-explorer-muted") === "1";

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null; // trình duyệt không hỗ trợ Web Audio
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freq, dur = 0.08, type = "sine", gain = 0.06, when = 0) {
  if (muted) return;
  const a = ac();
  if (!a) return;
  const t = a.currentTime + when;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export const sfx = {
  click() { tone(420, 0.06, "triangle", 0.04); },
  pop() { tone(660, 0.07, "sine", 0.05); },
  tick() { tone(280, 0.04, "square", 0.02); },
  success() { tone(523, 0.1, "sine", 0.06); tone(784, 0.16, "sine", 0.06, 0.09); },
  wrong() { tone(200, 0.18, "sawtooth", 0.04); },
  complete() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, "sine", 0.06, i * 0.1));
  },
};

export function isMuted() { return muted; }
export function setMuted(v) {
  muted = v;
  safeSet("ai-explorer-muted", v ? "1" : "0");
}

// ---------- Confetti ----------
export function celebrate() {
  if (document.getElementById("confetti")) return;
  const cv = document.createElement("canvas");
  cv.id = "confetti";
  Object.assign(cv.style, {
    position: "fixed", inset: "0", zIndex: "200", pointerEvents: "none",
  });
  cv.width = window.innerWidth;
  cv.height = window.innerHeight;
  document.body.appendChild(cv);
  const c = cv.getContext("2d");

  const colors = ["#6ea8fe", "#b07bff", "#34d399", "#fbbf24", "#f472b6", "#fb7185"];
  const parts = Array.from({ length: 160 }, () => ({
    x: cv.width / 2 + (Math.random() - 0.5) * 120,
    y: cv.height / 3,
    vx: (Math.random() - 0.5) * 14,
    vy: Math.random() * -14 - 4,
    s: Math.random() * 7 + 4,
    col: colors[(Math.random() * colors.length) | 0],
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
  }));

  let frame = 0;
  function run() {
    frame++;
    c.clearRect(0, 0, cv.width, cv.height);
    parts.forEach((p) => {
      p.vy += 0.4;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.rot);
      c.fillStyle = p.col;
      c.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
      c.restore();
    });
    if (frame < 140) requestAnimationFrame(run);
    else cv.remove();
  }
  run();
}
