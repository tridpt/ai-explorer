// Phòng — Tổng kết + Quiz + Huy hiệu. Song ngữ.
import { sfx, celebrate } from "../sound.js";
import { setBestScore, getMicroTotal } from "../store.js";
import { tx } from "../i18n.js";
import { QUIZ_EXPLANATIONS } from "../roomtrust.js";

const POINTS = [
  { icon: "📸", title: { vi: "AI học từ ví dụ", en: "AI learns from examples" }, text: { vi: "Dữ liệu cung cấp ví dụ; thuật toán, nhãn và cách đánh giá vẫn do con người thiết kế.", en: "Data provides examples; people still design algorithms, labels, and evaluation." } },
  { icon: "🕸️", title: { vi: "Mạng học mẫu phi tuyến", en: "Networks learn nonlinear patterns" }, text: { vi: "Nhiều lớp biến đổi đơn giản có thể ghép thành hàm phức tạp; năng lực phụ thuộc kiến trúc, dữ liệu và huấn luyện.", en: "Layers of simple transformations can compose complex functions; capability depends on architecture, data, and training." } },
  { icon: "🤖", title: { vi: "Có khi nó học qua thử–sai", en: "Sometimes it learns by trial" }, text: { vi: "Học tăng cường tối ưu tín hiệu thưởng qua tương tác; thiết kế reward và môi trường quyết định hành vi học được.", en: "Reinforcement learning optimizes reward through interaction; reward and environment design shape behavior." } },
  { icon: "🧲", title: { vi: "Có khi nó tìm cấu trúc", en: "Sometimes it finds structure" }, text: { vi: "Clustering gom điểm theo thước đo giống nhau, nhưng con người vẫn chọn đặc trưng, khoảng cách và số cụm.", en: "Clustering groups points by a similarity measure, while humans choose features, distance, and cluster count." } },
  { icon: "🗺️", title: { vi: "Ý nghĩa có thể thành vector", en: "Meaning can be represented as vectors" }, text: { vi: "Một số quan hệ hiện thành hướng/khoảng cách trong embedding; phép loại suy phụ thuộc model và dữ liệu.", en: "Some relations appear as embedding directions or distances; analogies depend on model and data." } },
  { icon: "👁️", title: { vi: "Attention trộn thông tin", en: "Attention mixes information" }, text: { vi: "Token trao đổi thông tin theo trọng số qua nhiều head/layer; trọng số không tự là lời giải thích nhân quả.", en: "Tokens exchange weighted information across heads and layers; weights alone are not causal explanations." } },
  { icon: "🎲", title: { vi: "Nó dự đoán theo xác suất", en: "It predicts probabilistically" }, text: { vi: "Sự trôi chảy từ dự đoán token không bảo đảm tính đúng; đầu ra quan trọng vẫn cần kiểm chứng.", en: "Fluency from token prediction does not ensure factuality; important outputs still need verification." } },
  { icon: "⚖️", title: { vi: "Nó phản chiếu hệ thống dữ liệu", en: "It reflects its data system" }, text: { vi: "Thiên kiến có thể đến từ dữ liệu, nhãn, mục tiêu và bối cảnh triển khai — cần đo theo tác vụ cụ thể.", en: "Bias can arise from data, labels, objectives, and deployment context—and must be measured per task." } },
  { icon: "🔧", title: { vi: "Nó có thể tra tài liệu", en: "It can retrieve documents" }, text: { vi: "RAG đưa đoạn truy xuất vào ngữ cảnh và hỗ trợ dẫn nguồn, nhưng retrieval/generation vẫn có thể sai.", en: "RAG adds retrieved passages to context and enables citations, while retrieval and generation can still fail." } },
  { icon: "🧩", title: { vi: "Có nhiều cách điều chỉnh", en: "There are multiple adaptation methods" }, text: { vi: "Prompting đổi đầu vào; fine-tuning đổi tham số. Chi phí và chất lượng phụ thuộc model, dữ liệu và mục tiêu.", en: "Prompting changes input; fine-tuning changes parameters. Cost and quality depend on model, data, and goals." } },
  { icon: "🤝", title: { vi: "Nó có thể dùng công cụ", en: "It can use tools" }, text: { vi: "Agent nối model với tool và vòng lặp; quyền hành động đòi hỏi kiểm tra, giới hạn và giám sát.", en: "Agents connect models to tools and loops; action permissions require checks, limits, and oversight." } },
  { icon: "🖼️", title: { vi: "Nó kết nối ảnh và chữ", en: "It connects images and text" }, text: { vi: "Hệ đa phương thức kết nối modality bằng nhiều kiến trúc khác nhau; output vẫn phụ thuộc dữ liệu và đánh giá.", en: "Multimodal systems connect modalities through varied architectures; outputs still depend on data and evaluation." } },
];

