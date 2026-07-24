// Phòng — "BẠN ĐẤU VỚI AI": game đoán từ tiếp theo (mô phỏng cách LLM sinh chữ & vì sao "ảo giác").
// Kết hợp game-hoá (điểm/streak/mạng/tính giờ) + hiệu ứng đã tay + mascot robot dẫn dắt. Song ngữ.
import { tx, getLang } from "../i18n.js";
import { sfx, celebrate } from "../sound.js";
import { getRoomStat, setRoomStatMax } from "../store.js";

const CORPUS = {
  vi: `
mặt trời mọc ở đằng đông và lặn ở đằng tây.
buổi sáng tôi thường uống một cốc cà phê nóng.
con mèo nhỏ nằm ngủ trên chiếc ghế sofa êm ái.
mùa xuân hoa nở rực rỡ khắp các con đường.
trẻ em thích chơi đùa ngoài công viên vào buổi chiều.
biển xanh và bầu trời trong vắt khiến lòng người thư thái.
mẹ nấu một nồi canh chua thơm phức cho cả nhà.
học sinh chăm chỉ làm bài tập về nhà mỗi tối.
chú chó vẫy đuôi mừng rỡ khi chủ về nhà.
cơn mưa rào bất chợt đổ xuống thành phố ban trưa.
những vì sao lấp lánh trên bầu trời đêm tĩnh lặng.
bà kể cho cháu nghe một câu chuyện cổ tích hay.
gió thổi nhẹ qua cánh đồng lúa chín vàng óng.
tôi thích đọc sách bên cửa sổ vào ngày mưa.
ông mặt trời chiếu những tia nắng ấm áp xuống mặt đất.
`,
  en: `
the sun rises in the east and sets in the west.
in the morning i usually drink a cup of hot coffee.
the little cat sleeps on the soft cozy sofa.
in spring flowers bloom brightly along the streets.
children love to play in the park in the afternoon.
the blue sea and clear sky make people feel calm.
mother cooks a pot of sour soup for the whole family.
students do their homework diligently every evening.
the dog wags its tail happily when its owner comes home.
a sudden rain shower falls on the city at noon.
the stars twinkle in the quiet night sky.
grandma tells her grandchild a lovely fairy tale.
the wind blows gently across the golden rice field.
i love reading books by the window on a rainy day.
the sun casts warm rays down upon the earth.
`,
};

function tokenize(text) {
  return text.toLowerCase().replace(/\n/g, " ").replace(/[.,]/g, " . ")
    .split(/\s+/).filter(Boolean);
}

function buildModel(tokens) {
  const bi = {}, tri = {};
  for (let i = 0; i < tokens.length - 1; i++) {
    const w = tokens[i], nx = tokens[i + 1];
    (bi[w] ||= {});
    bi[w][nx] = (bi[w][nx] || 0) + 1;
    if (i > 0) {
      const key = tokens[i - 1] + " " + w;
      (tri[key] ||= {});
      tri[key][nx] = (tri[key][nx] || 0) + 1;
    }
  }
  return { bi, tri };
}

// Phân phối xác suất cho từ tiếp theo (bỏ token "." cho gọn game), có áp dụng nhiệt độ.
function distribution(model, context, temp) {
  const words = context.trim().split(/\s+/);
  const last = words[words.length - 1];
  const prev = words[words.length - 2];
  let table = (prev && model.tri[prev + " " + last]) || model.bi[last];
  if (!table) return [];
  let entries = Object.entries(table).filter(([w]) => w !== ".");
  if (!entries.length) return [];
  const t = Math.max(0.05, temp);
  const logits = entries.map(([w, c]) => [w, Math.log(c) / t]);
  const max = Math.max(...logits.map((e) => e[1]));
  const exps = logits.map(([w, l]) => [w, Math.exp(l - max)]);
  const sum = exps.reduce((s, e) => s + e[1], 0);
  return exps.map(([w, e]) => [w, e / sum]).sort((a, b) => b[1] - a[1]);
}

