// Phòng — Token là gì? GAME "Đoán số token": nhìn câu, đoán AI cắt ra bao nhiêu token. Song ngữ.
// Giữ nguyên bộ cắt token minh hoạ; bọc thành game đoán số có điểm/streak/mạng + mascot dẫn dắt.
import { sfx, celebrate } from "../sound.js";
import { tx } from "../i18n.js";
import { getRoomStat, setRoomStatMax } from "../store.js";

const COMMON = new Set([
  "tôi", "bạn", "là", "và", "của", "có", "không", "một", "ai", "học", "máy",
  "the", "a", "is", "to", "of", "and", "in", "it", "you", "i",
]);

function tokenize(text) {
  const tokens = [];
  const parts = text.match(/[\p{L}\p{N}]+|[^\s\p{L}\p{N}]/gu) || [];
  for (const p of parts) {
    if (/[^\p{L}\p{N}]/u.test(p)) { tokens.push(p); continue; }
    const low = p.toLowerCase();
    if (COMMON.has(low) || p.length <= 3) tokens.push(p);
    else {
      let i = 0;
      while (i < p.length) { const len = Math.min(4, p.length - i); tokens.push((i === 0 ? "" : "##") + p.slice(i, i + len)); i += len; }
    }
  }
  return tokens;
}

const COLORS = ["#6ea8fe", "#b07bff", "#34d399", "#fbbf24", "#f472b6", "#22d3ee", "#fb923c"];

// Câu để đoán: trộn Việt/Anh, ngắn/dài, có emoji & từ hiếm — để lộ quy luật "từ dài/hiếm = nhiều token".
const POOL = [
  "tôi thích học AI.",
  "I love learning about AI.",
  "Xin chào 👋 trời đẹp quá 🌤️",
  "Trí tuệ nhân tạo đang thay đổi thế giới.",
  "the quick brown fox jumps over the lazy dog",
  "Internationalization is a long word!",
  "một hai ba bốn năm sáu bảy",
  "hello, how are you today?",
  "Chuyển đổi số quốc gia",
  "supercalifragilistic",
  "AI học từ dữ liệu của con người.",
  "email: test@example.com",
];

const BOT = {
  intro: { vi: "Tôi là Bit 🤖. Trước khi hiểu gì, tôi <b>cắt câu thành token</b>. Nhìn câu và đoán tôi cắt ra <b>bao nhiêu mảnh</b> nhé — đoán sát thì ghi điểm!", en: "I'm Bit 🤖. Before I understand anything, I <b>chop text into tokens</b>. Look at the sentence and guess <b>how many pieces</b> I make — close guesses score!" },
  exact: { vi: ["🎯 Chính xác! Bạn nghĩ như một tokenizer rồi 😎", "Trúng phóc! 🔥", "Không lệch một token nào 👏"], en: ["🎯 Exact! You think like a tokenizer 😎", "Bang on! 🔥", "Not off by a single token 👏"] },
  close: { vi: ["Sát nút! Chỉ lệch chút xíu 👍", "Gần lắm rồi!"], en: ["So close! Barely off 👍", "Almost there!"] },
  mid: { vi: ["Tạm được — để ý từ dài/hiếm bị xé thành nhiều mảnh nhé.", "Chưa sát: dấu câu & emoji cũng tính là token đấy!"], en: ["Not bad — note long/rare words split into many pieces.", "A bit off: punctuation & emoji count as tokens too!"] },
  far: { vi: ["Lệch nhiều rồi! Từ tiếng Anh thông dụng ít token, từ dài/hiếm nhiều token.", "Hụt xa — nhìn kỹ: mỗi dấu câu là 1 token riêng."], en: ["Way off! Common English = few tokens, long/rare = many.", "Far off — look: each punctuation is its own token."] },
  streak: { vi: "🔥 Chuỗi %s! Bạn đọc vị được bộ cắt token!", en: "🔥 Streak %s! You've cracked the tokenizer!" },
};

