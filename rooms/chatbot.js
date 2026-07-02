// Phòng — Chatbot mini: ghép token + ý nghĩa + đoán câu trả lời. Song ngữ.
import { sfx } from "../sound.js";
import { tx, getLang } from "../i18n.js";

// Mỗi mục: từ khóa (cả vi & en) + câu trả lời song ngữ.
const KB = [
  { keys: ["học", "training", "dữ liệu", "dạy", "learn", "data", "teach"],
    a: { vi: "AI học từ ví dụ: bạn cho nó xem nhiều dữ liệu, nó tự rút ra mẫu hình — như ở phòng 'Tự tay dạy AI'.",
         en: "AI learns from examples: you show it lots of data and it extracts patterns — like the 'Teach an AI' room." } },
  { keys: ["nơ-ron", "neural", "mạng", "deep", "sâu", "network", "neuron"],
    a: { vi: "Mạng nơ-ron gồm nhiều đơn vị tính toán nhỏ. Ghép nhiều lớp lại (deep learning) giúp AI học được mẫu hình phức tạp.",
         en: "A neural network is many tiny compute units. Stacking layers (deep learning) lets AI learn complex patterns." } },
  { keys: ["token", "cắt", "chữ", "split", "text"],
    a: { vi: "AI không đọc từng chữ — nó cắt văn bản thành 'token' và xử lý theo token. Đó cũng là cách tính chi phí.",
         en: "AI doesn't read letter by letter — it splits text into 'tokens' and works by token. That's also how cost is billed." } },
  { keys: ["nghĩa", "embedding", "từ", "tọa độ", "bản đồ", "meaning", "word", "map"],
    a: { vi: "AI biến mỗi từ thành một điểm tọa độ. Từ gần nghĩa nằm gần nhau, nên nó tính được 'vua − đàn ông + đàn bà = nữ hoàng'.",
         en: "AI turns each word into a coordinate point. Similar words sit close, so it computes 'king − man + woman = queen'." } },
  { keys: ["attention", "chú ý", "ngữ cảnh", "nó", "context"],
    a: { vi: "Với mỗi từ, AI 'chú ý' tới các từ liên quan trong câu để hiểu ngữ cảnh — đó là cơ chế attention của Transformer.",
         en: "For each word, AI 'attends' to related words to grasp context — that's the Transformer's attention mechanism." } },
  { keys: ["đoán", "xác suất", "ảo giác", "hallucination", "sai", "guess", "probability", "wrong"],
    a: { vi: "AI sinh chữ bằng cách đoán từ tiếp theo theo xác suất. Vì không kiểm chứng sự thật, đôi khi nó 'ảo giác': sai mà nghe rất thật.",
         en: "AI writes by guessing the next word by probability. Not verifying facts, it sometimes 'hallucinates': wrong but convincing." } },
  { keys: ["ảnh", "diffusion", "vẽ", "tạo", "image", "draw", "generate"],
    a: { vi: "AI tạo ảnh bằng diffusion: bắt đầu từ nhiễu rồi khử nhiễu dần theo câu lệnh của bạn cho tới khi hiện ra hình.",
         en: "AI makes images via diffusion: start from noise and denoise step by step per your prompt until the image appears." } },
  { keys: ["thiên kiến", "bias", "công bằng", "định kiến", "fair"],
    a: { vi: "AI học cả định kiến trong dữ liệu của con người. Dữ liệu lệch thì AI cũng lệch — nên cần dùng có trách nhiệm.",
         en: "AI learns the biases in human data. Skewed data means a skewed AI — so use it responsibly." } },
  { keys: ["cây", "quyết định", "luật", "giải thích", "tree", "decision", "rule", "explain"],
    a: { vi: "Cây quyết định là kiểu AI minh bạch: nó ra quyết định qua chuỗi câu hỏi có/không mà ai cũng đọc hiểu được.",
         en: "A decision tree is a transparent AI: it decides via a chain of yes/no questions anyone can read." } },
  { keys: ["overfitting", "học vẹt", "thuộc lòng", "memorize"],
    a: { vi: "Overfitting là khi AI học thuộc lòng dữ liệu cũ nhưng làm dở với dữ liệu mới. Chữa bằng nhiều dữ liệu hơn hoặc giảm độ phức tạp.",
         en: "Overfitting is when AI memorizes old data but does poorly on new data. Fix it with more data or less complexity." } },
  { keys: ["tăng cường", "reinforcement", "thưởng", "phạt", "robot", "reward"],
    a: { vi: "Học tăng cường: AI tự thử, được thưởng khi làm tốt và tự điều chỉnh — không cần đáp án có sẵn.",
         en: "Reinforcement learning: AI tries things, gets rewarded for good moves, and tunes itself — no answer key needed." } },
];

const FALLBACK = {
  vi: "Mình là chatbot mini, chỉ biết về các khái niệm trong hành trình này thôi 😅 Thử hỏi về 'token', 'attention', 'ảo giác', 'thiên kiến'...",
  en: "I'm a mini chatbot, I only know the concepts from this journey 😅 Try asking about 'token', 'attention', 'hallucination', 'bias'...",
};

const SUGGEST = {
  vi: ["AI học bằng cách nào?", "Token là gì?", "Vì sao AI bị ảo giác?", "AI có thiên kiến không?", "AI tạo ảnh thế nào?"],
  en: ["How does AI learn?", "What is a token?", "Why does AI hallucinate?", "Is AI biased?", "How does AI make images?"],
};

