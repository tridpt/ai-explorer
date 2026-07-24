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
        "Câu này minh họa một tình huống mà thông tin về đại từ phụ thuộc các từ khác. <strong>Attention</strong> là cơ chế trộn thông tin giữa token theo trọng số. Ma trận bên dưới được viết sẵn để cho thấy một attention head <em>có thể</em> phân bổ trọng số thế nào — không phải đầu ra của model thật.",
        "This sentence illustrates a pronoun whose interpretation depends on other words. <strong>Attention</strong> mixes token information using weights. The matrix below is hand-authored to show how one attention head <em>might</em> distribute weights—it is not output from a real model."
      )}
    </p>

    <div class="panel">
      <h4>${tx("👁️ Chọn câu", "👁️ Pick a sentence")}</h4>
      <div id="sentPicker"></div>

      <h4 class="mt">${tx("Bấm vào một từ — các từ mà AI chú ý sẽ sáng lên", "Click a word — the words the AI attends to light up")}</h4>
      <div id="sentDisplay" style="font-size:24px; line-height:2.2; margin:10px 0;"></div>
      <div id="attnNote" class="muted"></div>
    </div>

    <div class="panel">
      <h4>${tx("🔥 Bản đồ chú ý toàn câu", "🔥 Full-sentence attention map")}</h4>
      <p class="muted">${tx(
        "Mỗi hàng là một từ đang được xử lý; ô càng sáng nghĩa là từ đó càng \"chú ý\" nhiều tới từ ở cột đó. Rê chuột lên một ô để xem chi tiết.",
        "Each row is a word being processed; the brighter a cell, the more that word \"attends\" to the column word. Hover a cell for details."
      )}</p>
      <div id="attnMatrix" class="attn-matrix mt"></div>
    </div>

    <div class="takeaway">
      ${tx(
        "💡 <strong>Điều cốt lõi:</strong> Transformer dùng attention để <em>trộn thông tin</em> giữa các token theo trọng số qua nhiều head và layer. Trọng số có thể gợi ý token nào đang tương tác, nhưng không tự chứng minh model đã hiểu đúng đại từ hay giải thích nhân quả cho dự đoán.",
        "💡 <strong>Key idea:</strong> Transformers use attention to <em>mix information</em> among tokens through weights across many heads and layers. Those weights can suggest token interactions, but they do not by themselves prove correct understanding or causally explain a prediction."
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
    const tag = document.createElement("button");
    tag.type = "button";
    tag.className = "tag";
    tag.textContent = s.words.join(" ");
    tag.setAttribute("aria-pressed", i === current ? "true" : "false");
    if (i === current) tag.style.borderColor = "var(--accent)";
    tag.onclick = () => {
      current = i;
      selected = null;
      setParams({ s: i });
      picker.querySelectorAll(".tag").forEach((item, itemIndex) => {
        const active = itemIndex === i;
        item.style.borderColor = active ? "var(--accent)" : "";
        item.setAttribute("aria-pressed", active ? "true" : "false");
      });
      render();
    };
    picker.appendChild(tag);
  });

  const display = root.querySelector("#sentDisplay");
  const noteEl = root.querySelector("#attnNote");
  const matrixEl = root.querySelector("#attnMatrix");
  noteEl.setAttribute("role", "status");
  noteEl.setAttribute("aria-live", "polite");
  matrixEl.setAttribute("role", "region");
  matrixEl.setAttribute("aria-label", tx("Bản đồ trọng số attention", "Attention weight map"));

  // Mỗi ô là button có nhãn đầy đủ, dùng được bằng chuột, bàn phím và screen reader.
  function renderMatrix(s, M) {
    const n = s.words.length;
    let html = `<div class="attn-row attn-head"><div class="attn-corner"></div>`;
    s.words.forEach((word) => (html += `<div class="attn-col-label">${word}</div>`));
    html += `</div>`;
    for (let i = 0; i < n; i++) {
      const isSel = i === selected;
      html += `<div class="attn-row${isSel ? " sel" : ""}"><div class="attn-row-label">${s.words[i]}</div>`;
      for (let j = 0; j < n; j++) {
        const weight = M[i][j] || 0;
        const label = tx(
          `"${s.words[i]}" chú ý "${s.words[j]}": ${Math.round(weight * 100)}%`,
          `"${s.words[i]}" attends to "${s.words[j]}": ${Math.round(weight * 100)}%`
        );
        html += `<button type="button" class="attn-cell" style="background:${mix(weight)}" title="${label}" aria-label="${label}" data-i="${i}"></button>`;
      }
      html += `</div>`;
    }
    matrixEl.innerHTML = html;
    matrixEl.querySelectorAll(".attn-cell").forEach((cell) => {
      cell.onclick = () => {
        selected = parseInt(cell.dataset.i, 10);
        setParams({ s: current, w: selected });
        render();
      };
    });
  }

  function render() {
    const s = SENTENCES[current][getLang()] || SENTENCES[current].vi;
    if (selected !== null && selected >= s.words.length) selected = null;
    const M = buildAttention(s);
    renderMatrix(s, M);
    display.innerHTML = "";
    s.words.forEach((word, j) => {
      const token = document.createElement("button");
      token.type = "button";
      token.className = "tok";
      token.textContent = word;
      token.setAttribute("aria-pressed", selected === j ? "true" : "false");
      token.setAttribute("aria-label", tx(`Xem attention cho từ ${word}`, `Show attention for ${word}`));
      if (selected !== null) {
        const weight = M[selected][j] || 0;
        token.style.background = mix(weight);
        if (selected === j) token.style.outline = "2px solid #b07bff";
      } else {
        token.style.background = "rgba(255,255,255,0.05)";
      }
      token.onclick = () => {
        selected = j;
        setParams({ s: current, w: j });
        render();
      };
      display.appendChild(token);
    });
    const pronoun = tx("nó / cô", "it / she");
    noteEl.innerHTML = selected === null
      ? tx(`👆 Chọn một từ bất kỳ (thử từ <b>${pronoun}</b>).`, `👆 Choose any word (try <b>${pronoun}</b>).`)
      : tx(`Khi xử lý từ "<b>${s.words[selected]}</b>", AI chú ý nhiều nhất vào từ sáng nhất. ${s.note}`,
           `When processing "<b>${s.words[selected]}</b>", the AI attends most to the brightest word. ${s.note}`);
  }

  render();
}
