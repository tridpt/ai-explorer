// AI Explorer — router & điều hướng "hành trình qua các phòng"
import { renderHome } from "./rooms/home.js";
import { roomTeachable } from "./rooms/teachable.js";
import { roomNeuralNet } from "./rooms/neural-net.js";
import { roomOverfitting } from "./rooms/overfitting.js";
import { roomDecisionTree } from "./rooms/decision-tree.js";
import { roomReinforcement } from "./rooms/reinforcement.js";
import { roomTokenizer } from "./rooms/tokenizer.js";
import { roomEmbeddings } from "./rooms/embeddings.js";
import { roomAttention } from "./rooms/attention.js";
import { roomNextToken } from "./rooms/next-token.js";
import { roomDiffusion } from "./rooms/diffusion.js";
import { roomBias } from "./rooms/bias.js";
import { roomChatbot } from "./rooms/chatbot.js";
import { roomSummary } from "./rooms/summary.js";
import { sfx, isMuted, setMuted, celebrate } from "./sound.js";
import { markVisited, getVisited } from "./store.js";

// Thứ tự các phòng = mạch kể chuyện của hành trình
export const ROOMS = [
  {
    id: "teachable",
    icon: "📸",
    num: "01",
    title: "Tự tay dạy AI",
    question: "AI học như thế nào?",
    blurb: "Bật webcam, dạy AI phân biệt vài tư thế chỉ trong 30 giây. Hiểu 'dữ liệu huấn luyện' bằng chính tay bạn.",
    render: roomTeachable,
  },
  {
    id: "neural-net",
    icon: "🕸️",
    num: "02",
    title: "Bên trong mạng nơ-ron",
    question: "Bên trong AI là gì?",
    blurb: "Kéo thanh trượt thay đổi số nơ-ron và xem AI vẽ ranh giới phân loại thay đổi theo thời gian thực.",
    render: roomNeuralNet,
  },
  {
    id: "overfitting",
    icon: "🎯",
    num: "03",
    title: "Học vẹt hay hiểu thật?",
    question: "AI có thực sự 'hiểu'?",
    blurb: "Khám phá overfitting: khi AI nhớ vanh vách bài cũ nhưng làm sai bài mới — và cách chữa nó.",
    render: roomOverfitting,
  },
  {
    id: "decision-tree",
    icon: "🌳",
    num: "04",
    title: "Cây quyết định",
    question: "Có loại AI 'nhìn thấy' được luật?",
    blurb: "Một kiểu AI minh bạch: đi qua chuỗi câu hỏi có/không mà ai cũng kiểm tra được vì sao nó kết luận vậy.",
    render: roomDecisionTree,
  },
  {
    id: "reinforcement",
    icon: "🤖",
    num: "05",
    title: "Học qua thử và sai",
    question: "AI học không cần đáp án thì sao?",
    blurb: "Xem chú robot tự học đường tới đích bằng thưởng–phạt, không hề được chỉ trước — học tăng cường.",
    render: roomReinforcement,
  },
  {
    id: "tokenizer",
    icon: "✂️",
    num: "06",
    title: "Token là gì",
    question: "AI đọc chữ kiểu gì?",
    blurb: "AI không thấy 'chữ' như ta — nó cắt câu thành token. Gõ thử và xem số token cùng chi phí.",
    render: roomTokenizer,
  },
  {
    id: "embeddings",
    icon: "🗺️",
    num: "07",
    title: "Bản đồ ý nghĩa",
    question: "AI hiểu nghĩa của từ ra sao?",
    blurb: "Khám phá cách AI biến từ ngữ thành các điểm trên bản đồ, nơi 'vua − đàn ông + đàn bà = nữ hoàng'.",
    render: roomEmbeddings,
  },
  {
    id: "attention",
    icon: "👁️",
    num: "08",
    title: "AI đọc câu của bạn",
    question: "Nó đọc một câu kiểu gì?",
    blurb: "Xem khi AI gặp một từ, nó đang 'nhìn' vào những từ nào khác để hiểu nghĩa — cơ chế attention.",
    render: roomAttention,
  },
  {
    id: "next-token",
    icon: "🎲",
    num: "09",
    title: "Máy đoán chữ",
    question: "Vì sao AI đôi khi đoán bừa?",
    blurb: "AI viết câu bằng cách liên tục đoán từ tiếp theo theo xác suất. Tự tay chứng kiến vì sao nó 'ảo giác'.",
    render: roomNextToken,
  },
  {
    id: "diffusion",
    icon: "🎨",
    num: "10",
    title: "AI tạo ảnh thế nào",
    question: "Làm sao AI vẽ ra tranh?",
    blurb: "Từ một mớ nhiễu hỗn loạn, AI khử nhiễu từng bước cho tới khi hiện ra hình bạn yêu cầu — diffusion.",
    render: roomDiffusion,
  },
  {
    id: "bias",
    icon: "⚖️",
    num: "11",
    title: "AI có thiên kiến?",
    question: "AI có công bằng không?",
    blurb: "Dữ liệu dạy AI đến từ con người, nên AI cũng học cả định kiến của chúng ta. Khám phá điều đó.",
    render: roomBias,
  },
  {
    id: "chatbot",
    icon: "💬",
    num: "12",
    title: "Chatbot mini",
    question: "Ghép tất cả lại thành gì?",
    blurb: "Token + ý nghĩa + chú ý + đoán chữ ghép lại thành một trợ lý. Trò chuyện và xem nó xử lý từng bước.",
    render: roomChatbot,
  },
  {
    id: "summary",
    icon: "🎓",
    num: "13",
    title: "Bạn đã hiểu AI rồi",
    question: "Tổng kết hành trình",
    blurb: "Điểm lại những ý tưởng cốt lõi bạn vừa khám phá — và đâu là sự thật quan trọng nhất về AI.",
    render: roomSummary,
  },
];

