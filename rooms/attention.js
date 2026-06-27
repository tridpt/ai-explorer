// Phòng 04 — Attention: AI "nhìn" vào từ nào khi đọc một từ
// Dữ liệu attention được thiết kế sẵn để làm nổi bật việc liên kết ngữ nghĩa (vd: đại từ "nó").

const SENTENCES = [
  {
    words: ["con", "mèo", "đuổi", "con", "chuột", "vì", "nó", "đói"],
    // mỗi entry: từ ở vị trí key "nhìn" mạnh vào những vị trí nào
    focus: {
      6: { 1: 0.7, 4: 0.15, 6: 0.15 }, // "nó" -> "mèo"
      2: { 1: 0.6, 4: 0.25, 2: 0.15 }, // "đuổi" -> chủ thể & đối tượng
    },
    note: '"nó" trỏ về <b>mèo</b> (kẻ đói nên mới đuổi), không phải chuột.',
  },
  {
    words: ["bông", "hoa", "héo", "vì", "nó", "thiếu", "nước"],
    focus: {
      4: { 1: 0.75, 4: 0.15, 6: 0.1 }, // "nó" -> "hoa"
      2: { 1: 0.65, 2: 0.2, 6: 0.15 }, // "héo" -> "hoa","nước"
    },
    note: '"nó" trỏ về <b>hoa</b> — thứ bị héo vì thiếu nước.',
  },
  {
    words: ["nam", "đưa", "sách", "cho", "lan", "vì", "cô", "ấy", "cần"],
    focus: {
      6: { 4: 0.7, 0: 0.12, 6: 0.18 }, // "cô" -> "lan"
      7: { 4: 0.65, 6: 0.2, 7: 0.15 }, // "ấy" -> "lan"
    },
    note: '"cô ấy" trỏ về <b>lan</b> — người cần sách.',
  },
];

// Tạo ma trận attention đầy đủ từ mô tả "focus"
function buildAttention(s) {
  const n = s.words.length;
  const M = [];
  for (let i = 0; i < n; i++) {
    let row = new Array(n).fill(0);
    if (s.focus[i]) {
      for (const [j, w] of Object.entries(s.focus[i])) row[+j] = w;
    } else {
      // mặc định: nhìn vào chính mình + từ liền trước
      row[i] = 0.6;
      if (i > 0) row[i - 1] = 0.4;
    }
    M.push(row);
  }
  return M;
}

function mix(weight) {
  // weight 0..1 -> màu xanh đậm dần
  const a = 0.08 + weight * 0.85;
  return `rgba(110,168,254,${a.toFixed(2)})`;
}

export function roomAttention(root) {
  root.innerHTML = `
    <p class="room-intro">
      Khi đọc câu "con mèo đuổi con chuột vì <b>nó</b> đói", bạn hiểu ngay "nó" là con mèo.
      Nhưng làm sao AI biết? Nó dùng cơ chế <strong>attention</strong>: với mỗi từ, AI tự hỏi
      "để hiểu từ này, tôi nên <em>chú ý</em> vào những từ nào khác?". Hãy bấm vào một từ để xem.
    </p>

    <div class="panel">
      <h4>👁️ Chọn câu</h4>
      <div id="sentPicker"></div>

      <h4 class="mt">Bấm vào một từ — các từ mà AI chú ý sẽ sáng lên</h4>
      <div id="sentDisplay" style="font-size:24px; line-height:2.2; margin:10px 0;"></div>
      <div id="attnNote" class="muted"></div>
    </div>

    <div class="takeaway">
      💡 <strong>Điều cốt lõi:</strong> AI không đọc tuần tự từng chữ một cách máy móc. Với mỗi từ,
      nó <em>cân nhắc trọng số</em> tất cả các từ khác trong câu để nắm ngữ cảnh. Nhờ vậy nó biết
      "nó", "cô ấy" đang trỏ về ai — đây chính là trái tim của các mô hình ngôn ngữ hiện đại (Transformer).
    </div>
  `;

  let current = 0;
  let selected = null;

  const picker = root.querySelector("#sentPicker");
  SENTENCES.forEach((s, i) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = s.words.join(" ");
    tag.onclick = () => { current = i; selected = null; render(); };
    picker.appendChild(tag);
  });

  const display = root.querySelector("#sentDisplay");
  const noteEl = root.querySelector("#attnNote");

  function render() {
    const s = SENTENCES[current];
    const M = buildAttention(s);
    display.innerHTML = "";
    s.words.forEach((w, j) => {
      const span = document.createElement("span");
      span.className = "tok";
      span.textContent = w;
      span.style.cursor = "pointer";
      if (selected !== null) {
        const weight = M[selected][j] || 0;
        span.style.background = mix(weight);
        if (selected === j) span.style.outline = "2px solid #b07bff";
      } else {
        span.style.background = "rgba(255,255,255,0.05)";
      }
      span.onclick = () => { selected = j; render(); };
      display.appendChild(span);
    });
    noteEl.innerHTML = selected === null
      ? "👆 Bấm vào một từ bất kỳ (thử bấm vào <b>nó</b> / <b>cô</b>)."
      : `Khi xử lý từ "<b>${s.words[selected]}</b>", AI chú ý nhiều nhất vào từ sáng nhất. ${s.note}`;
  }

  render();
}
