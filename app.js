// AI Explorer — router & điều hướng "hành trình qua các phòng" (song ngữ VN/EN)
import { renderHome } from "./rooms/home.js";
import { ROOM_META } from "./rooms-meta.js";
import { ROOM_LOADERS } from "./room-loaders.js";
import { sfx, isMuted, setMuted } from "./sound.js";
import { markVisited, getVisited } from "./store.js";
import { getLang, setLang, tx } from "./i18n.js";
import { initAnalytics, trackView } from "./analytics.js";
import { parseHash, buildShareUrl } from "./roomstate.js";
import { renderMicroQuiz, hasMicroQuiz } from "./roomquiz.js";
import { renderTrustPanel } from "./roomtrust.js";

// Thứ tự các phòng = mạch kể chuyện của hành trình. title/question/blurb song ngữ.
// ROOMS = metadata (rooms-meta.js) + loader tương ứng (room-loaders.js).
// Metadata tách riêng để prerender SEO (build-seo.mjs) đọc được từ Node.
export const ROOMS = ROOM_META.map((meta) => ({ ...meta, render: ROOM_LOADERS[meta.id] }));

// Chuỗi giao diện chung
const UI = {
  soundTitle: { vi: "Bật/tắt âm thanh", en: "Toggle sound" },
  presentTitle: { vi: "Chế độ trình chiếu (toàn màn hình)", en: "Presentation mode (fullscreen)" },
  langTitle: { vi: "Chuyển sang tiếng Anh", en: "Switch to Vietnamese" },
  start: { vi: "Bắt đầu", en: "Start" },
  nextRoom: { vi: "Phòng tiếp:", en: "Next:" },
  journeyEnd: { vi: "Hết hành trình", en: "End of journey" },
  close: { vi: "đóng", en: "close" },
  searchTitle: { vi: "Tìm phòng (phím /)", en: "Search rooms (press /)" },
  searchPlaceholder: { vi: "Tìm khái niệm hoặc phòng… (token, attention, gợi ý…)", en: "Search a concept or room… (token, attention, recommend…)" },
  searchEmpty: { vi: "Không tìm thấy phòng nào phù hợp.", en: "No matching room found." },
  shareRoom: { vi: "🔗 Chia sẻ", en: "🔗 Share" },
  shareRoomTitle: { vi: "Chia sẻ phòng này (kèm trạng thái hiện tại)", en: "Share this room (with its current state)" },
  shareCopied: { vi: "✓ Đã copy link phòng vào clipboard!", en: "✓ Room link copied to clipboard!" },
  shareFail: { vi: "Copy link trên thanh địa chỉ để chia sẻ nhé.", en: "Copy the address-bar URL to share." },
  searchHint: { vi: "↑↓ để chọn · Enter để mở · Esc để đóng", en: "↑↓ to move · Enter to open · Esc to close" },
};

