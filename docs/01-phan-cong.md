# Phân công vai trò

> **Tuần 1:** cả nhóm họp, điền tên vào bảng dưới. Chia theo sở thích và điểm mạnh:
> - Ai thích tổ chức, viết lách → **TV1**
> - Ai vững code nhất hoặc thích tìm hiểu cấu hình → **TV2**
> - Ai cẩn thận, giỏi logic và toán → **TV3**
> - Ai thích làm giao diện, trải nghiệm điện thoại → **TV4**

| Mã | Họ tên | Vai trò nhóm | Phụ trách tính năng | Công nghệ nâng cao | Review chéo cho |
|---|---|---|---|---|---|
| **TV1** | | Trưởng nhóm (PM) | Tòa nhà ✅, Phòng, Dịch vụ, Sơ đồ phòng, Dashboard, Biểu đồ | **Realtime (Socket.IO)** | TV4 |
| **TV2** | | Phụ trách kỹ thuật (Tech lead) | Đăng nhập ✅, Khách thuê, Tài khoản khách, Hợp đồng, Deploy, Bảo mật | **VietQR và webhook thanh toán** | TV3 |
| **TV3** | | Phụ trách nghiệp vụ | Hàm tính tiền, Chỉ số điện nước, Hóa đơn, Thu tiền, Job tự động | **Job định kỳ (cron)**, ghi chỉ số offline | TV2 |
| **TV4** | | Phụ trách trải nghiệm khách thuê | Sự cố, Thông báo, Cổng khách thuê, In hóa đơn | **PWA và Web Push** | TV1 |

✅ = đã có trong khung dự án.

**Chia theo tính năng, không chia theo tầng.** Mỗi người tự làm trọn tính năng của mình: database, API, giao diện. Nhờ vậy ai cũng hiểu cả frontend lẫn backend để trả lời vấn đáp, và không phải chờ nhau.

---

## Trách nhiệm theo vai trò nhóm

### TV1: Trưởng nhóm (Project Manager)
- Tổ chức **họp tuần** (30–45 phút), ghi biên bản theo [`mau-bien-ban-hop.md`](mau-bien-ban-hop.md)
- Quản lý **bảng công việc** trên GitHub Projects: đầu tuần tạo issue theo file kế hoạch tuần, cuối tuần kiểm tra trạng thái
- Phát hiện sớm ai đang bị tắc: **quá 2 ngày không tiến triển thì phải hỗ trợ hoặc chia lại việc**
- Đầu mối liên lạc với giáo viên, nắm hạn nộp và tiêu chí chấm
- Giữ tài liệu yêu cầu chức năng, tổng hợp báo cáo cuối kỳ

### TV2: Tech lead
- Quản lý repo GitHub, bảo vệ nhánh `main`/`dev`, **review và merge Pull Request**
- Người đầu tiên hỗ trợ khi ai gặp lỗi cài đặt, lỗi Git hoặc xung đột code (conflict)
- Giữ `schema.prisma` thống nhất: ai muốn sửa schema thì báo TV2 trước để tránh 2 người cùng sửa
- Deploy, quản lý các biến môi trường và tài khoản dịch vụ (Neon, Render, Vercel, cổng thanh toán)
- Kiểm tra bảo mật: phân quyền, lọc theo `ownerId`

### TV3: Phụ trách nghiệp vụ
- Giữ **công thức tính tiền** ([`03-cong-thuc-tinh-tien.md`](03-cong-thuc-tinh-tien.md)), là người "hiểu nghiệp vụ nhất"
- Viết **unit test** cho phần tính tiền. Đây là phần giáo viên dễ hỏi sâu nhất.
- Chuẩn bị **dữ liệu demo** thực tế (nhiều tháng, nhiều trường hợp)

### TV4: Phụ trách trải nghiệm khách thuê
- Đảm bảo **mọi trang dùng tốt trên điện thoại**
- Giữ thống nhất giao diện: màu, cách hiển thị trạng thái, thông báo
- Phụ trách **Lighthouse report** và phần trình bày PWA khi bảo vệ

---

## Nguyên tắc chung
1. **Mỗi người phải hiểu toàn bộ code mình nộp**, và hiểu sơ lược phần của người khác (giáo viên có thể hỏi bất kỳ ai về bất kỳ phần nào).
2. **Review chéo:** mỗi PR cần ít nhất 1 người duyệt, ưu tiên người trong cột "Review chéo cho".
3. **Bị tắc quá 1 buổi thì hỏi nhóm**, đừng ôm. Hỏi kèm ảnh chụp lỗi và đã thử những gì.
4. **Cam kết thời gian:** mỗi người 8–10 giờ/tuần. Bận thì báo trước trong nhóm để chia lại việc.
5. Tính năng **phụ thuộc người khác** (ví dụ hóa đơn cần hợp đồng): dùng dữ liệu seed để làm trước, không chờ.

## Bảng phụ thuộc giữa các tính năng
```
Tòa nhà ✅ ─┬─> Phòng (TV1) ─┬─> Hợp đồng (TV2) ──> Chỉ số (TV3) ──> Hóa đơn (TV3) ─┬─> Cổng khách xem HĐ (TV4)
            └─> Dịch vụ (TV1)┘        ▲                                              ├─> VietQR + webhook (TV2)
                Khách thuê (TV2) ─────┘                                              └─> Push nhắc nợ (TV4 + TV3)
Đăng nhập ✅ ──> Tài khoản khách (TV2) ──> Cổng khách thuê (TV4) ──> Báo sự cố (TV4) ──> Realtime (TV1)
```
Seed đã có sẵn 1 hợp đồng và 1 chỉ số mẫu, nên **TV3 và TV4 làm được ngay từ Tuần 3** mà không cần chờ TV2 làm xong Hợp đồng.