const QUIZ = [
  { q: { vi: "AI trong phòng 'Tự tay dạy AI' học để phân biệt bằng cách nào?", en: "How did the AI in 'Teach an AI' learn to tell things apart?" },
    opts: { vi: ["Được lập trình sẵn từng quy tắc", "Xem các ảnh mẫu bạn cung cấp rồi tự rút ra", "Tra trên Internet"], en: ["Pre-programmed with each rule", "Watching your sample images and generalizing", "Searching the Internet"] }, correct: 1 },
  { q: { vi: "Vì sao một mạng chỉ có 1 nơ-ron không tách được điểm trong/ngoài vòng tròn?", en: "Why can't a 1-neuron network separate inside/outside a circle?" },
    opts: { vi: ["Vì nó chỉ vẽ được một đường thẳng", "Vì máy tính quá yếu", "Vì thiếu dữ liệu"], en: ["It can only draw a straight line", "The computer is too weak", "Not enough data"] }, correct: 0 },
  { q: { vi: "Phép tính 'vua − đàn ông + đàn bà = nữ hoàng' cho thấy điều gì?", en: "What does 'king − man + woman = queen' show?" },
    opts: { vi: ["AI tra từ điển", "Khoảng cách giữa các từ mang ý nghĩa", "Đó chỉ là trùng hợp"], en: ["AI looks up a dictionary", "Distances between words carry meaning", "It's just a coincidence"] }, correct: 1 },
  { q: { vi: "Cơ chế attention giúp AI làm gì?", en: "What does attention let AI do?" },
    opts: { vi: ["Đọc nhanh hơn", "Biết mỗi từ nên 'chú ý' tới từ nào khác để hiểu ngữ cảnh", "Nén dữ liệu"], en: ["Read faster", "Know which words each word should attend to for context", "Compress data"] }, correct: 1 },
  { q: { vi: "Vì sao AI đôi khi 'ảo giác' — nói sai mà vẫn rất tự tin?", en: "Why does AI sometimes 'hallucinate' — wrong yet confident?" },
    opts: { vi: ["Vì nó cố tình nói dối", "Vì nó chọn từ theo xác suất nghe hợp lý, không kiểm chứng sự thật", "Vì lỗi mạng"], en: ["It lies on purpose", "It picks plausible words by probability without verifying facts", "Network error"] }, correct: 1 },
  { q: { vi: "Vì sao AI có thể mang thiên kiến?", en: "Why can AI be biased?" },
    opts: { vi: ["Vì nó học từ dữ liệu của con người, vốn đã có định kiến", "Vì nó ghét một số nhóm người", "AI không bao giờ thiên kiến"], en: ["It learns from human data that already holds bias", "It hates some groups", "AI is never biased"] }, correct: 0 },
  { q: { vi: "AI tạo ảnh (diffusion) bắt đầu từ đâu?", en: "Where does image AI (diffusion) start?" },
    opts: { vi: ["Từ một bức ảnh có sẵn rồi sửa", "Từ nhiễu ngẫu nhiên, rồi khử nhiễu dần", "Từ việc ghép ảnh trên mạng"], en: ["From an existing image it edits", "From random noise, then denoises", "By stitching web images"] }, correct: 1 },
  { q: { vi: "Vì sao 'token' lại quan trọng?", en: "Why do 'tokens' matter?" },
    opts: { vi: ["Vì AI xử lý và tính chi phí theo token, không theo chữ", "Vì token làm ảnh đẹp hơn", "Token không quan trọng"], en: ["AI processes and bills by token, not letters", "Tokens make images prettier", "Tokens don't matter"] }, correct: 0 },
  { q: { vi: "Điểm mạnh đặc biệt của cây quyết định là gì?", en: "What's a decision tree's special strength?" },
    opts: { vi: ["Luôn chính xác hơn mọi AI khác", "Minh bạch — ta nhìn thấy được từng luật", "Chạy nhanh nhất"], en: ["Always more accurate than any AI", "Transparent — you see every rule", "Runs fastest"] }, correct: 1 },
  { q: { vi: "Học tăng cường (reinforcement learning) khác gì các cách học kia?", en: "How does reinforcement learning differ?" },
    opts: { vi: ["AI học từ thưởng–phạt qua thử–sai, không cần đáp án có sẵn", "AI chép đáp án từ sách", "Không cần dữ liệu gì cả"], en: ["AI learns from reward/penalty by trial, no answer key", "AI copies answers from a book", "It needs no data at all"] }, correct: 0 },
  { q: { vi: "Học không giám sát (tự phân nhóm) nghĩa là gì?", en: "What does unsupervised learning (clustering) mean?" },
    opts: { vi: ["AI tự tìm nhóm trong dữ liệu mà không cần nhãn", "AI được dạy từng đáp án", "AI hỏi con người mỗi bước"], en: ["AI finds groups in data with no labels", "AI is taught every answer", "AI asks a human each step"] }, correct: 0 },
  { q: { vi: "Vì sao AI nhận diện ảnh có thể bị 'đánh lừa'?", en: "Why can image-recognition AI be 'fooled'?" },
    opts: { vi: ["Vì nó bám vào mẫu pixel nhỏ mà mắt người không để ý", "Vì nó lười", "Không thể đánh lừa AI"], en: ["It latches onto tiny pixel patterns humans ignore", "It's lazy", "AI can't be fooled"] }, correct: 0 },
  { q: { vi: "RAG giúp chatbot trả lời đúng tài liệu riêng bằng cách nào?", en: "How does RAG ground answers in your own documents?" },
    opts: { vi: ["Tìm những mảnh tài liệu liên quan rồi đưa vào ngữ cảnh trước khi trả lời", "Học thuộc lòng cả Internet", "Đoán bừa cho nhanh"], en: ["Retrieving relevant passages into context before answering", "Memorizing the whole Internet", "Guessing quickly"] }, correct: 0 },
  { q: { vi: "Khác biệt cốt lõi giữa prompting và fine-tuning là gì?", en: "Core difference between prompting and fine-tuning?" },
    opts: { vi: ["Prompting chỉ dẫn lúc dùng; fine-tuning đổi trọng số của mô hình", "Cả hai giống hệt nhau", "Prompting luôn đắt hơn"], en: ["Prompting guides at use-time; fine-tuning changes the model's weights", "They're identical", "Prompting always costs more"] }, correct: 0 },
  { q: { vi: "Điều gì khiến một 'AI agent' khác chatbot thường?", en: "What makes an 'AI agent' differ from a plain chatbot?" },
    opts: { vi: ["Nó lên kế hoạch nhiều bước và tự gọi công cụ", "Nó chỉ trả lời nhanh hơn", "Nó chỉ biết dịch"], en: ["It plans multi-step and calls tools itself", "It just replies faster", "It only translates"] }, correct: 0 },
  { q: { vi: "Mô hình 'multimodal' đặc biệt ở chỗ nào?", en: "What's special about a 'multimodal' model?" },
    opts: { vi: ["Hiểu nhiều loại dữ liệu (ảnh + chữ) trong cùng một không gian nghĩa", "Chỉ xử lý được chữ", "Chỉ chạy trên điện thoại"], en: ["It understands images + text in one shared meaning space", "It handles text only", "It only runs on phones"] }, correct: 0 },
];

