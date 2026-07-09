// Phòng — AI biết suy nghĩ từng bước (Chain-of-Thought / reasoning models). Song ngữ.
// Người dùng chọn một bài "bẫy", rồi so sánh: TRẢ LỜI NGAY (bốc đồng, dễ sai)
// với SUY NGHĨ TỪNG BƯỚC (lần lượt hiện các bước rồi ra đáp án đúng).
// Minh họa vì sao "cho model không gian để nghĩ" (chain-of-thought) đổi tốc độ/token
// lấy độ chính xác — đúng thứ các model "reasoning" (o1, DeepSeek-R1…) đang làm.
import { sfx } from "../sound.js";
import { tx } from "../i18n.js";
import { getParam, setParams } from "../roomstate.js";

// Mỗi bài: câu hỏi + đáp án bốc đồng (thường SAI) + chuỗi bước suy luận + đáp án đúng.
// fastTok/thinkTok = số token minh họa (nghĩ tốn nhiều token hơn nhiều).
const PROBLEMS = [
  {
    id: "strawberry",
    q: {
      vi: "Có bao nhiêu chữ <b>“r”</b> trong từ <b>“strawberry”</b>?",
      en: "How many <b>“r”</b> letters are in the word <b>“strawberry”</b>?",
    },
    fast: { vi: "2", en: "2" },
    fastNote: {
      vi: "Đoán nhanh theo “cảm giác” — kiểu sai kinh điển của model khi trả lời ngay.",
      en: "A quick gut guess — the classic mistake models make when answering instantly.",
    },
    steps: [
      { vi: "Đánh vần từng chữ: s · t · <b>r</b> · a · w · b · e · <b>r</b> · <b>r</b> · y", en: "Spell it out: s · t · <b>r</b> · a · w · b · e · <b>r</b> · <b>r</b> · y" },
      { vi: "Đánh dấu mỗi chữ “r”: một ở đầu (st<b>r</b>), hai ở gần cuối (be<b>rr</b>y).", en: "Mark each “r”: one early (st<b>r</b>), two near the end (be<b>rr</b>y)." },
      { vi: "Đếm các dấu: 1 + 2 = 3.", en: "Count the marks: 1 + 2 = 3." },
    ],
    answer: { vi: "3", en: "3" },
    fastTok: 1, thinkTok: 48,
  },
  {
    id: "penraser",
    q: {
      vi: "Một cây bút và một cục tẩy giá tổng cộng <b>11.000đ</b>. Cây bút đắt hơn cục tẩy <b>10.000đ</b>. Cục tẩy giá bao nhiêu?",
      en: "A pen and an eraser cost <b>$1.10</b> in total. The pen costs <b>$1.00</b> more than the eraser. How much is the eraser?",
    },
    fast: { vi: "1.000đ", en: "$0.10" },
    fastNote: {
      vi: "Trực giác “trừ đại” cho ra 1.000đ — nhưng thử lại: bút 10.000 + tẩy 1.000 = 11.000, mà bút chỉ đắt hơn 9.000đ. Sai!",
      en: "The gut “just subtract” gives $0.10 — but check it: pen $1.00 + ball $0.10 = $1.10, yet the pen is only $0.90 more. Wrong!",
    },
    steps: [
      { vi: "Gọi giá cục tẩy là <b>x</b>. Khi đó cây bút = <b>x + 10.000</b>.", en: "Let the eraser be <b>x</b>. Then the pen = <b>x + $1.00</b>." },
      { vi: "Tổng: x + (x + 10.000) = 11.000  →  2x + 10.000 = 11.000.", en: "Total: x + (x + $1.00) = $1.10  →  2x + $1.00 = $1.10." },
      { vi: "2x = 1.000  →  x = 500.", en: "2x = $0.10  →  x = $0.05." },
      { vi: "Kiểm lại: tẩy 500 + bút 10.500 = 11.000, và bút đắt hơn đúng 10.000. ✓", en: "Check: eraser $0.05 + pen $1.05 = $1.10, and the pen is exactly $1.00 more. ✓" },
    ],
    answer: { vi: "500đ", en: "$0.05" },
    fastTok: 3, thinkTok: 70,
  },
  {
    id: "weekday",
    q: {
      vi: "Hôm nay là <b>thứ Năm</b>. <b>100 ngày</b> nữa sẽ là thứ mấy?",
      en: "Today is <b>Thursday</b>. What day of the week is it in <b>100 days</b>?",
    },
    fast: { vi: "Chủ Nhật", en: "Sunday" },
    fastNote: {
      vi: "Đoán bừa một ngày cuối tuần cho “có vẻ đúng” — không hề tính toán.",
      en: "A hand-wavy weekend guess that “feels right” — with no actual calculation.",
    },
    steps: [
      { vi: "Thứ trong tuần lặp lại theo chu kỳ 7 ngày, nên chỉ cần phần dư của 100 chia 7.", en: "Weekdays repeat every 7 days, so we only need the remainder of 100 ÷ 7." },
      { vi: "100 ÷ 7 = 14 dư <b>2</b> (vì 14 × 7 = 98).", en: "100 ÷ 7 = 14 remainder <b>2</b> (since 14 × 7 = 98)." },
      { vi: "Cộng 2 ngày vào thứ Năm: Năm → Sáu → <b>Bảy</b>.", en: "Add 2 days to Thursday: Thu → Fri → <b>Sat</b>." },
    ],
    answer: { vi: "Thứ Bảy", en: "Saturday" },
    fastTok: 2, thinkTok: 55,
  },
];

