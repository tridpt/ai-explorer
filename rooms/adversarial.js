// Phòng — "LỪA ĐƯỢC AI THÌ THẮNG": game về adversarial examples (gấu trúc → vượn, rùa → súng…).
// Người chơi đóng vai kẻ tấn công: thêm nhiễu VỪA ĐỦ để AI đổi ý mà mắt người không nhận ra.
// Càng ít nhiễu (càng tàng hình) càng nhiều điểm. Game-hoá + hiệu ứng + mascot coach. Song ngữ.
import { sfx, celebrate } from "../sound.js";
import { tx } from "../i18n.js";
import { getRoomStat, setRoomStatMax } from "../store.js";

const SIZE = 200;
const STEALTH_CAP = 70; // trên mức này thì con người bắt đầu thấy nhiễu → "bị lộ"
const ROUND_TIME = 14000;

// Các "ví dụ đối kháng" nổi tiếng có thật trong nghiên cứu.
const TARGETS = [
  { emoji: "🐼", real: { vi: "Gấu trúc", en: "Panda" }, fake: { vi: "Vượn", en: "Gibbon" } },
  { emoji: "🐢", real: { vi: "Rùa", en: "Turtle" }, fake: { vi: "Súng trường", en: "Rifle" } },
  { emoji: "🍌", real: { vi: "Quả chuối", en: "Banana" }, fake: { vi: "Máy nướng bánh", en: "Toaster" } },
  { emoji: "🐈", real: { vi: "Mèo", en: "Cat" }, fake: { vi: "Chó", en: "Dog" } },
  { emoji: "🛑", real: { vi: "Biển báo DỪNG", en: "STOP sign" }, fake: { vi: "Biển giới hạn tốc độ", en: "Speed-limit sign" } },
];

const BOT = {
  intro: { vi: "Này! Tôi là Ẩn 🥷. Mục tiêu: thêm nhiễu <b>vừa đủ</b> để AI đổi ý — nhưng <b>càng ít càng tốt</b> để không ai thấy. Ít nhiễu = nhiều điểm!", en: "Psst! I'm Sly 🥷. Goal: add <b>just enough</b> noise to flip the AI — but <b>as little as possible</b> so nobody notices. Less noise = more points!" },
  win: {
    vi: ["Lừa gọn! AI đổi ý mà ảnh vẫn như thường 😎", "Đỉnh! Tàng hình cực khéo 🥷", "AI dính bẫy rồi! 🎯"],
    en: ["Clean hit! AI flipped, image looks normal 😎", "Slick! Super stealthy 🥷", "Gotcha, AI! 🎯"],
  },
  loud: {
    vi: ["Lừa được, nhưng nhiễu lộ liễu quá — người ta thấy ngay 👀", "AI dính, nhưng bạn 'to tiếng' quá, mất điểm tàng hình!"],
    en: ["Fooled it, but the noise is too obvious — humans would notice 👀", "AI flipped, but you were too loud — lost stealth points!"],
  },
  fail: {
    vi: ["Chưa đủ! AI vẫn nhận ra 🐼. Thêm chút nhiễu nữa.", "Hụt — AI chưa lung lay. Đẩy nhiễu cao hơn tí."],
    en: ["Not enough! The AI still sees it 🐼. Add a bit more.", "Missed — AI held firm. Push the noise a touch higher."],
  },
  timeout: { vi: "⏰ Hết giờ! Ra tay nhanh hơn nào.", en: "⏰ Time! Be quicker next time." },
  streak: { vi: "🔥 Chuỗi %s! Bậc thầy tàng hình 🥷", en: "🔥 Streak %s! Master of stealth 🥷" },
};

