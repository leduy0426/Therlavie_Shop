---
phase: 1
title: Analysis_Discrepancies
status: completed
priority: P1
dependencies: []
---

# Phase 1: Analysis of Inconsistencies & Discrepancies (UC-31 to UC-40)

## Overview
Phân tích toàn diện và chỉ rõ các điểm mâu thuẫn, thiếu sót giữa Use Case Specifications, các Interaction Diagrams (Sequence & Communication), Activity Diagrams, State Machine Diagrams, và Bảng Business Rules trong tài liệu Course Project Report G5.

## 1. Mâu thuẫn về Business Rules & Ràng buộc dữ liệu (Data Constraints)

### 1.1. Thời gian hiệu lực của OTP (BR-02 vs UC Specs vs Diagrams)
- **Trong bảng Business Rules**: `BR-02` quy định: *"An OTP is valid for exactly 3 minutes (180 seconds) from the time it is issued."* Bảng State Life Flow của thực thể `User` cũng ghi: `sendEmailOTP(valid=180s)`.
- **Trong Use Case Specs**: UC-31, UC-32, UC-35, UC-39 đều ghi: *"valid for 5 minutes (BR-02, NFR-03)"*.
- **Trong Activity Diagrams**: Cả UC-31, UC-35, UC-39 đều có block action *"Generate 6-digit OTP (valid 5 min)"*.
- **Trong Sequence Diagrams**: UC-35 ghi rõ `generateResetOTP(validity=5m)`.
- **Giải pháp chuẩn hóa khi code**: Thống nhất dùng hằng số cấu hình `OTP_EXPIRATION_SECONDS = 300` (5 phút) cho trải nghiệm người dùng thực tế không bị quá gấp gáp, hoặc `180` (3 phút) tuân thủ nghiêm ngặt `BR-02`. Cần cấu hình qua Environment Variable `AUTH_OTP_TTL_SECONDS` để có thể thay đổi linh hoạt.

### 1.2. Giới hạn số lượng địa chỉ giao hàng tối đa (BR-14 vs UC-38 Spec)
- **Trong bảng Business Rules**: `BR-14` quy định: *"A User can save a maximum of 05 delivery addresses in the personal profile."* Bảng State Life Flow của `DeliveryAddress` ghi guard condition `[accountAddressCount < 5]`.
- **Trong UC-38 Spec (Exceptions 1.0.E2)**: Ghi *"Exceeds maximum allowed addresses (10 addresses/account) -> System rejects addition: 'Address limit reached (max 10)'"*.
- **Giải pháp chuẩn hóa khi code**: Chuẩn hóa theo `BR-14` và State Diagram: Mỗi khách hàng chỉ được lưu **tối đa 5 địa chỉ** (`MAX_SAVED_ADDRESSES = 5`). Cập nhật lại thông báo lỗi tương ứng.

### 1.3. Lỗi trích dẫn chéo mã số Business Rule (BR Citation Mismatches)
- **UC-31 (bước 5.0)**: Trích dẫn `verifies email uniqueness across existing active user accounts (BR-01)`. Nhưng `BR-01` trong bảng là *"Guest must be verified via OTP..."*. Quy tắc email uniqueness cần được gán mã đúng hoặc giữ dưới dạng entity constraint `UNIQUE(email)`.
- **UC-33 & UC-40**: Trích dẫn `checkSelfModificationRule(adminId != targetUserId - BR-11)`. Nhưng `BR-11` trong bảng là *"A password must contain at least 8 characters..."*. Ràng buộc Admin không được tự khóa chính mình là Business Rule an toàn hệ thống (cần đánh số riêng, ví dụ `BR-ADMIN-01` hoặc gắn với `BR-33`).
- **UC-32 (bước 9.0) & UC-33 (bước 10.0)**: Trích dẫn `merges guest cart into user account cart (BR-15)`. Nhưng `BR-15` trong bảng quy định *"liên kết các đơn hàng cũ của Guest với tài khoản mới tạo"*, không phải gộp giỏ hàng.
- **UC-37 (bước 5.0)**: Trích dẫn `validatePhoneFormat(phone, 10 digits - BR-19)`. Trong khi `BR-19` là quy tắc tự động gợi ý kích thước (Size Recommendation Engine) dựa trên chỉ số chiều cao/cân nặng!

### 1.4. Thời hạn sống của Access Token & Refresh Token (BR-13 vs UC-33)
- `BR-13`: JWT Access Token có hạn 60 phút, Refresh Token có hạn 7 ngày.
- UC-33 (Other Info): Access Token 15 phút, Refresh Token hỗ trợ Remember Me lên tới 30 ngày (Alternative Flow 1.1).
- **Giải pháp**: Phân chia rõ ràng: Access Token mặc định 15 phút (theo chuẩn OWASP), Refresh Token mặc định 7 ngày, nếu chọn "Remember Me" thì Refresh Token kéo dài 30 ngày.

---

## 2. Thiếu sót & Sai lệch giữa UC Spec và Sequence / Communication Diagrams

