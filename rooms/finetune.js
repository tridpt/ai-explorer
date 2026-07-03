// Phòng — Fine-tuning vs Prompting: hai cách "dạy thêm" cho AI. Song ngữ.
import { sfx } from "../sound.js";
import { tx } from "../i18n.js";
import { getParam, setParams } from "../roomstate.js";

// Trục so sánh: mỗi thuộc tính cho biết phía nào thắng + giải thích.
const AXES = [
  {
    label: { vi: "Chi phí & công sức", en: "Cost & effort" },
    prompt: { vi: "Rẻ, làm ngay bằng chữ", en: "Cheap, done instantly with text" },
    tune: { vi: "Tốn dữ liệu + tính toán để huấn luyện lại", en: "Needs data + compute to retrain" },
    win: "prompt",
  },
  {
    label: { vi: "Tốc độ triển khai", en: "Speed to deploy" },
    prompt: { vi: "Vài giây — chỉ sửa câu lệnh", en: "Seconds — just edit the prompt" },
    tune: { vi: "Hàng giờ tới hàng ngày", en: "Hours to days" },
    win: "prompt",
  },
  {
    label: { vi: "Dạy phong cách / giọng điệu riêng", en: "Teaching a custom style/voice" },
    prompt: { vi: "Làm được phần nào bằng ví dụ trong prompt", en: "Partly, via examples in the prompt" },
    tune: { vi: "Rất mạnh — ngấm sâu vào mô hình", en: "Very strong — baked into the model" },
    win: "tune",
  },
  {
    label: { vi: "Kiến thức mới / tài liệu riêng", en: "New knowledge / private docs" },
    prompt: { vi: "Nên dùng RAG để đưa tài liệu vào", en: "Better handled with RAG" },
    tune: { vi: "Được, nhưng tốn kém và dễ lỗi thời", en: "Possible but costly and goes stale" },
    win: "prompt",
  },
  {
    label: { vi: "Ổn định, lặp lại giống nhau", en: "Consistency at scale" },
    prompt: { vi: "Có thể dao động theo cách hỏi", en: "Can vary with wording" },
    tune: { vi: "Rất nhất quán cho tác vụ hẹp", en: "Very consistent for a narrow task" },
    win: "tune",
  },
];

const SCENARIOS = [
  { text: { vi: "Muốn chatbot luôn trả lời bằng giọng hài hước của thương hiệu, dùng hàng triệu lần.", en: "Want a chatbot that always answers in the brand's witty voice, used millions of times." }, answer: "tune",
    why: { vi: "Phong cách cố định + dùng ở quy mô lớn → fine-tuning đáng công.", en: "Fixed style + huge scale → fine-tuning pays off." } },
  { text: { vi: "Cần AI tóm tắt tài liệu nội bộ mới cập nhật hằng tuần.", en: "Need AI to summarize internal docs that change weekly." }, answer: "prompt",
    why: { vi: "Kiến thức thay đổi liên tục → prompting/RAG linh hoạt hơn.", en: "Ever-changing knowledge → prompting/RAG is more flexible." } },
  { text: { vi: "Thử nhanh một ý tưởng cuối tuần, chưa có dữ liệu gì.", en: "Prototyping an idea over a weekend, no data yet." }, answer: "prompt",
    why: { vi: "Nhanh, rẻ, không cần dữ liệu → prompting.", en: "Fast, cheap, no data needed → prompting." } },
  { text: { vi: "Phân loại đơn hỗ trợ vào đúng 5 nhóm, cực kỳ nhất quán.", en: "Classify support tickets into exactly 5 buckets, super consistently." }, answer: "tune",
    why: { vi: "Tác vụ hẹp, cần độ ổn định cao → fine-tuning tỏa sáng.", en: "Narrow task needing high consistency → fine-tuning shines." } },
];

