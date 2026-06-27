// Trang chủ — giới thiệu hành trình, tiến trình đã đi, và danh sách các phòng
import { getVisited, getBestScore } from "../store.js";

export function renderHome(app, rooms, navigate) {
  const visited = getVisited();
  const best = getBestScore();
  const journeyRooms = rooms.filter((r) => r.id !== "summary");
  const doneCount = journeyRooms.filter((r) => visited.has(r.id)).length;
  const started = visited.size > 0;
  const firstUnvisited = rooms.find((r) => !visited.has(r.id)) || rooms[0];

  const hero = document.createElement("div");
  hero.className = "hero";
  hero.innerHTML = `
    <span class="eyebrow">✦ Hành trình tương tác · ${journeyRooms.length} phòng</span>
    <h1>Hiểu <span class="grad">AI</span><br/>trong 15 phút</h1>
    <p>
      Không công thức toán, không thuật ngữ rối rắm. Chỉ là một hành trình tương tác:
      bạn tự tay dạy AI, nhìn vào bên trong nó, và khám phá cả những giới hạn của nó.
    </p>
    <div class="hero-cta">
      <button class="btn" id="startBtn">${started ? "Tiếp tục hành trình →" : "Bắt đầu hành trình →"}</button>
      ${started ? `<button class="btn ghost" id="restartBtn">Đi lại từ đầu</button>` : ""}
    </div>
    ${started ? `
      <div class="home-progress">
        <div class="hp-bar"><div class="hp-fill" style="width:${(doneCount / journeyRooms.length) * 100}%"></div></div>
        <span class="muted">Đã khám phá ${doneCount}/${journeyRooms.length} phòng${best >= 0 ? ` · Điểm quiz cao nhất: <b>${best}</b> 🏅` : ""}</span>
      </div>` : ""}
  `;
  app.appendChild(hero);

  const grid = document.createElement("div");
  grid.className = "room-grid";
  rooms.forEach((room) => {
    const isDone = visited.has(room.id);
    const card = document.createElement("div");
    card.className = "room-card";
    card.innerHTML = `
      <div class="rc-num">${room.num}</div>
      ${isDone ? `<div class="rc-check">✓</div>` : ""}
      <div class="rc-icon">${room.icon}</div>
      <h3>${room.title}</h3>
      <p>${room.blurb}</p>
      <div class="rc-q">${room.question}</div>
    `;
    card.addEventListener("click", () => navigate(room.id));
    grid.appendChild(card);
  });
  app.appendChild(grid);

  document.getElementById("startBtn").addEventListener("click", () =>
    navigate(started ? firstUnvisited.id : rooms[0].id)
  );
  const restart = document.getElementById("restartBtn");
  if (restart) restart.addEventListener("click", () => navigate(rooms[0].id));
}
