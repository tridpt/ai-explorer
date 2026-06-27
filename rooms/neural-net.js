// Phòng 02 — Mạng nơ-ron mini huấn luyện trực tiếp trên trình duyệt (thuần JS).
// Bài toán: phân biệt điểm "bên trong vòng tròn" (cam) vs "bên ngoài" (xanh) — không thể chia bằng 1 đường thẳng.
import { sfx } from "../sound.js";

function makeData(n = 120) {
  const data = [];
  for (let i = 0; i < n; i++) {
    const x = Math.random() * 2 - 1;
    const y = Math.random() * 2 - 1;
    const label = x * x + y * y < 0.45 ? 1 : 0;
    data.push({ x, y, label });
  }
  return data;
}

function tanh(z) { return Math.tanh(z); }
function sigmoid(z) { return 1 / (1 + Math.exp(-z)); }

// Khởi tạo mạng 2 -> H -> 1
function initNet(H) {
  const rnd = () => Math.random() * 2 - 1;
  return {
    H,
    W1: Array.from({ length: H }, () => [rnd(), rnd()]),
    b1: Array.from({ length: H }, () => rnd()),
    W2: Array.from({ length: H }, () => rnd()),
    b2: rnd(),
  };
}

function forward(net, x, y) {
  const a1 = [], z1 = [];
  for (let h = 0; h < net.H; h++) {
    const z = net.W1[h][0] * x + net.W1[h][1] * y + net.b1[h];
    z1[h] = z;
    a1[h] = tanh(z);
  }
  let z2 = net.b2;
  for (let h = 0; h < net.H; h++) z2 += net.W2[h] * a1[h];
  return { a1, out: sigmoid(z2) };
}

function trainStep(net, data, lr) {
  for (const p of data) {
    const { a1, out } = forward(net, p.x, p.y);
    const dz2 = out - p.label;
    for (let h = 0; h < net.H; h++) {
      const da1 = dz2 * net.W2[h];
      const dz1 = da1 * (1 - a1[h] * a1[h]);
      net.W2[h] -= lr * dz2 * a1[h];
      net.W1[h][0] -= lr * dz1 * p.x;
      net.W1[h][1] -= lr * dz1 * p.y;
      net.b1[h] -= lr * dz1;
    }
    net.b2 -= lr * dz2;
  }
}

