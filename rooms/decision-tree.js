// Phòng — Cây quyết định: một kiểu AI mà ta NHÌN THẤY được mọi luật của nó.
import { sfx, celebrate } from "../sound.js";

// Mỗi node là câu hỏi (q + options) hoặc lá (leaf). Mỗi option có nhãn nút + node con.
const TREE = {
  q: "Trời hôm nay thế nào?",
  options: [
    {
      label: "Nắng đẹp ☀️",
      next: {
        q: "Bạn có thấy mệt không?",
        options: [
          { label: "Không, khỏe re 💪", next: { leaf: "🏞️ Đi dã ngoại / chơi ngoài trời" } },
          { label: "Có, hơi mệt 😪", next: { leaf: "☕ Ngồi cà phê ngắm phố" } },
        ],
      },
    },
    {
      label: "Mưa 🌧️",
      next: {
        q: "Bạn muốn vận động chứ?",
        options: [
          { label: "Có chứ! 🏃", next: { leaf: "🏋️ Tới phòng gym trong nhà" } },
          { label: "Thôi, nghỉ ngơi 🛋️", next: { leaf: "🎬 Ở nhà xem phim, đọc sách" } },
        ],
      },
    },
  ],
};

export function roomDecisionTree(root) {
  root.innerHTML = `
    <p class="room-intro">
      Không phải AI nào cũng là "hộp đen" bí ẩn. <strong>Cây quyết định</strong> là kiểu AI mà bạn
      nhìn thấy <em>từng luật</em> nó dùng: chỉ là một chuỗi câu hỏi rồi rẽ nhánh, học được từ dữ liệu.
      Hãy đi qua cây bên dưới và để ý: mỗi quyết định đều có thể giải thích rõ ràng.
    </p>

    <div class="panel">
      <h4>🌳 Đi theo cây (bấm câu trả lời)</h4>
      <div id="treeWalk"></div>
      <button class="btn ghost mt" id="treeReset" style="display:none;">↺ Đi lại</button>
    </div>

    <div class="panel">
      <h4>🗺️ Toàn cảnh cây (đường bạn đã đi sẽ sáng lên)</h4>
      <canvas id="treeCanvas" width="640" height="300"></canvas>
    </div>

    <div class="takeaway">
      💡 <strong>Điều cốt lõi:</strong> Khác với mạng nơ-ron (hàng triệu con số khó hiểu), cây quyết định
      <em>minh bạch</em> — ai cũng kiểm tra được vì sao nó ra kết luận đó. Vì vậy nó hay được dùng ở những
      nơi cần giải thích rõ ràng như ngân hàng, y tế. Đánh đổi: nó thường kém linh hoạt hơn với dữ liệu phức tạp.
    </div>
  `;

  const walk = root.querySelector("#treeWalk");
  const resetBtn = root.querySelector("#treeReset");
  const canvas = root.querySelector("#treeCanvas");
  const ctx = canvas.getContext("2d");
  let path = []; // chỉ số option đã chọn ở mỗi tầng

  function nodeAtPath() {
    let node = TREE;
    const steps = [];
    for (const idx of path) {
      const opt = node.options[idx];
      steps.push({ q: node.q, choice: opt.label });
      node = opt.next;
    }
    return { node, steps };
  }

  function renderWalk() {
    const { node, steps } = nodeAtPath();
    let html = steps
      .map((s) => `<p class="muted">✔ ${s.q} → <b style="color:var(--accent)">${s.choice}</b></p>`)
      .join("");

    if (node.leaf) {
      html += `<div class="badge mt" style="padding:20px"><div style="font-size:46px">${node.leaf.split(" ")[0]}</div>
        <h3 style="margin-top:8px">${node.leaf}</h3>
        <p class="muted mt">AI gợi ý dựa trên các luật ở trên.</p></div>`;
      walk.innerHTML = html;
      resetBtn.style.display = "inline-flex";
      sfx.success();
      celebrate();
    } else {
      html += `<p class="q-text mt">${node.q}</p><div class="row" style="max-width:380px">`;
      node.options.forEach((opt, i) => {
        html += `<button class="btn ${i === 0 ? "" : "ghost"}" data-idx="${i}">${opt.label}</button>`;
      });
      html += `</div>`;
      walk.innerHTML = html;
      walk.querySelectorAll("[data-idx]").forEach((b) => {
        b.onclick = () => { path.push(parseInt(b.dataset.idx)); renderWalk(); };
      });
    }
    drawTree();
  }

  // Vẽ sơ đồ cây + tô sáng đường đã đi
  function drawTree() {
    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#6ea8fe";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const nodes = layout();
    nodes.forEach((n) => {
      n.children.forEach((ci) => {
        const c = nodes[ci.idx];
        ctx.beginPath();
        ctx.moveTo(n.x, n.y);
        ctx.lineTo(c.x, c.y);
        ctx.strokeStyle = ci.active ? accent : "rgba(255,255,255,0.12)";
        ctx.lineWidth = ci.active ? 3 : 1.5;
        ctx.stroke();
      });
    });
    ctx.font = "13px Inter, sans-serif";
    ctx.textAlign = "center";
    nodes.forEach((n) => {
      ctx.beginPath();
      ctx.arc(n.x, n.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = n.active ? accent : "#2a2740";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "#cdc9e0";
      ctx.fillText(n.text, n.x, n.y - 14);
    });
  }

  // Bố cục cây tĩnh + đánh dấu active theo path (chỉ số option)
  function layout() {
    const N = [];
    const add = (text, x, y) => { N.push({ text, x, y, children: [], active: false }); return N.length - 1; };
    const root_ = add("Trời?", 320, 40);
    const sun = add("☀️ mệt?", 180, 130);
    const rain = add("🌧️ gym?", 460, 130);
    const sLeaf0 = add("🏞️", 100, 240);
    const sLeaf1 = add("☕", 250, 240);
    const rLeaf0 = add("🏋️", 400, 240);
    const rLeaf1 = add("🎬", 540, 240);

    const a0 = path[0]; // 0 = nắng, 1 = mưa
    const a1 = path[1]; // 0 / 1 tùy nhánh
    N[root_].children.push({ idx: sun, active: a0 === 0 });
    N[root_].children.push({ idx: rain, active: a0 === 1 });
    N[sun].children.push({ idx: sLeaf0, active: a0 === 0 && a1 === 0 });
    N[sun].children.push({ idx: sLeaf1, active: a0 === 0 && a1 === 1 });
    N[rain].children.push({ idx: rLeaf0, active: a0 === 1 && a1 === 0 });
    N[rain].children.push({ idx: rLeaf1, active: a0 === 1 && a1 === 1 });

    N[root_].active = true;
    if (a0 === 0) N[sun].active = true;
    if (a0 === 1) N[rain].active = true;
    if (a0 === 0 && a1 === 0) N[sLeaf0].active = true;
    if (a0 === 0 && a1 === 1) N[sLeaf1].active = true;
    if (a0 === 1 && a1 === 0) N[rLeaf0].active = true;
    if (a0 === 1 && a1 === 1) N[rLeaf1].active = true;
    return N;
  }

  resetBtn.onclick = () => { path = []; resetBtn.style.display = "none"; renderWalk(); };
  renderWalk();
}
