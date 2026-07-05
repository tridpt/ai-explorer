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
import { roomRag } from "./rooms/rag.js";
import { roomFinetune } from "./rooms/finetune.js";
import { roomAgents } from "./rooms/agents.js";
import { roomMultimodal } from "./rooms/multimodal.js";
import { roomContextWindow } from "./rooms/context-window.js";
import { roomPromptInjection } from "./rooms/prompt-injection.js";
import { roomRlhf } from "./rooms/rlhf.js";
import { roomSummary } from "./rooms/summary.js";
import { sfx, isMuted, setMuted } from "./sound.js";
import { markVisited, getVisited } from "./store.js";
import { getLang, setLang, tx } from "./i18n.js";
import { initAnalytics, trackView } from "./analytics.js";
import { parseHash, buildShareUrl } from "./roomstate.js";
import { renderMicroQuiz, hasMicroQuiz } from "./roomquiz.js";

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
    id: "rag", icon: "🔧", num: "17",
    title: { vi: "AI tra cứu tài liệu", en: "AI that looks things up" },
    question: { vi: "Sao chatbot đọc được tài liệu riêng?", en: "How does a chatbot read your docs?" },
    blurb: {
      vi: "RAG: trước khi trả lời, AI đi 'tìm' đoạn tài liệu liên quan rồi mới dựa vào đó mà nói — bớt bịa, có dẫn nguồn.",
      en: "RAG: before answering, the AI 'retrieves' relevant passages and grounds its reply on them — less making-up, with sources.",
    },
    render: roomRag,
  },
  {
    id: "finetune", icon: "🧩", num: "18",
    title: { vi: "Dạy thêm cho AI", en: "Teaching an AI more" },
    question: { vi: "Prompt hay fine-tune?", en: "Prompt or fine-tune?" },
    blurb: {
      vi: "Hai cách 'dạy thêm' cho AI: chỉ dẫn ngay lúc dùng (prompting) hay huấn luyện lại trọng số (fine-tuning). Khi nào dùng cái nào?",
      en: "Two ways to 'teach' an AI: guide it at use-time (prompting) or retrain its weights (fine-tuning). When to use which?",
    },
    render: roomFinetune,
  },
  {
    id: "agents", icon: "🤝", num: "19",
    title: { vi: "AI biết dùng công cụ", en: "AI that uses tools" },
    question: { vi: "AI tự làm việc nhiều bước kiểu gì?", en: "How does AI do multi-step work?" },
    blurb: {
      vi: "AI agent không chỉ trả lời — nó lên kế hoạch, gọi công cụ (máy tính, tìm kiếm…), xem kết quả rồi đi tiếp cho tới khi xong.",
      en: "An AI agent doesn't just answer — it plans, calls tools (calculator, search…), reads results, and loops until done.",
    },
    render: roomAgents,
  },
  {
    id: "multimodal", icon: "🖼️", num: "20",
    title: { vi: "AI hiểu cả ảnh lẫn chữ", en: "AI that sees and reads" },
    question: { vi: "Làm sao AI 'nhìn' được ảnh?", en: "How does AI 'see' an image?" },
    blurb: {
      vi: "Multimodal: AI đưa ảnh và chữ về cùng một 'không gian ý nghĩa', nên nó mô tả được ảnh và trả lời câu hỏi về ảnh.",
      en: "Multimodal: AI maps images and text into one 'meaning space', so it can describe images and answer questions about them.",
    },
    render: roomMultimodal,
  },
  {
    id: "context-window", icon: "🪟", num: "21",
    title: { vi: "Cửa sổ ngữ cảnh", en: "The context window" },
    question: { vi: "Vì sao AI quên đầu câu chuyện?", en: "Why does AI forget the start?" },
    blurb: {
      vi: "AI chỉ nhớ được một lượng token giới hạn cùng lúc. Trò chuyện dài quá, tin cũ rơi ra — và AI quên. Tự tay thấy điều đó.",
      en: "AI only holds a limited amount of tokens at once. Chat too long and old messages fall out — the AI forgets. See it for yourself.",
    },
    render: roomContextWindow,
  },
  {
    id: "prompt-injection", icon: "🛡️", num: "22",
    title: { vi: "Đánh lừa trợ lý AI", en: "Hijacking an AI assistant" },
    question: { vi: "Có thể lừa AI làm trái lệnh không?", en: "Can you make an AI break its rules?" },
    blurb: {
      vi: "Đóng vai kẻ tấn công: nhét 'câu lệnh lén' vào tin nhắn để moi bí mật của trợ lý AI — và xem lớp phòng thủ chặn được tới đâu. Đây là prompt injection.",
      en: "Play the attacker: slip a 'sneaky instruction' into a message to extract an AI assistant's secret — and see how far defenses hold. This is prompt injection.",
    },
    render: roomPromptInjection,
  },
  {
    id: "rlhf", icon: "👍", num: "23",
    title: { vi: "Dạy AI cư xử cho phải", en: "Teaching AI to behave" },
    question: { vi: "Sao AI biết trả lời 'dễ nghe'?", en: "How does AI learn to be helpful?" },
    blurb: {
      vi: "AI thô ban đầu nói năng lộn xộn. Bạn xếp hạng câu nào hay hơn, một 'mô hình phần thưởng' học theo gu bạn, rồi AI được tinh chỉnh để trả lời như bạn muốn — đó là RLHF.",
      en: "A raw AI answers messily. You rank which reply is better, a 'reward model' learns your taste, then the AI is tuned to answer the way you want — that's RLHF.",
    },
    render: roomRlhf,
  },
  {
    id: "summary", icon: "🎓", num: "24",
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
const visited = getVisited();

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
    // Nhãn cho trình đọc màn hình: số + tên phòng + trạng thái.
    dot.setAttribute("aria-label", `${tx("Phòng", "Room")} ${i + 1}: ${tx(room.title)} — ${state}`);
    dot.title = tx(room.title);
    if (room.id === activeId) { dot.classList.add("active"); dot.setAttribute("aria-current", "page"); }
    else if (done) dot.classList.add("done");
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
    <div class="rh-text">
      <div class="rh-q">${tx(room.question)}</div>
      <h2>${tx(room.title)}</h2>
    </div>
    <button class="btn ghost rh-share" id="shareRoomBtn" title="${tx(UI.shareRoomTitle)}">${tx(UI.shareRoom)}</button>`;
  app.appendChild(head);
  head.querySelector("#shareRoomBtn").onclick = () => shareRoom(room);

  const body = document.createElement("div");
  app.appendChild(body);
  room.render(body);
  // Quiz nhỏ "kiểm tra hiểu bài" ở cuối phòng (trừ trang tổng kết vốn đã có quiz lớn).
  if (room.id !== "summary" && hasMicroQuiz(room.id)) renderMicroQuiz(body, room.id);
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

const brandEl = document.getElementById("brandHome");
brandEl.addEventListener("click", () => navigate("home"));
brandEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate("home"); }
});
window.addEventListener("hashchange", route);

// Đổi ngôn ngữ → dựng lại thanh công cụ + render lại phòng hiện tại
window.addEventListener("langchange", () => {
  document.querySelector(".toolbar")?.remove();
  buildToolbar();
  route();
});

// Điều hướng bằng phím mũi tên (hợp cho trình chiếu)
window.addEventListener("keydown", (e) => {
  // Phím "/" mở nhanh ô tìm kiếm phòng (trừ khi đang gõ trong ô nhập)
  if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) {
    e.preventDefault();
    openSearch();
    return;
  }
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
