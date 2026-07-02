<p align="center">
  <img src="og.png" alt="AI Explorer" width="640" />
</p>

<h1 align="center">🧠 AI Explorer — Hiểu AI trong 15 phút</h1>

<p align="center">
  <b><a href="https://tridpt.github.io/ai-explorer/">🚀 Dùng thử ngay »</a></b>
</p>

<p align="center">
  <img alt="rooms" src="https://img.shields.io/badge/ph%C3%B2ng-17-6ea8fe" />
  <img alt="languages" src="https://img.shields.io/badge/ng%C3%B4n%20ng%E1%BB%AF-VN%20%2F%20EN-b07bff" />
  <img alt="pwa" src="https://img.shields.io/badge/PWA-c%C3%A0i%20%C4%91%C6%B0%E1%BB%A3c-34d399" />
  <img alt="backend" src="https://img.shields.io/badge/backend-kh%C3%B4ng%20c%E1%BA%A7n-f59e0b" />
</p>

Một "bảo tàng AI tương tác" chạy **hoàn toàn trên trình duyệt** — không cần server backend,
không cần API key. Bạn đi qua 17 "phòng", mỗi phòng giải thích trực quan một khái niệm cốt lõi
về AI và cho **tự tay nghịch**: dạy AI qua webcam, huấn luyện mạng nơ-ron, xem AI tạo ảnh,
trò chuyện với chatbot mini... Song ngữ Việt–Anh, cài được như app, chạy cả khi offline.

> 🌐 **Bản song ngữ:** bấm nút **EN/VI** ở góc trên bên phải để đổi ngôn ngữ bất cứ lúc nào.

## Hành trình

| # | Phòng | Câu hỏi trả lời |
|---|-------|-----------------|
| 01 | 📸 Tự tay dạy AI | AI học như thế nào? (webcam, dạy bằng ví dụ) |
| 02 | 🕸️ Bên trong mạng nơ-ron | Bên trong AI là gì? (mạng nơ-ron huấn luyện trực tiếp) |
| 03 | 🎯 Học vẹt hay hiểu thật? | Overfitting — AI nhớ bài cũ nhưng làm sai bài mới |
| 04 | 🌳 Cây quyết định | Loại AI minh bạch, nhìn thấy được từng luật |
| 05 | 🤖 Học qua thử và sai | Reinforcement learning — robot học bằng thưởng/phạt |
| 06 | 🧲 Tự phân nhóm | Unsupervised — AI tự gom nhóm không cần nhãn |
| 07 | ✂️ Token là gì | AI đọc chữ kiểu gì? (cắt token + chi phí) |
| 08 | 🗺️ Bản đồ ý nghĩa | AI hiểu nghĩa từ ra sao? (vua − đàn ông + đàn bà = nữ hoàng) |
| 09 | 👁️ AI đọc câu của bạn | Cơ chế attention — "nó" trỏ về đâu? |
| 10 | 🎲 Máy đoán chữ | Vì sao AI đôi khi đoán bừa? (hallucination) |
| 11 | 🎨 AI tạo ảnh thế nào | Diffusion — từ nhiễu thành ảnh rõ dần |
| 12 | 📺 Vì sao app hiểu bạn | Gợi ý — cơ chế sau TikTok/YouTube/Netflix |
| 13 | ⚖️ AI có thiên kiến? | AI học cả định kiến từ dữ liệu |
| 14 | 🐺 Đánh lừa AI | Adversarial — nhiễu vô hình khiến AI nhìn sai |
| 15 | 🕵️ Người hay AI viết? | Rèn con mắt phân biệt văn người / AI |
| 16 | 💬 Chatbot mini | Ghép tất cả khái niệm lại thành một trợ lý |
| 17 | 🎓 Tổng kết | Quiz + huy hiệu hoàn thành |

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
├── style.css           # Toàn bộ giao diện (Neo-brutalism: Archivo + Space Mono, viền dày + bóng cứng)
├── app.js              # Router + điều hướng + thanh tiến trình + phím mũi tên + toolbar + i18n
├── i18n.js             # Song ngữ VN/EN
├── analytics.js        # Thống kê ẩn danh (GoatCounter, tùy chọn)
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

- 17 phòng tương tác, mỗi phòng một tông màu chủ đề.
- Giao diện Neo-brutalism (viền đen dày, bóng cứng, khối màu rực).
- Âm thanh phản hồi (bật/tắt được) + confetti khi hoàn thành quiz.
- Quiz + huy hiệu theo cấp, tải được thành ảnh PNG để khoe.
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
