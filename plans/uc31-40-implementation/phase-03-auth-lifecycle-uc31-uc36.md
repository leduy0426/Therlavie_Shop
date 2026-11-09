---
phase: 3
title: Auth_Lifecycle_UC31_UC36
status: completed
priority: P1
dependencies:
  - 2
---

# Phase 3: Authentication Lifecycle Implementation (UC-31 to UC-36)

## Overview
Cài đặt trọn vẹn cụm tính năng định danh và xác thực bảo mật người dùng, bao gồm Đăng ký tài khoản, Xác thực Email qua OTP, Đăng nhập bảo vệ chống Brute-force, Đăng xuất hủy Token kép, Quên mật khẩu và Đổi mật khẩu.

---

## 1. Chi tiết API Endpoints & DTOs

### 1.1. UC-31: Đăng ký tài khoản (Register Account)
- **Method & Path**: `POST /api/v1/auth/register`
- **Request DTO**: `RegisterRequestDto(fullName, email, password, confirmPassword)`
- **Validation Rules**:
  - `email`: định dạng RFC-5322 hợp lệ.
  - `password`: tối thiểu 8 ký tự, có ít nhất 1 chữ hoa, 1 chữ thường, 1 số (tuân thủ `BR-11`).
  - `confirmPassword`: phải khớp chính xác với `password`.
- **Workflow**:
  1. Kiểm tra email đã tồn tại hay chưa.
     - Nếu đã tồn tại và status = `ACTIVE`: ném lỗi `EmailAlreadyInUseException` (HTTP 409).
     - Nếu tồn tại nhưng status = `PENDING_VERIFICATION`: hủy bỏ OTP cũ, sinh OTP mới (Alt flow 1.1).
  2. Băm mật khẩu bằng `BCrypt` (strength 12).
  3. Tạo bản ghi `users` với status = `PENDING_VERIFICATION`.
  4. Khởi tạo đồng thời bản ghi `customer_profiles` (status = EMPTY) liên kết với `user.id`.
  5. Sinh OTP 6 chữ số ngẫu nhiên an toàn, lưu bản ghi hash OTP với TTL 3-5 phút (cooldown gửi lại 60s).
  6. Gửi email xác thực chứa mã OTP qua `NotificationService`.
  7. Trả về `HTTP 201 Created` kèm `{"email": "...", "message": "Verification OTP sent"}`.

### 1.2. UC-32: Xác thực Email (Verify Email)
- **Method & Path**: `POST /api/v1/auth/verify-email`
- **Request DTO**: `VerifyEmailDto(email, otpCode)`
- **Workflow**:
  1. Truy vấn bản ghi OTP gần nhất cho email với type = `EMAIL_VERIFICATION`.
  2. Kiểm tra nếu số lần nhập sai >= 5: khóa xác thực 15 phút.
  3. Kiểm tra hạn OTP: nếu quá TTL -> trả về `HTTP 400 OTP_EXPIRED`.
  4. So khớp hash mã OTP:
     - Nếu không khớp: tăng `attempts`, trả về số lượt thử còn lại.
     - Nếu khớp: đánh dấu OTP `is_consumed = true`, cập nhật `users.status = 'ACTIVE'`, ghi nhận `email_verified_at = NOW()`.
  5. Khởi tạo JWT Tokens: Access Token (15 phút) và Refresh Token (7 ngày).
  6. **Gộp giỏ hàng (Cart Merger)**: Kiểm tra header `X-Guest-Session-Id` hoặc guest cookie, gọi `CartService.mergeGuestCart(guestSessionId, userId)` (giải quyết triệt để thiếu sót trong biểu đồ).
  7. Trả về `HTTP 200 OK`, gán Cookie HTTP-only chứa Refresh Token và body chứa Access Token.

