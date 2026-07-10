// Phòng — Gợi ý: GAME "Đoán AI gợi ý". Nhìn người dùng thích gì, đoán AI sẽ gợi ý mục nào nhất. Song ngữ.
import { sfx, celebrate } from "../sound.js";
import { tx } from "../i18n.js";
import { getRoomStat, setRoomStatMax } from "../store.js";

// Đặc trưng theo thể loại: [hành động, hài, tình cảm, khoa học, kinh dị]
const ITEMS = [
  { icon: "🚗", t: { vi: "Phim đua xe", en: "Racing movie" }, v: [1, 0, 0, 0, 0] },
  { icon: "😂", t: { vi: "Hài kịch", en: "Comedy show" }, v: [0, 1, 0, 0, 0] },
  { icon: "💘", t: { vi: "Phim tình cảm", en: "Romance film" }, v: [0, 0, 1, 0, 0] },
  { icon: "🚀", t: { vi: "Khoa học viễn tưởng", en: "Sci-fi" }, v: [.3, 0, 0, 1, 0] },
  { icon: "👻", t: { vi: "Phim ma", en: "Horror film" }, v: [0, 0, 0, 0, 1] },
  { icon: "💥", t: { vi: "Bom tấn hành động", en: "Action blockbuster" }, v: [1, .2, 0, .2, 0] },
  { icon: "🤖", t: { vi: "Tài liệu về AI", en: "AI documentary" }, v: [0, 0, 0, 1, 0] },
  { icon: "🧟", t: { vi: "Phim zombie", en: "Zombie movie" }, v: [.4, 0, 0, 0, 1] },
  { icon: "💑", t: { vi: "Hài lãng mạn", en: "Rom-com" }, v: [0, .6, .7, 0, 0] },
  { icon: "🛸", t: { vi: "Người ngoài hành tinh", en: "Alien thriller" }, v: [.3, 0, 0, .7, .5] },
];

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }

const BOT = {
  intro: { vi: "Chào! Tôi là Bit 🤖 — bộ máy gợi ý sau TikTok/Netflix. Tôi nhìn thứ bạn <b>đã thích</b> rồi tìm cái <b>giống nhất</b>. Đoán xem tôi sẽ gợi ý mục nào nhất nhé!", en: "Hi! I'm Bit 🤖 — the recommender behind TikTok/Netflix. I look at what you <b>liked</b> and find the <b>most similar</b>. Guess which one I'll recommend most!" },
  good: { vi: ["🎯 Đúng gu tôi luôn!", "Chuẩn! Bạn hiểu cách tôi nghĩ 😎", "Trúng phóc 🔥"], en: ["🎯 Right on!", "You get how I think 😎", "Spot on 🔥"] },
  bad: { vi: ["Chưa đúng — nhìn thanh độ giống nhé.", "Hụt rồi! Cái giống nhất mới là cái tôi chọn."], en: ["Not quite — check the similarity bars.", "Missed! I pick the most similar one."] },
  streak: { vi: "🔥 Chuỗi %s! Bạn đọc vị thuật toán rồi 😎", en: "🔥 Streak %s! You've cracked the algorithm 😎" },
};

