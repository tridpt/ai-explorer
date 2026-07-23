// Đăng ký service worker + xử lý nút "Cài đặt ứng dụng".
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").then((reg) => {
      if (reg.waiting) notifyUpdate(reg.waiting);

      reg.addEventListener("updatefound", () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener("statechange", () => {
          if (nw.state === "installed" && navigator.serviceWorker.controller) {
            notifyUpdate(nw);
          }
        });
      });
    }).catch((err) =>
      console.warn("Đăng ký service worker thất bại:", err)
    );

    let reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    });
  });
}

// Export để UI và test gọi đúng cùng một implementation, không tái dựng logic giả.
export function notifyUpdate(worker) {
  if (document.getElementById("updateToast")) return;
  const en = document.documentElement.lang === "en";
  const t = document.createElement("div");
  t.id = "updateToast";
  t.className = "toast toast-update";
  t.setAttribute("role", "status");
  t.setAttribute("aria-live", "polite");
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

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event;
  showInstallButton();
});

function showInstallButton() {
  const toolbar = document.querySelector(".toolbar");
  if (!toolbar || document.getElementById("installBtn")) return;
  const en = document.documentElement.lang === "en";
  const label = en ? "Install AI Explorer" : "Cài đặt AI Explorer";
  const btn = document.createElement("button");
  btn.id = "installBtn";
  btn.className = "tool-btn";
  btn.title = label;
  btn.setAttribute("aria-label", label);
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