function sampleFrom(probs) {
  const r = Math.random();
  let acc = 0;
  for (const [w, p] of probs) { acc += p; if (r <= acc) return w; }
  return probs[probs.length - 1]?.[0];
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Độ khó: số ô đáp án, thời gian mỗi lượt (ms), nhiệt độ AI (cao = AI hay đổ xúc xắc).
const DIFF = {
  chill:  { chips: 4, time: 9000, temp: 0.5, label: { vi: "😌 Thư giãn", en: "😌 Chill" } },
  normal: { chips: 5, time: 7000, temp: 0.9, label: { vi: "🙂 Thường",  en: "🙂 Normal" } },
  chaos:  { chips: 6, time: 5000, temp: 1.6, label: { vi: "🤪 Hỗn loạn", en: "🤪 Chaos" } },
};

// Lời thoại của mascot (bốc ngẫu nhiên).
const BOT = {
  intro: { vi: "Xin chào! Tôi là Bit 🤖. Tôi đoán từ tiếp theo để viết câu. Xem bạn có <b>đọc vị</b> được tôi không nhé!", en: "Hey! I'm Bit 🤖. I write by guessing the next word. Let's see if you can <b>read my mind</b>!" },
  good: {
    vi: ["Chuẩn! Bạn nghĩ y như tôi 🤝", "Đúng bài! 🔥", "Cao thủ đây rồi 😎", "Bạn đọc vị tôi ngon ghê!"],
    en: ["Nailed it! Same as me 🤝", "Spot on! 🔥", "Show-off 😎", "You read me like a book!"],
  },
  bad: {
    vi: ["Hụt rồi! Tôi khoái từ khác cơ 😜", "Sai tí xíu — nhìn thanh xác suất nhé 👀", "Ố ồ, không phải từ đó đâu!", "Tôi bất ngờ hơn bạn tưởng 😏"],
    en: ["Missed! I liked another word 😜", "Almost — check the bars 👀", "Nope, not that one!", "I'm less predictable than you think 😏"],
  },
  dice: {
    vi: ["🎲 Tôi vừa đổ xúc xắc và chọn từ khác — đó là 'nhiệt độ' cao đấy!", "🎲 Xác suất cao nhất không phải lúc nào tôi cũng chọn — nhiệt độ mà!"],
    en: ["🎲 I rolled the dice and picked another word — that's high 'temperature'!", "🎲 I don't always pick the top word — blame the temperature!"],
  },
  streak: { vi: "🔥 Chuỗi %s! Bạn đang đọc vị cỗ máy đấy!", en: "🔥 Streak %s! You're reading the machine!" },
  timeout: { vi: "⏰ Hết giờ! Tôi đi tiếp đây.", en: "⏰ Time! I'll move on." },
};

const UI = {
  intro: {
    vi: "AI viết câu bằng cách <strong>đoán từ tiếp theo</strong>, hết từ này tới từ khác. Giờ tới lượt bạn: <strong>đoán xem AI sẽ chọn từ nào</strong> để nối câu. Đoán trúng thì ghi điểm — nhanh và đúng liên tục thì điểm càng cao!",
    en: "AI writes by <strong>guessing the next word</strong>, over and over. Your turn: <strong>guess which word the AI will pick</strong> to continue the sentence. Guess right to score — fast and consistent means more points!",
  },
  diff: { vi: "Độ khó:", en: "Difficulty:" },
  start: { vi: "▶ Chơi", en: "▶ Play" },
  again: { vi: "↺ Chơi lại", en: "↺ Play again" },
  score: { vi: "Điểm", en: "Score" },
  streak: { vi: "Chuỗi", en: "Streak" },
  best: { vi: "Kỷ lục", en: "Best" },
  guessPrompt: { vi: "AI sẽ chọn từ nào tiếp theo?", en: "Which word will the AI pick next?" },
  aiPicks: { vi: "Xác suất của AI cho từ tiếp theo:", en: "The AI's probabilities for the next word:" },
  youPicked: { vi: "bạn chọn", en: "you" },
  over: { vi: "Hết lượt!", en: "Game over!" },
  overSub: {
    vi: "Bạn vừa chơi với mô hình <b>trigram theo từ</b> trên một corpus nhỏ. LLM thật dự đoán token từ ngữ cảnh phong phú hơn nhiều. Nhiệt độ cao làm mẫu đa dạng hơn và đôi khi tăng lỗi, nhưng không phải nguyên nhân duy nhất của ảo giác.",
    en: "You just used a <b>word-level trigram</b> over a tiny corpus. Real LLMs predict tokens from much richer context. Higher temperature increases sampling diversity and can increase errors, but it is not the sole cause of hallucination.",
  },
  newRecord: { vi: "🏆 Kỷ lục mới!", en: "🏆 New record!" },
  finalScore: { vi: "Điểm của bạn", en: "Your score" },
};

export function roomNextToken(root) {
  const lang = getLang();
  const MODEL = buildModel(tokenize(CORPUS[lang]));
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // Các cặp từ mở đầu câu (lấy 2 từ đầu mỗi dòng corpus) để bắt đầu câu mới.
  const STARTS = CORPUS[lang].trim().split("\n")
    .map((line) => tokenize(line).slice(0, 2)).filter((s) => s.length === 2);
  const VOCAB = [...new Set(tokenize(CORPUS[lang]).filter((w) => w !== "."))];

  let diff = "normal";
  let score = 0, streak = 0, lives = 3, playing = false;
  let context = [];
  let raf = null, roundStart = 0, roundDur = 0, locked = false;

  root.innerHTML = `
    <p class="room-intro">${tx(UI.intro)}</p>

    <div class="nt-mascot">
      <div class="nt-bot" id="ntBot">🤖</div>
      <div class="nt-bubble" id="ntBubble">${tx(BOT.intro)}</div>
    </div>

    <div class="panel nt-stage">
      <div class="nt-hud">
        <div class="nt-stat"><span>${tx(UI.score)}</span><b id="ntScore">0</b></div>
        <div class="nt-stat"><span>${tx(UI.streak)}</span><b id="ntStreak">0</b></div>
        <div class="nt-stat"><span>${tx(UI.best)}</span><b id="ntBest">0</b></div>
        <div class="nt-hearts" id="ntHearts"></div>
      </div>

      <div id="ntSetup" class="nt-setup">
        <div class="nt-diff" id="ntDiff"></div>
        <button class="btn nt-play" id="ntPlay">${tx(UI.start)}</button>
      </div>

      <div id="ntGame" class="nt-game" hidden>
        <div class="nt-timer"><div class="nt-timer-fill" id="ntTimer"></div></div>
        <div class="nt-sentence" id="ntSentence"></div>
        <p class="muted nt-q">${tx(UI.guessPrompt)}</p>
        <div class="nt-chips" id="ntChips"></div>
        <div class="nt-reveal" id="ntReveal"></div>
      </div>

      <div id="ntOver" class="nt-over" hidden></div>
    </div>

    <div class="takeaway">
      ${tx(
        "💡 <strong>Điều cốt lõi:</strong> Mô hình ngôn ngữ sinh token theo phân phối xác suất; điều đó tạo độ trôi chảy nhưng không tự bảo đảm tính đúng. Ảo giác không chỉ do sampling hay nhiệt độ: dữ liệu, mục tiêu huấn luyện, ngữ cảnh và việc thiếu kiểm chứng đều có thể góp phần. Game này chỉ là trigram theo từ.",
        "💡 <strong>Key idea:</strong> Language models generate tokens from probability distributions; this enables fluency but does not ensure factuality. Hallucinations are not caused only by sampling or temperature—data, objectives, context, and missing verification can all contribute. This game is only a word-level trigram."
      )}
    </div>
  `;

  const $ = (s) => root.querySelector(s);
  const botEl = $("#ntBot"), bubbleEl = $("#ntBubble");
  const scoreEl = $("#ntScore"), streakEl = $("#ntStreak"), bestEl = $("#ntBest"), heartsEl = $("#ntHearts");
  const setupEl = $("#ntSetup"), gameEl = $("#ntGame"), overEl = $("#ntOver");
  const diffEl = $("#ntDiff"), timerEl = $("#ntTimer");
  const sentenceEl = $("#ntSentence"), chipsEl = $("#ntChips"), revealEl = $("#ntReveal");

  bestEl.textContent = getRoomStat("next-token", "bestScore", 0);

  // ----- Mascot -----
  function say(msg, mood = "") {
    bubbleEl.innerHTML = msg;
    if (!reduce) {
      botEl.classList.remove("bot-happy", "bot-sad", "bot-bounce");
      void botEl.offsetWidth;
      botEl.classList.add(mood === "happy" ? "bot-happy" : mood === "sad" ? "bot-sad" : "bot-bounce");
    }
  }
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  // ----- Nút độ khó -----
  Object.entries(DIFF).forEach(([key, d]) => {
    const b = document.createElement("button");
    b.className = "btn ghost nt-diff-btn" + (key === diff ? " active" : "");
    b.textContent = tx(d.label);
    b.onclick = () => {
      diff = key;
      diffEl.querySelectorAll(".nt-diff-btn").forEach((el) => el.classList.remove("active"));
      b.classList.add("active");
      sfx.click();
    };
    diffEl.appendChild(b);
  });

  function renderHearts() {
    heartsEl.innerHTML = "";
    for (let i = 0; i < 3; i++) {
      const h = document.createElement("span");
      h.className = "nt-heart" + (i >= lives ? " lost" : "");
      h.textContent = i < lives ? "❤️" : "🤍";
      heartsEl.appendChild(h);
    }
  }

  function updateHUD() {
    scoreEl.textContent = score;
    streakEl.textContent = streak;
    renderHearts();
  }

  // Đếm số điểm nhảy dần cho "đã" mắt.
  function bumpScore(add) {
    const target = score + add;
    const from = score;
    score = target;
    if (reduce) { scoreEl.textContent = target; return; }
    const t0 = performance.now();
    const anim = (t) => {
      const k = Math.min(1, (t - t0) / 400);
      scoreEl.textContent = Math.round(from + (target - from) * k);
      if (k < 1) requestAnimationFrame(anim);
    };
    requestAnimationFrame(anim);
  }

  // ----- Vòng đời game -----
  function newSentence() {
    context = [...pick(STARTS)];
  }

  function renderSentence(highlightLast) {
    sentenceEl.innerHTML = context.map((w, i) => {
      const isLast = highlightLast && i === context.length - 1;
      return `<span class="nt-tok${isLast ? " nt-tok-new" : ""}">${w}</span>`;
    }).join(" ");
  }

  function startTimer() {
    roundStart = performance.now();
    roundDur = DIFF[diff].time;
    const step = (t) => {
      const remain = Math.max(0, roundDur - (t - roundStart));
      timerEl.style.width = (remain / roundDur * 100) + "%";
      timerEl.classList.toggle("low", remain < roundDur * 0.33);
      if (remain <= 0) { onTimeout(); return; }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }
  function stopTimer() { if (raf) cancelAnimationFrame(raf); raf = null; }
  const remainSec = () => Math.max(0, (roundDur - (performance.now() - roundStart)) / 1000);

  function newRound() {
    locked = false;
    revealEl.innerHTML = "";
    revealEl.classList.remove("show");
    // Đảm bảo ngữ cảnh hiện tại có đường đoán; nếu bí thì bắt đầu câu mới.
    let entries = distribution(MODEL, context.join(" "), DIFF[diff].temp);
    let guard = 0;
    while (entries.length < 2 && guard++ < 6) { newSentence(); entries = distribution(MODEL, context.join(" "), DIFF[diff].temp); }
    renderSentence(true);

    const n = DIFF[diff].chips;
    const top = entries[0][0];
    const rest = shuffle(entries.slice(1).map((e) => e[0]));
    let chips = [top, ...rest.slice(0, n - 1)];
    while (chips.length < n) {
      const w = VOCAB[(Math.random() * VOCAB.length) | 0];
      if (!chips.includes(w)) chips.push(w);
    }
    shuffle(chips);

    chipsEl.innerHTML = "";
    chips.forEach((w) => {
      const c = document.createElement("button");
      c.className = "nt-chip";
      c.textContent = w;
      c.onclick = () => onPick(w, c, entries, top);
      chipsEl.appendChild(c);
    });
    startTimer();
  }

  function reveal(entries, argmax, aiPick, userPick) {
    revealEl.classList.add("show");
    revealEl.innerHTML = `<p class="muted nt-reveal-h">${tx(UI.aiPicks)}</p>`;
    const topP = entries[0][1];
    entries.slice(0, 5).forEach(([w, p]) => {
      const tags = [];
      if (w === argmax) tags.push("🥇");
      if (w === aiPick && aiPick !== argmax) tags.push("🎲");
      if (w === userPick) tags.push(`<span class="nt-you">${tx(UI.youPicked)}</span>`);
      const row = document.createElement("div");
      row.className = "bar-row";
      const hot = w === userPick;
      row.innerHTML = `
        <div class="bar-label">${w} ${tags.join(" ")}</div>
        <div class="bar-track"><div class="bar-fill${hot ? " nt-hot" : ""}" style="width:${Math.max(6, p / topP * 100)}%">${Math.round(p * 100)}%</div></div>`;
      revealEl.appendChild(row);
    });
  }

  function onPick(word, chipEl, entries, argmax) {
    if (locked) return;
    locked = true;
    stopTimer();
    const bonus = Math.round(remainSec()) * 10;
    const aiPick = sampleFrom(entries); // AI thực sự chọn (có thể khác argmax khi nhiệt độ cao)
    const correct = word === argmax;

    chipsEl.querySelectorAll(".nt-chip").forEach((el) => {
      el.disabled = true;
      if (el.textContent === argmax) el.classList.add("correct");
    });

    if (correct) {
      const gained = 100 + streak * 20 + bonus;
      streak++;
      bumpScore(gained);
      chipEl.classList.add("pop");
      sfx.success();
      if (streak > 0 && streak % 3 === 0) {
        if (!reduce) celebrate();
        say(tx(BOT.streak).replace("%s", streak), "happy");
      } else {
        say(pick(BOT.good[lang]) + ` <b>+${gained}</b>`, "happy");
      }
    } else {
      chipEl.classList.add("wrong");
      streak = 0;
      lives--;
      sfx.wrong();
      if (!reduce) { gameEl.classList.remove("shake"); void gameEl.offsetWidth; gameEl.classList.add("shake"); }
      say(aiPick !== argmax ? pick(BOT.dice[lang]) : pick(BOT.bad[lang]), "sad");
    }
    updateHUD();
    reveal(entries, argmax, aiPick, word);

    // Câu tiếp tục bằng từ AI THỰC SỰ chọn (cho thấy vì sao câu "trôi" & ảo giác).
    context.push(aiPick);

    setTimeout(() => {
      if (lives <= 0) endGame();
      else newRound();
    }, correct ? 1100 : 1700);
  }

  function onTimeout() {
    if (locked) return;
    locked = true;
    stopTimer();
    streak = 0;
    lives--;
    sfx.wrong();
    say(tx(BOT.timeout), "sad");
    const entries = distribution(MODEL, context.join(" "), DIFF[diff].temp);
    chipsEl.querySelectorAll(".nt-chip").forEach((el) => {
      el.disabled = true;
      if (el.textContent === entries[0]?.[0]) el.classList.add("correct");
    });
    updateHUD();
    if (entries.length) reveal(entries, entries[0][0], sampleFrom(entries), null);
    if (entries.length) context.push(sampleFrom(entries));
    setTimeout(() => { if (lives <= 0) endGame(); else newRound(); }, 1600);
  }

  function startGame() {
    score = 0; streak = 0; lives = 3; playing = true;
    updateHUD();
    setupEl.hidden = true; overEl.hidden = true; gameEl.hidden = false;
    newSentence();
    newRound();
  }

  function endGame() {
    playing = false;
    stopTimer();
    gameEl.hidden = true;
    const record = setRoomStatMax("next-token", "bestScore", score);
    bestEl.textContent = getRoomStat("next-token", "bestScore", 0);
    if (record && !reduce) celebrate();
    say(tx({ vi: `Hết tim rồi! Điểm của bạn: <b>${score}</b>. Chơi lại nhé? 🤖`, en: `Out of hearts! Your score: <b>${score}</b>. Play again? 🤖` }), record ? "happy" : "sad");
    overEl.hidden = false;
    overEl.innerHTML = `
      <div class="nt-over-card">
        <div class="nt-over-title">${record ? tx(UI.newRecord) : tx(UI.over)}</div>
        <div class="nt-over-score">${tx(UI.finalScore)}: <b>${score}</b></div>
        <p class="muted">${tx(UI.overSub)}</p>
        <button class="btn nt-play" id="ntAgain">${tx(UI.again)}</button>
      </div>`;
    overEl.querySelector("#ntAgain").onclick = startGame;
  }

  $("#ntPlay").onclick = startGame;
  updateHUD();

  window.addEventListener("roomleave", stopTimer, { once: true });
}