// Từ khóa tìm kiếm cho mỗi phòng (song ngữ, giúp gõ khái niệm là ra phòng).
const SEARCH_KEYWORDS = {
  teachable: "webcam knn dữ liệu huấn luyện training data dạy ví dụ pose tư thế",
  "neural-net": "mạng nơ-ron neural network mlp neuron perceptron layer lớp",
  overfitting: "overfitting học vẹt memorize generalize tổng quát train test",
  "decision-tree": "cây quyết định decision tree rule luật if else minh bạch",
  reinforcement: "reinforcement rl học tăng cường reward thưởng phạt robot agent",
  clustering: "clustering kmeans phân nhóm unsupervised không giám sát group cụm",
  tokenizer: "token tokenizer cắt chữ subword chi phí cost bpe",
  embeddings: "embedding vector nghĩa meaning word2vec analogy loại suy bản đồ",
  attention: "attention transformer chú ý ngữ cảnh context self-attention",
  "next-token": "next token bigram hallucination ảo giác xác suất temperature nhiệt độ sinh chữ",
  diffusion: "diffusion tạo ảnh image generation nhiễu noise denoise stable",
  recommendation: "recommendation gợi ý recommender tiktok youtube netflix collaborative",
  bias: "bias thiên kiến định kiến fairness công bằng giới tính",
  adversarial: "adversarial đánh lừa nhiễu perturbation robustness an toàn attack",
  turing: "turing test người hay ai human detection phân biệt văn",
  chatbot: "chatbot trợ lý assistant pipeline llm conversation trò chuyện",
  rag: "rag retrieval tra cứu tài liệu document grounding nguồn citation vector search knowledge base tri thức",
  finetune: "fine-tuning finetune prompting prompt huấn luyện lại trọng số weights lora dạy thêm adapt",
  agents: "agent agents công cụ tool tool-use react planning kế hoạch nhiều bước autonomous tự động function calling",
  multimodal: "multimodal đa phương thức ảnh chữ image text vision caption clip gpt-4v gemini nhìn",
  "context-window": "context window cửa sổ ngữ cảnh token nhớ memory quên forget lịch sử history hội thoại conversation giới hạn limit",
  "prompt-injection": "prompt injection jailbreak đánh lừa an toàn safety security system prompt chỉ dẫn hệ thống bảo mật tấn công attack bỏ qua ignore lộ bí mật secret",
  rlhf: "rlhf reinforcement learning human feedback phản hồi con người xếp hạng reward model phần thưởng căn chỉnh alignment huấn luyện chatgpt lịch sự hữu ích preference so sánh",
  energy: "energy điện năng lượng power tốn điện chi phí carbon co2 môi trường environment gpu data center trung tâm dữ liệu quy mô scale watt kwh nước làm mát",
  reasoning: "reasoning suy nghĩ tư duy chain of thought cot từng bước step by step reasoning model o1 deepseek r1 thinking nghĩ lý luận logic bài toán problem solving độ chính xác accuracy",
  summary: "summary tổng kết quiz huy hiệu badge recap ôn tập",
};

const THEME = {
  home:        ["#ff5c00", "#ffd23f", "255,92,0"],
  teachable:   ["#ff7a59", "#ffb15c", "255,122,89"],
  "neural-net":["#34d399", "#22d3ee", "52,211,153"],
  overfitting: ["#fb7185", "#fb923c", "251,113,133"],
  "decision-tree":["#4ade80", "#a3e635", "74,222,128"],
  reinforcement: ["#f59e0b", "#f43f5e", "245,158,11"],
  clustering:  ["#14b8a6", "#22d3ee", "20,184,166"],
  tokenizer:   ["#22d3ee", "#6ea8fe", "34,211,238"],
  embeddings:  ["#6ea8fe", "#818cf8", "110,168,254"],
  attention:   ["#b07bff", "#e879f9", "176,123,255"],
  "next-token":["#fbbf24", "#fb923c", "251,191,36"],
  diffusion:   ["#e879f9", "#818cf8", "232,121,249"],
  recommendation: ["#0ea5e9", "#38bdf8", "14,165,233"],
  bias:        ["#f472b6", "#fb7185", "244,114,182"],
  adversarial: ["#ef4444", "#f59e0b", "239,68,68"],
  turing:      ["#8b5cf6", "#a855f7", "139,92,246"],
  chatbot:     ["#38bdf8", "#818cf8", "56,189,248"],
  rag:         ["#0ea5e9", "#22d3ee", "14,165,233"],
  finetune:    ["#f59e0b", "#a855f7", "245,158,11"],
  agents:      ["#10b981", "#6ea8fe", "16,185,129"],
  multimodal:  ["#e879f9", "#38bdf8", "232,121,249"],
  "context-window": ["#f59e0b", "#22d3ee", "245,158,11"],
  "prompt-injection": ["#ef4444", "#f43f5e", "239,68,68"],
  rlhf:        ["#10b981", "#fbbf24", "16,185,129"],
  energy:      ["#f59e0b", "#84cc16", "245,158,11"],
  reasoning:   ["#8b5cf6", "#22d3ee", "139,92,246"],
  summary:     ["#34d399", "#6ea8fe", "52,211,153"],
};

