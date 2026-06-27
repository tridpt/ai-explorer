// Phòng 06 — AI có thiên kiến? Minh họa bias học từ dữ liệu của con người.
// Các con số mô phỏng xu hướng liên tưởng giới tính mà mô hình thường học phải từ dữ liệu lệch.

const PROFESSIONS = [
  { job: "y tá", nam: 12, nu: 88 },
  { job: "kỹ sư", nam: 84, nu: 16 },
  { job: "giáo viên mầm non", nam: 6, nu: 94 },
  { job: "phi công", nam: 90, nu: 10 },
  { job: "đầu bếp", nam: 72, nu: 28 },
  { job: "thư ký", nam: 18, nu: 82 },
  { job: "lập trình viên", nam: 80, nu: 20 },
  { job: "bác sĩ", nam: 65, nu: 35 },
];

export function roomBias(root) {
  root.innerHTML = `
    <p class="room-intro">
      AI học từ hàng tỉ trang văn bản do con người viết ra. Nếu trong dữ liệu đó "y tá" hầu như luôn
      đi với "cô ấy" còn "kỹ sư" đi với "anh ấy", thì AI sẽ <strong>học luôn cả định kiến đó</strong> —
      dù nó không hề có ý đồ gì. Hãy xem AI "đoán" giới tính cho từng nghề.
    </p>

    <div class="panel">
      <h4>⚖️ Chọn một nghề nghiệp</h4>
      <div id="jobPicker"></div>
      <div id="biasResult" class="mt"></div>
    </div>

    <div class="takeaway">
      💡 <strong>Điều cốt lõi:</strong> AI không trung lập một cách tự nhiên — nó là tấm gương phản chiếu
      dữ liệu mà ta cho nó ăn. Hiểu được điều này giúp ta dùng AI có trách nhiệm: luôn đặt câu hỏi
      <em>"dữ liệu dạy nó đến từ đâu, và nó có thể đang thiên lệch chỗ nào?"</em>
    </div>
  `;

  const picker = root.querySelector("#jobPicker");
  PROFESSIONS.forEach((p) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = p.job;
    tag.onclick = () => show(p);
    picker.appendChild(tag);
  });

  const resultEl = root.querySelector("#biasResult");

  function show(p) {
    resultEl.innerHTML = `
      <p class="mt">Khi nghĩ về một <b>${p.job}</b>, AI liên tưởng tới:</p>
      <div class="bar-row mt">
        <div class="bar-label">👨 Nam giới</div>
        <div class="bar-track"><div class="bar-fill" style="width:${p.nam}%">${p.nam}%</div></div>
      </div>
      <div class="bar-row">
        <div class="bar-label">👩 Nữ giới</div>
        <div class="bar-track"><div class="bar-fill" style="width:${p.nu}%; background:linear-gradient(90deg,#b07bff,#f472b6)">${p.nu}%</div></div>
      </div>
      <p class="muted mt">
        ${Math.abs(p.nam - p.nu) > 50
          ? "⚠️ Một thiên kiến mạnh — thực tế nghề này dành cho mọi giới, nhưng dữ liệu đã khiến AI nghiêng hẳn về một phía."
          : "Mức liên tưởng tương đối cân bằng hơn, nhưng vẫn không hoàn toàn 50–50."}
      </p>
    `;
  }

  show(PROFESSIONS[0]);
}
