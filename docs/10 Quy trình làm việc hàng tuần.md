> Trang này trả lời câu hỏi: **mỗi tuần, ai làm gì, vào ngày nào, cập nhật ở đâu.**
> Lịch dưới đây lấy ví dụ họp **tối Chủ nhật 21h**. Nhóm họp ngày khác thì dời các mốc theo cho khớp.

## Một tuần trong một bảng

| Thời điểm | Việc | Ai | Cập nhật ở đâu |
|---|---|---|---|
| **Thứ 7 21:00–21:45** | **Họp tuần**: tổng kết tuần cũ, chia việc tuần mới | Cả nhóm, TV1 chủ trì | Biên bản họp |
| Thứ 7, ngay sau họp | Đổi bộ lọc Kanban sang tuần mới, kiểm tra mỗi thẻ đã có người | TV1 | Task Tracking |
| Thứ 7, ngay sau họp | Đọc trang **Tuần XX** của mình, hỏi ngay chỗ chưa hiểu | Mỗi người | Comment trên trang tuần |
| **Chủ Nhật** | Kéo thẻ sang **Đang làm**, tạo nhánh Git, bắt đầu code | Mỗi người | Task Tracking, Git |
| Chủ Nhật → Thứ 5 | Làm việc; commit mỗi khi xong một phần nhỏ; mỗi ngày `git pull` nhánh `dev` | Mỗi người | Git |
| **Thứ 4, 21h** | **Check-in giữa tuần**: nhắn theo mẫu bên dưới | Mỗi người | Nhóm chat |
| Thứ 4, sau check-in | Đọc check-in, ai đang tắc thì sắp xếp người hỗ trợ ngay | TV1, TV2 | Nhóm chat |
| **Thứ 5, 23:59** | **Hạn mở Pull Request** cho việc của tuần, kéo thẻ sang **Đang review** | Mỗi người | GitHub, Task Tracking |
| **Thứ 6** | Review chéo (trong 24h), sửa theo góp ý, merge vào `dev` | Người review, TV2 merge | GitHub |
| Thứ 7, trước họp | Tick checklist trong trang tuần, kéo thẻ đã merge sang **Xong**, chuẩn bị demo 3 phút | Mỗi người | Trang Tuần XX, Task Tracking |

---

## Họp tuần (45 phút)

| Phút | Nội dung | Người dẫn |
|---|---|---|
| 0–5 | **Tiến độ chung:** mở Kanban, đọc nhanh số thẻ Xong / còn lại. Đánh giá 🟢 đúng tiến độ · 🟡 chậm ít · 🔴 chậm nhiều | TV1 |
| 5–20 | **Demo:** mỗi người 3 phút, **chạy thật** phần vừa xong (không chỉ kể) | Từng người |
| 20–25 | **Vướng mắc và quyết định:** việc cần cả nhóm chốt (đổi thiết kế, cắt tính năng...) | TV1 |
| 25–35 | **Chia việc tuần mới:** mở trang **Tuần XX**, từng người xác nhận việc của mình, chỉ ra việc nào phụ thuộc người khác | TV1 |
| 35–45 | **Giải thích code** (tuần 3–9): 1 người giải thích luồng code của mình, mọi người hỏi. **Luyện vấn đáp** (tuần 10–12) | Luân phiên |

**Sau họp:** TV1 tạo trang biên bản mới trong **Biên bản họp** theo **09 Mẫu biên bản họp**, đăng link vào nhóm chat.

**Quy tắc họp:** đến muộn hoặc vắng thì nhắn check-in trước giờ họp. Họp quá 45 phút thì dừng, việc còn lại bàn trong chat.

---

## Vòng đời một nhiệm vụ

| Thẻ trên Task Tracking | Chuyển khi nào | Đồng thời trên Git |
|---|---|---|
| **Chưa làm** → **Đang làm** | Bắt đầu làm | `git checkout dev && git pull` rồi `git checkout -b feature/ten-viec` |
| **Đang làm** → **Đang review** | Đã mở Pull Request | Dán link PR vào nội dung thẻ |
| **Đang review** → **Xong** | PR đã merge **và** đạt mọi mục bên dưới | Xóa nhánh sau khi merge |

**Chỉ chuyển sang Xong khi:**
- [ ] Đạt hết **Kết quả cần đạt** ghi trên thẻ
- [ ] Đã thử cả trường hợp sai (bỏ trống, nhập âm, đổi id trên URL...)
- [ ] `npm run typecheck` / `npm run build` không lỗi
- [ ] PR đã được người khác duyệt và merge vào `dev`
- [ ] Giải thích được code cho người khác

