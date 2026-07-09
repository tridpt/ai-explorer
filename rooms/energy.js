// Phòng — Vì sao AI tốn điện: chi phí năng lượng của tính toán AI. Song ngữ.
// Người dùng "chạy" các tác vụ, năng lượng cộng dồn và quy đổi ra thứ đời thường;
// thanh trượt quy mô cho thấy chi phí nhỏ mỗi lượt bùng lên khi nhân triệu người.
import { sfx } from "../sound.js";
import { tx } from "../i18n.js";
import { getParam, setParams } from "../roomstate.js";

// Chi phí ước lượng (Wh) mỗi lượt — con số MINH HỌA theo bậc độ lớn, không phải đo chính xác.
// (Suy luận văn bản rẻ; ảnh tốn hơn nhiều; huấn luyện là chi phí một lần khổng lồ.)
const ACTIONS = [
  { id: "search", icon: "🔍", wh: 0.3,
    label: { vi: "Một lượt tìm kiếm web", en: "One web search" } },
  { id: "chat", icon: "💬", wh: 3,
    label: { vi: "Một câu trả lời chatbot", en: "One chatbot reply" } },
  { id: "longchat", icon: "📝", wh: 10,
    label: { vi: "Một bài dài chatbot viết", en: "One long chatbot essay" } },
  { id: "image", icon: "🎨", wh: 30,
    label: { vi: "Tạo một tấm ảnh AI", en: "Generate one AI image" } },
];

// Chi phí huấn luyện một mô hình lớn: một lần, nhưng cực lớn (đơn vị Wh).
const TRAIN_WH = 1_000_000_000; // ~1 GWh — minh họa cho "một lần nhưng khổng lồ"

const UI = {
  intro: {
    vi: "AI không chạy bằng phép màu — mỗi câu trả lời là hàng loạt phép tính trong trung tâm dữ liệu, và phép tính thì <strong>ngốn điện</strong>. Một lượt hỏi lẻ rất nhỏ, nhưng nhân với <em>hàng triệu người mỗi ngày</em> thì thành con số lớn. Hãy tự tay 'chạy' vài tác vụ và xem điện tiêu tốn quy ra thứ quen thuộc.",
    en: "AI doesn't run on magic — each answer is a flood of calculations in a data center, and calculations <strong>burn electricity</strong>. A single query is tiny, but multiplied by <em>millions of people a day</em> it adds up fast. Run a few tasks yourself and see the energy in everyday terms.",
  },
  runTitle: { vi: "⚡ Chạy thử vài tác vụ AI", en: "⚡ Run some AI tasks" },
  runSub: { vi: "Bấm để 'chạy' — năng lượng sẽ cộng dồn bên phải.", en: "Click to 'run' — energy adds up on the right." },
  meterTitle: { vi: "🔌 Điện đã tiêu tốn", en: "🔌 Energy consumed" },
  scaleLabel: { vi: "Nhân với số người dùng cùng làm việc đó:", en: "Multiply by people doing the same:" },
  reset: { vi: "↺ Đặt lại", en: "↺ Reset" },
  train: { vi: "🏭 Huấn luyện MỘT mô hình lớn (một lần)", en: "🏭 Train ONE large model (one-off)" },
  trainNote: {
    vi: "Đó là chi phí <em>một lần</em> để tạo ra mô hình — tương đương hàng trăm nghìn lượt hỏi. Nhưng sau khi huấn luyện xong, nó phục vụ hàng tỉ lượt, nên chia đều ra mỗi lượt lại nhỏ.",
    en: "That's a <em>one-time</em> cost to create the model — like hundreds of thousands of queries. But once trained it serves billions of uses, so spread per-query it's small again.",
  },
  empty: { vi: "Chưa chạy gì cả — bấm một tác vụ bên trái.", en: "Nothing run yet — click a task on the left." },
};

// Quy đổi Wh sang thứ đời thường. Trả về mảng chuỗi đã dịch.
function equivalents(wh) {
  const out = [];
  const phone = wh / 12;            // ~12 Wh mỗi lần sạc đầy điện thoại
  const kettle = wh / 100;          // ~100 Wh đun sôi 1 ấm nước nhỏ
  const led = wh / 10;              // bóng LED 10W chạy 1 giờ
  const fridgeDays = wh / 1000;     // ~1 kWh ≈ 1 ngày tủ lạnh tiết kiệm
  if (phone >= 0.1) out.push(tx(`📱 ~${fmt(phone)} lần sạc điện thoại`, `📱 ~${fmt(phone)} phone charges`));
  if (kettle >= 0.1) out.push(tx(`☕ ~${fmt(kettle)} ấm nước đun sôi`, `☕ ~${fmt(kettle)} kettles boiled`));
  if (led >= 0.5) out.push(tx(`💡 bóng LED 10W chạy ~${fmt(led)} giờ`, `💡 a 10W LED bulb for ~${fmt(led)} hours`));
  if (fridgeDays >= 0.5) out.push(tx(`🧊 ~${fmt(fridgeDays)} ngày chạy tủ lạnh`, `🧊 ~${fmt(fridgeDays)} days of a fridge`));
  return out;
}

// Định dạng số gọn: 1.2, 340, 12k, 3.4M…
function fmt(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "k";
  if (n >= 100) return Math.round(n).toString();
  if (n >= 10) return n.toFixed(0);
  return n.toFixed(1);
}

