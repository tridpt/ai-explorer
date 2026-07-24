// Phòng — Tự phân nhóm (Unsupervised / K-means): GAME "Đoán số nhóm". Song ngữ.
// Nhìn đám điểm chưa gán nhãn, đoán có mấy nhóm tự nhiên; AI (k-means) tô màu để lộ đáp án.
import { sfx, celebrate } from "../sound.js";
import { tx } from "../i18n.js";
import { getRoomStat, setRoomStatMax } from "../store.js";

const COLORS = ["#ff5c00", "#00b34a", "#2979ff", "#e91e8c"];
const ROUND_TIME = 12000;

// Sinh k cụm cách nhau đủ xa để "số nhóm" nhìn rõ ràng.
function makeBlobs(k, n = 90) {
  let centers = [];
  for (let tries = 0; tries < 200; tries++) {
    centers = Array.from({ length: k }, () => [0.16 + Math.random() * 0.68, 0.16 + Math.random() * 0.68]);
    let ok = true;
    for (let i = 0; i < k && ok; i++)
      for (let j = i + 1; j < k; j++)
        if (Math.hypot(centers[i][0] - centers[j][0], centers[i][1] - centers[j][1]) < 0.34) { ok = false; break; }
    if (ok) break;
  }
  const pts = [];
  for (let i = 0; i < n; i++) {
    const c = centers[(Math.random() * centers.length) | 0];
    pts.push({
      x: Math.min(0.98, Math.max(0.02, c[0] + (Math.random() - 0.5) * 0.18)),
      y: Math.min(0.98, Math.max(0.02, c[1] + (Math.random() - 0.5) * 0.18)),
      cl: -1,
    });
  }
  return pts;
}

const BOT = {
  intro: { vi: "Chào! Tôi là Bit 🤖. Tôi gom dữ liệu thành nhóm mà <b>không cần ai dán nhãn</b>. Nhìn đám điểm này và đoán: có <b>mấy nhóm</b> tự nhiên? Tôi sẽ tô màu để kiểm chứng!", en: "Hi! I'm Bit 🤖. I group data with <b>no labels at all</b>. Look at these points and guess: how many <b>natural groups</b>? I'll color them to check!" },
  good: { vi: ["🎯 Đúng số nhóm!", "Mắt tinh ghê 😎", "Chuẩn! Bạn thấy cấu trúc rồi 🔥"], en: ["🎯 Right count!", "Sharp eye 😎", "You see the structure 🔥"] },
  bad: { vi: ["Chưa đúng — nhìn màu tôi tô nhé.", "Hụt rồi! Đếm lại các cụm tách biệt."], en: ["Not quite — see my coloring.", "Missed! Recount the separated blobs."] },
  streak: { vi: "🔥 Chuỗi %s! Bạn gom nhóm như k-means 😎", en: "🔥 Streak %s! Clustering like k-means 😎" },
  timeout: { vi: "⏰ Hết giờ! Quyết nhanh hơn nào.", en: "⏰ Time! Decide faster." },
};

const UI = {
  intro: { vi: "AI có thể <strong>tự tìm cấu trúc mà không cần nhãn</strong>: cho một đám dữ liệu lộn xộn, nó gom thành các nhóm giống nhau (k-means). <strong>Thử thách:</strong> nhìn đám điểm và đoán có <strong>mấy nhóm</strong> tự nhiên!", en: "AI can <strong>find structure with no labels</strong>: give it messy data and it groups similar points (k-means). <strong>Challenge:</strong> look at the points and guess how many <strong>natural groups</strong>!" },
  score: { vi: "Điểm", en: "Score" }, streak: { vi: "Chuỗi", en: "Streak" }, best: { vi: "Kỷ lục", en: "Best" },
  start: { vi: "▶ Chơi", en: "▶ Play" }, again: { vi: "↺ Chơi lại", en: "↺ Play again" },
  prompt: { vi: "Có mấy nhóm tự nhiên?", en: "How many natural groups?" },
  groups: { vi: "nhóm", en: "groups" },
  over: { vi: "Hết lượt!", en: "Game over!" },
  overSub: { vi: "Đây là <b>học không giám sát</b>: AI không được cho đáp án, nó tự phát hiện quy luật ẩn. Cùng học có giám sát (dạy bằng ví dụ) và học tăng cường (thưởng–phạt), đây là ba cách học chính của AI.", en: "This is <b>unsupervised learning</b>: no answers given, the AI discovers hidden patterns itself. With supervised (learn by example) and reinforcement (reward/penalty), these are AI's three main ways of learning." },
  newRecord: { vi: "🏆 Kỷ lục mới!", en: "🏆 New record!" }, finalScore: { vi: "Điểm của bạn", en: "Your score" },
};

