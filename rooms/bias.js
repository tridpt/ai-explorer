// Phòng — AI có thiên kiến? Song ngữ.
import { tx } from "../i18n.js";

const PROFESSIONS = [
  { job: { vi: "y tá", en: "nurse" }, nam: 12, nu: 88 },
  { job: { vi: "kỹ sư", en: "engineer" }, nam: 84, nu: 16 },
  { job: { vi: "giáo viên mầm non", en: "preschool teacher" }, nam: 6, nu: 94 },
  { job: { vi: "phi công", en: "pilot" }, nam: 90, nu: 10 },
  { job: { vi: "đầu bếp", en: "chef" }, nam: 72, nu: 28 },
  { job: { vi: "thư ký", en: "secretary" }, nam: 18, nu: 82 },
  { job: { vi: "lập trình viên", en: "programmer" }, nam: 80, nu: 20 },
  { job: { vi: "bác sĩ", en: "doctor" }, nam: 65, nu: 35 },
];

export function roomBias(root) {
  root.innerHTML = `
    <p class="room-intro">
      ${tx(
        "AI học từ hàng tỉ trang văn bản do con người viết ra. Nếu trong dữ liệu đó \"y tá\" hầu như luôn đi với \"cô ấy\" còn \"kỹ sư\" đi với \"anh ấy\", thì AI sẽ <strong>học luôn cả định kiến đó</strong> — dù nó không hề có ý đồ gì. Hãy xem AI \"đoán\" giới tính cho từng nghề.",
        "AI learns from billions of pages written by humans. If in that data \"nurse\" almost always goes with \"she\" and \"engineer\" with \"he\", the AI will <strong>learn that bias too</strong> — with no intent at all. See how the AI \"guesses\" gender for each job."
      )}
    </p>

    <div class="panel">
      <h4>${tx("⚖️ Chọn một nghề nghiệp", "⚖️ Pick a profession")}</h4>
      <div id="jobPicker"></div>
      <div id="biasResult" class="mt"></div>
    </div>

    <div class="takeaway">
      ${tx(
        "💡 <strong>Điều cốt lõi:</strong> AI không trung lập một cách tự nhiên — nó là tấm gương phản chiếu dữ liệu mà ta cho nó ăn. Hiểu được điều này giúp ta dùng AI có trách nhiệm: luôn đặt câu hỏi <em>\"dữ liệu dạy nó đến từ đâu, và nó có thể đang thiên lệch chỗ nào?\"</em>",
        "💡 <strong>Key idea:</strong> AI isn't naturally neutral — it mirrors the data we feed it. Knowing this helps us use AI responsibly: always ask <em>\"where did its training data come from, and where might it be skewed?\"</em>"
      )}
    </div>
  `;

  const picker = root.querySelector("#jobPicker");
  PROFESSIONS.forEach((p) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = tx(p.job);
    tag.onclick = () => show(p);
    picker.appendChild(tag);
  });

  const resultEl = root.querySelector("#biasResult");

  function show(p) {
    resultEl.innerHTML = `
      <p class="mt">${tx(`Khi nghĩ về một <b>${tx(p.job)}</b>, AI liên tưởng tới:`, `Thinking of a <b>${tx(p.job)}</b>, the AI associates:`)}</p>
      <div class="bar-row mt">
        <div class="bar-label">${tx("👨 Nam giới", "👨 Male")}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${p.nam}%">${p.nam}%</div></div>
      </div>
      <div class="bar-row">
        <div class="bar-label">${tx("👩 Nữ giới", "👩 Female")}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${p.nu}%; background:linear-gradient(90deg,#b07bff,#f472b6)">${p.nu}%</div></div>
      </div>
      <p class="muted mt">
        ${Math.abs(p.nam - p.nu) > 50
          ? tx("⚠️ Một thiên kiến mạnh — thực tế nghề này dành cho mọi giới, nhưng dữ liệu đã khiến AI nghiêng hẳn về một phía.",
               "⚠️ A strong bias — this job is for everyone, but the data made the AI lean heavily one way.")
          : tx("Mức liên tưởng tương đối cân bằng hơn, nhưng vẫn không hoàn toàn 50–50.",
               "The association is more balanced, but still not exactly 50–50.")}
      </p>
    `;
  }

  show(PROFESSIONS[0]);
}
