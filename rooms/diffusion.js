// Phòng — AI tạo ảnh: GAME "Đoán prompt". Ảnh khử nhiễu dần từ nhiễu; đoán prompt càng sớm càng nhiều điểm. Song ngữ.
import { sfx, celebrate } from "../sound.js";
import { tx } from "../i18n.js";
import { getRoomStat, setRoomStatMax } from "../store.js";

const SIZE = 220;
const STEPS = 22;
const STEP_MS = 260;
const PROMPTS = [
  { label: { vi: "con mèo", en: "a cat" }, emoji: "🐱" },
  { label: { vi: "bông hoa", en: "a flower" }, emoji: "🌸" },
  { label: { vi: "tên lửa", en: "a rocket" }, emoji: "🚀" },
  { label: { vi: "pizza", en: "pizza" }, emoji: "🍕" },
  { label: { vi: "ngôi nhà", en: "a house" }, emoji: "🏠" },
  { label: { vi: "cái cây", en: "a tree" }, emoji: "🌳" },
  { label: { vi: "ô tô", en: "a car" }, emoji: "🚗" },
  { label: { vi: "con bướm", en: "a butterfly" }, emoji: "🦋" },
];

function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }

const BOT = {
  intro: { vi: "Chào! Tôi là Pixel 🎨. Tôi tạo ảnh bằng cách <b>khử nhiễu dần</b> từ một mớ hạt ngẫu nhiên. Đoán tôi đang vẽ gì — <b>đoán càng sớm càng nhiều điểm</b>!", en: "Hi! I'm Pixel 🎨. I make images by <b>denoising</b> random static. Guess what I'm drawing — <b>the earlier, the more points</b>!" },
  good: { vi: ["🎯 Mắt thần! Đoán sớm ghê", "Chuẩn! Nhìn xuyên nhiễu luôn 😎", "Trúng phóc 🔥"], en: ["🎯 Eagle eye! Early call", "Right! Saw through the noise 😎", "Spot on 🔥"] },
  bad: { vi: ["Hụt rồi! Nhìn kỹ hình đang hiện nhé.", "Chưa đúng — đợi rõ thêm chút."], en: ["Missed! Look closer as it clears.", "Not quite — let it clear a bit."] },
  slow: { vi: "⏰ Hiện rõ hết rồi mà chưa đoán — nhanh hơn nào!", en: "⏰ Fully revealed and no guess — be quicker!" },
  streak: { vi: "🔥 Chuỗi %s! Bậc thầy nhìn nhiễu 🎨", en: "🔥 Streak %s! Noise-whisperer 🎨" },
};

const UI = {
  intro: { vi: "Diffusion model thật học một quá trình <strong>khử nhiễu nhiều bước</strong> có điều kiện theo prompt. Trò chơi này không chạy model: nó chỉ hòa trộn nhiễu pixel với một emoji đích để minh họa trực quan. <strong>Thử thách:</strong> đoán hình càng sớm càng nhiều điểm!", en: "Real diffusion models learn a <strong>multi-step denoising process</strong> conditioned on a prompt. This game runs no model: it only blends pixel noise toward a target emoji as a visualization. <strong>Challenge:</strong> guess earlier for more points!" },
  score: { vi: "Điểm", en: "Score" }, streak: { vi: "Chuỗi", en: "Streak" }, best: { vi: "Kỷ lục", en: "Best" },
  start: { vi: "▶ Chơi", en: "▶ Play" }, again: { vi: "↺ Chơi lại", en: "↺ Play again" },
  prompt: { vi: "Emoji đích là gì?", en: "What is the target emoji?" },
  clarity: { vi: "Độ rõ", en: "Clarity" },
  over: { vi: "Hết lượt!", en: "Game over!" },
  overSub: { vi: "Hiệu ứng trong game là phép hòa trộn pixel, không phải quá trình suy luận của diffusion model. Nguồn bên dưới mô tả thuật toán thật.", en: "The game effect is pixel blending, not diffusion-model inference. See the source below for the real algorithm." },
  newRecord: { vi: "🏆 Kỷ lục mới!", en: "🏆 New record!" }, finalScore: { vi: "Điểm của bạn", en: "Your score" },
};

