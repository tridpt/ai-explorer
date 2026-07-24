// Phòng — AI Agents: AI tự lên kế hoạch và gọi công cụ nhiều bước. Song ngữ.
import { sfx } from "../sound.js";
import { tx } from "../i18n.js";
import { getParam, setParams } from "../roomstate.js";

// Mỗi nhiệm vụ = một chuỗi bước: AI suy nghĩ → chọn công cụ → nhận kết quả.
const TASKS = [
  {
    id: "weather",
    goal: { vi: "Tôi nên mang áo mưa đi Đà Nẵng ngày mai không?", en: "Should I pack a raincoat for Da Nang tomorrow?" },
    steps: [
      { kind: "think", tool: "", text: { vi: "Cần biết thời tiết Đà Nẵng ngày mai. Mình sẽ tra dự báo.", en: "I need Da Nang's weather tomorrow. I'll look up the forecast." } },
      { kind: "tool", tool: "🌤️ weather()", text: { vi: "gọi weather(\"Đà Nẵng\", \"ngày mai\")", en: "call weather(\"Da Nang\", \"tomorrow\")" }, result: { vi: "→ Mưa rào, 80% khả năng có mưa", en: "→ Showers, 80% chance of rain" } },
      { kind: "think", tool: "", text: { vi: "80% là cao. Kết luận: nên mang.", en: "80% is high. Conclusion: pack it." } },
      { kind: "answer", tool: "", text: { vi: "Có, nên mang áo mưa — ngày mai Đà Nẵng 80% có mưa rào.", en: "Yes, pack a raincoat — Da Nang has an 80% chance of showers tomorrow." } },
    ],
  },
  {
    id: "math",
    goal: { vi: "Chia đều hóa đơn 1.240.000đ cho 7 người là bao nhiêu mỗi người?", en: "Split a 1,240,000đ bill evenly among 7 people — how much each?" },
    steps: [
      { kind: "think", tool: "", text: { vi: "Đây là phép chia. Đừng tự nhẩm dễ sai — dùng máy tính.", en: "This is division. Don't guess — use the calculator." } },
      { kind: "tool", tool: "🧮 calculator()", text: { vi: "gọi calculator(\"1240000 / 7\")", en: "call calculator(\"1240000 / 7\")" }, result: { vi: "→ 177142.857…", en: "→ 177142.857…" } },
      { kind: "think", tool: "", text: { vi: "Làm tròn cho gọn.", en: "Round it for convenience." } },
      { kind: "answer", tool: "", text: { vi: "Mỗi người khoảng 177.143đ.", en: "About 177,143đ each." } },
    ],
  },
  {
    id: "trip",
    goal: { vi: "Đặt lịch họp với team ở Tokyo lúc 9h sáng giờ họ, theo giờ tôi (Hà Nội)?", en: "Schedule a meeting at 9am Tokyo time — what's that in my time (Hanoi)?" },
    steps: [
      { kind: "think", tool: "", text: { vi: "Cần đổi múi giờ Tokyo → Hà Nội, rồi ghi vào lịch.", en: "Need to convert Tokyo → Hanoi time, then add to calendar." } },
      { kind: "tool", tool: "🕐 timezone()", text: { vi: "gọi timezone(\"09:00\", \"Tokyo\", \"Hanoi\")", en: "call timezone(\"09:00\", \"Tokyo\", \"Hanoi\")" }, result: { vi: "→ 07:00 giờ Hà Nội", en: "→ 07:00 Hanoi time" } },
      { kind: "tool", tool: "📅 calendar()", text: { vi: "gọi calendar.add(\"Họp team\", \"07:00\")", en: "call calendar.add(\"Team sync\", \"07:00\")" }, result: { vi: "→ Đã tạo sự kiện lúc 07:00", en: "→ Event created at 07:00" } },
      { kind: "answer", tool: "", text: { vi: "Xong! 9h Tokyo = 7h sáng Hà Nội, mình đã thêm vào lịch của bạn.", en: "Done! 9am Tokyo = 7am Hanoi, and I've added it to your calendar." } },
    ],
  },
];

const KIND_META = {
  think: { icon: "💭", label: { vi: "Suy nghĩ", en: "Think" } },
  tool: { icon: "🔧", label: { vi: "Gọi công cụ", en: "Call tool" } },
  answer: { icon: "✅", label: { vi: "Trả lời", en: "Answer" } },
};

