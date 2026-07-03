// Phòng — Máy đoán chữ (mô phỏng cách LLM sinh văn bản & vì sao "ảo giác"). Song ngữ.
import { tx, getLang } from "../i18n.js";

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
const START = { vi: ["mặt", "trời"], en: ["the", "sun"] };

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

function distribution(model, context, temp) {
  const words = context.trim().split(/\s+/);
  const last = words[words.length - 1];
  const prev = words[words.length - 2];
  let table = (prev && model.tri[prev + " " + last]) || model.bi[last];
  if (!table) return [];

  let entries = Object.entries(table);
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
  for (const [w, p] of probs) { acc += p; if (r <= acc) return w; }
  return probs[probs.length - 1]?.[0];
}

export function roomNextToken(root) {
  const lang = getLang();
  const MODEL = buildModel(tokenize(CORPUS[lang]));

  let startWords = [...START[lang]];
  let context = [...startWords];
  let mode = "sample"; // "sample" | "greedy"
  let lastPick = null;  // từ vừa được chọn (để tô sáng)

  root.innerHTML = `
    <p class="room-intro">
      ${tx(
        "Một mô hình ngôn ngữ (như ChatGPT) viết câu theo cách đơn giản đến bất ngờ: nó <strong>đoán từ tiếp theo</strong>, rồi lại đoán từ tiếp theo nữa, cứ thế. Mỗi lần đoán chỉ là <em>xác suất</em>. Hãy tự tay vận hành cỗ máy đó và xem vì sao đôi khi nó nói sai một cách tự tin.",
        "A language model (like ChatGPT) writes in a surprisingly simple way: it <strong>guesses the next word</strong>, then the next, and so on. Each guess is just <em>probability</em>. Run the machine yourself and see why it sometimes speaks wrongly with confidence."
      )}
    </p>

    <div class="panel">
      <h4>${tx("✍️ Câu mồi (gõ vài từ để AI viết tiếp)", "✍️ Seed (type a few words for the AI to continue)")}</h4>
      <div class="row" style="align-items:center; gap:10px">
        <input type="text" id="seed" style="flex:1" value="${startWords.join(" ")}" />
        <button class="btn ghost" id="seedBtn">${tx("Dùng câu này", "Use this")}</button>
      </div>
      <p class="muted mt">${tx("Gợi ý: gõ những từ có trong các câu mẫu để cỗ máy \"biết đường\". Từ lạ hoàn toàn sẽ khiến nó bí.", "Tip: use words seen in the sample sentences so the machine has a path. Totally new words make it stuck.")}</p>
    </div>

    <div class="panel">
      <h4>${tx("🎲 Cỗ máy đoán chữ", "🎲 The word-guessing machine")}</h4>
      <div id="sentence" style="font-size:20px; line-height:1.8; min-height:32px; margin-bottom:10px;"></div>
      <p class="muted">${tx("Các ứng viên cho từ tiếp theo (bấm để chọn, hoặc để máy tự chọn):", "Candidates for the next word (click to pick, or let it choose):")}</p>
      <div id="candidates" class="mt"></div>

      <div class="seg mt" id="modeSeg">
        <button class="seg-btn active" data-mode="sample">${tx("🎲 Chọn theo xác suất", "🎲 Sample by probability")}</button>
        <button class="seg-btn" data-mode="greedy">${tx("🥇 Luôn chọn từ cao nhất", "🥇 Always pick the top")}</button>
      </div>

      <label class="field mt" id="tempField">
        <span>${tx("Độ sáng tạo (nhiệt độ):", "Creativity (temperature):")} <b id="tempVal">0.7</b> — ${tx("kéo cao để thấy AI \"bay bổng\" và dễ sai hơn", "raise it to see the AI get \"wild\" and more error-prone")}</span>
        <input type="range" id="temp" min="0.1" max="2.0" step="0.1" value="0.7" />
      </label>

      <div class="row mt">
        <button class="btn" id="stepBtn">${tx("▶ Đoán 1 từ", "▶ Guess 1 word")}</button>
        <button class="btn ghost" id="autoBtn">${tx("⏩ Tự viết cả câu", "⏩ Auto-write")}</button>
        <button class="btn ghost" id="resetBtn">${tx("↺ Bắt đầu lại", "↺ Restart")}</button>
      </div>
      <p class="muted mt" id="ntStatus"></p>
    </div>

    <div class="takeaway">
      ${tx(
        "💡 <strong>Điều cốt lõi:</strong> AI không \"biết\" sự thật — nó chỉ chọn từ <em>nghe có vẻ hợp lý</em> theo xác suất. Khi \"nhiệt độ\" cao hoặc khi gặp ngữ cảnh lạ, nó vẫn chọn bừa một từ và ghép thành câu trơn tru. Đó chính là <em>ảo giác (hallucination)</em>: sai nhưng nghe rất thật.",
        "💡 <strong>Key idea:</strong> AI doesn't \"know\" the truth — it picks words that <em>sound plausible</em> by probability. At high \"temperature\" or in unfamiliar context, it still picks something and stitches a smooth sentence. That's <em>hallucination</em>: wrong but convincing."
      )}
    </div>
  `;

  const sentenceEl = root.querySelector("#sentence");
  const candEl = root.querySelector("#candidates");
  const tempEl = root.querySelector("#temp");
  const tempVal = root.querySelector("#tempVal");
  const seedEl = root.querySelector("#seed");
  const statusEl = root.querySelector("#ntStatus");
  const tempField = root.querySelector("#tempField");

  function renderSentence() {
    sentenceEl.innerHTML = context
      .map((w, i) => {
        const isNew = i >= startWords.length && i === context.length - 1;
        const bg = isNew ? "rgba(251,191,36,0.4)" : "rgba(110,168,254,0.15)";
        return `<span class="tok" style="background:${bg}">${w}</span>`;
      })
      .join(" ");
  }

  function renderCandidates() {
    const temp = mode === "greedy" ? 1 : parseFloat(tempEl.value);
    const probs = distribution(MODEL, context.join(" "), temp).slice(0, 6);
    candEl.innerHTML = "";
    if (probs.length === 0) {
      candEl.innerHTML = `<p class="muted">${tx("🚧 Hết đường đoán — cỗ máy chưa từng thấy ngữ cảnh này (từ cuối quá lạ). Bấm \"Bắt đầu lại\" hoặc đổi câu mồi.", "🚧 Dead end — the machine has never seen this context (last word too rare). Click \"Restart\" or change the seed.")}</p>`;
      return;
    }
    const topProb = probs[0][1];
    probs.forEach(([w, p]) => {
      const isTop = p === topProb;
      const isPick = w === lastPick;
      const row = document.createElement("div");
      row.className = "bar-row";
      const barColor = isPick ? "linear-gradient(90deg,#fbbf24,#fb923c)" : "";
      row.innerHTML = `
        <div class="bar-label">${w === "." ? tx("[hết câu]", "[end]") : w}${mode === "greedy" && isTop ? " 🥇" : ""}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.max(6, p * 100)}%${barColor ? ";background:" + barColor : ""}">${Math.round(p * 100)}%</div></div>
      `;
      row.style.cursor = "pointer";
      row.onclick = () => { if (w !== ".") { lastPick = w; context.push(w); update(); } };
      candEl.appendChild(row);
    });
  }

  function update() { renderSentence(); renderCandidates(); }

  function step() {
    const temp = mode === "greedy" ? 1 : parseFloat(tempEl.value);
    const probs = distribution(MODEL, context.join(" "), temp);
    if (probs.length === 0) { statusEl.textContent = tx("🚧 Bí đường — không có từ nào để đoán tiếp.", "🚧 Stuck — no word to continue."); return false; }
    // greedy: luôn lấy từ xác suất cao nhất; sample: bốc theo xác suất
    const w = mode === "greedy" ? probs[0][0] : sample(probs);
    if (w === "." || !w) { statusEl.textContent = tx("⏹ Máy quyết định kết thúc câu ở đây.", "⏹ The machine chose to end the sentence here."); return false; }
    lastPick = w;
    context.push(w);
    update();
    return true;
  }

  function applyMode() {
    root.querySelectorAll("#modeSeg .seg-btn").forEach((b) =>
      b.classList.toggle("active", b.dataset.mode === mode));
    // greedy không dùng nhiệt độ → làm mờ thanh trượt cho rõ ý
    tempField.style.opacity = mode === "greedy" ? "0.4" : "1";
    tempField.style.pointerEvents = mode === "greedy" ? "none" : "";
    statusEl.textContent = mode === "greedy"
      ? tx("🥇 Chế độ tất định: cùng câu mồi → luôn ra cùng kết quả (nhưng dễ lặp, cụt).", "🥇 Deterministic: same seed → always same output (but repetitive, dull).")
      : tx("🎲 Chế độ ngẫu nhiên: cùng câu mồi vẫn ra khác nhau mỗi lần — vì sao AI 'sáng tạo'.", "🎲 Stochastic: same seed varies each run — why AI feels 'creative'.");
    renderCandidates();
  }

  root.querySelectorAll("#modeSeg .seg-btn").forEach((b) => {
    b.onclick = () => { mode = b.dataset.mode; applyMode(); };
  });

  tempEl.oninput = () => { tempVal.textContent = parseFloat(tempEl.value).toFixed(1); renderCandidates(); };
  root.querySelector("#stepBtn").onclick = step;
  root.querySelector("#resetBtn").onclick = () => { context = [...startWords]; lastPick = null; statusEl.textContent = ""; update(); };

  root.querySelector("#seedBtn").onclick = () => {
    const raw = tokenize(seedEl.value);
    if (!raw.length) return;
    context = raw;
    lastPick = null;
    statusEl.textContent = "";
    update();
  };

  root.querySelector("#autoBtn").onclick = () => {
    let n = 0;
    const timer = setInterval(() => { if (!step() || ++n > 18) clearInterval(timer); }, 280);
  };

  applyMode();
  update();
}