export function roomDiffusion(root) {
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  let score = 0, streak = 0, lives = 3, playing = false, locked = false;
  let current = null, t = 0, timer = null;

  root.innerHTML = `
    <p class="room-intro">${tx(UI.intro)}</p>
    <div class="g-mascot"><div class="g-bot" id="dfBot">🎨</div><div class="g-bubble" id="dfBubble">${tx(BOT.intro)}</div></div>

    <div class="panel">
      <div class="g-hud">
        <div class="g-stat"><span>${tx(UI.score)}</span><b id="dfScore">0</b></div>
        <div class="g-stat"><span>${tx(UI.streak)}</span><b id="dfStreak">0</b></div>
        <div class="g-stat"><span>${tx(UI.best)}</span><b id="dfBest">0</b></div>
        <div class="g-hearts" id="dfHearts"></div>
      </div>

      <div id="dfSetup" style="text-align:center; padding:10px 0;">
        <button class="btn g-play" id="dfPlay">${tx(UI.start)}</button>
      </div>

      <div id="dfGame" hidden>
        <div class="row" style="align-items:center">
          <div class="center" style="flex:0 0 auto">
            <canvas id="dfCanvas" width="${SIZE}" height="${SIZE}" style="background:#000; border:3px solid var(--ink);"></canvas>
            <div class="muted mt" style="font-size:12px">${tx(UI.clarity)}: <b id="dfClarity">0%</b></div>
          </div>
          <div style="flex:1; min-width:220px">
            <p class="muted" style="font-weight:700">${tx(UI.prompt)}</p>
            <div class="nt-chips" id="dfChips"></div>
          </div>
        </div>
      </div>

      <div id="dfOver" hidden class="g-over"></div>
    </div>

    <div class="takeaway">${tx(
      "💡 <strong>Điều cốt lõi:</strong> Diffusion model thật học một quá trình khử nhiễu xác suất qua nhiều bước, thường có điều kiện theo prompt. Canvas ở đây chỉ làm ảnh emoji rõ dần bằng phép hòa trộn pixel, nên điểm số đo khả năng đoán emoji — không đo cách AI hay con người nhận mẫu.",
      "💡 <strong>Key idea:</strong> Real diffusion models learn a probabilistic multi-step denoising process, often conditioned on prompts. This canvas only reveals an emoji through pixel blending, so the score measures emoji guessing—not how an AI or human recognizes patterns."
    )}</div>
  `;

  const $ = (s) => root.querySelector(s);
  const botEl = $("#dfBot"), bubbleEl = $("#dfBubble");
  const scoreEl = $("#dfScore"), streakEl = $("#dfStreak"), bestEl = $("#dfBest"), heartsEl = $("#dfHearts");
  const setupEl = $("#dfSetup"), gameEl = $("#dfGame"), overEl = $("#dfOver");
  const chipsEl = $("#dfChips"), clarityEl = $("#dfClarity");
  const canvas = $("#dfCanvas"), ctx = canvas.getContext("2d");
  const off = document.createElement("canvas"); off.width = SIZE; off.height = SIZE;
  const octx = off.getContext("2d");
  let target = null;

  bestEl.textContent = getRoomStat("diffusion", "bestScore", 0);
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

  function buildTarget(emoji) {
    octx.clearRect(0, 0, SIZE, SIZE);
    octx.fillStyle = "#0d0a1c"; octx.fillRect(0, 0, SIZE, SIZE);
    octx.font = "150px serif"; octx.textAlign = "center"; octx.textBaseline = "middle";
    octx.fillText(emoji, SIZE / 2, SIZE / 2 + 8);
    target = octx.getImageData(0, 0, SIZE, SIZE);
  }
  function renderStep(step, T) {
    const mix = step / T, noiseAmt = (1 - mix) * 190;
    const img = ctx.createImageData(SIZE, SIZE), tgt = target.data;
    for (let i = 0; i < img.data.length; i += 4) {
      for (let k = 0; k < 3; k++) {
        const base = tgt[i + k] * mix + (Math.random() * 255) * (1 - mix);
        img.data[i + k] = Math.max(0, Math.min(255, base + (Math.random() - 0.5) * noiseAmt));
      }
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }

  function stopAnim() { if (timer) { clearInterval(timer); timer = null; } }

  function newRound() {
    stopAnim();
    locked = false;
    const correct = pickArr(PROMPTS);
    const distract = shuffle(PROMPTS.filter((p) => p !== correct)).slice(0, 3);
    const opts = shuffle([correct, ...distract]);
    current = { correct, opts };
    buildTarget(correct.emoji);
    t = 0;
    clarityEl.textContent = "0%";
    chipsEl.innerHTML = "";
    opts.forEach((p) => {
      const c = document.createElement("button");
      c.className = "nt-chip";
      c.innerHTML = `${p.emoji} ${tx(p.label)}`;
      c.onclick = () => onPick(p, c);
      chipsEl.appendChild(c);
    });
    // Khử nhiễu dần; nếu tới cuối mà chưa đoán → tính là chậm (mất mạng).
    const T = reduce ? 4 : STEPS;
    timer = setInterval(() => {
      renderStep(t, T);
      clarityEl.textContent = Math.round(t / T * 100) + "%";
      t++;
      if (t > T) { stopAnim(); ctx.putImageData(target, 0, 0); clarityEl.textContent = "100%"; if (!locked) onTooSlow(); }
    }, reduce ? 120 : STEP_MS);
  }

  function finishReveal() { stopAnim(); ctx.putImageData(target, 0, 0); clarityEl.textContent = "100%"; }

  function onPick(p, chipEl) {
    if (locked || !playing) return;
    locked = true;
    const T = reduce ? 4 : STEPS;
    const earliness = Math.max(0, 1 - t / T); // đoán càng sớm càng cao
    const correct = p === current.correct;
    chipsEl.querySelectorAll(".nt-chip").forEach((el) => {
      el.disabled = true;
      if (el.textContent.trim().startsWith(current.correct.emoji)) el.classList.add("correct");
    });
    finishReveal();
    if (correct) {
      const gained = 50 + Math.round(earliness * 150) + streak * 15;
      score += gained; streak++;
      chipEl.classList.add("pop"); sfx.success();
      if (streak % 3 === 0) { if (!reduce) celebrate(); say(tx(BOT.streak).replace("%s", streak), "happy"); }
      else say(pickArr(BOT.good[langKey()]) + ` <b>+${gained}</b>`, "happy");
    } else {
      chipEl.classList.add("wrong"); streak = 0; lives--; sfx.wrong();
      if (!reduce) { gameEl.classList.remove("shake"); void gameEl.offsetWidth; gameEl.classList.add("shake"); }
      say(pickArr(BOT.bad[langKey()]), "sad");
    }
    updateHUD();
    setTimeout(() => { if (lives <= 0) endGame(); else newRound(); }, correct ? 1300 : 1800);
  }

  function onTooSlow() {
    if (locked) return;
    locked = true;
    chipsEl.querySelectorAll(".nt-chip").forEach((el) => { el.disabled = true; if (el.textContent.trim().startsWith(current.correct.emoji)) el.classList.add("correct"); });
    streak = 0; lives--; sfx.wrong();
    say(tx(BOT.slow), "sad");
    updateHUD();
    setTimeout(() => { if (lives <= 0) endGame(); else newRound(); }, 1500);
  }

  function startGame() {
    score = 0; streak = 0; lives = 3; playing = true;
    updateHUD();
    setupEl.hidden = true; overEl.hidden = true; gameEl.hidden = false;
    newRound();
  }

  function endGame() {
    playing = false; stopAnim(); gameEl.hidden = true;
    const record = setRoomStatMax("diffusion", "bestScore", score);
    bestEl.textContent = getRoomStat("diffusion", "bestScore", 0);
    if (record && !reduce) celebrate();
    say(tx({ vi: `Hết lượt! Điểm: <b>${score}</b>. Vẽ ván nữa nhé? 🎨`, en: `Game over! Score: <b>${score}</b>. Paint again? 🎨` }), record ? "happy" : "sad");
    overEl.hidden = false;
    overEl.innerHTML = `
      <div class="g-over-card">
        <div class="g-over-title">${record ? tx(UI.newRecord) : tx(UI.over)}</div>
        <div class="g-over-score">${tx(UI.finalScore)}: <b>${score}</b></div>
        <p class="muted">${tx(UI.overSub)}</p>
        <button class="btn g-play" id="dfAgain">${tx(UI.again)}</button>
      </div>`;
    overEl.querySelector("#dfAgain").onclick = startGame;
  }

  $("#dfPlay").onclick = startGame;
  updateHUD();

  window.addEventListener("roomleave", stopAnim, { once: true });
}