// Độ sáng tương đối (WCAG) của một màu hex.
function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
function contrast(l1, l2) { return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); }

// Làm đậm dần một màu (nhân hệ số) tới khi đạt tương phản ≥4.5:1 với nền sáng.
// Nhờ vậy chữ màu theo tông từng phòng vẫn đọc được (accessibility) mà không đổi màu khối.
const BG_LUM = luminance("#fffbf0"); // nền kem sáng nhất trong app
function darkenForText(hex) {
  let n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  for (let i = 0; i < 24; i++) {
    const cur = "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
    if (contrast(luminance(cur), BG_LUM) >= 4.5) return cur;
    r = Math.round(r * 0.9); g = Math.round(g * 0.9); b = Math.round(b * 0.9);
  }
  return "#111111";
}

function applyTheme(id) {
  const [a, a2, rgb] = THEME[id] || THEME.home;
  const r = document.documentElement.style;
  r.setProperty("--accent", a);
  r.setProperty("--accent-2", a2);
  r.setProperty("--accent-rgb", rgb);
  r.setProperty("--accent-ink", darkenForText(a)); // biến màu ĐẬM chỉ dùng cho chữ
}

// Gợi ý onboarding song ngữ (hiện 1 lần mỗi phòng)
const HINTS = {
  teachable: { vi: "👉 Bấm <b>Bật webcam</b>, rồi chụp vài mẫu cho mỗi tư thế để dạy AI.", en: "👉 Click <b>Start webcam</b>, then capture a few samples per pose to teach the AI." },
  "neural-net": { vi: "👉 Thử để <b>1 nơ-ron</b> rồi bấm Huấn luyện — xem AI 'bó tay'. Sau đó tăng lên 8.", en: "👉 Try <b>1 neuron</b> then Train — watch the AI struggle. Then bump it up to 8." },
  overfitting: { vi: "👉 Bấm <b>Huấn luyện</b> với ít dữ liệu — xem AI 'học vẹt'. Rồi kéo lượng dữ liệu lên cao.", en: "👉 Click <b>Train</b> with little data — watch it memorize. Then raise the data amount." },
  "decision-tree": { vi: "👉 Bấm các câu trả lời để đi qua cây — đường đi sẽ sáng lên ở sơ đồ dưới.", en: "👉 Click the answers to walk the tree — your path lights up in the diagram below." },
  reinforcement: { vi: "👉 Bấm <b>Học 100 lượt</b> vài lần, rồi bấm <b>Xem robot tự đi</b> để thấy nó tới đích.", en: "👉 Click <b>Train 100 rounds</b> a few times, then <b>Watch the robot go</b> to see it reach the goal." },
  clustering: { vi: "👉 Bấm <b>Chạy tới khi ổn định</b> để xem AI tự tách dữ liệu thành các nhóm.", en: "👉 Click <b>Run until stable</b> to watch the AI split the data into groups by itself." },
  tokenizer: { vi: "👉 Gõ một câu (cả tiếng Anh, emoji) và xem AI cắt nó thành token thế nào.", en: "👉 Type a sentence (English, emoji too) and see how the AI splits it into tokens." },
  embeddings: { vi: "👉 Bấm một phép tính ở mục <b>Thử nhanh</b> để thấy AI suy ra từ thứ tư.", en: "👉 Click a preset under <b>Quick try</b> to see the AI infer the fourth word." },
  attention: { vi: "👉 Bấm vào từ <b>nó</b> trong câu để xem AI đang chú ý vào đâu.", en: "👉 Click the word <b>it</b> in a sentence to see where the AI pays attention." },
  "next-token": { vi: "👉 Bấm <b>Tự viết cả câu</b>, rồi kéo thanh <b>nhiệt độ</b> lên cao và viết lại.", en: "👉 Click <b>Auto-write</b>, then push the <b>temperature</b> up and write again." },
  diffusion: { vi: "👉 Chọn một prompt rồi bấm <b>Tạo ảnh</b> — xem nhiễu biến thành hình dần dần.", en: "👉 Pick a prompt then click <b>Generate</b> — watch noise turn into an image." },
  recommendation: { vi: "👉 Bấm 👍 vài mục bạn thích để xem AI gợi ý thứ hợp gu.", en: "👉 Click 👍 on a few things you like to see the AI recommend more." },
  bias: { vi: "👉 Bấm lần lượt các nghề để xem AI 'đoán' giới tính lệch ra sao.", en: "👉 Click through the jobs to see how the AI's gender guesses skew." },
  adversarial: { vi: "👉 Kéo thanh <b>nhiễu</b> lên từ từ — để ý lúc AI đột nhiên đổi ý.", en: "👉 Slide the <b>noise</b> up slowly — watch the moment the AI suddenly flips." },
  turing: { vi: "👉 Đọc từng đoạn và đoán do người hay AI viết, rồi xem giải thích.", en: "👉 Read each passage, guess human or AI, then see the explanation." },
  chatbot: { vi: "👉 Bấm một câu hỏi gợi ý để xem chatbot xử lý qua từng bước.", en: "👉 Click a suggested question to watch the chatbot process it step by step." },
  rag: { vi: "👉 Đặt một câu hỏi để xem AI <b>tra tài liệu</b> rồi trả lời có dẫn nguồn.", en: "👉 Ask a question to see the AI <b>look up documents</b> then answer with citations." },
  finetune: { vi: "👉 So sánh <b>Prompting</b> và <b>Fine-tuning</b> — bấm qua lại để thấy khác biệt.", en: "👉 Compare <b>Prompting</b> vs <b>Fine-tuning</b> — toggle to see the difference." },
  agents: { vi: "👉 Giao một nhiệm vụ để xem agent <b>lên kế hoạch</b> và tự gọi công cụ từng bước.", en: "👉 Give a task to watch the agent <b>plan</b> and call tools step by step." },
  multimodal: { vi: "👉 Chọn một ảnh để xem AI vừa <b>nhìn</b> vừa <b>đọc chữ</b> và mô tả nó.", en: "👉 Pick an image to see the AI <b>see</b> and <b>read</b> it, then describe it." },
  "context-window": { vi: "👉 Bấm <b>+ Thêm tin nhắn</b> vài lần, rồi bấm <b>Hỏi lại</b> — xem AI có còn nhớ tin đầu không.", en: "👉 Click <b>+ Add message</b> a few times, then <b>Ask again</b> — see if the AI still remembers the first message." },
  "prompt-injection": { vi: "👉 Chọn một chiêu 😈, <b>tắt</b> lớp phòng thủ rồi Gửi — xem AI lộ bí mật. Sau đó bật lại và thử.", en: "👉 Pick an attack 😈, turn <b>off</b> defenses and Send — watch the AI leak. Then turn it back on and retry." },
  rlhf: { vi: "👉 Với mỗi cặp câu trả lời, bấm chọn cái bạn thấy tốt hơn — vài vòng là AI học được 'gu' của bạn.", en: "👉 For each pair of replies, click the one you prefer — a few rounds and the AI learns your 'taste'." },
  energy: { vi: "👉 Bấm chạy vài tác vụ AI, rồi kéo thanh <b>quy mô</b> lên hàng triệu người — xem điện cộng dồn thành gì.", en: "👉 Run a few AI tasks, then drag the <b>scale</b> slider up to millions of users — watch the energy add up." },
  reasoning: { vi: "👉 Chọn một bài, bấm <b>Trả lời ngay</b> (hay sai) rồi <b>Suy nghĩ từng bước</b> — so sánh hai kết quả.", en: "👉 Pick a problem, click <b>Answer instantly</b> (often wrong) then <b>Think step by step</b> — compare the two." },
  summary: { vi: "👉 Cuộn xuống cuối để làm <b>quiz</b> và nhận huy hiệu nhé!", en: "👉 Scroll down to take the <b>quiz</b> and earn your badge!" },
};
const hintsShown = new Set();

