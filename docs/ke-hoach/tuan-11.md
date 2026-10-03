# Tuần 11: 🏁 Đóng băng tính năng — Kiểm thử vòng 2, Viết báo cáo

**Mục tiêu tuần:** **KHÔNG thêm tính năng.** Chỉ sửa lỗi, làm gọn, viết báo cáo. Tính năng còn dở → **bỏ** (ẩn khỏi menu), ghi vào mục "Hạn chế, hướng phát triển".

---

## 👥 Cả nhóm
### N11.1 Kiểm thử vòng 2 (đổi cặp so với Tuần 7)
| Người thử | Thử module của |
|---|---|
| TV1 | TV3 |
| TV2 | TV4 |
| TV3 | TV1 |
| TV4 | TV2 |

Chạy lại **toàn bộ** `docs/kiem-thu.md` trên **bản online**, điền cột "Kết quả thực tế". Thêm dòng cho các tính năng nâng cao (PWA, QR, webhook, push, realtime).

### N11.2 Viết báo cáo phần mình (theo dàn ý ở [`08-van-dap-va-bao-cao.md`](../08-van-dap-va-bao-cao.md))
**Kết quả cần đạt:** mỗi người nộp cho TV1 phần của mình **trước thứ Năm**, gồm:
- Lý thuyết công nghệ mình làm (đã viết từ Tuần 8–10, giờ hoàn thiện)
- Thiết kế: sơ đồ luồng hoặc sơ đồ tuần tự của chức năng mình
- Triển khai: ảnh chụp màn hình (máy tính và điện thoại), đoạn code tiêu biểu (ngắn, có giải thích)
- Kiểm thử phần mình

**Gợi ý:** sơ đồ tuần tự viết bằng Mermaid (`sequenceDiagram`). Có thể nhờ AI chuyển mô tả luồng thành Mermaid, **nhưng phải kiểm tra lại cho đúng code thật**.

---

## 🧑‍💼 TV1: Tổng hợp báo cáo
**Kết quả cần đạt**
- Bản báo cáo đầy đủ (Word hoặc Google Docs theo mẫu của giáo viên): định dạng thống nhất, mục lục tự động, đánh số hình và bảng
- **Phụ lục đóng góp:** bảng công việc từng người kèm số liệu từ Git:
  ```bash
  git shortlog -sn --no-merges dev
  ```
  và danh sách biên bản họp
- Chương 1, 2, 7 do TV1 viết

**Checklist**
- [ ] Bản nháp đầy đủ gửi nhóm đọc chéo trước Chủ nhật
- [ ] Phụ lục đóng góp

## 🛠️ TV2: Bản phát hành cuối và dọn code
**Kết quả cần đạt**
- Dọn các `TODO` không còn làm, `console.log` thừa, code bị comment
- **Chia nhỏ bundle** để hết cảnh báo "chunk > 500 kB" khi build: dùng `React.lazy(() => import('./features/...'))` và `Suspense` cho các trang trong `router.tsx`
- `README.md`: thêm **link bản online**, tài khoản demo, ảnh chụp, hướng dẫn chạy đầy đủ
- Deploy bản cuối từ `main`, tag `v1.0-rc`
- Chương "Kiến trúc", "ERD", "Triển khai, deploy" trong báo cáo

**Checklist**
- [ ] Code gọn, build không cảnh báo
- [ ] README hoàn chỉnh
- [ ] Bản cuối online, tag `v1.0-rc`

## 🧮 TV3: Báo cáo kiểm thử và dữ liệu demo cuối
**Kết quả cần đạt**
- Chạy `npm test` → chụp kết quả; (nên có) độ bao phủ test: `npm i -D @vitest/coverage-v8` rồi `npx vitest run --coverage` → chụp bảng phần `billing`
- Chương Kiểm thử: unit test (liệt kê ca và ý nghĩa), kiểm thử thủ công (bảng từ `kiem-thu.md`), kiểm thử bảo mật (từ TV2)
- Seed bản cuối cho production: dữ liệu đẹp, đủ trạng thái, có 1 hóa đơn **chưa thanh toán** dành riêng để **demo quét QR**

**Checklist**
- [ ] Ảnh kết quả test và độ bao phủ
- [ ] Chương Kiểm thử
- [ ] Seed production bản demo

## 📱 TV4: Hình ảnh và video
**Kết quả cần đạt**
- Bộ **ảnh chụp màn hình** chất lượng cho báo cáo và slide: mọi trang chính trên máy tính, cổng khách thuê trên điện thoại (khung điện thoại), app đã cài trên màn hình chính, thông báo push
- Ảnh chụp **Lighthouse** (mobile)
- **Video demo dự phòng** 5–7 phút theo kịch bản demo (OBS hoặc Xbox Game Bar `Win + G`; quay màn hình điện thoại bằng tính năng có sẵn của máy)

**Checklist**
- [ ] Bộ ảnh chụp (thư mục `docs/images/`)
- [ ] Video demo dự phòng

---

## ✅ Cuối tuần: kiểm tra chung 🏁 Đóng băng
- [ ] Không còn lỗi 🔴; lỗi 🟡 còn lại đã ghi vào "Hạn chế"
- [ ] Báo cáo bản nháp đủ các chương
- [ ] Có video demo dự phòng
