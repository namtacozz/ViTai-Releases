# QUY TẮC BẢN PHÁT HÀNH & WEB THƯƠNG MẠI ViTai (ViTai-Releases)

> **QUAN TRỌNG & BẮT BUỘC TUÂN THỦ ĐỐI VỚI TẤT CẢ CÁC AGENT / DEVELOPER**:

---

## 1. Mục Đích & Vai Trò Của Repo ViTai-Releases
- Đây là repo phân phối thương mại chính thức của ViTai.
- Chứa toàn bộ source code của Landing Page (GitHub Pages: `https://namtacozz.github.io/ViTai-Releases/`) và các GitHub Releases nhị phân cho người dùng cuối.

---

## 2. Quy Tắc Cập Nhật Bản Phát Hành Mới (Release Protocol)
Mỗi khi có phiên bản mới (`vX.Y.Z`) được phát hành từ `ViTai-Core`:
1. **GitHub Release Assets**:
   - Mọi bản release trên `namtacozz/ViTai-Releases` phải chứa đầy đủ 4 file assets:
     - `ViTai-Windows-x64.zip` (Tên tĩnh để link tải không bao giờ đứt)
     - `ViTai-vX.Y.Z-windows-x64.zip` (Tên kèm tag phiên bản)
     - `ViTai-Linux-x86_64.tar.gz` (Tên tĩnh cho Linux)
     - `ViTai-vX.Y.Z-linux-x86_64.tar.gz` (Tên kèm tag phiên bản)
2. **Đồng Bộ Phiên Bản Trên Web**:
   - `app.js`: Đổi `const APP_VERSION = "X.Y.Z";`.
   - `index.html`: Cập nhật thẻ meta, title, version-pill, href của thẻ Windows và thẻ Linux.
   - `privacy.html`, `terms.html`, `styles.css`, `test-answers.json`, `README.md`: Cập nhật `vX.Y.Z`.
3. **Logic Nút Bấm Tải Về (`app.js`)**:
   - `detectUserOS()`: Tự động đổi link và nhãn nút Hero (`#hero-dl-btn`), nút mobile drawer (`#drawer-dl-btn`), thẻ Windows (`#dl-card-windows`), thẻ Linux (`#dl-card-linux`).
   - Mọi nút bấm tải về trên website BẮT BUỘC phải trỏ trực tiếp đến file binary của bản mới nhất `vX.Y.Z`.
4. **Kiểm Tra Xác Thực (BẮT BUỘC TRƯỚC KHI BÀN GIAO)**:
   - Chạy lệnh kiểm tra `curl.exe -I -L` đến cả hai link tải Windows và Linux để đảm bảo server trả về `HTTP/1.1 200 OK` và dung lượng file hợp lệ.
