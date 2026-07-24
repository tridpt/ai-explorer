// Axe accessibility audit: mở home và một tập phòng đại diện (nhiều loại UI:
// canvas game, ma trận, chat, form, deep-link) rồi fail nếu có vi phạm
// WCAG A/AA nghiêm trọng. Đây là lưới an toàn tự động — không thay thế kiểm
// thử thủ công với screen reader, nhưng bắt được hồi quy phổ biến.
//
// Chạy cục bộ:  node tests/a11y.mjs  (cần server tại http://localhost:8000)
// Trong CI:     xem .github/workflows/deploy.yml (job "test").
import { chromium } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";

const BASE = process.env.SMOKE_BASE || "http://localhost:8000";

// Phòng đại diện cho từng kiểu giao diện, giữ thời gian chạy hợp lý.
const ROUTES = [
  { id: "home", hash: "" },
  { id: "attention", hash: "#/attention" },
  { id: "neural-net", hash: "#/neural-net" },
  { id: "rag", hash: "#/rag" },
  { id: "prompt-injection", hash: "#/prompt-injection" },
  { id: "multimodal", hash: "#/multimodal" },
  { id: "summary", hash: "#/summary" },
];

const failures = [];
const browser = await chromium.launch();
// reducedMotion khiến app tắt animation (app tôn trọng prefers-reduced-motion),
// nhờ đó axe quét trạng thái tĩnh ổn định thay vì bắt nhầm frame giữa animation.
const context = await browser.newContext({ reducedMotion: "reduce" });
const page = await context.newPage();
page.on("pageerror", (err) => failures.push(`exception: ${err.message}`));

await page.goto(BASE + "/", { waitUntil: "networkidle" });

for (const route of ROUTES) {
  await page.evaluate((h) => { location.hash = h; }, route.hash);
  await page.waitForSelector(".room-grid, .content-trust", { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(700);

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    // .rc-num là số watermark trang trí (aria-hidden) — miễn trừ WCAG 1.4.3.
    .exclude(".rc-num")
    .analyze();

  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  if (serious.length === 0) {
    console.log(`OK   ${route.id}`);
  } else {
    for (const v of serious) {
      failures.push(`[${route.id}] ${v.id} (${v.impact}) — ${v.nodes.length} nút: ${v.help}`);
      console.log(`ERR  ${route.id}: ${v.id} (${v.impact}) ×${v.nodes.length}`);
    }
  }
}

await Promise.race([browser.close(), new Promise((resolve) => setTimeout(resolve, 3000))]);

console.log("\n=== KẾT QUẢ (axe a11y) ===");
if (failures.length === 0) {
  console.log(`✅ ${ROUTES.length} trang không có vi phạm WCAG A/AA nghiêm trọng.`);
  process.exit(0);
} else {
  console.log(`❌ ${failures.length} vi phạm nghiêm trọng:`);
  failures.forEach((f) => console.log("  - " + f));
  process.exit(1);
}