const UI = {
  intro: {
    vi: "Trước khi \"hiểu\" gì, AI <strong>cắt văn bản thành token</strong> — có khi cả từ, có khi chỉ một phần. <strong>Thử thách:</strong> nhìn câu và đoán AI cắt ra bao nhiêu token. Đoán càng sát càng nhiều điểm!",
    en: "Before \"understanding\", AI <strong>chops text into tokens</strong> — sometimes whole words, sometimes parts. <strong>Challenge:</strong> look at a sentence and guess how many tokens. The closer, the more points!",
  },
  score: { vi: "Điểm", en: "Score" }, streak: { vi: "Chuỗi", en: "Streak" }, best: { vi: "Kỷ lục", en: "Best" },
  start: { vi: "▶ Chơi", en: "▶ Play" }, again: { vi: "↺ Chơi lại", en: "↺ Play again" },
  prompt: { vi: "AI cắt câu này ra bao nhiêu token?", en: "How many tokens does the AI make from this?" },
  guess: { vi: "🎯 Đoán", en: "🎯 Guess" },
  actual: { vi: "AI cắt ra:", en: "The AI made:" },
  tokensWord: { vi: "token", en: "tokens" },
  over: { vi: "Hết lượt!", en: "Game over!" },
  overSub: {
    vi: "AI không thấy \"chữ\" như ta — nó thấy <b>token</b>. Tiếng Anh thông dụng ít token; từ dài/hiếm, tiếng Việt có dấu, dấu câu và emoji đều tốn thêm token. Đó là lý do dịch vụ AI <b>tính tiền theo token</b>.",
    en: "AI doesn't see \"letters\" — it sees <b>tokens</b>. Common English costs few; long/rare words, accented Vietnamese, punctuation and emoji all add tokens. That's why AI services <b>bill by token</b>.",
  },
  newRecord: { vi: "🏆 Kỷ lục mới!", en: "🏆 New record!" }, finalScore: { vi: "Điểm của bạn", en: "Your score" },
};

