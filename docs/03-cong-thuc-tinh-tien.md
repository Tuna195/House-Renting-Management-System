# Công thức tính tiền

> Cập nhật ngày 06/10/2026 theo thông tin nghiệp vụ được cung cấp.
> Các quy tắc đã xác nhận được ghi dưới đây; các chi tiết chưa xác nhận phải chốt trước khi triển khai.

## Hóa đơn một tháng gồm những khoản nào

```text
Tổng = Tiền phòng theo ngày thực tế + Tiền điện + Tiền nước
     + Tiền dịch vụ cố định theo phòng + Chi phí sửa chữa − Giảm giá
Số tiền cần thanh toán tháng cuối = Tổng − Tiền cọc được khấu trừ
```

Mỗi khoản là một dòng `InvoiceItem` (loại, mô tả, số lượng, đơn giá, thành tiền).
Tiền lưu dưới dạng **số nguyên VND**; kỳ hóa đơn có dạng `YYYY-MM`.
Khoản giảm giá và cọc được khấu trừ là các dòng giảm trừ, không cộng vào số tiền phải trả.

**Làm rõ công thức được cung cấp:** đơn giá phòng theo tháng là cố định trong hợp đồng,
nhưng tiền phòng thực thu phụ thuộc số ngày thuê ở. Giảm giá được **trừ** khỏi tổng tiền.

## 1. Tiền phòng

- Tiền phòng tính theo **số ngày thực tế thuê ở** trong kỳ.
- Ở đủ tháng: tiền phòng bằng `rentPrice` của hợp đồng.
- Vào hoặc trả phòng giữa tháng: tính theo số ngày thực tế, hoặc theo thỏa thuận riêng được ghi trong hợp đồng.

Công thức phân bổ theo ngày để chốt triển khai:

```text
Tiền phòng = Giá thuê tháng × Số ngày thuê ở trong kỳ / Số ngày của tháng
```

Ví dụ minh họa: giá 3.100.000đ/tháng, số ngày thuê ở đã xác nhận là 16 ngày trong tháng có 31 ngày:
`3.100.000 × 16 / 31 = 1.600.000đ`.

**Cần chốt:**

- Ngày vào và ngày trả phòng có được tính là ngày thuê ở không?
- Có xác nhận dùng số ngày lịch thực tế của tháng làm mẫu số như công thức trên không?
- Làm tròn đến đơn vị nào, làm tròn lên hay gần nhất? Chưa xác nhận quy tắc làm tròn đến 1.000đ của bản nháp.
- Thu tiền phòng trước hay sau kỳ thuê?
- Cách ghi nhận và áp dụng thỏa thuận riêng trong hợp đồng.

## 2. Tiền điện

- Mỗi phòng có **công tơ riêng**, không chia đều tiền điện giữa các phòng.
- Chốt chỉ số vào **cuối tháng**.

```text
Số kWh tiêu thụ = Chỉ số mới − Chỉ số cũ
Tiền điện = Σ (Số kWh thuộc từng bậc × Đơn giá của bậc đó)
```

Áp dụng **biểu giá EVN theo bậc thang lũy tiến**: mỗi phần điện tiêu thụ được tính theo bậc tương ứng.
Đơn giá thay đổi theo hạn mức sử dụng; không lấy đơn giá của bậc cao nhất nhân với toàn bộ số kWh.
Không dùng một đơn giá cố định cho toàn bộ lượng điện tiêu thụ.

Chưa có bảng giá, hạn mức và thời điểm hiệu lực cụ thể trong thông tin được cung cấp.
Trước khi triển khai, cần xác nhận biểu giá EVN áp dụng, cách áp dụng định mức cho phòng thuê,
thuế/phí nếu có và cách cập nhật khi biểu giá thay đổi. Tài liệu này không công bố giá EVN hiện hành.

**Cần chốt:** cách xử lý thay công tơ hoặc chỉ số mới nhỏ hơn chỉ số cũ; không tự coi chênh lệch âm là tiêu thụ hợp lệ.

## 3. Tiền nước

