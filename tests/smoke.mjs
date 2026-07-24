// Smoke test: mở app bằng Chromium (Playwright), duyệt qua TẤT CẢ các phòng,
// và fail nếu có bất kỳ lỗi console / exception / request hỏng nào.
//
// Danh sách phòng được ĐỌC TRỰC TIẾP từ app.js nên phòng mới thêm sau này
// sẽ tự động được kiểm tra, không cần sửa file này.
//
// Chạy cục bộ:  node tests/smoke.mjs  (cần server tại http://localhost:8000)
// Trong CI:     xem .github/workflows/deploy.yml (job "test").
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.SMOKE_BASE || "http://localhost:8000";

// Trích các id phòng từ mảng ROOM_META trong rooms-meta.js (nguồn dữ liệu phòng).
function readRoomIds() {
  const src = readFileSync(join(__dirname, "..", "rooms-meta.js"), "utf8");
  const start = src.indexOf("export const ROOM_META");
  const end = src.indexOf("];", start);
  const block = src.slice(start, end);
  const ids = [...block.matchAll(/id:\s*"([^"]+)"/g)].map((m) => m[1]);
  return [...new Set(ids)];
}

const rooms = readRoomIds();
if (rooms.length < 5) {
  console.error(`✗ Chỉ đọc được ${rooms.length} phòng từ app.js — có gì đó sai.`);
  process.exit(2);
}

// Bỏ qua vài lỗi "nhiễu" không phải do code app (vd: webcam không có trong CI).
const IGNORE = [
  /Permission|getUserMedia|NotAllowedError|NotFoundError/i, // phòng webcam trên CI không có camera
  /favicon/i,
];

function ignored(text) {
  return IGNORE.some((re) => re.test(text));
}

const failures = [];

const browser = await chromium.launch();
const page = await browser.newPage();

let currentRoom = "(init)";
page.on("console", (msg) => {
  if (msg.type() === "error") {
    const text = msg.text();
    if (!ignored(text)) failures.push(`[${currentRoom}] console.error: ${text}`);
  }
});
page.on("pageerror", (err) => {
  if (!ignored(err.message)) failures.push(`[${currentRoom}] exception: ${err.message}`);
});
page.on("requestfailed", (req) => {
  const url = req.url();
  if (!ignored(url)) failures.push(`[${currentRoom}] request failed: ${url}`);
});

// Tải trang chủ trước.
currentRoom = "home";
await page.goto(BASE + "/", { waitUntil: "networkidle" });

for (const id of rooms) {
  currentRoom = id;
  const before = failures.length;
  await page.evaluate((r) => { location.hash = "#/" + r; }, id);
  // Chờ khung phòng render (tiêu đề .room-head) rồi thêm nhịp cho canvas/animation.
  await page.waitForSelector(".room-head, .hero", { timeout: 5000 }).catch(() => {});
  await page.waitForSelector(".content-trust", { timeout: 5000 }).catch(() =>
    failures.push(`[${currentRoom}] thiếu panel phạm vi mô phỏng/nguồn`)
  );
  const sourceCount = await page.locator(".content-trust .trust-sources a").count();
  if (sourceCount < 1) failures.push(`[${currentRoom}] panel không có nguồn tham khảo`);
  // Chờ thêm một nhịp cho canvas/animation và lỗi bất đồng bộ.
  await page.waitForTimeout(500);
  const errs = failures.length - before;
  console.log(`${errs === 0 ? "OK " : "ERR"}  ${id}${errs ? `  (${errs} lỗi)` : ""}`);
}

// Kiểm tra thêm: quay lại home render được lưới phòng.
currentRoom = "home-return";
await page.evaluate(() => { location.hash = ""; });
await page.waitForSelector(".room-grid", { timeout: 5000 }).catch(() =>
  failures.push("[home] không render được .room-grid")
);

// Đóng browser nhưng không chờ quá lâu (đôi khi Chromium đóng chậm trên Windows).
await Promise.race([browser.close(), new Promise((r) => setTimeout(r, 3000))]);

console.log("\n=== KẾT QUẢ ===");
if (failures.length === 0) {
  console.log(`✅ ${rooms.length} phòng render sạch, không lỗi console/exception.`);
  process.exit(0);
} else {
  console.log(`❌ ${failures.length} lỗi:`);
  failures.forEach((f) => console.log("  - " + f));
  process.exit(1);
}
