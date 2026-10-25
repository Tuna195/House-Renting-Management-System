# Công thức tính tiền

> Cập nhật ngày 25/10/2026 theo nghiệp vụ và quy tắc làm tròn đã xác nhận (bản gốc ngày 06/10/2026).
> Các quy tắc đã xác nhận được ghi dưới đây; các chi tiết chưa xác nhận phải chốt trước khi triển khai.

## Hóa đơn một tháng gồm những khoản nào

```text
Tổng trước giới hạn = Tiền phòng theo ngày thực tế + Tiền điện + Tiền nước
                    + Tiền dịch vụ cố định theo phòng + Chi phí sửa chữa − Giảm giá
Tổng = max(0, Tổng trước giới hạn)
Công nợ hóa đơn còn lại = max(0, Tổng − Các khoản đã thanh toán)
Số tiền còn phải trả sau quyết toán = Công nợ hóa đơn còn lại − Cọc dùng thanh toán công nợ
```

Mỗi khoản là một dòng `InvoiceItem` (loại, mô tả, số lượng, đơn giá, thành tiền).
Tiền lưu dưới dạng **số nguyên VND**; kỳ hóa đơn có dạng `YYYY-MM`.
Giảm giá là dòng giảm trừ trên hóa đơn. Tiền cọc được theo dõi riêng; khi dùng cọc thanh toán công nợ,
ghi nhận một lần là khoản thanh toán bằng cọc, không đồng thời trừ khỏi tổng giá trị hóa đơn.

**Làm rõ công thức được cung cấp:** đơn giá phòng theo tháng là cố định trong hợp đồng,
nhưng tiền phòng thực thu phụ thuộc số ngày thuê ở. Giảm giá được **trừ** khỏi tổng tiền.

## 1. Tiền phòng

- Tiền phòng tính theo **mức cố định theo tháng** trong hợp đồng.
- Ở đủ tháng: tiền phòng bằng `rentPrice` của hợp đồng.
- Vào ở giữa tháng: tiền phòng tháng đầu tính theo số ngày thực tế thuê ở trong tháng đó.
- Các tháng tiếp theo thu mức tiền phòng tháng như bình thường. Cách tính khi trả phòng giữa tháng cần bàn thêm cùng quy tắc hóa đơn tháng cuối.
- Thỏa thuận riêng về tiền phòng cần được ghi trong hợp đồng.

Công thức phân bổ cho tháng vào ở giữa tháng:

```text
Tiền phòng = Giá thuê tháng × Số ngày thuê ở trong kỳ / Số ngày của tháng
```

Ví dụ minh họa: giá 3.100.000đ/tháng, số ngày thuê ở đã xác nhận là 16 ngày trong tháng có 31 ngày:
`3.100.000 × 16 / 31 = 1.600.000đ`.

Chốt ngày 25/10/2026: tiền phòng một phần tháng làm tròn gần nhất đến **1.000đ**;
đúng nửa nghìn làm tròn lên (`Math.round`). Ở đủ tháng giữ nguyên giá hợp đồng, kể cả khi giá không tròn nghìn.
Số ngày thuê ở phải được cung cấp sau khi xác nhận; hàm không tự tính ngày vào/ra.

**Cần chốt:**

- Ngày vào và ngày trả phòng có được tính là ngày thuê ở không?
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

### Thay công tơ trong kỳ

Khi thay công tơ, chốt công tơ cũ rồi bắt đầu lượt đo mới.

- **Không thay công tơ:** chỉ số mới nhỏ hơn chỉ số cũ là lỗi, yêu cầu kiểm tra lại; không tự quy về 0.
- **Có thay công tơ:** ghi ngày thay, chỉ số cuối công tơ cũ và chỉ số ban đầu công tơ mới.
  Mỗi lượt đo phải có chỉ số cuối không nhỏ hơn chỉ số đầu.

```text
Điện tiêu thụ trong kỳ
  = (Chỉ số cuối công tơ cũ − Chỉ số đầu kỳ)
  + (Chỉ số cuối kỳ công tơ mới − Chỉ số lúc lắp)
```

Cộng lượng điện của hai lượt đo rồi áp bảng bậc thang một lần cho cả kỳ;
không khởi động lại hạn mức bậc khi lắp công tơ mới.
Ví dụ: công tơ cũ `1250 → 1300`, công tơ mới `10 → 90` → `50 + 80 = 130 kWh`.

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