const UI = {
  intro: { vi: "TikTok, Netflix \"hiểu\" bạn nhờ ghi lại thứ bạn <strong>thích</strong> rồi tìm cái <em>giống nhất</em>. <strong>Thử thách:</strong> nhìn những gì người dùng đã thích và đoán AI sẽ gợi ý mục nào <strong>nhất</strong>!", en: "TikTok and Netflix \"get\" you by recording what you <strong>like</strong> and finding the <em>most similar</em>. <strong>Challenge:</strong> look at what a user liked and guess which item the AI recommends <strong>most</strong>!" },
  score: { vi: "Điểm", en: "Score" }, streak: { vi: "Chuỗi", en: "Streak" }, best: { vi: "Kỷ lục", en: "Best" },
  start: { vi: "▶ Chơi", en: "▶ Play" }, again: { vi: "↺ Chơi lại", en: "↺ Play again" },
  liked: { vi: "👍 Người dùng đã thích:", en: "👍 The user liked:" },
  prompt: { vi: "AI sẽ gợi ý mục nào nhất?", en: "Which one will the AI recommend most?" },
  reveal: { vi: "Độ giống với gu người dùng:", en: "Similarity to the user's taste:" },
  over: { vi: "Hết lượt!", en: "Game over!" },
  overSub: { vi: "Hệ gợi ý không \"hiểu\" nội dung như người — nó biểu diễn mọi thứ bằng con số rồi đo <b>độ giống nhau</b>. Vì thế nó gợi ý \"trúng\" đến phát sợ, nhưng cũng dễ nhốt bạn trong \"bong bóng\" quanh thứ bạn đã thích.", en: "Recommenders don't \"understand\" content — they turn everything into numbers and measure <b>similarity</b>. That's why they nail it eerily well, but can also trap you in a \"bubble\" around what you already liked." },
  newRecord: { vi: "🏆 Kỷ lục mới!", en: "🏆 New record!" }, finalScore: { vi: "Điểm của bạn", en: "Your score" },
};

