// Test PWA: worker active/controller, update toast thật, và offline behavior.
import { chromium } from "playwright";

const BASE = process.env.SMOKE_BASE || "http://localhost:8000";
const failures = [];
function check(cond, msg) {
  if (cond) console.log(`OK   ${msg}`);
  else { console.log(`ERR  ${msg}`); failures.push(msg); }
}

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
page.on("pageerror", (err) => failures.push(`exception: ${err.message}`));

await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.evaluate(async () => navigator.serviceWorker?.ready);
await page.reload({ waitUntil: "networkidle" });

check(
  await page.evaluate(() => !!navigator.serviceWorker?.controller),
  "service worker active và đang điều khiển trang",
);

// Gọi implementation thật từ pwa.js thay vì tái dựng một bản giả trong test.
const toastOk = await page.evaluate(async () => {
  let posted = null;
  const { notifyUpdate } = await import("./pwa.js");
  notifyUpdate({ postMessage: (message) => { posted = message; } });
  const toast = document.getElementById("updateToast");
  const hasStatusRole = toast?.getAttribute("role") === "status";
  toast?.querySelector("#updateReload")?.click();
  toast?.remove();
  return hasStatusRole && posted === "SKIP_WAITING";
});
check(toastOk, "toast cập nhật thật có status role và gửi SKIP_WAITING");

// Mô phỏng mất mạng: app shell và lazy room module vẫn phải mở từ cache.
await context.setOffline(true);
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForSelector(".room-grid", { timeout: 5000 });
await page.evaluate(() => { location.hash = "#/attention"; });
await page.waitForSelector(".attn-matrix .attn-cell", { timeout: 5000 });
check(true, "offline vẫn mở được phòng lazy-loaded");

// Asset không tồn tại phải fail, không được tráo thành index.html gây MIME error.
const missingAssetSafe = await page.evaluate(async () => {
  try {
    const response = await fetch("./missing-offline-module.js");
    return !response.headers.get("content-type")?.includes("text/html");
  } catch {
    return true;
  }
});
check(missingAssetSafe, "asset thiếu offline không fallback thành HTML");
await context.setOffline(false);

await Promise.race([browser.close(), new Promise((resolve) => setTimeout(resolve, 3000))]);

console.log("\n=== KẾT QUẢ (pwa) ===");
if (failures.length === 0) {
  console.log("✅ Update UI và offline cache hoạt động đúng.");
  process.exit(0);
} else {
  console.log(`❌ ${failures.length} lỗi:`);
  failures.forEach((failure) => console.log("  - " + failure));
  process.exit(1);
}
