// Đăng ký service worker + xử lý nút "Cài đặt ứng dụng".
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((err) =>
      console.warn("Đăng ký service worker thất bại:", err)
    );
  });
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