function tokenize(s) { return s.toLowerCase().match(/[\p{L}\p{N}-]+/gu) || []; }

function answer(q) {
  const toks = new Set(tokenize(q));
  const ql = q.toLowerCase();
  let best = null, bestScore = 0;
  for (const item of KB) {
    let score = 0;
    for (const k of item.keys) if (toks.has(k) || ql.includes(k)) score++;
    if (score > bestScore) { bestScore = score; best = item; }
  }
  return bestScore > 0 ? tx(best.a) : tx(FALLBACK);
}

export function roomChatbot(root) {
  root.innerHTML = `
    <p class="room-intro">
      ${tx(
        "Một trợ lý AI không phải phép màu — nó là sự <strong>ghép lại</strong> của những mảnh ghép bạn vừa học: cắt câu thành token → hiểu ý nghĩa → chú ý vào phần quan trọng → đoán câu trả lời hợp lý. Hãy hỏi chatbot mini này thử, và xem nó xử lý câu của bạn qua từng bước.",
        "An AI assistant is no magic — it's a <strong>combination</strong> of the pieces you just learned: split into tokens → grasp meaning → attend to what matters → guess a sensible reply. Ask this mini chatbot and watch it process your sentence step by step."
      )}
    </p>

    <div class="row">
      <div class="panel" style="flex:1.3;">
        <h4>${tx("💬 Trò chuyện", "💬 Chat")}</h4>
        <div id="chatLog" style="min-height:220px; max-height:340px; overflow-y:auto; display:flex; flex-direction:column; gap:10px;"></div>
        <div class="row mt" style="gap:8px;">
          <input type="text" id="chatInput" placeholder="${tx("Hỏi mình về AI...", "Ask me about AI...")}" style="flex:3;" />
          <button class="btn" id="chatSend" style="flex:1; min-width:90px;">${tx("Gửi", "Send")}</button>
        </div>
        <div id="chatSuggest" class="mt"></div>
      </div>

      <div class="panel">
        <h4>${tx("⚙️ AI đang làm gì với câu của bạn", "⚙️ What the AI does with your sentence")}</h4>
        <div id="pipeline">
          <div class="pipe-step" data-step="0">${tx("1️⃣ Cắt thành token", "1️⃣ Split into tokens")}</div>
          <div class="pipe-step" data-step="1">${tx("2️⃣ Hiểu ý nghĩa / từ khóa", "2️⃣ Grasp meaning / keywords")}</div>
          <div class="pipe-step" data-step="2">${tx("3️⃣ Tìm câu trả lời hợp nhất", "3️⃣ Find the best answer")}</div>
          <div class="pipe-step" data-step="3">${tx("4️⃣ Trả lời", "4️⃣ Reply")}</div>
        </div>
        <div id="pipeDetail" class="muted mt"></div>
      </div>
    </div>

    <div class="takeaway">
      ${tx(
        "💡 <strong>Điều cốt lõi:</strong> Trợ lý AI thật (như ChatGPT) cũng đi qua chuỗi bước tương tự, chỉ là ở quy mô khổng lồ và bước \"đoán câu trả lời\" tinh vi hơn rất nhiều. Hiểu được các mảnh ghép, bạn sẽ thấy AI không huyền bí — nó là nhiều ý tưởng đơn giản xếp chồng lên nhau.",
        "💡 <strong>Key idea:</strong> A real AI assistant (like ChatGPT) goes through similar steps, just at massive scale with a far more sophisticated \"guess the reply\" step. Once you see the pieces, AI feels less mysterious — it's many simple ideas stacked together."
      )}
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

  function lightStep(i) { steps.forEach((s, k) => s.classList.toggle("active", k === i)); }
  function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

  async function send(text) {
    if (!text.trim()) return;
    bubble(text, "user");
    input.value = "";
    sfx.pop();

    const toks = tokenize(text);
    lightStep(0);
    detail.innerHTML = `${tx("Token:", "Tokens:")} ${toks.map((t) => `<span class="tok" style="background:rgba(var(--accent-rgb),0.18)">${t}</span>`).join(" ")}`;
    await wait(550);
    lightStep(1);
    detail.innerHTML += `<br/>${tx("Đang dò các từ khóa quen thuộc...", "Scanning for familiar keywords...")}`;
    await wait(550);
    lightStep(2);
    detail.innerHTML += `<br/>${tx("So khớp với kho tri thức để chọn câu trả lời hợp nhất.", "Matching the knowledge base to pick the best answer.")}`;
    await wait(550);
    lightStep(3);
    const a = answer(text);
    const typing = bubble("...", "bot");
    await wait(300);
    typing.textContent = a;
    sfx.success();
    setTimeout(() => lightStep(-1), 800);
  }

  root.querySelector("#chatSend").onclick = () => send(input.value);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") send(input.value); });

  const sg = root.querySelector("#chatSuggest");
  (SUGGEST[getLang()] || SUGGEST.vi).forEach((q) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = q;
    tag.onclick = () => send(q);
    sg.appendChild(tag);
  });

  bubble(tx("Chào bạn! Mình là chatbot mini của AI Explorer. Hỏi mình bất cứ điều gì về AI bạn vừa học nhé 🤖",
            "Hi! I'm AI Explorer's mini chatbot. Ask me anything about the AI you just learned 🤖"), "bot");
}