- Internet/Wi-Fi, vệ sinh, rác, điện hành lang, bảo vệ, gửi xe: thu mức cố định chung **theo từng phòng**.
- Không tính các khoản này theo số người; chỉ thu những dịch vụ đã thỏa thuận trong hợp đồng.
- **Không thu phụ phí đầu người** khi phòng có thêm người ở; người thuê phải báo cho chủ trọ.

```text
Tiền dịch vụ = Tổng các khoản dịch vụ cố định theo phòng đã thỏa thuận
```

- Mỗi dịch vụ có mức phí riêng theo thỏa thuận trong hợp đồng và được ghi thành một dòng riêng trên hóa đơn.
- Thu cố định theo tháng cho từng phòng, không phân bổ theo ngày; vào hoặc trả phòng giữa tháng vẫn thu đủ phí tháng
  của các dịch vụ đã thỏa thuận.
- Số tiền cụ thể của từng dịch vụ được cấu hình theo hợp đồng; tài liệu này không ấn định mức phí chung.

## 5. Chi phí sửa chữa và giảm giá

- Phát sinh chi phí sửa chữa khi người thuê làm hỏng tài sản; ghi rõ hạng mục và số tiền được xác nhận.
- Có chính sách giảm giá cho thương binh, liệt sĩ, hộ nghèo, sinh viên khó khăn.
- Giảm giá là khoản giảm trừ trên hóa đơn.
- Người thuê cần báo cho chủ trọ và cung cấp minh chứng để được xem xét giảm giá.

Mức giảm, cách tính (số tiền hoặc tỷ lệ), khoản được giảm, điều kiện áp dụng và cách xác nhận
chi phí sửa chữa **theo hợp đồng**. Không tự đặt mức giảm, cộng dồn ưu đãi hoặc tính phí ngoài thỏa thuận.
Trước khi lập hóa đơn, đối chiếu điều khoản và xác nhận số tiền sửa chữa/giảm giá cụ thể của kỳ;
`buildInvoiceItems()` nhận số tiền nguyên VND đã xác nhận, chưa tự diễn giải điều khoản hoặc tính tỷ lệ.

## 6. Hạn thanh toán và quá hạn

- **Không có phí phạt hoặc tiền trả chậm**.
- Hóa đơn quá hạn chưa trả đủ có thể hiển thị trạng thái quá hạn, nhưng không tự cộng phí phạt.
- Quy ước hạn thanh toán hiện có trong tài liệu dự án: `dueDate` là ngày `invoiceDueDay` của tháng sau kỳ.
  Ví dụ: kỳ `2026-10`, `invoiceDueDay = 5` → hạn **05/11/2026**.
  Thông tin mới chưa xác nhận ngày đến hạn cụ thể; cần xác nhận quy ước này khi chốt lịch thu tiền.

## 7. Thanh toán

Giữ quy ước ghi nhận thanh toán hiện có:

- `paidAmount` là tổng các `Payment` của hóa đơn.
- `totalAmount = 0` → `PAID` (không cần thanh toán; không tạo giao dịch thanh toán giả).
- `totalAmount > 0` và `paidAmount = 0` → `UNPAID`.
- `0 < paidAmount < totalAmount` → `PARTIAL`.
- `totalAmount > 0` và `paidAmount ≥ totalAmount` → `PAID`.

Khi người thuê trả thừa, **hoàn lại toàn bộ tiền thừa**, không chuyển sang khấu trừ kỳ sau.
Tổng tiền hóa đơn trong công thức dưới đây đã được giới hạn tối thiểu là 0đ:

```text
Tiền trả thừa = max(0, Tổng tiền đã thanh toán − Tổng tiền hóa đơn)
Tiền thừa còn phải hoàn = Tiền trả thừa − Tiền thừa đã hoàn
```

- Giữ nguyên lịch sử thanh toán và tổng giá trị hóa đơn; ghi khoản hoàn tiền riêng, liên kết với hóa đơn
  và giao dịch thanh toán liên quan. Khoản hoàn tiền thừa không làm hóa đơn đã trả đủ chuyển thành chưa trả đủ.
