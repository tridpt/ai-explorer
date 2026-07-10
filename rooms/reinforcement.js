// Phòng — Học tăng cường: GAME "Thiết kế thưởng cho robot". Song ngữ.
// Người chơi tự đặt phần thưởng/hình phạt rồi huấn luyện; mục tiêu: dạy robot tới đích
// bằng CÀNG ÍT ĐỢT HỌC càng tốt. Dạy "reward shaping" — cốt lõi của RL. Có mascot.
import { sfx, celebrate } from "../sound.js";
import { tx } from "../i18n.js";
import { getRoomStat, setRoomStatMax } from "../store.js";

const ROWS = 5, COLS = 6;
const START = [0, 0], GOAL = [ROWS - 1, COLS - 1];
const TRAPS = [[1, 2], [2, 4], [3, 1]];
const ACTIONS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const ARROWS = ["↑", "↓", "←", "→"];
const BATCH = 40;
const isTrap = (r, c) => TRAPS.some(([tr, tc]) => tr === r && tc === c);
const isGoal = (r, c) => r === GOAL[0] && c === GOAL[1];

const BOT = {
  intro: { vi: "Tôi là robot 🤖. Tôi <b>không</b> được chỉ đường — chỉ học qua <b>thưởng và phạt</b> bạn đặt. Chỉnh thưởng cho khéo để tôi tới 🎯 bằng <b>ít đợt học nhất</b>!", en: "I'm a robot 🤖. Nobody tells me the way — I only learn from the <b>rewards & penalties</b> you set. Tune them well so I reach 🎯 in the <b>fewest training rounds</b>!" },
  batch: { vi: "Đợt %e: tới đích %w/%B lần khi thử. Học tiếp nhé!", en: "Round %e: reached goal %w/%B tries. Keep going!" },
  win: { vi: "🎉 Tôi đi thẳng tới đích sau <b>%e đợt</b>! %r", en: "🎉 I reached the goal after <b>%e rounds</b>! %r" },
  lowReward: { vi: "💡 Mẹo: thưởng đích cao hơn + phạt bẫy nặng hơn thường giúp tôi học nhanh hơn.", en: "💡 Tip: a higher goal reward + heavier trap penalty usually helps me learn faster." },
};

const UI = {
  intro: {
    vi: "Không phải AI nào cũng học từ đáp án. <strong>Học tăng cường</strong> giống dạy thú cưng: robot tự thử, làm tốt thì <em>thưởng</em>, sai thì <em>phạt</em>. Nhiệm vụ của bạn: <strong>thiết kế phần thưởng</strong> để robot học đường tới 🎯 (tránh 💥) bằng ít đợt nhất.",
    en: "Not all AI learns from an answer key. <strong>Reinforcement learning</strong> is like training a pet: the robot tries, gets <em>rewarded</em> for good moves, <em>penalized</em> for bad. Your job: <strong>design the rewards</strong> so it learns the path to 🎯 (avoiding 💥) in the fewest rounds.",
  },
  goalR: { vi: "🎯 Thưởng khi tới đích:", en: "🎯 Reward for reaching goal:" },
  trapP: { vi: "💥 Phạt khi sa bẫy:", en: "💥 Penalty for hitting a trap:" },
  train: { vi: "🎓 Huấn luyện 1 đợt", en: "🎓 Train one round" },
  watch: { vi: "🤖 Xem robot đi thử", en: "🤖 Watch it try" },
  reset: { vi: "↺ Quên hết", en: "↺ Forget all" },
  rounds: { vi: "Đợt đã học", en: "Rounds" }, best: { vi: "Kỷ lục", en: "Best" },
  over: { vi: "🏁 Robot đã thạo đường!", en: "🏁 Robot mastered it!" },
  overSub: {
    vi: "Bạn vừa làm <b>reward shaping</b> — nghệ thuật đặt phần thưởng để AI học đúng thứ ta muốn. Đây là cách AI học chơi game, đi cờ, điều khiển robot: không có \"đáp án\", chỉ có phần thưởng.",
    en: "You just did <b>reward shaping</b> — the art of setting rewards so the AI learns what we want. It's how AI learns games, Go, robot control: no \"answer key\", only reward.",
  },
  newRecord: { vi: "🏆 Kỷ lục mới!", en: "🏆 New record!" },
  scoreLabel: { vi: "Điểm", en: "Score" },
};

