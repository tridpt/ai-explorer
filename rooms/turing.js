// Phòng — Người hay AI viết? (Turing test mini). Song ngữ.
import { sfx, celebrate } from "../sound.js";
import { tx } from "../i18n.js";

// Mỗi vòng: một đoạn text + nguồn thật (human/ai) + lời giải thích.
const ROUNDS = [
  {
    text: { vi: "Trời hôm nay đẹp ghê, tự nhiên thèm một ly cà phê sữa đá rồi ngồi nhìn người ta qua lại.",
            en: "Gorgeous weather today, suddenly craving an iced milk coffee and just watching people go by." },
    src: "human",
    why: { vi: "Giọng đời thường, cảm xúc vụn vặt và cụ thể — kiểu con người hay viết.",
           en: "Casual, small specific feelings — very human." },
  },
  {
    text: { vi: "Cà phê là một thức uống phổ biến, mang lại nhiều lợi ích và được nhiều người trên khắp thế giới yêu thích mỗi ngày.",
            en: "Coffee is a popular beverage that offers many benefits and is enjoyed by many people around the world every day." },
    src: "ai",
    why: { vi: "Câu tổng quát, trung tính, \"an toàn\" và hơi sáo — đặc trưng văn AI.",
           en: "Generic, neutral, safe and slightly bland — typical AI phrasing." },
  },
  {
    text: { vi: "Ừ thì mình cũng không chắc lắm, nhưng chắc là do hôm qua ngủ trễ nên nay đầu óc cứ lơ mơ á.",
            en: "Eh, I'm not totally sure, but probably 'cause I slept late yesterday so my head's all foggy today." },
    src: "human",
    why: { vi: "Ngập ngừng, khẩu ngữ, lý do cá nhân lộn xộn — rất người.",
           en: "Hesitant, colloquial, messy personal reasoning — very human." },
  },
  {
    text: { vi: "Có nhiều yếu tố có thể ảnh hưởng đến giấc ngủ của bạn, bao gồm ánh sáng, nhiệt độ, và thói quen sinh hoạt hằng ngày.",
            en: "Several factors can affect your sleep, including light, temperature, and daily habits." },
    src: "ai",
    why: { vi: "Liệt kê gọn gàng, giọng \"trợ lý\", không có cái tôi — kiểu AI.",
           en: "Tidy list, \"assistant\" tone, no personal voice — AI-like." },
  },
  {
    text: { vi: "Khum có gì đâu mà, tại bồ hỏi nên tui nói vậy thôi chứ tui cũng gà lắm 😅",
            en: "Nah it's nothing, I only said it 'cause you asked, honestly I'm pretty clueless too 😅" },
    src: "human",
    why: { vi: "Tiếng lóng, sai chính tả cố ý, emoji, sự khiêm tốn thật — dấu hiệu người.",
           en: "Slang, playful typos, emoji, genuine modesty — human signals." },
  },
];

export function roomTuring(root) {
  root.innerHTML = `
    <p class="room-intro">
      ${tx(
        "AI ngày nay viết trơn tru đến mức khó phân biệt với người. Nhưng vẫn có những dấu hiệu. Đọc từng đoạn dưới đây và đoán: <strong>do con người viết hay AI viết?</strong> Cuối cùng bạn sẽ tinh mắt hơn — một kỹ năng ngày càng cần trong thời đại AI.",
        "Today's AI writes so smoothly it's hard to tell from a human. But there are tells. Read each passage and guess: <strong>written by a human or by AI?</strong> By the end you'll have a sharper eye — a skill that matters more and more."
      )}
    </p>

    <div class="panel">
      <div id="tuStage"></div>
    </div>

    <div class="takeaway">
      ${tx(
        "💡 <strong>Điều cốt lõi:</strong> Văn AI thường trơn tru, trung lập, đầy đủ nhưng thiếu \"cái tôi\" và những chi tiết đời thường lộn xộn. Nhận ra điều này giúp bạn tỉnh táo: đừng tin ngay chỉ vì một đoạn văn nghe mượt mà và tự tin — AI rất giỏi việc đó.",
        "💡 <strong>Key idea:</strong> AI writing is often smooth, neutral and complete but lacks a personal voice and messy real-life detail. Spotting this keeps you sharp: don't trust text just because it sounds fluent and confident — AI is very good at that."
      )}
    </div>
  `;

  const stage = root.querySelector("#tuStage");
  let idx = 0, score = 0;

  function render() {
    if (idx >= ROUNDS.length) {
      const emoji = score === ROUNDS.length ? "🏆" : score >= 3 ? "🕵️" : "🌱";
      stage.innerHTML = `
        <div class="badge">
          <div class="badge-ring">${emoji}</div>
          <h3>${tx("Kết quả", "Result")}</h3>
          <div class="score">${score}/${ROUNDS.length}</div>
          <p class="muted mt">${tx("Đúng số câu bạn phân biệt được người / AI.", "Passages you correctly told apart.")}</p>
          <button class="btn mt" id="tuAgain">${tx("↺ Chơi lại", "↺ Play again")}</button>
        </div>`;
      stage.querySelector("#tuAgain").onclick = () => { idx = 0; score = 0; render(); };
      sfx.complete();
      if (score >= 3) celebrate();
      return;
    }
    const r = ROUNDS[idx];
    stage.innerHTML = `
      <div class="muted">${tx("Đoạn", "Passage")} ${idx + 1}/${ROUNDS.length} · ${tx("Điểm:", "Score:")} ${score}</div>
      <blockquote style="font-size:18px; font-weight:600; line-height:1.6; margin:14px 0; padding:16px; border:2px solid var(--ink); background:var(--bg);">“${tx(r.text)}”</blockquote>
      <p class="muted">${tx("Ai đã viết đoạn này?", "Who wrote this?")}</p>
      <div class="row mt">
        <button class="btn" data-g="human">🧑 ${tx("Con người", "A human")}</button>
        <button class="btn ghost" data-g="ai">🤖 ${tx("AI", "AI")}</button>
      </div>
      <div id="tuFb" class="mt"></div>`;

    stage.querySelectorAll("[data-g]").forEach((b) => {
      b.onclick = () => {
        const correct = b.dataset.g === r.src;
        if (correct) { score++; sfx.success(); } else sfx.wrong();
        const answer = r.src === "human" ? tx("Con người viết", "Written by a human") : tx("AI viết", "Written by AI");
        stage.querySelector("#tuFb").innerHTML = `
          <div class="takeaway" style="box-shadow:none; margin:0;">
            ${correct ? "✅ " + tx("Chính xác!", "Correct!") : "❌ " + tx("Chưa đúng.", "Not quite.")}
            <b>${answer}.</b> ${tx(r.why)}
          </div>
          <button class="btn mt" id="tuNext">${idx + 1 < ROUNDS.length ? tx("Đoạn tiếp →", "Next →") : tx("Xem kết quả", "See result")}</button>`;
        stage.querySelectorAll("[data-g]").forEach((x) => (x.disabled = true));
        stage.querySelector("#tuNext").onclick = () => { idx++; render(); };
      };
    });
  }

  render();
}
