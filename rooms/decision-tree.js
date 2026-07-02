// Phòng — Cây quyết định: một kiểu AI mà ta NHÌN THẤY được mọi luật của nó. Song ngữ.
import { sfx, celebrate } from "../sound.js";
import { tx } from "../i18n.js";

// Mỗi node: câu hỏi (q + options) hoặc lá (leaf). Nhãn song ngữ dạng {vi,en}.
const TREE = {
  q: { vi: "Trời hôm nay thế nào?", en: "How's the weather today?" },
  options: [
    {
      label: { vi: "Nắng đẹp ☀️", en: "Sunny ☀️" },
      next: {
        q: { vi: "Bạn có thấy mệt không?", en: "Are you tired?" },
        options: [
          { label: { vi: "Không, khỏe re 💪", en: "Nope, full energy 💪" }, next: { leaf: { vi: "🏞️ Đi dã ngoại / chơi ngoài trời", en: "🏞️ Go for a picnic / outdoors" } } },
          { label: { vi: "Có, hơi mệt 😪", en: "Yeah, a bit 😪" }, next: { leaf: { vi: "☕ Ngồi cà phê ngắm phố", en: "☕ Sit at a café and watch the street" } } },
        ],
      },
    },
    {
      label: { vi: "Mưa 🌧️", en: "Rainy 🌧️" },
      next: {
        q: { vi: "Bạn muốn vận động chứ?", en: "Feel like exercising?" },
        options: [
          { label: { vi: "Có chứ! 🏃", en: "Sure! 🏃" }, next: { leaf: { vi: "🏋️ Tới phòng gym trong nhà", en: "🏋️ Hit the indoor gym" } } },
          { label: { vi: "Thôi, nghỉ ngơi 🛋️", en: "Nah, relax 🛋️" }, next: { leaf: { vi: "🎬 Ở nhà xem phim, đọc sách", en: "🎬 Stay in, watch a movie, read" } } },
        ],
      },
    },
  ],
};

export function roomDecisionTree(root) {
  root.innerHTML = `
    <p class="room-intro">
      ${tx(
        "Không phải AI nào cũng là \"hộp đen\" bí ẩn. <strong>Cây quyết định</strong> là kiểu AI mà bạn nhìn thấy <em>từng luật</em> nó dùng: chỉ là một chuỗi câu hỏi rồi rẽ nhánh, học được từ dữ liệu. Hãy đi qua cây bên dưới và để ý: mỗi quyết định đều có thể giải thích rõ ràng.",
        "Not every AI is a mysterious \"black box\". A <strong>decision tree</strong> is an AI whose <em>every rule</em> you can see: just a chain of questions that branch, learned from data. Walk the tree below and notice: every decision is fully explainable."
      )}
    </p>

    <div class="panel">
      <h4>${tx("🌳 Đi theo cây (bấm câu trả lời)", "🌳 Walk the tree (click an answer)")}</h4>
      <div id="treeWalk"></div>
      <button class="btn ghost mt" id="treeReset" style="display:none;">${tx("↺ Đi lại", "↺ Restart")}</button>
    </div>

    <div class="panel">
      <h4>${tx("🗺️ Toàn cảnh cây (đường bạn đã đi sẽ sáng lên)", "🗺️ Full tree (your path lights up)")}</h4>
      <canvas id="treeCanvas" width="640" height="300"></canvas>
    </div>

    <div class="takeaway">
      ${tx(
        "💡 <strong>Điều cốt lõi:</strong> Khác với mạng nơ-ron (hàng triệu con số khó hiểu), cây quyết định <em>minh bạch</em> — ai cũng kiểm tra được vì sao nó ra kết luận đó. Vì vậy nó hay được dùng ở những nơi cần giải thích rõ ràng như ngân hàng, y tế. Đánh đổi: nó thường kém linh hoạt hơn với dữ liệu phức tạp.",
        "💡 <strong>Key idea:</strong> Unlike a neural net (millions of opaque numbers), a decision tree is <em>transparent</em> — anyone can check why it concluded that. So it's used where explanations matter, like banking and healthcare. The trade-off: it's often less flexible with complex data."
      )}
    </div>
  `;

  const walk = root.querySelector("#treeWalk");
  const resetBtn = root.querySelector("#treeReset");
  const canvas = root.querySelector("#treeCanvas");
  const ctx = canvas.getContext("2d");
  let path = [];

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
      .map((s) => `<p class="muted">✔ ${tx(s.q)} → <b style="color:var(--accent)">${tx(s.choice)}</b></p>`)
      .join("");

    if (node.leaf) {
      const leaf = tx(node.leaf);
      html += `<div class="badge mt" style="padding:20px"><div style="font-size:46px">${leaf.split(" ")[0]}</div>
        <h3 style="margin-top:8px">${leaf}</h3>
        <p class="muted mt">${tx("AI gợi ý dựa trên các luật ở trên.", "The AI suggests this based on the rules above.")}</p></div>`;
      walk.innerHTML = html;
      resetBtn.style.display = "inline-flex";
      sfx.success();
      celebrate();
    } else {
      html += `<p class="q-text mt">${tx(node.q)}</p><div class="row" style="max-width:380px">`;
      node.options.forEach((opt, i) => {
        html += `<button class="btn ${i === 0 ? "" : "ghost"}" data-idx="${i}">${tx(opt.label)}</button>`;
      });
      html += `</div>`;
      walk.innerHTML = html;
      walk.querySelectorAll("[data-idx]").forEach((b) => {
        b.onclick = () => { path.push(parseInt(b.dataset.idx)); renderWalk(); };
      });
    }
    drawTree();
  }

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

  function layout() {
    const N = [];
    const add = (text, x, y) => { N.push({ text, x, y, children: [], active: false }); return N.length - 1; };
    const root_ = add(tx("Trời?", "Weather?"), 320, 40);
    const sun = add(tx("☀️ mệt?", "☀️ tired?"), 180, 130);
    const rain = add(tx("🌧️ gym?", "🌧️ gym?"), 460, 130);
    const sLeaf0 = add("🏞️", 100, 240);
    const sLeaf1 = add("☕", 250, 240);
    const rLeaf0 = add("🏋️", 400, 240);
    const rLeaf1 = add("🎬", 540, 240);

    const a0 = path[0];
    const a1 = path[1];
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
