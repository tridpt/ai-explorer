// Evidence notes, review dates, and references for every educational room.
import { tx } from "./i18n.js";

const REVIEWED = "2026-07-23";
const SOURCES = {
  teachable: ["Google Teachable Machine", "https://teachablemachine.withgoogle.com/"],
  mlcc: ["Google Machine Learning Crash Course", "https://developers.google.com/machine-learning/crash-course"],
  neural: ["Google MLCC — Neural networks", "https://developers.google.com/machine-learning/crash-course/neural-networks"],
  overfit: ["Google MLCC — Overfitting", "https://developers.google.com/machine-learning/crash-course/overfitting/overfitting"],
  tree: ["scikit-learn — Decision Trees", "https://scikit-learn.org/stable/modules/tree.html"],
  rl: ["Sutton & Barto — Reinforcement Learning", "https://mitpress.mit.edu/9780262039246/reinforcement-learning/"],
  cluster: ["Google — Clustering course", "https://developers.google.com/machine-learning/clustering"],
  sentencepiece: ["Kudo & Richardson — SentencePiece", "https://aclanthology.org/D18-2012/"],
  word2vec: ["Mikolov et al. — Efficient Estimation of Word Representations", "https://arxiv.org/abs/1301.3781"],
  transformer: ["Vaswani et al. — Attention Is All You Need", "https://arxiv.org/abs/1706.03762"],
  attentionLimits: ["Jain & Wallace — Attention is not Explanation", "https://arxiv.org/abs/1902.10186"],
  slp: ["Jurafsky & Martin — Speech and Language Processing", "https://web.stanford.edu/~jurafsky/slp3/"],
  ddpm: ["Ho et al. — Denoising Diffusion Probabilistic Models", "https://arxiv.org/abs/2006.11239"],
  recommend: ["Google — Recommendation Systems", "https://developers.google.com/machine-learning/recommendation"],
  nist: ["NIST AI Risk Management Framework", "https://www.nist.gov/itl/ai-risk-management-framework"],
  adversarial: ["NIST — Adversarial Machine Learning", "https://www.nccoe.nist.gov/ai/adversarial-machine-learning"],
  turing: ["Turing — Computing Machinery and Intelligence", "https://academic.oup.com/mind/article-abstract/LIX/236/433/986238"],
  rag: ["Lewis et al. — Retrieval-Augmented Generation", "https://arxiv.org/abs/2005.11401"],
  lora: ["Hu et al. — LoRA", "https://arxiv.org/abs/2106.09685"],
  react: ["Yao et al. — ReAct", "https://arxiv.org/abs/2210.03629"],
  clip: ["Radford et al. — CLIP", "https://arxiv.org/abs/2103.00020"],
  context: ["Liu et al. — Lost in the Middle", "https://arxiv.org/abs/2307.03172"],
  promptInjection: ["OWASP — LLM Prompt Injection Prevention", "https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html"],
  instructgpt: ["Ouyang et al. — InstructGPT", "https://arxiv.org/abs/2203.02155"],
  iea: ["IEA — Energy and AI", "https://www.iea.org/reports/energy-and-ai"],
  cot: ["Wei et al. — Chain-of-Thought Prompting", "https://arxiv.org/abs/2201.11903"],
  cotLimits: ["EMNLP 2025 — CoT and hallucination cues", "https://aclanthology.org/2025.findings-emnlp.67/"],
};

const note = (vi, en, sources) => ({ note: { vi, en }, sources });

