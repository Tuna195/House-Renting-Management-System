# Tuần 2: Phân tích và thiết kế 🏁

**Mục tiêu tuần:** chốt *làm gì* và *tính tiền thế nào* trước khi code. Cuối tuần có bộ tài liệu thiết kế v1 (dùng luôn cho đề cương hoặc báo cáo chương 2, 4).

---

## 👥 Cả nhóm

### N2.1 Khảo sát chủ trọ (1–2 giờ, ít nhất 2 người đi)
**Kết quả cần đạt:** biên bản khảo sát (`docs/khao-sat.md`) gồm câu trả lời, ảnh phiếu báo tiền (đã che thông tin cá nhân), **3 khó khăn lớn nhất** của chủ trọ.
**Gợi ý:** không có chủ trọ thì phỏng vấn 3–5 bạn đang ở trọ (góc nhìn khách thuê) và hỏi qua điện thoại chủ nhà của các bạn đó.

### N2.2 Họp chốt thiết kế (1,5 giờ, cuối tuần)
Đi lần lượt và **chốt**: yêu cầu chức năng (TV1) → công thức tính tiền (TV3) → ERD (TV2) → API (TV2) → wireframe (TV1, TV4).
Ghi quyết định thẳng vào các file docs, commit qua PR.

---

## 🧑‍💼 TV1: Yêu cầu chức năng và wireframe phía chủ nhà
**Kết quả cần đạt**
- [`02-yeu-cau-chuc-nang.md`](../02-yeu-cau-chuc-nang.md) đã điều chỉnh theo khảo sát, mọi mục có tiêu chí chấp nhận
- **Sơ đồ use case** (vẽ bằng draw.io hoặc PlantUML) cho 2 tác nhân, lưu ảnh vào `docs/images/`
- Wireframe các trang: Dashboard, Phòng (danh sách và chi tiết), Sơ đồ phòng

**Cách làm**
1. Đọc biên bản khảo sát, thêm hoặc bớt chức năng. **Giữ phạm vi nhỏ**: chức năng mới thường là 🟢
2. Wireframe vẽ tay rồi chụp ảnh, hoặc dùng Figma hay Excalidraw (https://excalidraw.com). Chỉ cần khung và vị trí các thành phần, không cần đẹp
3. Tham khảo bố cục Ant Design có sẵn: https://ant.design/components/overview (Table, Card, Statistic, Descriptions)

**Prompt AI gợi ý**
> Mình làm hệ thống quản lý nhà trọ cho chủ nhà và khách thuê. Đây là danh sách chức năng: <dán>. Hãy viết sơ đồ use case bằng PlantUML, gom nhóm theo tác nhân.

**Checklist**
- [ ] Yêu cầu chức năng đã chốt
- [ ] Sơ đồ use case
- [ ] Wireframe Dashboard, Phòng, Sơ đồ phòng

## 🛠️ TV2: Review ERD và chốt API
**Kết quả cần đạt**
- Đã trả lời 4 câu hỏi review ở cuối [`04-thiet-ke-database.md`](../04-thiet-ke-database.md), sửa `schema.prisma` nếu cần (kèm migration)
- [`05-api.md`](../05-api.md) đã chốt, đủ API cho mọi chức năng 🔴
- Label trên GitHub: `TV1`–`TV4`, `bug`, `🔴`, `🟡`, `🟢`; milestone: `MVP (tuần 7)`, `Nâng cao (tuần 10)`, `Bảo vệ (tuần 12)`
- Review và merge PR của các bạn trong tuần

**Cách làm**
1. Cùng cả nhóm đọc `schema.prisma` theo **kịch bản dữ liệu**: "Chủ nhà A có tòa nhà X, phòng P101, khách B và C ở ghép, tháng 10 điện 130 số..." Mỗi thông tin nằm ở bảng nào? Có thiếu gì không?
2. Đối chiếu từng chức năng trong `02` với danh sách API: chức năng nào chưa có API?
3. Mọi thay đổi schema làm trên một nhánh `feature/schema-v1`, merge **trước** khi mọi người bắt đầu Tuần 3

**Checklist**
- [ ] Schema v1 đã chốt và merge
- [ ] Danh sách API đã chốt
- [ ] Label và milestone trên GitHub

## 🧮 TV3: Chốt công thức tính tiền ⭐ quan trọng nhất tuần
**Kết quả cần đạt**
- Mọi ô **"Quyết định của nhóm"** trong [`03-cong-thuc-tinh-tien.md`](../03-cong-thuc-tinh-tien.md) đã điền, có ngày chốt
- **Ít nhất 5 ca kiểm thử tính tay** (bảng như ví dụ cuối file): ở đủ tháng; vào giữa tháng; nước theo người; phòng 1 người không gửi xe; tiêu thụ bằng 0
- Đã điền **kết quả mong đợi** vào các `it.todo(...)` trong `billing.test.ts` (chưa cần code hàm)

**Cách làm**
1. Từ khảo sát, chọn phương án gần thực tế nhất nhưng **đơn giản nhất** cho MVP
2. Mỗi ca kiểm thử tính bằng tay (hoặc Excel), **nhờ 1 bạn khác tính lại độc lập**, so kết quả
3. Gặp trường hợp nhập nhằng (ví dụ tháng 2 có 28 ngày) → ghi luôn quyết định vào file

**Checklist**
- [ ] Mọi quyết định đã chốt
- [ ] 5 ca kiểm thử, đã có người kiểm tra lại
- [ ] `it.todo` đã có kết quả mong đợi

## 📱 TV4: Wireframe cổng khách thuê và luồng sự cố
**Kết quả cần đạt**
- Wireframe **khổ điện thoại** cho: trang chủ khách thuê, danh sách hóa đơn, chi tiết hóa đơn (có chỗ cho mã QR), báo sự cố, thông báo
- Sơ đồ trạng thái yêu cầu sửa chữa: `OPEN → IN_PROGRESS → DONE`, hoặc `REJECTED`; ai được đổi, khi đổi thì ai nhận thông báo
- Danh sách **các thông báo** hệ thống sẽ gửi: hóa đơn mới, nhắc nợ, sự cố được cập nhật, thanh toán thành công... (người nhận, nội dung mẫu, link tới đâu)

**Gợi ý thiết kế điện thoại:** nút bấm to, thông tin quan trọng nhất (số tiền, hạn đóng) to và ở trên; dùng `Card` và `List` của Ant Design thay cho `Table` (bảng rất khó xem trên điện thoại).

**Checklist**
- [x] Wireframe 5 màn hình điện thoại ([wireframe-tv4-khach-thue.excalidraw](../wireframes/wireframe-tv4-khach-thue.excalidraw) & [wireframe-preview.html](../wireframes/wireframe-preview.html))
- [x] Sơ đồ trạng thái sự cố ([so-do-trang-thai-su-co.svg](../images/so-do-trang-thai-su-co.svg) & [so-do-luong-su-co.md](../so-do-luong-su-co.md))
- [x] Danh sách thông báo (đã tích hợp trong [so-do-luong-su-co.md](../so-do-luong-su-co.md))

---

## ✅ Cuối tuần: kiểm tra chung 🏁 Mốc thiết kế
- [ ] Công thức tính tiền đã chốt (**không có cái này thì không sang Tuần 3**)
- [ ] Schema v1 đã merge vào `dev`
- [ ] Yêu cầu chức năng, ERD, API, wireframe đã có trong `docs/`
- [ ] (Nếu giáo viên yêu cầu) đã nộp đề cương
