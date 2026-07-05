// Kiểm tra tính toàn vẹn song ngữ: MỌI object literal dạng { vi: ..., en: ... }
// đều phải có ĐỦ cả hai vế và không vế nào để rỗng. App có 22 phòng × 2 ngôn ngữ
// nên rất dễ quên điền "en" (hoặc "vi") ở một chuỗi — mắt thường khó soi ra.
// Test này quét toàn bộ module runtime và bắt lỗi đó, không cần browser/server.
//
// Vì sao không dùng regex thuần: chuỗi song ngữ nằm trong template literal nhiều
// dòng, mảng (opts: { vi: [...], en: [...] }), và có dấu nháy lồng nhau — regex
// sẽ cho kết quả sai. Thay vào đó ta duyệt từng ký tự, bỏ qua nội dung
// string/template/comment, và dựng một stack object literal để biết mỗi key
// "vi"/"en" thuộc object nào.
//
// Chạy cục bộ:  node tests/i18n.mjs
// Trong CI:     chạy cùng job "test" trước khi deploy.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative, sep } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const SKIP_DIRS = new Set(["node_modules", "tests", ".git", ".github", "docs"]);
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (name.endsWith(".js")) out.push(full);
  }
  return out;
}

// Duyệt mã nguồn, trả về danh sách object literal có ít nhất một key "vi" hoặc "en".
// Mỗi phần tử: { keys: Map<name, {emptyString: bool}>, line }.
function scanBilingualObjects(src) {
  const objects = [];
  // Stack container: mỗi phần tử { type: "object"|"array"|"paren", frame? }.
  const stack = [];
  let i = 0;
  const n = src.length;

  // Đọc một chuỗi/template kể từ dấu mở quote tại vị trí i (src[i] === quote).
  // Trả về [nội-dung-thô, chỉ-số-sau-dấu-đóng]. Có xử lý escape; template coi
  // toàn bộ (kể cả ${...}) là nội dung — trong dự án không có object {vi,en}
  // định nghĩa bên trong ${}, nên bỏ qua an toàn.
  function readString(quote) {
    let j = i + 1;
    let body = "";
    while (j < n) {
      const c = src[j];
      if (c === "\\") { body += src[j + 1] ?? ""; j += 2; continue; }
      if (c === quote) { j++; break; }
      body += c;
      j++;
    }
    return [body, j];
  }

  // Sau "{" hoặc "," (trong object), key kế tiếp là định danh/chuỗi rồi tới ":".
  let expectKey = false;

  function lineAt(idx) {
    return src.slice(0, idx).split("\n").length;
  }

  while (i < n) {
    const c = src[i];

    // --- comment ---
    if (c === "/" && src[i + 1] === "/") {
      i = src.indexOf("\n", i);
      if (i === -1) i = n;
      continue;
    }
    if (c === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      i = end === -1 ? n : end + 2;
      continue;
    }

    // --- string / template ---
    if (c === '"' || c === "'" || c === "`") {
      // Nếu đang chờ key và key là chuỗi (vd { "vi": ... }) thì đọc để lấy tên key.
      const [body, next] = readString(c);
      if (expectKey) {
        // Bỏ khoảng trắng để xem có dấu ":" — tức đây là key.
        let k = next;
        while (k < n && /\s/.test(src[k])) k++;
        if (src[k] === ":") {
          recordKey(body, k + 1);
          expectKey = false;
        }
      }
      i = next;
      continue;
    }

    // --- mở/đóng container ---
    if (c === "{") {
      stack.push({ type: "object", frame: { keys: new Map(), line: lineAt(i) } });
      expectKey = true;
      i++;
      continue;
    }
    if (c === "[") { stack.push({ type: "array" }); expectKey = false; i++; continue; }
    if (c === "(") { stack.push({ type: "paren" }); expectKey = false; i++; continue; }
    if (c === "}" || c === "]" || c === ")") {
      const top = stack.pop();
      if (top && top.type === "object") {
        const f = top.frame;
        if (f.keys.has("vi") || f.keys.has("en")) objects.push(f);
      }
      // Sau khi đóng, container cha lại có thể chờ dấu "," → key kế tiếp.
      expectKey = false;
      i++;
      continue;
    }

    // --- dấu phẩy: trong object thì mở kỳ vọng key mới ---
    if (c === ",") {
      const top = stack[stack.length - 1];
      expectKey = !!(top && top.type === "object");
      i++;
      continue;
    }

    // --- định danh có thể là key (vi, en, opts, q, title…) ---
    if (expectKey && /[A-Za-z_$]/.test(c)) {
      let j = i;
      while (j < n && /[A-Za-z0-9_$]/.test(src[j])) j++;
      const name = src.slice(i, j);
      let k = j;
      while (k < n && /\s/.test(src[k])) k++;
      if (src[k] === ":") {
        recordKey(name, k + 1);
        expectKey = false;
        i = k + 1;
        continue;
      }
      // Không phải key (vd shorthand/nhãn) — thôi kỳ vọng.
      expectKey = false;
      i = j;
      continue;
    }

    // Ký tự thường: nếu không phải khoảng trắng thì hết "vị trí đầu" của key.
    if (!/\s/.test(c)) expectKey = false;
    i++;
  }

  // Ghi nhận một key vào object đang mở (top stack), kèm kiểm tra giá trị rỗng.
  function recordKey(name, valueStart) {
    const top = stack[stack.length - 1];
    if (!top || top.type !== "object") return;
    if (name !== "vi" && name !== "en") { top.frame.keys.set(name, {}); return; }
    // Với vi/en: dò giá trị ngay sau ":" để phát hiện chuỗi rỗng "" / ``.
    let p = valueStart;
    while (p < n && /\s/.test(src[p])) p++;
    let emptyString = false;
    if (src[p] === '"' || src[p] === "'" || src[p] === "`") {
      emptyString = src[p + 1] === src[p]; // hai quote liền nhau = chuỗi rỗng
    }
    top.frame.keys.set(name, { emptyString });
  }

  return objects;
}

const files = walk(ROOT).map((f) => relative(ROOT, f).split(sep).join("/"));
const problems = [];

for (const rel of files) {
  const src = readFileSync(join(ROOT, rel), "utf8");
  const objects = scanBilingualObjects(src);
  for (const o of objects) {
    const hasVi = o.keys.has("vi");
    const hasEn = o.keys.has("en");
    if (hasVi && !hasEn) problems.push(`${rel}:${o.line} — có "vi" nhưng THIẾU "en"`);
    else if (hasEn && !hasVi) problems.push(`${rel}:${o.line} — có "en" nhưng THIẾU "vi"`);
    if (hasVi && o.keys.get("vi").emptyString) problems.push(`${rel}:${o.line} — "vi" để rỗng ("")`);
    if (hasEn && o.keys.get("en").emptyString) problems.push(`${rel}:${o.line} — "en" để rỗng ("")`);
  }
}

const scanned = files.length;
console.log("=== KIỂM TRA SONG NGỮ (vi/en) ===");
console.log(`Đã quét ${scanned} file .js runtime.`);

if (problems.length === 0) {
  console.log("✅ Mọi object { vi, en } đều đủ hai vế và không vế nào rỗng.");
  process.exit(0);
} else {
  console.log(`❌ ${problems.length} vấn đề song ngữ:`);
  problems.forEach((p) => console.log("  - " + p));
  process.exit(1);
}
