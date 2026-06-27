// Phòng 05 — Máy đoán chữ (mô phỏng cách LLM sinh văn bản & vì sao "ảo giác")
// Mô hình bigram/trigram đơn giản học từ một kho văn bản nhỏ ngay trên trình duyệt.

const CORPUS = `
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
`;

function tokenize(text) {
  return text.toLowerCase().replace(/\n/g, " ").replace(/[.,]/g, " . ")
    .split(/\s+/).filter(Boolean);
}

// Xây bảng xác suất: từ một (hoặc hai) từ -> phân bố từ tiếp theo
function buildModel(tokens) {
  const bi = {};   // word -> {next: count}
  const tri = {};  // "w1 w2" -> {next: count}
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

const TOKENS = tokenize(CORPUS);
const MODEL = buildModel(TOKENS);

// Lấy phân bố next-token cho ngữ cảnh, áp dụng "nhiệt độ"
function distribution(context, temp) {
  const words = context.trim().split(/\s+/);
  const last = words[words.length - 1];
  const prev = words[words.length - 2];
  let table = (prev && MODEL.tri[prev + " " + last]) || MODEL.bi[last];
  if (!table) return [];

  let entries = Object.entries(table);
  // áp nhiệt độ: temp thấp -> chắc chắn hơn; temp cao -> dàn đều, dễ chọn từ lạ
  const t = Math.max(0.05, temp);
  const logits = entries.map(([w, c]) => [w, Math.log(c) / t]);
  const max = Math.max(...logits.map((e) => e[1]));
  const exps = logits.map(([w, l]) => [w, Math.exp(l - max)]);
  const sum = exps.reduce((s, e) => s + e[1], 0);
  return exps.map(([w, e]) => [w, e / sum]).sort((a, b) => b[1] - a[1]);
}

function sample(probs) {
  const r = Math.random();
  let acc = 0;
  for (const [w, p] of probs) {
    acc += p;
    if (r <= acc) return w;
  }
  return probs[probs.length - 1]?.[0];
}

export function roomNextToken(root) {
  root.innerHTML = `
    <p class="room-intro">
      Một mô hình ngôn ngữ (như ChatGPT) viết câu theo cách đơn giản đến bất ngờ:
      nó <strong>đoán từ tiếp theo</strong>, rồi lại đoán từ tiếp theo nữa, cứ thế. Mỗi lần đoán chỉ là
      <em>xác suất</em>. Hãy tự tay vận hành cỗ máy đó và xem vì sao đôi khi nó nói sai một cách tự tin.
    </p>

    <div class="panel">
      <h4>🎲 Cỗ máy đoán chữ</h4>
      <div id="sentence" style="font-size:20px; line-height:1.8; min-height:32px; margin-bottom:10px;"></div>
      <p class="muted">Các ứng viên cho từ tiếp theo (bấm để chọn, hoặc để máy tự chọn):</p>
      <div id="candidates" class="mt"></div>

      <label class="field mt">
        <span>Độ sáng tạo (nhiệt độ): <b id="tempVal">0.7</b> — kéo cao để thấy AI "bay bổng" và dễ sai hơn</span>
        <input type="range" id="temp" min="0.1" max="2.0" step="0.1" value="0.7" />
      </label>

      <div class="row mt">
        <button class="btn" id="stepBtn">▶ Đoán 1 từ</button>
        <button class="btn ghost" id="autoBtn">⏩ Tự viết cả câu</button>
        <button class="btn ghost" id="resetBtn">↺ Bắt đầu lại</button>
      </div>
    </div>

    <div class="takeaway">
      💡 <strong>Điều cốt lõi:</strong> AI không "biết" sự thật — nó chỉ chọn từ <em>nghe có vẻ hợp lý</em>
      theo xác suất. Khi "nhiệt độ" cao hoặc khi gặp ngữ cảnh lạ, nó vẫn chọn bừa một từ và ghép thành câu
      trơn tru. Đó chính là <em>ảo giác (hallucination)</em>: sai nhưng nghe rất thật.
    </div>
  `;

  const START = ["mặt", "trời"];
  let context = [...START];

  const sentenceEl = root.querySelector("#sentence");
  const candEl = root.querySelector("#candidates");
  const tempEl = root.querySelector("#temp");
  const tempVal = root.querySelector("#tempVal");

  function renderSentence() {
    sentenceEl.innerHTML = context
      .map((w) => `<span class="tok" style="background:rgba(110,168,254,0.15)">${w}</span>`)
      .join(" ");
  }

  function renderCandidates() {
    const temp = parseFloat(tempEl.value);
    const probs = distribution(context.join(" "), temp).slice(0, 6);
    candEl.innerHTML = "";
    if (probs.length === 0) {
      candEl.innerHTML = `<p class="muted">Hết đường đoán — cỗ máy chưa từng thấy ngữ cảnh này. Bấm "Bắt đầu lại".</p>`;
      return;
    }
    probs.forEach(([w, p]) => {
      const row = document.createElement("div");
      row.className = "bar-row";
      row.innerHTML = `
        <div class="bar-label">${w === "." ? "[hết câu]" : w}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.max(6, p * 100)}%">${Math.round(p * 100)}%</div></div>
      `;
      row.style.cursor = "pointer";
      row.onclick = () => { if (w !== ".") { context.push(w); update(); } };
      candEl.appendChild(row);
    });
  }

  function update() {
    renderSentence();
    renderCandidates();
  }

  function step() {
    const temp = parseFloat(tempEl.value);
    const probs = distribution(context.join(" "), temp);
    if (probs.length === 0) return false;
    const w = sample(probs);
    if (w === "." || !w) return false;
    context.push(w);
    update();
    return true;
  }

  tempEl.oninput = () => { tempVal.textContent = parseFloat(tempEl.value).toFixed(1); renderCandidates(); };
  root.querySelector("#stepBtn").onclick = step;
  root.querySelector("#resetBtn").onclick = () => { context = [...START]; update(); };
  root.querySelector("#autoBtn").onclick = () => {
    let n = 0;
    const timer = setInterval(() => {
      if (!step() || ++n > 18) clearInterval(timer);
    }, 280);
  };

  update();
}
