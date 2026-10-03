# Dùng AI hiệu quả mà vẫn hiểu code

## 5 nguyên tắc
1. **Đưa ngữ cảnh cho AI:** dán `CONVENTIONS.md`, file mẫu (`buildings.*`), phần schema liên quan. Không có ngữ cảnh thì AI viết theo kiểu riêng, không ghép được vào project.
2. **Mỗi lần một phần nhỏ:** một API, một trang, một hàm. Chạy thử được rồi mới làm tiếp.
3. **Đọc trước khi dán:** không hiểu dòng nào thì hỏi lại AI dòng đó.
4. **Tự kiểm tra, đừng tin ngay:** AI hay bịa tên hàm thư viện, quên kiểm tra quyền (`ownerId`), dùng cú pháp phiên bản cũ.
5. **Giải thích lại được bằng lời của mình**, nếu không thì chưa xong. Giáo viên sẽ hỏi.

## Mẫu prompt

### 1. Viết module backend mới
```
Mình đang làm project Express 5 + TypeScript + Prisma 6 + Zod 3.
Quy ước của nhóm:
<dán CONVENTIONS.md>

Đây là module mẫu, hãy viết module mới THEO ĐÚNG cấu trúc này:
<dán 4 file buildings.schema.ts, buildings.service.ts, buildings.controller.ts, buildings.routes.ts>

Schema Prisma liên quan:
<dán model Room và Building>

Yêu cầu: viết module "rooms" gồm 4 file tương tự, với các API:
- GET /api/rooms?buildingId=&status=  (lọc tùy chọn)
- POST /api/rooms, PATCH /api/rooms/:id, DELETE /api/rooms/:id
Quy tắc nghiệp vụ:
- Chỉ thao tác được phòng thuộc tòa nhà của chủ nhà đang đăng nhập (kiểm tra building.ownerId)
- Tên phòng không trùng trong cùng tòa nhà → lỗi 409
- Không xóa phòng đang có hợp đồng ACTIVE → lỗi 409
Sau khi viết code, giải thích ngắn gọn từng hàm làm gì.
```

### 2. Viết trang frontend mới
```
Project React 19 + TypeScript + Ant Design 6 + TanStack Query 5.
<dán CONVENTIONS.md phần Frontend>
Trang mẫu:
<dán BuildingsPage.tsx, BuildingFormModal.tsx, api/buildings.ts>
Kiểu dữ liệu:
<dán interface Room từ types/index.ts>

Hãy viết RoomsPage.tsx, RoomFormModal.tsx, api/rooms.ts theo đúng mẫu trên.
Thêm: ô chọn tòa nhà ở đầu trang để lọc danh sách; cột trạng thái hiển thị Tag màu
(Trống: xanh lá, Đang thuê: xanh dương, Sửa chữa: cam).
```

### 3. Hiểu code (dùng nhiều nhất)
```
Giải thích đoạn code sau cho người mới học, từng dòng một.
Nó chạy khi nào, nhận vào gì, trả ra gì? Nếu bỏ dòng X thì chuyện gì xảy ra?
<dán code>
```

### 4. Sửa lỗi
```
Mình gặp lỗi khi <làm gì>.
Thông báo lỗi đầy đủ:
<dán NGUYÊN VĂN lỗi ở terminal hoặc console, đừng tóm tắt>
Code liên quan:
<dán file>
Mình đã thử: <...>
Hãy giải thích NGUYÊN NHÂN trước, rồi mới đưa cách sửa.
```

### 5. Viết test
```
Đây là hàm tính tiền và quy tắc nghiệp vụ:
<dán hàm + phần liên quan trong docs/03-cong-thuc-tinh-tien.md>
Viết test vitest cho hàm này, gồm trường hợp bình thường, biên (0, đúng mốc bậc), và lỗi.
Với mỗi test, ghi comment phép tính tay để mình kiểm tra lại.
```

### 6. Tự kiểm tra trước khi mở PR
```
Review đoạn code sau như một giảng viên khó tính:
- Có lỗ hổng bảo mật không (thiếu kiểm tra quyền, lộ dữ liệu của người khác)?
- Có trường hợp nào làm sai dữ liệu không (thiếu transaction, chạy 2 lần)?
- Có gì vi phạm quy ước này không: <dán CONVENTIONS.md>
<dán code>
```

### 7. Luyện vấn đáp
```
Mình làm phần <...> trong project quản lý nhà trọ. Code:
<dán code>
Hãy đóng vai giảng viên, hỏi mình lần lượt 5 câu từ dễ đến khó về đoạn code này.
Đợi mình trả lời từng câu rồi mới nhận xét và hỏi câu tiếp.
```

## Dấu hiệu AI đang viết sai, cần cảnh giác
- Gọi `fetch`/`axios` trực tiếp trong component, không qua `src/api/`
- Truy vấn Prisma theo `id` mà **không** lọc `ownerId`
- Dùng `try/catch` trong controller (Express 5 không cần)
- Dùng `Float` hoặc `Decimal` cho tiền
- Dùng prop cũ của Ant Design (`visible` thay vì `open`, `destroyOnClose`...). Nếu VS Code gạch ngang tên prop (deprecated) thì hỏi lại AI
- Tự thêm thư viện mới. **Hỏi nhóm trước** khi `npm install` thêm bất cứ thứ gì
