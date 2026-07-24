// Phòng — RLHF: AI học "cư xử" từ phản hồi con người. Song ngữ.
// Người dùng đóng vai người chấm: với mỗi câu hỏi, chọn câu trả lời nào tốt hơn.
// Qua vài vòng, "mô hình thưởng" học được gu, và AI sau huấn luyện trả lời hợp ý hơn.
import { sfx } from "../sound.js";
import { tx, getLang } from "../i18n.js";
import { getParam, setParams } from "../roomstate.js";

// Mỗi cặp: một câu "thô" (mô hình gốc: cộc lốc / lan man / né tránh) và một câu
// "hợp gu người" (hữu ích, rõ ràng, lịch sự). good = chỉ số câu con người thường thích.
const PAIRS = {
  vi: [
    {
      prompt: "Giải thích giúp mình 'mưa axit' là gì với.",
      answers: [
        "Mưa axit là mưa có độ pH thấp do khí SO₂ và NOx từ đốt nhiên liệu hòa vào nước mưa. Nó hại cây, cá và ăn mòn công trình. Bạn muốn mình nói thêm về cách giảm nó không?",
        "Là mưa bị axit. Tự tra thêm đi.",
      ],
      good: 0,
    },
    {
      prompt: "Mình buồn quá, hôm nay mọi thứ đều tệ.",
      answers: [
        "Buồn là chuyện thường mà, mai lại ổn thôi.",
        "Nghe bạn nói vậy mình rất tiếc. Có chuyện gì cụ thể khiến hôm nay nặng nề vậy không? Mình sẵn sàng nghe.",
      ],
      good: 1,
    },
    {
      prompt: "Viết một câu chúc sinh nhật ngắn cho bạn thân.",
      answers: [
        "Chúc mừng sinh nhật cậu! Mong năm mới của cậu đầy tiếng cười, sức khỏe và những chuyến đi vui. 🎂",
        "sinh nhật vui vẻ.",
      ],
      good: 0,
    },
    {
      prompt: "Làm sao để học lập trình nhanh nhất?",
      answers: [
        "Không có đường tắt. Nhưng hiệu quả nhất là: chọn một ngôn ngữ, làm dự án nhỏ thật sự mỗi tuần, và đọc code người khác. Bạn muốn mình gợi ý dự án cho người mới không?",
        "Học 24/7 là nhanh nhất. Hoặc mua khóa học đắt tiền nào đó.",
      ],
      good: 0,
    },
  ],
  en: [
    {
      prompt: "Can you explain what 'acid rain' is?",
      answers: [
        "Acid rain is rain with low pH, caused by SO₂ and NOx from burning fuel dissolving into rainwater. It harms plants, fish, and corrodes buildings. Want me to add how we reduce it?",
        "It's rain that's acidic. Go look it up yourself.",
      ],
      good: 0,
    },
    {
      prompt: "I'm feeling really down, everything went wrong today.",
      answers: [
        "Being sad is normal, you'll be fine tomorrow.",
        "I'm really sorry to hear that. Is there something specific that made today so heavy? I'm here to listen.",
      ],
      good: 1,
    },
    {
      prompt: "Write a short birthday wish for a close friend.",
      answers: [
        "Happy birthday! May your year be full of laughter, good health, and fun trips together. 🎂",
        "happy bday.",
      ],
      good: 0,
    },
    {
      prompt: "What's the fastest way to learn to code?",
      answers: [
        "There's no shortcut. But the most effective path: pick one language, build a small real project weekly, and read others' code. Want me to suggest beginner projects?",
        "Study 24/7, that's fastest. Or just buy some expensive course.",
      ],
      good: 0,
    },
  ],
};

