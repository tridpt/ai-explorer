// Đăng ký service worker + xử lý nút "Cài đặt ứng dụng".
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").then((reg) => {
      // Nếu đã có worker mới đang "chờ" ngay lúc tải, mời người dùng cập nhật.
      if (reg.waiting) notifyUpdate(reg.waiting);

      // Worker mới được tìm thấy → theo dõi tới khi cài xong và vào trạng thái chờ.
      reg.addEventListener("updatefound", () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener("statechange", () => {
          // Chỉ báo khi đã có controller (tức là bản cũ đang chạy), tránh báo ở lần cài đầu.
          if (nw.state === "installed" && navigator.serviceWorker.controller) {
            notifyUpdate(nw);
          }
        });
      });
    }).catch((err) =>
      console.warn("Đăng ký service worker thất bại:", err)
    );

    // Khi worker mới chiếm quyền, tải lại một lần để dùng asset mới.
    let reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    });
  });
}

// Toast "Có bản mới — Tải lại?" (song ngữ theo <html lang>). Bấm → kích hoạt worker mới.
function notifyUpdate(worker) {
  if (document.getElementById("updateToast")) return;
  const en = document.documentElement.lang === "en";
  const t = document.createElement("div");
  t.id = "updateToast";
  t.className = "toast toast-update";
  t.innerHTML =
    `<span>${en ? "A new version is available." : "Đã có bản mới."}</span>` +
    `<button id="updateReload" class="toast-btn">${en ? "Reload" : "Tải lại"}</button>` +
    `<button id="updateDismiss" class="toast-x" aria-label="${en ? "Dismiss" : "Bỏ qua"}">✕</button>`;
  document.body.appendChild(t);
  t.querySelector("#updateReload").onclick = () => worker.postMessage("SKIP_WAITING");
  t.querySelector("#updateDismiss").onclick = () => {
    t.classList.add("hide");
    t.addEventListener("animationend", () => t.remove(), { once: true });
  };
}

let deferredPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallButton();
});

function showInstallButton() {
  const toolbar = document.querySelector(".toolbar");
  if (!toolbar || document.getElementById("installBtn")) return;
  const btn = document.createElement("button");
  btn.id = "installBtn";
  btn.className = "tool-btn";
  btn.title = "Cài đặt ứng dụng";
  btn.textContent = "⬇";
  btn.onclick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    btn.remove();
  };
  toolbar.prepend(btn);
}

window.addEventListener("appinstalled", () => {
  document.getElementById("installBtn")?.remove();
  deferredPrompt = null;
});
