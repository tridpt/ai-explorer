// Phòng 07 — Tổng kết + Quiz + Huy hiệu hoàn thành
import { sfx, celebrate } from "../sound.js";
import { setBestScore } from "../store.js";

const POINTS = [
  { icon: "📸", title: "AI học từ ví dụ", text: "Không ai lập trình từng quy tắc. Bạn cho AI xem dữ liệu, nó tự rút ra mẫu hình." },
  { icon: "🕸️", title: "Nó là nhiều nơ-ron đơn giản", text: "Mỗi nơ-ron rất ngốc, nhưng ghép hàng triệu cái lại thì học được những thứ phức tạp." },
  { icon: "🗺️", title: "Từ ngữ là tọa độ", text: "AI biến chữ thành điểm trên bản đồ ý nghĩa, nên nó tính được cả 'vua − đàn ông + đàn bà'." },
  { icon: "👁️", title: "Nó chú ý có chọn lọc", text: "Với mỗi từ, AI cân nhắc cả câu để hiểu ngữ cảnh — đó là cơ chế attention." },
  { icon: "🎲", title: "Nó đoán theo xác suất", text: "AI không 'biết' sự thật, nó chọn từ nghe hợp lý. Vì thế nó có thể sai mà vẫn rất tự tin." },
  { icon: "⚖️", title: "Nó phản chiếu dữ liệu", text: "AI học cả định kiến của con người. Dữ liệu lệch thì AI cũng lệch." },
];

const QUIZ = [
  {
    q: "AI trong phòng 'Tự tay dạy AI' học để phân biệt bằng cách nào?",
    opts: ["Được lập trình sẵn từng quy tắc", "Xem các ảnh mẫu bạn cung cấp rồi tự rút ra", "Tra trên Internet"],
    correct: 1,
  },
  {
    q: "Vì sao một mạng chỉ có 1 nơ-ron không tách được điểm trong/ngoài vòng tròn?",
    opts: ["Vì nó chỉ vẽ được một đường thẳng", "Vì máy tính quá yếu", "Vì thiếu dữ liệu"],
    correct: 0,
  },
  {
    q: "Phép tính 'vua − đàn ông + đàn bà = nữ hoàng' cho thấy điều gì?",
    opts: ["AI tra từ điển", "Khoảng cách giữa các từ mang ý nghĩa", "Đó chỉ là trùng hợp"],
    correct: 1,
  },
  {
    q: "Cơ chế attention giúp AI làm gì?",
    opts: ["Đọc nhanh hơn", "Biết mỗi từ nên 'chú ý' tới từ nào khác để hiểu ngữ cảnh", "Nén dữ liệu"],
    correct: 1,
  },
  {
    q: "Vì sao AI đôi khi 'ảo giác' — nói sai mà vẫn rất tự tin?",
    opts: ["Vì nó cố tình nói dối", "Vì nó chọn từ theo xác suất nghe hợp lý, không kiểm chứng sự thật", "Vì lỗi mạng"],
    correct: 1,
  },
  {
    q: "Vì sao AI có thể mang thiên kiến?",
    opts: ["Vì nó học từ dữ liệu của con người, vốn đã có định kiến", "Vì nó ghét một số nhóm người", "AI không bao giờ thiên kiến"],
    correct: 0,
  },
  {
    q: "AI tạo ảnh (diffusion) bắt đầu từ đâu?",
    opts: ["Từ một bức ảnh có sẵn rồi sửa", "Từ nhiễu ngẫu nhiên, rồi khử nhiễu dần", "Từ việc ghép ảnh trên mạng"],
    correct: 1,
  },
  {
    q: "Vì sao 'token' lại quan trọng?",
    opts: ["Vì AI xử lý và tính chi phí theo token, không theo chữ", "Vì token làm ảnh đẹp hơn", "Token không quan trọng"],
    correct: 0,
  },
  {
    q: "Điểm mạnh đặc biệt của cây quyết định là gì?",
    opts: ["Luôn chính xác hơn mọi AI khác", "Minh bạch — ta nhìn thấy được từng luật", "Chạy nhanh nhất"],
    correct: 1,
  },
];