export function roomFinetune(root) {
  const startTab = getParam("view") === "quiz" ? "quiz" : "compare";

  root.innerHTML = `
    <p class="room-intro">
      ${tx(
        "Một mô hình AI có sẵn đã biết rất nhiều, nhưng làm sao bắt nó làm <em>đúng việc của bạn</em>? Có hai cách chính: <strong>Prompting</strong> — khéo léo ra lệnh bằng chữ (kèm ví dụ), không đụng vào mô hình; và <strong>Fine-tuning</strong> — huấn luyện thêm mô hình trên dữ liệu của bạn để nó \"ngấm\" hẳn. Mỗi cách hợp một tình huống.",
        "A pretrained AI already knows a lot, but how do you make it do <em>your</em> job? Two main ways: <strong>Prompting</strong> — cleverly instruct it with text (plus examples), touching nothing; and <strong>Fine-tuning</strong> — train the model further on your data so it's baked in. Each fits different situations."
      )}
    </p>

    <div class="seg" id="ftTabs">
      <button class="seg-btn" data-tab="compare">${tx("⚖️ So sánh", "⚖️ Compare")}</button>
      <button class="seg-btn" data-tab="quiz">${tx("🎯 Bạn chọn cách nào?", "🎯 Which would you pick?")}</button>
    </div>

    <div id="ftCompare"></div>
    <div id="ftQuiz" style="display:none"></div>

    <div class="takeaway">
      ${tx(
        "💡 <strong>Điều cốt lõi:</strong> Đừng vội fine-tuning. Với hầu hết nhu cầu, <em>prompting</em> (kèm RAG cho tài liệu riêng) là đủ, nhanh và rẻ. Chỉ fine-tune khi bạn cần một phong cách/hành vi rất cố định, lặp lại ở quy mô lớn và đã có dữ liệu chất lượng.",
        "💡 <strong>Key idea:</strong> Don't rush to fine-tune. For most needs, <em>prompting</em> (plus RAG for private docs) is enough, fast and cheap. Fine-tune only when you need a very fixed style/behavior, repeated at scale, and you already have quality data."
      )}
    </div>
  `;

  // ----- Tab So sánh -----
  const cmp = root.querySelector("#ftCompare");
  const table = document.createElement("div");
  table.className = "panel";
  table.innerHTML = `
    <div class="ft-grid ft-head">
      <div></div>
      <div class="ft-col ft-prompt">✍️ ${tx("Prompting", "Prompting")}</div>
      <div class="ft-col ft-tune">🔧 ${tx("Fine-tuning", "Fine-tuning")}</div>
    </div>
    ${AXES.map((a) => `
      <div class="ft-grid">
        <div class="ft-axis">${tx(a.label)}</div>
        <div class="ft-cell ${a.win === "prompt" ? "ft-win" : ""}">${tx(a.prompt)}</div>
        <div class="ft-cell ${a.win === "tune" ? "ft-win" : ""}">${tx(a.tune)}</div>
      </div>`).join("")}
  `;
  cmp.appendChild(table);

  // ----- Tab Quiz tình huống -----
  const quiz = root.querySelector("#ftQuiz");
  const qPanel = document.createElement("div");
  qPanel.className = "panel";
  qPanel.innerHTML = `<h4>${tx("Với mỗi tình huống, bạn chọn cách nào?", "For each scenario, which would you pick?")}</h4>`;
  quiz.appendChild(qPanel);

  SCENARIOS.forEach((sc, i) => {
    const block = document.createElement("div");
    block.className = "ft-scenario";
    block.innerHTML = `
      <p class="ft-q">${i + 1}. ${tx(sc.text)}</p>
      <div class="ft-choices">
        <button class="btn ghost" data-pick="prompt">✍️ ${tx("Prompting", "Prompting")}</button>
        <button class="btn ghost" data-pick="tune">🔧 ${tx("Fine-tuning", "Fine-tuning")}</button>
      </div>
      <div class="ft-feedback muted"></div>`;
    const fb = block.querySelector(".ft-feedback");
    block.querySelectorAll("[data-pick]").forEach((btn) => {
      btn.onclick = () => {
        block.querySelectorAll("[data-pick]").forEach((b) => (b.disabled = true));
        const ok = btn.dataset.pick === sc.answer;
        btn.classList.add(ok ? "correct" : "wrong");
        if (!ok) block.querySelector(`[data-pick="${sc.answer}"]`).classList.add("correct");
        fb.innerHTML = (ok ? "✅ " : "💡 ") + tx(sc.why);
        ok ? sfx.success() : sfx.wrong();
      };
    });
    qPanel.appendChild(block);
  });

  // ----- Chuyển tab -----
  const tabs = root.querySelector("#ftTabs");
  function setTab(name) {
    tabs.querySelectorAll(".seg-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
    cmp.style.display = name === "compare" ? "" : "none";
    quiz.style.display = name === "quiz" ? "" : "none";
    setParams({ view: name === "quiz" ? "quiz" : null });
  }
  tabs.querySelectorAll(".seg-btn").forEach((b) => (b.onclick = () => { setTab(b.dataset.tab); sfx.click(); }));
  setTab(startTab);
}
