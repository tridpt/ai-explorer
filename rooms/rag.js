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
        "Một chatbot không tự có quyền truy cập tài liệu riêng của bạn. <strong>RAG</strong> (retrieval-augmented generation) thêm một bước: hệ thống <em>truy xuất các đoạn có vẻ liên quan</em> rồi đưa chúng vào ngữ cảnh để model soạn câu trả lời. Truy xuất và câu trả lời vẫn có thể sai, nên nguồn giúp người đọc kiểm tra lại. Demo dưới đây dùng chấm điểm từ khóa.",
        "A chatbot does not automatically have access to your private documents. <strong>RAG</strong> adds a step: the system <em>retrieves passages that appear relevant</em> and places them in context for a model to answer. Retrieval and generation can still fail, so citations help readers verify. This demo uses keyword scoring."
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
        "💡 <strong>Điều cốt lõi:</strong> RAG truy xuất một số đoạn rồi đưa chúng vào ngữ cảnh; nó không nhất thiết huấn luyện lại model. Cách này có thể cải thiện grounding và cho phép dẫn nguồn, nhưng retrieval có thể bỏ sót/chọn nhầm và model vẫn có thể tạo câu không được nguồn hỗ trợ. Dẫn nguồn giúp kiểm tra, không bảo đảm đúng.",
        "💡 <strong>Key idea:</strong> RAG retrieves passages and places them in context; it does not necessarily retrain the model. This can improve grounding and enable citations, but retrieval can miss or select wrong evidence, and generation can still be unsupported. Citations aid verification; they do not guarantee correctness."
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
        "🤖 Tài liệu hiện có không khớp câu hỏi này. Một hệ RAG nên từ chối hoặc yêu cầu thêm nguồn, nhưng model thật vẫn có thể tạo câu không có căn cứ nếu guardrail yếu.",
        "🤖 The available documents do not match this question. A RAG system should abstain or request more evidence, but a real model may still generate unsupported text if guardrails are weak."
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
    const tag = document.createElement("button");
    tag.type = "button";
    tag.className = "tag";
    tag.textContent = s;
    tag.onclick = () => { input.value = s; setParams({ q: s }); ask(s); sfx.pop(); };
    samplesEl.appendChild(tag);
  });

  if (shared) { input.value = shared; ask(shared); }
}