const ROOM_TRUST = {
  teachable: note("Classifier nhỏ chạy cục bộ từ mẫu bạn chụp; kết quả phụ thuộc dữ liệu và không phải benchmark sản xuất.", "A small local classifier learns from your samples; results depend on the data and are not a production benchmark.", ["teachable", "mlcc"]),
  "neural-net": note("Mạng 2D rất nhỏ minh họa ranh giới quyết định, không đại diện quy mô hay hành vi của mạng hiện đại.", "This tiny 2D network illustrates decision boundaries; it does not represent the scale or behavior of modern networks.", ["neural"]),
  overfitting: note("Dữ liệu và đường học được đơn giản hóa để làm rõ train–test gap; số liệu không phải kết quả benchmark.", "Data and learning curves are simplified to show the train–test gap; figures are not benchmark results.", ["overfit"]),
  "decision-tree": note("Cây và luật trong phòng được dựng sẵn để minh họa khả năng diễn giải; cây thật được học từ dữ liệu.", "The tree and rules are authored to illustrate interpretability; real trees learn splits from data.", ["tree"]),
  reinforcement: note("Môi trường lưới nhỏ minh họa thử–sai và phần thưởng; thành công ở đây không suy rộng sang bài toán thực.", "This small grid illustrates trial, error, and reward; success here does not generalize to real tasks.", ["rl"]),
  clustering: note("K-means chạy trên dữ liệu 2D đồ chơi; số cụm và khoảng cách phải do người thiết kế lựa chọn.", "K-means runs on toy 2D data; designers still choose the cluster count and distance assumptions.", ["cluster"]),
  tokenizer: note("Bộ cắt trong phòng là xấp xỉ giáo dục; tokenizer thật phụ thuộc vocabulary và thuật toán của từng model.", "The room uses an educational approximation; real tokenization depends on each model's vocabulary and algorithm.", ["sentencepiece"]),
  embeddings: note("Bản đồ 2D được sắp sẵn. Phép loại suy vector có thể xuất hiện ở một số embedding, không phải quy luật luôn đúng.", "The 2D map is curated. Vector analogies can emerge in some embeddings, but they are not universal laws.", ["word2vec"]),
  attention: note("Trọng số được viết sẵn để minh họa một attention head; ô sáng không chứng minh mô hình hiểu hay giải thích nhân quả.", "Weights are hand-authored to illustrate one attention head; a bright cell does not prove understanding or causal explanation.", ["transformer", "attentionLimits"]),
  "next-token": note("Game dùng trigram theo từ trên corpus nhỏ. LLM thật dự đoán token từ ngữ cảnh phong phú hơn nhiều.", "The game uses a word-level trigram over a tiny corpus. Real LLMs predict tokens from much richer context.", ["slp"]),
  diffusion: note("Hiệu ứng chỉ hòa trộn pixel với ảnh emoji đích; không có denoiser hay mô hình diffusion đang chạy.", "The effect only blends pixels toward a target emoji; no denoiser or diffusion model is running.", ["ddpm"]),
  recommendation: note("Điểm sở thích và mục gợi ý là mô hình đồ chơi; hệ thật còn có mục tiêu, dữ liệu và ràng buộc đa dạng.", "Preference scores and recommendations form a toy model; real systems use broader objectives, data, and constraints.", ["recommend"]),
  bias: note("Liên tưởng được chọn để minh họa rủi ro, không đo thiên kiến của một model cụ thể; fairness cần đánh giá theo ngữ cảnh.", "Selected associations illustrate risk, not the bias of a specific model; fairness requires contextual evaluation.", ["nist"]),
  adversarial: note("Nhiễu và nhãn được mô phỏng; phòng không chạy một classifier ảnh thật hay đo độ robust của model.", "Noise and labels are simulated; the room does not run a real image classifier or measure model robustness.", ["adversarial"]),
  turing: note("Các đoạn văn được tuyển chọn; trò chơi không phải detector và đoán đúng không chứng minh nguồn gốc văn bản.", "Passages are curated; this game is not a detector, and a correct guess does not prove authorship.", ["turing"]),
  chatbot: note("Pipeline và câu trả lời được đơn giản hóa; không có LLM từ xa hay kiểm chứng sự thật đang chạy.", "The pipeline and replies are simplified; no remote LLM or fact-checker is running.", ["transformer", "slp"]),
  rag: note("Demo chấm từ khóa rồi chép đoạn khớp nhất. RAG thật vẫn có thể truy xuất nhầm hoặc tạo câu sai.", "The demo scores keywords and echoes the best passage. Real RAG can still retrieve the wrong evidence or generate errors.", ["rag"]),
  finetune: note("Các tình huống so sánh được viết sẵn; phòng không fine-tune model hay đo chi phí/chất lượng thực tế.", "Comparison scenarios are authored; the room does not fine-tune a model or measure real cost and quality.", ["lora"]),
  agents: note("Trace được viết sẵn và không gọi công cụ thật. Agent thật có thể chọn sai tool, dùng dữ liệu cũ hoặc thất bại.", "The trace is scripted and calls no real tools. Real agents can choose the wrong tool, use stale data, or fail.", ["react", "promptInjection"]),
  multimodal: note("Emoji, nhãn, caption và confidence đều viết sẵn. Một số kiến trúc dùng không gian ảnh–chữ chung; không phải tất cả.", "Emoji scenes, labels, captions, and confidence scores are scripted. Some—not all—architectures use shared image–text spaces.", ["clip"]),
  "context-window": note("Số token và cơ chế rơi tin nhắn được đơn giản hóa; model thật còn khác nhau về tokenizer và cách dùng ngữ cảnh dài.", "Token counts and message eviction are simplified; real models differ in tokenization and effective long-context use.", ["context"]),
  "prompt-injection": note("Bộ lọc từ khóa và phản hồi được lập trình sẵn; đây không phải đánh giá bảo mật của một model hay hệ thống thật.", "The keyword filter and responses are scripted; this is not a security evaluation of a real model or system.", ["promptInjection"]),
  rlhf: note("Demo chỉ cộng điểm theo nhãn có sẵn; nó không huấn luyện reward model hay policy. RLHF dùng phản hồi tổng hợp từ nhiều người.", "The demo only tallies pre-labeled choices; it trains no reward model or policy. RLHF uses aggregated feedback from many people.", ["instructgpt"]),
  energy: note("Các giá trị Wh là giả định minh họa, không phải phép đo. Mức thực có thể lệch nhiều bậc theo model, token, phần cứng và data center.", "Wh values are illustrative assumptions, not measurements. Real use can vary by orders of magnitude with model, tokens, hardware, and data center.", ["iea"]),
  reasoning: note("Đáp án và các bước đều viết sẵn. Suy luận nhiều bước có thể giúp một số bài nhưng không bảo đảm đúng hay phản ánh trung thực cơ chế bên trong.", "Answers and steps are scripted. Multi-step inference can help on some tasks but neither guarantees correctness nor faithfully exposes internal mechanisms.", ["cot", "cotLimits"]),
  summary: note("Phần tổng kết cô đọng nhiều họ mô hình khác nhau; hãy dùng nguồn từng phòng khi cần kết luận kỹ thuật cụ thể.", "The recap compresses many model families; use each room's references for specific technical claims.", ["mlcc", "nist"]),
};

