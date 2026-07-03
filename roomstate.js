// Quản lý "deep-link": trạng thái của từng phòng được mã hóa vào query của hash.
// Ví dụ: #/tokenizer?text=Xin%20chào  hoặc  #/diffusion?prompt=2
// Nhờ vậy có thể chia sẻ đúng một demo cụ thể, không chỉ mở phòng.

// Tách hash thành { id, params } — id là tên phòng, params là URLSearchParams.
export function parseHash(hash = location.hash) {
  const raw = hash.replace(/^#\/?/, "");
  const qi = raw.indexOf("?");
  if (qi === -1) return { id: raw || "home", params: new URLSearchParams() };
  return {
    id: raw.slice(0, qi) || "home",
    params: new URLSearchParams(raw.slice(qi + 1)),
  };
}

// Lấy toàn bộ tham số của phòng hiện tại.
export function getParams() {
  return parseHash().params;
}

// Lấy một tham số (đã tự giải mã), trả về fallback nếu không có.
export function getParam(key, fallback = null) {
  const v = getParams().get(key);
  return v === null ? fallback : v;
}

// Ghép lại hash từ id + object tham số (bỏ qua giá trị null/undefined/"").
function buildHash(id, paramsObj) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(paramsObj || {})) {
    if (v === null || v === undefined || v === "") continue;
    sp.set(k, String(v));
  }
  const q = sp.toString();
  const base = id === "home" ? "" : `#/${id}`;
  return q ? `${base}?${q}` : base;
}

// Cập nhật tham số của phòng hiện tại mà KHÔNG kích hoạt điều hướng lại
// (dùng history.replaceState nên không phát sự kiện hashchange).
export function setParams(paramsObj) {
  const { id } = parseHash();
  const newHash = buildHash(id, paramsObj) || "#/";
  history.replaceState(null, "", newHash);
}

// Tạo URL tuyệt đối để chia sẻ một phòng kèm trạng thái tùy chọn.
export function buildShareUrl(id, paramsObj) {
  const hash = buildHash(id, paramsObj);
  return location.origin + location.pathname + hash;
}
