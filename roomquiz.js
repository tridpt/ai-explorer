// Quiz nhỏ "kiểm tra hiểu bài" rải rác ở cuối mỗi phòng (song ngữ).
// app.js gọi renderMicroQuiz(container, roomId) để chèn khối câu hỏi.
import { sfx } from "./sound.js";
import { tx } from "./i18n.js";
import { markMicroQuiz, getMicroSolved } from "./store.js";

// Ngân hàng câu hỏi: mỗi phòng 1–2 câu ngắn. correct = chỉ số đáp án đúng.
const BANK = {
  teachable: [
    {
      q: { vi: "AI trong phòng này học phân biệt tư thế nhờ đâu?", en: "How did this AI learn to tell poses apart?" },
      opts: {
        vi: ["Nhờ các ảnh mẫu bạn tự chụp", "Nhờ được lập trình sẵn từng luật", "Nhờ tra trên mạng"],
        en: ["From the sample images you captured", "From hard-coded rules", "By searching online"],
      },
      correct: 0,
    },
  ],
  "neural-net": [
    {
      q: { vi: "Vì sao một mạng chỉ 1 nơ-ron không tách nổi hình tròn?", en: "Why can't a 1-neuron net separate a circle?" },
      opts: {
        vi: ["Vì nó chỉ vẽ được một đường thẳng", "Vì máy quá yếu", "Vì thiếu dữ liệu"],
        en: ["It can only draw a straight line", "The machine is too weak", "Not enough data"],
      },
      correct: 0,
    },
  ],
  overfitting: [
    {
      q: { vi: "\"Học vẹt\" (overfitting) là khi AI...", en: "Overfitting is when an AI..." },
      opts: {
        vi: ["Giỏi bài cũ nhưng sai bài mới", "Giỏi cả bài cũ lẫn bài mới", "Không học được gì"],
        en: ["Aces old data but fails new data", "Does well on both old and new", "Learns nothing"],
      },
      correct: 0,
    },
  ],
  "decision-tree": [
    {
      q: { vi: "Điểm mạnh đặc biệt của cây quyết định là gì?", en: "A decision tree's special strength?" },
      opts: {
        vi: ["Minh bạch — thấy được từng luật", "Luôn chính xác nhất", "Chạy nhanh nhất"],
        en: ["Transparent — you see each rule", "Always most accurate", "Runs fastest"],
      },
      correct: 0,
    },
  ],
  reinforcement: [
    {
      q: { vi: "Học tăng cường dựa chủ yếu vào điều gì?", en: "Reinforcement learning relies mainly on?" },
      opts: {
        vi: ["Thưởng và phạt qua thử–sai", "Đáp án có sẵn từng bước", "Không cần dữ liệu"],
        en: ["Reward and penalty by trial", "A step-by-step answer key", "No data at all"],
      },
      correct: 0,
    },
  ],
  clustering: [
    {
      q: { vi: "Học không giám sát (phân nhóm) khác gì?", en: "What makes clustering 'unsupervised'?" },
      opts: {
        vi: ["Tự gom nhóm mà không cần nhãn", "Được dạy từng nhãn", "Hỏi người mỗi bước"],
        en: ["Groups data with no labels", "Is taught every label", "Asks a human each step"],
      },
      correct: 0,
    },
  ],
  tokenizer: [
    {
      q: { vi: "AI tính chi phí và xử lý theo đơn vị nào?", en: "AI bills and processes by what unit?" },
      opts: {
        vi: ["Token", "Số chữ cái", "Số câu"],
        en: ["Tokens", "Letters", "Sentences"],
      },
      correct: 0,
    },
  ],
  embeddings: [
    {
      q: { vi: "\"vua − đàn ông + đàn bà = nữ hoàng\" cho thấy?", en: "\"king − man + woman = queen\" shows?" },
      opts: {
        vi: ["Khoảng cách giữa các từ mang ý nghĩa", "AI tra từ điển", "Chỉ là trùng hợp"],
        en: ["Distances between words carry meaning", "AI uses a dictionary", "Pure coincidence"],
      },
      correct: 0,
    },
  ],
  attention: [
    {
      q: { vi: "Cơ chế attention giúp AI làm gì?", en: "What does attention let AI do?" },
      opts: {
        vi: ["Biết mỗi từ nên chú ý vào từ nào để hiểu ngữ cảnh", "Đọc nhanh hơn", "Nén dữ liệu"],
        en: ["Know which words to attend to for context", "Read faster", "Compress data"],
      },
      correct: 0,
    },
  ],
  "next-token": [
    {
      q: { vi: "Vì sao AI đôi khi \"ảo giác\" mà vẫn tự tin?", en: "Why does AI 'hallucinate' yet stay confident?" },
      opts: {
        vi: ["Nó chọn từ nghe hợp lý theo xác suất, không kiểm chứng", "Nó cố tình nói dối", "Do lỗi mạng"],
        en: ["It picks plausible words by probability, unverified", "It lies on purpose", "Network error"],
      },
      correct: 0,
    },
  ],
  diffusion: [
    {
      q: { vi: "AI tạo ảnh (diffusion) bắt đầu từ đâu?", en: "Where does diffusion start?" },
      opts: {
        vi: ["Từ nhiễu ngẫu nhiên rồi khử nhiễu dần", "Từ ảnh có sẵn rồi sửa", "Từ ghép ảnh trên mạng"],
        en: ["From random noise, then denoises", "From an existing image", "By stitching web images"],
      },
      correct: 0,
    },
  ],
  recommendation: [
    {
      q: { vi: "Hệ gợi ý (TikTok, Netflix) đoán gu bạn dựa vào?", en: "Recommenders predict your taste from?" },
      opts: {
        vi: ["Hành vi thích/bỏ qua của bạn và người giống bạn", "Ngày sinh của bạn", "Màu bạn thích"],
        en: ["Your likes/skips and similar users'", "Your birthday", "Your favorite color"],
      },
      correct: 0,
    },
  ],
  bias: [
    {
      q: { vi: "Vì sao AI có thể mang thiên kiến?", en: "Why can AI be biased?" },
      opts: {
        vi: ["Vì học từ dữ liệu con người vốn đã có định kiến", "Vì nó ghét vài nhóm người", "AI không bao giờ thiên kiến"],
        en: ["It learns from biased human data", "It hates some groups", "AI is never biased"],
      },
      correct: 0,
    },
  ],
  adversarial: [
    {
      q: { vi: "Vì sao AI nhận ảnh có thể bị \"đánh lừa\"?", en: "Why can image AI be 'fooled'?" },
      opts: {
        vi: ["Nó bám vào mẫu pixel nhỏ mắt người không thấy", "Vì nó lười", "Không thể lừa được AI"],
        en: ["It latches onto tiny pixel patterns", "It's lazy", "AI can't be fooled"],
      },
      correct: 0,
    },
  ],
  turing: [
    {
      q: { vi: "Bài học chính của phòng \"Người hay AI viết?\"", en: "Main lesson of 'Human or AI?'" },
      opts: {
        vi: ["Văn AI ngày càng khó phân biệt, cần đọc tỉnh táo", "AI luôn viết dở hơn người", "Luôn phân biệt được dễ dàng"],
        en: ["AI text is increasingly hard to spot; stay critical", "AI always writes worse", "It's always easy to tell"],
      },
      correct: 0,
    },
  ],
  chatbot: [
    {
      q: { vi: "Một chatbot ghép lại những mảnh nào bạn đã học?", en: "A chatbot combines which pieces you learned?" },
      opts: {
        vi: ["Token + ý nghĩa + attention + đoán chữ", "Chỉ mỗi việc tra Google", "Một cây quyết định duy nhất"],
        en: ["Tokens + meaning + attention + guessing", "Just Google search", "A single decision tree"],
      },
      correct: 0,
    },
  ],
  rag: [
    {
      q: { vi: "RAG giúp chatbot trả lời đúng tài liệu riêng nhờ?", en: "RAG grounds answers in your docs by?" },
      opts: {
        vi: ["Tìm đoạn liên quan rồi đưa vào ngữ cảnh trước khi trả lời", "Học thuộc lòng cả internet", "Đoán bừa cho nhanh"],
        en: ["Retrieving relevant passages into context first", "Memorizing the whole internet", "Guessing quickly"],
      },
      correct: 0,
    },
  ],
  finetune: [
    {
      q: { vi: "Khác biệt cốt lõi giữa prompting và fine-tuning?", en: "Core difference: prompting vs fine-tuning?" },
      opts: {
        vi: ["Prompting chỉ dẫn lúc dùng; fine-tuning đổi trọng số của model", "Cả hai giống hệt nhau", "Prompting đắt hơn fine-tuning"],
        en: ["Prompting guides at use-time; fine-tuning changes weights", "They're identical", "Prompting costs more"],
      },
      correct: 0,
    },
  ],
  agents: [
    {
      q: { vi: "Điều gì khiến \"AI agent\" khác một chatbot thường?", en: "What makes an 'AI agent' differ from a chatbot?" },
      opts: {
        vi: ["Nó lên kế hoạch và tự gọi công cụ qua nhiều bước", "Nó trả lời nhanh hơn", "Nó chỉ dịch ngôn ngữ"],
        en: ["It plans and calls tools over multiple steps", "It replies faster", "It only translates"],
      },
      correct: 0,
    },
  ],
  multimodal: [
    {
      q: { vi: "Mô hình multimodal đặc biệt ở chỗ?", en: "A multimodal model is special because?" },
      opts: {
        vi: ["Hiểu nhiều loại dữ liệu (ảnh + chữ) trong cùng không gian nghĩa", "Chỉ xử lý được chữ", "Chỉ xử lý được ảnh"],
        en: ["It understands images + text in one meaning space", "It handles only text", "It handles only images"],
      },
      correct: 0,
    },
  ],
  "context-window": [
    {
      q: { vi: "Vì sao chatbot đôi khi \"quên\" điều bạn nói lúc đầu?", en: "Why does a chatbot sometimes 'forget' what you said early on?" },
      opts: {
        vi: ["Tin nhắn cũ rơi ra khỏi cửa sổ ngữ cảnh có giới hạn", "Vì nó cố tình lờ đi", "Vì internet bị chậm"],
        en: ["Old messages fall out of its limited context window", "It ignores you on purpose", "The internet is slow"],
      },
      correct: 0,
    },
  ],
  "prompt-injection": [
    {
      q: { vi: "Vì sao prompt injection lừa được AI?", en: "Why does prompt injection work on AI?" },
      opts: {
        vi: ["AI đọc chỉ dẫn gốc và lời người dùng chung một dòng chữ, khó tách bạch", "AI cố tình làm sai", "Do lỗi phần cứng"],
        en: ["The AI reads system and user text as one stream, hard to separate", "The AI misbehaves on purpose", "A hardware bug"],
      },
      correct: 0,
    },
  ],
  rlhf: [
    {
      q: { vi: "RLHF dạy AI trả lời hợp ý người bằng cách nào?", en: "How does RLHF teach an AI to answer the way people want?" },
      opts: {
        vi: ["Con người xếp hạng các câu trả lời, AI học theo sở thích đó", "Nhồi thêm thật nhiều dữ liệu thô", "Tăng tốc độ phần cứng"],
        en: ["Humans rank answers and the AI learns those preferences", "Cram in more raw data", "Speed up the hardware"],
      },
      correct: 0,
    },
  ],
  energy: [
    {
      q: { vi: "Vì sao AI tốn nhiều điện đáng kể?", en: "Why does AI use significant electricity?" },
      opts: {
        vi: ["Mỗi lượt dùng tốn ít, nhưng nhân với hàng triệu người thì rất lớn", "Vì màn hình sáng hơn", "AI không tốn điện gì cả"],
        en: ["Each use is small, but times millions of people it's huge", "Because screens get brighter", "AI uses no electricity at all"],
      },
      correct: 0,
    },
  ],
  reasoning: [
    {
      q: { vi: "Vì sao “suy nghĩ từng bước” giúp AI trả lời đúng hơn?", en: "Why does 'thinking step by step' make AI more accurate?" },
      opts: {
        vi: ["Mỗi bước viết ra thành ngữ cảnh cho bước sau, nên lời giải dựng dần thay vì đoán một phát", "Vì nó tra Google giữa chừng", "Vì phần cứng chạy nhanh hơn"],
        en: ["Each written step becomes context for the next, building the solution instead of one-shot guessing", "It googles midway", "The hardware runs faster"],
      },
      correct: 0,
    },
  ],
};