export const QUIZ_EXPLANATIONS = {
  teachable: { vi: "Mẫu bạn chụp là dữ liệu huấn luyện; classifier học ranh giới từ các ví dụ đó.", en: "Your captured samples are training data; the classifier learns a boundary from those examples." },
  "neural-net": { vi: "Một nơ-ron tuyến tính chỉ tạo được một ranh giới thẳng, nên không bao quanh được vùng hình tròn.", en: "A linear neuron only creates a straight boundary, so it cannot enclose a circular region." },
  overfitting: { vi: "Overfitting là khoảng cách giữa việc nhớ tốt dữ liệu train và tổng quát kém trên dữ liệu chưa thấy.", en: "Overfitting is the gap between fitting training data well and generalizing poorly to unseen data." },
  "decision-tree": { vi: "Ta có thể lần theo từng nhánh và điều kiện, nhưng tính minh bạch không bảo đảm cây luôn chính xác nhất.", en: "Each branch and condition can be traced, but transparency does not guarantee the tree is always most accurate." },
  reinforcement: { vi: "Agent thu thập kinh nghiệm từ hành động và tín hiệu thưởng; nó vẫn cần môi trường tương tác chứ không phải 'không cần dữ liệu'.", en: "An agent learns experience from actions and reward signals; it still needs interaction data." },
  clustering: { vi: "Clustering tìm cấu trúc theo độ giống nhau mà không có nhãn đích, nhưng con người vẫn chọn đặc trưng và giả định.", en: "Clustering finds similarity structure without target labels, while humans still choose features and assumptions." },
  tokenizer: { vi: "Model nhận chuỗi token ID; cách cắt và số token thay đổi theo tokenizer, nên không đơn giản là đếm ký tự.", en: "Models receive token IDs; splitting and token counts vary by tokenizer, so this is not just letter counting." },
  embeddings: { vi: "Một số quan hệ ngữ nghĩa có thể hiện thành hướng/khoảng cách vector, nhưng phép loại suy không luôn đúng ở mọi embedding.", en: "Some semantic relations can appear as vector directions or distances, but analogies do not always hold." },
  attention: { vi: "Attention trộn thông tin giữa token theo trọng số; trọng số đó là tín hiệu trung gian, không tự chứng minh mô hình đã hiểu đúng.", en: "Attention mixes token information by weights; those weights are intermediate signals, not proof of correct understanding." },
  "next-token": { vi: "Dự đoán token tạo ra câu trôi chảy nhưng không tự kiểm chứng thế giới; ảo giác còn phụ thuộc dữ liệu, model và ngữ cảnh.", en: "Token prediction can be fluent without checking the world; hallucination also depends on data, model, and context." },
  diffusion: { vi: "Diffusion model học quá trình khử nhiễu; hiệu ứng pixel của phòng chỉ minh họa trực quan ý tưởng này.", en: "Diffusion models learn a denoising process; this room's pixel effect only visualizes that idea." },
  recommendation: { vi: "Tín hiệu hành vi giúp ước lượng sở thích, thường kết hợp thông tin mục, người dùng và mục tiêu hệ thống.", en: "Behavior signals help estimate preferences, often alongside item, user, and system-objective information." },
  bias: { vi: "Thiên kiến có thể đến từ dữ liệu, nhãn, mục tiêu và cách triển khai; AI không có cảm xúc 'ghét' một nhóm.", en: "Bias can come from data, labels, objectives, and deployment; an AI does not emotionally 'hate' a group." },
  adversarial: { vi: "Model có thể nhạy với thay đổi đầu vào tối ưu hóa có chủ đích, kể cả khi con người thấy thay đổi rất nhỏ.", en: "Models can be sensitive to deliberately optimized input changes even when humans perceive little difference." },
  turing: { vi: "Phong cách văn bản không phải bằng chứng chắc chắn về tác giả; cần nguồn gốc và kiểm chứng thay vì chỉ dựa trực giác.", en: "Writing style is not reliable proof of authorship; provenance and verification matter more than intuition." },
  chatbot: { vi: "Chatbot hiện đại kết hợp tokenization, biểu diễn, attention và dự đoán token; sản phẩm thực còn có retrieval, tools và safety layers.", en: "Modern chatbots combine tokenization, representations, attention, and token prediction; products may add retrieval, tools, and safety layers." },
  rag: { vi: "RAG đưa đoạn truy xuất vào ngữ cảnh; nó hỗ trợ grounding nhưng chất lượng vẫn phụ thuộc retrieval và generation.", en: "RAG adds retrieved passages to context; it supports grounding, while quality still depends on retrieval and generation." },
  finetune: { vi: "Prompt thay đổi đầu vào lúc sử dụng; fine-tuning cập nhật tham số từ dữ liệu huấn luyện bổ sung.", en: "Prompts change use-time input; fine-tuning updates parameters using additional training data." },
  agents: { vi: "Agent ghép model với vòng lặp và công cụ; khả năng hành động cũng làm tăng rủi ro nên cần quyền hạn hẹp và kiểm tra.", en: "Agents combine a model with a loop and tools; action capability also adds risk, requiring narrow permissions and checks." },
  multimodal: { vi: "Multimodal nghĩa là xử lý nhiều modality; không phải mọi kiến trúc đều ép ảnh và chữ thành cùng một loại vector.", en: "Multimodal means handling multiple modalities; not every architecture maps image and text to the same vector type." },
  "context-window": { vi: "Context window giới hạn lượng token đầu vào, nhưng ở trong giới hạn model vẫn có thể dùng thông tin dài không đồng đều.", en: "A context window limits input tokens, yet models may still use information unevenly even within that limit." },
  "prompt-injection": { vi: "Dữ liệu không đáng tin có thể chứa chỉ dẫn cạnh tranh; lọc từ khóa đơn lẻ không phải phòng thủ đầy đủ.", en: "Untrusted data can contain competing instructions; keyword filtering alone is not a complete defense." },
  rlhf: { vi: "RLHF học từ preference tổng hợp qua nhiều bước; bốn lựa chọn trong phòng chỉ mô phỏng việc thu thập preference.", en: "RLHF learns from aggregated preferences through multiple stages; the room only simulates preference collection." },
  energy: { vi: "Tổng điện phụ thuộc cả chi phí mỗi tác vụ lẫn quy mô sử dụng; không có một con số Wh cố định cho mọi truy vấn.", en: "Total electricity depends on per-task cost and usage scale; no single Wh figure applies to every query." },
  reasoning: { vi: "Thêm bước tính toán có thể giúp một số bài, nhưng chuỗi bước có thể sai hoặc không trung thành với cơ chế tạo đáp án.", en: "More inference steps can help some tasks, but generated steps can be wrong or unfaithful to how the answer arose." },
};

