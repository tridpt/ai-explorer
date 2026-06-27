// Nền sống động: các "nơ-ron" trôi nhẹ, nối với nhau khi ở gần — gợi hình ảnh mạng thần kinh.
// Màu tự đổi theo biến --accent của phòng hiện tại.
const canvas = document.getElementById("bgfx");
const ctx = canvas.getContext("2d");

let W, H, nodes;
const COUNT = 56;
const LINK_DIST = 150;

function accentRGB() {
  const c = getComputedStyle(document.documentElement).getPropertyValue("--accent-rgb").trim();
  return c || "110,168,254";
}

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}

function initNodes() {
  nodes = Array.from({ length: COUNT }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    vx: (Math.random() - 0.5) * 0.35,
    vy: (Math.random() - 0.5) * 0.35,
    r: Math.random() * 1.8 + 1.2,
  }));
}

function tick() {
  const rgb = accentRGB();
  ctx.clearRect(0, 0, W, H);

  for (const n of nodes) {
    n.x += n.vx;
    n.y += n.vy;
    if (n.x < 0 || n.x > W) n.vx *= -1;
    if (n.y < 0 || n.y > H) n.vy *= -1;
  }

  // đường nối
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const d = Math.hypot(dx, dy);
      if (d < LINK_DIST) {
        const a = (1 - d / LINK_DIST) * 0.18;
        ctx.strokeStyle = `rgba(${rgb},${a.toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.stroke();
      }
    }
  }

  // nút
  for (const n of nodes) {
    ctx.fillStyle = `rgba(${rgb},0.5)`;
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
    ctx.fill();
  }

  if (animate) requestAnimationFrame(tick);
}

let animate = true;

window.addEventListener("resize", resize);
resize();
initNodes();
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (reduceMotion) {
  // vẽ tĩnh một khung, không chạy hoạt ảnh liên tục
  animate = false;
  for (const n of nodes) { n.vx = 0; n.vy = 0; }
  tick();
} else {
  tick();
}