// Mỗi phòng một tông màu chủ đề: [accent, accent-2, "r,g,b"]
const THEME = {
  home:        ["#6ea8fe", "#b07bff", "110,168,254"],
  teachable:   ["#ff7a59", "#ffb15c", "255,122,89"],
  "neural-net":["#34d399", "#22d3ee", "52,211,153"],
  overfitting: ["#fb7185", "#fb923c", "251,113,133"],
  "decision-tree":["#4ade80", "#a3e635", "74,222,128"],
  reinforcement: ["#f59e0b", "#f43f5e", "245,158,11"],
  tokenizer:   ["#22d3ee", "#6ea8fe", "34,211,238"],
  embeddings:  ["#6ea8fe", "#818cf8", "110,168,254"],
  attention:   ["#b07bff", "#e879f9", "176,123,255"],
  "next-token":["#fbbf24", "#fb923c", "251,191,36"],
  diffusion:   ["#e879f9", "#818cf8", "232,121,249"],
  bias:        ["#f472b6", "#fb7185", "244,114,182"],
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

// Gợi ý onboarding cho từng phòng (hiện 1 lần, nhấp nháy nhẹ)
const HINTS = {
  teachable: "👉 Bấm <b>Bật webcam</b>, rồi chụp vài mẫu cho mỗi tư thế để dạy AI.",
  "neural-net": "👉 Thử để <b>1 nơ-ron</b> rồi bấm Huấn luyện — xem AI 'bó tay'. Sau đó tăng lên 8.",
  overfitting: "👉 Bấm <b>Huấn luyện</b> với ít dữ liệu — xem AI 'học vẹt'. Rồi kéo lượng dữ liệu lên cao.",
  "decision-tree": "👉 Bấm các câu trả lời để đi qua cây — đường đi sẽ sáng lên ở sơ đồ dưới.",
  reinforcement: "👉 Bấm <b>Học 100 lượt</b> vài lần, rồi bấm <b>Xem robot tự đi</b> để thấy nó tới đích.",
  tokenizer: "👉 Gõ một câu (cả tiếng Anh, emoji) và xem AI cắt nó thành token thế nào.",
  embeddings: "👉 Bấm một phép tính ở mục <b>Thử nhanh</b> để thấy AI suy ra từ thứ tư.",
  attention: "👉 Bấm vào từ <b>nó</b> trong câu để xem AI đang chú ý vào đâu.",
  "next-token": "👉 Bấm <b>Tự viết cả câu</b>, rồi kéo thanh <b>nhiệt độ</b> lên cao và viết lại.",
  diffusion: "👉 Chọn một prompt rồi bấm <b>Tạo ảnh</b> — xem nhiễu biến thành hình dần dần.",
  bias: "👉 Bấm lần lượt các nghề để xem AI 'đoán' giới tính lệch ra sao.",
  chatbot: "👉 Bấm một câu hỏi gợi ý để xem chatbot xử lý qua từng bước.",
  summary: "👉 Cuộn xuống cuối để làm <b>quiz</b> và nhận huy hiệu nhé!",
};
const hintsShown = new Set();

function showHint(id) {
  if (!HINTS[id] || hintsShown.has(id)) return;
  hintsShown.add(id);
  const bar = document.createElement("div");
  bar.className = "hint-bar";
  bar.innerHTML = `<span>${HINTS[id]}</span><button class="hint-close" aria-label="đóng">✕</button>`;
  document.body.appendChild(bar);
  const close = () => bar.classList.add("hide");
  bar.querySelector(".hint-close").onclick = close;
  setTimeout(close, 7000);
  bar.addEventListener("animationend", (e) => { if (e.animationName === "hintOut") bar.remove(); });
}

// Thanh công cụ: âm thanh + trình chiếu
function buildToolbar() {
  const tb = document.createElement("div");
  tb.className = "toolbar";
  tb.innerHTML = `
    <button class="tool-btn" id="soundBtn" title="Bật/tắt âm thanh"></button>
    <button class="tool-btn" id="presentBtn" title="Chế độ trình chiếu (toàn màn hình)">⛶</button>
  `;
  document.querySelector(".topbar").appendChild(tb);

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
    dot.title = room.title;
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
  app.innerHTML = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
  applyTheme(id === "home" ? "home" : id);
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
      <div class="rh-q">${room.question}</div>
      <h2>${room.title}</h2>
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
      ← ${prev ? prev.title : "Bắt đầu"}
    </button>
    <button class="btn" ${next ? "" : "disabled"} id="nextBtn">
      ${next ? "Phòng tiếp: " + next.title + " →" : "Hết hành trình"}
    </button>`;
  app.appendChild(navBtns);
  if (prev) document.getElementById("prevBtn").onclick = () => navigate(prev.id);
  else document.getElementById("prevBtn").onclick = () => navigate("home");
  if (next) document.getElementById("nextBtn").onclick = () => navigate(next.id);
}

document.getElementById("brandHome").addEventListener("click", () => navigate("home"));
window.addEventListener("hashchange", route);

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
route();
