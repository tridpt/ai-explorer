// Thống kê ẩn danh, nhẹ, tôn trọng quyền riêng tư — dùng GoatCounter (miễn phí).
// KHÔNG dùng cookie, KHÔNG theo dõi cá nhân. Chỉ đếm lượt xem mỗi phòng.
//
// CÁCH BẬT:
// 1. Tạo tài khoản miễn phí tại https://www.goatcounter.com (chọn một "code", ví dụ "ai-explorer").
// 2. Dán mã đó vào ANALYTICS_CODE bên dưới (chỉ phần code, không cần URL đầy đủ).
// 3. Commit + push. Xong — số liệu xem tại https://<code>.goatcounter.com
//
// Để trống => tắt hoàn toàn, không tải gì, không gửi gì.
const ANALYTICS_CODE = ""; // ví dụ: "ai-explorer"

let ready = false;

export function initAnalytics() {
  if (!ANALYTICS_CODE) return; // tắt
  const s = document.createElement("script");
  s.async = true;
  s.dataset.goatcounter = `https://${ANALYTICS_CODE}.goatcounter.com/count`;
  s.src = "//gc.zgo.at/count.js";
  s.onload = () => { ready = true; };
  document.head.appendChild(s);
}

// Gọi mỗi khi chuyển phòng (SPA nên phải đếm thủ công)
export function trackView(path, title) {
  if (!ANALYTICS_CODE) return;
  const send = () => window.goatcounter?.count({ path, title, event: false });
  if (ready && window.goatcounter) send();
  else setTimeout(() => window.goatcounter && send(), 800); // đợi script tải xong
}
