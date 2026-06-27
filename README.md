# 🧠 AI Explorer — Hiểu AI trong 15 phút

Một "bảo tàng AI tương tác" chạy hoàn toàn trên trình duyệt, không cần server backend,
không cần API key. Người dùng đi qua 7 "phòng", mỗi phòng giải thích trực quan một khái niệm
cốt lõi về AI và cho tự tay nghịch.

## Hành trình

| # | Phòng | Câu hỏi trả lời |
|---|-------|-----------------|
| 01 | 📸 Tự tay dạy AI | AI học như thế nào? (webcam, dạy bằng ví dụ) |
| 02 | 🕸️ Bên trong mạng nơ-ron | Bên trong AI là gì? (mạng nơ-ron huấn luyện trực tiếp) |
| 03 | 🎯 Học vẹt hay hiểu thật? | Overfitting — AI nhớ bài cũ nhưng làm sai bài mới |
| 04 | 🌳 Cây quyết định | Loại AI minh bạch, nhìn thấy được từng luật |
| 05 | ✂️ Token là gì | AI đọc chữ kiểu gì? (cắt token + chi phí) |
| 06 | 🗺️ Bản đồ ý nghĩa | AI hiểu nghĩa từ ra sao? (vua − đàn ông + đàn bà = nữ hoàng) |
| 07 | 👁️ AI đọc câu của bạn | Cơ chế attention — "nó" trỏ về đâu? |
| 08 | 🎲 Máy đoán chữ | Vì sao AI đôi khi đoán bừa? (hallucination) |
| 09 | 🎨 AI tạo ảnh thế nào | Diffusion — từ nhiễu thành ảnh rõ dần |
| 10 | ⚖️ AI có thiên kiến? | AI học cả định kiến từ dữ liệu |
| 11 | 🤖 Chatbot mini | Ghép tất cả khái niệm lại thành một trợ lý |
| 12 | 🎓 Tổng kết | Quiz + huy hiệu hoàn thành |

## Cách chạy

Dự án dùng ES modules nên cần chạy qua một HTTP server cục bộ (không mở trực tiếp file).

**Cách 1 — Python (có sẵn trên hầu hết máy):**
```
cd d:\AI_App\ai-explorer
python -m http.server 8000
```
Rồi mở http://localhost:8000

**Cách 2 — VS Code:** cài extension "Live Server", bấm chuột phải vào `index.html` → "Open with Live Server".

> Lưu ý: phòng 01 (webcam) cần quyền camera và phải chạy qua `localhost` hoặc HTTPS — đây là yêu cầu bảo mật của trình duyệt.

## Cấu trúc

```
ai-explorer/
├── index.html          # Khung trang + meta chia sẻ + favicon
├── style.css           # Toàn bộ giao diện (font Space Grotesk + Inter, glassmorphism, theming theo phòng)
├── app.js              # Router + điều hướng + thanh tiến trình + phím mũi tên + toolbar
├── fx.js               # Nền mạng nơ-ron động (canvas)
├── sound.js            # Âm thanh Web Audio + hiệu ứng confetti
├── store.js            # Lưu tiến trình & điểm quiz vào localStorage
├── rooms/              # Mỗi phòng là một module độc lập
│   ├── home.js         # Trang chủ + tiến trình + nút tiếp tục
│   ├── teachable.js    # Webcam KNN (thuần JS)
│   ├── neural-net.js   # MLP 2→H→1 huấn luyện trên trình duyệt
│   ├── overfitting.js  # Học vẹt vs hiểu thật (train vs test)
│   ├── decision-tree.js# Cây quyết định tương tác
│   ├── tokenizer.js    # Cắt token + đếm chi phí
│   ├── embeddings.js   # Bản đồ từ + phép loại suy
│   ├── attention.js    # Trực quan hóa attention
│   ├── next-token.js   # Mô hình bigram/trigram sinh chữ
│   ├── diffusion.js    # Mô phỏng tạo ảnh từ nhiễu
│   ├── bias.js         # Liên tưởng giới tính theo nghề
│   ├── chatbot.js      # Chatbot mini + pipeline trực quan
│   └── summary.js      # Tổng kết + quiz + huy hiệu + chia sẻ
└── data/
    └── embeddings.js   # Vector 2D tính sẵn cho các từ
```

## Tính năng

- 7 phòng tương tác, mỗi phòng một tông màu chủ đề.
- Nền mạng nơ-ron động, hiệu ứng xuất hiện mượt.
- Âm thanh phản hồi (bật/tắt được) + confetti khi hoàn thành quiz.
- Quiz 6 câu + huy hiệu theo cấp, tải được thành ảnh PNG để khoe.
- Chế độ trình chiếu toàn màn hình, điều hướng bằng phím ←/→.
- Gợi ý onboarding cho từng phòng.
- Ghi nhớ tiến trình & điểm cao nhất qua localStorage.
- Tối ưu cho cả điện thoại.
- **PWA**: cài được như app, chạy offline (service worker cache toàn bộ asset).
- Tôn trọng tùy chọn "giảm chuyển động" của hệ điều hành (accessibility).
- Mục "Tìm hiểu thêm" với các nguồn học AI trực quan uy tín.

## Tạo lại icon

Icon PWA được sinh bằng script:
```
python gen_icons.py
```

## Mở rộng thêm phòng mới

Kiến trúc module hóa: chỉ cần tạo `rooms/ten-phong.js` export một hàm `render(root)`,
rồi thêm một mục vào mảng `ROOMS` trong `app.js`. Khung sườn (tiêu đề, điều hướng, thanh tiến trình)
được xử lý tự động.