function showHint(id) {
  if (!HINTS[id] || hintsShown.has(id)) return;
  hintsShown.add(id);
  const bar = document.createElement("div");
  bar.className = "hint-bar";
  bar.innerHTML = `<span>${tx(HINTS[id])}</span><button class="hint-close" aria-label="${tx(UI.close)}">✕</button>`;
  document.body.appendChild(bar);
  const close = () => bar.classList.add("hide");
  bar.querySelector(".hint-close").onclick = close;
  setTimeout(close, 7000);
  bar.addEventListener("animationend", (e) => { if (e.animationName === "hintOut") bar.remove(); });
}

// ---------- Bảng tìm kiếm / nhảy nhanh phòng (phím "/") ----------
let searchOpen = false;

function openSearch() {
  if (searchOpen) return;
  searchOpen = true;

  const overlay = document.createElement("div");
  overlay.className = "search-overlay";
  overlay.innerHTML = `
    <div class="search-box" role="dialog" aria-modal="true" aria-label="${tx(UI.searchTitle)}">
      <input type="text" id="searchInput" class="search-input" role="combobox"
        aria-expanded="true" aria-controls="searchResults" aria-autocomplete="list"
        placeholder="${tx(UI.searchPlaceholder)}" autocomplete="off" spellcheck="false" />
      <div class="search-results" id="searchResults" role="listbox" aria-label="${tx(UI.searchTitle)}"></div>
      <div class="search-foot muted">${tx(UI.searchHint)}</div>
    </div>`;
  document.body.appendChild(overlay);

  const input = overlay.querySelector("#searchInput");
  const resultsEl = overlay.querySelector("#searchResults");
  const prevFocus = document.activeElement; // để trả lại focus khi đóng
  let matches = [];
  let active = 0;

  const norm = (s) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");

  function search(q) {
    const nq = norm(q.trim());
    if (!nq) return ROOMS.slice();
    return ROOMS.filter((r) => {
      const hay = norm(
        [tx(r.title), tx(r.question), tx(r.blurb), r.id, r.num, SEARCH_KEYWORDS[r.id] || ""].join(" ")
      );
      return hay.includes(nq);
    });
  }

  function renderResults() {
    resultsEl.innerHTML = "";
    if (!matches.length) {
      resultsEl.innerHTML = `<div class="search-empty muted">${tx(UI.searchEmpty)}</div>`;
      return;
    }
    matches.forEach((r, i) => {
      const item = document.createElement("div");
      item.className = "search-item" + (i === active ? " active" : "");
      item.id = "search-opt-" + i;
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", i === active ? "true" : "false");
      item.innerHTML = `
        <span class="si-icon" aria-hidden="true">${r.icon}</span>
        <span class="si-text">
          <b>${r.num} · ${tx(r.title)}</b>
          <small>${tx(r.question)}</small>
        </span>`;
      item.onmouseenter = () => { active = i; highlight(); };
      item.onclick = () => choose(i);
      resultsEl.appendChild(item);
    });
  }

  function highlight() {
    [...resultsEl.children].forEach((el, i) => {
      const on = i === active;
      el.classList.toggle("active", on);
      if (el.getAttribute("role") === "option") el.setAttribute("aria-selected", on ? "true" : "false");
    });
    const cur = resultsEl.children[active];
    cur?.scrollIntoView({ block: "nearest" });
    if (cur?.id) input.setAttribute("aria-activedescendant", cur.id);
  }

  function choose(i) {
    const r = matches[i];
    if (!r) return;
    close();
    navigate(r.id);
    sfx.pop();
  }

  function close() {
    searchOpen = false;
    overlay.remove();
    // Trả focus về phần tử đã mở overlay (thường là nút 🔍) để không "mất dấu" bàn phím.
    if (prevFocus && typeof prevFocus.focus === "function") prevFocus.focus();
  }

  function update() {
    matches = search(input.value);
    active = 0;
    renderResults();
  }

  input.addEventListener("input", update);
  overlay.addEventListener("mousedown", (e) => { if (e.target === overlay) close(); });
  overlay.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); active = Math.min(active + 1, matches.length - 1); highlight(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); active = Math.max(active - 1, 0); highlight(); }
    else if (e.key === "Enter") { e.preventDefault(); choose(active); }
    // Bẫy focus: ô nhập là phần tử focus duy nhất, giữ Tab/Shift+Tab quẩn trong dialog.
    else if (e.key === "Tab") { e.preventDefault(); input.focus(); }
  });

  update();
  input.focus();
}

