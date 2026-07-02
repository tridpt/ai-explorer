"""Sinh ảnh Open Graph (1200x630) cho AI Explorer để preview đẹp khi chia sẻ."""
import math
import random
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
ACCENT = (110, 168, 254)
ACCENT2 = (176, 123, 255)
BG_TOP = (13, 10, 28)
BG_BOT = (7, 6, 15)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def font(size, bold=True):
    for name in (("arialbd.ttf" if bold else "arial.ttf"), "segoeuib.ttf", "DejaVuSans-Bold.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except Exception:
            continue
    return ImageFont.load_default()


img = Image.new("RGB", (W, H), BG_TOP)
d = ImageDraw.Draw(img)

# nền gradient chéo
for y in range(H):
    d.line([(0, y), (W, y)], fill=lerp(BG_TOP, BG_BOT, y / H))

# quầng sáng accent góc phải
glow = Image.new("RGB", (W, H), BG_BOT)
gd = ImageDraw.Draw(glow)
for r in range(420, 0, -6):
    t = r / 420
    col = lerp(BG_BOT, ACCENT, (1 - t) * 0.5)
    gd.ellipse([W - 300 - r, -120 - r, W - 300 + r, -120 + r], fill=col)
img = Image.blend(img, glow, 0.5)
d = ImageDraw.Draw(img)

# mạng nơ-ron cách điệu
random.seed(11)
nodes = [(random.uniform(60, W - 60), random.uniform(60, H - 60)) for _ in range(22)]
for i in range(len(nodes)):
    for j in range(i + 1, len(nodes)):
        dist = math.hypot(nodes[i][0] - nodes[j][0], nodes[i][1] - nodes[j][1])
        if dist < 220:
            col = lerp(ACCENT, ACCENT2, j / len(nodes))
            d.line([nodes[i], nodes[j]], fill=col, width=1)
for k, (x, y) in enumerate(nodes):
    col = lerp(ACCENT, ACCENT2, k / len(nodes))
    d.ellipse([x - 4, y - 4, x + 4, y + 4], fill=col)

# lớp phủ tối nhẹ để chữ nổi
overlay = Image.new("RGB", (W, H), (0, 0, 0))
img = Image.blend(img, overlay, 0.28)
d = ImageDraw.Draw(img)

# nội dung chữ
d.text((70, 150), "🧠", font=font(90), fill=(244, 242, 251))
d.text((70, 250), "AI Explorer", font=font(96), fill=(244, 242, 251))

# gạch gradient dưới tiêu đề
d.rectangle([74, 360, 360, 368], fill=ACCENT)

d.text((74, 396), "Hiểu AI trong 15 phút", font=font(46, bold=False), fill=(200, 205, 225))
d.text((74, 470), "Tự tay dạy AI · Nhìn vào bên trong · Khám phá giới hạn",
       font=font(30, bold=False), fill=(150, 160, 190))

# nhãn phòng nhỏ góc dưới
chips = ["Mạng nơ-ron", "Embeddings", "Attention", "Diffusion", "Chatbot"]
x = 74
for c in chips:
    tw = d.textlength(c, font=font(24, bold=False))
    d.rounded_rectangle([x, 540, x + tw + 34, 585], radius=22, outline=ACCENT, width=2)
    d.text((x + 17, 550), c, font=font(24, bold=False), fill=(200, 205, 225))
    x += tw + 52

img.save("og.png")
print("Đã tạo og.png (1200x630)")
