// Phòng — Người hay AI viết? GAME "Thám tử AI": đọc đoạn văn, đoán người/AI, ghi điểm. Song ngữ.
import { sfx, celebrate } from "../sound.js";
import { tx } from "../i18n.js";
import { getRoomStat, setRoomStatMax } from "../store.js";

// Mỗi đoạn: text + nguồn thật (human/ai) + lời giải thích.
const POOL = [
  { text: { vi: "Trời hôm nay đẹp ghê, tự nhiên thèm một ly cà phê sữa đá rồi ngồi nhìn người ta qua lại.", en: "Gorgeous weather today, suddenly craving an iced milk coffee and just watching people go by." }, src: "human", why: { vi: "Giọng đời thường, cảm xúc vụn vặt, cụ thể — kiểu người.", en: "Casual, small specific feelings — human." } },
  { text: { vi: "Cà phê là một thức uống phổ biến, mang lại nhiều lợi ích và được nhiều người trên khắp thế giới yêu thích mỗi ngày.", en: "Coffee is a popular beverage that offers many benefits and is enjoyed by many people around the world every day." }, src: "ai", why: { vi: "Câu tổng quát, trung tính, hơi sáo — đặc trưng văn AI.", en: "Generic, neutral, slightly bland — typical AI." } },
  { text: { vi: "Ừ thì mình cũng không chắc lắm, nhưng chắc do hôm qua ngủ trễ nên nay đầu óc cứ lơ mơ á.", en: "Eh, I'm not totally sure, but probably 'cause I slept late so my head's all foggy today." }, src: "human", why: { vi: "Ngập ngừng, khẩu ngữ, lý do cá nhân lộn xộn — rất người.", en: "Hesitant, colloquial, messy reasoning — very human." } },
  { text: { vi: "Có nhiều yếu tố có thể ảnh hưởng đến giấc ngủ, bao gồm ánh sáng, nhiệt độ, và thói quen sinh hoạt hằng ngày.", en: "Several factors can affect your sleep, including light, temperature, and daily habits." }, src: "ai", why: { vi: "Liệt kê gọn gàng, giọng \"trợ lý\", không có cái tôi — kiểu AI.", en: "Tidy list, \"assistant\" tone, no personal voice — AI-like." } },
  { text: { vi: "Khum có gì đâu mà, tại bồ hỏi nên tui nói vậy thôi chứ tui cũng gà lắm 😅", en: "Nah it's nothing, I only said it 'cause you asked, honestly I'm pretty clueless too 😅" }, src: "human", why: { vi: "Tiếng lóng, sai chính tả cố ý, emoji, khiêm tốn thật — dấu hiệu người.", en: "Slang, playful typos, emoji, genuine modesty — human." } },
  { text: { vi: "Tóm lại, việc duy trì một lối sống cân bằng là chìa khóa quan trọng để đạt được sức khỏe và hạnh phúc lâu dài.", en: "In conclusion, maintaining a balanced lifestyle is a key factor in achieving long-term health and happiness." }, src: "ai", why: { vi: "Mở đầu \"Tóm lại\", kết luận tròn trịa, sáo mòn — kiểu AI.", en: "Opens with \"In conclusion\", neat generic wrap-up — AI-like." } },
  { text: { vi: "trời ơi cái deadline này làm t muốn xỉu, mà thôi kệ mai tính, giờ đi ăn cái đã 🍜", en: "omg this deadline makes me wanna faint, whatever i'll deal tmr, food first 🍜" }, src: "human", why: { vi: "Viết tắt, cảm thán, quyết định bốc đồng đời thường — người.", en: "Abbreviations, exclamations, impulsive everyday decision — human." } },
  { text: { vi: "Dưới đây là ba mẹo hữu ích giúp bạn cải thiện năng suất: lập kế hoạch, nghỉ ngơi hợp lý, và tập trung vào ưu tiên.", en: "Here are three helpful tips to boost your productivity: plan ahead, rest well, and focus on priorities." }, src: "ai", why: { vi: "\"Dưới đây là ba mẹo…\" — khung liệt kê rất quen của AI.", en: "\"Here are three tips…\" — a very familiar AI list frame." } },
  { text: { vi: "Hồi nhỏ bà hay nấu chè đậu xanh, mùi lá dứa thơm cả gian bếp, giờ ngửi thấy là nhớ bà ghê.", en: "Grandma used to cook mung bean sweet soup; the pandan smell filled the kitchen — I miss her whenever I smell it." }, src: "human", why: { vi: "Ký ức riêng, chi tiết giác quan cụ thể, cảm xúc thật — người.", en: "Personal memory, specific sensory detail, real emotion — human." } },
  { text: { vi: "Trí tuệ nhân tạo là một lĩnh vực đầy tiềm năng, có khả năng mang lại nhiều thay đổi tích cực cho xã hội trong tương lai.", en: "Artificial intelligence is a promising field with the potential to bring many positive changes to society in the future." }, src: "ai", why: { vi: "Lạc quan chung chung, không dẫn chứng, giọng trung tính — AI.", en: "Vague optimism, no specifics, neutral tone — AI." } },
];

