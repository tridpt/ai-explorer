// Phòng — AI tạo ảnh thế nào? Mô phỏng diffusion: từ nhiễu hỗn loạn → ảnh rõ dần.
import { sfx, celebrate } from "../sound.js";

const SIZE = 220;
const PROMPTS = [
  { label: "🐱 con mèo", emoji: "🐱" },
  { label: "🌸 bông hoa", emoji: "🌸" },
  { label: "🚀 tên lửa", emoji: "🚀" },
  { label: "🍕 pizza", emoji: "🍕" },
  { label: "🏠 ngôi nhà", emoji: "🏠" },
];

export function roomDiffusion(root) {
  root.innerHTML = `
    <p class="room-intro">
      Làm sao AI vẽ ra một bức tranh chưa từng tồn tại? Bí mật nằm ở <strong>diffusion</strong>: AI bắt đầu
      từ một mớ <em>nhiễu ngẫu nhiên</em> (như màn hình tivi mất sóng), rồi <strong>khử nhiễu từng bước</strong>,
      mỗi bước "đoán" xem nên gọt bỏ hạt nhiễu nào để dần dần lộ ra hình bạn yêu cầu.
    </p>

    <div class="row">
      <div class="panel center" style="flex:1.1;">
        <h4 style="text-align:left">🖼️ Quá trình tạo ảnh</h4>
        <canvas id="dfCanvas" width="${SIZE}" height="${SIZE}" style="background:#000; margin:0 auto;"></canvas>
        <div class="mt"><span class="muted">Bước khử nhiễu: <b id="dfStep">0</b> / 40</span></div>
      </div>
      <div class="panel">
        <h4>⌨️ Bạn muốn AI vẽ gì?</h4>
        <p class="muted">Chọn một "câu lệnh" (prompt):</p>
        <div id="dfPrompts" class="mt"></div>
        <div class="row mt">
          <button class="btn pulse-hint" id="dfGen">✨ Tạo ảnh</button>
          <button class="btn ghost" id="dfNoise">🎛️ Chỉ xem nhiễu</button>
        </div>
        <p class="muted mt">Để ý: lúc đầu chỉ là nhiễu vô nghĩa, sau vài bước hình dạng mới hiện ra.</p>
      </div>
    </div>

    <div class="takeaway">
      💡 <strong>Điều cốt lõi:</strong> AI tạo ảnh không "vẽ" như người. Nó học cách <em>biến nhiễu thành ảnh</em>
      qua hàng loạt bước nhỏ, dựa trên hàng triệu ảnh đã xem. Câu lệnh chữ của bạn chỉ là chiếc la bàn hướng
      quá trình khử nhiễu về phía bức ảnh bạn mong muốn.
    </div>
  `;

  const canvas = root.querySelector("#dfCanvas");
  const ctx = canvas.getContext("2d");
  const off = document.createElement("canvas");
  off.width = SIZE; off.height = SIZE;
  const octx = off.getContext("2d");

  let target = null; // ImageData mục tiêu
  let current = PROMPTS[0];
  let anim = null;

  function buildTarget(emoji) {
    octx.clearRect(0, 0, SIZE, SIZE);
    octx.fillStyle = "#0d0a1c";
    octx.fillRect(0, 0, SIZE, SIZE);
    octx.font = "150px serif";
    octx.textAlign = "center";
    octx.textBaseline = "middle";
    octx.fillText(emoji, SIZE / 2, SIZE / 2 + 8);
    target = octx.getImageData(0, 0, SIZE, SIZE);
  }

  function renderNoise() {
    const img = ctx.createImageData(SIZE, SIZE);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }

  // trộn: ảnh hiển thị = lerp(noise, target) + nhiễu giảm dần
  function renderStep(t, T) {
    const mix = t / T;
    const img = ctx.createImageData(SIZE, SIZE);
    const tgt = target.data;
    const noiseAmt = (1 - mix) * 180;
    for (let i = 0; i < img.data.length; i += 4) {
      for (let k = 0; k < 3; k++) {
        const base = tgt[i + k] * mix + (Math.random() * 255) * (1 - mix);
        const n = (Math.random() - 0.5) * noiseAmt;
        img.data[i + k] = Math.max(0, Math.min(255, base + n));
      }
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }

  function generate() {
    if (anim) cancelAnimationFrame(anim);
    buildTarget(current.emoji);
    const T = 40;
    let t = 0;
    const stepEl = root.querySelector("#dfStep");
    function frame() {
      renderStep(t, T);
      stepEl.textContent = t;
      sfx.tick();
      t++;
      if (t <= T) anim = requestAnimationFrame(() => setTimeout(frame, 55));
      else {
        // bước cuối: vẽ ảnh sạch
        ctx.putImageData(target, 0, 0);
        sfx.success();
        celebrate();
      }
    }
    frame();
  }

  const promptsDiv = root.querySelector("#dfPrompts");
  PROMPTS.forEach((p, i) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = p.label;
    tag.onclick = () => {
      current = p;
      promptsDiv.querySelectorAll(".tag").forEach((t) => (t.style.borderColor = ""));
      tag.style.borderColor = "var(--accent)";
      sfx.pop();
    };
    if (i === 0) tag.style.borderColor = "var(--accent)";
    promptsDiv.appendChild(tag);
  });

  root.querySelector("#dfGen").onclick = (e) => { e.target.classList.remove("pulse-hint"); generate(); };
  root.querySelector("#dfNoise").onclick = () => { if (anim) cancelAnimationFrame(anim); renderNoise(); root.querySelector("#dfStep").textContent = 0; };

  window.addEventListener("hashchange", () => { if (anim) cancelAnimationFrame(anim); }, { once: true });

  renderNoise();
}
