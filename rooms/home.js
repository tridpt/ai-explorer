// Trang chủ — song ngữ
import { getVisited, getBestScore, getTrack, setTrack, getMicroTotal } from "../store.js";
import { getLang, tx } from "../i18n.js";
import { TRACKS, trackRoomIds } from "../tracks.js";

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
  micro: { vi: " · Câu đúng dọc đường: <b>%m</b> ✅", en: " · Checks passed: <b>%m</b> ✅" },
  trackTitle: { vi: "Chọn lộ trình phù hợp với bạn", en: "Pick the path that fits you" },
  trackSub: { vi: "Không chắc bắt đầu từ đâu? Chọn một lộ trình — bạn vẫn mở được mọi phòng bất cứ lúc nào.", en: "Not sure where to start? Pick a path — you can still open any room anytime." },
  inTrack: { vi: "Trong lộ trình", en: "In your path" },
  done: { vi: "đã hoàn thành", en: "completed" },
};

export function renderHome(app, rooms, navigate) {
  const visited = getVisited();
  const best = getBestScore();
  const micro = getMicroTotal();
  let track = getTrack();
  const journeyRooms = rooms.filter((r) => r.id !== "summary");
  const doneCount = journeyRooms.filter((r) => visited.has(r.id)).length;
  const started = visited.size > 0;

  // Danh sách id phòng của lộ trình đang chọn (để lọc/đánh dấu).
  const pathIds = () => new Set(trackRoomIds(track, rooms));

  const hero = document.createElement("div");
  hero.className = "hero";
  const progressText = tx(S.progress).replace("%d", doneCount).replace("%t", journeyRooms.length)
    + (best >= 0 ? tx(S.best).replace("%s", best) : "")
    + (micro > 0 ? tx(S.micro).replace("%m", micro) : "");
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

  // ---------- Bộ chọn lộ trình ----------
  const trackWrap = document.createElement("div");
  trackWrap.className = "track-picker";
  trackWrap.innerHTML = `
    <h3 class="track-title">${tx(S.trackTitle)}</h3>
    <p class="muted track-sub">${tx(S.trackSub)}</p>
    <div class="track-cards"></div>`;
  const trackCards = trackWrap.querySelector(".track-cards");
  Object.entries(TRACKS).forEach(([key, t]) => {
    const c = document.createElement("button");
    c.className = "track-card" + (track === key ? " active" : "");
    c.dataset.track = key;
    c.innerHTML = `
      <div class="tc-icon">${t.icon}</div>
      <div class="tc-label">${tx(t.label)}</div>
      <div class="tc-desc">${tx(t.desc)}</div>`;
    c.addEventListener("click", () => {
      track = key;
      setTrack(key);
      trackCards.querySelectorAll(".track-card").forEach((el) =>
        el.classList.toggle("active", el.dataset.track === key));
      paintGrid();
    });
    trackCards.appendChild(c);
  });
  app.appendChild(trackWrap);

  const grid = document.createElement("div");
  grid.className = "room-grid";
  app.appendChild(grid);

  function paintGrid() {
    const inPath = pathIds();
    const showFull = !track || track === "full";
    grid.innerHTML = "";
    rooms.forEach((room) => {
      const isDone = visited.has(room.id);
      const onPath = inPath.has(room.id);
      const card = document.createElement("div");
      card.className = "room-card"
        + (isDone ? "" : "")
        + (!showFull && !onPath ? " dimmed" : "")
        + (!showFull && onPath ? " on-path" : "");
      card.setAttribute("role", "link");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-label", `${tx(room.title)}. ${tx(room.question)}${isDone ? " — " + tx(S.done) : ""}`);
      card.innerHTML = `
        <div class="rc-num" aria-hidden="true">${room.num}</div>
        ${isDone ? `<div class="rc-check" aria-hidden="true">✓</div>` : ""}
        ${!showFull && onPath ? `<div class="rc-path">${tx(S.inTrack)}</div>` : ""}
        <div class="rc-icon" aria-hidden="true">${room.icon}</div>
        <h3>${tx(room.title)}</h3>
        <p>${tx(room.blurb)}</p>
        <div class="rc-q">${tx(room.question)}</div>
      `;
      const go = () => navigate(room.id);
      card.addEventListener("click", go);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
      });
      grid.appendChild(card);
    });
  }
  paintGrid();

  // Nút bắt đầu: đi theo phòng đầu tiên chưa ghé TRONG lộ trình đang chọn.
  function firstRoomOfPath() {
    const ids = trackRoomIds(track, rooms);
    const firstUnvisited = ids.find((id) => !visited.has(id));
    return firstUnvisited || ids[0];
  }

  document.getElementById("startBtn").addEventListener("click", () =>
    navigate(firstRoomOfPath())
  );
  const restart = document.getElementById("restartBtn");
  if (restart) restart.addEventListener("click", () => navigate(trackRoomIds(track, rooms)[0]));
}
