// Thống kê ẩn danh, nhẹ, tôn trọng quyền riêng tư — dùng GoatCounter (miễn phí).
// KHÔNG dùng cookie, KHÔNG theo dõi cá nhân, KHÔNG gửi nội dung người dùng nhập.
// Chỉ đếm lượt xem mỗi phòng (đường dẫn + tiêu đề). Xem chi tiết ở privacy.html.
//
// CÁCH BẬT:
// 1. Tạo tài khoản miễn phí tại https://www.goatcounter.com (chọn một "code", ví dụ "ai-explorer").
// 2. Dán mã đó vào ANALYTICS_CODE bên dưới (chỉ phần code, không cần URL đầy đủ).
// 3. Commit + push. Xong — số liệu xem tại https://<code>.goatcounter.com
//
// Để trống => tắt hoàn toàn, không tải gì, không gửi gì.
const ANALYTICS_CODE = ""; // ví dụ: "ai-explorer"

let ready = false;

// Tôn trọng tín hiệu riêng tư của trình duyệt: Do Not Track (DNT) và
// Global Privacy Control (GPC). Nếu người dùng bật, KHÔNG tải/không gửi gì.
function privacyOptOut() {
  try {
    if (navigator.doNotTrack === "1" || window.doNotTrack === "1") return true;
    if (navigator.globalPrivacyControl === true) return true;
  } catch { /* ignore */ }
  return false;
}

// Chỉ cho phép đếm path điều hướng nội bộ ("/" hoặc "/<id>"), không kèm query/hash.
// Đây là lớp chặn phòng hờ để không bao giờ gửi trạng thái deep-link người dùng nhập.
function safePath(path) {
  const p = String(path || "/").split(/[?#]/)[0];
  return p.startsWith("/") ? p : "/" + p;
}

export function initAnalytics() {
  if (!ANALYTICS_CODE || privacyOptOut()) return; // tắt
  const s = document.createElement("script");
  s.async = true;
  s.dataset.goatcounter = `https://${ANALYTICS_CODE}.goatcounter.com/count`;
  s.src = "//gc.zgo.at/count.js";
  s.onload = () => { ready = true; };
  document.head.appendChild(s);
}

// Gọi mỗi khi chuyển phòng (SPA nên phải đếm thủ công)
export function trackView(path, title) {
  if (!ANALYTICS_CODE || privacyOptOut()) return;
  const clean = safePath(path);
  const send = () => window.goatcounter?.count({ path: clean, title, event: false });
  if (ready && window.goatcounter) send();
  else setTimeout(() => window.goatcounter && send(), 800); // đợi script tải xong
}
