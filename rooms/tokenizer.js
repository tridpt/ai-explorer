// Phòng — Token là gì? Song ngữ.
import { sfx } from "../sound.js";
import { tx, getLang } from "../i18n.js";
import { getParam, setParams } from "../roomstate.js";

const COMMON = new Set([
  "tôi", "bạn", "là", "và", "của", "có", "không", "một", "ai", "học", "máy",
  "the", "a", "is", "to", "of", "and", "in", "it", "you", "i",
]);

function tokenize(text) {
  const tokens = [];
  const parts = text.match(/[\p{L}\p{N}]+|[^\s\p{L}\p{N}]/gu) || [];
  for (const p of parts) {
    if (/[^\p{L}\p{N}]/u.test(p)) { tokens.push(p); continue; }
    const low = p.toLowerCase();
    if (COMMON.has(low) || p.length <= 3) {
      tokens.push(p);
    } else {
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
const PRICE_PER_1K = 600;

const SAMPLES = {
  vi: [
    "Tôi đang học cách trí tuệ nhân tạo hoạt động.",
    "Internationalization is a very long English word!",
    "Chào bạn 👋 hôm nay trời đẹp quá 🌤️",
  ],
  en: [
    "I am learning how artificial intelligence works.",
    "Internationalization is a very long English word!",
    "Hey there 👋 what a beautiful day today 🌤️",
  ],
};

export function roomTokenizer(root) {
  // Deep-link: nếu URL có ?text=... thì mở đúng câu đó để chia sẻ demo cụ thể.
  const shared = getParam("text");
  const defaultText = shared ?? tx("Tôi đang học cách trí tuệ nhân tạo hoạt động.", "I am learning how artificial intelligence works.");
  root.innerHTML = `
    <p class="room-intro">
      ${tx(
        "Trước khi \"hiểu\" bất cứ điều gì, AI phải <strong>cắt nhỏ văn bản</strong> thành những mảnh gọi là <em>token</em> — có khi là cả từ, có khi chỉ là một phần của từ. AI tính tiền và xử lý theo số token, chứ không theo số chữ. Gõ thử để xem nó cắt câu của bạn ra sao.",
        "Before \"understanding\" anything, AI must <strong>chop text</strong> into pieces called <em>tokens</em> — sometimes whole words, sometimes just parts. AI charges and processes by token count, not by letters. Type to see how it splits your sentence."
      )}
    </p>

    <div class="panel">
      <h4>${tx("✂️ Nhập câu bất kỳ", "✂️ Enter any sentence")}</h4>
      <textarea id="tkInput" rows="3">${defaultText}</textarea>
      <div class="mt">
        <span class="muted">${tx("Hoặc thử nhanh:", "Or try quickly:")}</span>
        <div id="tkSamples" class="mt"></div>
      </div>
    </div>

    <div class="panel">
      <h4>${tx("🧩 AI nhìn thấy các token này", "🧩 The AI sees these tokens")}</h4>
      <div id="tkOut" style="font-size:18px; line-height:2.2;"></div>
      <div class="row mt">
        <div class="stat"><div class="stat-num" id="tkChars">0</div><div class="muted">${tx("ký tự bạn gõ", "characters typed")}</div></div>
        <div class="stat"><div class="stat-num" id="tkTokens">0</div><div class="muted">${tx("token AI thấy", "tokens seen")}</div></div>
        <div class="stat"><div class="stat-num" id="tkCost">0đ</div><div class="muted">${tx("chi phí ước tính*", "estimated cost*")}</div></div>
      </div>
      <p class="muted mt">${tx(
        `*Giả định ${PRICE_PER_1K}đ / 1.000 token — chỉ để minh họa cách tính tiền theo token.`,
        `*Assuming ${PRICE_PER_1K}đ / 1,000 tokens — just to illustrate token-based pricing.`
      )}</p>
    </div>

    <div class="panel">
      <h4>${tx("🌍 Cùng một ý — tiếng Việt vs tiếng Anh", "🌍 Same meaning — Vietnamese vs English")}</h4>
      <p class="muted">${tx("AI phần lớn được huấn luyện trên tiếng Anh, nên tiếng Việt (nhiều dấu, ít gặp hơn) thường bị cắt vụn hơn — tốn nhiều token hơn cho cùng một ý.", "Most AI is trained on English, so Vietnamese (accented, rarer) tends to be chopped finer — more tokens for the same meaning.")}</p>
      <div id="tkCompare" class="mt"></div>
    </div>

    <div class="takeaway">
      ${tx(
        "💡 <strong>Điều cốt lõi:</strong> AI không thấy \"chữ\" như ta. Nó thấy các token. Vì thế tiếng Anh thông dụng thường tốn ít token hơn, từ hiếm/dài bị xé thành nhiều mảnh, và mỗi token bạn gửi đi đều tốn một chút chi phí tính toán — đó là lý do các dịch vụ AI tính tiền theo token.",
        "💡 <strong>Key idea:</strong> AI doesn't see \"letters\" like we do. It sees tokens. Common English often costs fewer tokens, rare/long words get torn into pieces, and every token you send costs a bit of compute — that's why AI services bill by token."
      )}
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
        return `<span class="tok" style="background:${c}33; border:1px solid ${c}; color:var(--ink); font-weight:700">${t.replace(/ /g, "·")}</span>`;
      })
      .join("");
    root.querySelector("#tkChars").textContent = text.length;
    root.querySelector("#tkTokens").textContent = tokens.length;
    const cost = Math.round((tokens.length / 1000) * PRICE_PER_1K);
    root.querySelector("#tkCost").textContent = cost + "đ";
  }

  // Ghi câu vào URL (gọn nhẹ, có debounce) để nút "Chia sẻ" mang theo đúng câu đang gõ.
  let saveTimer = null;
  function persist() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => setParams({ text: input.value.trim() || null }), 300);
  }

  input.oninput = () => { render(); persist(); };

  // Bảng so sánh Việt–Anh: vài cặp câu cùng nghĩa.
  const PAIRS = [
    { vi: "Xin chào, hôm nay bạn thế nào?", en: "Hello, how are you today?" },
    { vi: "Trí tuệ nhân tạo đang thay đổi thế giới.", en: "Artificial intelligence is changing the world." },
    { vi: "Tôi thích uống cà phê vào buổi sáng.", en: "I like drinking coffee in the morning." },
  ];
  const cmpEl = root.querySelector("#tkCompare");
  PAIRS.forEach((p) => {
    const nVi = tokenize(p.vi).length;
    const nEn = tokenize(p.en).length;
    const max = Math.max(nVi, nEn);
    const row = document.createElement("div");
    row.className = "tk-cmp";
    row.innerHTML = `
      <div class="tk-cmp-line">
        <span class="tk-flag">🇻🇳</span>
        <span class="tk-sent">${p.vi}</span>
        <div class="bar-track tk-bar"><div class="bar-fill" style="width:${(nVi / max) * 100}%">${nVi}</div></div>
      </div>
      <div class="tk-cmp-line">
        <span class="tk-flag">🇬🇧</span>
        <span class="tk-sent">${p.en}</span>
        <div class="bar-track tk-bar"><div class="bar-fill" style="width:${(nEn / max) * 100}%; background:linear-gradient(90deg,#34d399,#22d3ee)">${nEn}</div></div>
      </div>
      <div class="tk-cmp-note muted">${tx(
        `→ Cùng một ý, tiếng Việt tốn <b>${nVi}</b> token, tiếng Anh <b>${nEn}</b> token${nVi > nEn ? ` (nhiều hơn ${nVi - nEn})` : ""}.`,
        `→ Same meaning: Vietnamese uses <b>${nVi}</b> tokens, English <b>${nEn}</b>${nVi > nEn ? ` (${nVi - nEn} more)` : ""}.`
      )}</div>`;
    cmpEl.appendChild(row);
  });

  const samplesDiv = root.querySelector("#tkSamples");
  (SAMPLES[getLang()] || SAMPLES.vi).forEach((s) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = s.length > 32 ? s.slice(0, 32) + "…" : s;
    tag.onclick = () => { input.value = s; render(); persist(); sfx.pop(); };
    samplesDiv.appendChild(tag);
  });

  render();
}
