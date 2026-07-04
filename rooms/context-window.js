// Phòng — Cửa sổ ngữ cảnh (context window). Song ngữ.
// Ý tưởng trực quan: AI chỉ "nhớ" được một lượng token giới hạn cùng lúc.
// Khi cuộc trò chuyện dài hơn cửa sổ, những tin nhắn CŨ NHẤT rơi ra ngoài —
// AI không còn "thấy" chúng nữa. Đó là lý do chatbot đôi khi "quên đầu câu chuyện".
import { sfx } from "../sound.js";
import { tx, getLang } from "../i18n.js";

// Ước lượng token thô: ~1 token cho mỗi 4 ký tự (đủ để minh họa, không cần chính xác).
function estTokens(text) {
  return Math.max(1, Math.round(text.trim().length / 4));
}

// Kịch bản mẫu: một cuộc trò chuyện có "chi tiết quan trọng" ở đầu để minh họa
// việc AI quên khi nó rơi ra khỏi cửa sổ.
const SCRIPT = {
  vi: [
    { who: "user", text: "Tên tôi là Minh, tôi bị dị ứng đậu phộng." },
    { who: "bot", text: "Chào Minh! Tôi sẽ nhớ điều đó khi gợi ý món ăn." },
    { who: "user", text: "Gợi ý cho tôi một quán phở ngon ở Hà Nội nhé." },
    { who: "bot", text: "Bạn thử phở Bát Đàn hoặc phở Thìn xem sao." },
    { who: "user", text: "Cuối tuần tôi muốn nấu ăn ở nhà, món gì dễ làm?" },
    { who: "bot", text: "Bạn có thể làm cơm rang hoặc canh chua đơn giản." },
    { who: "user", text: "Gợi ý cho tôi một món tráng miệng đi." },
  ],
  en: [
    { who: "user", text: "My name is Minh, and I'm allergic to peanuts." },
    { who: "bot", text: "Hi Minh! I'll keep that in mind when suggesting food." },
    { who: "user", text: "Recommend a good pho place in Hanoi." },
    { who: "bot", text: "Try Pho Bat Dan or Pho Thin." },
    { who: "user", text: "This weekend I want to cook at home — something easy?" },
    { who: "bot", text: "You could make fried rice or a simple sour soup." },
    { who: "user", text: "Suggest me a dessert." },
  ],
};

