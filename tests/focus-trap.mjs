// Test accessibility của ô tìm kiếm và chuyển route.
// 1) Dialog tìm kiếm giữ focus và trả focus đúng khi đóng.
// 2) Sau điều hướng SPA, focus chuyển tới heading của phòng để screen reader có ngữ cảnh.
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

await page.click("#searchBtn");
await page.waitForSelector(".search-overlay .search-input", { timeout: 5000 });
check(
  await page.evaluate(() => document.activeElement?.id === "searchInput"),
  "mở ô tìm → focus vào ô nhập",
);

const focusInsideBox = () =>
  page.evaluate(() => !!document.activeElement?.closest(".search-box"));

await page.keyboard.press("Tab");
check(await focusInsideBox(), "Tab → focus vẫn trong hộp thoại");

await page.keyboard.press("Shift+Tab");
check(await focusInsideBox(), "Shift+Tab → focus vẫn trong hộp thoại");

await page.keyboard.press("Escape");
await page.waitForSelector(".search-overlay", { state: "detached", timeout: 5000 }).catch(() => {});
check(
  await page.evaluate(() => document.activeElement?.id === "searchBtn"),
  "Esc → đóng và trả focus về nút 🔍",
);

// Native room button phải điều hướng và router chuyển focus đến heading mới.
await page.click(".room-card");
await page.waitForSelector(".room-head h2", { timeout: 5000 });
await page.waitForFunction(() => document.activeElement?.matches(".room-head h2"));
check(
  await page.evaluate(() => document.activeElement?.matches(".room-head h2")),
  "đổi phòng → focus chuyển tới tiêu đề phòng",
);
check(
  await page.evaluate(() => document.getElementById("routeStatus")?.textContent.trim().length > 0),
  "đổi phòng → live region thông báo route mới",
);

await Promise.race([browser.close(), new Promise((resolve) => setTimeout(resolve, 3000))]);

console.log("\n=== KẾT QUẢ (accessibility) ===");
if (failures.length === 0) {
  console.log("✅ Focus trap và focus management hoạt động đúng.");
  process.exit(0);
} else {
  console.log(`❌ ${failures.length} lỗi:`);
  failures.forEach((failure) => console.log("  - " + failure));
  process.exit(1);
}