const UI = {
  title: { vi: "✅ Kiểm tra nhanh", en: "✅ Quick check" },
  sub: { vi: "Trả lời đúng để cộng vào điểm hành trình của bạn.", en: "Answer correctly to add to your journey score." },
  done: { vi: "🎉 Chuẩn! Đã ghi điểm.", en: "🎉 Correct! Point recorded." },
  already: { vi: "Bạn đã trả lời đúng câu này rồi 👍", en: "You already got this one 👍" },
  wrong: { vi: "Chưa đúng — đáp án đúng đã được tô sáng.", en: "Not quite — the correct answer is highlighted." },
};

export function hasMicroQuiz(roomId) {
  return Array.isArray(BANK[roomId]) && BANK[roomId].length > 0;
}

// Chèn khối quiz nhỏ vào cuối phần thân phòng.
export function renderMicroQuiz(container, roomId) {
  const questions = BANK[roomId];
  if (!questions || !questions.length) return;

  const panel = document.createElement("div");
  panel.className = "panel micro-quiz";
  panel.innerHTML = `
    <h4>${tx(UI.title)}</h4>
    <p class="muted">${tx(UI.sub)}</p>
    <div class="mq-list"></div>`;
  container.appendChild(panel);

  const list = panel.querySelector(".mq-list");
  const solved = getMicroSolved(roomId); // tập chỉ số câu đã trả lời đúng

  questions.forEach((item, qi) => {
    const block = document.createElement("div");
    block.className = "quiz-q";
    block.innerHTML = `<div class="q-text">${tx(item.q)}</div>`;
    const opts = tx(item.opts);
    const solvedBefore = solved.has(qi); // đúng chính xác câu qi ở lần trước
    opts.forEach((opt, oi) => {
      const btn = document.createElement("button");
      btn.className = "quiz-opt";
      btn.textContent = opt;
      if (solvedBefore) {
        btn.disabled = true;
        if (oi === item.correct) btn.classList.add("correct");
      }
      btn.onclick = () => {
        block.querySelectorAll(".quiz-opt").forEach((b) => (b.disabled = true));
        const note = block.querySelector(".mq-note") || document.createElement("div");
        note.className = "mq-note muted mt";
        if (oi === item.correct) {
          btn.classList.add("correct");
          markMicroQuiz(roomId, qi);
          sfx.success();
          note.textContent = tx(UI.done);
        } else {
          btn.classList.add("wrong");
          block.querySelectorAll(".quiz-opt")[item.correct].classList.add("correct");
          sfx.wrong();
          note.textContent = tx(UI.wrong);
        }
        if (!block.querySelector(".mq-note")) block.appendChild(note);
      };
      block.appendChild(btn);
    });
    list.appendChild(block);
  });
}