export function roomSummary(root) {
  root.innerHTML = `
    <p class="room-intro">
      Bạn vừa đi qua sáu góc nhìn về AI — từ cách nó học, cấu tạo bên trong, đến cả những giới hạn của nó.
      Đây là những gì đọng lại:
    </p>
    <div class="room-grid" id="sumGrid"></div>

    <div class="panel" style="margin-top:24px;">
      <h4>🎯 Thử thách nhỏ: bạn nhớ được bao nhiêu?</h4>
      <p class="muted">Trả lời 6 câu để nhận huy hiệu hoàn thành hành trình.</p>
      <div id="quiz" class="mt"></div>
    </div>

    <div id="badgeSlot"></div>

    <div class="takeaway" style="margin-top:18px;">
      💡 <strong>Sự thật quan trọng nhất:</strong> AI không phải phép màu, cũng không phải bộ não biết suy nghĩ.
      Nó là một cỗ máy <em>nhận diện mẫu hình từ dữ liệu</em> cực kỳ mạnh mẽ. Hiểu được điều đó,
      bạn vừa biết tận dụng sức mạnh của nó, vừa giữ được sự tỉnh táo trước những gì nó nói.
    </div>

    <div class="panel" style="margin-top:18px;">
      <h4>📚 Muốn đào sâu hơn?</h4>
      <p class="muted">Vài nguồn uy tín, trực quan để học tiếp:</p>
      <ul class="resources">
        <li><a href="https://playground.tensorflow.org" target="_blank" rel="noopener">TensorFlow Playground</a> — nghịch mạng nơ-ron ngay trên trình duyệt.</li>
        <li><a href="https://teachablemachine.withgoogle.com" target="_blank" rel="noopener">Google Teachable Machine</a> — tự huấn luyện model thật, không cần code.</li>
        <li><a href="https://poloclub.github.io/cnn-explainer/" target="_blank" rel="noopener">CNN Explainer</a> — nhìn vào bên trong mạng nhận diện ảnh.</li>
        <li><a href="https://jalammar.github.io/illustrated-transformer/" target="_blank" rel="noopener">The Illustrated Transformer</a> — giải thích attention bằng hình ảnh.</li>
      </ul>
    </div>
  `;

  const grid = root.querySelector("#sumGrid");
  POINTS.forEach((p) => {
    const card = document.createElement("div");
    card.className = "room-card";
    card.style.cursor = "default";
    card.innerHTML = `<div class="rc-icon">${p.icon}</div><h3>${p.title}</h3><p>${p.text}</p>`;
    grid.appendChild(card);
  });

  const quizEl = root.querySelector("#quiz");
  let score = 0;
  let answered = 0;

  QUIZ.forEach((item, qi) => {
    const block = document.createElement("div");
    block.className = "quiz-q";
    block.innerHTML = `<div class="q-text">${qi + 1}. ${item.q}</div>`;
    item.opts.forEach((opt, oi) => {
      const btn = document.createElement("button");
      btn.className = "quiz-opt";
      btn.textContent = opt;
      btn.onclick = () => {
        // khóa các lựa chọn của câu này
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
    if (score === QUIZ.length) { tier = "Bậc thầy AI"; emoji = "🏆"; }
    else if (score >= Math.ceil(QUIZ.length * 0.6)) { tier = "Nhà thám hiểm AI"; emoji = "🎖️"; }
    else { tier = "Người mới khởi hành"; emoji = "🌱"; }

    setBestScore(score);

    slot.innerHTML = `
      <div class="badge mt">
        <div class="badge-ring">${emoji}</div>
        <h3>${tier}</h3>
        <div class="score">${score}/${QUIZ.length}</div>
        <p class="muted mt">Bạn đã hoàn thành hành trình AI Explorer. Chia sẻ huy hiệu này cho bạn bè nhé!</p>
        <div class="badge-actions mt">
          <button class="btn" id="shareBtn">🔗 Chia sẻ kết quả</button>
          <button class="btn ghost" id="downloadBtn">⬇ Tải huy hiệu (ảnh)</button>
          <button class="btn ghost" id="retryBtn">↺ Làm lại quiz</button>
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

  // ---------- Chia sẻ ----------
  async function shareResult(tier, score, msgEl) {
    const url = location.origin + location.pathname;
    const text = `Tôi vừa hoàn thành hành trình AI Explorer và đạt danh hiệu "${tier}" (${score}/${QUIZ.length})! 🧠 Thử khám phá AI một cách trực quan tại đây:`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "AI Explorer", text, url });
        return;
      } catch { /* người dùng hủy */ }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      msgEl.textContent = "✓ Đã copy nội dung chia sẻ vào clipboard — dán đi khoe thôi!";
    } catch {
      msgEl.textContent = "Hãy copy link trên thanh địa chỉ để chia sẻ nhé.";
    }
  }

  // ---------- Tạo & tải huy hiệu PNG ----------
  function downloadBadge(tier, emoji, score) {
    const c = document.createElement("canvas");
    c.width = 800; c.height = 800;
    const x = c.getContext("2d");

    // nền gradient
    const bg = x.createLinearGradient(0, 0, 800, 800);
    bg.addColorStop(0, "#0d0a1c");
    bg.addColorStop(1, "#1a1330");
    x.fillStyle = bg;
    x.fillRect(0, 0, 800, 800);

    // vòng huy hiệu
    const grad = x.createLinearGradient(250, 200, 550, 460);
    grad.addColorStop(0, "#6ea8fe");
    grad.addColorStop(1, "#b07bff");
    x.beginPath();
    x.arc(400, 320, 130, 0, Math.PI * 2);
    x.fillStyle = grad;
    x.fill();

    // emoji
    x.font = "150px serif";
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText(emoji, 400, 330);

    // chữ
    x.fillStyle = "#f4f2fb";
    x.font = "bold 54px 'Space Grotesk', sans-serif";
    x.fillText(tier, 400, 520);

    x.fillStyle = "#6ea8fe";
    x.font = "bold 90px 'Space Grotesk', sans-serif";
    x.fillText(`${score}/${QUIZ.length}`, 400, 620);

    x.fillStyle = "#a39fc0";
    x.font = "28px 'Inter', sans-serif";
    x.fillText("🧠 AI Explorer · Hiểu AI trong 15 phút", 400, 710);

    const a = document.createElement("a");
    a.download = `ai-explorer-huy-hieu-${score}-${QUIZ.length}.png`;
    a.href = c.toDataURL("image/png");
    a.click();
  }
}