// Hiển thị Wh gọn (Wh / kWh / MWh / GWh).
function fmtWh(wh) {
  if (wh >= 1e6) return fmt(wh / 1e6) + " MWh";
  if (wh >= 1e3) return fmt(wh / 1e3) + " kWh";
  return fmt(wh) + " Wh";
}

const SCALES = [
  { mult: 1, label: { vi: "một mình bạn", en: "just you" } },
  { mult: 1000, label: { vi: "1 nghìn người", en: "1 thousand people" } },
  { mult: 1_000_000, label: { vi: "1 triệu người", en: "1 million people" } },
  { mult: 100_000_000, label: { vi: "100 triệu người", en: "100 million people" } },
];

export function roomEnergy(root) {
  const startScale = parseInt(getParam("scale", ""), 10);
  let scaleIdx = Number.isInteger(startScale) && SCALES[startScale] ? startScale : 0;
  let baseWh = 0; // năng lượng "một mình bạn" tích lũy (chưa nhân quy mô)

  root.innerHTML = `
    <p class="room-intro">${tx(UI.intro)}</p>

    <div class="row">
      <div class="panel">
        <h4>${tx(UI.runTitle)}</h4>
        <p class="muted">${tx(UI.runSub)}</p>
        <div id="enActions" class="en-actions mt"></div>
        <div class="en-train-wrap">
          <button class="btn ghost en-action" id="enTrain">${tx(UI.train)}</button>
        </div>
      </div>

      <div class="panel">
        <h4>${tx(UI.meterTitle)}</h4>
        <div id="enTotal" class="en-total">0 Wh</div>
        <div class="mt">
          <span class="muted">${tx(UI.scaleLabel)}</span>
          <input type="range" id="enScale" min="0" max="${SCALES.length - 1}" step="1" value="${scaleIdx}" class="mt" style="width:100%" />
          <div id="enScaleLabel" class="muted"></div>
        </div>
        <div id="enEquiv" class="en-equiv mt">${tx(UI.empty)}</div>
        <div id="enTrainNote" class="muted mt"></div>
        <div class="mt"><button class="btn ghost" id="enReset">${tx(UI.reset)}</button></div>
      </div>
    </div>

    <div class="takeaway">
      ${tx(
        "💡 <strong>Điều cốt lõi:</strong> Mỗi lượt hỏi AI tốn điện <em>rất ít</em> — vấn đề nằm ở <strong>quy mô</strong>: nhân với hàng tỉ lượt mỗi ngày, cộng thêm chi phí huấn luyện khổng lồ, tổng năng lượng (và nước làm mát, khí thải) trở nên đáng kể. Tạo ảnh tốn hơn viết chữ nhiều lần. Đó là lý do hiệu quả tính toán và điện sạch là bài toán lớn của ngành AI — và là điều đáng cân nhắc khi ta chọn dùng AI cho việc gì.",
        "💡 <strong>Key idea:</strong> Each AI query uses <em>very little</em> energy — the issue is <strong>scale</strong>: multiplied by billions of uses a day, plus the huge one-off training cost, the total energy (and cooling water, emissions) becomes significant. Images cost many times more than text. That's why compute efficiency and clean power are big challenges for AI — and worth weighing when you choose what to use AI for."
      )}
    </div>
  `;

  const actionsEl = root.querySelector("#enActions");
  const totalEl = root.querySelector("#enTotal");
  const scaleEl = root.querySelector("#enScale");
  const scaleLabelEl = root.querySelector("#enScaleLabel");
  const equivEl = root.querySelector("#enEquiv");
  const trainNoteEl = root.querySelector("#enTrainNote");

  ACTIONS.forEach((a) => {
    const tag = document.createElement("button");
    tag.className = "btn ghost en-action";
    tag.innerHTML = `${a.icon} ${tx(a.label)} <span class="en-cost">${fmtWh(a.wh)}</span>`;
    tag.onclick = () => {
      baseWh += a.wh;
      update();
      sfx.tick();
    };
    actionsEl.appendChild(tag);
  });

  function update() {
    const mult = SCALES[scaleIdx].mult;
    const total = baseWh * mult;
    totalEl.textContent = fmtWh(total);
    scaleLabelEl.textContent = "× " + tx(SCALES[scaleIdx].label) + (mult > 1 ? ` (×${fmt(mult)})` : "");
    if (baseWh === 0) {
      equivEl.innerHTML = tx(UI.empty);
      return;
    }
    const eq = equivalents(total);
    equivEl.innerHTML = eq.length
      ? `<span class="muted">${tx("Tương đương:", "Roughly equals:")}</span><ul class="en-list">${eq.map((e) => `<li>${e}</li>`).join("")}</ul>`
      : tx("Quá nhỏ để quy đổi.", "Too small to convert.");
  }

  scaleEl.oninput = () => {
    scaleIdx = parseInt(scaleEl.value, 10);
    setParams({ scale: scaleIdx || null });
    update();
    sfx.click();
  };

  root.querySelector("#enTrain").onclick = () => {
    baseWh += TRAIN_WH;
    trainNoteEl.innerHTML = tx(UI.trainNote);
    update();
    sfx.wrong(); // âm trầm — nhấn "cú tốn kém"
  };

  root.querySelector("#enReset").onclick = () => {
    baseWh = 0;
    trainNoteEl.innerHTML = "";
    update();
    sfx.pop();
  };

  update();
}
