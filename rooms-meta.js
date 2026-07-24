// Metadata thuần (không phụ thuộc DOM) của 26 phòng — nguồn dữ liệu duy nhất.
// Dùng bởi app.js (client) và build-seo.mjs (Node prerender). Thứ tự = mạch kể chuyện.
export const ROOM_META = [
  {
    id: "teachable", icon: "📸", num: "01",
    title: { vi: "Tự tay dạy AI", en: "Teach an AI yourself" },
    question: { vi: "AI học như thế nào?", en: "How does AI learn?" },
    blurb: {
      vi: "Bật webcam, dạy AI phân biệt vài tư thế chỉ trong 30 giây. Hiểu 'dữ liệu huấn luyện' bằng chính tay bạn.",
      en: "Turn on your webcam and teach an AI to tell poses apart in 30 seconds. Grasp 'training data' hands-on.",
    },
  },
  {
    id: "neural-net", icon: "🕸️", num: "02",
    title: { vi: "Bên trong mạng nơ-ron", en: "Inside a neural network" },
    question: { vi: "Bên trong AI là gì?", en: "What's inside an AI?" },
    blurb: {
      vi: "Kéo thanh trượt thay đổi số nơ-ron và xem AI vẽ ranh giới phân loại thay đổi theo thời gian thực.",
      en: "Drag a slider to change the neuron count and watch the AI's decision boundary reshape in real time.",
    },
  },
  {
    id: "overfitting", icon: "🎯", num: "03",
    title: { vi: "Học vẹt hay hiểu thật?", en: "Memorizing or understanding?" },
    question: { vi: "AI có thực sự 'hiểu'?", en: "Does AI truly 'understand'?" },
    blurb: {
      vi: "Khám phá overfitting: khi AI nhớ vanh vách bài cũ nhưng làm sai bài mới — và cách chữa nó.",
      en: "Explore overfitting: when an AI aces old examples but fails new ones — and how to fix it.",
    },
  },
  {
    id: "decision-tree", icon: "🌳", num: "04",
    title: { vi: "Cây quyết định", en: "Decision tree" },
    question: { vi: "Có loại AI 'nhìn thấy' được luật?", en: "An AI whose rules you can see?" },
    blurb: {
      vi: "Một kiểu AI minh bạch: đi qua chuỗi câu hỏi có/không mà ai cũng kiểm tra được vì sao nó kết luận vậy.",
      en: "A transparent kind of AI: a chain of yes/no questions where anyone can check why it decided that way.",
    },
  },
  {
    id: "reinforcement", icon: "🤖", num: "05",
    title: { vi: "Học qua thử và sai", en: "Learning by trial and error" },
    question: { vi: "AI học không cần đáp án thì sao?", en: "What if AI learns with no answer key?" },
    blurb: {
      vi: "Xem chú robot tự học đường tới đích bằng thưởng–phạt, không hề được chỉ trước — học tăng cường.",
      en: "Watch a robot learn its way to the goal via rewards and penalties, with no guidance — reinforcement learning.",
    },
  },
  {
    id: "clustering", icon: "🧲", num: "06",
    title: { vi: "Tự phân nhóm", en: "Grouping on its own" },
    question: { vi: "AI học mà không cần nhãn thì sao?", en: "What if AI learns with no labels?" },
    blurb: {
      vi: "Cho AI một đống dữ liệu lộn xộn — nó tự gom thành các nhóm giống nhau mà không ai chỉ. Học không giám sát.",
      en: "Give the AI a messy pile of data — it groups similar things by itself, unguided. Unsupervised learning.",
    },
  },
  {
    id: "tokenizer", icon: "✂️", num: "07",
    title: { vi: "Token là gì", en: "What is a token" },
    question: { vi: "AI đọc chữ kiểu gì?", en: "How does AI read text?" },
    blurb: {
      vi: "AI không thấy 'chữ' như ta — nó cắt câu thành token. Gõ thử và xem số token cùng chi phí.",
      en: "AI doesn't see 'letters' like we do — it slices text into tokens. Type and watch token count and cost.",
    },
  },
  {
    id: "embeddings", icon: "🗺️", num: "08",
    title: { vi: "Bản đồ ý nghĩa", en: "The map of meaning" },
    question: { vi: "AI hiểu nghĩa của từ ra sao?", en: "How does AI grasp word meaning?" },
    blurb: {
      vi: "Khám phá cách embedding biểu diễn từ bằng vector — và vì sao một số phép loại suy xuất hiện nhưng không phải lúc nào cũng đúng.",
      en: "Explore how embeddings represent words as vectors—and why some analogies emerge without being universal rules.",
    },
  },
  {
    id: "attention", icon: "👁️", num: "09",
    title: { vi: "AI đọc câu của bạn", en: "AI reads your sentence" },
    question: { vi: "Nó đọc một câu kiểu gì?", en: "How does it read a sentence?" },
    blurb: {
      vi: "Xem mô phỏng một attention head trộn thông tin giữa token — và hiểu vì sao trọng số không tự chứng minh AI đã 'hiểu'.",
      en: "See a simulation of one attention head mixing token information—and why weights alone do not prove 'understanding'.",
    },
  },
  {
    id: "next-token", icon: "🎲", num: "10",
    title: { vi: "Máy đoán chữ", en: "The word-guessing machine" },
    question: { vi: "Vì sao AI đôi khi đoán bừa?", en: "Why does AI sometimes make things up?" },
    blurb: {
      vi: "Chơi với trigram dự đoán từ tiếp theo, rồi phân biệt mô phỏng nhỏ này với LLM và các nguyên nhân ảo giác thực tế.",
      en: "Play with next-word trigram prediction, then distinguish this toy model from LLMs and real hallucination causes.",
    },
  },
  {
    id: "diffusion", icon: "🎨", num: "11",
    title: { vi: "AI tạo ảnh thế nào", en: "How AI makes images" },
    question: { vi: "Làm sao AI vẽ ra tranh?", en: "How does AI paint a picture?" },
    blurb: {
      vi: "Dùng hiệu ứng pixel để hình dung ý tưởng khử nhiễu nhiều bước, đồng thời phân biệt nó với diffusion model thật.",
      en: "Use a pixel effect to visualize multi-step denoising while distinguishing it from a real diffusion model.",
    },
  },
  {
    id: "recommendation", icon: "📺", num: "12",
    title: { vi: "Vì sao app hiểu bạn", en: "Why apps 'get' you" },
    question: { vi: "Sao TikTok đoán trúng gu bạn?", en: "How does TikTok nail your taste?" },
    blurb: {
      vi: "Bạn thích/bỏ qua vài mục, AI đoán bạn thích gì tiếp theo — cơ chế gợi ý đằng sau TikTok, YouTube, Netflix.",
      en: "Like/skip a few items and AI predicts what you'll enjoy next — the recommender behind TikTok, YouTube, Netflix.",
    },
  },
  {
    id: "bias", icon: "⚖️", num: "13",
    title: { vi: "AI có thiên kiến?", en: "Is AI biased?" },
    question: { vi: "AI có công bằng không?", en: "Is AI fair?" },
    blurb: {
      vi: "Dữ liệu dạy AI đến từ con người, nên AI cũng học cả định kiến của chúng ta. Khám phá điều đó.",
      en: "AI's training data comes from humans, so it learns our biases too. Explore how.",
    },
  },
  {
    id: "adversarial", icon: "🐺", num: "14",
    title: { vi: "Đánh lừa AI", en: "Fooling the AI" },
    question: { vi: "AI có thể bị lừa không?", en: "Can AI be tricked?" },
    blurb: {
      vi: "Thêm chút nhiễu mắt thường không thấy, AI nhìn gấu trúc hóa vượn. Điểm yếu bất ngờ và bài học an toàn.",
      en: "Add noise the eye can't see and AI sees a panda as a gibbon. A surprising weakness and a safety lesson.",
    },
  },
  {
    id: "turing", icon: "🕵️", num: "15",
    title: { vi: "Người hay AI viết?", en: "Human or AI?" },
    question: { vi: "Bạn phân biệt được không?", en: "Can you tell them apart?" },
    blurb: {
      vi: "Đọc từng đoạn và đoán do người hay AI viết. Rèn con mắt tỉnh táo trong thời đại AI.",
      en: "Read each passage and guess if a human or AI wrote it. Sharpen your eye for the AI era.",
    },
  },
  {
    id: "chatbot", icon: "💬", num: "16",
    title: { vi: "Chatbot mini", en: "Mini chatbot" },
    question: { vi: "Ghép tất cả lại thành gì?", en: "What do all the pieces build?" },
    blurb: {
      vi: "Token + ý nghĩa + chú ý + đoán chữ ghép lại thành một trợ lý. Trò chuyện và xem nó xử lý từng bước.",
      en: "Tokens + meaning + attention + guessing combine into an assistant. Chat and watch it work step by step.",
    },
  },
  {
    id: "rag", icon: "🔧", num: "17",
    title: { vi: "AI tra cứu tài liệu", en: "AI that looks things up" },
    question: { vi: "Sao chatbot đọc được tài liệu riêng?", en: "How does a chatbot read your docs?" },
    blurb: {
      vi: "RAG đưa đoạn truy xuất vào ngữ cảnh và hỗ trợ dẫn nguồn — nhưng retrieval lẫn câu trả lời vẫn cần được kiểm tra.",
      en: "RAG adds retrieved passages to context and supports citations—but retrieval and answers still need verification.",
    },
  },
  {
    id: "finetune", icon: "🧩", num: "18",
    title: { vi: "Dạy thêm cho AI", en: "Teaching an AI more" },
    question: { vi: "Prompt hay fine-tune?", en: "Prompt or fine-tune?" },
    blurb: {
      vi: "Hai cách 'dạy thêm' cho AI: chỉ dẫn ngay lúc dùng (prompting) hay huấn luyện lại trọng số (fine-tuning). Khi nào dùng cái nào?",
      en: "Two ways to 'teach' an AI: guide it at use-time (prompting) or retrain its weights (fine-tuning). When to use which?",
    },
  },
  {
    id: "agents", icon: "🤝", num: "19",
    title: { vi: "AI biết dùng công cụ", en: "AI that uses tools" },
    question: { vi: "AI tự làm việc nhiều bước kiểu gì?", en: "How does AI do multi-step work?" },
    blurb: {
      vi: "Xem trace viết sẵn của vòng lặp agent gọi công cụ, cùng những rủi ro về tool lỗi, quyền hạn và dữ liệu cũ.",
      en: "Inspect a scripted tool-using agent loop and its risks: tool failures, permissions, and stale data.",
    },
  },
  {
    id: "multimodal", icon: "🖼️", num: "20",
    title: { vi: "AI hiểu cả ảnh lẫn chữ", en: "AI that sees and reads" },
    question: { vi: "Làm sao AI 'nhìn' được ảnh?", en: "How does AI 'see' an image?" },
    blurb: {
      vi: "Khám phá vài cách hệ đa phương thức kết nối ảnh và chữ; output trong demo là dữ liệu viết sẵn, không phải vision model thật.",
      en: "Explore ways multimodal systems connect image and text; demo outputs are scripted, not real vision inference.",
    },
  },
  {
    id: "context-window", icon: "🪟", num: "21",
    title: { vi: "Cửa sổ ngữ cảnh", en: "The context window" },
    question: { vi: "Vì sao AI quên đầu câu chuyện?", en: "Why does AI forget the start?" },
    blurb: {
      vi: "AI chỉ nhớ được một lượng token giới hạn cùng lúc. Trò chuyện dài quá, tin cũ rơi ra — và AI quên. Tự tay thấy điều đó.",
      en: "AI only holds a limited amount of tokens at once. Chat too long and old messages fall out — the AI forgets. See it for yourself.",
    },
  },
  {
    id: "prompt-injection", icon: "🛡️", num: "22",
    title: { vi: "Đánh lừa trợ lý AI", en: "Hijacking an AI assistant" },
    question: { vi: "Có thể lừa AI làm trái lệnh không?", en: "Can you make an AI break its rules?" },
    blurb: {
      vi: "Đóng vai kẻ tấn công: nhét 'câu lệnh lén' vào tin nhắn để moi bí mật của trợ lý AI — và xem lớp phòng thủ chặn được tới đâu. Đây là prompt injection.",
      en: "Play the attacker: slip a 'sneaky instruction' into a message to extract an AI assistant's secret — and see how far defenses hold. This is prompt injection.",
    },
  },
  {
    id: "rlhf", icon: "👍", num: "23",
    title: { vi: "Dạy AI cư xử cho phải", en: "Teaching AI to behave" },
    question: { vi: "Sao AI biết trả lời 'dễ nghe'?", en: "How does AI learn to be helpful?" },
    blurb: {
      vi: "Xếp hạng vài câu trả lời để minh họa preference data; demo không huấn luyện reward model hay policy thật.",
      en: "Rank responses to illustrate preference data; the demo trains no real reward model or policy.",
    },
  },
  {
    id: "energy", icon: "⚡", num: "24",
    title: { vi: "AI ngốn bao nhiêu điện?", en: "How much power does AI use?" },
    question: { vi: "Dùng AI tốn năng lượng cỡ nào?", en: "What does using AI cost in energy?" },
    blurb: {
      vi: "Thử các giả định năng lượng để thấy tác động của quy mô; số Wh minh họa không phải phép đo hay định mức chung.",
      en: "Explore energy assumptions to see scale effects; the illustrative Wh values are not measurements or universal rates.",
    },
  },
  {
    id: "reasoning", icon: "💭", num: "25",
    title: { vi: "AI biết suy nghĩ từng bước", en: "AI that thinks step by step" },
    question: { vi: "Vì sao 'nghĩ' giúp AI trả lời đúng hơn?", en: "Why does 'thinking' make AI more accurate?" },
    blurb: {
      vi: "So sánh hai đầu ra viết sẵn để hiểu ngân sách suy luận: nhiều bước có thể giúp một số bài nhưng không bảo đảm đúng.",
      en: "Compare two scripted outputs to understand inference budget: more steps can help some tasks but do not guarantee correctness.",
    },
  },
  {
    id: "summary", icon: "🎓", num: "26",
    title: { vi: "Bạn đã hiểu AI rồi", en: "You get AI now" },
    question: { vi: "Tổng kết hành trình", en: "Journey recap" },
    blurb: {
      vi: "Điểm lại những ý tưởng cốt lõi bạn vừa khám phá — và đâu là sự thật quan trọng nhất về AI.",
      en: "Revisit the core ideas you just explored — and the single most important truth about AI.",
    },
  },
];
