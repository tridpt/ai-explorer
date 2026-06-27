// Phòng — Token là gì? AI không đọc từng chữ, nó cắt văn bản thành "token".
import { sfx } from "../sound.js";

// Tokenizer minh họa kiểu subword: từ ngắn/thông dụng = 1 token, từ dài bị cắt thành mảnh.
const COMMON = new Set([
  "tôi", "bạn", "là", "và", "của", "có", "không", "một", "ai", "học", "máy",
  "the", "a", "is", "to", "of", "and", "in", "it", "you", "i",
]);

function tokenize(text) {
  const tokens = [];
  // tách theo khoảng trắng & dấu câu nhưng giữ lại dấu câu làm token riêng
  const parts = text.match(/[\p{L}\p{N}]+|[^\s\p{L}\p{N}]/gu) || [];
  for (const p of parts) {
    if (/[^\p{L}\p{N}]/u.test(p)) { tokens.push(p); continue; } // dấu câu / emoji
    const low = p.toLowerCase();
    if (COMMON.has(low) || p.length <= 3) {
      tokens.push(p);
    } else {
      // cắt từ dài thành mảnh ~3-4 ký tự (mô phỏng subword)
      let i = 0;
      while (i < p.length) {
        const len = Math.min(4, p.length - i);
        tokens.push((i === 0 ? "" : "##") + p.slice(i, i + len));
        i += len;
      }
    }
  }
  return tokens;
}

const COLORS = ["#6ea8fe", "#b07bff", "#34d399", "#fbbf24", "#f472b6", "#22d3ee", "#fb923c"];
const PRICE_PER_1K = 600; // VND giả định cho 1.000 token, chỉ để minh họa

const SAMPLES = [
  "Tôi đang học cách trí tuệ nhân tạo hoạt động.",
  "Internationalization is a very long English word!",
  "Chào bạn 👋 hôm nay trời đẹp quá 🌤️",
];

export function roomTokenizer(root) {
  root.innerHTML = `
    <p class="room-intro">
      Trước khi "hiểu" bất cứ điều gì, AI phải <strong>cắt nhỏ văn bản</strong> thành những mảnh gọi là
      <em>token</em> — có khi là cả từ, có khi chỉ là một phần của từ. AI tính tiền và xử lý theo số token,
      chứ không theo số chữ. Gõ thử để xem nó cắt câu của bạn ra sao.
    </p>

    <div class="panel">
      <h4>✂️ Nhập câu bất kỳ</h4>
      <textarea id="tkInput" rows="3">Tôi đang học cách trí tuệ nhân tạo hoạt động.</textarea>
      <div class="mt">
        <span class="muted">Hoặc thử nhanh:</span>
        <div id="tkSamples" class="mt"></div>
      </div>
    </div>

    <div class="panel">
      <h4>🧩 AI nhìn thấy các token này</h4>
      <div id="tkOut" style="font-size:18px; line-height:2.2;"></div>
      <div class="row mt">
        <div class="stat"><div class="stat-num" id="tkChars">0</div><div class="muted">ký tự bạn gõ</div></div>
        <div class="stat"><div class="stat-num" id="tkTokens">0</div><div class="muted">token AI thấy</div></div>
        <div class="stat"><div class="stat-num" id="tkCost">0đ</div><div class="muted">chi phí ước tính*</div></div>
      </div>
      <p class="muted mt">*Giả định ${PRICE_PER_1K}đ / 1.000 token — chỉ để minh họa cách tính tiền theo token.</p>
    </div>

    <div class="takeaway">
      💡 <strong>Điều cốt lõi:</strong> AI không thấy "chữ" như ta. Nó thấy các token. Vì thế tiếng Anh
      thông dụng thường tốn ít token hơn, từ hiếm/dài bị xé thành nhiều mảnh, và mỗi token bạn gửi đi đều
      tốn một chút chi phí tính toán — đó là lý do các dịch vụ AI tính tiền theo token.
    </div>
  `;

  const input = root.querySelector("#tkInput");
  const out = root.querySelector("#tkOut");

  function render() {
    const text = input.value;
    const tokens = tokenize(text);
    out.innerHTML = tokens
      .map((t, i) => {
        const c = COLORS[i % COLORS.length];
        return `<span class="tok" style="background:${c}22; border:1px solid ${c}66; color:#f4f2fb">${t.replace(/ /g, "·")}</span>`;
      })
      .join("");
    root.querySelector("#tkChars").textContent = text.length;
    root.querySelector("#tkTokens").textContent = tokens.length;
    const cost = Math.round((tokens.length / 1000) * PRICE_PER_1K);
    root.querySelector("#tkCost").textContent = cost + "đ";
  }

  input.oninput = render;

  const samplesDiv = root.querySelector("#tkSamples");
  SAMPLES.forEach((s) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = s.length > 32 ? s.slice(0, 32) + "…" : s;
    tag.onclick = () => { input.value = s; render(); sfx.pop(); };
    samplesDiv.appendChild(tag);
  });

  render();
}