export function roomRecommendation(root) {
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  let score = 0, streak = 0, lives = 3, playing = false, locked = false;
  let current = null;

  root.innerHTML = `
    <p class="room-intro">${tx(UI.intro)}</p>
    <div class="g-mascot"><div class="g-bot" id="rcBot">🤖</div><div class="g-bubble" id="rcBubble">${tx(BOT.intro)}</div></div>

    <div class="panel">
      <div class="g-hud">
        <div class="g-stat"><span>${tx(UI.score)}</span><b id="rcScore">0</b></div>
        <div class="g-stat"><span>${tx(UI.streak)}</span><b id="rcStreak">0</b></div>
        <div class="g-stat"><span>${tx(UI.best)}</span><b id="rcBest">0</b></div>
        <div class="g-hearts" id="rcHearts"></div>
      </div>

      <div id="rcSetup" style="text-align:center; padding:10px 0;">
        <button class="btn g-play" id="rcPlay">${tx(UI.start)}</button>
      </div>

      <div id="rcGame" hidden>
        <div class="muted" style="font-weight:700">${tx(UI.liked)}</div>
        <div class="rc-liked" id="rcLiked"></div>
        <p class="muted mt" style="font-weight:700">${tx(UI.prompt)}</p>
        <div class="nt-chips" id="rcChips"></div>
        <div id="rcReveal" class="mt"></div>
      </div>

      <div id="rcOver" hidden class="g-over"></div>
    </div>

    <div class="takeaway">${tx(
      "💡 <strong>Điều cốt lõi:</strong> Hệ gợi ý biểu diễn mỗi thứ bằng con số (đặc trưng) rồi đo <em>độ giống nhau</em> với gu của bạn. Đó là lý do nó gợi ý trúng — và cũng là lý do dễ tạo \"bong bóng lọc\".",
      "💡 <strong>Key idea:</strong> A recommender represents each item as numbers (features) and measures <em>similarity</em> to your taste. That's why it nails recommendations — and why it can create a \"filter bubble\"."
    )}</div>
  `;

  const $ = (s) => root.querySelector(s);
  const botEl = $("#rcBot"), bubbleEl = $("#rcBubble");
  const scoreEl = $("#rcScore"), streakEl = $("#rcStreak"), bestEl = $("#rcBest"), heartsEl = $("#rcHearts");
  const setupEl = $("#rcSetup"), gameEl = $("#rcGame"), overEl = $("#rcOver");
  const likedEl = $("#rcLiked"), chipsEl = $("#rcChips"), revealEl = $("#rcReveal");

  bestEl.textContent = getRoomStat("recommendation", "bestScore", 0);
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

  function makeRound() {
    // Chọn 2 mục "đã thích" cùng hướng gu để đề rõ ràng.
    let liked, profile, opts, cos, tries = 0;
    do {
      const idxs = shuffle([...ITEMS.keys()]);
      liked = [idxs[0], idxs[1]];
      profile = new Array(ITEMS[0].v.length).fill(0);
      liked.forEach((i) => ITEMS[i].v.forEach((val, d) => (profile[d] += val)));
      const rest = idxs.slice(2);
      opts = rest.slice(0, 4);
      cos = opts.map((i) => cosine(profile, ITEMS[i].v));
      tries++;
    } while (tries < 20 && (() => { // đảm bảo có 1 đáp án trội rõ
      const sorted = [...cos].sort((a, b) => b - a);
      return sorted[0] - sorted[1] < 0.12;
    })());
    const correctPos = cos.indexOf(Math.max(...cos));
    return { liked, opts, cos, correct: opts[correctPos] };
  }

  function newRound() {
    locked = false;
    current = makeRound();
    revealEl.innerHTML = "";
    likedEl.innerHTML = current.liked.map((i) => `<span class="rc-pill">${ITEMS[i].icon} ${tx(ITEMS[i].t)}</span>`).join("");
    chipsEl.innerHTML = "";
    shuffle([...current.opts]).forEach((i) => {
      const c = document.createElement("button");
      c.className = "nt-chip";
      c.dataset.i = i;
      c.innerHTML = `${ITEMS[i].icon} ${tx(ITEMS[i].t)}`;
      c.onclick = () => onPick(i, c);
      chipsEl.appendChild(c);
    });
  }

  function reveal() {
    const maxC = Math.max(...current.cos, 0.01);
    revealEl.innerHTML = `<p class="muted">${tx(UI.reveal)}</p>` + current.opts
      .map((i, k) => ({ i, c: current.cos[k] })).sort((a, b) => b.c - a.c)
      .map(({ i, c }) => {
        const pct = Math.max(4, Math.round(c / maxC * 100));
        const hot = i === current.correct;
        return `<div class="bar-row"><div class="bar-label" style="width:auto;flex:0 0 150px;text-align:left">${ITEMS[i].icon} ${tx(ITEMS[i].t)}</div>
          <div class="bar-track"><div class="bar-fill${hot ? " nt-hot" : ""}" style="width:${pct}%">${Math.round(c * 100)}%</div></div></div>`;
      }).join("");
  }

  function onPick(i, chipEl) {
    if (locked || !playing) return;
    locked = true;
    const correct = i === current.correct;
    chipsEl.querySelectorAll(".nt-chip").forEach((el) => {
      el.disabled = true;
      if (parseInt(el.dataset.i) === current.correct) el.classList.add("correct");
    });
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
    }
    updateHUD();
    reveal();
    setTimeout(() => { if (lives <= 0) endGame(); else newRound(); }, correct ? 1500 : 2100);
  }

  function startGame() {
    score = 0; streak = 0; lives = 3; playing = true;
    updateHUD();
    setupEl.hidden = true; overEl.hidden = true; gameEl.hidden = false;
    newRound();
  }

  function endGame() {
    playing = false; gameEl.hidden = true;
    const record = setRoomStatMax("recommendation", "bestScore", score);
    bestEl.textContent = getRoomStat("recommendation", "bestScore", 0);
    if (record && !reduce) celebrate();
    say(tx({ vi: `Hết lượt! Điểm: <b>${score}</b>. Chơi lại nhé? 🤖`, en: `Game over! Score: <b>${score}</b>. Play again? 🤖` }), record ? "happy" : "sad");
    overEl.hidden = false;
    overEl.innerHTML = `
      <div class="g-over-card">
        <div class="g-over-title">${record ? tx(UI.newRecord) : tx(UI.over)}</div>
        <div class="g-over-score">${tx(UI.finalScore)}: <b>${score}</b></div>
        <p class="muted">${tx(UI.overSub)}</p>
        <button class="btn g-play" id="rcAgain">${tx(UI.again)}</button>
      </div>`;
    overEl.querySelector("#rcAgain").onclick = startGame;
  }

  $("#rcPlay").onclick = startGame;
  updateHUD();
}
