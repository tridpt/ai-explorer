// Phòng — Tự phân nhóm (Unsupervised / K-means): AI tìm cấu trúc mà KHÔNG cần nhãn. Song ngữ.
import { sfx, celebrate } from "../sound.js";
import { tx } from "../i18n.js";

const COLORS = ["#ff5c00", "#00b34a", "#2979ff", "#e91e8c"];

function makeBlobs(k = 3, n = 90) {
  const pts = [];
  const centers = Array.from({ length: k }, () => [0.15 + Math.random() * 0.7, 0.15 + Math.random() * 0.7]);
  for (let i = 0; i < n; i++) {
    const c = centers[(Math.random() * centers.length) | 0];
    pts.push({
      x: Math.min(0.98, Math.max(0.02, c[0] + (Math.random() - 0.5) * 0.24)),
      y: Math.min(0.98, Math.max(0.02, c[1] + (Math.random() - 0.5) * 0.24)),
      cl: -1,
    });
  }
  return pts;
}

export function roomClustering(root) {
  root.innerHTML = `
    <p class="room-intro">
      ${tx(
        "Ở các phòng trước, ta luôn <em>nói cho AI biết đáp án</em>. Nhưng AI còn một tuyệt chiêu: <strong>tự tìm ra cấu trúc mà không cần ai dán nhãn</strong>. Cho nó một đống dữ liệu lộn xộn, nó tự gom thành các nhóm giống nhau. Đây là cách Spotify gom gu nhạc, hay cửa hàng gom nhóm khách hàng.",
        "In earlier rooms we always <em>told the AI the answer</em>. But AI has another trick: <strong>finding structure with no labels at all</strong>. Give it a messy pile of data and it groups similar things by itself. It's how Spotify groups music tastes, or shops group customers."
      )}
    </p>

    <div class="row">
      <div class="panel center" style="flex:1.2;">
        <h4 style="text-align:left">${tx("🧲 Dữ liệu (chưa hề gán nhãn)", "🧲 Data (no labels at all)")}</h4>
        <canvas id="clCanvas" width="440" height="380" style="margin:0 auto;"></canvas>
      </div>
      <div class="panel">
        <h4>${tx("🎛️ Điều khiển", "🎛️ Controls")}</h4>
        <label class="field">
          <span>${tx("Số nhóm cần tìm:", "Groups to find:")} <b id="kVal">3</b></span>
          <input type="range" id="kRange" min="2" max="4" step="1" value="3" />
        </label>
        <div class="row">
          <button class="btn pulse-hint" id="clStep">${tx("▶ Gom nhóm 1 bước", "▶ Cluster 1 step")}</button>
          <button class="btn ghost" id="clNew">${tx("↺ Rải lại điểm", "↺ New points")}</button>
        </div>
        <button class="btn ghost mt" id="clAuto" style="width:100%;">${tx("⏩ Chạy tới khi ổn định", "⏩ Run until stable")}</button>
        <div class="muted mt">${tx("Vòng lặp:", "Iterations:")} <b id="clIter">0</b></div>
        <p class="muted mt">${tx(
          "AI chọn đại vài \"tâm nhóm\" (dấu ◆), gán mỗi điểm về tâm gần nhất, rồi dời tâm vào giữa nhóm. Lặp lại tới khi không đổi.",
          "The AI picks a few \"centroids\" (◆), assigns each point to the nearest, then moves each centroid to its group's center. Repeat until stable."
        )}</p>
      </div>
    </div>

    <div class="takeaway">
      ${tx(
        "💡 <strong>Điều cốt lõi:</strong> Đây là <em>học không giám sát</em> — AI không được cho biết đáp án, nó tự phát hiện quy luật ẩn trong dữ liệu. Cùng với \"học có giám sát\" (dạy bằng ví dụ) và \"học tăng cường\" (thưởng–phạt), đây là ba cách học chính của AI.",
        "💡 <strong>Key idea:</strong> This is <em>unsupervised learning</em> — the AI is given no answers; it discovers hidden patterns itself. Together with \"supervised\" (learning by example) and \"reinforcement\" (reward/penalty), these are AI's three main ways of learning."
      )}
    </div>
  `;

  const canvas = root.querySelector("#clCanvas");
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  let pts, centroids, iter, timer = null;

  function init() {
    if (timer) { clearInterval(timer); timer = null; }
    const k = parseInt(root.querySelector("#kRange").value);
    pts = makeBlobs(k);
    centroids = Array.from({ length: k }, () => [0.1 + Math.random() * 0.8, 0.1 + Math.random() * 0.8]);
    iter = 0;
    root.querySelector("#clIter").textContent = 0;
    draw();
  }

  function assign() {
    let changed = false;
    for (const p of pts) {
      let best = 0, bd = Infinity;
      centroids.forEach((c, i) => {
        const d = (p.x - c[0]) ** 2 + (p.y - c[1]) ** 2;
        if (d < bd) { bd = d; best = i; }
      });
      if (p.cl !== best) { p.cl = best; changed = true; }
    }
    return changed;
  }

  function update() {
    centroids.forEach((c, i) => {
      const group = pts.filter((p) => p.cl === i);
      if (group.length) {
        c[0] = group.reduce((s, p) => s + p.x, 0) / group.length;
        c[1] = group.reduce((s, p) => s + p.y, 0) / group.length;
      }
    });
  }

  function step() {
    const changed = assign();
    update();
    iter++;
    root.querySelector("#clIter").textContent = iter;
    draw();
    return changed;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const p of pts) {
      ctx.beginPath();
      ctx.arc(p.x * W, p.y * H, 5, 0, Math.PI * 2);
      ctx.fillStyle = p.cl < 0 ? "#888" : COLORS[p.cl];
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 1; ctx.stroke();
    }
    centroids.forEach((c, i) => {
      ctx.save();
      ctx.translate(c[0] * W, c[1] * H);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = COLORS[i];
      ctx.fillRect(-9, -9, 18, 18);
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 3; ctx.strokeRect(-9, -9, 18, 18);
      ctx.restore();
    });
  }

  root.querySelector("#kRange").oninput = (e) => { root.querySelector("#kVal").textContent = e.target.value; init(); };
  root.querySelector("#clNew").onclick = init;
  root.querySelector("#clStep").onclick = (e) => { e.target.classList.remove("pulse-hint"); step(); sfx.tick(); };
  root.querySelector("#clAuto").onclick = () => {
    if (timer) return;
    timer = setInterval(() => {
      const changed = step();
      if (!changed) { clearInterval(timer); timer = null; sfx.success(); celebrate(); }
    }, 500);
  };

  window.addEventListener("roomleave", () => { if (timer) clearInterval(timer); }, { once: true });
  init();
}
