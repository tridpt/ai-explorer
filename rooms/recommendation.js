// Phòng — Gợi ý (Recommendation): vì sao TikTok/YouTube "hiểu" bạn. Song ngữ.
import { sfx, celebrate } from "../sound.js";
import { tx } from "../i18n.js";

// Mỗi mục có vector đặc trưng theo thể loại: [hành động, hài, tình cảm, khoa học, kinh dị]
const ITEMS = [
  { icon: "🚗", t: { vi: "Phim đua xe", en: "Racing movie" }, v: [1, 0, 0, 0, 0] },
  { icon: "😂", t: { vi: "Hài kịch", en: "Comedy show" }, v: [0, 1, 0, 0, 0] },
  { icon: "💘", t: { vi: "Phim tình cảm", en: "Romance film" }, v: [0, 0, 1, 0, 0] },
  { icon: "🚀", t: { vi: "Khoa học viễn tưởng", en: "Sci-fi" }, v: [.3, 0, 0, 1, 0] },
  { icon: "👻", t: { vi: "Phim ma", en: "Horror film" }, v: [0, 0, 0, 0, 1] },
  { icon: "💥", t: { vi: "Bom tấn hành động", en: "Action blockbuster" }, v: [1, .2, 0, .2, 0] },
  { icon: "🤖", t: { vi: "Tài liệu về AI", en: "AI documentary" }, v: [0, 0, 0, 1, 0] },
  { icon: "🧟", t: { vi: "Phim zombie", en: "Zombie movie" }, v: [.4, 0, 0, 0, 1] },
  { icon: "💑", t: { vi: "Hài lãng mạn", en: "Rom-com" }, v: [0, .6, .7, 0, 0] },
  { icon: "🛸", t: { vi: "Người ngoài hành tinh", en: "Alien thriller" }, v: [.3, 0, 0, .7, .5] },
];

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}

export function roomRecommendation(root) {
  root.innerHTML = `
    <p class="room-intro">
      ${tx(
        "Vì sao TikTok, YouTube, Netflix cứ như \"đọc được suy nghĩ\" của bạn? Không có phép thuật đâu. AI chỉ ghi lại những gì bạn <strong>thích</strong> và <strong>bỏ qua</strong>, rồi tìm những thứ <em>giống với thứ bạn từng thích</em>. Hãy tự tạo \"gu\" của bạn và xem AI đoán.",
        "Why do TikTok, YouTube, Netflix seem to \"read your mind\"? No magic. The AI just records what you <strong>like</strong> and <strong>skip</strong>, then finds things <em>similar to what you liked</em>. Build your taste and watch the AI guess."
      )}
    </p>

    <div class="row">
      <div class="panel" style="flex:1.2;">
        <h4>${tx("👍 Chấm điểm vài mục (thích / bỏ qua)", "👍 Rate a few (like / skip)")}</h4>
        <div id="rcItems"></div>
      </div>
      <div class="panel">
        <h4>${tx("✨ AI gợi ý cho bạn", "✨ AI recommends for you")}</h4>
        <div id="rcResult"><p class="muted">${tx("Hãy thích ít nhất 1 mục để AI bắt đầu gợi ý.", "Like at least 1 item for the AI to start.")}</p></div>
      </div>
    </div>

    <div class="takeaway">
      ${tx(
        "💡 <strong>Điều cốt lõi:</strong> AI gợi ý không \"hiểu\" nội dung như con người. Nó biểu diễn mỗi thứ bằng những con số (đặc trưng), rồi đo <em>độ giống nhau</em> để đoán bạn sẽ thích gì. Đó cũng là lý do đôi khi nó gợi ý \"trúng\" đến phát sợ — và cũng là lý do nó dễ nhốt bạn trong \"bong bóng\" quanh những gì bạn đã thích.",
        "💡 <strong>Key idea:</strong> A recommender doesn't \"understand\" content like a human. It represents each thing as numbers (features), then measures <em>similarity</em> to guess what you'll like. That's why it sometimes nails it eerily well — and why it can trap you in a \"bubble\" around what you already liked."
      )}
    </div>
  `;

  const ratings = {}; // index -> 1 like / -1 skip
  const itemsEl = root.querySelector("#rcItems");
  const resultEl = root.querySelector("#rcResult");

  ITEMS.forEach((it, i) => {
    const row = document.createElement("div");
    row.className = "bar-row";
    row.style.justifyContent = "space-between";
    row.innerHTML = `
      <span style="flex:1"><span style="font-size:22px">${it.icon}</span> ${tx(it.t)}</span>
      <span style="display:flex; gap:6px; flex:0 0 auto;">
        <button class="tag rc-like" data-i="${i}">👍</button>
        <button class="tag rc-skip" data-i="${i}">🙈</button>
      </span>`;
    itemsEl.appendChild(row);
  });

  function recompute() {
    const liked = Object.keys(ratings).filter((i) => ratings[i] === 1).map(Number);
    const disliked = Object.keys(ratings).filter((i) => ratings[i] === -1).map(Number);
    if (liked.length === 0) {
      resultEl.innerHTML = `<p class="muted">${tx("Hãy thích ít nhất 1 mục để AI bắt đầu gợi ý.", "Like at least 1 item for the AI to start.")}</p>`;
      return;
    }
    const dim = ITEMS[0].v.length;
    const profile = new Array(dim).fill(0);
    liked.forEach((i) => ITEMS[i].v.forEach((val, d) => (profile[d] += val)));
    disliked.forEach((i) => ITEMS[i].v.forEach((val, d) => (profile[d] -= val * 0.6)));

    const scored = ITEMS
      .map((it, i) => ({ it, i, s: cosine(profile, it.v) }))
      .filter((x) => ratings[x.i] === undefined)
      .sort((a, b) => b.s - a.s)
      .slice(0, 3);

    resultEl.innerHTML = scored.map((x) => {
      const pct = Math.max(0, Math.round(x.s * 100));
      return `<div class="bar-row">
        <div class="bar-label" style="text-align:left; width:auto; flex:0 0 130px;">${x.it.icon} ${tx(x.it.t)}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.max(8, pct)}%">${pct}%</div></div>
      </div>`;
    }).join("") + `<p class="muted mt">${tx("Càng chấm nhiều, gợi ý càng sát gu bạn.", "The more you rate, the better it fits your taste.")}</p>`;
  }

  itemsEl.querySelectorAll("button").forEach((b) => {
    b.onclick = () => {
      const i = b.dataset.i;
      const like = b.classList.contains("rc-like");
      ratings[i] = like ? 1 : -1;
      const row = b.closest(".bar-row");
      row.style.opacity = "0.55";
      row.querySelectorAll("button").forEach((x) => (x.style.borderColor = ""));
      b.style.borderColor = like ? "#00b34a" : "#e5352b";
      like ? sfx.pop() : sfx.tick();
      recompute();
    };
  });
}
