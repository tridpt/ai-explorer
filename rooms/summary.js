// Phòng — Tổng kết + Quiz + Huy hiệu. Song ngữ.
import { sfx, celebrate } from "../sound.js";
import { setBestScore } from "../store.js";
import { tx } from "../i18n.js";

const POINTS = [
  { icon: "📸", title: { vi: "AI học từ ví dụ", en: "AI learns from examples" }, text: { vi: "Không ai lập trình từng quy tắc. Bạn cho AI xem dữ liệu, nó tự rút ra mẫu hình.", en: "No one codes each rule. You show it data and it extracts patterns." } },
  { icon: "🕸️", title: { vi: "Nó là nhiều nơ-ron đơn giản", en: "It's many simple neurons" }, text: { vi: "Mỗi nơ-ron rất ngốc, nhưng ghép hàng triệu cái lại thì học được những thứ phức tạp.", en: "Each neuron is dumb, but millions combined learn complex things." } },
  { icon: "🤖", title: { vi: "Có khi nó học qua thử–sai", en: "Sometimes it learns by trial" }, text: { vi: "Học tăng cường: AI tự thử, được thưởng khi làm tốt, và dần tìm ra cách tối ưu — không cần đáp án.", en: "Reinforcement learning: it tries, gets rewarded for good moves, and finds the optimal way — no answer key." } },
  { icon: "🧲", title: { vi: "Có khi nó tự tìm nhóm", en: "Sometimes it groups by itself" }, text: { vi: "Học không giám sát: không cần nhãn, AI tự phát hiện cấu trúc và gom dữ liệu giống nhau lại.", en: "Unsupervised learning: with no labels, AI finds structure and groups similar data itself." } },
  { icon: "🗺️", title: { vi: "Từ ngữ là tọa độ", en: "Words are coordinates" }, text: { vi: "AI biến chữ thành điểm trên bản đồ ý nghĩa, nên nó tính được cả 'vua − đàn ông + đàn bà'.", en: "AI turns words into points on a meaning map, so it can compute 'king − man + woman'." } },
  { icon: "👁️", title: { vi: "Nó chú ý có chọn lọc", en: "It attends selectively" }, text: { vi: "Với mỗi từ, AI cân nhắc cả câu để hiểu ngữ cảnh — đó là cơ chế attention.", en: "For each word, AI weighs the whole sentence to grasp context — that's attention." } },
  { icon: "🎲", title: { vi: "Nó đoán theo xác suất", en: "It guesses by probability" }, text: { vi: "AI không 'biết' sự thật, nó chọn từ nghe hợp lý. Vì thế nó có thể sai mà vẫn rất tự tin.", en: "AI doesn't 'know' the truth, it picks plausible words. So it can be wrong yet confident." } },
  { icon: "⚖️", title: { vi: "Nó phản chiếu dữ liệu", en: "It mirrors the data" }, text: { vi: "AI học cả định kiến của con người. Dữ liệu lệch thì AI cũng lệch.", en: "AI learns human biases too. Skewed data means a skewed AI." } },
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
        block.querySelectorAll(".quiz-opt").forEach((b) => (b.disabled = true));
        if (oi === item.correct) {
          btn.classList.add("correct");
          score++;
          sfx.success();
        } else {
          btn.classList.add("wrong");
          block.querySelectorAll(".quiz-opt")[item.correct].classList.add("correct");
          sfx.wrong();
        }
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