const UI = {
  intro: {
    vi: "AI nhận diện ảnh cực giỏi — nhưng chỉ cần thêm lớp <strong>nhiễu tinh vi mắt người khó thấy</strong>, nó có thể nhìn <em>gấu trúc</em> thành <em>vượn</em>. Bạn là kẻ tấn công: hãy <strong>lừa AI đổi ý bằng ít nhiễu nhất</strong> có thể.",
    en: "AI is great at recognizing images — but add a layer of <strong>subtle noise humans barely see</strong> and it may read a <em>panda</em> as a <em>gibbon</em>. You're the attacker: <strong>fool the AI with as little noise as possible</strong>.",
  },
  start: { vi: "▶ Bắt đầu tấn công", en: "▶ Start attacking" },
  again: { vi: "↺ Chơi lại", en: "↺ Play again" },
  score: { vi: "Điểm", en: "Score" }, streak: { vi: "Chuỗi", en: "Streak" }, best: { vi: "Kỷ lục", en: "Best" },
  seen: { vi: "Ảnh AI thấy", en: "What the AI sees" },
  noiseLayer: { vi: "Lớp nhiễu (×4)", en: "Noise layer (×4)" },
  noiseAmt: { vi: "Lượng nhiễu bạn thêm:", en: "Noise you add:" },
  stealth: { vi: "Độ tàng hình", en: "Stealth" },
  attack: { vi: "🥷 Tấn công!", en: "🥷 Attack!" },
  verdict: { vi: "AI nhận diện:", en: "AI's verdict:" },
  target: { vi: "Nhiệm vụ: lừa AI gọi", en: "Mission: make the AI say" },
  insteadOf: { vi: "thay vì", en: "instead of" },
  over: { vi: "Hết lượt!", en: "Game over!" },
  overSub: {
    vi: "Đây chính là <b>tấn công đối kháng</b>: nhiễu nhỏ mắt người bỏ qua nhưng đủ khiến AI sai. Nó đe doạ xe tự lái, nhận diện khuôn mặt… và là lý do cần phòng thủ. (Cũng là ý tưởng của dự án bảo vệ ảnh khỏi AI.)",
    en: "This is an <b>adversarial attack</b>: noise humans ignore yet enough to fool the AI. It threatens self-driving cars, face recognition… and is why defenses matter. (Also the idea behind protecting art from AI.)",
  },
  newRecord: { vi: "🏆 Kỷ lục mới!", en: "🏆 New record!" },
  finalScore: { vi: "Điểm của bạn", en: "Your score" },
  caught: { vi: "bị lộ!", en: "too obvious!" },
};

