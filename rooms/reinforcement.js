// Phòng — Học tăng cường (Reinforcement Learning): AI học qua thử–sai và phần thưởng.
// Một "chú robot" học đường tới đích trên lưới bằng Q-learning, ngay trên trình duyệt.
import { sfx, celebrate } from "../sound.js";

const ROWS = 5, COLS = 6;
const START = [0, 0];
const GOAL = [ROWS - 1, COLS - 1];
const TRAPS = [[1, 2], [2, 4], [3, 1]];
const ACTIONS = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // lên, xuống, trái, phải
const ARROWS = ["↑", "↓", "←", "→"];

function isTrap(r, c) { return TRAPS.some(([tr, tc]) => tr === r && tc === c); }
function isGoal(r, c) { return r === GOAL[0] && c === GOAL[1]; }

export function roomReinforcement(root) {
  root.innerHTML = `
    <p class="room-intro">
      Không phải AI nào cũng học từ đáp án có sẵn. <strong>Học tăng cường</strong> giống cách ta dạy thú cưng:
      để nó tự thử, làm đúng thì <em>thưởng</em>, làm sai thì <em>phạt</em>. Dần dần nó tự tìm ra cách tốt nhất.
      Bên dưới, chú robot 🤖 phải học đường tới đích 🎯, tránh các ô bẫy 💥 — mà không hề được chỉ trước.
    </p>

    <div class="row">
      <div class="panel center" style="flex:1.1;">
        <h4 style="text-align:left">🗺️ Thế giới của robot</h4>
        <canvas id="rlCanvas" width="480" height="400" style="margin:0 auto;"></canvas>
        <p class="muted mt">Màu xanh = ô robot thấy "đáng giá" · mũi tên = nước đi nó cho là tốt nhất.</p>
      </div>
      <div class="panel">
        <h4>🎮 Huấn luyện</h4>
        <div class="row">
          <button class="btn pulse-hint" id="rlTrain">▶ Học 100 lượt</button>
          <button class="btn ghost" id="rlReset">↺ Quên hết</button>
        </div>
        <button class="btn ghost mt" id="rlPlay" style="width:100%;">🤖 Xem robot tự đi</button>
        <div class="mt">
          <div class="muted">Số lượt đã học: <b id="rlEp">0</b></div>
          <div class="muted">Kết quả gần nhất: <b id="rlResult">—</b></div>
        </div>
        <p class="muted mt">Lúc đầu robot đi lung tung và sa bẫy liên tục. Học vài trăm lượt, nó sẽ đi thẳng tới đích.</p>
      </div>
    </div>

    <div class="takeaway">
      💡 <strong>Điều cốt lõi:</strong> Học tăng cường không cần ai dạy "đáp án đúng". AI chỉ nhận
      <em>phần thưởng</em> khi làm tốt và tự điều chỉnh để nhận thưởng nhiều hơn. Đây là cách AI học chơi
      cờ vây, chơi game, hay điều khiển robot — những việc mà "đáp án đúng" không hề có sẵn.
    </div>
  `;

  const canvas = root.querySelector("#rlCanvas");
  const ctx = canvas.getContext("2d");
  const cw = canvas.width / COLS, ch = canvas.height / ROWS;

  // Q[r][c][a]
  let Q, episodes, agent, playing = false;

  function resetQ() {
    Q = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => [0, 0, 0, 0])
    );
    episodes = 0;
    agent = [...START];
    root.querySelector("#rlEp").textContent = 0;
    root.querySelector("#rlResult").textContent = "—";
    draw();
  }

  function stepEnv(r, c, a) {
    let nr = r + ACTIONS[a][0], nc = c + ACTIONS[a][1];
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) { nr = r; nc = c; } // đụng tường
    if (isGoal(nr, nc)) return [nr, nc, 1, true];
    if (isTrap(nr, nc)) return [nr, nc, -1, true];
    return [nr, nc, -0.03, false]; // phạt nhẹ mỗi bước để khuyến khích đi nhanh
  }

  function bestAction(r, c) {
    const q = Q[r][c];
    let best = 0;
    for (let a = 1; a < 4; a++) if (q[a] > q[best]) best = a;
    return best;
  }

  function runEpisode(eps, lr = 0.5, gamma = 0.95) {
    let [r, c] = START;
    let steps = 0, reachedGoal = false;
    while (steps < 80) {
      const a = Math.random() < eps ? (Math.random() * 4) | 0 : bestAction(r, c);
      const [nr, nc, reward, done] = stepEnv(r, c, a);
      const future = done ? 0 : Math.max(...Q[nr][nc]);
      Q[r][c][a] += lr * (reward + gamma * future - Q[r][c][a]);
      r = nr; c = nc; steps++;
      if (done) { reachedGoal = isGoal(r, c); break; }
    }
    return { steps, reachedGoal };
  }

  function draw(agentPos) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // giá trị lớn nhất để chuẩn hóa màu
    let maxV = 0.001;
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        maxV = Math.max(maxV, Math.max(...Q[r][c]));

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = c * cw, y = r * ch;
        let fill = "rgba(255,255,255,0.03)";
        if (isGoal(r, c)) fill = "rgba(52,211,153,0.35)";
        else if (isTrap(r, c)) fill = "rgba(251,113,133,0.32)";
        else {
          const v = Math.max(0, Math.max(...Q[r][c])) / maxV;
          fill = `rgba(52,211,153,${(v * 0.5).toFixed(2)})`;
        }
        ctx.fillStyle = fill;
        ctx.fillRect(x + 2, y + 2, cw - 4, ch - 4);
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.strokeRect(x + 2, y + 2, cw - 4, ch - 4);

        // biểu tượng
        ctx.font = "24px serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if (isGoal(r, c)) ctx.fillText("🎯", x + cw / 2, y + ch / 2);
        else if (isTrap(r, c)) ctx.fillText("💥", x + cw / 2, y + ch / 2);
        else if (episodes > 0 && Math.max(...Q[r][c]) > 0) {
          ctx.fillStyle = "rgba(244,242,251,0.55)";
          ctx.font = "18px sans-serif";
          ctx.fillText(ARROWS[bestAction(r, c)], x + cw / 2, y + ch / 2);
        }
      }
    }
    // robot
    const [ar, ac] = agentPos || START;
    ctx.font = "26px serif";
    ctx.fillText("🤖", ac * cw + cw / 2, ar * ch + ch / 2);
  }

  root.querySelector("#rlReset").onclick = resetQ;

  root.querySelector("#rlTrain").onclick = (e) => {
    e.target.classList.remove("pulse-hint");
    let wins = 0;
    for (let i = 0; i < 100; i++) {
      const eps = Math.max(0.05, 0.5 - episodes / 800); // giảm ngẫu nhiên dần
      const res = runEpisode(eps);
      episodes++;
      if (res.reachedGoal) wins++;
    }
    root.querySelector("#rlEp").textContent = episodes;
    root.querySelector("#rlResult").textContent = `tới đích ${wins}/100 lượt`;
    sfx.pop();
    draw();
  };

  root.querySelector("#rlPlay").onclick = () => {
    if (playing || episodes === 0) return;
    playing = true;
    let [r, c] = START, steps = 0;
    const timer = setInterval(() => {
      draw([r, c]);
      if (isGoal(r, c)) { clearInterval(timer); playing = false; sfx.success(); celebrate(); return; }
      if (isTrap(r, c) || steps > 40) { clearInterval(timer); playing = false; sfx.wrong(); return; }
      const a = bestAction(r, c);
      r += ACTIONS[a][0]; c += ACTIONS[a][1];
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) { r -= ACTIONS[a][0]; c -= ACTIONS[a][1]; }
      steps++;
      sfx.tick();
    }, 260);
    window.addEventListener("hashchange", () => clearInterval(timer), { once: true });
  };

  resetQ();
}
