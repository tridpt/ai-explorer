// Phòng — Attention: AI "nhìn" vào từ nào khi đọc một từ. Song ngữ.
import { tx, getLang } from "../i18n.js";
import { getParam, setParams } from "../roomstate.js";

// Mỗi câu có bản vi & en riêng (vị trí đại từ khác nhau giữa hai ngôn ngữ).
const SENTENCES = [
  {
    vi: {
      words: ["con", "mèo", "đuổi", "con", "chuột", "vì", "nó", "đói"],
      focus: { 6: { 1: 0.7, 4: 0.15, 6: 0.15 }, 2: { 1: 0.6, 4: 0.25, 2: 0.15 } },
      note: '"nó" trỏ về <b>mèo</b> (kẻ đói nên mới đuổi), không phải chuột.',
    },
    en: {
      words: ["the", "cat", "chased", "the", "mouse", "because", "it", "was", "hungry"],
      focus: { 6: { 1: 0.7, 4: 0.15, 6: 0.15 }, 2: { 1: 0.6, 4: 0.25, 2: 0.15 } },
      note: '"it" refers to the <b>cat</b> (the hungry one that chased), not the mouse.',
    },
  },
  {
    vi: {
      words: ["bông", "hoa", "héo", "vì", "nó", "thiếu", "nước"],
      focus: { 4: { 1: 0.75, 4: 0.15, 6: 0.1 }, 2: { 1: 0.65, 2: 0.2, 6: 0.15 } },
      note: '"nó" trỏ về <b>hoa</b> — thứ bị héo vì thiếu nước.',
    },
    en: {
      words: ["the", "flower", "wilted", "because", "it", "lacked", "water"],
      focus: { 4: { 1: 0.75, 4: 0.15, 6: 0.1 }, 2: { 1: 0.65, 2: 0.2, 6: 0.15 } },
      note: '"it" refers to the <b>flower</b> — the thing that wilted from lack of water.',
    },
  },
  {
    vi: {
      words: ["nam", "đưa", "sách", "cho", "lan", "vì", "cô", "ấy", "cần"],
      focus: { 6: { 4: 0.7, 0: 0.12, 6: 0.18 }, 7: { 4: 0.65, 6: 0.2, 7: 0.15 } },
      note: '"cô ấy" trỏ về <b>lan</b> — người cần sách.',
    },
    en: {
      words: ["nam", "gave", "the", "book", "to", "lan", "because", "she", "needed", "it"],
      focus: { 7: { 5: 0.7, 0: 0.12, 7: 0.18 } },
      note: '"she" refers to <b>lan</b> — the one who needed the book.',
    },
  },
];

function buildAttention(s) {
  const n = s.words.length;
  const M = [];
  for (let i = 0; i < n; i++) {
    let row = new Array(n).fill(0);
    if (s.focus[i]) {
      for (const [j, w] of Object.entries(s.focus[i])) row[+j] = w;
    } else {
      row[i] = 0.6;
      if (i > 0) row[i - 1] = 0.4;
    }
    M.push(row);
  }
  return M;
}

function mix(weight) {
  const a = 0.08 + weight * 0.85;
  return `rgba(110,168,254,${a.toFixed(2)})`;
}

export function roomAttention(root) {
  root.innerHTML = `
    <p class="room-intro">
      ${tx(
        "Khi đọc câu \"con mèo đuổi con chuột vì <b>nó</b> đói\", bạn hiểu ngay \"nó\" là con mèo. Nhưng làm sao AI biết? Nó dùng cơ chế <strong>attention</strong>: với mỗi từ, AI tự hỏi \"để hiểu từ này, tôi nên <em>chú ý</em> vào những từ nào khác?\". Hãy bấm vào một từ để xem.",
        "Reading \"the cat chased the mouse because <b>it</b> was hungry\", you instantly know \"it\" is the cat. But how does AI know? It uses <strong>attention</strong>: for each word, the AI asks \"to understand this word, which other words should I <em>attend to</em>?\". Click a word to see."
      )}
    </p>

    <div class="panel">
      <h4>${tx("👁️ Chọn câu", "👁️ Pick a sentence")}</h4>
      <div id="sentPicker"></div>

      <h4 class="mt">${tx("Bấm vào một từ — các từ mà AI chú ý sẽ sáng lên", "Click a word — the words the AI attends to light up")}</h4>
      <div id="sentDisplay" style="font-size:24px; line-height:2.2; margin:10px 0;"></div>
      <div id="attnNote" class="muted"></div>
    </div>

    <div class="takeaway">
      ${tx(
        "💡 <strong>Điều cốt lõi:</strong> AI không đọc tuần tự từng chữ một cách máy móc. Với mỗi từ, nó <em>cân nhắc trọng số</em> tất cả các từ khác trong câu để nắm ngữ cảnh. Nhờ vậy nó biết \"nó\", \"cô ấy\" đang trỏ về ai — đây chính là trái tim của các mô hình ngôn ngữ hiện đại (Transformer).",
        "💡 <strong>Key idea:</strong> AI doesn't read word by word mechanically. For each word it <em>weighs</em> all the other words in the sentence to grasp context. That's how it knows what \"it\" or \"she\" refers to — the very heart of modern language models (Transformers)."
      )}
    </div>
  `;

  // Deep-link: ?s=<câu>&w=<từ> để chia sẻ đúng câu và từ đang xét.
  const sIdx = parseInt(getParam("s", ""), 10);
  let current = Number.isInteger(sIdx) && SENTENCES[sIdx] ? sIdx : 0;
  const wIdx = parseInt(getParam("w", ""), 10);
  let selected = Number.isInteger(wIdx) ? wIdx : null;

  const picker = root.querySelector("#sentPicker");
  SENTENCES.forEach((pair, i) => {
    const s = pair[getLang()] || pair.vi;
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = s.words.join(" ");
    if (i === current) tag.style.borderColor = "var(--accent)";
    tag.onclick = () => {
      current = i; selected = null;
      setParams({ s: i });
      picker.querySelectorAll(".tag").forEach((t) => (t.style.borderColor = ""));
      tag.style.borderColor = "var(--accent)";
      render();
    };
    picker.appendChild(tag);
  });

  const display = root.querySelector("#sentDisplay");
  const noteEl = root.querySelector("#attnNote");

  function render() {
    const s = SENTENCES[current][getLang()] || SENTENCES[current].vi;
    if (selected !== null && selected >= s.words.length) selected = null;
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
      span.onclick = () => { selected = j; setParams({ s: current, w: j }); render(); };
      display.appendChild(span);
    });
    const pronoun = tx("nó / cô", "it / she");
    noteEl.innerHTML = selected === null
      ? tx(`👆 Bấm vào một từ bất kỳ (thử bấm vào <b>${pronoun}</b>).`, `👆 Click any word (try clicking <b>${pronoun}</b>).`)
      : tx(`Khi xử lý từ "<b>${s.words[selected]}</b>", AI chú ý nhiều nhất vào từ sáng nhất. ${s.note}`,
           `When processing "<b>${s.words[selected]}</b>", the AI attends most to the brightest word. ${s.note}`);
  }

  render();
}
