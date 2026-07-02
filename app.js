// AI Explorer — router & điều hướng "hành trình qua các phòng" (song ngữ VN/EN)
import { renderHome } from "./rooms/home.js";
import { roomTeachable } from "./rooms/teachable.js";
import { roomNeuralNet } from "./rooms/neural-net.js";
import { roomOverfitting } from "./rooms/overfitting.js";
import { roomDecisionTree } from "./rooms/decision-tree.js";
import { roomReinforcement } from "./rooms/reinforcement.js";
import { roomClustering } from "./rooms/clustering.js";
import { roomTokenizer } from "./rooms/tokenizer.js";
import { roomEmbeddings } from "./rooms/embeddings.js";
import { roomAttention } from "./rooms/attention.js";
import { roomNextToken } from "./rooms/next-token.js";
import { roomDiffusion } from "./rooms/diffusion.js";
import { roomRecommendation } from "./rooms/recommendation.js";
import { roomBias } from "./rooms/bias.js";
import { roomAdversarial } from "./rooms/adversarial.js";
import { roomTuring } from "./rooms/turing.js";
import { roomChatbot } from "./rooms/chatbot.js";
import { roomSummary } from "./rooms/summary.js";
import { sfx, isMuted, setMuted, celebrate } from "./sound.js";
import { markVisited, getVisited } from "./store.js";
import { getLang, setLang, tx } from "./i18n.js";
import { initAnalytics, trackView } from "./analytics.js";