- Ghi số tiền, người thực hiện, thời điểm và thông tin đối chiếu; chỉ đánh dấu đã hoàn sau khi thực tế trả tiền.
- Tổng tiền hoàn không vượt tiền trả thừa; ngăn ghi nhận hoàn trùng.
- Thông báo cho người thanh toán số tiền thừa và trạng thái hoàn tiền.

Ví dụ: hóa đơn 2.500.000đ, khách đã thanh toán 3.000.000đ → phải hoàn **500.000đ**.
Nếu đã hoàn 200.000đ thì còn phải hoàn **300.000đ**.

Nếu tổng sau giảm giá nhỏ hơn hoặc bằng 0, quy tổng hóa đơn về **0đ**; khách không phải trả thêm.
Phần giảm giá vượt giá trị hóa đơn không được hoàn thành tiền hoặc chuyển sang kỳ sau.
Nếu khách đã thanh toán cho hóa đơn có tổng được quy về 0đ, hoàn toàn bộ số tiền đã thanh toán,
trừ phần đã hoàn trước đó.

Ví dụ: tổng các khoản thu 500.000đ, giảm giá 600.000đ → tổng hóa đơn **0đ**, không phải −100.000đ.
Dùng cọc thanh toán không làm tổng giá trị hóa đơn âm; cọc còn dư được xử lý tại mục 8.

## 8. Tiền cọc và quyết toán khi kết thúc hợp đồng

Tiền cọc được quản lý riêng với tiền thuê và chỉ quyết toán theo thỏa thuận, căn cứ xử lý đã xác nhận.
Không tự động trừ toàn bộ cọc vào hóa đơn cuối hoặc mặc định trả phòng trước hạn là mất cọc.

### 8.1. Thỏa thuận và ghi nhận tiền cọc

- `Contract.deposit` thể hiện mức cọc thỏa thuận, không mặc định bằng một tháng tiền thuê.
- Phân biệt mức cọc phải thu, cọc thực thu và cọc còn giữ; không suy ra đã thu tiền từ `Contract.deposit`.
- Ghi lịch sử thu, hoàn và sử dụng cọc, kèm số tiền, thời điểm, người thực hiện và căn cứ xử lý.
- Lưu điều khoản về mục đích đặt cọc, thời hạn, hoàn cọc, dùng cọc thanh toán và xử lý khi không thực hiện hợp đồng.
- Tiền cọc không cộng vào phí thuê hằng tháng.

### 8.2. Các trường hợp quyết toán

| Trường hợp | Cách xử lý |
|---|---|
| Hoàn thành hợp đồng theo thỏa thuận | Hoàn cọc hoặc dùng cọc thực hiện nghĩa vụ trả tiền theo thỏa thuận đã xác nhận |
| Người thuê trả phòng trước hạn | Xem xét lý do, điều khoản hợp đồng và thỏa thuận chấm dứt; xác nhận căn cứ và khoản xử lý cọc trước khi ghi nhận |
| Bên nhận cọc từ chối giao kết hoặc thực hiện hợp đồng | Ghi riêng khoản hoàn cọc và khoản phải trả thêm theo căn cứ áp dụng |
| Còn tranh chấp hoặc chưa xác nhận khoản xử lý | Giữ phần quyết toán liên quan ở trạng thái chờ xử lý; không đánh dấu đã hoàn tất |

Khoản cọc bị giữ theo điều khoản và khoản bồi thường thiệt hại phải có căn cứ riêng,
không ghi nhận hai lần cho cùng một nghĩa vụ.

### 8.3. Công thức quyết toán

Tính số dư ngay trước đợt quyết toán. Công thức dưới đây áp dụng khi các khoản đã được xác nhận,
không còn phần cọc đang tranh chấp hoặc chờ xử lý:

```text
Cọc còn giữ = Tổng cọc thực thu − Tổng cọc đã hoàn − Tổng cọc đã sử dụng

Cọc hoàn đợt này = Cọc còn giữ
                 − Cọc dùng trả công nợ
                 − Cọc xử lý theo điều khoản đã xác nhận đợt này
```

- **Cọc dùng trả công nợ:** phần cọc hai bên đồng ý dùng thanh toán nghĩa vụ còn nợ,
  như tiền phòng, điện, nước, dịch vụ hoặc sửa chữa đã xác nhận trên hóa đơn.
