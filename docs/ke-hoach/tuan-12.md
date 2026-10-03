# Tuần 12: 🏁 Bảo vệ

**Mục tiêu tuần:** nộp báo cáo, trình bày tự tin, **ai cũng trả lời được câu hỏi**.

---

## 👥 Cả nhóm

### N12.1 Slide (TV1 chủ trì, mỗi người làm slide phần mình)
Theo cấu trúc trong [`08-van-dap-va-bao-cao.md`](../08-van-dap-va-bao-cao.md#slide-bảo-vệ-khoảng-15-phút-1215-slide). Nguyên tắc:
- Mỗi slide **một ý**, ít chữ, nhiều hình; chữ ≥ 24pt
- Sơ đồ kiến trúc và luồng thanh toán **vẽ lại cho đẹp** (không chụp màn hình code dài)
- Slide cuối: link repo, link bản online, mã QR dẫn tới bản online để giáo viên tự mở trên điện thoại

### N12.2 Tập trình bày (ít nhất 2 lần, có bấm giờ)
- Phân công: ai nói phần nào, ai điều khiển máy demo, ai cầm điện thoại demo phía khách
- Lần 1: cả nhóm góp ý. Lần 2: **tập như thật**, có người đóng vai giáo viên ngắt lời hỏi giữa chừng
- Tập cả **phương án sự cố:** mạng hỏng → chuyển sang video; webhook chậm → dùng trình giả lập; Render đang ngủ → đã mở trước

### N12.3 Luyện vấn đáp (mỗi người ≥ 2 buổi)
- Từng người trả lời **thành tiếng** toàn bộ câu "Chung" và câu về phần mình trong [`08`](../08-van-dap-va-bao-cao.md)
- Đổi cặp hỏi chéo phần của nhau (giáo viên hay hỏi người không làm phần đó)
- Luyện **sửa code tại chỗ**: thêm một trường mới đi đủ các tầng trong 10 phút (như bài tập Tuần 1)
- Dùng prompt số 7 trong [`07-dung-ai-hieu-qua.md`](../07-dung-ai-hieu-qua.md) để AI đóng vai giáo viên

### N12.4 Phát hành bản cuối (TV2)
```bash
git checkout main && git merge dev   # qua Pull Request
git tag v1.0 -m "Bản nộp cuối"
git push origin main --tags
```
Nộp đúng yêu cầu giáo viên (link repo, file nén mã nguồn **không có `node_modules` và `.env`**, báo cáo PDF...).

---

## 📋 Checklist ngày bảo vệ
**Trước 1 ngày**
- [ ] Báo cáo đã nộp; slide bản cuối có cả bản PDF trong USB và Google Drive
- [ ] Bản online chạy đúng kịch bản demo; dữ liệu demo đã reset về trạng thái đẹp
- [ ] Hóa đơn dành cho demo QR đang ở trạng thái **chưa thanh toán**
- [ ] Điện thoại demo: **đã cài PWA**, đã bật thông báo, đã đăng nhập tài khoản khách, pin đầy
- [ ] Video demo dự phòng có trong máy (không phụ thuộc mạng)

**Trước 30 phút**
- [ ] Mở bản online để **đánh thức Render**; đăng nhập sẵn tài khoản chủ nhà trên laptop
- [ ] Phát Wi-Fi từ điện thoại (4G) làm mạng dự phòng
- [ ] Tắt thông báo cá nhân trên laptop và điện thoại (Zalo, Messenger...)
- [ ] Phóng to trình duyệt (Ctrl + +) để giáo viên nhìn rõ

**Sau bảo vệ**
- [ ] Họp rút kinh nghiệm 15 phút, cảm ơn nhau 🎉