const UI = {
  intro: {
    vi: "Bên trong, AI viết câu bằng cách đoán từ tiếp theo (xem phòng “Máy đoán chữ”). Nếu bắt nó <strong>trả lời ngay</strong>, nó thường buột ra đáp án nghe hợp lý mà <em>sai</em>. Nhưng nếu cho nó <strong>viết ra suy nghĩ từng bước</strong> trước khi kết luận, nó lý luận được và đúng hơn hẳn. Đây chính là <strong>chain-of-thought</strong> — và là ý tưởng cốt lõi của các model “biết suy nghĩ” (như o1, DeepSeek-R1). Hãy tự so sánh.",
    en: "Under the hood, AI writes by guessing the next word (see the “Word-guessing machine” room). Forced to <strong>answer instantly</strong>, it often blurts a plausible-sounding but <em>wrong</em> answer. But let it <strong>write out its thinking step by step</strong> first, and it reasons its way to the right answer. This is <strong>chain-of-thought</strong> — the core idea behind “thinking” models (like o1, DeepSeek-R1). Compare them yourself.",
  },
  pickTitle: { vi: "🧩 Chọn một bài “bẫy”", en: "🧩 Pick a tricky problem" },
  qTitle: { vi: "Câu hỏi", en: "The question" },
  fastBtn: { vi: "⚡ Trả lời ngay", en: "⚡ Answer instantly" },
  thinkBtn: { vi: "💭 Suy nghĩ từng bước", en: "💭 Think step by step" },
  fastHead: { vi: "⚡ Trả lời ngay", en: "⚡ Instant answer" },
  thinkHead: { vi: "💭 Chuỗi suy nghĩ", en: "💭 Chain of thought" },
  answerLabel: { vi: "Đáp án:", en: "Answer:" },
  thinking: { vi: "Đang nghĩ…", en: "Thinking…" },
  tokLabel: { vi: "token dùng để trả lời", en: "tokens used to answer" },
  reset: { vi: "↺ Làm lại", en: "↺ Reset" },
  waitFast: { vi: "Bấm “Trả lời ngay” để xem AI buột miệng.", en: "Click “Answer instantly” to see the AI blurt." },
  waitThink: { vi: "Bấm “Suy nghĩ từng bước” để xem AI lý luận.", en: "Click “Think step by step” to watch the AI reason." },
};

