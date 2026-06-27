// Phòng — Chatbot mini: ghép token + ý nghĩa + đoán câu trả lời thành một trợ lý.
import { sfx } from "../sound.js";

// Cơ sở tri thức nhỏ: mỗi mục có từ khóa + câu trả lời (về chính các khái niệm trong hành trình này).
const KB = [
  { keys: ["học", "training", "dữ liệu", "dạy"], a: "AI học từ ví dụ: bạn cho nó xem nhiều dữ liệu, nó tự rút ra mẫu hình — như ở phòng 'Tự tay dạy AI'." },
  { keys: ["nơ-ron", "neural", "mạng", "deep", "sâu"], a: "Mạng nơ-ron gồm nhiều đơn vị tính toán nhỏ. Ghép nhiều lớp lại (deep learning) giúp AI học được mẫu hình phức tạp." },
  { keys: ["token", "cắt", "chữ"], a: "AI không đọc từng chữ — nó cắt văn bản thành 'token' và xử lý theo token. Đó cũng là cách tính chi phí." },
  { keys: ["nghĩa", "embedding", "từ", "tọa độ", "bản đồ"], a: "AI biến mỗi từ thành một điểm tọa độ. Từ gần nghĩa nằm gần nhau, nên nó tính được 'vua − đàn ông + đàn bà = nữ hoàng'." },
  { keys: ["attention", "chú ý", "ngữ cảnh", "nó"], a: "Với mỗi từ, AI 'chú ý' tới các từ liên quan trong câu để hiểu ngữ cảnh — đó là cơ chế attention của Transformer." },
  { keys: ["đoán", "xác suất", "ảo giác", "hallucination", "sai"], a: "AI sinh chữ bằng cách đoán từ tiếp theo theo xác suất. Vì không kiểm chứng sự thật, đôi khi nó 'ảo giác': sai mà nghe rất thật." },
  { keys: ["ảnh", "diffusion", "vẽ", "tạo"], a: "AI tạo ảnh bằng diffusion: bắt đầu từ nhiễu rồi khử nhiễu dần theo câu lệnh của bạn cho tới khi hiện ra hình." },
  { keys: ["thiên kiến", "bias", "công bằng", "định kiến"], a: "AI học cả định kiến trong dữ liệu của con người. Dữ liệu lệch thì AI cũng lệch — nên cần dùng có trách nhiệm." },
  { keys: ["cây", "quyết định", "luật", "giải thích"], a: "Cây quyết định là kiểu AI minh bạch: nó ra quyết định qua chuỗi câu hỏi có/không mà ai cũng đọc hiểu được." },
  { keys: ["overfitting", "học vẹt", "thuộc lòng"], a: "Overfitting là khi AI học thuộc lòng dữ liệu cũ nhưng làm dở với dữ liệu mới. Chữa bằng nhiều dữ liệu hơn hoặc giảm độ phức tạp." },
];
const FALLBACK = "Mình là chatbot mini, chỉ biết về các khái niệm trong hành trình này thôi 😅 Thử hỏi về 'token', 'attention', 'ảo giác', 'thiên kiến'...";

const SUGGEST = ["AI học bằng cách nào?", "Token là gì?", "Vì sao AI bị ảo giác?", "AI có thiên kiến không?", "AI tạo ảnh thế nào?"];

function tokenize(s) {
  return s.toLowerCase().match(/[\p{L}\p{N}-]+/gu) || [];
}

// chọn câu trả lời theo số từ khóa khớp
function answer(q) {
  const toks = new Set(tokenize(q));
  let best = null, bestScore = 0;
  for (const item of KB) {
    let score = 0;
    for (const k of item.keys) if (toks.has(k) || q.toLowerCase().includes(k)) score++;
    if (score > bestScore) { bestScore = score; best = item; }
  }
  return bestScore > 0 ? best.a : FALLBACK;
}

