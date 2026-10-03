# Tuần 7: 🏁 Mốc MVP — kiểm thử chéo, sửa lỗi, ổn định

**Mục tiêu tuần:** **không thêm tính năng mới.** Toàn bộ luồng chính chạy ổn trên bản online, có kịch bản demo, có bản `v0.5` trên nhánh `main`.
Nếu tuần trước còn dở việc: **làm cho xong ngay đầu tuần**, rồi mới vào phần dưới.

---

## 👥 Cả nhóm: Kiểm thử chéo (bug bash)
**Kết quả cần đạt:** mỗi người thử **module của người khác** ít nhất 1 giờ, ghi lỗi thành issue (nhãn `bug`). Hết thứ Sáu, mọi lỗi 🔴 đã được sửa.

| Người thử | Thử module của |
|---|---|
| TV1 | TV2: Khách thuê, Hợp đồng, bảo mật |
| TV2 | TV3: Chỉ số, Hóa đơn, Thu tiền |
| TV3 | TV4: Cổng khách thuê, Sự cố, Thông báo, In |
| TV4 | TV1: Phòng, Dịch vụ, Sơ đồ, Dashboard |

**Cách thử:** làm như người dùng thật, cố tình làm sai:
- Bỏ trống, nhập số âm, nhập chữ vào ô số, gõ thật dài
- Bấm nút 2 lần liên tiếp; bấm "Quay lại" giữa chừng; F5 giữa chừng
- Đổi id trên URL; dùng tài khoản khác
- Khổ điện thoại; mạng chậm (DevTools → Network → Slow 4G)

**Mẫu issue lỗi**
```
Tiêu đề: [Hóa đơn] Tạo hóa đơn 2 lần liên tiếp bị lỗi 500
Các bước: 1. ... 2. ... 3. ...
Mong đợi: ...
Thực tế: ... (ảnh chụp, lỗi ở Console/Network)
Mức độ: 🔴 chặn demo / 🟡 khó chịu / 🟢 nhỏ
```

---

## 🧑‍💼 TV1: Kịch bản demo và kịch bản kiểm thử
**Kết quả cần đạt**
- `docs/kich-ban-demo.md`: kịch bản **5–7 phút** từng bước một (ai làm, bấm gì, nói gì), dùng lại khi bảo vệ. Ví dụ:
  1. Chủ nhà đăng nhập → Dashboard → Sơ đồ phòng
  2. Thêm khách mới → cấp tài khoản → tạo hợp đồng phòng P102
  3. Ghi chỉ số tháng → tạo hóa đơn hàng loạt → xem một hóa đơn → phát hành
  4. (Điện thoại) Khách đăng nhập → thấy thông báo → xem hóa đơn → báo sự cố
  5. Chủ nhà nhận và xử lý sự cố → ghi nhận thanh toán → Dashboard cập nhật
- `docs/kiem-thu.md`: bảng kịch bản kiểm thử thủ công (mã, chức năng, các bước, kết quả mong đợi, kết quả thực tế, người thử, ngày). **Ít nhất 30 dòng**, đưa vào chương Kiểm thử của báo cáo
- Họp **rút kinh nghiệm**: 3 điều làm tốt, 3 điều cần đổi cho nửa sau. Ghi biên bản

**Checklist**
- [ ] Kịch bản demo, cả nhóm chạy thử 1 lần
- [ ] Kịch bản kiểm thử ≥ 30 dòng
- [ ] Biên bản rút kinh nghiệm

## 🛠️ TV2: Phát hành bản v0.5
**Kết quả cần đạt**
- Cuối tuần, PR `dev → main`, deploy từ `main`, gắn tag:
  ```bash
  git checkout main && git pull
  git tag v0.5 -m "MVP"
  git push origin v0.5
  ```
- Bản online chạy được kịch bản demo **từ đầu đến cuối**
- (Nên làm) Hẹn giáo viên xem demo MVP để lấy góp ý sớm

**Checklist**
- [ ] `main` có bản MVP, tag `v0.5`
- [ ] Bản online chạy hết kịch bản demo

## 🧮 TV3: Dữ liệu demo thực tế
**Kết quả cần đạt:** viết lại `prisma/seed.ts` để có dữ liệu "nhìn như thật":
- 2 tòa nhà, khoảng 12 phòng, khoảng 15 khách thuê, khoảng 9 hợp đồng (có hợp đồng đã kết thúc)
- **3 tháng gần nhất** có chỉ số và hóa đơn đủ các trạng thái: đã trả, trả một phần, chưa trả, **quá hạn**
- Vài sự cố ở các trạng thái khác nhau, vài thông báo

**Cách làm:** dùng chính `buildInvoiceItems()` trong seed để số liệu khớp công thức. Tiêu thụ điện nước ngẫu nhiên trong khoảng hợp lý (80–200 kWh, 3–8 m³).

**Checklist**
- [ ] Seed mới, `npm run db:reset` chạy không lỗi
- [ ] Dashboard và Sơ đồ phòng nhìn "có hồn"
- [ ] Đã seed lại cho bản online

## 📱 TV4: Rà soát trải nghiệm
**Kết quả cần đạt**
- Thống nhất mọi trang: màu trạng thái (từ `src/utils/status.ts`), cách hiện "đang tải" (`Skeleton`/`Spin`), **trạng thái rỗng** (`Empty` kèm câu hướng dẫn, ví dụ "Chưa có phòng nào, bấm *Thêm phòng*"), thông báo lỗi tiếng Việt
- Thử trên **điện thoại thật** (bản online), ít nhất 1 Android và 1 iPhone nếu nhóm có

**Checklist**
- [ ] Mọi trang có trạng thái rỗng và đang tải
- [ ] Đã thử trên điện thoại thật

---

## ✅ Cuối tuần: kiểm tra chung 🏁 MVP
- [ ] Mọi chức năng 🔴 trong [`02-yeu-cau-chuc-nang.md`](../02-yeu-cau-chuc-nang.md) đã xong
- [ ] Không còn lỗi 🔴 nào đang mở
- [ ] Bản online chạy hết kịch bản demo, có tag `v0.5`
- [ ] **Chưa đạt?** → Tuần 8 tiếp tục MVP, **cắt** biểu đồ, xuất Excel, Socket.IO và offline