const BOT = {
  intro: { vi: "Tôi là Thám tử Tơ 🕵️. AI viết ngày càng giống người — nhưng vẫn có sơ hở. Đọc từng đoạn và <b>vạch mặt</b>: người hay AI? Đoán đúng liên tiếp để lên điểm!", en: "I'm Detective Turi 🕵️. AI writes more like us every day — but there are tells. Read each passage and <b>call it</b>: human or AI? Chain correct calls to score!" },
  good: { vi: ["🎯 Vạch mặt chuẩn!", "Con mắt tinh đấy! 🔍", "Đúng phóc 👏"], en: ["🎯 Nailed the call!", "Sharp eye! 🔍", "Spot on 👏"] },
  bad: { vi: ["Hụt rồi, tinh vi thật!", "Bị lừa kìa 😮 — đọc kỹ giọng văn nhé.", "Sai mất rồi!"], en: ["Missed — sneaky one!", "Got fooled 😮 — read the voice closely.", "Wrong this time!"] },
  streak: { vi: "🔥 Chuỗi %s! Thám tử thứ thiệt 🕵️", en: "🔥 Streak %s! A true detective 🕵️" },
  timeout: { vi: "⏰ Hết giờ! Tin vào trực giác nhanh hơn nào.", en: "⏰ Time! Trust your gut faster." },
};

const ROUND_TIME = 13000;
const UI = {
  intro: { vi: "AI viết trơn tru đến mức khó phân biệt với người — nhưng vẫn có dấu hiệu. <strong>Nhiệm vụ:</strong> đọc từng đoạn và đoán do <strong>người hay AI</strong> viết. Đoán đúng để ghi điểm, sai thì mất một mạng!", en: "AI writes so smoothly it's hard to tell from a human — but there are tells. <strong>Your job:</strong> read each passage and guess <strong>human or AI</strong>. Right scores, wrong costs a life!" },
  score: { vi: "Điểm", en: "Score" }, streak: { vi: "Chuỗi", en: "Streak" }, best: { vi: "Kỷ lục", en: "Best" },
  start: { vi: "▶ Vào cuộc", en: "▶ Start" }, again: { vi: "↺ Chơi lại", en: "↺ Play again" },
  human: { vi: "🧑 Con người", en: "🧑 A human" }, ai: { vi: "🤖 AI", en: "🤖 AI" },
  writtenHuman: { vi: "Con người viết", en: "Written by a human" }, writtenAI: { vi: "AI viết", en: "Written by AI" },
  over: { vi: "Hết lượt!", en: "Game over!" },
  overSub: { vi: "Văn AI thường trơn tru, trung lập, đầy đủ nhưng thiếu \"cái tôi\" và chi tiết đời thường lộn xộn. Đừng tin ngay chỉ vì một đoạn nghe mượt và tự tin — AI rất giỏi việc đó.", en: "AI writing is often smooth, neutral and complete but lacks a personal voice and messy real-life detail. Don't trust text just because it's fluent and confident — AI is very good at that." },
  newRecord: { vi: "🏆 Kỷ lục mới!", en: "🏆 New record!" }, finalScore: { vi: "Điểm của bạn", en: "Your score" },
};

