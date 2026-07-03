// Phòng — RAG: vì sao chatbot "tra" được tài liệu riêng. Song ngữ.
import { sfx } from "../sound.js";
import { tx, getLang } from "../i18n.js";
import { getParam, setParams } from "../roomstate.js";

// "Kho tài liệu" mini: mỗi mảnh có nội dung + bộ từ khóa để chấm điểm liên quan.
const DOCS = {
  vi: [
    { id: 0, title: "Chính sách nghỉ phép", text: "Nhân viên chính thức được 12 ngày phép mỗi năm, cộng thêm 1 ngày cho mỗi 2 năm thâm niên.", keys: ["phép", "nghỉ", "ngày", "thâm niên", "năm"] },
    { id: 1, title: "Giờ làm việc", text: "Giờ làm tiêu chuẩn là 9h–18h, thứ Hai đến thứ Sáu. Có thể làm linh hoạt nếu quản lý duyệt.", keys: ["giờ", "làm việc", "thời gian", "linh hoạt", "thứ"] },
    { id: 2, title: "Chính sách làm từ xa", text: "Được làm từ xa tối đa 2 ngày mỗi tuần. Ngày làm từ xa cần đăng ký trước qua hệ thống.", keys: ["từ xa", "remote", "nhà", "tuần", "đăng ký"] },
    { id: 3, title: "Hoàn ứng chi phí", text: "Chi phí công tác được hoàn trong vòng 14 ngày sau khi nộp hóa đơn hợp lệ.", keys: ["chi phí", "hoàn", "công tác", "hóa đơn", "tiền"] },
  ],
  en: [
    { id: 0, title: "Leave policy", text: "Full-time staff get 12 paid leave days a year, plus 1 extra day for every 2 years of tenure.", keys: ["leave", "vacation", "days", "tenure", "year", "paid"] },
    { id: 1, title: "Working hours", text: "Standard hours are 9am–6pm, Monday to Friday. Flexible hours are possible with manager approval.", keys: ["hours", "work", "time", "flexible", "monday"] },
    { id: 2, title: "Remote work policy", text: "You may work remotely up to 2 days per week. Remote days must be booked in advance in the system.", keys: ["remote", "home", "week", "book", "wfh"] },
    { id: 3, title: "Expense reimbursement", text: "Travel expenses are reimbursed within 14 days of submitting a valid receipt.", keys: ["expense", "reimburse", "travel", "receipt", "money"] },
  ],
};

const SAMPLE_Q = {
  vi: ["Tôi được nghỉ phép bao nhiêu ngày?", "Làm từ xa được mấy ngày một tuần?", "Bao lâu thì được hoàn chi phí?"],
  en: ["How many leave days do I get?", "How many remote days per week?", "How long to get expenses reimbursed?"],
};

function norm(s) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
}

function scoreDoc(q, doc) {
  const nq = norm(q);
  let score = 0;
  for (const k of doc.keys) if (nq.includes(norm(k))) score++;
  // cộng thêm nếu trùng từ trong nội dung
  for (const w of nq.split(/\s+/).filter((w) => w.length > 3)) {
    if (norm(doc.text + " " + doc.title).includes(w)) score += 0.5;
  }
  return score;
}

