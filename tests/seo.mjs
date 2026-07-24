// Kiểm tra prerender SEO: chạy build rồi xác nhận mỗi phòng có trang tĩnh song ngữ
// với canonical/hreflang/JSON-LD/redirect đúng, và sitemap liệt kê đủ URL.
// Không cần browser/server.
//
// Chạy cục bộ:  node tests/seo.mjs
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { ROOM_META } from "../rooms-meta.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// Import build-seo.mjs kích hoạt sinh file (chạy top-level khi import).
await import("../build-seo.mjs");

const LANGS = ["vi", "en"];
const failures = [];
function check(cond, msg) {
  if (cond) return;
  failures.push(msg);
  console.log(`ERR  ${msg}`);
}

// 1) Mỗi phòng × mỗi ngôn ngữ phải có trang tĩnh với các thẻ SEO bắt buộc.
for (const meta of ROOM_META) {
  for (const lang of LANGS) {
    const file = join(ROOT, lang, meta.id, "index.html");
    if (!existsSync(file)) { check(false, `thiếu ${lang}/${meta.id}/index.html`); continue; }
    const html = readFileSync(file, "utf8");
    check(html.includes(`<html lang="${lang}"`), `${lang}/${meta.id}: sai thuộc tính lang`);
    check(html.includes(`rel="canonical" href="https://tridpt.github.io/ai-explorer/${lang}/${meta.id}/"`), `${lang}/${meta.id}: thiếu canonical đúng`);
    check(html.includes('hreflang="vi"') && html.includes('hreflang="en"') && html.includes('hreflang="x-default"'), `${lang}/${meta.id}: thiếu hreflang`);
    check(html.includes('application/ld+json') && html.includes('"LearningResource"'), `${lang}/${meta.id}: thiếu JSON-LD`);
    check(html.includes(`location.replace('../../#/${meta.id}')`), `${lang}/${meta.id}: thiếu redirect vào SPA`);
    check(html.includes('property="og:title"'), `${lang}/${meta.id}: thiếu Open Graph`);
  }
}

// 2) sitemap liệt kê home + trang ngôn ngữ + mọi phòng × ngôn ngữ.
const sitemap = readFileSync(join(ROOT, "sitemap.xml"), "utf8");
check(sitemap.includes("<loc>https://tridpt.github.io/ai-explorer/</loc>"), "sitemap thiếu trang chủ");
for (const meta of ROOM_META) {
  for (const lang of LANGS) {
    check(sitemap.includes(`<loc>https://tridpt.github.io/ai-explorer/${lang}/${meta.id}/</loc>`), `sitemap thiếu ${lang}/${meta.id}`);
  }
}
check(sitemap.includes("<loc>https://tridpt.github.io/ai-explorer/privacy.html</loc>"), "sitemap thiếu trang privacy");
const locCount = (sitemap.match(/<loc>/g) || []).length;
// home + privacy + 2 trang ngôn ngữ + (26 phòng × 2 ngôn ngữ)
const expected = 2 + LANGS.length + ROOM_META.length * LANGS.length;
check(locCount === expected, `sitemap có ${locCount} URL, cần ${expected}`);

console.log("\n=== KẾT QUẢ (seo prerender) ===");
if (failures.length === 0) {
  console.log(`✅ ${ROOM_META.length * LANGS.length} trang phòng + sitemap (${expected} URL) hợp lệ.`);
  process.exit(0);
} else {
  console.log(`❌ ${failures.length} lỗi SEO.`);
  process.exit(1);
}