// Thứ tự các phòng = mạch kể chuyện của hành trình. title/question/blurb song ngữ.
export const ROOMS = [
  {
    id: "teachable", icon: "📸", num: "01",
    title: { vi: "Tự tay dạy AI", en: "Teach an AI yourself" },
    question: { vi: "AI học như thế nào?", en: "How does AI learn?" },
    blurb: {
      vi: "Bật webcam, dạy AI phân biệt vài tư thế chỉ trong 30 giây. Hiểu 'dữ liệu huấn luyện' bằng chính tay bạn.",
      en: "Turn on your webcam and teach an AI to tell poses apart in 30 seconds. Grasp 'training data' hands-on.",
    },
    render: roomTeachable,
  },
  {
    id: "neural-net", icon: "🕸️", num: "02",
    title: { vi: "Bên trong mạng nơ-ron", en: "Inside a neural network" },
    question: { vi: "Bên trong AI là gì?", en: "What's inside an AI?" },
    blurb: {
      vi: "Kéo thanh trượt thay đổi số nơ-ron và xem AI vẽ ranh giới phân loại thay đổi theo thời gian thực.",
      en: "Drag a slider to change the neuron count and watch the AI's decision boundary reshape in real time.",
    },
    render: roomNeuralNet,
  },
  {
    id: "overfitting", icon: "🎯", num: "03",
    title: { vi: "Học vẹt hay hiểu thật?", en: "Memorizing or understanding?" },
    question: { vi: "AI có thực sự 'hiểu'?", en: "Does AI truly 'understand'?" },
    blurb: {
      vi: "Khám phá overfitting: khi AI nhớ vanh vách bài cũ nhưng làm sai bài mới — và cách chữa nó.",
      en: "Explore overfitting: when an AI aces old examples but fails new ones — and how to fix it.",
    },
    render: roomOverfitting,
  },
  {
    id: "decision-tree", icon: "🌳", num: "04",
    title: { vi: "Cây quyết định", en: "Decision tree" },
    question: { vi: "Có loại AI 'nhìn thấy' được luật?", en: "An AI whose rules you can see?" },
    blurb: {
      vi: "Một kiểu AI minh bạch: đi qua chuỗi câu hỏi có/không mà ai cũng kiểm tra được vì sao nó kết luận vậy.",
      en: "A transparent kind of AI: a chain of yes/no questions where anyone can check why it decided that way.",
    },
    render: roomDecisionTree,
  },
  {
    id: "reinforcement", icon: "🤖", num: "05",
    title: { vi: "Học qua thử và sai", en: "Learning by trial and error" },
    question: { vi: "AI học không cần đáp án thì sao?", en: "What if AI learns with no answer key?" },
    blurb: {
      vi: "Xem chú robot tự học đường tới đích bằng thưởng–phạt, không hề được chỉ trước — học tăng cường.",
      en: "Watch a robot learn its way to the goal via rewards and penalties, with no guidance — reinforcement learning.",
    },
    render: roomReinforcement,
  },
  {
    id: "clustering", icon: "🧲", num: "06",
    title: { vi: "Tự phân nhóm", en: "Grouping on its own" },
    question: { vi: "AI học mà không cần nhãn thì sao?", en: "What if AI learns with no labels?" },
    blurb: {
      vi: "Cho AI một đống dữ liệu lộn xộn — nó tự gom thành các nhóm giống nhau mà không ai chỉ. Học không giám sát.",
      en: "Give the AI a messy pile of data — it groups similar things by itself, unguided. Unsupervised learning.",
    },
    render: roomClustering,
  },
  {
    id: "tokenizer", icon: "✂️", num: "07",
    title: { vi: "Token là gì", en: "What is a token" },
    question: { vi: "AI đọc chữ kiểu gì?", en: "How does AI read text?" },
    blurb: {
      vi: "AI không thấy 'chữ' như ta — nó cắt câu thành token. Gõ thử và xem số token cùng chi phí.",
      en: "AI doesn't see 'letters' like we do — it slices text into tokens. Type and watch token count and cost.",
    },
    render: roomTokenizer,
  },
  {
    id: "embeddings", icon: "🗺️", num: "08",
    title: { vi: "Bản đồ ý nghĩa", en: "The map of meaning" },
    question: { vi: "AI hiểu nghĩa của từ ra sao?", en: "How does AI grasp word meaning?" },
    blurb: {
      vi: "Khám phá cách AI biến từ ngữ thành các điểm trên bản đồ, nơi 'vua − đàn ông + đàn bà = nữ hoàng'.",
      en: "See how AI turns words into points on a map, where 'king − man + woman = queen'.",
    },
    render: roomEmbeddings,
  },
  {
    id: "attention", icon: "👁️", num: "09",
    title: { vi: "AI đọc câu của bạn", en: "AI reads your sentence" },
    question: { vi: "Nó đọc một câu kiểu gì?", en: "How does it read a sentence?" },
    blurb: {
      vi: "Xem khi AI gặp một từ, nó đang 'nhìn' vào những từ nào khác để hiểu nghĩa — cơ chế attention.",
      en: "See which other words an AI 'looks at' to understand a given word — the attention mechanism.",
    },
    render: roomAttention,
  },
  {
    id: "next-token", icon: "🎲", num: "10",
    title: { vi: "Máy đoán chữ", en: "The word-guessing machine" },
    question: { vi: "Vì sao AI đôi khi đoán bừa?", en: "Why does AI sometimes make things up?" },
    blurb: {
      vi: "AI viết câu bằng cách liên tục đoán từ tiếp theo theo xác suất. Tự tay chứng kiến vì sao nó 'ảo giác'.",
      en: "AI writes by repeatedly guessing the next word by probability. See first-hand why it 'hallucinates'.",
    },
    render: roomNextToken,
  },
  {
    id: "diffusion", icon: "🎨", num: "11",
    title: { vi: "AI tạo ảnh thế nào", en: "How AI makes images" },
    question: { vi: "Làm sao AI vẽ ra tranh?", en: "How does AI paint a picture?" },
    blurb: {
      vi: "Từ một mớ nhiễu hỗn loạn, AI khử nhiễu từng bước cho tới khi hiện ra hình bạn yêu cầu — diffusion.",
      en: "From pure random noise, AI denoises step by step until your requested image appears — diffusion.",
    },
    render: roomDiffusion,
  },
  {
    id: "recommendation", icon: "📺", num: "12",
    title: { vi: "Vì sao app hiểu bạn", en: "Why apps 'get' you" },
    question: { vi: "Sao TikTok đoán trúng gu bạn?", en: "How does TikTok nail your taste?" },
    blurb: {
      vi: "Bạn thích/bỏ qua vài mục, AI đoán bạn thích gì tiếp theo — cơ chế gợi ý đằng sau TikTok, YouTube, Netflix.",
      en: "Like/skip a few items and AI predicts what you'll enjoy next — the recommender behind TikTok, YouTube, Netflix.",
    },
    render: roomRecommendation,
  },
  {
    id: "bias", icon: "⚖️", num: "13",
    title: { vi: "AI có thiên kiến?", en: "Is AI biased?" },
    question: { vi: "AI có công bằng không?", en: "Is AI fair?" },
    blurb: {
      vi: "Dữ liệu dạy AI đến từ con người, nên AI cũng học cả định kiến của chúng ta. Khám phá điều đó.",
      en: "AI's training data comes from humans, so it learns our biases too. Explore how.",
    },
    render: roomBias,
  },
  {
    id: "adversarial", icon: "🐺", num: "14",
    title: { vi: "Đánh lừa AI", en: "Fooling the AI" },
    question: { vi: "AI có thể bị lừa không?", en: "Can AI be tricked?" },
    blurb: {
      vi: "Thêm chút nhiễu mắt thường không thấy, AI nhìn gấu trúc hóa vượn. Điểm yếu bất ngờ và bài học an toàn.",
      en: "Add noise the eye can't see and AI sees a panda as a gibbon. A surprising weakness and a safety lesson.",
    },
    render: roomAdversarial,
  },
  {
    id: "turing", icon: "🕵️", num: "15",
    title: { vi: "Người hay AI viết?", en: "Human or AI?" },
    question: { vi: "Bạn phân biệt được không?", en: "Can you tell them apart?" },
    blurb: {
      vi: "Đọc từng đoạn và đoán do người hay AI viết. Rèn con mắt tỉnh táo trong thời đại AI.",
      en: "Read each passage and guess if a human or AI wrote it. Sharpen your eye for the AI era.",
    },
    render: roomTuring,
  },
  {
    id: "chatbot", icon: "💬", num: "16",
    title: { vi: "Chatbot mini", en: "Mini chatbot" },
    question: { vi: "Ghép tất cả lại thành gì?", en: "What do all the pieces build?" },
    blurb: {
      vi: "Token + ý nghĩa + chú ý + đoán chữ ghép lại thành một trợ lý. Trò chuyện và xem nó xử lý từng bước.",
      en: "Tokens + meaning + attention + guessing combine into an assistant. Chat and watch it work step by step.",
    },
    render: roomChatbot,
  },
  {
    id: "summary", icon: "🎓", num: "17",
    title: { vi: "Bạn đã hiểu AI rồi", en: "You get AI now" },
    question: { vi: "Tổng kết hành trình", en: "Journey recap" },
    blurb: {
      vi: "Điểm lại những ý tưởng cốt lõi bạn vừa khám phá — và đâu là sự thật quan trọng nhất về AI.",
      en: "Revisit the core ideas you just explored — and the single most important truth about AI.",
    },
    render: roomSummary,
  },
];