export function roomAdversarial(root) {
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  let score = 0, streak = 0, lives = 3;
  let target = TARGETS[0], threshold = 30, locked = false, playing = false;
  let raf = null, roundStart = 0;

  root.innerHTML = `
    <p class="room-intro">${tx(UI.intro)}</p>

    <div class="adv-mascot">
      <div class="adv-bot" id="advBot">🥷</div>
      <div class="adv-bubble" id="advBubble">${tx(BOT.intro)}</div>
    </div>

    <div class="panel">
      <div class="adv-hud">
        <div class="adv-stat"><span>${tx(UI.score)}</span><b id="advScore">0</b></div>
        <div class="adv-stat"><span>${tx(UI.streak)}</span><b id="advStreak">0</b></div>
        <div class="adv-stat"><span>${tx(UI.best)}</span><b id="advBest">0</b></div>
        <div class="adv-hearts" id="advHearts"></div>
      </div>

      <div id="advSetup" class="adv-setup">
        <button class="btn adv-play" id="advPlay">${tx(UI.start)}</button>
      </div>

      <div id="advGame" hidden>
        <div class="adv-timer"><div class="adv-timer-fill" id="advTimer"></div></div>
        <div class="adv-mission" id="advMission"></div>
        <div class="row mt">
          <div class="center" style="flex:1.1">
            <div class="adv-imgs">
              <div>
                <canvas id="advCanvas" width="${SIZE}" height="${SIZE}" role="img" aria-label="${tx("Ảnh AI nhìn thấy, đã cộng thêm nhiễu", "The image the AI sees, with added noise")}" style="margin:0 auto"></canvas>
                <div class="muted" style="font-size:12px">${tx(UI.seen)}</div>
              </div>
              <div class="adv-plus" aria-hidden="true">+</div>
              <div>
                <canvas id="advNoiseCanvas" width="${SIZE}" height="${SIZE}" role="img" aria-label="${tx("Lớp nhiễu đối kháng được cộng vào ảnh", "The adversarial noise layer added to the image")}" style="margin:0 auto"></canvas>
                <div class="muted" style="font-size:12px">${tx(UI.noiseLayer)}</div>
              </div>
            </div>
          </div>
          <div style="flex:1">
            <label class="field" style="text-align:left">
              <span>${tx(UI.noiseAmt)} <b id="advVal">0</b>%</span>
              <input type="range" id="advNoise" min="0" max="90" step="1" value="0" />
            </label>
            <div class="muted mt" style="font-size:13px">${tx(UI.stealth)}:</div>
            <div class="adv-stealth"><div class="adv-stealth-fill" id="advStealth"></div></div>
            <div class="mt"><button class="btn adv-attack" id="advAttack">${tx(UI.attack)}</button></div>
            <div id="advResult" class="mt"></div>
            <p class="muted" id="advNote"></p>
          </div>
        </div>
      </div>

      <div id="advOver" hidden class="adv-over"></div>
    </div>

    <div class="takeaway">
      ${tx(
        "💡 <strong>Điều cốt lõi:</strong> AI \"nhìn\" khác con người — nó bám vào mẫu pixel nhỏ ta không để ý, nên bị lừa bằng nhiễu vô hình. Điều này quan trọng với an toàn AI.",
        "💡 <strong>Key idea:</strong> AI \"sees\" differently from humans — it latches onto tiny pixel patterns we ignore, so it's fooled by invisible noise. This matters for AI safety."
      )}
    </div>
  `;

  const $ = (s) => root.querySelector(s);
  const botEl = $("#advBot"), bubbleEl = $("#advBubble");
  const scoreEl = $("#advScore"), streakEl = $("#advStreak"), bestEl = $("#advBest"), heartsEl = $("#advHearts");
  const setupEl = $("#advSetup"), gameEl = $("#advGame"), overEl = $("#advOver");
  const timerEl = $("#advTimer"), missionEl = $("#advMission");
  const canvas = $("#advCanvas"), noiseCanvas = $("#advNoiseCanvas");
  const ctx = canvas.getContext("2d"), nctx = noiseCanvas.getContext("2d");
  const slider = $("#advNoise"), valEl = $("#advVal"), stealthEl = $("#advStealth");
  const attackBtn = $("#advAttack"), resultEl = $("#advResult"), noteEl = $("#advNote");

  bestEl.textContent = getRoomStat("adversarial", "bestScore", 0);

  const base = document.createElement("canvas");
  base.width = SIZE; base.height = SIZE;
  const bctx = base.getContext("2d");
  let baseData = null;

  function drawBase(emoji) {
    bctx.fillStyle = "#e9e4d4";
    bctx.fillRect(0, 0, SIZE, SIZE);
    bctx.font = "140px serif";
    bctx.textAlign = "center";
    bctx.textBaseline = "middle";
    bctx.fillText(emoji, SIZE / 2, SIZE / 2 + 6);
    baseData = bctx.getImageData(0, 0, SIZE, SIZE);
  }

  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  function say(msg, mood = "") {
    bubbleEl.innerHTML = msg;
    if (reduce) return;
    botEl.classList.remove("bot-happy", "bot-sad", "bot-bounce");
    void botEl.offsetWidth;
    botEl.classList.add(mood === "happy" ? "bot-happy" : mood === "sad" ? "bot-sad" : "bot-bounce");
  }

  function renderHearts() {
    heartsEl.innerHTML = "";
    for (let i = 0; i < 3; i++) {
      const h = document.createElement("span");
      h.className = "adv-heart" + (i >= lives ? " lost" : "");
      h.textContent = i < lives ? "❤️" : "🤍";
      heartsEl.appendChild(h);
    }
  }
  function updateHUD() { scoreEl.textContent = score; streakEl.textContent = streak; renderHearts(); }

  function drawNoise() {
    const strength = parseInt(slider.value);
    valEl.textContent = strength;
    const amt = strength * 1.6;
    const img = ctx.createImageData(SIZE, SIZE);
    const noiseImg = nctx.createImageData(SIZE, SIZE);
    for (let i = 0; i < img.data.length; i += 4) {
      for (let k = 0; k < 3; k++) {
        const n = (Math.random() - 0.5) * amt;
        img.data[i + k] = Math.max(0, Math.min(255, baseData.data[i + k] + n));
        noiseImg.data[i + k] = Math.max(0, Math.min(255, 128 + n * 4));
      }
      img.data[i + 3] = 255;
      noiseImg.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    nctx.putImageData(noiseImg, 0, 0);
    // Thanh tàng hình: nhiễu càng ít càng tàng hình cao; quá cao thì đỏ ("bị lộ").
    const stealthPct = Math.max(0, 100 - (strength / STEALTH_CAP) * 100);
    stealthEl.style.width = Math.max(4, stealthPct) + "%";
    stealthEl.classList.toggle("low", strength > STEALTH_CAP);
  }

  function bar(label, pct, color) {
    return `<div class="bar-row"><div class="bar-label" style="width:auto;flex:0 0 120px;text-align:left">${label}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${color}">${pct}%</div></div></div>`;
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
    target = pick(TARGETS);
    threshold = 20 + Math.round(Math.random() * 32); // 20–52%
    drawBase(target.emoji);
    slider.value = 0;
    drawNoise();
    resultEl.innerHTML = "";
    noteEl.textContent = "";
    attackBtn.disabled = false;
    missionEl.innerHTML = `${tx(UI.target)} <b class="adv-fake">${target.emoji} ${tx(target.fake)}</b> ${tx(UI.insteadOf)} <b>${tx(target.real)}</b>`;
    startTimer();
  }

  function reveal(fooled, strength) {
    const conf = fooled ? 90 + Math.min(9, Math.round((strength - threshold) * 0.3)) : 96 - Math.round(strength * 0.3);
    if (fooled) {
      resultEl.innerHTML = bar(`${target.emoji} ${tx(target.fake)}`, conf, "var(--bad)")
        + bar(tx(target.real), 100 - conf, "#999");
    } else {
      resultEl.innerHTML = bar(tx(target.real), conf, "var(--good)")
        + bar(`${tx(target.fake)}`, 100 - conf, "#999");
    }
  }

  function endAttack(fooled, strength) {
    updateHUD();
    reveal(fooled, strength);
    setTimeout(() => { if (lives <= 0) endGame(); else newRound(); }, fooled ? 1500 : 1800);
  }

  function onAttack() {
    if (locked || !playing) return;
    locked = true;
    stopTimer();
    attackBtn.disabled = true;
    const strength = parseInt(slider.value);
    const fooled = strength >= threshold;

    if (fooled && strength <= STEALTH_CAP) {
      const stealthBonus = Math.round((STEALTH_CAP - strength) * 4);
      const gained = 60 + stealthBonus + streak * 15;
      score += gained; streak++;
      sfx.success();
      if (streak % 3 === 0) { if (!reduce) celebrate(); say(tx(BOT.streak).replace("%s", streak), "happy"); }
      else say(pick(BOT.win[langKey()]) + ` <b>+${gained}</b>`, "happy");
      endAttack(true, strength);
    } else if (fooled) {
      // Lừa được nhưng nhiễu quá lộ liễu → thắng nhẹ, ít điểm, cảnh báo.
      const gained = 30 + streak * 5;
      score += gained; streak++;
      sfx.pop();
      say(pick(BOT.loud[langKey()]) + ` <b>+${gained}</b>`, "");
      noteEl.innerHTML = `⚠️ ${tx(UI.caught)}`;
      endAttack(true, strength);
    } else {
      streak = 0; lives--;
      sfx.wrong();
      if (!reduce) { gameEl.classList.remove("shake"); void gameEl.offsetWidth; gameEl.classList.add("shake"); }
      say(pick(BOT.fail[langKey()]), "sad");
      endAttack(false, strength);
    }
  }

  function langKey() { return document.documentElement.lang === "en" ? "en" : "vi"; }

  function onTimeout() {
    if (locked) return;
    locked = true; stopTimer(); attackBtn.disabled = true;
    streak = 0; lives--;
    sfx.wrong();
    say(tx(BOT.timeout), "sad");
    endAttack(false, parseInt(slider.value));
  }

  function startGame() {
    score = 0; streak = 0; lives = 3; playing = true;
    updateHUD();
    setupEl.hidden = true; overEl.hidden = true; gameEl.hidden = false;
    newRound();
  }

  function endGame() {
    playing = false; stopTimer(); gameEl.hidden = true;
    const record = setRoomStatMax("adversarial", "bestScore", score);
    bestEl.textContent = getRoomStat("adversarial", "bestScore", 0);
    if (record && !reduce) celebrate();
    say(tx({ vi: `Hết lượt rồi! Điểm: <b>${score}</b>. Làm ván nữa nhé 🥷`, en: `Game over! Score: <b>${score}</b>. One more run? 🥷` }), record ? "happy" : "sad");
    overEl.hidden = false;
    overEl.innerHTML = `
      <div class="adv-over-card">
        <div class="adv-over-title">${record ? tx(UI.newRecord) : tx(UI.over)}</div>
        <div class="adv-over-score">${tx(UI.finalScore)}: <b>${score}</b></div>
        <p class="muted">${tx(UI.overSub)}</p>
        <button class="btn adv-play" id="advAgain">${tx(UI.again)}</button>
      </div>`;
    overEl.querySelector("#advAgain").onclick = startGame;
  }

  slider.oninput = drawNoise;
  attackBtn.onclick = onAttack;
  $("#advPlay").onclick = startGame;
  drawBase("🐼"); drawNoise(); updateHUD();

  window.addEventListener("roomleave", stopTimer, { once: true });
}