export function roomChatbot(root) {
  root.innerHTML = `
    <p class="room-intro">
      Một trợ lý AI không phải phép màu — nó là sự <strong>ghép lại</strong> của những mảnh ghép bạn vừa học:
      cắt câu thành token → hiểu ý nghĩa → chú ý vào phần quan trọng → đoán câu trả lời hợp lý. Hãy hỏi
      chatbot mini này thử, và xem nó xử lý câu của bạn qua từng bước.
    </p>

    <div class="row">
      <div class="panel" style="flex:1.3;">
        <h4>💬 Trò chuyện</h4>
        <div id="chatLog" style="min-height:220px; max-height:340px; overflow-y:auto; display:flex; flex-direction:column; gap:10px;"></div>
        <div class="row mt" style="gap:8px;">
          <input type="text" id="chatInput" placeholder="Hỏi mình về AI..." style="flex:3;" />
          <button class="btn" id="chatSend" style="flex:1; min-width:90px;">Gửi</button>
        </div>
        <div id="chatSuggest" class="mt"></div>
      </div>

      <div class="panel">
        <h4>⚙️ AI đang làm gì với câu của bạn</h4>
        <div id="pipeline">
          <div class="pipe-step" data-step="0">1️⃣ Cắt thành token</div>
          <div class="pipe-step" data-step="1">2️⃣ Hiểu ý nghĩa / từ khóa</div>
          <div class="pipe-step" data-step="2">3️⃣ Tìm câu trả lời hợp nhất</div>
          <div class="pipe-step" data-step="3">4️⃣ Trả lời</div>
        </div>
        <div id="pipeDetail" class="muted mt"></div>
      </div>
    </div>

    <div class="takeaway">
      💡 <strong>Điều cốt lõi:</strong> Trợ lý AI thật (như ChatGPT) cũng đi qua chuỗi bước tương tự, chỉ là
      ở quy mô khổng lồ và bước "đoán câu trả lời" tinh vi hơn rất nhiều. Hiểu được các mảnh ghép, bạn sẽ
      thấy AI không huyền bí — nó là nhiều ý tưởng đơn giản xếp chồng lên nhau.
    </div>
  `;

  const log = root.querySelector("#chatLog");
  const input = root.querySelector("#chatInput");
  const detail = root.querySelector("#pipeDetail");
  const steps = [...root.querySelectorAll(".pipe-step")];

  function bubble(text, who) {
    const b = document.createElement("div");
    b.className = "chat-bubble " + who;
    b.textContent = text;
    log.appendChild(b);
    log.scrollTop = log.scrollHeight;
    return b;
  }

  function lightStep(i) {
    steps.forEach((s, k) => s.classList.toggle("active", k === i));
  }

  async function send(text) {
    if (!text.trim()) return;
    bubble(text, "user");
    input.value = "";
    sfx.pop();

    const toks = tokenize(text);
    // bước 1
    lightStep(0);
    detail.innerHTML = `Token: ${toks.map((t) => `<span class="tok" style="background:rgba(var(--accent-rgb),0.18)">${t}</span>`).join(" ")}`;
    await wait(550);
    // bước 2
    lightStep(1);
    detail.innerHTML += `<br/>Đang dò các từ khóa quen thuộc...`;
    await wait(550);
    // bước 3
    lightStep(2);
    detail.innerHTML += `<br/>So khớp với kho tri thức để chọn câu trả lời hợp nhất.`;
    await wait(550);
    // bước 4
    lightStep(3);
    const a = answer(text);
    const typing = bubble("...", "bot");
    await wait(300);
    typing.textContent = a;
    sfx.success();
    setTimeout(() => lightStep(-1), 800);
  }

  function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

  root.querySelector("#chatSend").onclick = () => send(input.value);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") send(input.value); });

  const sg = root.querySelector("#chatSuggest");
  SUGGEST.forEach((q) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = q;
    tag.onclick = () => send(q);
    sg.appendChild(tag);
  });

  bubble("Chào bạn! Mình là chatbot mini của AI Explorer. Hỏi mình bất cứ điều gì về AI bạn vừa học nhé 🤖", "bot");
}