- **Cọc xử lý theo điều khoản:** phần cọc không hoàn lại theo điều khoản hợp đồng có căn cứ áp dụng
  và đã được xác nhận; ví dụ khoản mất cọc khi chấm dứt hợp đồng theo thỏa thuận.
- Các khoản phân bổ không âm; tổng phân bổ không vượt cọc còn giữ.
  Cọc dùng trả công nợ không vượt số nợ chưa thanh toán.
- Chi phí sửa chữa được ghi trên hóa đơn trước khi phân bổ cọc; không trừ thêm một dòng
  “cọc bù thiệt hại” cho cùng khoản sửa chữa.
- **Cọc không đủ:** người thuê tiếp tục thanh toán phần nghĩa vụ còn thiếu.
- **Cọc còn dư:** ghi nhận số tiền phải hoàn; chỉ đánh dấu đã hoàn sau khi thực tế trả tiền.
- Nếu còn tranh chấp hoặc chưa xác nhận khoản xử lý, giữ phần liên quan chờ xử lý theo mục 8.2;
  không dùng công thức quyết toán hoàn tất để tự động hoàn toàn bộ phần đó.
- Khoản bên nhận cọc phải trả thêm được theo dõi riêng, không cộng vào số dư cọc thực thu.
- Ghi việc sử dụng cọc và thanh toán công nợ liên quan trong cùng transaction, ngăn quyết toán lặp.

Hóa đơn cuối gồm tiền phòng, điện nước, dịch vụ, chi phí sửa chữa đã xác nhận và giảm giá theo quy tắc tương ứng.
Chốt hóa đơn trước khi phân bổ cọc; không sửa giảm tổng hóa đơn chỉ vì dùng cọc để thanh toán.
Cách tính tiền phòng tháng cuối, thời hạn hoàn cọc và thời điểm chốt công tơ khi trả phòng trước cuối tháng
vẫn cần được xác nhận trước khi triển khai luồng quyết toán.

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
| Internet/Wi-Fi | Phí cố định theo phòng/tháng | 100.000 |
| Vệ sinh, rác | Phí cố định theo phòng/tháng | 50.000 |
| **Tổng** | | **3.690.000** |

Ví dụ giả định hợp đồng chỉ thu Internet/Wi-Fi và vệ sinh, rác; mỗi khoản được ghi riêng.
Nếu có thỏa thuận thu gửi xe hoặc dịch vụ khác, ghi thêm từng khoản theo mức phí tháng tương ứng.
Không cộng phụ phí người ở hoặc phí trả chậm.

### Ví dụ 2: Vào ở giữa tháng

Số ngày thuê ở đã được xác nhận là 16/31 ngày; ví dụ không quyết định cách tính ngày vào/ngày trả phòng.
Phí Internet/Wi-Fi 100.000đ/tháng và vệ sinh, rác 50.000đ/tháng là mức giả định đã thỏa thuận.
Dù chỉ ở 16 ngày, vẫn thu đủ từng khoản phí tháng, không chia theo ngày.

| Khoản | Chi tiết | Thành tiền (VND) |
|---|---|---|
| Tiền phòng | 3.100.000 × 16/31 | 1.600.000 |
| Điện | 40 kWh × 2.000, theo bảng giả định | 80.000 |
| Nước | 2 m³ × 25.000 | 50.000 |
| Internet/Wi-Fi | Thu đủ phí tháng | 100.000 |
| Vệ sinh, rác | Thu đủ phí tháng | 50.000 |
| **Tổng** | | **1.880.000** |

### Ví dụ 3: Quyết toán tháng cuối bằng tiền cọc

Ví dụ giả định các bên đã xác nhận dùng cọc thanh toán công nợ; không quyết định cách tính tiền phòng tháng cuối.

Dùng các khoản của ví dụ 1; không có hỏng hóc, mức giảm giá đã xác nhận giả định là 100.000đ,
cọc thực thu còn giữ là 1.000.000đ, chưa có khoản thanh toán trước đó.

| Khoản | Thành tiền (VND) |
|---|---|
| Tổng tiền phòng, điện, nước, dịch vụ | 3.690.000 |
| Giảm giá | −100.000 |
| **Tổng sau giảm giá** | **3.590.000** |
| Thanh toán bằng cọc | 1.000.000 |
| **Số tiền cần thanh toán** | **2.590.000** |

