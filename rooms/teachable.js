// Phòng 01 — Tự tay dạy AI (webcam, thuần JS). Song ngữ.
import { sfx } from "../sound.js";
import { getLang, tx } from "../i18n.js";

const GRID = 24;

const CLASSES = [
  { id: 0, name: { vi: "Tư thế A", en: "Pose A" }, color: "#6ea8fe", samples: [] },
  { id: 1, name: { vi: "Tư thế B", en: "Pose B" }, color: "#fb923c", samples: [] },
  { id: 2, name: { vi: "Tư thế C", en: "Pose C" }, color: "#4ade80", samples: [] },
];

const S = {
  intro: {
    vi: "Đây là cách AI thực sự học: bằng <strong>ví dụ</strong>, không phải bằng quy tắc. Bạn không lập trình cho nó biết \"tư thế A trông thế nào\". Thay vào đó, bạn <em>cho nó xem vài tấm ảnh mẫu</em>, rồi nó tự rút ra điểm chung. Bật webcam và dạy thử trong 30 giây.",
    en: "This is how AI really learns: from <strong>examples</strong>, not rules. You don't program what \"Pose A looks like\". Instead you <em>show it a few sample images</em> and it figures out the pattern. Turn on your webcam and teach it in 30 seconds.",
  },
  camTitle: { vi: "📸 Webcam", en: "📸 Webcam" },
  startCam: { vi: "Bật webcam", en: "Start webcam" },
  teachTitle: { vi: "1️⃣ Dạy AI: chụp vài mẫu cho mỗi tư thế", en: "1️⃣ Teach the AI: capture a few samples per pose" },
  teachHint: { vi: "Đổi tư thế/biểu cảm rồi bấm \"Chụp mẫu\" vài lần (5–10 lần mỗi loại là đẹp).", en: "Change pose/expression and click \"Capture\" a few times (5–10 each works well)." },
  predTitle: { vi: "2️⃣ AI đoán (tự động khi đã có mẫu)", en: "2️⃣ AI guesses (auto once trained)" },
  predWait: { vi: "Hãy dạy ít nhất 2 tư thế để AI bắt đầu đoán.", en: "Teach at least 2 poses for the AI to start guessing." },
  capture: { vi: "📷 Chụp mẫu:", en: "📷 Capture:" },
  samples: { vi: "mẫu", en: "samples" },
  camOn: { vi: "Webcam đã bật. Giờ hãy dạy AI bằng các nút bên phải.", en: "Webcam is on. Now teach the AI with the buttons on the right." },
  camErr: { vi: "⚠️ Không truy cập được webcam (cần cấp quyền và chạy qua localhost/https). Bạn vẫn có thể đọc phần giải thích phía dưới.", en: "⚠️ Can't access the webcam (needs permission and localhost/https). You can still read the explanation below." },
  camFirst: { vi: "Hãy bật webcam trước nhé.", en: "Please start the webcam first." },
  takeaway: {
    vi: "💡 <strong>Điều cốt lõi:</strong> AI học từ <em>dữ liệu</em>, không phải từ luật lệ ta viết tay. Càng nhiều mẫu chất lượng, nó càng đoán giỏi. Đây cũng là lý do dữ liệu là \"nhiên liệu\" của AI — và nếu dữ liệu lệch, AI cũng sẽ lệch theo (bạn sẽ gặp lại điều này ở phòng cuối).",
    en: "💡 <strong>Key idea:</strong> AI learns from <em>data</em>, not hand-written rules. The more good samples, the better it guesses. That's why data is AI's \"fuel\" — and if the data is skewed, the AI will be too (you'll meet this again later).",
  },
};

function extractFeature(video, work) {
  const wctx = work.getContext("2d");
  wctx.drawImage(video, 0, 0, GRID, GRID);
  const img = wctx.getImageData(0, 0, GRID, GRID).data;
  const f = new Float32Array(GRID * GRID);
  let mean = 0;
  for (let i = 0; i < GRID * GRID; i++) {
    const g = (img[i * 4] + img[i * 4 + 1] + img[i * 4 + 2]) / 3 / 255;
    f[i] = g; mean += g;
  }
  mean /= f.length;
  for (let i = 0; i < f.length; i++) f[i] -= mean;
  return f;
}

