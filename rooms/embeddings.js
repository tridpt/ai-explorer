// Phòng 03 — Bản đồ ý nghĩa (Word Embeddings)
import { WORD_VECTORS, ANALOGY_PRESETS } from "../data/embeddings.js";
import { sfx } from "../sound.js";

const WORDS = Object.keys(WORD_VECTORS);

function dist(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

// Tìm từ gần nhất với một vector (loại trừ một số từ)
function nearest(vec, exclude = []) {
  let best = null;
  let bestD = Infinity;
  for (const w of WORDS) {
    if (exclude.includes(w)) continue;
    const d = dist(WORD_VECTORS[w], vec);
    if (d < bestD) {
      bestD = d;
      best = w;
    }
  }
  return best;
}

export function roomEmbeddings(root) {
  root.innerHTML = `
    <p class="room-intro">
      AI không đọc chữ như chúng ta. Nó biến mỗi từ thành một <strong>điểm tọa độ</strong> trên một
      tấm bản đồ khổng lồ. Điều kỳ diệu: những từ có nghĩa gần nhau sẽ nằm gần nhau, và
      <em>khoảng cách giữa các từ cũng mang ý nghĩa</em>. Hãy thử ngay.
    </p>

    <div class="row">
      <div class="panel" style="flex: 1.4;">
        <h4>🗺️ Bản đồ từ ngữ (rê chuột để xem nhãn)</h4>
        <canvas id="embCanvas" width="640" height="460"></canvas>
        <p class="muted mt">Để ý: người ở giữa, động vật một góc, món ăn một góc — những thứ giống nhau tự xúm lại.</p>
      </div>

      <div class="panel">
        <h4>🧮 Phép toán với ý nghĩa</h4>
        <p class="muted">Chọn ba từ, AI sẽ "tính" ra từ thứ tư:</p>
        <div class="mt" style="font-size:15px; line-height:2;">
          <select id="selA"></select> −
          <select id="selB"></select> +
          <select id="selC"></select>
        </div>
        <button class="btn mt" id="calcBtn" style="width:100%;">= ?</button>
        <div id="analogyResult" class="mt center" style="font-size:22px; min-height:32px;"></div>

        <h4 class="mt">⚡ Thử nhanh các phép kinh điển</h4>
        <div id="presets"></div>
      </div>
    </div>

    <div class="takeaway">
      💡 <strong>Điều cốt lõi:</strong> AI "hiểu" nghĩa bằng cách đặt mọi từ lên một bản đồ tọa độ.
      Vì <em>vua</em> hơn <em>đàn ông</em> đúng bằng lượng mà <em>nữ hoàng</em> hơn <em>đàn bà</em>,
      nên AI làm được phép tính <em>vua − đàn ông + đàn bà = nữ hoàng</em> mà không hề tra từ điển.
    </div>
  `;

  // Đổ dữ liệu vào các ô chọn
  ["selA", "selB", "selC"].forEach((id) => {
    const sel = root.querySelector("#" + id);
    WORDS.forEach((w) => {
      const o = document.createElement("option");
      o.value = w;
      o.textContent = w;
      sel.appendChild(o);
    });
  });
  root.querySelector("#selA").value = "vua";
  root.querySelector("#selB").value = "đàn ông";
  root.querySelector("#selC").value = "đàn bà";

  const canvas = root.querySelector("#embCanvas");
  const ctx = canvas.getContext("2d");

  // Tính khung toạ độ
  const xs = WORDS.map((w) => WORD_VECTORS[w][0]);
  const ys = WORDS.map((w) => WORD_VECTORS[w][1]);
  const pad = 2;
  const minX = Math.min(...xs) - pad, maxX = Math.max(...xs) + pad;
  const minY = Math.min(...ys) - pad, maxY = Math.max(...ys) + pad;

  function toPx(vec) {
    const x = ((vec[0] - minX) / (maxX - minX)) * canvas.width;
    const y = canvas.height - ((vec[1] - minY) / (maxY - minY)) * canvas.height;
    return [x, y];
  }

  let highlight = null; // {vec, label, color}

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // lưới mờ
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * canvas.width;
      const y = (i / 10) * canvas.height;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
    // các điểm từ
    ctx.font = "13px Segoe UI, sans-serif";
    for (const w of WORDS) {
      const [px, py] = toPx(WORD_VECTORS[w]);
      ctx.fillStyle = "#6ea8fe";
      ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#e8ecf6";
      ctx.fillText(w, px + 7, py + 4);
    }
    // điểm kết quả nổi bật
    if (highlight) {
      const [px, py] = toPx(highlight.vec);
      ctx.fillStyle = highlight.color;
      ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px Segoe UI, sans-serif";
      ctx.fillText("➜ " + highlight.label, px + 11, py + 5);
    }
  }
  draw();

  function runAnalogy(a, b, c) {
    const va = WORD_VECTORS[a], vb = WORD_VECTORS[b], vc = WORD_VECTORS[c];
    const target = [va[0] - vb[0] + vc[0], va[1] - vb[1] + vc[1]];
    const ans = nearest(target, [a, b, c]);
    highlight = { vec: WORD_VECTORS[ans], label: ans, color: "#b07bff" };
    draw();
    root.querySelector("#analogyResult").innerHTML =
      `<strong style="color:#b07bff">${ans}</strong>`;
    sfx.success();
  }

  root.querySelector("#calcBtn").onclick = () => {
    runAnalogy(
      root.querySelector("#selA").value,
      root.querySelector("#selB").value,
      root.querySelector("#selC").value
    );
  };

  const presetsDiv = root.querySelector("#presets");
  ANALOGY_PRESETS.forEach((p) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = `${p.a} − ${p.b} + ${p.c}`;
    tag.onclick = () => {
      root.querySelector("#selA").value = p.a;
      root.querySelector("#selB").value = p.b;
      root.querySelector("#selC").value = p.c;
      runAnalogy(p.a, p.b, p.c);
    };
    presetsDiv.appendChild(tag);
  });
}
