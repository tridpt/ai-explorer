// Test tương tác: bẫy focus của ô tìm kiếm phòng (accessibility).
// Kiểm tra ba điều:
//   1. Mở ô tìm (bấm 🔍) → focus vào ô nhập.
//   2. Nhấn Tab / Shift+Tab → focus VẪN nằm trong hộp thoại (không "rò" ra ngoài).
//   3. Nhấn Esc để đóng → focus trả về đúng nút 🔍 đã mở.
//
// Chạy cục bộ:  node tests/focus-trap.mjs  (cần server tại http://localhost:8000)
// Trong CI:     xem .github/workflows/deploy.yml (job "test").
import { chromium } from "playwright";

const BASE = process.env.SMOKE_BASE || "http://localhost:8000";
const failures = [];
function check(cond, msg) {
  if (cond) console.log(`OK   ${msg}`);
  else { console.log(`ERR  ${msg}`); failures.push(msg); }
}

const browser = await chromium.launch();
const page = await browser.newPage();
page.on("pageerror", (err) => failures.push(`exception: ${err.message}`));

await page.goto(BASE + "/", { waitUntil: "networkidle" });

// 1) Mở ô tìm kiếm bằng nút 🔍, focus phải vào ô nhập.
await page.click("#searchBtn");
await page.waitForSelector(".search-overlay .search-input", { timeout: 5000 });
check(
  await page.evaluate(() => document.activeElement?.id === "searchInput"),
  "mở ô tìm → focus vào ô nhập",
);

// Helper: activeElement có nằm trong .search-box không?
const focusInsideBox = () =>
  page.evaluate(() => !!document.activeElement?.closest(".search-box"));

// 2) Tab và Shift+Tab đều phải giữ focus bên trong hộp thoại.
await page.keyboard.press("Tab");
check(await focusInsideBox(), "Tab → focus vẫn trong hộp thoại");

await page.keyboard.press("Shift+Tab");
check(await focusInsideBox(), "Shift+Tab → focus vẫn trong hộp thoại");

// 3) Esc đóng overlay và trả focus về nút 🔍.
await page.keyboard.press("Escape");
await page.waitForSelector(".search-overlay", { state: "detached", timeout: 5000 }).catch(() => {});
check(
  await page.evaluate(() => document.activeElement?.id === "searchBtn"),
  "Esc → đóng và trả focus về nút 🔍",
);

await Promise.race([browser.close(), new Promise((r) => setTimeout(r, 3000))]);

console.log("\n=== KẾT QUẢ (focus-trap) ===");
if (failures.length === 0) {
  console.log("✅ Bẫy focus của ô tìm kiếm hoạt động đúng.");
  process.exit(0);
} else {
  console.log(`❌ ${failures.length} lỗi:`);
  failures.forEach((f) => console.log("  - " + f));
  process.exit(1);
}