export function roomRag(root) {
  const docs = DOCS[getLang()] || DOCS.vi;
  const shared = getParam("q");

  root.innerHTML = `
    <p class="room-intro">
      ${tx(
        "Một chatbot thường chỉ biết những gì có trong dữ liệu huấn luyện — nó <strong>không biết tài liệu riêng của bạn</strong> (sổ tay công ty, ghi chú cá nhân…). <strong>RAG</strong> (tra cứu rồi trả lời) khắc phục điều đó: trước khi trả lời, AI <em>tìm những mảnh tài liệu liên quan nhất</em>, rồi dựa vào đó để soạn câu trả lời. Hãy thử hỏi kho tài liệu bên dưới.",
        "A chatbot usually only knows what was in its training data — it <strong>doesn't know your private documents</strong> (company handbook, personal notes…). <strong>RAG</strong> (retrieval-augmented generation) fixes this: before answering, the AI <em>retrieves the most relevant document chunks</em>, then answers based on them. Try querying the mini knowledge base below."
      )}
    </p>

    <div class="row">
      <div class="panel">
        <h4>${tx("📚 Kho tài liệu của bạn", "📚 Your knowledge base")}</h4>
        <div id="ragDocs"></div>
      </div>
      <div class="panel">
        <h4>${tx("❓ Hỏi một câu", "❓ Ask a question")}</h4>
        <input type="text" id="ragInput" placeholder="${tx("Nhập câu hỏi…", "Type a question…")}" />
        <div class="mt"><span class="muted">${tx("Hoặc thử nhanh:", "Or try quickly:")}</span><div id="ragSamples" class="mt"></div></div>
        <div class="mt">
          <div class="rag-step" id="ragStep1">
            <b>1️⃣ ${tx("Tìm mảnh liên quan", "Retrieve relevant chunks")}</b>
            <div id="ragRetrieved" class="muted mt">${tx("…chờ câu hỏi…", "…awaiting a question…")}</div>
          </div>
          <div class="rag-step mt" id="ragStep2">
            <b>2️⃣ ${tx("Trả lời dựa trên tài liệu", "Answer grounded in the docs")}</b>
            <div id="ragAnswer" class="rag-answer mt"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="takeaway">
      ${tx(
        "💡 <strong>Điều cốt lõi:</strong> RAG không \"nhồi\" toàn bộ tài liệu vào AI, cũng không huấn luyện lại nó. Nó chỉ <em>tìm đúng vài đoạn liên quan</em> rồi đưa kèm câu hỏi cho AI đọc. Nhờ vậy chatbot trả lời được về tài liệu mới, dẫn được nguồn, và ít \"bịa\" hơn — đây là cách hầu hết trợ lý hỏi–đáp tài liệu hoạt động.",
        "💡 <strong>Key idea:</strong> RAG doesn't stuff whole documents into the AI, nor retrain it. It just <em>finds a few relevant passages</em> and hands them to the AI alongside your question. That lets a chatbot answer about fresh documents, cite sources, and hallucinate less — how most document Q&A assistants work."
      )}
    </div>
  `;

  const docsEl = root.querySelector("#ragDocs");
  docs.forEach((d) => {
    const el = document.createElement("div");
    el.className = "rag-doc";
    el.id = "ragDoc" + d.id;
    el.innerHTML = `<b>📄 ${d.title}</b><p class="muted">${d.text}</p>`;
    docsEl.appendChild(el);
  });

  const input = root.querySelector("#ragInput");
  const retrievedEl = root.querySelector("#ragRetrieved");
  const answerEl = root.querySelector("#ragAnswer");

  function ask(q) {
    q = q.trim();
    docs.forEach((d) => root.querySelector("#ragDoc" + d.id)?.classList.remove("hit"));
    if (!q) {
      retrievedEl.textContent = tx("…chờ câu hỏi…", "…awaiting a question…");
      answerEl.textContent = "";
      return;
    }
    const ranked = docs.map((d) => ({ d, s: scoreDoc(q, d) })).sort((a, b) => b.s - a.s);
    const top = ranked.filter((r) => r.s > 0).slice(0, 2);

    if (!top.length) {
      retrievedEl.innerHTML = tx("Không tìm thấy mảnh nào khớp.", "No matching chunk found.");
      answerEl.innerHTML = tx(
        "🤖 Xin lỗi, tài liệu hiện có không nói về điều này. (AI không bịa vì không có căn cứ.)",
        "🤖 Sorry, the available documents don't cover this. (The AI won't make things up without grounding.)"
      );
      return;
    }

    retrievedEl.innerHTML = top
      .map((r) => `<span class="rag-chip">📄 ${r.d.title} · ${tx("điểm", "score")} ${r.s.toFixed(1)}</span>`)
      .join(" ");
    top.forEach((r) => root.querySelector("#ragDoc" + r.d.id)?.classList.add("hit"));

    const best = top[0].d;
    answerEl.innerHTML = `🤖 ${best.text} <span class="rag-cite">[${tx("nguồn", "source")}: ${best.title}]</span>`;
    sfx.success();
  }

  let t = null;
  input.oninput = () => {
    clearTimeout(t);
    t = setTimeout(() => { setParams({ q: input.value.trim() || null }); ask(input.value); }, 300);
  };

  const samplesEl = root.querySelector("#ragSamples");
  (SAMPLE_Q[getLang()] || SAMPLE_Q.vi).forEach((s) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = s;
    tag.onclick = () => { input.value = s; setParams({ q: s }); ask(s); sfx.pop(); };
    samplesEl.appendChild(tag);
  });

  if (shared) { input.value = shared; ask(shared); }
}
