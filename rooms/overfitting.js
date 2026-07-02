// Phòng — Overfitting: AI "học vẹt" vs "hiểu thật". Song ngữ.
import { sfx } from "../sound.js";
import { tx } from "../i18n.js";

function tanh(z) { return Math.tanh(z); }
function sigmoid(z) { return 1 / (1 + Math.exp(-z)); }
function label(x, y) { return x * x + y * y < 0.45 ? 1 : 0; }

function makeSet(n, noise = 0) {
  const d = [];
  for (let i = 0; i < n; i++) {
    const x = Math.random() * 2 - 1, y = Math.random() * 2 - 1;
    let l = label(x, y);
    if (noise && Math.random() < noise) l = 1 - l;
    d.push({ x, y, label: l });
  }
  return d;
}

function initNet(H) {
  const r = () => Math.random() * 2 - 1;
  return {
    H,
    W1: Array.from({ length: H }, () => [r(), r()]),
    b1: Array.from({ length: H }, () => r()),
    W2: Array.from({ length: H }, () => r()),
    b2: r(),
  };
}
function forward(net, x, y) {
  const a1 = [];
  for (let h = 0; h < net.H; h++) a1[h] = tanh(net.W1[h][0] * x + net.W1[h][1] * y + net.b1[h]);
  let z = net.b2;
  for (let h = 0; h < net.H; h++) z += net.W2[h] * a1[h];
  return { a1, out: sigmoid(z) };
}
function step(net, data, lr) {
  for (const p of data) {
    const { a1, out } = forward(net, p.x, p.y);
    const dz2 = out - p.label;
    for (let h = 0; h < net.H; h++) {
      const dz1 = dz2 * net.W2[h] * (1 - a1[h] * a1[h]);
      net.W2[h] -= lr * dz2 * a1[h];
      net.W1[h][0] -= lr * dz1 * p.x;
      net.W1[h][1] -= lr * dz1 * p.y;
      net.b1[h] -= lr * dz1;
    }
    net.b2 -= lr * dz2;
  }
}
function acc(net, data) {
  let c = 0;
  for (const p of data) if ((forward(net, p.x, p.y).out > 0.5 ? 1 : 0) === p.label) c++;
  return Math.round((c / data.length) * 100);
}