// ---------- Chia sẻ phòng hiện tại (Web Share API, fallback clipboard) ----------
async function shareRoom(room) {
  // Dùng URL hiện tại để mang theo cả trạng thái deep-link (câu đang gõ, prompt đã chọn…).
  const url = location.href.includes("#") ? location.href : buildShareUrl(room.id);
  const title = "AI Explorer — " + tx(room.title);
  const text = tx(
    `${tx(room.question)} Khám phá trực quan trong "${tx(room.title)}" trên AI Explorer:`,
    `${tx(room.question)} Explore it visually in "${tx(room.title)}" on AI Explorer:`
  );
  if (navigator.share) {
    try { await navigator.share({ title, text, url }); return; } catch { /* người dùng hủy */ }
  }
  try {
    await navigator.clipboard.writeText(`${text} ${url}`);
    toast(tx(UI.shareCopied));
  } catch {
    toast(tx(UI.shareFail));
  }
}

// Thông báo nhỏ tự biến mất
function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.setAttribute("role", "status");
  t.setAttribute("aria-live", "polite");
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add("hide"), 2200);
  t.addEventListener("animationend", (e) => { if (e.animationName === "toastOut") t.remove(); });
}

// Thanh công cụ: ngôn ngữ + âm thanh + trình chiếu
function buildToolbar() {
  const tb = document.createElement("div");
  tb.className = "toolbar";
  tb.innerHTML = `
    <button class="tool-btn" id="searchBtn" title="${tx(UI.searchTitle)}" aria-label="${tx(UI.searchTitle)}">🔍</button>
    <button class="tool-btn" id="langBtn" title="${tx(UI.langTitle)}" aria-label="${tx(UI.langTitle)}"></button>
    <button class="tool-btn" id="soundBtn" title="${tx(UI.soundTitle)}" aria-label="${tx(UI.soundTitle)}" aria-pressed="false"></button>
    <button class="tool-btn" id="presentBtn" title="${tx(UI.presentTitle)}" aria-label="${tx(UI.presentTitle)}">⛶</button>
  `;
  document.querySelector(".topbar").appendChild(tb);

  tb.querySelector("#searchBtn").onclick = () => { openSearch(); sfx.click(); };

  const langBtn = tb.querySelector("#langBtn");
  const refreshLang = () => (langBtn.textContent = getLang() === "vi" ? "EN" : "VI");
  refreshLang();
  langBtn.onclick = () => { setLang(getLang() === "vi" ? "en" : "vi"); sfx.click(); };

  const soundBtn = tb.querySelector("#soundBtn");
  const refreshSound = () => {
    soundBtn.textContent = isMuted() ? "🔇" : "🔊";
    soundBtn.setAttribute("aria-pressed", isMuted() ? "false" : "true");
  };
  refreshSound();
  soundBtn.onclick = () => { setMuted(!isMuted()); refreshSound(); if (!isMuted()) sfx.pop(); };

  tb.querySelector("#presentBtn").onclick = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
    sfx.click();
  };
}

