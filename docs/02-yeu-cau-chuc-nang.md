# Yêu cầu chức năng — BẢN NHÁP (TV1 hoàn thiện ở Tuần 2)

Ưu tiên: 🔴 bắt buộc · 🟡 nên có · 🟢 nếu dư thời gian. Cột "Tuần" là tuần làm theo kế hoạch.

## Tác nhân
- **Chủ nhà** (LANDLORD): sở hữu một hoặc nhiều tòa nhà, quản lý mọi thứ
- **Khách thuê** (TENANT): người thuê phòng, đăng nhập bằng tài khoản chủ nhà cấp
- **Hệ thống**: các job tự động (tạo hóa đơn, nhắc nợ), webhook từ ngân hàng hoặc cổng thanh toán

## Chủ nhà
| # | Chức năng | Ưu tiên | Người | Tuần | Tiêu chí chấp nhận (để kiểm tra) |
|---|---|---|---|---|---|
| C1 | Đăng ký, đăng nhập, đăng xuất | 🔴 | TV2 | ✅ | Sai mật khẩu báo lỗi; token hết hạn thì tự về trang đăng nhập |
| C2 | Quản lý tòa nhà (giá điện nước, hạn đóng) | 🔴 | TV1 | ✅ | Không xem hay sửa được tòa nhà của chủ khác |
| C3 | Quản lý phòng (giá, diện tích, số người tối đa, trạng thái) | 🔴 | TV1 | 3 | Tên phòng không trùng trong cùng tòa nhà; lọc theo tòa nhà |
| C4 | Quản lý dịch vụ (wifi, rác, gửi xe...) theo tòa nhà | 🔴 | TV1 | 4 | 3 kiểu tính: theo phòng, theo người, theo số lượng |
| C5 | Quản lý khách thuê (thông tin, CCCD, quê quán) | 🔴 | TV2 | 3 | Tìm theo tên hoặc số điện thoại |
| C6 | Cấp tài khoản đăng nhập cho khách thuê | 🔴 | TV2 | 3 | Khách đăng nhập được, chỉ thấy dữ liệu của mình |
| C7 | Tạo hợp đồng (phòng, người ở, dịch vụ, giá, cọc) | 🔴 | TV2 | 4 | Phòng chỉ có tối đa 1 hợp đồng hiệu lực; tạo xong phòng chuyển "Đang thuê" |
| C8 | Kết thúc hợp đồng (trả phòng) | 🔴 | TV2 | 4 | Phòng về "Trống" |
| C9 | Ghi chỉ số điện nước hàng tháng cho cả tòa nhà | 🔴 | TV3 | 4 | Chỉ số cũ tự lấy từ tháng trước; chỉ số mới < cũ thì báo lỗi |
| C10 | Tạo hóa đơn hàng loạt theo kỳ | 🔴 | TV3 | 5 | Tính đúng theo [`03-cong-thuc-tinh-tien.md`](03-cong-thuc-tinh-tien.md); không tạo trùng kỳ |
| C11 | Sửa hóa đơn nháp, thêm khoản khác hoặc giảm trừ, phát hành | 🔴 | TV3 | 6 | Phát hành xong không sửa được nữa; khách nhận thông báo |
| C12 | Ghi nhận thanh toán thủ công (tiền mặt, chuyển khoản) | 🔴 | TV3 | 6 | Trả thiếu → "Thanh toán một phần"; đủ → "Đã thanh toán" |
| C13 | Xem và xử lý yêu cầu sửa chữa | 🔴 | TV4 | 4 | Đổi trạng thái thì khách nhận thông báo |
| C14 | Dashboard: phòng trống, doanh thu, công nợ | 🔴 | TV1 | 6 | Số liệu khớp với dữ liệu thật |
| C15 | Sơ đồ phòng theo tầng, màu theo trạng thái | 🟡 | TV1 | 5 | |
| C16 | In hoặc xuất PDF hóa đơn | 🟡 | TV4 | 6 | |
| C17 | Cron tự tạo hóa đơn nháp, tự đánh dấu quá hạn | 🟡 | TV3 | 8 | Có nút "Chạy ngay" để demo |
| C18 | Biểu đồ doanh thu 6 tháng, xuất Excel | 🟢 | TV1 | 8 | |
| C19 | Nhận thông báo realtime (sự cố mới, khách vừa thanh toán) | 🟢 | TV1 | 9–10 | Không cần tải lại trang |
| C20 | Ghi chỉ số offline, có mạng thì tự đồng bộ | 🟢 | TV3 | 10 | |

## Khách thuê
| # | Chức năng | Ưu tiên | Người | Tuần | Tiêu chí chấp nhận |
|---|---|---|---|---|---|
| K1 | Đăng nhập, xem phòng và hợp đồng của mình | 🔴 | TV4 | 5 | Không xem được của người khác dù sửa URL |
| K2 | Xem danh sách và chi tiết hóa đơn | 🔴 | TV4 | 5 | Chỉ thấy hóa đơn đã phát hành; từng khoản ghi rõ chỉ số cũ, mới |
| K3 | Gửi yêu cầu sửa chữa, theo dõi trạng thái | 🔴 | TV4 | 3 | |
| K4 | Xem thông báo trong app | 🔴 | TV4 | 4 | Có số chưa đọc trên icon chuông |
| K5 | Cài app lên điện thoại (PWA) | 🟡 | TV4 | 8 | Chrome Android hiện nút cài đặt; Lighthouse đạt chuẩn installable |
| K6 | Thanh toán bằng mã VietQR | 🟡 | TV2 | 8 | Quét bằng app ngân hàng thì tự điền đúng số tiền và nội dung |
| K7 | Hóa đơn tự chuyển "Đã thanh toán" sau khi chuyển khoản | 🟡 | TV2 | 9 | Không cần chủ nhà xác nhận |
| K8 | Nhận push notification (hóa đơn mới, nhắc nợ, sự cố đã xử lý) | 🟡 | TV4 | 9 | Nhận được kể cả khi đã tắt tab |
| K9 | Xem hóa đơn gần nhất khi mất mạng | 🟢 | TV4 | 10 | |

## Phi chức năng
- Giao diện tiếng Việt, **dùng tốt trên điện thoại** (khách thuê) và máy tính (chủ nhà)
- Bảo mật: mật khẩu băm bcrypt; JWT; phân quyền theo vai trò; dữ liệu cách ly giữa các chủ nhà
- Deploy online, truy cập qua HTTPS

## Ngoài phạm vi (KHÔNG làm, tránh lan man)
- App di động native; nhiều người quản lý một tòa nhà; kế toán và thuế; hợp đồng điện tử có chữ ký số; đăng tin cho thuê và tìm phòng