export function renderTrustPanel(container, roomId) {
  const item = ROOM_TRUST[roomId];
  if (!item) return;

  const panel = document.createElement("aside");
  panel.className = "panel content-trust";
  panel.setAttribute("aria-labelledby", `trust-title-${roomId}`);

  const heading = document.createElement("h4");
  heading.id = `trust-title-${roomId}`;
  heading.textContent = tx("🧭 Phạm vi mô phỏng & nguồn", "🧭 Simulation scope & sources");
  panel.appendChild(heading);

  const scope = document.createElement("p");
  scope.textContent = tx(item.note);
  panel.appendChild(scope);

  const reviewed = document.createElement("p");
  reviewed.className = "muted mt";
  reviewed.textContent = tx(`Rà soát nội dung: ${REVIEWED}`, `Content reviewed: ${REVIEWED}`);
  panel.appendChild(reviewed);

  const sourceTitle = document.createElement("strong");
  sourceTitle.className = "trust-source-title";
  sourceTitle.textContent = tx("Đọc nguồn gốc:", "Primary/further reading:");
  panel.appendChild(sourceTitle);

  const list = document.createElement("ul");
  list.className = "resources trust-sources";
  item.sources.forEach((sourceId) => {
    const source = SOURCES[sourceId];
    if (!source) return;
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.href = source[1];
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = source[0];
    li.appendChild(link);
    list.appendChild(li);
  });
  panel.appendChild(list);
  container.appendChild(panel);
}