- Tính theo **số m³ thực tế** qua đồng hồ nước, không tính theo đầu người hoặc mức cố định mỗi phòng.
- Chốt chỉ số vào **cuối tháng**.
- Đơn giá mỗi m³ tùy địa phương; cần xác nhận đơn giá và thời điểm áp dụng cho từng khu trọ.

```text
Số m³ tiêu thụ = Chỉ số mới − Chỉ số cũ
Tiền nước = Số m³ tiêu thụ × Đơn giá nước áp dụng
```

Ví dụ với đơn giá giả định 25.000đ/m³: `5 × 25.000 = 125.000đ`.
Đây là ví dụ tính toán, không phải giá nước chung cho mọi địa phương.

## 4. Dịch vụ và phụ phí

- Internet/Wi-Fi, vệ sinh, rác, điện hành lang, bảo vệ: thu mức cố định chung **theo từng phòng**.
- Không tính các khoản này theo số người; chỉ thu những dịch vụ đã thỏa thuận trong hợp đồng.
- **Không thu thêm tiền gửi xe**, không phát sinh phí theo loại xe.
- **Không thu phụ phí đầu người** khi phòng có thêm người ở.

```text
Tiền dịch vụ = Tổng các khoản dịch vụ cố định theo phòng đã thỏa thuận
```

**Cần chốt:** mức phí cụ thể, thu gộp hay tách từng dịch vụ và có phân bổ phí theo ngày khi vào/trả phòng giữa tháng không.

## 5. Chi phí sửa chữa và giảm giá

- Phát sinh chi phí sửa chữa khi người thuê làm hỏng tài sản; ghi rõ hạng mục và số tiền được xác nhận.
- Có chính sách giảm giá cho thương binh, liệt sĩ, hộ nghèo, sinh viên khó khăn.
- Giảm giá là khoản giảm trừ trên hóa đơn.

**Cần chốt:** mức giảm bằng số tiền hay tỷ lệ, khoản tiền được giảm, điều kiện áp dụng,
cách xử lý nhiều diện ưu đãi và cách xác nhận chi phí hỏng hóc. Chưa tự đặt mức giảm hoặc phí sửa chữa.

## 6. Hạn thanh toán và quá hạn

- **Không có phí phạt hoặc tiền trả chậm**.
- Hóa đơn quá hạn chưa trả đủ có thể hiển thị trạng thái quá hạn, nhưng không tự cộng phí phạt.
- Quy ước hạn thanh toán hiện có trong tài liệu dự án: `dueDate` là ngày `invoiceDueDay` của tháng sau kỳ.
  Ví dụ: kỳ `2026-10`, `invoiceDueDay = 5` → hạn **05/11/2026**.
  Thông tin mới chưa xác nhận ngày đến hạn cụ thể; cần xác nhận quy ước này khi chốt lịch thu tiền.

## 7. Thanh toán

Giữ quy ước ghi nhận thanh toán hiện có:

- `paidAmount` là tổng các `Payment` của hóa đơn.
- `paidAmount = 0` → `UNPAID`.
- `0 < paidAmount < totalAmount` → `PARTIAL`.
- `paidAmount ≥ totalAmount` → `PAID`.

**Cần chốt:** xử lý trả thừa, hóa đơn có số tiền bằng 0 hoặc âm sau giảm giá/khấu trừ cọc.
Không tự quyết định chuyển số dư sang tháng sau hoặc hoàn tiền.

## 8. Tiền cọc và hóa đơn tháng cuối

- Tiền cọc lưu ở `Contract.deposit`, không cộng thành phí thuê hằng tháng.
- Khi trả phòng, **trừ trực tiếp tiền cọc vào hóa đơn tháng cuối nếu không phát sinh hỏng hóc tài sản**.
- Hóa đơn tháng cuối gồm tiền phòng theo ngày thực tế, điện nước cuối kỳ, dịch vụ và các khoản đã xác nhận,
  sau đó trừ giảm giá và khoản cọc đủ điều kiện khấu trừ.
- Khoản cọc khấu trừ cần được thể hiện riêng để đối chiếu; không ghi nhận trùng như một khoản thanh toán mới.

