// Trang chủ — song ngữ
import { getVisited, getBestScore } from "../store.js";
import { getLang, tx } from "../i18n.js";

const S = {
  eyebrow: { vi: "✦ Hành trình tương tác · %n phòng", en: "✦ Interactive journey · %n rooms" },
  h1a: { vi: "Hiểu ", en: "Get " },
  h1b: { vi: " trong 15 phút", en: " in 15 minutes" },
  intro: {
    vi: "Không công thức toán, không thuật ngữ rối rắm. Chỉ là một hành trình tương tác: bạn tự tay dạy AI, nhìn vào bên trong nó, và khám phá cả những giới hạn của nó.",
    en: "No math formulas, no jargon. Just an interactive journey: you teach an AI by hand, look inside it, and discover its limits.",
  },
  start: { vi: "Bắt đầu hành trình →", en: "Start the journey →" },
  cont: { vi: "Tiếp tục hành trình →", en: "Continue the journey →" },
  restart: { vi: "Đi lại từ đầu", en: "Restart" },
  progress: { vi: "Đã khám phá %d/%t phòng", en: "Explored %d/%t rooms" },
  best: { vi: " · Điểm quiz cao nhất: <b>%s</b> 🏅", en: " · Best quiz score: <b>%s</b> 🏅" },
};

export function renderHome(app, rooms, navigate) {
  const visited = getVisited();
  const best = getBestScore();
  const journeyRooms = rooms.filter((r) => r.id !== "summary");
  const doneCount = journeyRooms.filter((r) => visited.has(r.id)).length;
  const started = visited.size > 0;
  const firstUnvisited = rooms.find((r) => !visited.has(r.id)) || rooms[0];

  const hero = document.createElement("div");
  hero.className = "hero";
  const progressText = tx(S.progress).replace("%d", doneCount).replace("%t", journeyRooms.length)
    + (best >= 0 ? tx(S.best).replace("%s", best) : "");
  hero.innerHTML = `
    <span class="eyebrow">${tx(S.eyebrow).replace("%n", journeyRooms.length)}</span>
    <h1>${tx(S.h1a)}<span class="grad">AI</span>${tx(S.h1b)}</h1>
    <p>${tx(S.intro)}</p>
    <div class="hero-cta">
      <button class="btn" id="startBtn">${started ? tx(S.cont) : tx(S.start)}</button>
      ${started ? `<button class="btn ghost" id="restartBtn">${tx(S.restart)}</button>` : ""}
    </div>
    ${started ? `
      <div class="home-progress">
        <div class="hp-bar"><div class="hp-fill" style="width:${(doneCount / journeyRooms.length) * 100}%"></div></div>
        <span class="muted">${progressText}</span>
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
      <h3>${tx(room.title)}</h3>
      <p>${tx(room.blurb)}</p>
      <div class="rc-q">${tx(room.question)}</div>
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