export function roomOverfitting(root) {
  root.innerHTML = `
    <p class="room-intro">
      ${tx(
        "Một AI giỏi không phải là cái thuộc lòng mọi ví dụ — mà là cái <strong>hiểu được quy luật chung</strong> để làm tốt với dữ liệu chưa từng thấy. Khi AI có quá nhiều \"sức nhớ\" nhưng quá ít dữ liệu, nó sẽ <em>học vẹt</em>: nhớ vanh vách bài đã học nhưng làm sai bài mới. Đó là <strong>overfitting</strong>.",
        "A good AI isn't one that memorizes every example — it's one that <strong>grasps the general rule</strong> to handle unseen data. When an AI has too much \"memory\" but too little data, it <em>memorizes</em>: acing what it studied but failing new cases. That's <strong>overfitting</strong>."
      )}
    </p>

    <div class="row">
      <div class="panel" style="flex:1.2;">
        <h4>${tx("🧠 Ranh giới AI học được", "🧠 The boundary the AI learned")}</h4>
        <canvas id="ofCanvas" width="420" height="420"></canvas>
        <p class="muted mt">${tx(
          "⬤ chấm viền trắng = dữ liệu học · ⬤ nhỏ mờ = bài kiểm tra (AI chưa thấy lúc học)",
          "⬤ white-ringed dots = training data · ⬤ small faded = test data (unseen during training)"
        )}</p>
      </div>
      <div class="panel">
        <h4>${tx("🎛️ Điều khiển", "🎛️ Controls")}</h4>
        <label class="field">
          <span>${tx("Sức nhớ (số nơ-ron):", "Memory (neurons):")} <b id="hVal">14</b> — ${tx("càng cao càng dễ học vẹt", "higher = easier to overfit")}</span>
          <input type="range" id="hRange" min="1" max="20" step="1" value="14" />
        </label>
        <label class="field">
          <span>${tx("Lượng dữ liệu học:", "Training data:")} <b id="nVal">18</b> ${tx("điểm", "points")} — ${tx("càng ít càng dễ học vẹt", "less = easier to overfit")}</span>
          <input type="range" id="nRange" min="12" max="200" step="2" value="18" />
        </label>
        <div class="row">
          <button class="btn pulse-hint" id="trainBtn">${tx("▶ Huấn luyện", "▶ Train")}</button>
          <button class="btn ghost" id="resetBtn">${tx("↺ Làm lại", "↺ Reset")}</button>
        </div>

        <div class="mt">
          <div class="bar-row"><div class="bar-label">${tx("📚 Bài đã học", "📚 Seen")}</div>
            <div class="bar-track"><div class="bar-fill" id="trainBar" style="width:0%">0%</div></div></div>
          <div class="bar-row"><div class="bar-label">${tx("📝 Bài mới", "📝 New")}</div>
            <div class="bar-track"><div class="bar-fill" id="testBar" style="width:0%; background:linear-gradient(90deg,#fbbf24,#fb923c)">0%</div></div></div>
        </div>
        <div id="verdict" class="mt muted"></div>
      </div>
    </div>

    <div class="takeaway">
      ${tx(
        "💡 <strong>Điều cốt lõi:</strong> Điểm \"bài đã học\" cao chót vót nhưng \"bài mới\" thấp tè = AI đang học vẹt. Cách chữa: cho nó <em>nhiều dữ liệu hơn</em> hoặc <em>giảm bớt sức nhớ</em>. Hãy thử kéo \"lượng dữ liệu\" lên cao rồi huấn luyện lại — khoảng cách hai thanh sẽ thu hẹp.",
        "💡 <strong>Key idea:</strong> High \"seen\" score but low \"new\" score = overfitting. The fix: give it <em>more data</em> or <em>less memory</em>. Try raising the data amount and retraining — the gap between the two bars shrinks."
      )}
    </div>
  `;

  const canvas = root.querySelector("#ofCanvas");
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const toPx = (v) => ((v + 1) / 2) * W;

  let train, test, net, timer = null, celebrated = false;

  function rebuild() {
    if (timer) { clearInterval(timer); timer = null; root.querySelector("#trainBtn").textContent = tx("▶ Huấn luyện", "▶ Train"); }
    const n = parseInt(root.querySelector("#nRange").value);
    train = makeSet(n, 0.12);
    test = makeSet(200, 0);
    net = initNet(parseInt(root.querySelector("#hRange").value));
    celebrated = false;
    refresh();
  }

  function draw() {
    const s = 7;
    for (let px = 0; px < W; px += s) {
      for (let py = 0; py < W; py += s) {
        const x = (px / W) * 2 - 1, y = (py / W) * 2 - 1;
        const o = forward(net, x, y).out;
        const r = Math.round(110 + o * (251 - 110));
        const g = Math.round(168 + o * (146 - 168));
        const b = Math.round(254 + o * (60 - 254));
        ctx.fillStyle = `rgba(${r},${g},${b},0.35)`;
        ctx.fillRect(px, py, s, s);
      }
    }
    for (const p of test) {
      ctx.beginPath();
      ctx.arc(toPx(p.x), toPx(p.y), 2, 0, Math.PI * 2);
      ctx.fillStyle = p.label ? "rgba(251,146,60,0.35)" : "rgba(110,168,254,0.35)";
      ctx.fill();
    }
    for (const p of train) {
      ctx.beginPath();
      ctx.arc(toPx(p.x), toPx(p.y), 5, 0, Math.PI * 2);
      ctx.fillStyle = p.label ? "#fb923c" : "#6ea8fe";
      ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.stroke();
    }
  }

  function refresh() {
    draw();
    const trA = acc(net, train), teA = acc(net, test);
    const trBar = root.querySelector("#trainBar"), teBar = root.querySelector("#testBar");
    trBar.style.width = trA + "%"; trBar.textContent = trA + "%";
    teBar.style.width = teA + "%"; teBar.textContent = teA + "%";
    const gap = trA - teA;
    const v = root.querySelector("#verdict");
    if (trA < 70) v.innerHTML = tx("⏳ Chưa học xong — bấm Huấn luyện thêm.", "⏳ Not trained yet — click Train more.");
    else if (gap >= 18) v.innerHTML = tx("⚠️ <b style='color:#fb7185'>Học vẹt!</b> Nhớ bài cũ nhưng làm dở bài mới. Thử thêm dữ liệu.", "⚠️ <b style='color:#fb7185'>Overfitting!</b> Great on old, poor on new. Try more data.");
    else v.innerHTML = tx("✅ <b style='color:#34d399'>Hiểu thật!</b> Làm tốt cả bài mới — cân bằng tốt.", "✅ <b style='color:#34d399'>It understands!</b> Good on new data too — well balanced.");
    if (trA >= 70 && gap < 18 && !celebrated) { celebrated = true; sfx.success(); }
  }

  root.querySelector("#hRange").oninput = (e) => { root.querySelector("#hVal").textContent = e.target.value; rebuild(); };
  root.querySelector("#nRange").oninput = (e) => { root.querySelector("#nVal").textContent = e.target.value; rebuild(); };
  root.querySelector("#resetBtn").onclick = rebuild;
  root.querySelector("#trainBtn").onclick = (e) => {
    e.target.classList.remove("pulse-hint");
    if (timer) { clearInterval(timer); timer = null; e.target.textContent = tx("▶ Huấn luyện", "▶ Train"); return; }
    e.target.textContent = tx("⏸ Dừng", "⏸ Stop");
    let epochs = 0;
    timer = setInterval(() => {
      for (let i = 0; i < 4; i++) step(net, train, 0.12);
      epochs += 4;
      refresh();
      if (epochs > 3000) { clearInterval(timer); timer = null; e.target.textContent = tx("▶ Huấn luyện", "▶ Train"); }
    }, 40);
  };

  window.addEventListener("hashchange", () => { if (timer) clearInterval(timer); }, { once: true });
  rebuild();
}