export function roomReinforcement(root) {
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  root.innerHTML = `
    <p class="room-intro">${tx(UI.intro)}</p>
    <div class="g-mascot"><div class="g-bot" id="rlBot">🤖</div><div class="g-bubble" id="rlBubble">${tx(BOT.intro)}</div></div>

    <div class="panel">
      <div class="g-hud">
        <div class="g-stat"><span>${tx(UI.rounds)}</span><b id="rlEp">0</b></div>
        <div class="g-stat"><span>${tx(UI.best)}</span><b id="rlBest">—</b></div>
      </div>
      <div class="row">
        <div class="panel center" style="flex:1.1; margin:0;">
          <h4 style="text-align:left">${tx("🗺️ Thế giới của robot", "🗺️ The robot's world")}</h4>
          <canvas id="rlCanvas" width="480" height="400" style="margin:0 auto;"></canvas>
          <p class="muted mt" style="font-size:12px">${tx("Xanh = ô robot thấy \"đáng giá\" · mũi tên = nước đi tốt nhất.", "Green = tiles it finds \"valuable\" · arrows = its best move.")}</p>
        </div>
        <div class="panel" style="margin:0;">
          <h4>${tx("🎛️ Thiết kế thưởng", "🎛️ Design the reward")}</h4>
          <label class="field"><span>${tx(UI.goalR)} <b id="rlGoalV">3</b></span>
            <input type="range" id="rlGoal" min="1" max="5" step="1" value="3" /></label>
          <label class="field mt"><span>${tx(UI.trapP)} <b id="rlTrapV">-3</b></span>
            <input type="range" id="rlTrap" min="1" max="5" step="1" value="3" /></label>
          <button class="btn g-play mt" id="rlTrain" style="width:100%">${tx(UI.train)}</button>
          <button class="btn ghost mt" id="rlWatch" style="width:100%">${tx(UI.watch)}</button>
          <button class="btn ghost mt" id="rlReset" style="width:100%">${tx(UI.reset)}</button>
        </div>
      </div>
    </div>

    <div id="rlOver" hidden class="g-over"></div>

    <div class="takeaway">${tx(
      "💡 <strong>Điều cốt lõi:</strong> Học tăng cường không cần \"đáp án đúng\" — AI chỉ nhận <em>phần thưởng</em> và tự chỉnh để nhận nhiều hơn. Cách bạn đặt thưởng quyết định nó học nhanh hay chậm, học đúng hay lệch.",
      "💡 <strong>Key idea:</strong> RL needs no \"right answer\" — the AI just gets a <em>reward</em> and tunes itself to earn more. How you set the reward decides how fast, and how correctly, it learns."
    )}</div>
  `;

  const $ = (s) => root.querySelector(s);
  const canvas = $("#rlCanvas"), ctx = canvas.getContext("2d");
  const cw = canvas.width / COLS, ch = canvas.height / ROWS;
  const botEl = $("#rlBot"), bubbleEl = $("#rlBubble");
  const epEl = $("#rlEp"), bestEl = $("#rlBest"), overEl = $("#rlOver");
  const goalSlider = $("#rlGoal"), trapSlider = $("#rlTrap");

  let Q, episodes = 0, playing = false, solved = false, animTimer = null;
  const bestScore = getRoomStat("reinforcement", "bestScore", 0);
  bestEl.textContent = bestScore > 0 ? bestScore : "—";

  function say(msg, mood = "") {
    bubbleEl.innerHTML = msg;
    if (reduce) return;
    botEl.classList.remove("bot-happy", "bot-sad", "bot-bounce");
    void botEl.offsetWidth;
    botEl.classList.add(mood === "happy" ? "bot-happy" : mood === "sad" ? "bot-sad" : "bot-bounce");
  }

  function resetQ() {
    Q = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => [0, 0, 0, 0]));
    episodes = 0; solved = false;
    epEl.textContent = 0;
    overEl.hidden = true;
    $("#rlTrain").disabled = false;
    draw();
  }

  function goalReward() { return parseInt(goalSlider.value); }
  function trapPenalty() { return -parseInt(trapSlider.value); }

  function stepEnv(r, c, a) {
    let nr = r + ACTIONS[a][0], nc = c + ACTIONS[a][1];
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) { nr = r; nc = c; }
    if (isGoal(nr, nc)) return [nr, nc, goalReward(), true];
    if (isTrap(nr, nc)) return [nr, nc, trapPenalty(), true];
    return [nr, nc, -0.03, false];
  }
  function bestAction(r, c) { const q = Q[r][c]; let b = 0; for (let a = 1; a < 4; a++) if (q[a] > q[b]) b = a; return b; }

  function runEpisode(eps, lr = 0.5, gamma = 0.95) {
    let [r, c] = START, steps = 0, reachedGoal = false;
    while (steps < 80) {
      const a = Math.random() < eps ? (Math.random() * 4) | 0 : bestAction(r, c);
      const [nr, nc, reward, done] = stepEnv(r, c, a);
      const future = done ? 0 : Math.max(...Q[nr][nc]);
      Q[r][c][a] += lr * (reward + gamma * future - Q[r][c][a]);
      r = nr; c = nc; steps++;
      if (done) { reachedGoal = isGoal(r, c); break; }
    }
    return reachedGoal;
  }

  // Chạy thử greedy (không thăm dò) xem có đi tới đích sạch không.
  function greedyTest() {
    let [r, c] = START, steps = 0;
    while (steps < 30) {
      const a = bestAction(r, c);
      let nr = r + ACTIONS[a][0], nc = c + ACTIONS[a][1];
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return false;
      if (isTrap(nr, nc)) return false;
      if (isGoal(nr, nc)) return true;
      r = nr; c = nc; steps++;
    }
    return false;
  }

  function draw(agentPos) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let maxV = 0.001;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) maxV = Math.max(maxV, Math.max(...Q[r][c]));
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const x = c * cw, y = r * ch;
      let fill = "rgba(255,255,255,0.03)";
      if (isGoal(r, c)) fill = "rgba(52,211,153,0.35)";
      else if (isTrap(r, c)) fill = "rgba(251,113,133,0.32)";
      else { const v = Math.max(0, Math.max(...Q[r][c])) / maxV; fill = `rgba(52,211,153,${(v * 0.5).toFixed(2)})`; }
      ctx.fillStyle = fill; ctx.fillRect(x + 2, y + 2, cw - 4, ch - 4);
      ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.strokeRect(x + 2, y + 2, cw - 4, ch - 4);
      ctx.font = "24px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      if (isGoal(r, c)) ctx.fillText("🎯", x + cw / 2, y + ch / 2);
      else if (isTrap(r, c)) ctx.fillText("💥", x + cw / 2, y + ch / 2);
      else if (episodes > 0 && Math.max(...Q[r][c]) > 0) {
        ctx.fillStyle = "rgba(244,242,251,0.55)"; ctx.font = "18px sans-serif";
        ctx.fillText(ARROWS[bestAction(r, c)], x + cw / 2, y + ch / 2);
      }
    }
    const [ar, ac] = agentPos || START;
    ctx.font = "26px serif"; ctx.fillText("🤖", ac * cw + cw / 2, ar * ch + ch / 2);
  }

  function trainBatch() {
    if (solved) return;
    let wins = 0;
    for (let i = 0; i < BATCH; i++) {
      const eps = Math.max(0.05, 0.5 - episodes / 800);
      if (runEpisode(eps)) wins++;
      episodes++;
    }
    epEl.textContent = episodes;
    draw();
    sfx.pop();
    if (greedyTest()) { endGame(); return; }
    say(tx(BOT.batch).replace("%e", episodes / BATCH).replace("%w", wins).replace("%B", BATCH)
      + (episodes >= 240 && goalReward() + parseInt(trapSlider.value) < 6 ? " " + tx(BOT.lowReward) : ""));
  }

  function watch() {
    if (playing || episodes === 0) return;
    playing = true;
    let [r, c] = START, steps = 0;
    animTimer = setInterval(() => {
      draw([r, c]);
      if (isGoal(r, c)) { clearInterval(animTimer); playing = false; sfx.success(); return; }
      if (isTrap(r, c) || steps > 40) { clearInterval(animTimer); playing = false; sfx.wrong(); return; }
      const a = bestAction(r, c);
      let nr = r + ACTIONS[a][0], nc = c + ACTIONS[a][1];
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) { nr = r; nc = c; }
      r = nr; c = nc; steps++; sfx.tick();
    }, 240);
  }

  function endGame() {
    solved = true;
    $("#rlTrain").disabled = true;
    const rounds = episodes / BATCH;
    const score = Math.max(100, Math.round(1600 - rounds * 90));
    const record = setRoomStatMax("reinforcement", "bestScore", score);
    bestEl.textContent = getRoomStat("reinforcement", "bestScore", 0);
    if (!reduce) celebrate();
    sfx.complete();
    say(tx(BOT.win).replace("%e", rounds).replace("%r", record ? tx("🏆 Kỷ lục!", "🏆 Record!") : "🎯"), "happy");
    // Animate chặng thắng
    watch();
    overEl.hidden = false;
    overEl.innerHTML = `
      <div class="g-over-card">
        <div class="g-over-title">${record ? tx(UI.newRecord) : tx(UI.over)}</div>
        <div class="g-over-score">${tx(UI.scoreLabel)}: <b>${score}</b> · ${rounds} ${tx("đợt", "rounds")}</div>
        <p class="muted">${tx(UI.overSub)}</p>
        <button class="btn g-play" id="rlAgain">${tx("↺ Thử lại (nhanh hơn?)", "↺ Try again (faster?)")}</button>
      </div>`;
    overEl.querySelector("#rlAgain").onclick = resetQ;
  }

  goalSlider.oninput = () => { $("#rlGoalV").textContent = goalSlider.value; };
  trapSlider.oninput = () => { $("#rlTrapV").textContent = "-" + trapSlider.value; };
  $("#rlTrain").onclick = trainBatch;
  $("#rlWatch").onclick = watch;
  $("#rlReset").onclick = () => { resetQ(); say(tx(BOT.intro)); };

  window.addEventListener("roomleave", () => { if (animTimer) clearInterval(animTimer); }, { once: true });
  resetQ();
}
