// Phòng — Bản đồ ý nghĩa (Word Embeddings). Song ngữ.
import { WORD_VECTORS, ANALOGY_PRESETS } from "../data/embeddings.js";
import { sfx } from "../sound.js";
import { tx } from "../i18n.js";

const WORDS = Object.keys(WORD_VECTORS);

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
        <canvas id="embCanvas" width="640" height="460"></canvas>
        <p class="muted mt">${tx(
          "Để ý: người ở giữa, động vật một góc, món ăn một góc — những thứ giống nhau tự xúm lại.",
          "Notice: people in the middle, animals in one corner, foods in another — similar things cluster."
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

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * canvas.width;
      const y = (i / 10) * canvas.height;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Các từ tham gia phép loại suy được tô nổi bật.
    const involved = highlight ? new Set([highlight.a, highlight.b, highlight.c, highlight.ans]) : new Set();

    ctx.font = "13px Inter, sans-serif";
    for (const w of WORDS) {
      const [px, py] = toPx(WORD_VECTORS[w]);
      const hot = involved.has(w);
      ctx.fillStyle = hot ? "#b07bff" : "rgba(110,168,254,0.5)";
      ctx.beginPath(); ctx.arc(px, py, hot ? 5 : 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = hot ? "#fff" : "rgba(232,236,246,0.55)";
      ctx.font = hot ? "bold 13px Inter, sans-serif" : "13px Inter, sans-serif";
      ctx.fillText(label(w), px + 7, py + 4);
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
}