// Chuỗi giao diện chung
const UI = {
  soundTitle: { vi: "Bật/tắt âm thanh", en: "Toggle sound" },
  presentTitle: { vi: "Chế độ trình chiếu (toàn màn hình)", en: "Presentation mode (fullscreen)" },
  langTitle: { vi: "Chuyển sang tiếng Anh", en: "Switch to Vietnamese" },
  start: { vi: "Bắt đầu", en: "Start" },
  nextRoom: { vi: "Phòng tiếp:", en: "Next:" },
  journeyEnd: { vi: "Hết hành trình", en: "End of journey" },
  close: { vi: "đóng", en: "close" },
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
  summary:     ["#34d399", "#6ea8fe", "52,211,153"],
};

function applyTheme(id) {
  const [a, a2, rgb] = THEME[id] || THEME.home;
  const r = document.documentElement.style;
  r.setProperty("--accent", a);
  r.setProperty("--accent-2", a2);
  r.setProperty("--accent-rgb", rgb);
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

// Thanh công cụ: ngôn ngữ + âm thanh + trình chiếu
function buildToolbar() {
  const tb = document.createElement("div");
  tb.className = "toolbar";
  tb.innerHTML = `
    <button class="tool-btn" id="langBtn" title="${tx(UI.langTitle)}"></button>
    <button class="tool-btn" id="soundBtn" title="${tx(UI.soundTitle)}"></button>
    <button class="tool-btn" id="presentBtn" title="${tx(UI.presentTitle)}">⛶</button>
  `;
  document.querySelector(".topbar").appendChild(tb);

  const langBtn = tb.querySelector("#langBtn");
  const refreshLang = () => (langBtn.textContent = getLang() === "vi" ? "EN" : "VI");
  refreshLang();
  langBtn.onclick = () => { setLang(getLang() === "vi" ? "en" : "vi"); sfx.click(); };

  const soundBtn = tb.querySelector("#soundBtn");
  const refreshSound = () => (soundBtn.textContent = isMuted() ? "🔇" : "🔊");
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
const visited = getVisited();

function currentRoute() {
  return location.hash.replace(/^#\/?/, "") || "home";
}

function renderProgress(activeId) {
  progressNav.innerHTML = "";
  ROOMS.forEach((room, i) => {
    const dot = document.createElement("div");
    dot.className = "progress-dot";
    dot.textContent = i + 1;
    dot.title = tx(room.title);
    if (room.id === activeId) dot.classList.add("active");
    else if (visited.has(room.id)) dot.classList.add("done");
    dot.addEventListener("click", () => navigate(room.id));
    progressNav.appendChild(dot);
  });
}

export function navigate(id) {
  location.hash = id === "home" ? "" : `#/${id}`;
}

function route() {
  const id = currentRoute();
  window.dispatchEvent(new CustomEvent("roomleave")); // dọn dẹp timer phòng cũ
  app.innerHTML = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
  applyTheme(id === "home" ? "home" : id);
  const room0 = ROOMS.find((r) => r.id === id);
  trackView(id === "home" ? "/" : "/" + id, room0 ? tx(room0.title) : "AI Explorer");
  app.classList.remove("enter");
  void app.offsetWidth; // restart animation
  app.classList.add("enter");

  if (id === "home") {
    renderProgress(null);
    renderHome(app, ROOMS, navigate);
    return;
  }

  const idx = ROOMS.findIndex((r) => r.id === id);
  if (idx === -1) {
    navigate("home");
    return;
  }

  const room = ROOMS[idx];
  visited.add(room.id);
  markVisited(room.id);
  renderProgress(room.id);

  // Khung sườn chung cho mọi phòng
  const head = document.createElement("div");
  head.className = "room-head";
  head.innerHTML = `
    <div class="rh-icon">${room.icon}</div>
    <div>
      <div class="rh-q">${tx(room.question)}</div>
      <h2>${tx(room.title)}</h2>
    </div>`;
  app.appendChild(head);

  const body = document.createElement("div");
  app.appendChild(body);
  room.render(body);
  showHint(room.id);

  // Nút điều hướng trước / sau
  const navBtns = document.createElement("div");
  navBtns.className = "nav-buttons";
  const prev = ROOMS[idx - 1];
  const next = ROOMS[idx + 1];
  navBtns.innerHTML = `
    <button class="btn ghost" ${prev ? "" : "disabled"} id="prevBtn">
      ← ${prev ? tx(prev.title) : tx(UI.start)}
    </button>
    <button class="btn" ${next ? "" : "disabled"} id="nextBtn">
      ${next ? tx(UI.nextRoom) + " " + tx(next.title) + " →" : tx(UI.journeyEnd)}
    </button>`;
  app.appendChild(navBtns);
  if (prev) document.getElementById("prevBtn").onclick = () => navigate(prev.id);
  else document.getElementById("prevBtn").onclick = () => navigate("home");
  if (next) document.getElementById("nextBtn").onclick = () => navigate(next.id);
}

document.getElementById("brandHome").addEventListener("click", () => navigate("home"));
window.addEventListener("hashchange", route);

// Đổi ngôn ngữ → dựng lại thanh công cụ + render lại phòng hiện tại
window.addEventListener("langchange", () => {
  document.querySelector(".toolbar")?.remove();
  buildToolbar();
  route();
});

// Điều hướng bằng phím mũi tên (hợp cho trình chiếu)
window.addEventListener("keydown", (e) => {
  if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;
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
