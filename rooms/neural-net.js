// Phòng — Mạng nơ-ron: THỬ THÁCH TỐC ĐỘ "đạt 95% chính xác nhanh nhất". Song ngữ.
// Giữ nguyên mạng MLP huấn luyện thật trên trình duyệt, bọc thành game: chọn số nơ-ron,
// bấm bắt đầu, đua xem AI đạt 95% trong bao lâu — kiếm huy hiệu tốc độ. Có mascot dẫn dắt.
import { sfx, celebrate } from "../sound.js";
import { tx } from "../i18n.js";
import { getRoomStat, setRoomStatMax } from "../store.js";

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
const tanh = (z) => Math.tanh(z);
const sigmoid = (z) => 1 / (1 + Math.exp(-z));

function initNet(H) {
  const rnd = () => Math.random() * 2 - 1;
  return { H, W1: Array.from({ length: H }, () => [rnd(), rnd()]), b1: Array.from({ length: H }, () => rnd()), W2: Array.from({ length: H }, () => rnd()), b2: rnd() };
}
function forward(net, x, y) {
  const a1 = [];
  for (let h = 0; h < net.H; h++) a1[h] = tanh(net.W1[h][0] * x + net.W1[h][1] * y + net.b1[h]);
  let z2 = net.b2;
  for (let h = 0; h < net.H; h++) z2 += net.W2[h] * a1[h];
  return { a1, out: sigmoid(z2) };
}
function trainStep(net, data, lr) {
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

const GOAL = 95;
const BOT = {
  intro: { vi: "Chào! Tôi là Bit 🤖. Bên trong tôi là các <b>nơ-ron</b>. Chọn số nơ-ron rồi bấm bắt đầu — xem tôi chạm <b>95% chính xác</b> nhanh cỡ nào nhé!", en: "Hi! I'm Bit 🤖. Inside me are <b>neurons</b>. Pick how many, hit start — see how fast I hit <b>95% accuracy</b>!" },
  fewHint: { vi: "🤔 Ít nơ-ron quá nên tôi chỉ vẽ được đường thẳng — chịu thua vòng tròn. Thử 6–10 nơ-ron xem!", en: "🤔 Too few neurons — I can only draw a line, so a circle beats me. Try 6–10!" },
  win: { vi: "🎉 Chạm 95% trong <b>%s giây</b>! %b", en: "🎉 Hit 95% in <b>%s s</b>! %b" },
  training: { vi: "Đang học… nhìn ranh giới uốn dần thành vòng tròn 👀", en: "Learning… watch the boundary curve into a circle 👀" },
};

export function roomNeuralNet(root) {
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  root.innerHTML = `
    <p class="room-intro">${tx(
      "Bên trong AI là nhiều <strong>nơ-ron</strong>, mỗi cái làm một phép tính tí hon; ghép lại chúng học được hình phức tạp. <strong>Thử thách:</strong> giúp AI tách điểm <span style=\"color:#c2410c;font-weight:700\">cam (trong vòng tròn)</span> khỏi <span style=\"color:#1d4ed8;font-weight:700\">xanh (ngoài)</span> — đạt <b>95% chính xác</b> càng nhanh càng tốt!",
      "Inside an AI are many <strong>neurons</strong>, each doing a tiny calculation; combined they learn complex shapes. <strong>Challenge:</strong> help the AI separate <span style=\"color:#c2410c;font-weight:700\">orange (inside the circle)</span> from <span style=\"color:#1d4ed8;font-weight:700\">blue (outside)</span> — reach <b>95% accuracy</b> as fast as you can!"
    )}</p>

    <div class="g-mascot"><div class="g-bot" id="nnBot">🤖</div><div class="g-bubble" id="nnBubble">${tx(BOT.intro)}</div></div>

    <div class="panel">
      <div class="g-hud">
        <div class="g-stat"><span>${tx("Thời gian", "Time")}</span><b id="nnTime">0.0s</b></div>
        <div class="g-stat"><span>${tx("Chính xác", "Accuracy")}</span><b id="nnAcc">—</b></div>
        <div class="g-stat"><span>${tx("Kỷ lục", "Best")}</span><b id="nnBest">—</b></div>
      </div>

      <div class="row">
        <div class="panel center" style="flex:1.2; margin:0;">
          <h4 style="text-align:left">${tx("🕸️ AI đang học (vùng màu = dự đoán)", "🕸️ The AI learns (colored area = its guess)")}</h4>
          <canvas id="nnCanvas" width="420" height="420" role="img" aria-label="${tx("Bản đồ dự đoán của mạng nơ-ron; vùng màu là dự đoán của AI", "Neural network prediction map; colored areas show the AI's guess")}"></canvas>
        </div>
        <div class="panel" style="margin:0;">
          <h4>${tx("🎛️ Chuẩn bị", "🎛️ Setup")}</h4>
          <label class="field">
            <span>${tx("Số nơ-ron:", "Neurons:")} <b id="hVal">6</b></span>
            <input type="range" id="hRange" min="1" max="16" step="1" value="6" />
          </label>
          <label class="nn-toggle mt" style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:14px; font-weight:600;">
            <input type="checkbox" id="showNeurons" style="width:auto;" />
            ${tx("👁️ Hiện đường của <b>từng nơ-ron</b>", "👁️ Show <b>each neuron's</b> line")}
          </label>
          <div class="mt"><span class="g-goal">🎯 ${tx("Mục tiêu", "Goal")}: ${GOAL}%</span></div>
          <div class="row mt">
            <button class="btn g-play" id="nnStart">${tx("▶ Bắt đầu", "▶ Start")}</button>
            <button class="btn ghost" id="nnReset">${tx("↺ Làm lại", "↺ Reset")}</button>
          </div>
        </div>
      </div>
    </div>

    <div class="takeaway">${tx(
      "💡 <strong>Điều cốt lõi:</strong> AI không được lập trình cứng từng luật — nó <em>tự chỉnh</em> hàng loạt con số (trọng số) để giảm sai. Càng nhiều nơ-ron, càng bắt được mẫu phức tạp: đó là \"học sâu\".",
      "💡 <strong>Key idea:</strong> AI isn't hard-coded rule by rule — it <em>tunes</em> many numbers (weights) to cut errors. More neurons capture more complex patterns: that's \"deep learning\"."
    )}</div>
  `;

  const $ = (s) => root.querySelector(s);
  const canvas = $("#nnCanvas"), ctx = canvas.getContext("2d");
  const W = canvas.width, Hpx = canvas.height;
  const botEl = $("#nnBot"), bubbleEl = $("#nnBubble");
  const timeEl = $("#nnTime"), accEl = $("#nnAcc"), bestEl = $("#nnBest");
  const hRange = $("#hRange");

  let data = makeData(), net = initNet(6), epochs = 0, timer = null, showNeurons = false;
  let running = false, startT = 0, solved = false;

  const bestScore = getRoomStat("neural-net", "bestScore", 0);
  bestEl.textContent = bestScore > 0 ? bestScore : "—";

  function say(msg, mood = "") {
    bubbleEl.innerHTML = msg;
    if (reduce) return;
    botEl.classList.remove("bot-happy", "bot-sad", "bot-bounce");
    void botEl.offsetWidth;
    botEl.classList.add(mood === "happy" ? "bot-happy" : mood === "sad" ? "bot-sad" : "bot-bounce");
  }

  const toPx = (v) => ((v + 1) / 2) * W;
  function draw() {
    const step = 7;
    for (let px = 0; px < W; px += step)
      for (let py = 0; py < Hpx; py += step) {
        const x = (px / W) * 2 - 1, y = (py / Hpx) * 2 - 1;
        const { out } = forward(net, x, y);
        const r = Math.round(110 + out * (251 - 110)), g = Math.round(168 + out * (146 - 168)), b = Math.round(254 + out * (60 - 254));
        ctx.fillStyle = `rgba(${r},${g},${b},0.35)`;
        ctx.fillRect(px, py, step, step);
      }
    if (showNeurons) {
      ctx.save(); ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5;
      for (let h = 0; h < net.H; h++) {
        const [w1, w2] = net.W1[h], b = net.b1[h];
        ctx.strokeStyle = `hsla(${Math.round((h / net.H) * 360)}, 85%, 60%, 0.9)`;
        ctx.beginPath();
        if (Math.abs(w2) > Math.abs(w1)) { const yAt = (x) => -(w1 * x + b) / w2; ctx.moveTo(toPx(-1), toPx(yAt(-1))); ctx.lineTo(toPx(1), toPx(yAt(1))); }
        else { const xAt = (y) => -(w2 * y + b) / w1; ctx.moveTo(toPx(xAt(-1)), toPx(-1)); ctx.lineTo(toPx(xAt(1)), toPx(1)); }
        ctx.stroke();
      }
      ctx.restore();
    }
    for (const p of data) {
      ctx.beginPath();
      ctx.arc(toPx(p.x), toPx(p.y), 4, 0, Math.PI * 2);
      ctx.fillStyle = p.label ? "#fb923c" : "#6ea8fe";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.6)"; ctx.lineWidth = 1; ctx.stroke();
    }
  }

  function accuracy() {
    let correct = 0;
    for (const p of data) { const { out } = forward(net, p.x, p.y); if ((out > 0.5 ? 1 : 0) === p.label) correct++; }
    return Math.round((correct / data.length) * 100);
  }

  function badge(sec) {
    if (sec <= 3) return "🥇";
    if (sec <= 6) return "🥈";
    if (sec <= 10) return "🥉";
    return "✅";
  }

  function stop() { if (timer) { clearInterval(timer); timer = null; } running = false; }

  function finishWin() {
    stop();
    solved = true;
    const sec = (performance.now() - startT) / 1000;
    const secTxt = sec.toFixed(1);
    const score = Math.max(50, Math.round(3000 / Math.max(1.2, sec)));
    const b = badge(sec);
    accEl.textContent = accuracy() + "% " + b;
    const record = setRoomStatMax("neural-net", "bestScore", score);
    bestEl.textContent = getRoomStat("neural-net", "bestScore", 0);
    if (!reduce) celebrate();
    sfx.complete();
    say(tx(BOT.win).replace("%s", secTxt).replace("%b", (record ? tx("🏆 Kỷ lục mới!", "🏆 New record!") : b)), "happy");
    $("#nnStart").textContent = tx("▶ Thử lại", "▶ Try again");
  }

  function tickTrain() {
    for (let i = 0; i < 3; i++) { trainStep(net, data, 0.1); epochs++; }
    draw();
    const acc = accuracy();
    accEl.textContent = acc + "%";
    timeEl.textContent = ((performance.now() - startT) / 1000).toFixed(1) + "s";
    if (acc >= GOAL) { finishWin(); return; }
    // Ít nơ-ron → không bao giờ đạt; sau ~2200 vòng thì gợi ý.
    if (epochs > 2200) { stop(); say(tx(BOT.fewHint), "sad"); $("#nnStart").textContent = tx("▶ Bắt đầu", "▶ Start"); }
  }

  function startChallenge() {
    stop();
    net = initNet(parseInt(hRange.value));
    epochs = 0; solved = false; running = true; startT = performance.now();
    say(tx(BOT.training));
    draw();
    timer = setInterval(tickTrain, 40);
  }

  hRange.oninput = () => { $("#hVal").textContent = hRange.value; if (!running) { net = initNet(parseInt(hRange.value)); epochs = 0; accEl.textContent = "—"; timeEl.textContent = "0.0s"; draw(); } };
  $("#showNeurons").addEventListener("change", (e) => { showNeurons = e.target.checked; draw(); });
  $("#nnStart").onclick = startChallenge;
  $("#nnReset").onclick = () => { stop(); data = makeData(); net = initNet(parseInt(hRange.value)); epochs = 0; solved = false; accEl.textContent = "—"; timeEl.textContent = "0.0s"; say(tx(BOT.intro)); draw(); $("#nnStart").textContent = tx("▶ Bắt đầu", "▶ Start"); };

  window.addEventListener("roomleave", stop, { once: true });
  draw();
}