export function roomReasoning(root) {
  const startP = parseInt(getParam("p", ""), 10);
  let pIdx = Number.isInteger(startP) && PROBLEMS[startP] ? startP : 0;
  const timers = [];
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const clearTimers = () => { timers.forEach(clearTimeout); timers.length = 0; };
  // Dọn timer khi rời phòng (app.js phát sự kiện "roomleave").
  window.addEventListener("roomleave", clearTimers, { once: true });

  root.innerHTML = `
    <p class="room-intro">${tx(UI.intro)}</p>

    <div class="panel">
      <h4>${tx(UI.pickTitle)}</h4>
      <div id="rsPick" class="rs-pick"></div>
    </div>

    <div class="panel">
      <h4>${tx(UI.qTitle)}</h4>
      <div id="rsQ" class="rs-q"></div>
      <div class="rs-actions mt">
        <button class="btn ghost" id="rsFast">${tx(UI.fastBtn)}</button>
        <button class="btn" id="rsThink">${tx(UI.thinkBtn)}</button>
        <button class="btn ghost" id="rsReset">${tx(UI.reset)}</button>
      </div>
    </div>

    <div class="row">
      <div class="panel">
        <h4>${tx(UI.fastHead)}</h4>
        <div id="rsFastOut" class="rs-out muted">${tx(UI.waitFast)}</div>
      </div>
      <div class="panel">
        <h4>${tx(UI.thinkHead)}</h4>
        <div id="rsThinkOut" class="rs-out muted">${tx(UI.waitThink)}</div>
      </div>
    </div>

    <div class="takeaway">
      ${tx(
        "💡 <strong>Điều cốt lõi:</strong> AI không “thông minh hơn” khi suy nghĩ từng bước — nó chỉ có <strong>thêm không gian để tính</strong>. Mỗi bước viết ra trở thành ngữ cảnh cho bước sau, nên lời giải dựng dần thay vì đoán một phát. Cái giá là <strong>chậm hơn và tốn nhiều token hơn</strong>, nên ta chỉ cần “nghĩ kỹ” cho bài khó. Đó chính là điều các model reasoning làm tự động: nghĩ thầm thật dài trước khi chốt câu trả lời.",
        "💡 <strong>Key idea:</strong> An AI isn't “smarter” when it thinks step by step — it just gets <strong>more room to compute</strong>. Each written step becomes context for the next, so the solution builds up instead of being guessed in one shot. The cost is being <strong>slower and using far more tokens</strong>, so we only need to “think hard” on tough problems. That's exactly what reasoning models do automatically: think privately at length before committing to an answer."
      )}
    </div>
  `;

  const pickEl = root.querySelector("#rsPick");
  const qEl = root.querySelector("#rsQ");
  const fastOut = root.querySelector("#rsFastOut");
  const thinkOut = root.querySelector("#rsThinkOut");
  const fastBtn = root.querySelector("#rsFast");
  const thinkBtn = root.querySelector("#rsThink");

  PROBLEMS.forEach((p, i) => {
    const b = document.createElement("button");
    b.className = "btn ghost rs-tab" + (i === pIdx ? " active" : "");
    b.textContent = (i + 1) + ".";
    b.setAttribute("aria-label", tx(p.q).replace(/<[^>]+>/g, ""));
    b.onclick = () => { selectProblem(i); sfx.click(); };
    pickEl.appendChild(b);
  });

  function selectProblem(i) {
    pIdx = i;
    setParams({ p: i || null });
    clearTimers();
    [...pickEl.children].forEach((el, k) => el.classList.toggle("active", k === i));
    qEl.innerHTML = tx(PROBLEMS[i].q);
    fastOut.className = "rs-out muted";
    fastOut.innerHTML = tx(UI.waitFast);
    thinkOut.className = "rs-out muted";
    thinkOut.innerHTML = tx(UI.waitThink);
    fastBtn.disabled = false;
    thinkBtn.disabled = false;
  }

  function tokBadge(n) {
    return `<span class="rs-tok">≈ ${n} ${tx(UI.tokLabel)}</span>`;
  }

  fastBtn.onclick = () => {
    const p = PROBLEMS[pIdx];
    fastBtn.disabled = true;
    fastOut.className = "rs-out";
    fastOut.innerHTML = `
      <div class="rs-answer bad">${tx(UI.answerLabel)} <b>${tx(p.fast)}</b></div>
      <p class="muted rs-note">${tx(p.fastNote)}</p>
      ${tokBadge(p.fastTok)}`;
    sfx.wrong();
  };

  thinkBtn.onclick = () => {
    const p = PROBLEMS[pIdx];
    clearTimers();
    thinkBtn.disabled = true;
    thinkOut.className = "rs-out";
    thinkOut.innerHTML = `<ol class="rs-steps"></ol>`;
    const list = thinkOut.querySelector(".rs-steps");
    const stepDelay = reduce ? 0 : 700;

    p.steps.forEach((s, si) => {
      const reveal = () => {
        const li = document.createElement("li");
        li.className = "rs-step";
        li.innerHTML = tx(s);
        list.appendChild(li);
        sfx.tick();
      };
      if (stepDelay === 0) reveal();
      else timers.push(setTimeout(reveal, stepDelay * (si + 1)));
    });

    const finish = () => {
      const done = document.createElement("div");
      done.className = "rs-answer good mt";
      done.innerHTML = `${tx(UI.answerLabel)} <b>${tx(p.answer)}</b> ${tokBadge(p.thinkTok)}`;
      thinkOut.appendChild(done);
      sfx.success();
    };
    if (stepDelay === 0) finish();
    else timers.push(setTimeout(finish, stepDelay * (p.steps.length + 1)));
  };

  selectProblem(pIdx);
}
