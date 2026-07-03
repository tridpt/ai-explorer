// Phòng — AI tạo ảnh thế nào? Mô phỏng diffusion. Song ngữ.
import { sfx, celebrate } from "../sound.js";
import { tx } from "../i18n.js";
import { getParam, setParams } from "../roomstate.js";

const SIZE = 220;
const PROMPTS = [
  { label: { vi: "🐱 con mèo", en: "🐱 a cat" }, emoji: "🐱" },
  { label: { vi: "🌸 bông hoa", en: "🌸 a flower" }, emoji: "🌸" },
  { label: { vi: "🚀 tên lửa", en: "🚀 a rocket" }, emoji: "🚀" },
  { label: { vi: "🍕 pizza", en: "🍕 pizza" }, emoji: "🍕" },
  { label: { vi: "🏠 ngôi nhà", en: "🏠 a house" }, emoji: "🏠" },
  { label: { vi: "🌳 cái cây", en: "🌳 a tree" }, emoji: "🌳" },
  { label: { vi: "🚗 ô tô", en: "🚗 a car" }, emoji: "🚗" },
  { label: { vi: "🦋 con bướm", en: "🦋 a butterfly" }, emoji: "🦋" },
];

export function roomDiffusion(root) {
  root.innerHTML = `
    <p class="room-intro">
      ${tx(
        "Làm sao AI vẽ ra một bức tranh chưa từng tồn tại? Bí mật nằm ở <strong>diffusion</strong>: AI bắt đầu từ một mớ <em>nhiễu ngẫu nhiên</em> (như màn hình tivi mất sóng), rồi <strong>khử nhiễu từng bước</strong>, mỗi bước \"đoán\" xem nên gọt bỏ hạt nhiễu nào để dần dần lộ ra hình bạn yêu cầu.",
        "How does AI paint a picture that never existed? The secret is <strong>diffusion</strong>: the AI starts from <em>random noise</em> (like TV static), then <strong>denoises step by step</strong>, each step \"guessing\" which noise to shave off until your requested image slowly emerges."
      )}
    </p>

    <div class="row">
      <div class="panel center" style="flex:1.1;">
        <h4 style="text-align:left">${tx("🖼️ Quá trình tạo ảnh", "🖼️ Image generation process")}</h4>
        <canvas id="dfCanvas" width="${SIZE}" height="${SIZE}" style="background:#000; margin:0 auto;"></canvas>
        <div class="mt"><span class="muted">${tx("Bước khử nhiễu:", "Denoising step:")} <b id="dfStep">0</b> / <b id="dfMax">40</b></span></div>
        <label class="field mt" style="text-align:left">
          <span>${tx("Tua tay qua từng bước:", "Scrub through steps:")}</span>
          <input type="range" id="dfScrub" min="0" max="40" step="1" value="0" disabled />
        </label>
      </div>
      <div class="panel">
        <h4>${tx("⌨️ Bạn muốn AI vẽ gì?", "⌨️ What should the AI draw?")}</h4>
        <p class="muted">${tx("Chọn một \"câu lệnh\" (prompt):", "Pick a \"prompt\":")}</p>
        <div id="dfPrompts" class="mt"></div>

        <label class="field mt" style="text-align:left">
          <span>${tx("Số bước khử nhiễu:", "Denoising steps:")} <b id="dfStepsVal">40</b> — ${tx("ít bước = nhanh nhưng thô; nhiều bước = mượt hơn", "fewer = faster but rough; more = smoother")}</span>
          <input type="range" id="dfSteps" min="6" max="60" step="2" value="40" />
        </label>
        <p class="muted" id="dfQuality" style="font-size:12px"></p>

        <div class="row mt">
          <button class="btn pulse-hint" id="dfGen">${tx("✨ Tạo ảnh", "✨ Generate")}</button>
          <button class="btn ghost" id="dfNoise">${tx("🎛️ Chỉ xem nhiễu", "🎛️ Show noise only")}</button>
        </div>
        <p class="muted mt">${tx(
          "Để ý: lúc đầu chỉ là nhiễu vô nghĩa, sau vài bước hình dạng mới hiện ra. Tạo xong, kéo thanh \"tua tay\" để xem lại từng bước.",
          "Notice: at first it's meaningless noise, then a shape appears. After generating, drag the \"scrub\" slider to replay each step."
        )}</p>
      </div>
    </div>

    <div class="takeaway">
      ${tx(
        "💡 <strong>Điều cốt lõi:</strong> AI tạo ảnh không \"vẽ\" như người. Nó học cách <em>biến nhiễu thành ảnh</em> qua hàng loạt bước nhỏ, dựa trên hàng triệu ảnh đã xem. Câu lệnh chữ của bạn chỉ là chiếc la bàn hướng quá trình khử nhiễu về phía bức ảnh bạn mong muốn.",
        "💡 <strong>Key idea:</strong> Image AI doesn't \"paint\" like a human. It learned to <em>turn noise into images</em> through many small steps, based on millions of images it has seen. Your text prompt is just a compass steering the denoising toward the image you want."
      )}
    </div>
  `;

  const canvas = root.querySelector("#dfCanvas");
  const ctx = canvas.getContext("2d");
  const off = document.createElement("canvas");
  off.width = SIZE; off.height = SIZE;
  const octx = off.getContext("2d");

  let target = null;
  // Deep-link: ?prompt=<index> chọn sẵn prompt để chia sẻ đúng ảnh muốn tạo.
  const sharedIdx = parseInt(getParam("prompt", ""), 10);
  const startIdx = Number.isInteger(sharedIdx) && PROMPTS[sharedIdx] ? sharedIdx : 0;
  let current = PROMPTS[startIdx];
  let anim = null;
  let steps = 40;         // số bước khử nhiễu (điều chỉnh được)
  let frames = [];        // lưu ImageData từng bước để tua qua lại
  let scrubbing = false;

  const stepEl = root.querySelector("#dfStep");
  const stepsVal = root.querySelector("#dfStepsVal");
  const stepMax = root.querySelector("#dfMax");
  const scrub = root.querySelector("#dfScrub");
  const stepsSlider = root.querySelector("#dfSteps");
  const qualityEl = root.querySelector("#dfQuality");

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

  // Tạo ImageData cho bước t / T (không vẽ trực tiếp — để cache lại).
  function makeStep(t, T) {
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
    return img;
  }

  // Ước lượng "chất lượng" theo số bước: ít bước → thô, nhiều bước → mượt.
  function qualityLabel(T) {
    if (T <= 8) return tx("⚡ Rất nhanh nhưng thô (ít bước → ảnh lởm chởm)", "⚡ Very fast but rough (few steps → blocky)");
    if (T <= 25) return tx("🙂 Cân bằng giữa tốc độ và độ mịn", "🙂 A balance of speed and smoothness");
    return tx("💎 Chậm hơn nhưng mịn nhất (nhiều bước → chi tiết hơn)", "💎 Slower but smoothest (more steps → finer detail)");
  }

  function generate() {
    if (anim) cancelAnimationFrame(anim);
    buildTarget(current.emoji);
    const T = steps;
    frames = [];
    let t = 0;
    scrub.max = T;
    scrub.disabled = false;
    stepMax.textContent = T;
    function frame() {
      const img = makeStep(t, T);
      frames.push(img);
      ctx.putImageData(img, 0, 0);
      stepEl.textContent = t;
      scrub.value = t;
      sfx.tick();
      t++;
      if (t <= T) anim = requestAnimationFrame(() => setTimeout(frame, Math.max(20, 2200 / T)));
      else {
        ctx.putImageData(target, 0, 0);
        frames.push(target);
        scrub.disabled = false;
        sfx.success(); celebrate();
      }
    }
    frame();
  }

  const promptsDiv = root.querySelector("#dfPrompts");
  PROMPTS.forEach((p, i) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = tx(p.label);
    tag.onclick = () => {
      current = p;
      setParams({ prompt: i });
      promptsDiv.querySelectorAll(".tag").forEach((t) => (t.style.borderColor = ""));
      tag.style.borderColor = "var(--accent)";
      sfx.pop();
    };
    if (i === startIdx) tag.style.borderColor = "var(--accent)";
    promptsDiv.appendChild(tag);
  });

  root.querySelector("#dfGen").onclick = (e) => { e.target.classList.remove("pulse-hint"); generate(); };
  root.querySelector("#dfNoise").onclick = () => {
    if (anim) cancelAnimationFrame(anim);
    frames = [];
    renderNoise();
    stepEl.textContent = 0;
    scrub.value = 0; scrub.disabled = true;
  };

  // Số bước khử nhiễu: cập nhật nhãn + gợi ý chất lượng.
  function refreshSteps() {
    steps = parseInt(stepsSlider.value);
    stepsVal.textContent = steps;
    stepMax.textContent = steps;
    scrub.max = steps;
    qualityEl.textContent = qualityLabel(steps);
  }
  stepsSlider.oninput = refreshSteps;

  // Tua tay: xem lại từng bước đã lưu trong frames.
  scrub.oninput = () => {
    const i = parseInt(scrub.value);
    if (frames[i]) { ctx.putImageData(frames[i], 0, 0); stepEl.textContent = i; }
  };

  refreshSteps();
  window.addEventListener("roomleave", () => { if (anim) cancelAnimationFrame(anim); }, { once: true });

  renderNoise();
}