const UI = {
  intro: {
    vi: "Một mô hình ngôn ngữ 'thô' (chỉ mới học đoán chữ) biết rất nhiều, nhưng chưa biết <em>nên</em> trả lời thế nào cho <strong>hữu ích và tử tế</strong>. <strong>RLHF</strong> (học tăng cường từ phản hồi con người) dạy nó điều đó: người ta cho AI ra <em>nhiều câu trả lời</em>, con người <strong>chấm câu nào tốt hơn</strong>, và AI học theo gu đó. Bạn hãy làm người chấm bên dưới.",
    en: "A 'raw' language model (fresh from just learning to predict text) knows a lot, but not <em>how</em> it <strong>should</strong> answer to be <strong>helpful and kind</strong>. <strong>RLHF</strong> (reinforcement learning from human feedback) teaches that: the AI produces <em>several answers</em>, humans <strong>rank which is better</strong>, and the AI learns that taste. Be the ranker below.",
  },
  panelTitle: { vi: "🧑‍⚖️ Bạn chấm: câu nào tốt hơn?", en: "🧑‍⚖️ You judge: which answer is better?" },
  promptLabel: { vi: "Người dùng hỏi", en: "User asks" },
  pick: { vi: "👍 Chọn câu này", en: "👍 Pick this one" },
  next: { vi: "Câu hỏi tiếp →", en: "Next question →" },
  rewardTitle: { vi: "🎯 Minh họa tín hiệu preference", en: "🎯 Preference-signal illustration" },
  rewardEmpty: { vi: "Hãy chấm vài câu để xem cách tổng hợp lựa chọn…", en: "Rank a few answers to see choices aggregated…" },
  aligned: { vi: "hợp gu con người", en: "human-aligned" },
  raw: { vi: "kiểu mô hình thô", en: "raw-model style" },
  matchGood: { vi: "✓ Bạn chọn câu hữu ích/tử tế — giống đa số người chấm.", en: "✓ You picked the helpful/kind answer — like most human raters." },
  matchBad: { vi: "…bạn chọn câu thô hơn. Cũng được — RLHF học từ gu của SỐ ĐÔNG người chấm, không phải một người.", en: "…you picked the rawer answer. That's fine — RLHF learns from the AGGREGATE of many raters, not one." },
  doneTitle: { vi: "✅ Sau huấn luyện: AI đổi cách cư xử", en: "✅ After training: the AI changes its behavior" },
  restart: { vi: "↺ Chấm lại từ đầu", en: "↺ Rank again" },
};