const app = document.getElementById("app");
const progressNav = document.getElementById("progressNav");
const routeStatus = document.getElementById("routeStatus");
const visited = getVisited();
let routeGeneration = 0;

function currentRoute() {
  return parseHash().id;
}

function renderProgress(activeId) {
  progressNav.innerHTML = "";
  ROOMS.forEach((room, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "progress-dot";
    dot.textContent = i + 1;
    const done = visited.has(room.id);
    const state = room.id === activeId ? tx("đang mở", "current") : done ? tx("đã xem", "visited") : tx("chưa xem", "not visited");
    dot.setAttribute("aria-label", `${tx("Phòng", "Room")} ${i + 1}: ${tx(room.title)} — ${state}`);
    dot.title = tx(room.title);
    if (room.id === activeId) { dot.classList.add("active"); dot.setAttribute("aria-current", "page"); }
    else if (done) dot.classList.add("done");
    dot.addEventListener("click", () => navigate(room.id));
    progressNav.appendChild(dot);
  });
}

function updateStaticCopy() {
  document.querySelector(".skip-link").textContent = tx("Bỏ qua tới nội dung", "Skip to content");
  document.getElementById("brandHome").setAttribute("aria-label", tx("Về trang chủ AI Explorer", "Go to AI Explorer home"));
  progressNav.setAttribute("aria-label", tx("Tiến trình các phòng", "Room progress"));
  document.querySelector(".footer span").textContent = tx(
    "Một hành trình tương tác để hiểu AI · Chạy hoàn toàn trên trình duyệt của bạn",
    "An interactive journey to understand AI · Runs entirely in your browser"
  );
  const footerLink = document.querySelector(".footer-link");
  if (footerLink) footerLink.textContent = tx("Quyền riêng tư", "Privacy");
}