export function roomTuring(root) {
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  let score = 0, streak = 0, lives = 3, playing = false, locked = false;
  let queue = [], current = null, raf = null, roundStart = 0;

  root.innerHTML = `
    <p class="room-intro">${tx(UI.intro)}</p>
    <div class="g-mascot"><div class="g-bot" id="tuBot">🕵️</div><div class="g-bubble" id="tuBubble">${tx(BOT.intro)}</div></div>

    <div class="panel">
      <div class="g-hud">
        <div class="g-stat"><span>${tx(UI.score)}</span><b id="tuScore">0</b></div>
        <div class="g-stat"><span>${tx(UI.streak)}</span><b id="tuStreak">0</b></div>
        <div class="g-stat"><span>${tx(UI.best)}</span><b id="tuBest">0</b></div>
        <div class="g-hearts" id="tuHearts"></div>
      </div>

      <div id="tuSetup" style="text-align:center; padding:10px 0;">
        <button class="btn g-play" id="tuPlay">${tx(UI.start)}</button>
      </div>

      <div id="tuGame" hidden>
        <div class="g-timer"><div class="g-timer-fill" id="tuTimer"></div></div>
        <blockquote class="tu-quote" id="tuQuote"></blockquote>
        <div class="row mt">
          <button class="btn" id="tuHuman">${tx(UI.human)}</button>
          <button class="btn ghost" id="tuAI">${tx(UI.ai)}</button>
        </div>
        <div id="tuFb" class="mt"></div>
      </div>

      <div id="tuOver" hidden class="g-over"></div>
    </div>

    <div class="takeaway">${tx(
      "💡 <strong>Điều cốt lõi:</strong> Văn AI thường trơn tru, trung lập, đầy đủ nhưng thiếu \"cái tôi\" và chi tiết đời thường. Nhận ra điều này giúp bạn tỉnh táo — đừng tin chỉ vì nghe mượt.",
      "💡 <strong>Key idea:</strong> AI writing is often smooth, neutral, complete but lacks a personal voice and everyday detail. Spotting this keeps you sharp — don't trust text just because it's fluent."
    )}</div>
  `;

  const $ = (s) => root.querySelector(s);
  const botEl = $("#tuBot"), bubbleEl = $("#tuBubble");
  const scoreEl = $("#tuScore"), streakEl = $("#tuStreak"), bestEl = $("#tuBest"), heartsEl = $("#tuHearts");
  const setupEl = $("#tuSetup"), gameEl = $("#tuGame"), overEl = $("#tuOver");
  const timerEl = $("#tuTimer"), quoteEl = $("#tuQuote"), fbEl = $("#tuFb");
  const humanBtn = $("#tuHuman"), aiBtn = $("#tuAI");

  bestEl.textContent = getRoomStat("turing", "bestScore", 0);
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
  const remainSec = () => Math.max(0, (ROUND_TIME - (performance.now() - roundStart)) / 1000);

  function nextQueue() {
    if (!queue.length) queue = [...POOL].sort(() => Math.random() - 0.5);
    return queue.pop();
  }

  function newRound() {
    locked = false;
    current = nextQueue();
    quoteEl.textContent = "“" + tx(current.text) + "”";
    fbEl.innerHTML = "";
    humanBtn.disabled = false; aiBtn.disabled = false;
    startTimer();
  }

  function resolve(guess) {
    if (locked || !playing) return;
    locked = true;
    stopTimer();
    humanBtn.disabled = true; aiBtn.disabled = true;
    const correct = guess === current.src;
    const bonus = Math.round(remainSec()) * 8;
    const answer = current.src === "human" ? tx(UI.writtenHuman) : tx(UI.writtenAI);

    if (correct) {
      const gained = 100 + streak * 20 + bonus;
      score += gained; streak++;
      sfx.success();
      if (streak % 3 === 0) { if (!reduce) celebrate(); say(tx(BOT.streak).replace("%s", streak), "happy"); }
      else say(pickArr(BOT.good[langKey()]) + ` <b>+${gained}</b>`, "happy");
    } else {
      streak = 0; lives--;
      sfx.wrong();
      if (!reduce) { gameEl.classList.remove("shake"); void gameEl.offsetWidth; gameEl.classList.add("shake"); }
      say(pickArr(BOT.bad[langKey()]), "sad");
    }
    updateHUD();
    fbEl.innerHTML = `<div class="takeaway" style="margin:0">${correct ? "✅ " + tx("Chính xác! ", "Correct! ") : "❌ " + tx("Chưa đúng. ", "Not quite. ")}<b>${answer}.</b> ${tx(current.why)}</div>`;
    setTimeout(() => { if (lives <= 0) endGame(); else newRound(); }, correct ? 1600 : 2300);
  }

  function onTimeout() {
    if (locked) return;
    locked = true; stopTimer();
    humanBtn.disabled = true; aiBtn.disabled = true;
    streak = 0; lives--;
    sfx.wrong();
    say(tx(BOT.timeout), "sad");
    updateHUD();
    const answer = current.src === "human" ? tx(UI.writtenHuman) : tx(UI.writtenAI);
    fbEl.innerHTML = `<div class="takeaway" style="margin:0"><b>${answer}.</b> ${tx(current.why)}</div>`;
    setTimeout(() => { if (lives <= 0) endGame(); else newRound(); }, 2000);
  }

  function startGame() {
    score = 0; streak = 0; lives = 3; playing = true; queue = [];
    updateHUD();
    setupEl.hidden = true; overEl.hidden = true; gameEl.hidden = false;
    newRound();
  }

  function endGame() {
    playing = false; stopTimer(); gameEl.hidden = true;
    const record = setRoomStatMax("turing", "bestScore", score);
    bestEl.textContent = getRoomStat("turing", "bestScore", 0);
    if (record && !reduce) celebrate();
    say(tx({ vi: `Hết lượt! Điểm: <b>${score}</b>. Điều tra lại nhé? 🕵️`, en: `Game over! Score: <b>${score}</b>. Reopen the case? 🕵️` }), record ? "happy" : "sad");
    overEl.hidden = false;
    overEl.innerHTML = `
      <div class="g-over-card">
        <div class="g-over-title">${record ? tx(UI.newRecord) : tx(UI.over)}</div>
        <div class="g-over-score">${tx(UI.finalScore)}: <b>${score}</b></div>
        <p class="muted">${tx(UI.overSub)}</p>
        <button class="btn g-play" id="tuAgain">${tx(UI.again)}</button>
      </div>`;
    overEl.querySelector("#tuAgain").onclick = startGame;
  }

  humanBtn.onclick = () => resolve("human");
  aiBtn.onclick = () => resolve("ai");
  $("#tuPlay").onclick = startGame;
  updateHUD();

  window.addEventListener("roomleave", stopTimer, { once: true });
}
