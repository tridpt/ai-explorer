// Phòng — Bản đồ ý nghĩa (Word Embeddings). Song ngữ.
import { WORD_VECTORS, ANALOGY_PRESETS } from "../data/embeddings.js";
import { sfx } from "../sound.js";
import { tx } from "../i18n.js";

const WORDS = Object.keys(WORD_VECTORS);

// Nhóm nghĩa (để tô vùng màu mờ trên bản đồ). Mỗi cụm một tông màu.
const CLUSTERS = [
  {
    color: "110,168,254", // xanh dương — con người
    label: { vi: "Con người", en: "People" },
    words: ["đàn ông", "đàn bà", "vua", "nữ hoàng", "hoàng tử", "công chúa",
            "cha", "mẹ", "con trai", "con gái", "anh", "chị", "ông", "bà"],
  },
  {
    color: "251,146,60", // cam — động vật
    label: { vi: "Động vật", en: "Animals" },
    words: ["chó", "mèo", "hổ", "sư tử", "chim"],
  },
  {
    color: "52,211,153", // xanh lá — món ăn
    label: { vi: "Món ăn", en: "Foods" },
    words: ["cơm", "phở", "bánh mì", "bún"],
  },
];

// Nhãn tiếng Anh cho các từ (khóa nội bộ vẫn là tiếng Việt)
const EN = {
  "đàn ông": "man", "đàn bà": "woman", "vua": "king", "nữ hoàng": "queen",
  "hoàng tử": "prince", "công chúa": "princess", "cha": "father", "mẹ": "mother",
  "con trai": "son", "con gái": "daughter", "anh": "brother", "chị": "sister",
  "ông": "grandpa", "bà": "grandma", "chó": "dog", "mèo": "cat", "hổ": "tiger",
  "sư tử": "lion", "chim": "bird", "cơm": "rice", "phở": "pho", "bánh mì": "bread", "bún": "noodles",
};
const label = (w) => tx(w, EN[w] || w);

function dist(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); }

function nearest(vec, exclude = []) {
  let best = null, bestD = Infinity;
  for (const w of WORDS) {
    if (exclude.includes(w)) continue;
    const d = dist(WORD_VECTORS[w], vec);
    if (d < bestD) { bestD = d; best = w; }
  }
  return best;
}