export function roomClustering(root) {
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  let score = 0, streak = 0, lives = 3, playing = false, locked = false;
  let pts = [], trueK = 3, centroids = [], raf = null, roundStart = 0, revealTimer = null;

  root.innerHTML = `
    <p class="room-intro">${tx(UI.intro)}</p>
    <div class="g-mascot"><div class="g-bot" id="clBot">🤖</div><div class="g-bubble" id="clBubble">${tx(BOT.intro)}</div></div>

    <div class="panel">
      <div class="g-hud">
        <div class="g-stat"><span>${tx(UI.score)}</span><b id="clScore">0</b></div>
        <div class="g-stat"><span>${tx(UI.streak)}</span><b id="clStreak">0</b></div>
        <div class="g-stat"><span>${tx(UI.best)}</span><b id="clBest">0</b></div>
        <div class="g-hearts" id="clHearts"></div>
      </div>

      <div id="clSetup" style="text-align:center; padding:10px 0;">
        <button class="btn g-play" id="clPlay">${tx(UI.start)}</button>
      </div>

      <div id="clGame" hidden>
        <div class="g-timer"><div class="g-timer-fill" id="clTimer"></div></div>
        <div class="center"><canvas id="clCanvas" width="440" height="360" role="img" aria-label="${tx("Các điểm dữ liệu 2D được k-means gom thành nhóm màu", "2D data points grouped into colored clusters by k-means")}" style="border:3px solid var(--ink); background:#14140f;"></canvas></div>
        <p class="muted mt" style="font-weight:700">${tx(UI.prompt)}</p>
        <div class="nt-chips" id="clChips"></div>
        <div id="clFb" class="mt"></div>
      </div>

      <div id="clOver" hidden class="g-over"></div>
    </div>

    <div class="takeaway">${tx(
      "💡 <strong>Điều cốt lõi:</strong> Học không giám sát — AI tự phát hiện nhóm ẩn trong dữ liệu mà không cần nhãn. Đây là cách Spotify gom gu nhạc, cửa hàng gom nhóm khách hàng.",
      "💡 <strong>Key idea:</strong> Unsupervised learning — the AI finds hidden groups with no labels. It's how Spotify groups tastes, or shops segment customers."
    )}</div>
  `;

  const $ = (s) => root.querySelector(s);
  const botEl = $("#clBot"), bubbleEl = $("#clBubble");
  const scoreEl = $("#clScore"), streakEl = $("#clStreak"), bestEl = $("#clBest"), heartsEl = $("#clHearts");
  const setupEl = $("#clSetup"), gameEl = $("#clGame"), overEl = $("#clOver");
  const timerEl = $("#clTimer"), chipsEl = $("#clChips"), fbEl = $("#clFb");
  const canvas = $("#clCanvas"), ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;

  bestEl.textContent = getRoomStat("clustering", "bestScore", 0);
  const pickArr = (a) => a[(Math.random() * a.length) | 0];
  const langKey = () => (document.documentElement.lang === "en" ? "en" : "vi");

  function say(msg, mood = "") {
    bubbleEl.innerHTML = msg;
    if (reduce) return;
    botEl.classList.remove("bot-happy", "bot-sad", "bot-bounce");
    void botEl.offsetWidth;
    botEl.classList.add(mood === "happy" ? "bot-happy" : mood === "sad" ? "bot-sad" : "bot-bounce");
  }
  function renderHearts() {
    heartsEl.innerHTML = "";
    for (let i = 0; i < 3; i++) { const h = document.createElement("span"); h.className = "g-heart" + (i >= lives ? " lost" : ""); h.textContent = i < lives ? "❤️" : "🤍"; heartsEl.appendChild(h); }
  }
  function updateHUD() { scoreEl.textContent = score; streakEl.textContent = streak; renderHearts(); }

  function draw(showColor) {
    ctx.clearRect(0, 0, W, H);
    for (const p of pts) {
      ctx.beginPath();
      ctx.arc(p.x * W, p.y * H, 5, 0, Math.PI * 2);
      ctx.fillStyle = showColor && p.cl >= 0 ? COLORS[p.cl] : "#999";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 1; ctx.stroke();
    }
    if (showColor) centroids.forEach((c, i) => {
      ctx.save(); ctx.translate(c[0] * W, c[1] * H); ctx.rotate(Math.PI / 4);
      ctx.fillStyle = COLORS[i]; ctx.fillRect(-9, -9, 18, 18);
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 3; ctx.strokeRect(-9, -9, 18, 18); ctx.restore();
    });
  }

  // Chạy k-means với k nhóm tới khi ổn định (để tô màu lộ đáp án).
  function kmeans(k) {
    centroids = Array.from({ length: k }, () => [0.1 + Math.random() * 0.8, 0.1 + Math.random() * 0.8]);
    for (let iter = 0; iter < 25; iter++) {
      for (const p of pts) {
        let best = 0, bd = Infinity;
        centroids.forEach((c, i) => { const d = (p.x - c[0]) ** 2 + (p.y - c[1]) ** 2; if (d < bd) { bd = d; best = i; } });
        p.cl = best;
      }
      centroids.forEach((c, i) => {
        const g = pts.filter((p) => p.cl === i);
        if (g.length) { c[0] = g.reduce((s, p) => s + p.x, 0) / g.length; c[1] = g.reduce((s, p) => s + p.y, 0) / g.length; }
      });
    }
  }

  function startTimer() {
    roundStart = performance.now();
    const step = (t) => {
      const remain = Math.max(0, ROUND_TIME - (t - roundStart));
      timerEl.style.width = (remain / ROUND_TIME * 100) + "%";
      timerEl.classList.toggle("low", remain < ROUND_TIME * 0.3);
      if (remain <= 0) { onTimeout(); return; }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }
  function stopTimer() { if (raf) cancelAnimationFrame(raf); raf = null; }

  function newRound() {
    locked = false;
    trueK = 2 + ((Math.random() * 3) | 0); // 2..4
    pts = makeBlobs(trueK);
    centroids = [];
    draw(false);
    fbEl.innerHTML = "";
    chipsEl.innerHTML = "";
    [2, 3, 4].forEach((k) => {
      const c = document.createElement("button");
      c.className = "nt-chip";
      c.textContent = k + " " + tx(UI.groups);
      c.onclick = () => onPick(k, c);
      chipsEl.appendChild(c);
    });
    startTimer();
  }

  function revealColored() {
    kmeans(trueK);
    draw(true);
  }

  function onPick(k, chipEl) {
    if (locked || !playing) return;
    locked = true;
    stopTimer();
    const correct = k === trueK;
    chipsEl.querySelectorAll(".nt-chip").forEach((el) => {
      el.disabled = true;
      if (parseInt(el.textContent) === trueK) el.classList.add("correct");
    });
    revealColored();
    if (correct) {
      const gained = 100 + streak * 20;
      score += gained; streak++;
      chipEl.classList.add("pop"); sfx.success();
      if (streak % 3 === 0) { if (!reduce) celebrate(); say(tx(BOT.streak).replace("%s", streak), "happy"); }
      else say(pickArr(BOT.good[langKey()]) + ` <b>+${gained}</b>`, "happy");
    } else {
      chipEl.classList.add("wrong"); streak = 0; lives--; sfx.wrong();
      if (!reduce) { gameEl.classList.remove("shake"); void gameEl.offsetWidth; gameEl.classList.add("shake"); }
      say(pickArr(BOT.bad[langKey()]), "sad");
      fbEl.innerHTML = `<div class="takeaway" style="margin:0">${tx("Đáp án:", "Answer:")} <b>${trueK} ${tx(UI.groups)}</b></div>`;
    }
    updateHUD();
    revealTimer = setTimeout(() => { if (lives <= 0) endGame(); else newRound(); }, correct ? 1500 : 2100);
  }

  function onTimeout() {
    if (locked) return;
    locked = true; stopTimer();
    chipsEl.querySelectorAll(".nt-chip").forEach((el) => { el.disabled = true; if (parseInt(el.textContent) === trueK) el.classList.add("correct"); });
    streak = 0; lives--; sfx.wrong();
    revealColored();
    say(tx(BOT.timeout), "sad");
    updateHUD();
    revealTimer = setTimeout(() => { if (lives <= 0) endGame(); else newRound(); }, 1800);
  }

  function startGame() {
    score = 0; streak = 0; lives = 3; playing = true;
    updateHUD();
    setupEl.hidden = true; overEl.hidden = true; gameEl.hidden = false;
    newRound();
  }

  function endGame() {
    playing = false; stopTimer(); gameEl.hidden = true;
    const record = setRoomStatMax("clustering", "bestScore", score);
    bestEl.textContent = getRoomStat("clustering", "bestScore", 0);
    if (record && !reduce) celebrate();
    say(tx({ vi: `Hết lượt! Điểm: <b>${score}</b>. Chơi lại nhé? 🤖`, en: `Game over! Score: <b>${score}</b>. Play again? 🤖` }), record ? "happy" : "sad");
    overEl.hidden = false;
    overEl.innerHTML = `
      <div class="g-over-card">
        <div class="g-over-title">${record ? tx(UI.newRecord) : tx(UI.over)}</div>
        <div class="g-over-score">${tx(UI.finalScore)}: <b>${score}</b></div>
        <p class="muted">${tx(UI.overSub)}</p>
        <button class="btn g-play" id="clAgain">${tx(UI.again)}</button>
      </div>`;
    overEl.querySelector("#clAgain").onclick = startGame;
  }

  $("#clPlay").onclick = startGame;
  updateHUD();

  window.addEventListener("roomleave", () => { stopTimer(); if (revealTimer) clearTimeout(revealTimer); }, { once: true });
}
