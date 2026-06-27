"""Sinh icon PWA cho AI Explorer (gradient + mạng nơ-ron cách điệu + chữ AI)."""
import math
import random
from PIL import Image, ImageDraw, ImageFont

ACCENT = (110, 168, 254)
ACCENT2 = (176, 123, 255)
BG_TOP = (13, 10, 28)
BG_BOT = (26, 19, 48)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def make_icon(size, maskable=False):
    img = Image.new("RGB", (size, size), BG_TOP)
    d = ImageDraw.Draw(img)

    # nền gradient dọc
    for y in range(size):
        d.line([(0, y), (size, y)], fill=lerp(BG_TOP, BG_BOT, y / size))

    # mạng nơ-ron cách điệu
    random.seed(7)
    pad = size * (0.22 if maskable else 0.14)
    nodes = [(random.uniform(pad, size - pad), random.uniform(pad, size - pad)) for _ in range(9)]
    link = size * 0.42
    for i in range(len(nodes)):
        for j in range(i + 1, len(nodes)):
            dx = nodes[i][0] - nodes[j][0]
            dy = nodes[i][1] - nodes[j][1]
            dist = math.hypot(dx, dy)
            if dist < link:
                a = int(90 * (1 - dist / link))
                col = lerp(ACCENT, ACCENT2, j / len(nodes))
                d.line([nodes[i], nodes[j]], fill=col + (a,) if False else col, width=max(1, size // 200))
    for k, (x, y) in enumerate(nodes):
        r = size * 0.018
        col = lerp(ACCENT, ACCENT2, k / len(nodes))
        d.ellipse([x - r, y - r, x + r, y + r], fill=col)

    # chữ "AI"
    try:
        font = ImageFont.truetype("arialbd.ttf", int(size * 0.42))
    except Exception:
        font = ImageFont.load_default()
    text = "AI"
    bbox = d.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = (size - tw) / 2 - bbox[0]
    ty = (size - th) / 2 - bbox[1]
    # bóng nhẹ
    d.text((tx + size * 0.01, ty + size * 0.01), text, font=font, fill=(0, 0, 0))
    d.text((tx, ty), text, font=font, fill=(244, 242, 251))
    return img


import os
os.makedirs("icons", exist_ok=True)
make_icon(192).save("icons/icon-192.png")
make_icon(512).save("icons/icon-512.png")
make_icon(512, maskable=True).save("icons/icon-maskable-512.png")
print("Đã tạo icons/icon-192.png, icon-512.png, icon-maskable-512.png")