export function roomAgents(root) {
  const idx = parseInt(getParam("task", ""), 10);
  const startTask = Number.isInteger(idx) && TASKS[idx] ? idx : 0;

  root.innerHTML = `
    <p class="room-intro">
      ${tx(
        "Một <strong>AI agent</strong> ghép model với một vòng lặp điều phối và các công cụ được cấp quyền. Nó có thể lập kế hoạch, gọi tool rồi đọc kết quả, nhưng cũng có thể chọn sai tool hoặc hành động dựa trên dữ liệu lỗi. Bấm chạy để xem một <strong>trace viết sẵn</strong>; phòng này không gọi thời tiết, máy tính hay lịch thật.",
        "An <strong>AI agent</strong> combines a model with an orchestration loop and permitted tools. It may plan, call a tool, and inspect results, but can also choose the wrong tool or act on faulty data. Run the <strong>scripted trace</strong> below; this room calls no real weather, calculator, or calendar service."
      )}
    </p>

    <div class="panel">
      <h4>${tx("🎯 Chọn một nhiệm vụ", "🎯 Pick a task")}</h4>
      <div id="agTasks"></div>
      <div class="row mt" style="align-items:center">
        <button class="btn" id="agRun">${tx("▶ Chạy agent", "▶ Run agent")}</button>
        <button class="btn ghost" id="agReset">${tx("↺ Xóa", "↺ Clear")}</button>
      </div>
    </div>

    <div class="panel">
      <h4>${tx("🧠 Vòng lặp của agent", "🧠 The agent loop")}</h4>
      <div id="agGoal" class="muted mb"></div>
      <div id="agTrace" class="ag-trace"></div>
    </div>

    <div class="takeaway">
      ${tx(
        "💡 <strong>Điều cốt lõi:</strong> Agent ghép model, vòng lặp điều phối và quyền dùng công cụ. Khả năng hành động có thể giúp giải việc nhiều bước, nhưng tool có thể lỗi, dữ liệu có thể cũ và model có thể chọn sai hành động. Demo này chỉ phát một trace viết sẵn; hệ thật cần quyền hạn hẹp, kiểm tra kết quả và giám sát.",
        "💡 <strong>Key idea:</strong> Agents combine a model, an orchestration loop, and tool permissions. Action can help with multi-step tasks, but tools can fail, data can be stale, and models can choose the wrong action. This demo only plays a scripted trace; real systems need narrow permissions, result checks, and oversight."
      )}
    </div>
  `;

  let current = startTask;

  const tasksDiv = root.querySelector("#agTasks");
  TASKS.forEach((t, i) => {
    const tag = document.createElement("button");
    tag.type = "button";
    tag.className = "tag";
    tag.textContent = tx(t.goal).length > 46 ? tx(t.goal).slice(0, 46) + "…" : tx(t.goal);
    tag.setAttribute("aria-label", tx(t.goal));
    tag.setAttribute("aria-pressed", i === startTask ? "true" : "false");
    tag.onclick = () => {
      current = i;
      setParams({ task: i });
      tasksDiv.querySelectorAll(".tag").forEach((x, xi) => {
        x.style.borderColor = "";
        x.setAttribute("aria-pressed", xi === i ? "true" : "false");
      });
      tag.style.borderColor = "var(--accent)";
      clearTrace();
      sfx.pop();
    };
    if (i === startTask) tag.style.borderColor = "var(--accent)";
    tasksDiv.appendChild(tag);
  });

  const goalEl = root.querySelector("#agGoal");
  const trace = root.querySelector("#agTrace");
  let timers = [];

  function clearTrace() {
    timers.forEach(clearTimeout);
    timers = [];
    trace.innerHTML = "";
    goalEl.textContent = "";
  }

  function run() {
    clearTrace();
    const task = TASKS[current];
    goalEl.innerHTML = `🎯 <b>${tx("Mục tiêu", "Goal")}:</b> ${tx(task.goal)}`;
    task.steps.forEach((step, i) => {
      const tm = setTimeout(() => {
        const m = KIND_META[step.kind];
        const row = document.createElement("div");
        row.className = "ag-step ag-" + step.kind;
        row.innerHTML = `
          <div class="ag-tag">${m.icon} ${tx(m.label)}</div>
          <div class="ag-body">
            ${step.tool ? `<code class="ag-tool">${step.tool}</code>` : ""}
            <div>${tx(step.text)}</div>
            ${step.result ? `<div class="ag-result">${tx(step.result)}</div>` : ""}
          </div>`;
        trace.appendChild(row);
        row.scrollIntoView({ block: "nearest" });
        step.kind === "answer" ? sfx.success() : sfx.tick();
      }, i * 850);
      timers.push(tm);
    });
  }

  root.querySelector("#agRun").onclick = run;
  root.querySelector("#agReset").onclick = clearTrace;

  window.addEventListener("roomleave", () => timers.forEach(clearTimeout), { once: true });
}
