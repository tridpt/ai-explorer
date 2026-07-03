"""Sinh ảnh Open Graph (1200x630) cho AI Explorer — phong cách Neo-brutalism."""
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
BG = (255, 251, 240)     # kem
INK = (17, 17, 17)
ORANGE = (255, 92, 0)
GREEN = (0, 179, 74)
YELLOW = (255, 225, 77)
PINK = (233, 30, 140)


def font(size, bold=True):
    for name in (("Archivo-Black.ttf" if bold else "Archivo-Regular.ttf"),
                 ("arialbd.ttf" if bold else "arial.ttf"), "segoeuib.ttf", "DejaVuSans-Bold.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except Exception:
            continue
    return ImageFont.load_default()


def hard_box(d, x, y, w, h, fill, shadow=14):
    d.rectangle([x + shadow, y + shadow, x + w + shadow, y + h + shadow], fill=INK)
    d.rectangle([x, y, x + w, y + h], fill=fill, outline=INK, width=5)


img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)

# viền khung dày kiểu brutalism
d.rectangle([16, 16, W - 16, H - 16], outline=INK, width=6)

# thanh nhãn trên
hard_box(d, 60, 70, 470, 60, YELLOW, shadow=8)
d.text((82, 86), "HANH TRINH TUONG TAC", font=font(28), fill=INK)

# tiêu đề
d.text((60, 165), "Hiểu", font=font(96), fill=INK)
# khối "AI" nổi bật
hard_box(d, 285, 170, 190, 110, ORANGE, shadow=10)
d.text((315, 182), "AI", font=font(90), fill=(255, 255, 255))
d.text((60, 300), "trong 15 phút", font=font(96), fill=INK)

# mô tả
d.text((62, 430), "Tự tay dạy AI · Nhìn vào bên trong · Khám phá giới hạn",
       font=font(30, bold=False), fill=(75, 70, 58))

# các chip phòng
chips = [("21 PHÒNG", GREEN), ("VN / EN", PINK), ("CHẠY TRÊN TRÌNH DUYỆT", ORANGE)]
x = 62
for text, col in chips:
    w = int(d.textlength(text, font=font(24))) + 40
    hard_box(d, x, 500, w, 52, col, shadow=6)
    d.text((x + 20, 512), text, font=font(24), fill=(255, 255, 255))
    x += w + 26

# emoji khối lớn góc phải
hard_box(d, 900, 150, 220, 220, "#cdefff" if False else (205, 239, 255), shadow=12)
try:
    d.text((960, 200), "🧠", font=font(120), fill=INK)
except Exception:
    pass

img.save("og.png")
print("Đã tạo og.png brutalism (1200x630)")