function updatePageMetadata(room) {
  const homeTitle = tx("AI Explorer — Hiểu AI trong 15 phút", "AI Explorer — Understand AI in 15 minutes");
  const title = room ? `AI Explorer — ${tx(room.title)}` : homeTitle;
  const description = room
    ? tx(room.blurb)
    : tx(
        "Hành trình tương tác giúp bạn hiểu AI một cách trực quan: tự tay dạy AI, nhìn vào bên trong mô hình, và khám phá giới hạn của nó.",
        "An interactive journey to understand AI visually: teach it yourself, look inside models, and explore their limits."
      );
  document.title = title;
  document.querySelector('meta[name="description"]')?.setAttribute("content", description);
  document.querySelector('meta[property="og:title"]')?.setAttribute("content", title);
  document.querySelector('meta[property="og:description"]')?.setAttribute("content", description);
  document.querySelector('meta[name="twitter:title"]')?.setAttribute("content", title);
  document.querySelector('meta[name="twitter:description"]')?.setAttribute("content", description);
}

function finishRoute(room, moveFocus) {
  updatePageMetadata(room);
  updateStaticCopy();
  app.setAttribute("aria-busy", "false");
  routeStatus.textContent = "";
  requestAnimationFrame(() => {
    routeStatus.textContent = room
      ? tx(`Đã mở phòng ${tx(room.title)}`, `Opened room ${tx(room.title)}`)
      : tx("Đã mở trang chủ AI Explorer", "Opened AI Explorer home");
    if (moveFocus) {
      const heading = app.querySelector("h1, h2");
      if (heading) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      } else {
        app.focus({ preventScroll: true });
      }
    }
  });
}

export function navigate(id) {
  location.hash = id === "home" ? "" : `#/${id}`;
}

