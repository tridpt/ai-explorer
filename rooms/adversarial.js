// Phòng — Đánh lừa AI (Adversarial examples). Mô phỏng hiện tượng nổi tiếng gấu trúc → vượn. Song ngữ.
import { sfx } from "../sound.js";
import { tx } from "../i18n.js";

const SIZE = 220;
const FLIP = 34; // ngưỡng % nhiễu mà AI "đổi ý"

export function roomAdversarial(root) {
  root.innerHTML = `
    <p class="room-intro">
      ${tx(
        "AI nhận diện ảnh giỏi đến kinh ngạc — nhưng nó có một điểm yếu kỳ lạ. Chỉ cần thêm một lớp <strong>nhiễu tinh vi mà mắt người gần như không thấy</strong>, AI có thể đột nhiên nhìn <em>gấu trúc</em> thành <em>vượn</em> — với độ tự tin cao ngất. Đây là \"adversarial example\", một thí nghiệm nổi tiếng trong nghiên cứu an toàn AI.",
        "AI is astonishingly good at recognizing images — but it has a strange weakness. Add a layer of <strong>subtle noise humans barely notice</strong>, and the AI can suddenly see a <em>panda</em> as a <em>gibbon</em> — with sky-high confidence. This is an \"adversarial example\", a famous experiment in AI-safety research."
      )}
    </p>

    <div class="row">
      <div class="panel center" style="flex:1.1;">
        <h4 style="text-align:left">${tx("🖼️ Ảnh đưa cho AI", "🖼️ Image shown to the AI")}</h4>
        <div class="adv-imgs">
          <div>
            <canvas id="advCanvas" width="${SIZE}" height="${SIZE}" style="margin:0 auto;"></canvas>
            <div class="muted mt" style="font-size:12px">${tx("Ảnh AI thấy (gốc + nhiễu)", "What the AI sees (original + noise)")}</div>
          </div>
          <div class="adv-plus">+</div>
          <div>
            <canvas id="advNoiseCanvas" width="${SIZE}" height="${SIZE}" style="margin:0 auto;"></canvas>
            <div class="muted mt" style="font-size:12px">${tx("Lớp nhiễu (đã phóng đại ×4)", "The noise layer (magnified ×4)")}</div>
          </div>
        </div>
        <label class="field mt" style="text-align:left">
          <span>${tx("Lượng nhiễu thêm vào:", "Noise added:")} <b id="advVal">0</b>%</span>
          <input type="range" id="advNoise" min="0" max="80" step="1" value="0" />
        </label>
        <p class="muted" style="font-size:12px">${tx(
          "👀 Nhìn ảnh bên trái: bạn vẫn thấy rõ gấu trúc. Lớp nhiễu bên phải chính là thứ được cộng vào — nhỏ tới mức mắt người gần như bỏ qua.",
          "👀 Look left: you still clearly see a panda. The noise on the right is what's added — so small the human eye nearly ignores it."
        )}</p>
      </div>
      <div class="panel">
        <h4>${tx("🤖 AI nhận diện", "🤖 AI's verdict")}</h4>
        <div id="advResult"></div>
        <p class="muted mt" id="advNote"></p>
      </div>
    </div>

    <div class="takeaway">
      ${tx(
        "💡 <strong>Điều cốt lõi:</strong> AI \"nhìn\" khác con người. Nó bám vào những mẫu pixel rất nhỏ mà ta không để ý, nên có thể bị đánh lừa bằng nhiễu vô hình. Điều này quan trọng với an toàn: xe tự lái, nhận diện khuôn mặt... đều có thể bị tấn công kiểu này. (Đây cũng chính là ý tưởng đằng sau dự án bảo vệ ảnh khỏi AI.)",
        "💡 <strong>Key idea:</strong> AI \"sees\" differently from humans. It latches onto tiny pixel patterns we ignore, so it can be fooled by invisible noise. This matters for safety: self-driving cars, face recognition... can all be attacked this way. (It's also the idea behind protecting art from AI.)"
      )}
    </div>
  `;

  const canvas = root.querySelector("#advCanvas");
  const ctx = canvas.getContext("2d");
  const noiseCanvas = root.querySelector("#advNoiseCanvas");
  const nctx = noiseCanvas.getContext("2d");
  const base = document.createElement("canvas");
  base.width = SIZE; base.height = SIZE;
  const bctx = base.getContext("2d");
  bctx.fillStyle = "#e9e4d4";
  bctx.fillRect(0, 0, SIZE, SIZE);
  bctx.font = "150px serif";
  bctx.textAlign = "center";
  bctx.textBaseline = "middle";
  bctx.fillText("🐼", SIZE / 2, SIZE / 2 + 6);
  const baseData = bctx.getImageData(0, 0, SIZE, SIZE);

  const resultEl = root.querySelector("#advResult");
  const noteEl = root.querySelector("#advNote");
  const slider = root.querySelector("#advNoise");

  function bar(label, pct, color) {
    return `<div class="bar-row"><div class="bar-label" style="width:auto;flex:0 0 120px;text-align:left">${label}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%; background:${color}">${pct}%</div></div></div>`;
  }

  function render() {
    const strength = parseInt(slider.value);
    root.querySelector("#advVal").textContent = strength;

    // Tạo lớp nhiễu chung để cả ảnh-đã-nhiễu và bản-đồ-nhiễu dùng cùng một giá trị.
    const amt = strength * 1.6;
    const img = ctx.createImageData(SIZE, SIZE);
    const noiseImg = nctx.createImageData(SIZE, SIZE);
    for (let i = 0; i < img.data.length; i += 4) {
      for (let k = 0; k < 3; k++) {
        const n = (Math.random() - 0.5) * amt; // nhiễu cho kênh màu này
        img.data[i + k] = Math.max(0, Math.min(255, baseData.data[i + k] + n));
        // Bản đồ nhiễu: khuếch đại quanh mức xám 128 để "nhìn thấy" thứ vô hình.
        noiseImg.data[i + k] = Math.max(0, Math.min(255, 128 + n * 4));
      }
      img.data[i + 3] = 255;
      noiseImg.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    nctx.putImageData(noiseImg, 0, 0);

    // "dự đoán" của AI
    if (strength < FLIP) {
      const conf = 99 - Math.round(strength * 0.2);
      resultEl.innerHTML = bar(tx("🐼 Gấu trúc", "🐼 Panda"), conf, "#00b34a")
        + bar(tx("🐒 Vượn", "🐒 Gibbon"), 100 - conf, "#888");
      noteEl.textContent = tx("AI nhận diện đúng. Thử kéo nhiễu lên cao dần...", "AI is correct. Try raising the noise...");
    } else {
      const conf = 90 + Math.min(9, Math.round((strength - FLIP) * 0.3));
      resultEl.innerHTML = bar(tx("🐒 Vượn", "🐒 Gibbon"), conf, "#e5352b")
        + bar(tx("🐼 Gấu trúc", "🐼 Panda"), 100 - conf, "#888");
      noteEl.innerHTML = tx(
        "😱 AI đã đổi ý! <b>Mắt bạn vẫn thấy gấu trúc</b>, nhưng AI khẳng định là vượn. Nhiễu này chưa hề làm ảnh khó nhận ra với con người.",
        "😱 The AI flipped! <b>You still see a panda</b>, but the AI insists it's a gibbon. This noise hasn't made the image hard for a human at all."
      );
      if (strength === FLIP) sfx.wrong();
    }
  }

  slider.oninput = render;
  render();
}