**Cần chốt:** khi có hỏng hóc, tiền cọc được giữ lại, dùng bù chi phí sửa chữa hay xử lý theo cách nào;
cách xử lý cọc lớn hơn hóa đơn cuối và thời điểm chốt công tơ khi trả phòng trước cuối tháng.

## 9. Ví dụ hóa đơn minh họa

Các đơn giá điện bên dưới **hoàn toàn giả định**, chỉ minh họa cách tính lũy tiến:

| Bậc | Phần điện tiêu thụ | Đơn giá giả định (VND/kWh) |
|---|---|---|
| 1 | 50 kWh đầu tiên | 2.000 |
| 2 | 50 kWh tiếp theo | 2.500 |
| 3 | Phần vượt 100 kWh | 3.000 |

Với 130 kWh: `50 × 2.000 + 50 × 2.500 + 30 × 3.000 = 315.000đ`.

### Ví dụ 1: Ở đủ tháng

Phòng P101, kỳ `2026-10`, giá phòng 3.100.000đ/tháng. Nước và dịch vụ dùng mức phí giả định.

| Khoản | Chi tiết | Thành tiền (VND) |
|---|---|---|
| Tiền phòng | 31/31 ngày | 3.100.000 |
| Điện | 1250 → 1380 = 130 kWh, theo bảng giả định | 315.000 |
| Nước | 210 → 215 = 5 m³ × 25.000 | 125.000 |
| Dịch vụ | Mức cố định theo phòng | 150.000 |
| **Tổng** | | **3.690.000** |

Không cộng phí gửi xe, phụ phí người ở hoặc phí trả chậm.

### Ví dụ 2: Ở một phần tháng

Số ngày thuê ở đã được xác nhận là 16/31 ngày; ví dụ không quyết định cách tính ngày vào/ngày trả phòng.
Phí dịch vụ 150.000đ là số tiền đã thỏa thuận riêng cho kỳ này, không khẳng định phải thu đủ khi ở giữa tháng.

| Khoản | Chi tiết | Thành tiền (VND) |
|---|---|---|
| Tiền phòng | 3.100.000 × 16/31 | 1.600.000 |
| Điện | 40 kWh × 2.000, theo bảng giả định | 80.000 |
| Nước | 2 m³ × 25.000 | 50.000 |
| Dịch vụ | Số tiền đã thỏa thuận cho kỳ | 150.000 |
| **Tổng** | | **1.880.000** |

### Ví dụ 3: Tháng cuối, giảm giá và trừ cọc

Dùng các khoản của ví dụ 1; không có hỏng hóc, mức giảm giá đã xác nhận giả định là 100.000đ,
cọc đủ điều kiện khấu trừ là 1.000.000đ.

| Khoản | Thành tiền (VND) |
|---|---|
| Tổng tiền phòng, điện, nước, dịch vụ | 3.690.000 |
| Giảm giá | −100.000 |
| **Tổng sau giảm giá** | **3.590.000** |
| Khấu trừ cọc | −1.000.000 |
| **Số tiền cần thanh toán** | **2.590.000** |

## 10. Đối chiếu triển khai hiện tại

Tài liệu này cập nhật nghiệp vụ; code và schema chưa được thay đổi trong lần cập nhật này.
Trong `backend/src/modules/billing/billing.ts`, hàm điện giá cố định đã có;
hàm điện bậc thang, tiền nước và phân bổ tiền phòng vẫn là TODO.
Code còn khai báo nước `PER_PERSON` và ghi chú làm tròn tiền phòng đến 1.000đ;
những nội dung đó không phải quy tắc đã xác nhận trong tài liệu này.

Khi triển khai, cần cập nhật logic/schema/API liên quan và bổ sung kiểm thử theo hành vi đã chốt:
điện qua nhiều bậc, nước theo m³, phòng đủ tháng/giữa tháng, dịch vụ theo phòng,
không thu phí xe/phụ phí người/phạt chậm, giảm giá và khấu trừ cọc tháng cuối.
Các ví dụ trên là dữ liệu minh họa tính tay; chỉ đưa vào regression sau khi chốt các chi tiết còn mở.