export function roomRlhf(root) {
  const pairs = PAIRS[getLang()] || PAIRS.vi;
  const startIdx = parseInt(getParam("q", ""), 10);
  let current = Number.isInteger(startIdx) && pairs[startIdx] ? startIdx : 0;
  let alignedPicks = 0; // số lần chọn câu "hợp gu người"
  let rated = 0;        // tổng số câu đã chấm

  root.innerHTML = `
    <p class="room-intro">${tx(UI.intro)}</p>

    <div class="row">
      <div class="panel">
        <h4>${tx(UI.panelTitle)}</h4>
        <div class="rlhf-prompt mt">
          <span class="muted">${tx(UI.promptLabel)}:</span>
          <div id="rlhfPrompt" class="rlhf-q"></div>
        </div>
        <div id="rlhfAnswers" class="mt"></div>
        <div id="rlhfNote" class="muted mt"></div>
        <div class="mt"><button class="btn" id="rlhfNext" disabled>${tx(UI.next)}</button></div>
      </div>

      <div class="panel">
        <h4>${tx(UI.rewardTitle)}</h4>
        <div id="rlhfReward" class="muted">${tx(UI.rewardEmpty)}</div>
        <div class="rlhf-bar mt"><div id="rlhfFill" class="rlhf-fill" style="width:0%"></div></div>
        <div id="rlhfDone" class="mt"></div>
      </div>
    </div>

    <div class="takeaway">
      ${tx(
        "💡 <strong>Điều cốt lõi:</strong> RLHF là một họ quy trình: thu thập preference từ nhiều người, học tín hiệu thưởng rồi hậu huấn luyện model; sản phẩm thực thường còn kết hợp supervised fine-tuning và các bước an toàn khác. Demo này chỉ cộng điểm theo đáp án gắn nhãn sẵn — không huấn luyện reward model hay policy — và cũng nhắc rằng kết quả phản ánh lựa chọn của người chấm.",
        "💡 <strong>Key idea:</strong> RLHF is a family of workflows: aggregate preferences from many people, learn a reward signal, then post-train a model; real products often combine this with supervised fine-tuning and other safety stages. This demo only tallies pre-labeled choices—it trains no reward model or policy—and reminds us that outcomes reflect raters' choices."
      )}
    </div>
  `;

  const promptEl = root.querySelector("#rlhfPrompt");
  const answersEl = root.querySelector("#rlhfAnswers");
  const noteEl = root.querySelector("#rlhfNote");
  const nextBtn = root.querySelector("#rlhfNext");
  const rewardEl = root.querySelector("#rlhfReward");
  const fillEl = root.querySelector("#rlhfFill");
  const doneEl = root.querySelector("#rlhfDone");

  function renderQuestion() {
    const pair = pairs[current];
    promptEl.textContent = pair.prompt;
    answersEl.innerHTML = "";
    noteEl.textContent = "";
    nextBtn.disabled = true;

    pair.answers.forEach((ans, oi) => {
      const card = document.createElement("div");
      card.className = "rlhf-answer";
      card.innerHTML = `<p>${ans}</p><button class="btn ghost rlhf-pick">${tx(UI.pick)}</button>`;
      card.querySelector(".rlhf-pick").onclick = () => choose(oi, card);
      answersEl.appendChild(card);
    });
  }

  function choose(oi, card) {
    // Khóa lựa chọn của câu hiện tại.
    answersEl.querySelectorAll(".rlhf-pick").forEach((b) => (b.disabled = true));
    const pair = pairs[current];
    const isGood = oi === pair.good;
    card.classList.add(isGood ? "rlhf-chosen-good" : "rlhf-chosen-bad");
    // Đánh dấu câu "chuẩn" để người dùng thấy đâu là câu số đông thích.
    answersEl.children[pair.good].classList.add("rlhf-ideal");

    rated++;
    if (isGood) { alignedPicks++; sfx.success(); } else { sfx.click(); }
    noteEl.textContent = isGood ? tx(UI.matchGood) : tx(UI.matchBad);
    updateReward();
    nextBtn.disabled = false;
    if (rated >= pairs.length) finish();
  }

  function updateReward() {
    const pct = Math.round((alignedPicks / pairs.length) * 100);
    fillEl.style.width = pct + "%";
    rewardEl.innerHTML = tx(
      `Đã học từ <b>${rated}</b>/${pairs.length} lượt chấm. Mô hình thưởng đang ưu tiên câu <b>${tx(UI.aligned)}</b>.`,
      `Learned from <b>${rated}</b>/${pairs.length} ratings. The reward model now favors <b>${tx(UI.aligned)}</b> answers.`
    );
  }

  function finish() {
    nextBtn.disabled = true;
    doneEl.innerHTML = `
      <div class="takeaway rlhf-done">
        <b>${tx(UI.doneTitle)}</b>
        <p class="mt">${tx(
          `Sau khi học từ ${pairs.length} lượt chấm, khi gặp câu hỏi mới, AI giờ <b>tự chọn kiểu trả lời hữu ích và tử tế</b> mà không cần bạn nhắc — vì đó là kiểu được "thưởng" cao nhất. Bạn đã chọn câu hợp gu ${alignedPicks}/${pairs.length} lần.`,
          `After learning from ${pairs.length} ratings, on a new question the AI now <b>defaults to helpful, kind answers</b> without prompting — because that's what earned the highest reward. You picked the aligned answer ${alignedPicks}/${pairs.length} times.`
        )}</p>
        <button class="btn ghost mt" id="rlhfRestart">${tx(UI.restart)}</button>
      </div>`;
    doneEl.querySelector("#rlhfRestart").onclick = () => {
      current = 0; alignedPicks = 0; rated = 0;
      setParams({ q: null });
      fillEl.style.width = "0%";
      rewardEl.innerHTML = tx(UI.rewardEmpty);
      doneEl.innerHTML = "";
      renderQuestion();
      sfx.pop();
    };
    sfx.complete();
  }

  nextBtn.onclick = () => {
    if (current < pairs.length - 1) {
      current++;
      setParams({ q: current });
      renderQuestion();
      sfx.pop();
    }
  };

  renderQuestion();
}