Tổng giá trị hóa đơn vẫn là **3.590.000đ**; khoản thanh toán bằng cọc là **1.000.000đ**.
Không tạo thêm dòng giảm trừ cọc trên hóa đơn.

Ví dụ cọc dư: cọc còn giữ 3.000.000đ, công nợ cuối đã chốt là 2.200.000đ,
bao gồm 1.800.000đ tiền thuê/dịch vụ và 400.000đ sửa chữa đã xác nhận trên hóa đơn.
Nếu thống nhất dùng cọc trả toàn bộ công nợ, không còn tranh chấp hoặc khoản xử lý theo điều khoản,
tiền phải hoàn là `3.000.000 − 2.200.000 = 800.000đ`.
Không trừ thêm 400.000đ sửa chữa khi tính tiền cọc hoàn.

## 10. Đối chiếu triển khai hiện tại

Ngày 25/10/2026, `backend/src/modules/billing/billing.ts` đã triển khai điện bậc thang,
nước theo m³, tiền phòng theo ngày và `buildInvoiceItems(input)` cho một hợp đồng/một kỳ.
Đây là hàm thuần, chưa kết nối API/DB; caller chịu trách nhiệm lấy dữ liệu đúng hợp đồng/phòng,
kiểm tra quyền và lưu hóa đơn trong transaction. Không thay schema trong thay đổi này.

Đầu vào `BuildInvoiceInput` gồm:

- `contract`: mã hợp đồng dương, giá thuê và các dịch vụ theo phòng đã thỏa thuận (`name`, `price`).
- `period`: `YYYY-MM` (năm 0001–9999); `daysStayed`: số ngày ở đã xác nhận.
  Số ngày tháng được tính từ kỳ, gồm quy tắc năm nhuận theo thế kỷ.
- `reading`: kỳ và chỉ số đầu/cuối điện, nước; kỳ chỉ số phải khớp kỳ hóa đơn.
- `electricReplacement` (tùy chọn): một lần thay công tơ điện trong kỳ, gồm `date` (`YYYY-MM-DD`,
  ngày thực tế thuộc kỳ), `oldEnd` (chỉ số cuối công tơ cũ), `newStart` (chỉ số ban đầu công tơ mới).
  Khi có thay, `reading.electricStart` thuộc công tơ cũ và `reading.electricEnd` thuộc công tơ mới.
  Mô tả dòng điện ghi cả hai lượt đo và ngày thay; cộng tiêu thụ trước khi áp bậc thang.
  Chưa hỗ trợ nhiều lần thay trong một kỳ hoặc thay đồng hồ nước.
- `electricityTiers`: bảng giá do caller cung cấp, mốc lũy kế tăng nghiêm ngặt, bậc cuối `upTo: null`.
  Không tích hợp hay tự chọn biểu giá EVN hiện hành.
- `waterPrice`: đơn giá theo m³; `repairs` và `discount` là số tiền đã được xác nhận, không tự áp tỷ lệ ưu đãi.

Đầu ra là mảng dòng `InvoiceItemInput` (chưa có ID): phòng, điện, nước, từng dịch vụ,
từng khoản sửa chữa và giảm giá nếu lớn hơn 0. Dịch vụ thu đủ phí tháng, không theo số người/ngày.
Điện có `quantity = 1`, `unitPrice = amount` là tổng gói bậc thang; mô tả ghi chỉ số và số kWh,
không tạo đơn giá bình quân làm mất phần lẻ. Tiền phòng có `quantity = daysStayed / daysInMonth`,
`unitPrice = rentPrice`; `amount` là kết quả đã làm tròn theo quy tắc trên.
Dòng giảm giá có đơn giá/thành tiền âm. Không thêm cọc, thanh toán hoặc phí trả chậm vào các dòng thu.

