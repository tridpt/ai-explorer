// Phòng — Bản đồ ý nghĩa: GAME "Đố phép loại suy". Nhìn a − b + c, đoán từ thứ tư. Song ngữ.
// Giữ bản đồ embedding đẹp làm phần "reveal" sau mỗi câu. Có điểm/streak/mạng + mascot.
import { WORD_VECTORS, ANALOGY_PRESETS } from "../data/embeddings.js";
import { sfx, celebrate } from "../sound.js";
import { tx } from "../i18n.js";
import { getRoomStat, setRoomStatMax } from "../store.js";

const WORDS = Object.keys(WORD_VECTORS);
const CLUSTERS = [
  { color: "110,168,254", label: { vi: "Con người", en: "People" }, words: ["đàn ông", "đàn bà", "vua", "nữ hoàng", "hoàng tử", "công chúa", "cha", "mẹ", "con trai", "con gái", "anh", "chị", "ông", "bà"] },
  { color: "251,146,60", label: { vi: "Động vật", en: "Animals" }, words: ["chó", "mèo", "hổ", "sư tử", "chim"] },
  { color: "52,211,153", label: { vi: "Món ăn", en: "Foods" }, words: ["cơm", "phở", "bánh mì", "bún"] },
];
const EN = { "đàn ông": "man", "đàn bà": "woman", "vua": "king", "nữ hoàng": "queen", "hoàng tử": "prince", "công chúa": "princess", "cha": "father", "mẹ": "mother", "con trai": "son", "con gái": "daughter", "anh": "brother", "chị": "sister", "ông": "grandpa", "bà": "grandma", "chó": "dog", "mèo": "cat", "hổ": "tiger", "sư tử": "lion", "chim": "bird", "cơm": "rice", "phở": "pho", "bánh mì": "bread", "bún": "noodles" };
const label = (w) => tx(w, EN[w] || w);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function nearest(vec, exclude = []) {
  let best = null, bestD = Infinity;
  for (const w of WORDS) { if (exclude.includes(w)) continue; const d = dist(WORD_VECTORS[w], vec); if (d < bestD) { bestD = d; best = w; } }
  return best;
}
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }

const BOT = {
  intro: { vi: "Chào! Tôi là Bit 🤖. Tôi biến mỗi từ thành một điểm trên bản đồ, nên có thể <b>làm toán với nghĩa</b>: vua − đàn ông + đàn bà = ? Đoán từ thứ tư nhé!", en: "Hi! I'm Bit 🤖. I turn each word into a point on a map, so I can <b>do math with meaning</b>: king − man + woman = ? Guess the fourth word!" },
  good: { vi: ["🎯 Đúng nghĩa luôn!", "Chuẩn không cần chỉnh 😎", "Toán với nghĩa, dễ mà 🔥"], en: ["🎯 Right meaning!", "Flawless 😎", "Meaning-math, easy 🔥"] },
  bad: { vi: ["Chưa đúng — nhìn bản đồ xem đáp án nằm đâu nhé.", "Hụt rồi! Khoảng cách giữa các từ mới là chìa khoá."], en: ["Not quite — see the map for where it lands.", "Missed! The distance between words is the key."] },
  streak: { vi: "🔥 Chuỗi %s! Bạn nghĩ bằng vector rồi 😎", en: "🔥 Streak %s! You're thinking in vectors 😎" },
};

const UI = {
  intro: { vi: "AI biến mỗi từ thành một <strong>điểm toạ độ</strong>; những từ gần nghĩa nằm gần nhau, và <em>khoảng cách cũng mang ý nghĩa</em>. <strong>Thử thách:</strong> nhìn phép toán <b>a − b + c</b> và đoán từ thứ tư AI sẽ tính ra!", en: "AI turns each word into a <strong>coordinate point</strong>; similar words sit close, and <em>distance carries meaning</em>. <strong>Challenge:</strong> read the sum <b>a − b + c</b> and guess the fourth word the AI computes!" },
  score: { vi: "Điểm", en: "Score" }, streak: { vi: "Chuỗi", en: "Streak" }, best: { vi: "Kỷ lục", en: "Best" },
  start: { vi: "▶ Chơi", en: "▶ Play" }, again: { vi: "↺ Chơi lại", en: "↺ Play again" },
  prompt: { vi: "AI tính ra từ nào?", en: "Which word does the AI compute?" },
  over: { vi: "Hết lượt!", en: "Game over!" },
  overSub: { vi: "AI \"hiểu\" nghĩa bằng cách đặt mọi từ lên bản đồ toạ độ. Vì <em>vua</em> hơn <em>đàn ông</em> đúng bằng lượng <em>nữ hoàng</em> hơn <em>đàn bà</em>, nó tính được loại suy mà không cần từ điển.", en: "AI \"understands\" meaning by placing words on a coordinate map. Because <em>king</em> differs from <em>man</em> as <em>queen</em> differs from <em>woman</em>, it computes analogies with no dictionary." },
  newRecord: { vi: "🏆 Kỷ lục mới!", en: "🏆 New record!" }, finalScore: { vi: "Điểm của bạn", en: "Your score" },
};