export function roomTokenizer(root) {
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  let score = 0, streak = 0, lives = 3, playing = false, locked = false;
  let queue = [], current = "";

  root.innerHTML = `
    <p class="room-intro">${tx(UI.intro)}</p>
    <div class="g-mascot"><div class="g-bot" id="tkBot">🤖</div><div class="g-bubble" id="tkBubble">${tx(BOT.intro)}</div></div>

    <div class="panel">
      <div class="g-hud">
        <div class="g-stat"><span>${tx(UI.score)}</span><b id="tkScore">0</b></div>
        <div class="g-stat"><span>${tx(UI.streak)}</span><b id="tkStreak">0</b></div>
        <div class="g-stat"><span>${tx(UI.best)}</span><b id="tkBest">0</b></div>
        <div class="g-hearts" id="tkHearts"></div>
      </div>

      <div id="tkSetup" style="text-align:center; padding:10px 0;">
        <button class="btn g-play" id="tkPlay">${tx(UI.start)}</button>
      </div>

      <div id="tkGame" hidden>
        <div class="tkg-sentence" id="tkSentence"></div>
        <p class="muted" style="font-weight:700">${tx(UI.prompt)}</p>
        <div class="tkg-guess mt">
          <button class="tkg-step" id="tkMinus" aria-label="-1">−</button>
          <input class="tkg-num" id="tkNum" type="number" min="1" max="60" value="5" />
          <button class="tkg-step" id="tkPlus" aria-label="+1">+</button>
          <button class="btn g-play" id="tkGuess" style="margin-left:8px">${tx(UI.guess)}</button>
        </div>
        <div id="tkReveal" class="tkg-tokens"></div>
      </div>

      <div id="tkOver" hidden class="g-over"></div>
    </div>

    <div class="takeaway">${tx(
      "💡 <strong>Điều cốt lõi:</strong> AI xử lý và tính tiền theo <em>token</em>, không theo số chữ. Từ hiếm/dài bị xé nhỏ, dấu câu và emoji cũng là token — nên cùng một ý, cách viết khác nhau tốn token khác nhau.",
      "💡 <strong>Key idea:</strong> AI processes and bills by <em>tokens</em>, not letters. Rare/long words get split, punctuation and emoji are tokens too — so the same idea, written differently, costs different tokens."
    )}</div>
  `;

  const $ = (s) => root.querySelector(s);
  const botEl = $("#tkBot"), bubbleEl = $("#tkBubble");
  const scoreEl = $("#tkScore"), streakEl = $("#tkStreak"), bestEl = $("#tkBest"), heartsEl = $("#tkHearts");
  const setupEl = $("#tkSetup"), gameEl = $("#tkGame"), overEl = $("#tkOver");
  const sentenceEl = $("#tkSentence"), numEl = $("#tkNum"), revealEl = $("#tkReveal"), guessBtn = $("#tkGuess");

  bestEl.textContent = getRoomStat("tokenizer", "bestScore", 0);
  const pickArr = (a) => a[(Math.random() * a.length) | 0];

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

  function nextQueue() {
    if (!queue.length) queue = [...POOL].sort(() => Math.random() - 0.5);
    return queue.pop();
  }

  function newRound() {
    locked = false;
    current = nextQueue();
    sentenceEl.textContent = current;
    revealEl.innerHTML = "";
    numEl.value = 5;
    numEl.disabled = false;
    guessBtn.disabled = false;
    numEl.focus();
  }

  function renderTokens(tokens) {
    revealEl.innerHTML = `<p class="muted mt">${tx(UI.actual)} <b>${tokens.length}</b> ${tx(UI.tokensWord)}</p>` +
      tokens.map((t, i) => {
        const c = COLORS[i % COLORS.length];
        return `<span class="tok" style="background:${c}33;border:1px solid ${c};color:var(--ink);font-weight:700">${t.replace(/ /g, "·")}</span>`;
      }).join("");
  }

  function onGuess() {
    if (locked || !playing) return;
    locked = true;
    guessBtn.disabled = true; numEl.disabled = true;
    const tokens = tokenize(current);
    const actual = tokens.length;
    const guess = Math.max(1, Math.min(60, parseInt(numEl.value) || 1));
    const diff = Math.abs(guess - actual);
    renderTokens(tokens);

    let gained = 0;
    if (diff === 0) { gained = 120 + streak * 20; streak++; sfx.success(); }
    else if (diff <= 1) { gained = 70 + streak * 10; streak++; sfx.success(); }
    else if (diff <= 3) { gained = 25; streak = 0; sfx.pop(); }
    else { gained = 0; streak = 0; lives--; sfx.wrong(); if (!reduce) { gameEl.classList.remove("shake"); void gameEl.offsetWidth; gameEl.classList.add("shake"); } }
    score += gained;
    updateHUD();

    if (diff === 0) say((streak % 3 === 0 ? (celebrate(), tx(BOT.streak).replace("%s", streak)) : pickArr(BOT.exact[langKey()])) + ` <b>+${gained}</b>`, "happy");
    else if (diff <= 1) say(pickArr(BOT.close[langKey()]) + ` <b>+${gained}</b>`, "happy");
    else if (diff <= 3) say(pickArr(BOT.mid[langKey()]) + ` <b>+${gained}</b>`, "");
    else say(pickArr(BOT.far[langKey()]), "sad");

    setTimeout(() => { if (lives <= 0) endGame(); else newRound(); }, diff <= 1 ? 1300 : 1900);
  }
  function langKey() { return document.documentElement.lang === "en" ? "en" : "vi"; }

  function startGame() {
    score = 0; streak = 0; lives = 3; playing = true; queue = [];
    updateHUD();
    setupEl.hidden = true; overEl.hidden = true; gameEl.hidden = false;
    newRound();
  }

  function endGame() {
    playing = false; gameEl.hidden = true;
    const record = setRoomStatMax("tokenizer", "bestScore", score);
    bestEl.textContent = getRoomStat("tokenizer", "bestScore", 0);
    if (record && !reduce) celebrate();
    say(tx({ vi: `Hết lượt! Điểm: <b>${score}</b>. Chơi lại nhé? 🤖`, en: `Game over! Score: <b>${score}</b>. Play again? 🤖` }), record ? "happy" : "sad");
    overEl.hidden = false;
    overEl.innerHTML = `
      <div class="g-over-card">
        <div class="g-over-title">${record ? tx(UI.newRecord) : tx(UI.over)}</div>
        <div class="g-over-score">${tx(UI.finalScore)}: <b>${score}</b></div>
        <p class="muted">${tx(UI.overSub)}</p>
        <button class="btn g-play" id="tkAgain">${tx(UI.again)}</button>
      </div>`;
    overEl.querySelector("#tkAgain").onclick = startGame;
  }

  $("#tkMinus").onclick = () => { numEl.value = Math.max(1, (parseInt(numEl.value) || 1) - 1); };
  $("#tkPlus").onclick = () => { numEl.value = Math.min(60, (parseInt(numEl.value) || 1) + 1); };
  numEl.addEventListener("keydown", (e) => { if (e.key === "Enter" && !locked) onGuess(); });
  guessBtn.onclick = onGuess;
  $("#tkPlay").onclick = startGame;
  updateHUD();
}