export function roomContextWindow(root) {
  const lang = getLang();
  root.innerHTML = `
    <p class="room-intro">
      ${tx(
        "AI không nhớ vô hạn. Mỗi lần trả lời, nó chỉ \"đọc\" được một lượng token giới hạn gần nhất — gọi là <strong>cửa sổ ngữ cảnh</strong> (context window). Khi cuộc trò chuyện dài hơn cửa sổ, những tin <em>cũ nhất rơi ra ngoài</em> và AI không còn thấy chúng. Đó là lý do chatbot đôi khi \"quên\" điều bạn nói lúc đầu.",
        "AI doesn't remember forever. Each time it answers, it only \"reads\" a limited amount of recent tokens — its <strong>context window</strong>. When a chat grows longer than the window, the <em>oldest messages fall out</em> and the AI no longer sees them. That's why chatbots sometimes \"forget\" what you said at the start."
      )}
    </p>

    <div class="panel">
      <h4>${tx("🎚️ Kích thước cửa sổ ngữ cảnh", "🎚️ Context window size")}</h4>
      <p class="muted">${tx(
        "Kéo để thay đổi số token AI nhớ được cùng lúc. Cửa sổ càng nhỏ, AI càng nhanh quên.",
        "Drag to change how many tokens the AI holds at once. The smaller the window, the sooner it forgets."
      )}</p>
      <div class="row" style="align-items:center; gap:12px;">
        <input type="range" id="cwSize" min="20" max="120" step="5" value="45" style="flex:1;" />
        <div class="stat" style="min-width:96px;">
          <div class="stat-num"><span id="cwSizeVal">45</span></div>
          <div class="muted">${tx("token tối đa", "max tokens")}</div>
        </div>
      </div>
    </div>

    <div class="panel">
      <h4>${tx("💬 Cuộc trò chuyện", "💬 The conversation")}</h4>
      <div id="cwChat" class="cw-chat"></div>
      <div class="row mt" style="gap:10px; flex-wrap:wrap;">
        <button class="btn" id="cwAdd">${tx("+ Thêm tin nhắn", "+ Add message")}</button>
        <button class="btn ghost" id="cwReset">${tx("↺ Bắt đầu lại", "↺ Restart")}</button>
      </div>
      <div class="row mt">
        <div class="stat"><div class="stat-num" id="cwUsed">0</div><div class="muted">${tx("token đang dùng", "tokens in use")}</div></div>
        <div class="stat"><div class="stat-num" id="cwDropped">0</div><div class="muted">${tx("tin đã rơi ra", "messages dropped")}</div></div>
      </div>
    </div>

    <div class="panel" id="cwAskPanel">
      <h4>${tx("🧠 AI còn nhớ gì?", "🧠 What does the AI still remember?")}</h4>
      <p class="muted">${tx(
        "Thử hỏi lại chi tiết ở tin nhắn ĐẦU TIÊN (ví dụ: tên bạn, thứ bạn dị ứng). Nếu tin đó đã rơi ra khỏi cửa sổ, AI sẽ không còn biết.",
        "Try asking about a detail from the FIRST message (e.g. your name, your allergy). If it fell out of the window, the AI no longer knows."
      )}</p>
      <button class="btn" id="cwAsk">${tx("Hỏi: \"Tôi tên gì và dị ứng gì?\"", "Ask: \"What's my name and allergy?\"")}</button>
      <div id="cwAnswer" class="cw-answer mt"></div>
    </div>

    <div class="takeaway">
      ${tx(
        "💡 <strong>Điều cốt lõi:</strong> \"trí nhớ\" của AI trong một cuộc trò chuyện chính là cửa sổ ngữ cảnh — một hàng đợi token có giới hạn. Muốn AI nhớ điều gì quan trọng, hãy nhắc lại nó, hoặc dùng kỹ thuật như RAG để \"tra\" lại thông tin cũ thay vì trông chờ AI tự nhớ.",
        "💡 <strong>Key idea:</strong> an AI's \"memory\" within a chat is just its context window — a limited token queue. To keep something important in mind, repeat it, or use techniques like RAG to \"look up\" old info instead of relying on the AI to remember."
      )}
    </div>
  `;

  const script = SCRIPT[lang] || SCRIPT.vi;
  let count = 1; // số tin đang hiển thị (bắt đầu với 1 tin)

  const sizeInput = root.querySelector("#cwSize");
  const sizeVal = root.querySelector("#cwSizeVal");
  const chatEl = root.querySelector("#cwChat");
  const usedEl = root.querySelector("#cwUsed");
  const droppedEl = root.querySelector("#cwDropped");
  const answerEl = root.querySelector("#cwAnswer");

  // Xác định những tin nào NẰM TRONG cửa sổ: đi ngược từ tin mới nhất, cộng dồn
  // token cho tới khi vượt giới hạn. Các tin cũ hơn coi như "rơi ra".
  function computeVisible(limit) {
    const msgs = script.slice(0, count).map((m) => ({ ...m, tk: estTokens(m.text) }));
    let sum = 0;
    let firstInside = msgs.length; // chỉ số tin đầu tiên còn nằm trong cửa sổ
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (sum + msgs[i].tk > limit && i !== msgs.length - 1) break;
      sum += msgs[i].tk;
      firstInside = i;
    }
    return { msgs, firstInside, used: sum };
  }

  function render() {
    const limit = +sizeInput.value;
    sizeVal.textContent = limit;
    const { msgs, firstInside, used } = computeVisible(limit);

    chatEl.innerHTML = "";
    msgs.forEach((m, i) => {
      const dropped = i < firstInside;
      const row = document.createElement("div");
      row.className = `cw-msg ${m.who}` + (dropped ? " dropped" : "");
      row.innerHTML = `
        <div class="cw-bubble">
          <span class="cw-text">${m.text}</span>
          <span class="cw-tk">${m.tk} tk</span>
        </div>`;
      chatEl.appendChild(row);
    });

    usedEl.textContent = `${used}/${limit}`;
    droppedEl.textContent = firstInside;

    // Nếu có tin rơi ra, đánh dấu ranh giới cửa sổ.
    if (firstInside > 0) {
      const line = document.createElement("div");
      line.className = "cw-window-line";
      line.textContent = tx("⤒ đây là mép cửa sổ — phía trên AI không còn thấy", "⤒ window edge — the AI can't see above this");
      chatEl.insertBefore(line, chatEl.children[firstInside]);
    }
    answerEl.innerHTML = "";
  }

  root.querySelector("#cwAdd").onclick = () => {
    if (count < script.length) { count++; render(); sfx.pop(); }
    else { sfx.wrong(); }
  };
  root.querySelector("#cwReset").onclick = () => { count = 1; render(); sfx.click(); };
  sizeInput.oninput = () => { render(); };

  // "Hỏi lại" chi tiết ở tin đầu: nếu tin 0 còn trong cửa sổ → AI nhớ, ngược lại → quên.
  root.querySelector("#cwAsk").onclick = () => {
    const limit = +sizeInput.value;
    const { firstInside } = computeVisible(limit);
    const remembers = firstInside === 0; // tin đầu tiên (chứa tên + dị ứng) còn thấy?
    answerEl.className = "cw-answer mt " + (remembers ? "ok" : "lost");
    if (remembers) {
      answerEl.innerHTML = tx(
        "🤖 \"Bạn tên <b>Minh</b> và bị <b>dị ứng đậu phộng</b>.\" — chi tiết này vẫn nằm trong cửa sổ nên AI còn nhớ.",
        "🤖 \"Your name is <b>Minh</b> and you're <b>allergic to peanuts</b>.\" — that detail is still in the window, so the AI remembers."
      );
      sfx.success();
    } else {
      answerEl.innerHTML = tx(
        "🤖 \"Xin lỗi, tôi không rõ tên hay thông tin dị ứng của bạn.\" — tin nhắn đầu đã <b>rơi ra khỏi cửa sổ</b>, AI không còn thấy. Thử tăng kích thước cửa sổ rồi hỏi lại.",
        "🤖 \"Sorry, I don't know your name or allergy.\" — the first message <b>fell out of the window</b>, so the AI can't see it. Try enlarging the window and ask again."
      );
      sfx.wrong();
    }
  };

  render();
}