export function roomEmbeddings(root) {
  root.innerHTML = `
    <p class="room-intro">
      ${tx(
        "AI không đọc chữ như chúng ta. Nó biến mỗi từ thành một <strong>điểm tọa độ</strong> trên một tấm bản đồ khổng lồ. Điều kỳ diệu: những từ có nghĩa gần nhau sẽ nằm gần nhau, và <em>khoảng cách giữa các từ cũng mang ý nghĩa</em>. Hãy thử ngay.",
        "AI doesn't read text like us. It turns each word into a <strong>coordinate point</strong> on a huge map. The magic: words with similar meaning sit close together, and <em>the distance between words carries meaning too</em>. Try it now."
      )}
    </p>

    <div class="row">
      <div class="panel" style="flex: 1.4;">
        <h4>${tx("🗺️ Bản đồ từ ngữ", "🗺️ Word map")}</h4>
        <canvas id="embCanvas" width="720" height="520" style="width:100%;"></canvas>
        <p class="muted mt">${tx(
          "Để ý: người ở giữa, động vật một góc, món ăn một góc — những thứ giống nhau tự xúm lại. 👉 Thử <b>kéo một từ</b> thả vào ô phép toán bên phải.",
          "Notice: people in the middle, animals in one corner, foods in another — similar things cluster. 👉 Try <b>dragging a word</b> onto a slot on the right."
        )}</p>
      </div>

      <div class="panel">
        <h4>${tx("🧮 Phép toán với ý nghĩa", "🧮 Arithmetic with meaning")}</h4>
        <p class="muted">${tx("Chọn ba từ, AI sẽ \"tính\" ra từ thứ tư:", "Pick three words, the AI \"computes\" the fourth:")}</p>
        <div class="mt" style="font-size:15px; line-height:2;">
          <select id="selA"></select> −
          <select id="selB"></select> +
          <select id="selC"></select>
        </div>
        <button class="btn mt" id="calcBtn" style="width:100%;">= ?</button>
        <div id="analogyResult" class="mt center" style="font-size:22px; min-height:32px;"></div>

        <h4 class="mt">${tx("⚡ Thử nhanh các phép kinh điển", "⚡ Quick try: classic analogies")}</h4>
        <div id="presets"></div>
      </div>
    </div>

    <div class="takeaway">
      ${tx(
        "💡 <strong>Điều cốt lõi:</strong> AI \"hiểu\" nghĩa bằng cách đặt mọi từ lên một bản đồ tọa độ. Vì <em>vua</em> hơn <em>đàn ông</em> đúng bằng lượng mà <em>nữ hoàng</em> hơn <em>đàn bà</em>, nên AI làm được phép tính <em>vua − đàn ông + đàn bà = nữ hoàng</em> mà không hề tra từ điển.",
        "💡 <strong>Key idea:</strong> AI \"understands\" meaning by placing every word on a coordinate map. Because <em>king</em> differs from <em>man</em> by the same amount as <em>queen</em> differs from <em>woman</em>, the AI can compute <em>king − man + woman = queen</em> without any dictionary."
      )}
    </div>
  `;

  ["selA", "selB", "selC"].forEach((id) => {
    const sel = root.querySelector("#" + id);
    WORDS.forEach((w) => {
      const o = document.createElement("option");
      o.value = w;
      o.textContent = label(w);
      sel.appendChild(o);
    });
  });
  root.querySelector("#selA").value = "vua";
  root.querySelector("#selB").value = "đàn ông";
  root.querySelector("#selC").value = "đàn bà";

  const canvas = root.querySelector("#embCanvas");
  const ctx = canvas.getContext("2d");

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

  let highlight = null; // { a, b, c, target, ans }

  // Vẽ một mũi tên có đầu nhọn từ p1 → p2.
  function arrow(p1, p2, color, dash = []) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.5;
    ctx.setLineDash(dash);
    ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();
    ctx.setLineDash([]);
    const ang = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
    const h = 9;
    ctx.beginPath();
    ctx.moveTo(p2[0], p2[1]);
    ctx.lineTo(p2[0] - h * Math.cos(ang - 0.4), p2[1] - h * Math.sin(ang - 0.4));
    ctx.lineTo(p2[0] - h * Math.cos(ang + 0.4), p2[1] - h * Math.sin(ang + 0.4));
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // Vẽ vùng màu mờ ôm quanh các từ của một cụm (dùng nhiều vòng tròn blur chồng lên).
  function drawClusterBlob(cl) {
    const pts = cl.words.map((w) => toPx(WORD_VECTORS[w]));
    let cx = 0, cy = 0;
    pts.forEach(([x, y]) => { cx += x; cy += y; });
    cx /= pts.length; cy /= pts.length;
    let rad = 0;
    pts.forEach(([x, y]) => { rad = Math.max(rad, Math.hypot(x - cx, y - cy)); });
    rad += 42;
    const g = ctx.createRadialGradient(cx, cy, rad * 0.2, cx, cy, rad);
    g.addColorStop(0, `rgba(${cl.color},0.20)`);
    g.addColorStop(1, `rgba(${cl.color},0)`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.fill();
    return { cx, cy, rad };
  }

  function draw() {
    // Nền gradient tối để bản đồ trông có chiều sâu.
    const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bg.addColorStop(0, "#181828");
    bg.addColorStop(1, "#0f1420");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Lưới mờ.
    ctx.strokeStyle = "rgba(255,255,255,0.035)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * canvas.width;
      const y = (i / 10) * canvas.height;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Vùng cụm nghĩa + nhãn cụm.
    ctx.textAlign = "left";
    for (const cl of CLUSTERS) {
      const { cx, cy, rad } = drawClusterBlob(cl);
      ctx.font = "700 12px Inter, sans-serif";
      ctx.fillStyle = `rgba(${cl.color},0.85)`;
      const t = tx(cl.label);
      const tw = ctx.measureText(t).width;
      ctx.fillText(t, cx - tw / 2, cy - rad + 16);
    }

    // Các từ tham gia phép loại suy được tô nổi bật.
    const involved = highlight ? new Set([highlight.a, highlight.b, highlight.c, highlight.ans]) : new Set();

    for (const w of WORDS) {
      const [px, py] = toPx(WORD_VECTORS[w]);
      const hot = involved.has(w);
      // Quầng sáng dưới điểm.
      const glow = ctx.createRadialGradient(px, py, 0, px, py, hot ? 16 : 10);
      glow.addColorStop(0, hot ? "rgba(176,123,255,0.55)" : "rgba(110,168,254,0.32)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(px, py, hot ? 16 : 10, 0, Math.PI * 2); ctx.fill();
      // Điểm.
      ctx.fillStyle = hot ? "#c79bff" : "#6ea8fe";
      ctx.beginPath(); ctx.arc(px, py, hot ? 5.5 : 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = hot ? 1.5 : 0.75;
      ctx.stroke();
      // Nhãn có nền pill để dễ đọc.
      ctx.font = hot ? "bold 13px Inter, sans-serif" : "12px Inter, sans-serif";
      const text = label(w);
      const tw = ctx.measureText(text).width;
      const lx = px + 8, ly = py + 4;
      ctx.fillStyle = hot ? "rgba(176,123,255,0.9)" : "rgba(20,20,32,0.6)";
      ctx.fillRect(lx - 3, ly - 11, tw + 6, 15);
      ctx.fillStyle = hot ? "#fff" : "rgba(232,236,246,0.9)";
      ctx.fillText(text, lx, ly);
    }

    if (highlight) {
      const pB = toPx(WORD_VECTORS[highlight.b]);
      const pA = toPx(WORD_VECTORS[highlight.a]);
      const pC = toPx(WORD_VECTORS[highlight.c]);
      const pT = toPx(highlight.target);
      const pAns = toPx(WORD_VECTORS[highlight.ans]);

      // Hai mũi tên song song: b→a (mối quan hệ) và c→đáp án (áp dụng mối quan hệ đó).
      arrow(pB, pA, "#22d3ee");
      arrow(pC, pT, "#b07bff");

      // Điểm "toán học rơi vào" (target) — có thể lệch chút so với từ gần nhất.
      ctx.fillStyle = "rgba(176,123,255,0.35)";
      ctx.beginPath(); ctx.arc(pT[0], pT[1], 9, 0, Math.PI * 2); ctx.fill();

      // Nối target tới từ gần nhất thực tế nếu chúng không trùng.
      if (dist(highlight.target, WORD_VECTORS[highlight.ans]) > 0.15) {
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.5)";
        ctx.setLineDash([3, 3]); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(pT[0], pT[1]); ctx.lineTo(pAns[0], pAns[1]); ctx.stroke();
        ctx.restore();
      }

      // Vòng sáng quanh đáp án.
      ctx.strokeStyle = "#b07bff"; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(pAns[0], pAns[1], 10, 0, Math.PI * 2); ctx.stroke();
    }
  }
  draw();

  function runAnalogy(a, b, c) {
    const va = WORD_VECTORS[a], vb = WORD_VECTORS[b], vc = WORD_VECTORS[c];
    const target = [va[0] - vb[0] + vc[0], va[1] - vb[1] + vc[1]];
    const ans = nearest(target, [a, b, c]);
    highlight = { a, b, c, target, ans };
    draw();
    const off = dist(target, WORD_VECTORS[ans]);
    const note = off > 0.15
      ? tx(" <span class='muted' style='font-size:13px'>(điểm tím là chỗ phép toán rơi vào — gần nhất là từ này, chứ không trùng khít: loại suy chỉ <em>xấp xỉ</em>)</span>",
           " <span class='muted' style='font-size:13px'>(the purple dot is where the math lands — the nearest word, not an exact hit: analogy is only <em>approximate</em>)</span>")
      : "";
    root.querySelector("#analogyResult").innerHTML =
      `<strong style="color:#b07bff">${label(ans)}</strong>${note}`;
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
    tag.textContent = `${label(p.a)} − ${label(p.b)} + ${label(p.c)}`;
    tag.onclick = () => {
      root.querySelector("#selA").value = p.a;
      root.querySelector("#selB").value = p.b;
      root.querySelector("#selC").value = p.c;
      runAnalogy(p.a, p.b, p.c);
    };
    presetsDiv.appendChild(tag);
  });

  // ---------- Kéo từ trên bản đồ thả vào ô phép toán ----------
  // Bổ trợ cho dropdown (dropdown vẫn dùng được bằng bàn phím — giữ khả năng tiếp cận).
  // Dùng Pointer Events nên chạy cả chuột lẫn cảm ứng.
  const selects = [root.querySelector("#selA"), root.querySelector("#selB"), root.querySelector("#selC")];
  let drag = null; // { word, x, y } — x,y theo hệ toạ độ NỘI BỘ của canvas

  // Đổi toạ độ con trỏ (client) sang hệ nội bộ canvas (canvas hiển thị bị co theo CSS).
  function canvasPoint(e) {
    const rect = canvas.getBoundingClientRect();
    return [
      (e.clientX - rect.left) * (canvas.width / rect.width),
      (e.clientY - rect.top) * (canvas.height / rect.height),
    ];
  }

  // Từ nằm gần con trỏ nhất (chỉ nhận nếu đủ gần) để bắt đầu kéo.
  function wordAt(px, py) {
    let best = null, bestD = Infinity;
    for (const w of WORDS) {
      const [wx, wy] = toPx(WORD_VECTORS[w]);
      const d = Math.hypot(wx - px, wy - py);
      if (d < bestD) { bestD = d; best = w; }
    }
    return bestD <= 24 ? best : null;
  }

  canvas.addEventListener("pointerdown", (e) => {
    const [px, py] = canvasPoint(e);
    const w = wordAt(px, py);
    if (!w) return;
    drag = { word: w, x: px, y: py };
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = "grabbing";
    selects.forEach((s) => s.classList.add("emb-drop"));
    sfx.tick();
    e.preventDefault();
  });

  canvas.addEventListener("pointermove", (e) => {
    const [px, py] = canvasPoint(e);
    if (!drag) {
      canvas.style.cursor = wordAt(px, py) ? "grab" : "default";
      return;
    }
    drag.x = px; drag.y = py;
    draw();
    // Nhãn đang kéo bay theo con trỏ.
    ctx.save();
    ctx.font = "bold 14px Inter, sans-serif";
    const text = label(drag.word);
    const w = ctx.measureText(text).width;
    ctx.fillStyle = "rgba(176,123,255,0.92)";
    ctx.fillRect(px + 8, py - 13, w + 14, 23);
    ctx.fillStyle = "#fff";
    ctx.fillText(text, px + 15, py + 3);
    ctx.restore();
  });

  function endDrag(e) {
    if (!drag) return;
    const word = drag.word;
    drag = null;
    canvas.style.cursor = "grab";
    selects.forEach((s) => s.classList.remove("emb-drop"));
    // Thả trúng ô select nào? (elementFromPoint hoạt động độc lập với pointer capture)
    const dropped = document.elementFromPoint(e.clientX, e.clientY);
    const slot = selects.find((s) => s === dropped || s.contains(dropped));
    if (slot) {
      slot.value = word;
      sfx.pop();
      runAnalogy(selects[0].value, selects[1].value, selects[2].value);
    } else {
      draw(); // hủy: xoá nhãn đang bay, vẽ lại sạch
    }
  }
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", () => {
    drag = null;
    canvas.style.cursor = "default";
    selects.forEach((s) => s.classList.remove("emb-drop"));
    draw();
  });
}