function distance(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; s += d * d; }
  return Math.sqrt(s);
}

export function roomTeachable(root) {
  root.innerHTML = `
    <p class="room-intro">${tx(S.intro)}</p>
    <div class="row">
      <div class="panel" style="flex:1.1;">
        <h4>${tx(S.camTitle)}</h4>
        <video id="cam" autoplay playsinline muted style="width:100%; border-radius:12px; background:#000;"></video>
        <button class="btn mt" id="startCam" style="width:100%;">${tx(S.startCam)}</button>
        <p id="camMsg" class="muted mt"></p>
      </div>
      <div class="panel">
        <h4>${tx(S.teachTitle)}</h4>
        <p class="muted">${tx(S.teachHint)}</p>
        <div id="classBtns" class="mt"></div>
        <h4 class="mt">${tx(S.predTitle)}</h4>
        <div id="prediction"><p class="muted">${tx(S.predWait)}</p></div>
      </div>
    </div>
    <div class="takeaway">${tx(S.takeaway)}</div>
  `;

  const video = root.querySelector("#cam");
  const camMsg = root.querySelector("#camMsg");
  const work = document.createElement("canvas");
  work.width = GRID; work.height = GRID;
  let streaming = false, stream = null, predTimer = null;

  CLASSES.forEach((c) => (c.samples = []));

  root.querySelector("#startCam").onclick = async () => {
    if (streaming) return;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      streaming = true;
      camMsg.textContent = tx(S.camOn);
      startPredLoop();
    } catch (err) {
      camMsg.innerHTML = tx(S.camErr);
    }
  };

  const classBtns = root.querySelector("#classBtns");
  CLASSES.forEach((c) => {
    const wrap = document.createElement("div");
    wrap.style.marginBottom = "8px";
    wrap.innerHTML = `
      <button class="btn ghost" data-cls="${c.id}" style="border-color:${c.color}">
        ${tx(S.capture)} <b style="color:${c.color}">${tx(c.name)}</b>
      </button>
      <span class="muted" id="cnt-${c.id}" style="margin-left:8px;">0 ${tx(S.samples)}</span>
    `;
    classBtns.appendChild(wrap);
    wrap.querySelector("button").onclick = () => {
      if (!streaming) { camMsg.textContent = tx(S.camFirst); return; }
      c.samples.push(extractFeature(video, work));
      root.querySelector(`#cnt-${c.id}`).textContent = `${c.samples.length} ${tx(S.samples)}`;
      sfx.pop();
    };
  });

  const predEl = root.querySelector("#prediction");

  function predict() {
    const trained = CLASSES.filter((c) => c.samples.length > 0);
    if (trained.length < 2) return;
    const f = extractFeature(video, work);
    const scores = trained.map((c) => {
      const minD = Math.min(...c.samples.map((s) => distance(f, s)));
      return { c, score: 1 / (minD + 0.001) };
    });
    const sum = scores.reduce((s, x) => s + x.score, 0);
    scores.sort((a, b) => b.score - a.score);
    predEl.innerHTML = scores.map((x) => {
      const pct = Math.round((x.score / sum) * 100);
      return `<div class="bar-row">
        <div class="bar-label" style="color:${x.c.color}">${tx(x.c.name)}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%; background:${x.c.color}">${pct}%</div></div>
      </div>`;
    }).join("");
  }

  function startPredLoop() {
    if (predTimer) clearInterval(predTimer);
    predTimer = setInterval(predict, 300);
  }

  window.addEventListener("roomleave", () => {
    if (predTimer) clearInterval(predTimer);
    if (stream) stream.getTracks().forEach((t) => t.stop());
  }, { once: true });
}
