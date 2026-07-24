// Phòng — Multimodal: AI hiểu ảnh + chữ cùng lúc. Song ngữ.
import { sfx } from "../sound.js";
import { tx } from "../i18n.js";
import { getParam, setParams } from "../roomstate.js";

// Mỗi "ảnh" là một cảnh emoji, kèm nhãn AI "nhìn thấy" (song ngữ) và độ tự tin.
const SCENES = [
  {
    emoji: "🐕🌳",
    caption: { vi: "một chú chó đứng cạnh cái cây trong công viên", en: "a dog standing next to a tree in a park" },
    tags: [
      { label: { vi: "chó", en: "dog" }, p: 0.97 },
      { label: { vi: "cây", en: "tree" }, p: 0.88 },
      { label: { vi: "ngoài trời", en: "outdoors" }, p: 0.71 },
      { label: { vi: "mèo", en: "cat" }, p: 0.04 },
    ],
    qa: {
      vi: [["Có con vật nào không?", "Có — một chú chó."], ["Ở trong nhà hay ngoài trời?", "Ngoài trời, cạnh một cái cây."]],
      en: [["Is there an animal?", "Yes — a dog."], ["Indoors or outdoors?", "Outdoors, next to a tree."]],
    },
  },
  {
    emoji: "🍕🥤",
    caption: { vi: "một miếng pizza và một ly nước ngọt trên bàn", en: "a slice of pizza and a soft drink on a table" },
    tags: [
      { label: { vi: "đồ ăn", en: "food" }, p: 0.95 },
      { label: { vi: "pizza", en: "pizza" }, p: 0.92 },
      { label: { vi: "đồ uống", en: "drink" }, p: 0.85 },
      { label: { vi: "xe hơi", en: "car" }, p: 0.02 },
    ],
    qa: {
      vi: [["Đây là bữa ăn hay phong cảnh?", "Một bữa ăn — pizza kèm nước."], ["Món chính là gì?", "Pizza."]],
      en: [["A meal or a landscape?", "A meal — pizza with a drink."], ["What's the main dish?", "Pizza."]],
    },
  },
  {
    emoji: "🏔️🌅",
    caption: { vi: "cảnh bình minh trên dãy núi tuyết", en: "a sunrise over snowy mountains" },
    tags: [
      { label: { vi: "núi", en: "mountain" }, p: 0.94 },
      { label: { vi: "bầu trời", en: "sky" }, p: 0.9 },
      { label: { vi: "phong cảnh", en: "landscape" }, p: 0.82 },
      { label: { vi: "con người", en: "person" }, p: 0.03 },
    ],
    qa: {
      vi: [["Có người trong ảnh không?", "Gần như không — chủ yếu là phong cảnh."], ["Đây là lúc nào trong ngày?", "Bình minh."]],
      en: [["Are there people?", "Almost none — mostly landscape."], ["What time of day?", "Sunrise."]],
    },
  },
  {
    emoji: "👧📖",
    caption: { vi: "một cô bé đang đọc sách", en: "a young girl reading a book" },
    tags: [
      { label: { vi: "người", en: "person" }, p: 0.96 },
      { label: { vi: "sách", en: "book" }, p: 0.9 },
      { label: { vi: "đọc", en: "reading" }, p: 0.8 },
      { label: { vi: "bơi lội", en: "swimming" }, p: 0.02 },
    ],
    qa: {
      vi: [["Người trong ảnh đang làm gì?", "Đang đọc sách."], ["Có bao nhiêu người?", "Một người."]],
      en: [["What is the person doing?", "Reading a book."], ["How many people?", "One."]],
    },
  },
];

