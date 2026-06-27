# Hướng dẫn đưa AI Explorer lên GitHub Pages

Repo local đã sẵn sàng (đã `git init` + commit trên nhánh `main`).
Workflow tự động deploy đã có ở `.github/workflows/deploy.yml`.

## Bước 1 — Tạo repo trống trên GitHub
1. Vào https://github.com/new
2. Đặt tên, ví dụ: `ai-explorer`
3. Để **Public** (cần thiết cho GitHub Pages miễn phí).
4. **KHÔNG** tích "Add a README", "Add .gitignore", "Add license"
   (để repo trống, tránh xung đột khi push).
5. Bấm **Create repository**.

## Bước 2 — Nối repo local với GitHub và push
Chạy trong thư mục `d:\AI_App\ai-explorer` (thay `<USERNAME>` bằng tên GitHub của bạn):

```bash
git remote add origin https://github.com/<USERNAME>/ai-explorer.git
git push -u origin main
```

## Bước 3 — Bật GitHub Pages bằng Actions
1. Trên trang repo → **Settings** → **Pages**.
2. Mục **Build and deployment** → **Source** → chọn **GitHub Actions**.
3. Xong. Mỗi lần `git push` lên `main`, workflow sẽ tự build & deploy.

## Bước 4 — Lấy link
- Vào tab **Actions** xem workflow "Deploy AI Explorer to GitHub Pages" chạy xong (dấu ✓ xanh).
- Link sẽ là: `https://<USERNAME>.github.io/ai-explorer/`

## Cập nhật về sau
Mỗi khi sửa code, chỉ cần:
```bash
git add -A
git commit -m "mô tả thay đổi"
git push
```
Site sẽ tự cập nhật sau ~1 phút.

## Lưu ý
- Mọi đường dẫn trong dự án đều là tương đối nên chạy tốt dưới đường dẫn con `/ai-explorer/`.
- PWA (cài app) và nút Chia sẻ sẽ hoạt động đầy đủ vì GitHub Pages có HTTPS sẵn.
- Nếu đổi tên repo, link sẽ đổi theo — không cần sửa code.
```