Các chỉ số, lượng tiêu thụ, mốc bậc và tiền đầu vào là số nguyên không âm, tối đa `2.147.483.647`.
Mỗi thành tiền và tổng hóa đơn phải nằm trong giới hạn PostgreSQL `Int`.
`sumItems()` cộng đầy đủ các dòng rồi giới hạn tổng tối thiểu 0đ; không giới hạn từng bước cộng.
Dữ liệu sai gây lỗi, kể cả bảng giá sai khi tiêu thụ bằng 0.
`calculateWater` giữ chữ ký cũ để tương thích nhưng từ chối `PER_PERSON`.
`calculateElectricityFlat` còn là tiện ích; hàm lập hóa đơn chỉ dùng bậc thang.

Schema vẫn còn cấu hình giá điện cố định, nước/dịch vụ theo người hoặc số lượng, chưa thể hiện bảng bậc
hay lịch sử quyết toán cọc. `MeterReading` chưa lưu ngày thay và hai chỉ số tại thời điểm thay công tơ;
đầu vào thay công tơ hiện chỉ được hỗ trợ ở hàm thuần, chưa có luồng lưu/đọc API/DB.
Không truyền các cấu hình cũ vào hàm lập hóa đơn như quy tắc đã chốt.
Thanh toán, trả thừa và quyết toán cọc chưa thuộc phạm vi các hàm thuần này.
Các quyết định ngày vào/ra và tiền phòng tháng cuối vẫn cần chốt ở mục 1 và 8.

## 11. Năm ca kiểm thử tính tay chờ người kiểm lại

Các ca dưới đây đã có assertion chạy thực tế trong
[`billing.test.ts`](../backend/src/modules/billing/billing.test.ts).
Giá điện và nước là dữ liệu giả định; số ngày ở được cung cấp sẵn, không suy ra từ ngày vào/ra.
Các phép chia của năm ca này đều cho kết quả nguyên VND; các test bổ sung kiểm tra chính sách làm tròn đã chốt.

| Mã | Ca kiểm thử và đầu vào | Phép tính tay | Kết quả mong đợi (VND) | Người kiểm lại / ngày / kết quả |
|---|---|---|---|---|
| TC-01 | Điện 130 kWh; bậc đến 50: 1.984đ, đến 100: 2.050đ, phần còn lại: 2.500đ | 50 × 1.984 + 50 × 2.050 + 30 × 2.500 = 99.200 + 102.500 + 75.000 | 276.700 | Chờ xác nhận |
| TC-02 | Điện 40 kWh; cùng bảng bậc TC-01 | 40 × 1.984 | 79.360 | Chờ xác nhận |
| TC-03 | Nước 5 m³; đơn giá 25.000đ/m³ | 5 × 25.000 | 125.000 | Chờ xác nhận |
| TC-04 | Tháng đầu ở 16/31 ngày; giá thuê 3.100.000đ/tháng | 3.100.000 × 16 / 31 = 100.000 × 16 | 1.600.000 | Chờ xác nhận |
| TC-05 | Ở đủ 31/31 ngày; giá thuê 3.100.000đ/tháng | 3.100.000 × 31 / 31 | 3.100.000 | Chờ xác nhận |

Ca biên bổ sung: điện 0 kWh với bảng bậc TC-01 → **0đ**.
Đã bỏ ca nước theo đầu người vì không phù hợp với mục 3.

**Trạng thái ngày 25/10/2026:** 228 test chạy qua, không còn `it.todo`.
Bao phủ biên bậc điện, số âm/số lẻ/NaN/vô cực, bảng giá sai, vượt giới hạn DB,
làm tròn quanh nửa nghìn, đủ tháng giữ nguyên giá, năm nhuận 2000/2100, kỳ sai, chỉ số lùi,
dịch vụ cố định, sửa chữa, giảm vượt tổng và tính bất biến đầu vào.
Bổ sung 36 test thay công tơ: cộng hai lượt đo trước khi tính bậc, chỉ số ban đầu khác 0,
ngày thay ở biên kỳ/năm nhuận, ngày sai kỳ/không tồn tại, chỉ số sai/lùi và tổng tiêu thụ vượt giới hạn DB. Không dùng ca 3.940.000đ theo yêu cầu.
Kiểm tra tự động không thay thế xác nhận tính tay của thành viên khác.
Chưa có xác nhận của người kiểm lại. Một thành viên khác cần tính độc lập từng ca rồi điền tên, ngày và kết quả đối chiếu
vào bảng; chỉ khi đó mới hoàn thành yêu cầu “có người kiểm lại”.
