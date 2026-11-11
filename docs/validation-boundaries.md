# Validation ID tại biên dữ liệu

## Thiết kế

Luồng dữ liệu: HTTP không tin cậy → schema Zod → giá trị đã kiểm tra → kiểm tra quyền/nghiệp vụ → Prisma → ràng buộc DB.
TypeScript chỉ kiểm tra code lúc biên dịch; dữ liệu HTTP luôn cần runtime validation.
Không chuyển lỗi input thành 500, không dựa vào exception của database để phát hiện ID sai.
Validation cú pháp không thay cho kiểm tra tòa nhà/phòng thuộc chủ nhà trong service/transaction.

- `backend/src/validation/id.schema.ts`: nguồn chung cho giới hạn ID và cách parse dữ liệu wire.
- `httpIdSchema`: query/path phải là chuỗi ASCII thập phân chuẩn `[1-9][0-9]*`, tối đa 10 ký tự,
  giá trị 1..2147483647. Kiểm tra chuỗi trước khi chuyển number; từ chối khoảng trắng, dấu,
  số 0 đầu, thập phân, hex, số mũ, mảng, object và query lặp.
- `databaseIdSchema`: body JSON phải là number nguyên dương trong cùng phạm vi; không nhận chuỗi hoặc boolean.
  JSON number `1e3` được JSON parser giải mã thành số 1000 và có cùng ý nghĩa với `1000`;
  không kiểm tra cách viết số trong raw JSON. Chuỗi URL `1e3` và chuỗi JSON `"1e3"` bị từ chối.
- `parseId`: adapter cho path, dùng schema chung và chuyển lỗi thành AppError 400 có chi tiết trường `id`.
- `meter-readings.schema.ts`: hợp đồng query/body riêng của module, kiểm tra trước mọi truy vấn/transaction.
- Rooms dùng cùng schema cho buildingId trong query/body; buildings/rooms/tenants dùng helper path chung,
  bao gồm route tạo tài khoản khách thuê trước đây gọi Number trực tiếp.

JSON lỗi giữ hợp đồng hiện có `{ message, details }`; path và Meter Readings trả chi tiết có `path`, `code`, `message`.
Middleware body của module cũ vẫn giữ cấu trúc fieldErrors hiện có để tránh đổi hợp đồng ngoài phạm vi.

| Trường hợp | HTTP |
|---|---|
| Thiếu ID bắt buộc, sai kiểu, sai định dạng hoặc vượt giới hạn | 400 |
| ID hợp lệ nhưng không tìm thấy tài nguyên thuộc chủ nhà | 404 |
| Chưa xác thực / sai vai trò | 401 / 403 theo middleware hiện có |
| ID hợp lệ nhưng kỳ đã có hóa đơn phát hành | 409 theo nghiệp vụ hiện có |
| Lỗi database/hệ thống ngoài dự kiến | 500, không đổi mọi lỗi Prisma thành 400 |

Đây là thay đổi hợp đồng có chủ đích: các URL như `?buildingId=01`, `?buildingId=1e3`
trước đây có thể được coerce thành ID, nay phải gửi `?buildingId=1`, `?buildingId=1000`.
Không đổi schema DB, không migration, không chuyển ID sang BigInt hoặc string trong JSON body.
Phạm vi này là ID trong params/query/body; chưa thay đổi cách xác thực JWT hoặc validation các trường khác.

## Tham khảo thiết kế

- [Google AIP-193 — Errors](https://google.aip.dev/193): học nguyên tắc mã lỗi nhất quán và chi tiết lỗi
  có thể xử lý bằng chương trình. Dự án giữ envelope Express hiện có, không tuyên bố tuân thủ toàn bộ google.rpc.Status.
- [Google AIP-203 — Field behavior](https://google.aip.dev/203): mô tả bắt buộc/tùy chọn phải rõ;
  annotation/tài liệu không tự tạo validation, nên vẫn thực thi bằng schema Zod phía server.
- [Meta fbthrift — IDL](https://github.com/facebook/fbthrift/blob/main/thrift/doc/idl/index.md): tham khảo
  hợp đồng kiểu dữ liệu tường minh và integer có độ rộng xác định. Việc dùng Int32 và định dạng URL chuẩn
  là quyết định cụ thể của dự án theo Prisma/PostgreSQL, không phải chính sách ID chung của Meta.

## Kiểm chứng

`npm --prefix backend test` chạy test schema và HTTP loopback với Prisma giả, không dùng DB thật.
Test bao phủ min/max, max+1, chuỗi quá dài, dấu/số mũ/hex/số thập phân, khoảng trắng,
Unicode digit, kiểu sai, query lặp, body lồng sai ID và lỗi có đường dẫn trường.
Test HTTP xác nhận request sai không gọi Prisma/mở transaction, ID hợp lệ vẫn tới truy vấn ở dạng number,
trả 404 cho tài nguyên không tồn tại và 200 cho truy vấn hợp lệ.
Test HTTP cần quyền mở cổng loopback trong môi trường sandbox.