export function roomNeuralNet(root) {
  root.innerHTML = `
    <p class="room-intro">
      Bên trong AI là gì? Là rất nhiều "nơ-ron" — mỗi cái chỉ làm một phép tính tí hon. Một mình thì
      ngốc, nhưng <strong>ghép nhiều lại</strong> chúng học được những hình thù phức tạp. Nhiệm vụ ở đây:
      tách điểm <span style="color:#fb923c">cam (trong vòng tròn)</span> khỏi
      <span style="color:#6ea8fe">xanh (ngoài)</span> — bất khả thi với một đường thẳng.
    </p>

    <div class="row">
      <div class="panel" style="flex:1.2;">
        <h4>🕸️ AI đang học (vùng màu = dự đoán của AI)</h4>
        <canvas id="nnCanvas" width="420" height="420"></canvas>
      </div>
      <div class="panel">
        <h4>🎛️ Bảng điều khiển</h4>
        <label class="field">
          <span>Số nơ-ron: <b id="hVal">6</b> — ít quá thì AI "ngốc", nhiều hơn thì học giỏi hơn</span>
          <input type="range" id="hRange" min="1" max="16" step="1" value="6" />
        </label>
        <div class="row">
          <button class="btn pulse-hint" id="trainBtn">▶ Huấn luyện</button>
          <button class="btn ghost" id="resetBtn">↺ Làm lại</button>
        </div>
        <div class="mt">
          <div class="muted">Số vòng học: <b id="epochs">0</b></div>
          <div class="muted">Độ chính xác: <b id="acc">—</b></div>
        </div>
        <p class="muted mt">Thử để 1 nơ-ron rồi huấn luyện: AI chỉ vẽ được đường thẳng nên "bó tay".
        Tăng lên 6–10 nơ-ron, ranh giới sẽ uốn thành vòng tròn.</p>
      </div>
    </div>

    <div class="takeaway">
      💡 <strong>Điều cốt lõi:</strong> AI không được lập trình cứng từng quy tắc. Nó <em>tự điều chỉnh</em>
      hàng loạt con số bé tí (trọng số) qua từng vòng học để giảm sai sót. Càng nhiều nơ-ron, nó càng
      nắm được những mẫu hình phức tạp — đó là ý nghĩa của "học sâu" (deep learning).
    </div>
  `;

  const canvas = root.querySelector("#nnCanvas");
  const ctx = canvas.getContext("2d");
  const W = canvas.width, Hpx = canvas.height;

  let data = makeData();
  let net = initNet(6);
  let epochs = 0;
  let timer = null;
  let celebrated = false;

  const toPx = (v) => ((v + 1) / 2) * W; // [-1,1] -> [0,W]

  function draw() {
    // vùng dự đoán (lưới thô để nhanh)
    const step = 7;
    for (let px = 0; px < W; px += step) {
      for (let py = 0; py < Hpx; py += step) {
        const x = (px / W) * 2 - 1;
        const y = (py / Hpx) * 2 - 1;
        const { out } = forward(net, x, y);
        // out ~1 -> cam, ~0 -> xanh
        const r = Math.round(110 + out * (251 - 110));
        const g = Math.round(168 + out * (146 - 168));
        const b = Math.round(254 + out * (60 - 254));
        ctx.fillStyle = `rgba(${r},${g},${b},0.35)`;
        ctx.fillRect(px, py, step, step);
      }
    }
    // điểm dữ liệu
    for (const p of data) {
      ctx.beginPath();
      ctx.arc(toPx(p.x), toPx(p.y), 4, 0, Math.PI * 2);
      ctx.fillStyle = p.label ? "#fb923c" : "#6ea8fe";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function accuracy() {
    let correct = 0;
    for (const p of data) {
      const { out } = forward(net, p.x, p.y);
      if ((out > 0.5 ? 1 : 0) === p.label) correct++;
    }
    return Math.round((correct / data.length) * 100);
  }

  function refresh() {
    draw();
    const acc = accuracy();
    root.querySelector("#epochs").textContent = epochs;
    root.querySelector("#acc").textContent = acc + "%";
    if (acc >= 92 && !celebrated) {
      celebrated = true;
      sfx.success();
      root.querySelector("#acc").textContent = acc + "% 🎉";
    }
    if (acc < 88) celebrated = false;
  }

  const hRange = root.querySelector("#hRange");
  hRange.oninput = () => {
    root.querySelector("#hVal").textContent = hRange.value;
    reset();
  };

  function reset() {
    if (timer) { clearInterval(timer); timer = null; root.querySelector("#trainBtn").textContent = "▶ Huấn luyện"; }
    net = initNet(parseInt(hRange.value));
    epochs = 0;
    refresh();
  }

  root.querySelector("#resetBtn").onclick = () => { data = makeData(); reset(); };
  root.querySelector("#trainBtn").onclick = (e) => {
    e.target.classList.remove("pulse-hint");
    if (timer) {
      clearInterval(timer); timer = null; e.target.textContent = "▶ Huấn luyện";
      return;
    }
    e.target.textContent = "⏸ Dừng";
    timer = setInterval(() => {
      for (let i = 0; i < 3; i++) { trainStep(net, data, 0.1); epochs++; }
      refresh();
      if (epochs > 1500) { clearInterval(timer); timer = null; e.target.textContent = "▶ Huấn luyện"; }
    }, 40);
  };

  // dọn dẹp khi rời phòng
  window.addEventListener("hashchange", () => { if (timer) clearInterval(timer); }, { once: true });

  refresh();
}
