# Kế hoạch 12 tuần — tổng quan

> Tuần 1 bắt đầu từ ngày: **___/___/______** (TV1 điền). Hạn nộp hoặc bảo vệ: **___/___/______**.
> Lịch của giáo viên khác thì dồn hoặc giãn các tuần cho khớp, **giữ nguyên thứ tự ưu tiên**.

## Các mốc
| Mốc | Cuối tuần | Phải có | Nếu trễ |
|---|---|---|---|
| 🏁 Thiết kế | 2 | Yêu cầu chức năng, công thức tính tiền, ERD, danh sách API, wireframe | Không được bắt đầu code tính năng khi chưa chốt công thức tính tiền |
| 🏁 **MVP** | **7** | Luồng chính chạy trọn từ tòa nhà đến khách xem hóa đơn và thu tiền, **đã deploy online** | Lùi phần nâng cao, cắt mục "Nếu dư thời gian" |
| 🏁 Đóng băng | 11 | Hết thêm tính năng, chỉ sửa lỗi và làm báo cáo | Cắt tính năng đang dở, **không** làm thêm |
| 🏁 Bảo vệ | 12 | Báo cáo, slide, demo, đã tập vấn đáp | |

## Tổng quan nhiệm vụ theo tuần
| Tuần | TV1 (PM) | TV2 (Tech lead) | TV3 (Nghiệp vụ) | TV4 (Khách thuê) |
|---|---|---|---|---|
| 1 | Tổ chức nhóm, bảng công việc | Tạo repo, hướng dẫn Git | Câu hỏi khảo sát tính tiền | Tìm hiểu PWA, giao diện tham khảo |
| | *Cả nhóm: cài đặt, chạy khung, học nền, bài tập đọc hiểu* | | | |
| 2 | Yêu cầu chức năng, khảo sát chủ trọ, wireframe chủ nhà | Review ERD, chốt API, Neon | **Chốt công thức tính tiền**, ca kiểm thử | Wireframe cổng khách thuê, luồng sự cố |
| 3 | Module **Phòng** | Module **Khách thuê** và tài khoản khách | **Hàm tính tiền** và unit test | **Báo sự cố** (phía khách) |
| 4 | Module **Dịch vụ**, chi tiết phòng | Module **Hợp đồng** | **Chỉ số điện nước** | **Xử lý sự cố** (phía chủ), Thông báo |
| 5 | **Sơ đồ phòng**, tìm kiếm | Chi tiết hợp đồng, kiểm tra bảo mật | **Tạo hóa đơn** hàng loạt | **Cổng khách thuê**: hóa đơn, hợp đồng |
| 6 | **Dashboard** | **Deploy lần 1** | **Phát hành và thu tiền** | **In hóa đơn**, tối ưu điện thoại |
| 7 | Kịch bản demo, điều phối kiểm thử | Deploy bản MVP, gắn tag v0.5 | Dữ liệu demo nhiều tháng | Rà soát giao diện điện thoại |
| | *Cả nhóm: kiểm thử chéo, sửa lỗi* 🏁 | | | |
| 8 | **Biểu đồ**, xuất Excel | **VietQR** trên hóa đơn | **Cron** tạo hóa đơn, quá hạn | **PWA**: cài đặt, cache |
| 9 | **Socket.IO** | **Webhook** tự gạch nợ | Gắn push vào hóa đơn, trang ghi chỉ số cho điện thoại | **Web Push** |
| 10 | Tích hợp realtime | Bảo mật, webhook trên server thật | Ghi chỉ số **offline** (nếu kịp) | Hoàn thiện PWA |
| 11 | Tổng hợp báo cáo | Deploy cuối, README | Báo cáo kiểm thử | Lighthouse, ảnh chụp |
| | *Cả nhóm: đóng băng, kiểm thử vòng 2, viết báo cáo phần mình* 🏁 | | | |
| 12 | *Cả nhóm: slide, tập demo, tập vấn đáp, bảo vệ* 🏁 | | | |

## Mức ưu tiên tính năng
- **🔴 Bắt buộc (MVP):** đăng nhập 2 vai trò; tòa nhà, phòng, dịch vụ, khách thuê, hợp đồng; ghi chỉ số; tạo, phát hành hóa đơn và ghi nhận thanh toán; khách xem hóa đơn; báo và xử lý sự cố; deploy online
- **🟡 Nên có (công nghệ chính):** PWA cài được; VietQR; webhook tự gạch nợ; Web Push; cron tự tạo hóa đơn
- **🟢 Nếu dư thời gian:** Socket.IO realtime; ghi chỉ số offline; biểu đồ; xuất Excel; điện bậc thang

> Trễ tiến độ thì **cắt từ dưới lên**: 🟢 trước, rồi đến 🟡. Không bao giờ cắt 🔴.

## Nhịp làm việc mỗi tuần
| Khi nào | Việc | Ai |
|---|---|---|
| Đầu tuần (họp 30–45') | Xem lại tuần trước, demo nhanh, chia việc tuần này theo file `tuan-XX.md`, tạo issue | Cả nhóm, TV1 chủ trì |
| Giữa tuần | Nhắn trong nhóm: *đã làm gì, sẽ làm gì, đang tắc gì* | Mỗi người |
| Trong tuần | Code trên nhánh riêng, mở Pull Request, review cho nhau trong 24h | Mỗi người |
| Cuối tuần | Merge vào `dev`, đánh dấu checklist trong file tuần | Mỗi người, TV2 merge |

## "Xong" nghĩa là gì? (Definition of Done)
Một nhiệm vụ chỉ được đánh dấu xong khi:
- [ ] Đạt hết mục **"Kết quả cần đạt"** trong file tuần
- [ ] Tự thử trên trình duyệt, gồm **cả trường hợp sai** (bỏ trống, nhập âm, sửa id trên URL...)
- [ ] Dùng được trên màn hình điện thoại (với trang khách thuê là bắt buộc)
- [ ] `npm run typecheck` / `npm run build` không lỗi
- [ ] Đã có PR được review và merge vào `dev`
- [ ] Đã cập nhật [`../05-api.md`](../05-api.md) nếu có API mới; thêm request mẫu vào `backend/api.http`
- [ ] **Giải thích được code cho người khác trong nhóm**

## Rủi ro thường gặp và cách xử lý
| Rủi ro | Dấu hiệu | Cách xử lý |
|---|---|---|
| Một người bị tắc lâu | Quá 2 ngày không có commit hay PR | TV1 hỏi thăm, ghép cặp với TV2, hoặc chia nhỏ việc |
| Code AI viết không hiểu | Không giải thích được khi review | Bắt buộc giải thích trong PR; dùng prompt "giải thích" ở [`07`](../07-dung-ai-hieu-qua.md) |
| Xung đột schema | 2 người cùng sửa `schema.prisma` | Báo TV2 trước khi sửa; pull `dev` thường xuyên |
| Dồn việc cuối kỳ | Tuần 7 chưa deploy được | Cắt mục 🟢 ngay, cả nhóm dồn sức làm 🔴 |
| Cổng thanh toán khó đăng ký | Tuần 8 chưa có tài khoản sandbox | Phương án B: tự viết trang "giả lập ngân hàng" gọi webhook (xem tuần 9) |
| Thành viên bỏ ngang | | Báo giáo viên sớm; chia lại việc, cắt 🟢 |