const QUIZ_ROOM_IDS = [
  "teachable", "neural-net", "embeddings", "attention", "next-token", "bias",
  "diffusion", "tokenizer", "decision-tree", "reinforcement", "clustering",
  "adversarial", "rag", "finetune", "agents", "multimodal",
];

export function roomSummary(root) {
  root.innerHTML = `
    <p class="room-intro">
      ${tx(
        "Bạn vừa đi qua các góc nhìn về AI — từ cách nó học, cấu tạo bên trong, đến cả những giới hạn của nó. Đây là những gì đọng lại:",
        "You've explored many angles on AI — how it learns, what's inside, and its limits. Here's what sticks:"
      )}
    </p>
    <div class="room-grid" id="sumGrid"></div>

    <div id="microSlot"></div>

    <div class="panel" style="margin-top:24px;">
      <h4>${tx("🎯 Thử thách nhỏ: bạn nhớ được bao nhiêu?", "🎯 Quick challenge: how much do you recall?")}</h4>
      <p class="muted">${tx("Trả lời các câu để nhận huy hiệu hoàn thành hành trình.", "Answer the questions to earn your completion badge.")}</p>
      <div id="quiz" class="mt"></div>
    </div>

    <div id="badgeSlot"></div>

    <div class="takeaway" style="margin-top:18px;">
      ${tx(
        "💡 <strong>Sự thật quan trọng nhất:</strong> AI không phải phép màu, cũng không phải bộ não biết suy nghĩ. Nó là một cỗ máy <em>nhận diện mẫu hình từ dữ liệu</em> cực kỳ mạnh mẽ. Hiểu được điều đó, bạn vừa biết tận dụng sức mạnh của nó, vừa giữ được sự tỉnh táo trước những gì nó nói.",
        "💡 <strong>The most important truth:</strong> AI is neither magic nor a thinking brain. It's an extremely powerful machine that <em>recognizes patterns from data</em>. Knowing that, you can harness its power while staying clear-eyed about what it says."
      )}
    </div>

    <div class="panel" style="margin-top:18px;">
      <h4>${tx("📚 Muốn đào sâu hơn?", "📚 Want to go deeper?")}</h4>
      <p class="muted">${tx("Vài nguồn uy tín, trực quan để học tiếp:", "A few reputable, visual resources to keep learning:")}</p>
      <ul class="resources">
        <li><a href="https://playground.tensorflow.org" target="_blank" rel="noopener">TensorFlow Playground</a> — ${tx("nghịch mạng nơ-ron ngay trên trình duyệt.", "play with neural networks in your browser.")}</li>
        <li><a href="https://teachablemachine.withgoogle.com" target="_blank" rel="noopener">Google Teachable Machine</a> — ${tx("tự huấn luyện model thật, không cần code.", "train a real model, no code needed.")}</li>
        <li><a href="https://poloclub.github.io/cnn-explainer/" target="_blank" rel="noopener">CNN Explainer</a> — ${tx("nhìn vào bên trong mạng nhận diện ảnh.", "look inside an image-recognition network.")}</li>
        <li><a href="https://jalammar.github.io/illustrated-transformer/" target="_blank" rel="noopener">The Illustrated Transformer</a> — ${tx("giải thích attention bằng hình ảnh.", "attention explained with visuals.")}</li>
      </ul>
    </div>
  `;

  const grid = root.querySelector("#sumGrid");
  POINTS.forEach((p) => {
    const card = document.createElement("div");
    card.className = "room-card";
    card.style.cursor = "default";
    card.innerHTML = `<div class="rc-icon">${p.icon}</div><h3>${tx(p.title)}</h3><p>${tx(p.text)}</p>`;
    grid.appendChild(card);
  });

  // Tổng số câu "kiểm tra nhanh" đã trả lời đúng dọc đường (quiz nhỏ mỗi phòng).
  const microDone = getMicroTotal();
  if (microDone > 0) {
    const slot = root.querySelector("#microSlot");
    slot.innerHTML = `
      <div class="takeaway" style="margin-top:20px;">
        ${tx(
          `✅ <strong>Dọc hành trình</strong>, bạn đã trả lời đúng <strong>${microDone}</strong> câu kiểm tra nhanh ở các phòng. Điểm dưới đây là bài tổng kết cuối cùng.`,
          `✅ <strong>Along the way</strong>, you got <strong>${microDone}</strong> quick checks right across the rooms. The score below is your final recap quiz.`
        )}
      </div>`;
  }

  const quizEl = root.querySelector("#quiz");
  let score = 0;
  let answered = 0;

  QUIZ.forEach((item, qi) => {
    const block = document.createElement("div");
    block.className = "quiz-q";
    block.innerHTML = `<div class="q-text">${qi + 1}. ${tx(item.q)}</div>`;
    const opts = tx(item.opts);
    opts.forEach((opt, oi) => {
      const btn = document.createElement("button");
      btn.className = "quiz-opt";
      btn.textContent = opt;
      btn.onclick = () => {
        block.querySelectorAll(".quiz-opt").forEach((button) => (button.disabled = true));
        const correct = oi === item.correct;
        if (correct) {
          btn.classList.add("correct");
          score++;
          sfx.success();
        } else {
          btn.classList.add("wrong");
          block.querySelectorAll(".quiz-opt")[item.correct].classList.add("correct");
          sfx.wrong();
        }
        const explanation = QUIZ_EXPLANATIONS[QUIZ_ROOM_IDS[qi]];
        const note = document.createElement("div");
        note.className = "mq-note muted mt";
        note.setAttribute("role", "status");
        note.textContent = `${correct ? tx("Đúng.", "Correct.") : tx("Chưa đúng.", "Not quite.")} ${explanation ? tx(explanation) : ""}`.trim();
        block.appendChild(note);
        answered++;
        if (answered === QUIZ.length) finish();
      };
      block.appendChild(btn);
    });
    quizEl.appendChild(block);
  });

  function finish() {
    const slot = root.querySelector("#badgeSlot");
    let tier, emoji;
    if (score === QUIZ.length) { tier = tx("Bậc thầy AI", "AI Master"); emoji = "🏆"; }
    else if (score >= Math.ceil(QUIZ.length * 0.6)) { tier = tx("Nhà thám hiểm AI", "AI Explorer"); emoji = "🎖️"; }
    else { tier = tx("Người mới khởi hành", "Fresh Starter"); emoji = "🌱"; }

    setBestScore(score);

    slot.innerHTML = `
      <div class="badge mt">
        <div class="badge-ring">${emoji}</div>
        <h3>${tier}</h3>
        <div class="score">${score}/${QUIZ.length}</div>
        <p class="muted mt">${tx("Bạn đã hoàn thành hành trình AI Explorer. Chia sẻ huy hiệu này cho bạn bè nhé!", "You finished the AI Explorer journey. Share your badge with friends!")}</p>
        <div class="badge-actions mt">
          <button class="btn" id="shareBtn">${tx("🔗 Chia sẻ kết quả", "🔗 Share result")}</button>
          <button class="btn ghost" id="downloadBtn">${tx("⬇ Tải huy hiệu (ảnh)", "⬇ Download badge (image)")}</button>
          <button class="btn ghost" id="retryBtn">${tx("↺ Làm lại quiz", "↺ Retry quiz")}</button>
        </div>
        <div id="shareMsg" class="muted mt"></div>
      </div>
    `;
    slot.scrollIntoView({ behavior: "smooth", block: "center" });
    sfx.complete();
    if (score >= Math.ceil(QUIZ.length * 0.6)) celebrate();

    root.querySelector("#retryBtn").onclick = () => roomSummary(root);
    root.querySelector("#downloadBtn").onclick = () => downloadBadge(tier, emoji, score);
    root.querySelector("#shareBtn").onclick = () => shareResult(tier, score, root.querySelector("#shareMsg"));
  }

  async function shareResult(tier, score, msgEl) {
    const url = location.origin + location.pathname;
    const text = tx(
      `Tôi vừa hoàn thành hành trình AI Explorer và đạt danh hiệu "${tier}" (${score}/${QUIZ.length})! 🧠 Thử khám phá AI một cách trực quan tại đây:`,
      `I just finished the AI Explorer journey and earned the "${tier}" badge (${score}/${QUIZ.length})! 🧠 Explore AI visually here:`
    );
    if (navigator.share) {
      try { await navigator.share({ title: "AI Explorer", text, url }); return; } catch { /* hủy */ }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      msgEl.textContent = tx("✓ Đã copy nội dung chia sẻ vào clipboard — dán đi khoe thôi!", "✓ Copied the share text to clipboard — go paste and show off!");
    } catch {
      msgEl.textContent = tx("Hãy copy link trên thanh địa chỉ để chia sẻ nhé.", "Copy the URL from the address bar to share.");
    }
  }

  function downloadBadge(tier, emoji, score) {
    const c = document.createElement("canvas");
    c.width = 800; c.height = 800;
    const x = c.getContext("2d");
    const bg = x.createLinearGradient(0, 0, 800, 800);
    bg.addColorStop(0, "#0d0a1c");
    bg.addColorStop(1, "#1a1330");
    x.fillStyle = bg;
    x.fillRect(0, 0, 800, 800);
    const grad = x.createLinearGradient(250, 200, 550, 460);
    grad.addColorStop(0, "#6ea8fe");
    grad.addColorStop(1, "#b07bff");
    x.beginPath();
    x.arc(400, 320, 130, 0, Math.PI * 2);
    x.fillStyle = grad;
    x.fill();
    x.font = "150px serif";
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText(emoji, 400, 330);
    x.fillStyle = "#f4f2fb";
    x.font = "bold 54px 'Space Grotesk', sans-serif";
    x.fillText(tier, 400, 520);
    x.fillStyle = "#6ea8fe";
    x.font = "bold 90px 'Space Grotesk', sans-serif";
    x.fillText(`${score}/${QUIZ.length}`, 400, 620);
    x.fillStyle = "#a39fc0";
    x.font = "28px 'Inter', sans-serif";
    x.fillText("🧠 AI Explorer", 400, 710);
    const a = document.createElement("a");
    a.download = `ai-explorer-badge-${score}-${QUIZ.length}.png`;
    a.href = c.toDataURL("image/png");
    a.click();
  }
}