// Sinh bộ câu hỏi loại suy "sạch" (đáp án gần khít, không trùng đầu vào).
function buildQuestions() {
  const qs = [];
  const seen = new Set();
  const add = (a, b, c) => {
    if (!WORD_VECTORS[a] || !WORD_VECTORS[b] || !WORD_VECTORS[c]) return;
    const target = [WORD_VECTORS[a][0] - WORD_VECTORS[b][0] + WORD_VECTORS[c][0], WORD_VECTORS[a][1] - WORD_VECTORS[b][1] + WORD_VECTORS[c][1]];
    const ans = nearest(target, [a, b, c]);
    if (!ans) return;
    if (dist(target, WORD_VECTORS[ans]) > 0.6) return; // chỉ giữ loại suy rõ ràng
    const key = [a, b, c].join("|");
    if (seen.has(key)) return;
    seen.add(key);
    qs.push({ a, b, c, ans, target });
  };
  (ANALOGY_PRESETS || []).forEach((p) => add(p.a, p.b, p.c));
  // Sinh thêm từ các cặp trong cùng cụm để tăng độ đa dạng.
  for (let t = 0; t < 200 && qs.length < 14; t++) {
    const a = WORDS[(Math.random() * WORDS.length) | 0];
    const b = WORDS[(Math.random() * WORDS.length) | 0];
    const c = WORDS[(Math.random() * WORDS.length) | 0];
    if (a === b || a === c || b === c) continue;
    add(a, b, c);
  }
  return qs;
}