export function roomMultimodal(root) {
  const sharedIdx = parseInt(getParam("scene", ""), 10);
  const startIdx = Number.isInteger(sharedIdx) && SCENES[sharedIdx] ? sharedIdx : 0;

  root.innerHTML = `
    <p class="room-intro">
      ${tx(
        "Một số model đa phương thức học biểu diễn ảnh và chữ có thể so sánh trong <strong>không gian chung</strong>; các kiến trúc khác kết nối encoder và model ngôn ngữ theo cách khác. Nhờ vậy chúng có thể làm caption, hỏi–đáp ảnh hoặc tìm ảnh. Trong demo này, emoji, nhãn, confidence và câu trả lời đều được viết sẵn.",
        "Some multimodal models learn image and text representations that can be compared in a <strong>shared space</strong>; other architectures connect encoders and language models differently. This enables captioning, visual Q&A, or retrieval. In this demo, emoji scenes, labels, confidence scores, and answers are all scripted."
      )}
    </p>

    <div class="row">
      <div class="panel center" style="flex:0.8;">
        <h4 style="text-align:left">${tx("🖼️ Ảnh đầu vào", "🖼️ Input image")}</h4>
        <div id="mmScene" style="font-size:96px; line-height:1.4; user-select:none;"></div>
        <div id="mmPicker" class="mt"></div>
      </div>
      <div class="panel">
        <h4>${tx("🔎 AI \"nhìn\" thấy gì", "🔎 What the AI \"sees\"")}</h4>
        <div id="mmTags"></div>
        <h4 class="mt">${tx("📝 AI tự mô tả", "📝 AI's own caption")}</h4>
        <p id="mmCaption" class="mm-caption"></p>
        <h4 class="mt">${tx("💬 Hỏi về bức ảnh", "💬 Ask about the image")}</h4>
        <div id="mmQA"></div>
      </div>
    </div>

    <div class="takeaway">
      ${tx(
        "💡 <strong>Điều cốt lõi:</strong> Multimodal model xử lý nhiều loại dữ liệu và học cách kết nối chúng. Kiến trúc kiểu CLIP dùng biểu diễn ảnh–chữ có thể so sánh trong không gian chung; hệ khác có thể nối vision encoder với language model theo cách khác. Vì vậy không nên coi mọi hệ là 'cùng một loại vector'. Output của demo này là dữ liệu viết sẵn.",
        "💡 <strong>Key idea:</strong> Multimodal models process and connect multiple data types. CLIP-like architectures learn comparable image–text representations in a shared space; other systems connect vision encoders and language models differently. Not every system uses 'the same vector type.' This demo's outputs are scripted."
      )}
    </div>
  `;

  const sceneEl = root.querySelector("#mmScene");
  const tagsEl = root.querySelector("#mmTags");
  const capEl = root.querySelector("#mmCaption");
  const qaEl = root.querySelector("#mmQA");

  function show(idx) {
    const s = SCENES[idx];
    sceneEl.textContent = s.emoji;
    tagsEl.innerHTML = "";
    // sắp theo độ tự tin giảm dần
    [...s.tags].sort((a, b) => b.p - a.p).forEach((t) => {
      const pct = Math.round(t.p * 100);
      const row = document.createElement("div");
      row.className = "bar-row mt";
      row.innerHTML = `
        <div class="bar-label">${tx(t.label)}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%">${pct}%</div></div>`;
      tagsEl.appendChild(row);
    });
    capEl.textContent = "“" + tx(s.caption) + "”";
    qaEl.innerHTML = "";
    tx(s.qa).forEach(([q, a]) => {
      const wrap = document.createElement("div");
      wrap.className = "mm-qa";
      const btn = document.createElement("button");
      btn.className = "tag";
      btn.textContent = "❓ " + q;
      const ans = document.createElement("div");
      ans.className = "mm-answer muted";
      btn.onclick = () => {
        ans.textContent = "🤖 " + a;
        ans.classList.add("show");
        sfx.pop();
      };
      wrap.appendChild(btn);
      wrap.appendChild(ans);
      qaEl.appendChild(wrap);
    });
  }

  const picker = root.querySelector("#mmPicker");
  SCENES.forEach((s, i) => {
    const tag = document.createElement("button");
    tag.type = "button";
    tag.className = "tag";
    tag.textContent = s.emoji;
    tag.style.fontSize = "22px";
    tag.setAttribute("aria-label", tx(s.caption));
    tag.setAttribute("aria-pressed", i === startIdx ? "true" : "false");
    tag.onclick = () => {
      picker.querySelectorAll(".tag").forEach((t, ti) => {
        t.style.borderColor = "";
        t.setAttribute("aria-pressed", ti === i ? "true" : "false");
      });
      tag.style.borderColor = "var(--accent)";
      setParams({ scene: i });
      show(i);
      sfx.pop();
    };
    if (i === startIdx) tag.style.borderColor = "var(--accent)";
    picker.appendChild(tag);
  });

  show(startIdx);
}
