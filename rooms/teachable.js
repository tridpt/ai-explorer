// Phòng 01 — Tự tay dạy AI (webcam, thuần JS).
// Người dùng chụp vài mẫu cho mỗi "lớp", AI học bằng cách so khớp đặc trưng ảnh.
import { sfx } from "../sound.js";

const GRID = 24; // ảnh được thu nhỏ về 24x24 mức xám làm "đặc trưng"

const CLASSES = [
  { id: 0, name: "Tư thế A", color: "#6ea8fe", samples: [] },
  { id: 1, name: "Tư thế B", color: "#fb923c", samples: [] },
  { id: 2, name: "Tư thế C", color: "#4ade80", samples: [] },
];

function extractFeature(video, work) {
  const wctx = work.getContext("2d");
  wctx.drawImage(video, 0, 0, GRID, GRID);
  const img = wctx.getImageData(0, 0, GRID, GRID).data;
  const f = new Float32Array(GRID * GRID);
  let mean = 0;
  for (let i = 0; i < GRID * GRID; i++) {
    const g = (img[i * 4] + img[i * 4 + 1] + img[i * 4 + 2]) / 3 / 255;
    f[i] = g;
    mean += g;
  }
  mean /= f.length;
  for (let i = 0; i < f.length; i++) f[i] -= mean; // bỏ ảnh hưởng độ sáng
  return f;
}

function distance(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; s += d * d; }
  return Math.sqrt(s);
}

export function roomTeachable(root) {
  root.innerHTML = `
    <p class="room-intro">
      Đây là cách AI thực sự học: bằng <strong>ví dụ</strong>, không phải bằng quy tắc. Bạn không lập trình
      cho nó biết "tư thế A trông thế nào". Thay vào đó, bạn <em>cho nó xem vài tấm ảnh mẫu</em>, rồi nó tự
      rút ra điểm chung. Bật webcam và dạy thử trong 30 giây.
    </p>

    <div class="row">
      <div class="panel" style="flex:1.1;">
        <h4>📸 Webcam</h4>
        <video id="cam" autoplay playsinline muted style="width:100%; border-radius:12px; background:#000;"></video>
        <button class="btn mt" id="startCam" style="width:100%;">Bật webcam</button>
        <p id="camMsg" class="muted mt"></p>
      </div>

      <div class="panel">
        <h4>1️⃣ Dạy AI: chụp vài mẫu cho mỗi tư thế</h4>
        <p class="muted">Đổi tư thế/biểu cảm rồi bấm "Chụp mẫu" vài lần (5–10 lần mỗi loại là đẹp).</p>
        <div id="classBtns" class="mt"></div>

        <h4 class="mt">2️⃣ AI đoán (tự động khi đã có mẫu)</h4>
        <div id="prediction"><p class="muted">Hãy dạy ít nhất 2 tư thế để AI bắt đầu đoán.</p></div>
      </div>
    </div>

    <div class="takeaway">
      💡 <strong>Điều cốt lõi:</strong> AI học từ <em>dữ liệu</em>, không phải từ luật lệ ta viết tay.
      Càng nhiều mẫu chất lượng, nó càng đoán giỏi. Đây cũng là lý do dữ liệu là "nhiên liệu" của AI —
      và nếu dữ liệu lệch, AI cũng sẽ lệch theo (bạn sẽ gặp lại điều này ở phòng cuối).
    </div>
  `;

  const video = root.querySelector("#cam");
  const camMsg = root.querySelector("#camMsg");
  const work = document.createElement("canvas");
  work.width = GRID; work.height = GRID;
  let streaming = false;
  let stream = null;
  let predTimer = null;

  CLASSES.forEach((c) => (c.samples = []));

  root.querySelector("#startCam").onclick = async () => {
    if (streaming) return;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      streaming = true;
      camMsg.textContent = "Webcam đã bật. Giờ hãy dạy AI bằng các nút bên phải.";
      startPredLoop();
    } catch (err) {
      camMsg.innerHTML = "⚠️ Không truy cập được webcam (cần cấp quyền và chạy qua localhost/https). " +
        "Bạn vẫn có thể đọc phần giải thích phía dưới.";
    }
  };

  const classBtns = root.querySelector("#classBtns");
  CLASSES.forEach((c) => {
    const wrap = document.createElement("div");
    wrap.style.marginBottom = "8px";
    wrap.innerHTML = `
      <button class="btn ghost" data-cls="${c.id}" style="border-color:${c.color}">
        📷 Chụp mẫu: <b style="color:${c.color}">${c.name}</b>
      </button>
      <span class="muted" id="cnt-${c.id}" style="margin-left:8px;">0 mẫu</span>
    `;
    classBtns.appendChild(wrap);
    wrap.querySelector("button").onclick = () => {
      if (!streaming) { camMsg.textContent = "Hãy bật webcam trước nhé."; return; }
      c.samples.push(extractFeature(video, work));
      root.querySelector(`#cnt-${c.id}`).textContent = `${c.samples.length} mẫu`;
      sfx.pop();
    };
  });

  const predEl = root.querySelector("#prediction");

  function predict() {
    const trained = CLASSES.filter((c) => c.samples.length > 0);
    if (trained.length < 2) return;
    const f = extractFeature(video, work);
    // khoảng cách tới mẫu gần nhất của mỗi lớp -> đổi thành điểm tin cậy
    const scores = trained.map((c) => {
      const minD = Math.min(...c.samples.map((s) => distance(f, s)));
      return { c, score: 1 / (minD + 0.001) };
    });
    const sum = scores.reduce((s, x) => s + x.score, 0);
    scores.sort((a, b) => b.score - a.score);
    predEl.innerHTML = scores
      .map((x) => {
        const pct = Math.round((x.score / sum) * 100);
        return `<div class="bar-row">
          <div class="bar-label" style="color:${x.c.color}">${x.c.name}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${pct}%; background:${x.c.color}">${pct}%</div></div>
        </div>`;
      })
      .join("");
  }

  function startPredLoop() {
    if (predTimer) clearInterval(predTimer);
    predTimer = setInterval(predict, 300);
  }

  // dọn dẹp khi rời phòng
  window.addEventListener("hashchange", () => {
    if (predTimer) clearInterval(predTimer);
    if (stream) stream.getTracks().forEach((t) => t.stop());
  }, { once: true });
}
