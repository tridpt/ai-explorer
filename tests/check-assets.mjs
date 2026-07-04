// Kiểm tra tính toàn vẹn của cache offline: MỌI asset runtime (mọi module .js,
// style.css, index.html, và mọi icon khai báo trong manifest.json) đều PHẢI có
// mặt trong mảng ASSETS của sw.js. Nếu quên thêm một file mới, offline sẽ hỏng
// một cách âm thầm — test này bắt lỗi đó ngay, không cần browser hay server.
//
// Chạy cục bộ:  node tests/check-assets.mjs
// Trong CI:     chạy cùng job "test" trước khi deploy.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative, sep } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// Đọc mảng ASSETS trong sw.js và chuẩn hóa đường dẫn ("./x" -> "x").
function readCachedAssets() {
  const src = readFileSync(join(ROOT, "sw.js"), "utf8");
  const start = src.indexOf("const ASSETS");
  const end = src.indexOf("];", start);
  if (start === -1 || end === -1) {
    console.error("✗ Không tìm thấy mảng ASSETS trong sw.js.");
    process.exit(2);
  }
  const block = src.slice(start, end);
  const paths = [...block.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  return new Set(paths.map(normalize));
}

// "./", "./a/b.js", "a/b.js" -> dạng chuẩn "a/b.js" (riêng "./" -> "index.html").
function normalize(p) {
  let s = p.replace(/^\.\//, "");
  if (s === "" || s === "/") s = "index.html";
  return s.replace(/\\/g, "/");
}

// Liệt kê đệ quy các file có phần mở rộng cho trước, bỏ qua thư mục hạ tầng.
const SKIP_DIRS = new Set(["node_modules", "tests", ".git", ".github", "docs"]);
function walk(dir, exts, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, exts, out);
    else if (exts.some((e) => name.endsWith(e))) out.push(full);
  }
  return out;
}

const cached = readCachedAssets();
const rel = (f) => relative(ROOT, f).split(sep).join("/");

// 1) Mọi module .js runtime phải được cache — trừ sw.js (không tự cache chính nó).
const jsFiles = walk(ROOT, [".js"])
  .map(rel)
  .filter((f) => f !== "sw.js");

// 2) index.html + style.css.
const coreFiles = ["index.html", "style.css"];

// 3) Mọi icon khai báo trong manifest.json.
const manifest = JSON.parse(readFileSync(join(ROOT, "manifest.json"), "utf8"));
const iconFiles = (manifest.icons || []).map((i) => normalize(i.src));

const required = [...new Set([...jsFiles, ...coreFiles, ...iconFiles])];
const missing = required.filter((f) => !cached.has(f));

console.log("=== KIỂM TRA ASSETS CACHE (sw.js) ===");
console.log(`Yêu cầu: ${required.length} file · Đã cache: ${cached.size} mục`);

if (missing.length === 0) {
  console.log(`✅ Mọi asset runtime đều có trong ASSETS của sw.js.`);
  process.exit(0);
} else {
  console.log(`❌ Thiếu ${missing.length} file trong ASSETS của sw.js:`);
  missing.forEach((f) => console.log(`  - ./${f}`));
  console.log(`\n→ Thêm các dòng trên vào mảng ASSETS trong sw.js rồi bump số phiên bản CACHE.`);
  process.exit(1);
}