**Giới hạn:** mỗi người **tối đa 2 thẻ ở Đang làm** cùng lúc. Làm dở nhiều việc một lúc thì việc nào cũng chậm.

---

## Check-in giữa tuần (Thứ 4)

Copy mẫu này nhắn vào nhóm chat, 2 phút là xong:

```
[TVx] Check-in tuần XX
✅ Đã xong:
🔨 Đang làm:
🚧 Đang tắc (nếu có): <mô tả + đã thử gì>
📅 Dự kiến mở PR: <thứ mấy>
```

Ai ghi **🚧 Đang tắc** thì TV1 hoặc TV2 trả lời trong buổi tối đó: tự hỗ trợ, hoặc ghép cặp với người khác.

---

## Quy tắc làm việc

| Tình huống | Làm gì |
|---|---|
| Tắc **quá 1 buổi** | Hỏi nhóm ngay, kèm ảnh chụp lỗi và những gì đã thử. Đừng ôm một mình |
| Tắc **quá 2 ngày** | TV1 chủ động hỏi, chia nhỏ việc hoặc chuyển bớt việc sang người khác |
| Có PR cần review | Người được nhờ review **trong 24h**. Chạy thử theo mục "Cách kiểm tra" trong PR, không chỉ đọc code |
| PR của chính mình | **Không tự merge**, kể cả khi vội |
| Biết trước sẽ bận (thi, việc riêng) | Báo nhóm **trước khi tuần bắt đầu** để chia lại việc |
| Thứ 6 thấy không kịp | Báo ngay trong nhóm chat, không đợi đến buổi họp |
| Muốn sửa `schema.prisma` | Báo TV2 trước, tránh 2 người cùng sửa |
| Muốn cài thêm thư viện | Hỏi nhóm trước khi `npm install` |

---

## Khi bị chậm tiến độ

| Mức độ | Dấu hiệu | Xử lý |
|---|---|---|
| 🟡 Nhẹ | 1–2 thẻ chưa xong khi hết tuần | Giữ thẻ, đổi **Tuần** sang tuần sau, ghi lý do vào biên bản |
| 🟠 Vừa | Thẻ nằm trong **chuỗi việc then chốt** bị trễ (Khách thuê → Hợp đồng → Chỉ số → Hóa đơn → Thu tiền → VietQR → Webhook) | Ưu tiên số 1 của cả nhóm: ghép cặp, người rảnh vào hỗ trợ |
| 🔴 Nặng | Trễ 2 tuần liên tiếp, hoặc tuần 7 chưa có MVP chạy online | **Cắt** việc "Nếu dư thời gian" ngay, sau đó mới tới "Công nghệ trọng tâm". Không bao giờ cắt "MVP bắt buộc" |

---

## Việc cố định của từng vai trò

**TV1 · Trưởng nhóm**
- Đầu tuần: chủ trì họp, ghi biên bản, đổi bộ lọc Kanban, kiểm tra thẻ nào chưa có người
- Thứ 4: đọc check-in, xử lý người đang tắc
- Cuối tuần: đánh giá 🟢🟡🔴, nhắc ai chưa cập nhật thẻ

**TV2 · Tech lead**
- Hằng ngày: xem PR mới, review hoặc phân người review
- Thứ 6: merge các PR đã duyệt vào `dev`, kiểm tra `dev` vẫn chạy được sau khi merge
- Khi cần: hỗ trợ lỗi cài đặt, lỗi Git, xung đột code

**TV3, TV4 · và mọi thành viên**
- Cập nhật thẻ của mình **ngay khi đổi trạng thái**, không dồn đến lúc họp
- Check-in thứ 4, mở PR trước hạn thứ 6, review PR được nhờ trong 24h
- Chuẩn bị demo 3 phút cho buổi họp

---

## Kênh liên lạc

| Kênh | Dùng cho |
|---|---|
| **Nhóm chat** (Zalo/Messenger) | Check-in, hỏi nhanh, báo tắc, nhắc nhau |
| **Notion: Task Tracking** | Trạng thái từng việc |
| **Notion: comment trên trang** | Góp ý tài liệu, hỏi về kế hoạch tuần |
| **GitHub: Pull Request** | Góp ý code |
| **Họp tuần** | Quyết định chung, demo, chia việc |

**Không** gửi mật khẩu, chuỗi kết nối database, khóa bí mật qua nhóm chat hay Notion.
