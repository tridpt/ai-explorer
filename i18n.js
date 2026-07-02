// Hệ thống song ngữ VN/EN.
// tx(obj)      -> lấy chuỗi theo ngôn ngữ từ object { vi, en }
// tx(vi, en)   -> chọn nhanh giữa hai chuỗi
// setLang(l)   -> đổi ngôn ngữ và phát sự kiện "langchange" để app render lại
let lang = localStorage.getItem("ai-explorer-lang") || "vi";

export function getLang() { return lang; }

export function setLang(l) {
  if (l !== "vi" && l !== "en") return;
  lang = l;
  localStorage.setItem("ai-explorer-lang", l);
  document.documentElement.lang = l;
  window.dispatchEvent(new CustomEvent("langchange", { detail: l }));
}

export function tx(a, b) {
  if (a && typeof a === "object") return a[lang] ?? a.vi; // tx({vi,en})
  return lang === "en" ? b : a;                            // tx("vi","en")
}

document.documentElement.lang = lang;