export function roomEmbeddings(root) {
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  let score = 0, streak = 0, lives = 3, playing = false, locked = false;
  let queue = [], current = null, highlight = null;
  const ALL = buildQuestions();

  root.innerHTML = `
    <p class="room-intro">${tx(UI.intro)}</p>
    <div class="g-mascot"><div class="g-bot" id="emBot">🤖</div><div class="g-bubble" id="emBubble">${tx(BOT.intro)}</div></div>

    <div class="panel">
      <div class="g-hud">
        <div class="g-stat"><span>${tx(UI.score)}</span><b id="emScore">0</b></div>
        <div class="g-stat"><span>${tx(UI.streak)}</span><b id="emStreak">0</b></div>
        <div class="g-stat"><span>${tx(UI.best)}</span><b id="emBest">0</b></div>
        <div class="g-hearts" id="emHearts"></div>
      </div>

      <canvas id="embCanvas" width="720" height="440" style="width:100%; border:3px solid var(--ink);"></canvas>

      <div id="emSetup" style="text-align:center; padding:12px 0;">
        <button class="btn g-play" id="emPlay">${tx(UI.start)}</button>
      </div>

      <div id="emGame" hidden>
        <div class="em-question" id="emQ"></div>
        <p class="muted" style="font-weight:700">${tx(UI.prompt)}</p>
        <div class="nt-chips" id="emChips"></div>
        <div id="emFb" class="mt"></div>
      </div>

      <div id="emOver" hidden class="g-over"></div>
    </div>

    <div class="takeaway">${tx(
      "💡 <strong>Điều cốt lõi:</strong> AI đặt mọi từ lên bản đồ toạ độ; khoảng cách và hướng giữa các từ mang ý nghĩa, nên nó làm được <em>vua − đàn ông + đàn bà = nữ hoàng</em> mà không tra từ điển.",
      "💡 <strong>Key idea:</strong> AI places every word on a coordinate map; distance and direction carry meaning, so it computes <em>king − man + woman = queen</em> with no dictionary."
    )}</div>
  `;

  const $ = (s) => root.querySelector(s);
  const botEl = $("#emBot"), bubbleEl = $("#emBubble");
  const scoreEl = $("#emScore"), streakEl = $("#emStreak"), bestEl = $("#emBest"), heartsEl = $("#emHearts");
  const setupEl = $("#emSetup"), gameEl = $("#emGame"), overEl = $("#emOver");
  const qEl = $("#emQ"), chipsEl = $("#emChips"), fbEl = $("#emFb");
  const canvas = $("#embCanvas"), ctx = canvas.getContext("2d");

  bestEl.textContent = getRoomStat("embeddings", "bestScore", 0);
  const pickArr = (a) => a[(Math.random() * a.length) | 0];
  const langKey = () => (document.documentElement.lang === "en" ? "en" : "vi");

  const xs = WORDS.map((w) => WORD_VECTORS[w][0]), ys = WORDS.map((w) => WORD_VECTORS[w][1]);
  const pad = 2;
  const minX = Math.min(...xs) - pad, maxX = Math.max(...xs) + pad, minY = Math.min(...ys) - pad, maxY = Math.max(...ys) + pad;
  const toPx = (v) => [((v[0] - minX) / (maxX - minX)) * canvas.width, canvas.height - ((v[1] - minY) / (maxY - minY)) * canvas.height];

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

  function arrow(p1, p2, color) {
    ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();
    const ang = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]), h = 9;
    ctx.beginPath(); ctx.moveTo(p2[0], p2[1]);
    ctx.lineTo(p2[0] - h * Math.cos(ang - 0.4), p2[1] - h * Math.sin(ang - 0.4));
    ctx.lineTo(p2[0] - h * Math.cos(ang + 0.4), p2[1] - h * Math.sin(ang + 0.4));
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function drawBlob(cl) {
    const pts = cl.words.filter((w) => WORD_VECTORS[w]).map((w) => toPx(WORD_VECTORS[w]));
    if (!pts.length) return;
    let cx = 0, cy = 0; pts.forEach(([x, y]) => { cx += x; cy += y; }); cx /= pts.length; cy /= pts.length;
    let rad = 0; pts.forEach(([x, y]) => { rad = Math.max(rad, Math.hypot(x - cx, y - cy)); }); rad += 42;
    const g = ctx.createRadialGradient(cx, cy, rad * 0.2, cx, cy, rad);
    g.addColorStop(0, `rgba(${cl.color},0.20)`); g.addColorStop(1, `rgba(${cl.color},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.fill();
    ctx.font = "700 12px Inter, sans-serif"; ctx.fillStyle = `rgba(${cl.color},0.85)`;
    const t = tx(cl.label); ctx.fillText(t, cx - ctx.measureText(t).width / 2, cy - rad + 16);
  }

  function draw() {
    const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bg.addColorStop(0, "#181828"); bg.addColorStop(1, "#0f1420");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(255,255,255,0.035)"; ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * canvas.width, y = (i / 10) * canvas.height;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
    ctx.textAlign = "left";
    CLUSTERS.forEach(drawBlob);
    const involved = highlight ? new Set([highlight.a, highlight.b, highlight.c, highlight.ans]) : new Set();
    // Trong lúc chơi (chưa lộ đáp án), KHÔNG hiện nhãn để không lộ; chỉ hiện chấm.
    const showLabels = !!highlight || !playing;
    for (const w of WORDS) {
      const [px, py] = toPx(WORD_VECTORS[w]);
      const hot = involved.has(w);
      const glow = ctx.createRadialGradient(px, py, 0, px, py, hot ? 16 : 10);
      glow.addColorStop(0, hot ? "rgba(176,123,255,0.55)" : "rgba(110,168,254,0.32)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(px, py, hot ? 16 : 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = hot ? "#c79bff" : "#6ea8fe";
      ctx.beginPath(); ctx.arc(px, py, hot ? 5.5 : 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = hot ? 1.5 : 0.75; ctx.stroke();
      if (showLabels || hot) {
        ctx.font = hot ? "bold 13px Inter, sans-serif" : "12px Inter, sans-serif";
        const text = label(w), tw = ctx.measureText(text).width, lx = px + 8, ly = py + 4;
        ctx.fillStyle = hot ? "rgba(176,123,255,0.9)" : "rgba(20,20,32,0.6)";
        ctx.fillRect(lx - 3, ly - 11, tw + 6, 15);
        ctx.fillStyle = hot ? "#fff" : "rgba(232,236,246,0.9)";
        ctx.fillText(text, lx, ly);
      }
    }
    if (highlight) {
      const pB = toPx(WORD_VECTORS[highlight.b]), pA = toPx(WORD_VECTORS[highlight.a]);
      const pC = toPx(WORD_VECTORS[highlight.c]), pT = toPx(highlight.target), pAns = toPx(WORD_VECTORS[highlight.ans]);
      arrow(pB, pA, "#22d3ee"); arrow(pC, pT, "#b07bff");
      ctx.fillStyle = "rgba(176,123,255,0.35)"; ctx.beginPath(); ctx.arc(pT[0], pT[1], 9, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#b07bff"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(pAns[0], pAns[1], 10, 0, Math.PI * 2); ctx.stroke();
    }
  }

  function nextQueue() {
    if (!queue.length) queue = shuffle([...ALL]);
    return queue.pop();
  }

  function newRound() {
    locked = false;
    highlight = null;
    current = nextQueue();
    draw();
    qEl.innerHTML = `<b>${label(current.a)}</b> − <b>${label(current.b)}</b> + <b>${label(current.c)}</b> = <b style="color:var(--accent-ink)">?</b>`;
    fbEl.innerHTML = "";
    // 4 lựa chọn: đáp án + 3 nhiễu (không trùng đầu vào/đáp án).
    const distract = shuffle(WORDS.filter((w) => ![current.a, current.b, current.c, current.ans].includes(w))).slice(0, 3);
    const opts = shuffle([current.ans, ...distract]);
    chipsEl.innerHTML = "";
    opts.forEach((w) => {
      const c = document.createElement("button");
      c.className = "nt-chip";
      c.textContent = label(w);
      c.onclick = () => onPick(w, c);
      chipsEl.appendChild(c);
    });
  }

  function onPick(word, chipEl) {
    if (locked || !playing) return;
    locked = true;
    const correct = word === current.ans;
    highlight = current;
    draw();
    chipsEl.querySelectorAll(".nt-chip").forEach((el) => {
      el.disabled = true;
      if (el.textContent === label(current.ans)) el.classList.add("correct");
    });
    if (correct) {
      const gained = 100 + streak * 20;
      score += gained; streak++;
      chipEl.classList.add("pop"); sfx.success();
      if (streak % 3 === 0) { if (!reduce) celebrate(); say(tx(BOT.streak).replace("%s", streak), "happy"); }
      else say(pickArr(BOT.good[langKey()]) + ` <b>+${gained}</b>`, "happy");
    } else {
      chipEl.classList.add("wrong"); streak = 0; lives--; sfx.wrong();
      say(pickArr(BOT.bad[langKey()]), "sad");
      fbEl.innerHTML = `<div class="takeaway" style="margin:0">${tx("Đáp án đúng:", "Correct answer:")} <b>${label(current.ans)}</b> — ${tx(`${label(current.a)} − ${label(current.b)} + ${label(current.c)}`, `${label(current.a)} − ${label(current.b)} + ${label(current.c)}`)}</div>`;
    }
    updateHUD();
    setTimeout(() => { if (lives <= 0) endGame(); else newRound(); }, correct ? 1400 : 2100);
  }

  function startGame() {
    score = 0; streak = 0; lives = 3; playing = true; queue = [];
    updateHUD();
    setupEl.hidden = true; overEl.hidden = true; gameEl.hidden = false;
    newRound();
  }

  function endGame() {
    playing = false; gameEl.hidden = true; highlight = null; draw();
    const record = setRoomStatMax("embeddings", "bestScore", score);
    bestEl.textContent = getRoomStat("embeddings", "bestScore", 0);
    if (record && !reduce) celebrate();
    say(tx({ vi: `Hết lượt! Điểm: <b>${score}</b>. Chơi lại nhé? 🤖`, en: `Game over! Score: <b>${score}</b>. Play again? 🤖` }), record ? "happy" : "sad");
    overEl.hidden = false;
    overEl.innerHTML = `
      <div class="g-over-card">
        <div class="g-over-title">${record ? tx(UI.newRecord) : tx(UI.over)}</div>
        <div class="g-over-score">${tx(UI.finalScore)}: <b>${score}</b></div>
        <p class="muted">${tx(UI.overSub)}</p>
        <button class="btn g-play" id="emAgain">${tx(UI.again)}</button>
      </div>`;
    overEl.querySelector("#emAgain").onclick = startGame;
  }

  $("#emPlay").onclick = startGame;
  updateHUD();
  draw();
}