async function route({ moveFocus = false } = {}) {
  const generation = ++routeGeneration;
  const id = currentRoute();
  window.dispatchEvent(new CustomEvent("roomleave"));
  app.innerHTML = "";
  app.setAttribute("aria-busy", "true");
  window.scrollTo({ top: 0, behavior: "auto" });
  applyTheme(id === "home" ? "home" : id);
  const room0 = ROOMS.find((room) => room.id === id);
  trackView(id === "home" ? "/" : "/" + id, room0 ? tx(room0.title) : "AI Explorer");
  app.classList.remove("enter");
  void app.offsetWidth;
  app.classList.add("enter");

  if (id === "home") {
    renderProgress(null);
    renderHome(app, ROOMS, navigate);
    finishRoute(null, moveFocus);
    return;
  }

  const idx = ROOMS.findIndex((room) => room.id === id);
  if (idx === -1) {
    navigate("home");
    return;
  }

  const room = ROOMS[idx];
  visited.add(room.id);
  markVisited(room.id);
  renderProgress(room.id);

  const head = document.createElement("div");
  head.className = "room-head";
  head.innerHTML = `
    <div class="rh-icon" aria-hidden="true">${room.icon}</div>
    <div class="rh-text">
      <div class="rh-q">${tx(room.question)}</div>
      <h2>${tx(room.title)}</h2>
    </div>
    <button class="btn ghost rh-share" id="shareRoomBtn" title="${tx(UI.shareRoomTitle)}">${tx(UI.shareRoom)}</button>`;
  app.appendChild(head);
  head.querySelector("#shareRoomBtn").onclick = () => shareRoom(room);

  const body = document.createElement("div");
  body.innerHTML = `<div class="room-loading" role="status">${tx("Đang tải phòng…", "Loading room…")}</div>`;
  app.appendChild(body);

  try {
    const renderRoom = await room.render();
    if (generation !== routeGeneration || currentRoute() !== id) return;
    body.innerHTML = "";
    renderRoom(body);
    renderTrustPanel(body, room.id);
    if (room.id !== "summary" && hasMicroQuiz(room.id)) renderMicroQuiz(body, room.id);
    showHint(room.id);
  } catch (error) {
    if (generation !== routeGeneration) return;
    console.error(`Không thể tải phòng ${room.id}:`, error);
    body.innerHTML = `<div class="route-error" role="alert">${tx("Không thể tải phòng này. Hãy tải lại trang để thử lại.", "This room could not be loaded. Reload the page to try again.")}</div>`;
  }

  const navBtns = document.createElement("div");
  navBtns.className = "nav-buttons";
  const prev = ROOMS[idx - 1];
  const next = ROOMS[idx + 1];
  navBtns.innerHTML = `
    <button class="btn ghost" id="prevBtn">
      ← ${prev ? tx(prev.title) : tx(UI.start)}
    </button>
    <button class="btn" ${next ? "" : "disabled"} id="nextBtn">
      ${next ? tx(UI.nextRoom) + " " + tx(next.title) + " →" : tx(UI.journeyEnd)}
    </button>`;
  app.appendChild(navBtns);
  document.getElementById("prevBtn").onclick = () => navigate(prev ? prev.id : "home");
  if (next) document.getElementById("nextBtn").onclick = () => navigate(next.id);
  finishRoute(room, moveFocus);
}

const brandEl = document.getElementById("brandHome");
brandEl.addEventListener("click", (event) => {
  event.preventDefault();
  navigate("home");
});
window.addEventListener("hashchange", () => route({ moveFocus: true }));

// Đổi ngôn ngữ → dựng lại thanh công cụ + render lại phòng hiện tại, không cướp focus.
window.addEventListener("langchange", () => {
  document.querySelector(".toolbar")?.remove();
  buildToolbar();
  route({ moveFocus: false });
});

// Điều hướng bằng phím mũi tên (hợp cho trình chiếu)
window.addEventListener("keydown", (e) => {
  // Phím "/" mở nhanh ô tìm kiếm phòng (trừ khi đang gõ trong ô nhập)
  if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) {
    e.preventDefault();
    openSearch();
    return;
  }
  if (["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(document.activeElement?.tagName)) return;
  const id = currentRoute();
  const idx = ROOMS.findIndex((r) => r.id === id);
  if (e.key === "ArrowRight") {
    if (idx === -1) navigate(ROOMS[0].id);
    else if (idx < ROOMS.length - 1) navigate(ROOMS[idx + 1].id);
  } else if (e.key === "ArrowLeft") {
    if (idx > 0) navigate(ROOMS[idx - 1].id);
    else if (idx === 0) navigate("home");
  }
});

// Tiếng click nhẹ trên mọi nút / thẻ bấm
document.addEventListener("click", (e) => {
  if (e.target.closest(".btn, .tag, .progress-dot, .room-card, .bar-row")) sfx.click();
}, true);

buildToolbar();
initAnalytics();
route();