### 1.3. UC-33: Đăng nhập (Login)
- **Method & Path**: `POST /api/v1/auth/login`
- **Request DTO**: `LoginRequestDto(email, password, rememberMe)`
- **Workflow**:
  1. Áp dụng Rate Limiting theo IP và email (tối đa 5 lần thử sai / 15 phút).
  2. Tìm kiếm `User` theo email. Nếu không thấy -> trả về lỗi chung *"Invalid email or password"* (chống Account Enumeration).
  3. Kiểm tra trạng thái khóa tài khoản: Nếu `lockout_until > NOW()` -> từ chối `HTTP 423 Locked`.
  4. So khớp mật khẩu qua BCrypt:
     - Thất bại: tăng `failed_login_attempts`. Nếu đủ 5 lần -> set `lockout_until = NOW() + 15m`.
     - Thành công: reset `failed_login_attempts = 0`.
  5. Kiểm tra trạng thái tài khoản:
     - Nếu `status == 'PENDING_VERIFICATION'`: trả về `HTTP 403` yêu cầu xác thực OTP.
     - Nếu `status == 'LOCKED'`: từ chối với thông báo liên hệ hỗ trợ.
  6. Cấp cặp Access Token (15m) và Refresh Token (7 ngày hoặc 30 ngày nếu `rememberMe = true`).
  7. Gộp giỏ hàng vãng lai nếu có.
  8. Trả về `HTTP 200 OK` kèm `roles` và `redirectPath`:
     - `ROLE_CUSTOMER` -> `/` (Storefront Home).
     - `ROLE_STAFF` / `ROLE_ADMIN` -> `/admin/dashboard` (Backoffice Portal).

### 1.4. UC-34: Đăng xuất (Logout)
- **Method & Path**: `POST /api/v1/auth/logout`
- **Headers/Cookies**: `Authorization: Bearer <accessToken>`, Cookie `refreshToken`
- **Workflow**:
  1. Trích xuất `JTI` và thời gian hết hạn còn lại của Access Token, đưa vào **Token Revocation Blacklist** (Redis/Cache).
  2. Tìm kiếm Refresh Token tương ứng trong bảng `refresh_tokens` và đánh dấu `is_revoked = true` (hoặc xóa).
  3. Xóa HTTP-only Cookie phía client.
  4. Ghi Audit Log hành động đăng xuất (`LOGOUT_EVENT`).
  5. Trả về `HTTP 200 OK` dọn sạch phiên làm việc.

### 1.5. UC-35: Quên & Đặt lại mật khẩu (Reset Password)
- **Phần 1: Yêu cầu mã đặt lại**: `POST /api/v1/auth/forgot-password`
  - Body: `{"email": "..."}`
  - Kiểm tra email tồn tại trong DB (Spec 3.0). Dù có hay không, luôn trả về thông báo an toàn: *"If the email exists, a reset code has been dispatched"* (tránh enumeration).
  - Nếu có tồn tại: sinh OTP 6 số, TTL 3-5m, gửi email reset password.
- **Phần 2: Xác nhận đổi mật khẩu mới**: `POST /api/v1/auth/reset-password`
  - Body: `ResetPasswordDto(email, otpCode, newPassword, confirmPassword)`
  - Kiểm tra OTP hợp lệ và còn hạn.
  - Kiểm tra mật khẩu mới không trùng mật khẩu cũ (`BCrypt.matches`).
  - Cập nhật `password_hash` mới.
  - **Hủy toàn bộ phiên làm việc (Revoke All Sessions)**: Đánh dấu `is_revoked = true` cho toàn bộ refresh tokens của `user_id` trên mọi thiết bị (`BR-40`).
  - Gửi email cảnh báo bảo mật tài khoản vừa đổi mật khẩu thành công.

### 1.6. UC-36: Đổi mật khẩu (Change Password)
- **Method & Path**: `PUT /api/v1/auth/change-password`
- **Security**: Yêu cầu Bearer Token xác thực của phiên hiện tại.
- **Body**: `ChangePasswordDto(currentPassword, newPassword, confirmPassword)`
- **Workflow**:
  1. Xác minh `currentPassword` có khớp với hash trong DB.
  2. Kiểm tra `newPassword != currentPassword` và thỏa mãn độ mạnh mật khẩu.
  3. Cập nhật `password_hash`.
  4. Hủy các phiên trên các thiết bị phụ (`is_revoked = true` ngoại trừ refresh token của phiên hiện tại).
  5. Cấp lại access token mới cho phiên hiện tại nếu cần.
  6. Ghi Audit Log và gửi email thông báo bảo mật.
