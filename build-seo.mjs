// Prerender SEO: sinh trang HTML tĩnh song ngữ cho mỗi phòng (+ sitemap) để crawler
// index được nội dung dù app render bằng JS. Trang tĩnh chứa nội dung thật + JSON-LD,
// rồi tự chuyển người dùng vào bản tương tác (SPA hash). App client KHÔNG đổi.
//
// Chạy:  node build-seo.mjs   (hoặc: npm run build:seo)
// Sinh:  vi/<id>/index.html, en/<id>/index.html, sitemap.xml
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { ROOM_META } from "./rooms-meta.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

const ORIGIN = "https://tridpt.github.io";
const BASE = "/ai-explorer";
const SITE = ORIGIN + BASE; // https://tridpt.github.io/ai-explorer
const LANGS = ["vi", "en"];
const OG_IMAGE = `${SITE}/og.png`;

const SITE_NAME = { vi: "AI Explorer — Hiểu AI trong 15 phút", en: "AI Explorer — Understand AI in 15 minutes" };
const HOME_URL = { vi: `${SITE}/vi/`, en: `${SITE}/en/`, root: `${SITE}/` };
const T = {
  crumbHome: { vi: "AI Explorer", en: "AI Explorer" },
  partOf: { vi: "Một phần của hành trình", en: "Part of the journey" },
  open: { vi: "▶ Mở bản tương tác", en: "▶ Open the interactive version" },
  redirecting: { vi: "Đang mở bản tương tác…", en: "Opening the interactive version…" },
  roomWord: { vi: "Phòng", en: "Room" },
  allRooms: { vi: "Xem tất cả các phòng", en: "See all rooms" },
};

// ---- escape helpers ----
const escAttr = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escHtml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const stripTags = (s) => String(s).replace(/<[^>]+>/g, "");

function page(meta, lang) {
  const other = lang === "vi" ? "en" : "vi";
  const title = stripTags(meta.title[lang]);
  const question = stripTags(meta.question[lang]);
  const blurb = stripTags(meta.blurb[lang]);
  const canonical = `${SITE}/${lang}/${meta.id}/`;
  const altVi = `${SITE}/vi/${meta.id}/`;
  const altEn = `${SITE}/en/${meta.id}/`;
  const pageTitle = `${title} — AI Explorer`;
  const desc = `${question} ${blurb}`.trim();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: title,
    description: blurb,
    inLanguage: lang,
    url: canonical,
    image: OG_IMAGE,
    learningResourceType: "interactive simulation",
    educationalLevel: "beginner",
    teaches: question,
    isPartOf: { "@type": "Course", name: SITE_NAME[lang], url: HOME_URL[lang] },
    isAccessibleForFree: true,
  };

  // Redirect: từ /<lang>/<id>/ lên 2 cấp là app root; giữ ngôn ngữ qua localStorage.
  const redirect =
    `try{localStorage.setItem('ai-explorer-lang','${lang}');}catch(e){}` +
    `location.replace('../../#/${meta.id}');`;

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escHtml(pageTitle)}</title>
  <meta name="description" content="${escAttr(desc)}" />
  <link rel="canonical" href="${canonical}" />
  <link rel="alternate" hreflang="vi" href="${altVi}" />
  <link rel="alternate" hreflang="en" href="${altEn}" />
  <link rel="alternate" hreflang="x-default" href="${altVi}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:title" content="${escAttr(pageTitle)}" />
  <meta property="og:description" content="${escAttr(desc)}" />
  <meta property="og:image" content="${OG_IMAGE}" />
  <meta property="og:locale" content="${lang === "vi" ? "vi_VN" : "en_US"}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escAttr(pageTitle)}" />
  <meta name="twitter:description" content="${escAttr(desc)}" />
  <meta name="twitter:image" content="${OG_IMAGE}" />
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%A7%A0%3C/text%3E%3C/svg%3E" />
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <style>
    body { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; background:#fffbf0; color:#111; margin:0; padding:0; line-height:1.6; }
    .wrap { max-width:680px; margin:0 auto; padding:48px 22px; }
    .crumb { font-size:13px; color:#4b463a; text-transform:uppercase; letter-spacing:.4px; font-weight:700; }
    h1 { font-size:clamp(26px,5vw,38px); margin:14px 0 4px; }
    .lead { font-size:19px; font-weight:600; color:#4b463a; margin:0 0 18px; }
    .cta { display:inline-block; margin-top:20px; padding:13px 24px; border:3px solid #111; background:#ffe14d; color:#111; font-weight:800; text-decoration:none; }
    .cta:hover { box-shadow:6px 6px 0 #111; }
    .all { display:block; margin-top:28px; font-size:14px; }
    a { color:#111; }
  </style>
</head>
<body>
  <main class="wrap">
    <p class="crumb">${escHtml(T.crumbHome[lang])} › ${escHtml(T.roomWord[lang])} ${escHtml(meta.num)}</p>
    <h1>${escHtml(meta.icon)} ${escHtml(title)}</h1>
    <p class="lead">${escHtml(question)}</p>
    <p>${escHtml(blurb)}</p>
    <p><a class="cta" href="../../#/${meta.id}">${escHtml(T.open[lang])}</a></p>
    <p class="crumb" id="redirect-note">${escHtml(T.redirecting[lang])}</p>
    <a class="all" href="../../">${escHtml(T.allRooms[lang])}</a>
  </main>
  <script>${redirect}</script>
</body>
</html>
`;
}

function buildSitemap() {
  const urls = [`${SITE}/`];
  for (const lang of LANGS) urls.push(`${SITE}/${lang}/`);
  for (const meta of ROOM_META) {
    for (const lang of LANGS) urls.push(`${SITE}/${lang}/${meta.id}/`);
  }
  const body = urls
    .map((u) => `  <url>\n    <loc>${u}</loc>\n    <changefreq>monthly</changefreq>\n  </url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

// Trang chỉ mục ngôn ngữ (/vi/, /en/) redirect về app, giúp hreflang home hợp lệ.
function langIndex(lang) {
  const redirect = `try{localStorage.setItem('ai-explorer-lang','${lang}');}catch(e){}location.replace('../');`;
  return `<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8" />` +
    `<title>${escHtml(SITE_NAME[lang])}</title>` +
    `<link rel="canonical" href="${SITE}/${lang}/" />` +
    `<meta name="robots" content="noindex,follow" />` +
    `<script>${redirect}</script></head><body></body></html>\n`;
}

let count = 0;
for (const lang of LANGS) {
  mkdirSync(join(ROOT, lang), { recursive: true });
  writeFileSync(join(ROOT, lang, "index.html"), langIndex(lang), "utf8");
  for (const meta of ROOM_META) {
    const dir = join(ROOT, lang, meta.id);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "index.html"), page(meta, lang), "utf8");
    count++;
  }
}
writeFileSync(join(ROOT, "sitemap.xml"), buildSitemap(), "utf8");

console.log(`✅ Prerender xong: ${count} trang phòng (${LANGS.length} ngôn ngữ) + ${LANGS.length} trang ngôn ngữ + sitemap.xml`);