| UC ID | Chi tiết thiếu sót / mâu thuẫn | Vị trí trong Spec & Activity Diagram | Vị trí trên Sequence & Communication Diagram | Tác động khi code |
|-------|-------------------------------|--------------------------------------|----------------------------------------------|-------------------|
| **UC-31** | Thiếu tạo thực thể `CustomerProfile` | State Life Flow ghi rõ: UC-31 tạo CustomerProfile ở trạng thái EMPTY | Sequence chỉ gọi `UserRepository.saveUser`, không có `CustomerProfileRepo` | Nếu không tạo profile rỗng, khi sang UC-37 get/update profile sẽ bị lỗi `NullPointerException` hoặc `Record Not Found`. |
| **UC-32** | Thiếu logic gộp giỏ hàng (Cart Merger) | Spec 9.0 và Activity Diagram có rẽ nhánh "Guest cart exists? -> Merge cart" | Hoàn toàn không có `CartService` hay `CartRepository` | Khách chọn hàng trước khi verify email xong sẽ bị mất giỏ hàng. |
| **UC-33** | Thiếu logic gộp giỏ hàng (Cart Merger) | Spec 10.0 và Activity Diagram có rẽ nhánh Customer: "Merge guest cart" | Hoàn toàn không có `CartService` | Đăng nhập xong giỏ hàng vãng lai không được chuyển vào giỏ hàng tài khoản. |
| **UC-33** | Điều hướng trả về sai vai trò | Spec 12.0 & Activity Diagram phân luồng: Customer về Storefront; Admin/Staff về Backoffice Dashboard | Sequence chỉ trả về `display Dashboard (Authenticated)` | Gây hiểu nhầm là khách hàng cũng truy cập vào Dashboard quản trị. |
| **UC-34** | Trộn lẫn JWT Blacklist và Refresh Token Revoke | Spec bước 3.0: Blacklist Access Token (JTI), bước 4.0: Xóa Refresh Token trong DB | Sequence gọi `TokenService.blacklistToken(refreshToken)` | Sai bản chất: Token blacklist chỉ áp dụng cho JTI của access token ngắn hạn; refresh token là bản ghi DB nên phải update trạng thái REVOKED/DELETED. |
| **UC-34** | Thiếu ghi Audit Log | Spec 7.0 & Activity Diagram có bước ghi Audit Log | Không có `AuditLogRepository` | Bỏ sót yêu cầu kiểm toán an toàn thông tin NFR-11. |
| **UC-35** | Thiếu kiểm tra sự tồn tại của Email ở bước 1 | Spec 3.0 & Activity Diagram kiểm tra email tồn tại -> hiển thị generic response nếu không có | Sequence gọi thẳng `generateResetOTP` và gửi mail mà không hỏi `UserRepository` | Lỗi logic backend, không biết gửi OTP cho user nào hoặc tạo OTP rác. |
| **UC-36** | Thiếu gửi email cảnh báo bảo mật và ghi Audit Log | Spec 9.0 & Activity Diagram có gửi alert email và ghi audit log | Không có `NotificationService` và `AuditLogRepository` | Người dùng bị đổi mật khẩu trái phép không được cảnh báo qua email. |
| **UC-37** | Thiếu cập nhật bảng `User` (chỉ cập nhật `CustomerProfile`) | Spec 7.0 & Activity Diagram ghi "Update User & CustomerProfile entities" (Họ tên, SĐT) | Sequence chỉ gọi `CustomerProfileRepo.save(...)`, không gọi `UserRepository` | Họ tên và SĐT trong bảng `User` không được đồng bộ khi khách đổi profile. |
| **UC-37** | Bỏ qua xử lý tải lên Avatar qua Media Storage | Spec 6.0, Deployment Diagram Node 11 (Cloud Media Storage), Activity Diagram | Sequence truyền `avatarFile` nhưng không có `MediaStorageService` | Không có thành phần xử lý file upload, resize, validate MIME type 3MB. |
| **UC-38** | Chỉ vẽ Add New, bỏ sót hoàn toàn Edit, Delete, Set Default | Spec & Activity Diagram mô tả trọn vẹn CRUD và check đơn đang giao | Sequence chỉ có `submitNewAddress(isDefault=true)` | Thiếu toàn bộ luồng cập nhật, xóa địa chỉ và bảo vệ không xóa địa chỉ có đơn đang ship. |
| **UC-38** | Thiếu kiểm tra giới hạn 5 địa chỉ | BR-14 và State Diagram quy định tối đa 5 địa chỉ | Sequence không có bước đếm địa chỉ hiện tại | Cho phép người dùng thêm vô hạn địa chỉ, vi phạm ràng buộc hệ thống. |
| **UC-39** | Thiếu lưu trạng thái session Guest đã xác thực | Spec 10.0: Đánh dấu session 'Phone Verified' để mở khóa UC-08 trong 15 phút | Sequence chỉ trả `verified=true`, không lưu vào DB hay Session Store | Phía backend UC-08 không thể kiểm tra được request đặt hàng có thực sự đã qua OTP hay chưa. |
| **UC-40** | Thiếu `AuditLogRepository` | Spec 10.0 & Activity Diagram: Ghi Audit Log hành động Admin | `UserService` tự gọi hàm nội bộ nhưng không có Lifeline `AuditLogRepository` | Nhật ký phân quyền và khóa tài khoản không được lưu vào cơ sở dữ liệu. |
| **UC-40** | Chỉ mô tả cập nhật, thiếu luồng hiển thị danh sách người dùng | Spec 2.0-3.0 & Activity Diagram: Admin mở bảng, tìm kiếm, lọc, phân trang | Sequence chỉ vẽ 1 hàm duy nhất `updateUserManagement` | Thiếu luồng API quan trọng nhất của màn hình quản trị: `GET /api/v1/admin/users`. |

---

## 3. Lỗi chính tả & hiển thị đồ họa trên biểu đồ
- **UC-37 Sequence & Communication**: Mũi tên từ `ProfileView` sang `UserController` ghi nhãn `..1: updateProfile(profileDto)` (thiếu số 1 ở đầu, đúng phải là `1.1`).
- **UC-40 Sequence**: Tên lifeline đầu tiên bị ngắt chữ: `UserManagementVie \n w`.
