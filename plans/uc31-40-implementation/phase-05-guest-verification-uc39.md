---
phase: 5
title: Guest_Verification_UC39
status: completed
priority: P2
dependencies:
  - 2
---

# Phase 5: Guest Checkout OTP Verification (UC-39)

## Overview
Cài đặt cơ chế phòng vệ chống đơn hàng ảo / COD spam bằng cách xác thực danh tính khách vãng lai qua mã OTP gửi qua SMS (hoặc fallback qua Email), cấp `GuestCheckoutToken` ngắn hạn (15 phút) để mở khóa tiến trình Đặt hàng (UC-08).

---

## 1. Kiến trúc luồng xác thực Guest Checkout

```
[Guest Customer]          [CheckoutView]            [GuestAuthController]    [OtpService]         [NotificationService]
       |                         |                           |                     |                       |
       |-- Nhập thông tin & SĐT -|                           |                     |                       |
       |-- Bấm "Proceed Checkout"|                           |                     |                       |
       |                         |-- POST /guest/request-otp |                     |                       |
       |                         |   (phone_number) -------->|                     |                       |
       |                         |                           |-- validatePhone()   |                       |
       |                         |                           |-- generateOtp() --->|                       |
       |                         |                           |                     |-- sendSMSOTP() ------>| (SMS Gateway)
       |                         |<-- HTTP 200 (cooldown 60s)|                     |<-- Ack sent ----------|
       |<-- Mở Modal đếm ngược 60s
       |
       |-- Nhập mã OTP 6 chữ số -|
       |-- Bấm "Confirm OTP" ----|
       |                         |-- POST /guest/verify-otp -|                     |
       |                         |   (phone_number, otp) --->|                     |
       |                         |                           |-- validateOTP() --->|
       |                         |                           |   [attempts < 5, TTL <= 5m]
       |                         |                           |-- issueGuestToken()-> (Lưu Session 15m)
       |                         |<-- HTTP 200 (guestToken) -|
       |<-- Unlock nút "Place Order" (UC-08)
```

---

## 2. Chi tiết Endpoints & DTOs

### 2.1. Yêu cầu gửi mã OTP
- **Path**: `POST /api/v1/guest/checkout-otp/request`
- **Request Body**: `{"phoneNumber": "0912345678", "email": "guest@example.com"}`
- **Validation & Business Rules**:
  - `phoneNumber`: Kiểm tra đúng tiền tố di động Việt Nam 10 chữ số.
  - `BR-03 Rate Limiter`: Tối đa 3 lần yêu cầu OTP trong 1 giờ cho 1 số điện thoại.
  - Cooldown timer: 60 giây giữa 2 lần bấm "Resend OTP".
- **External Gateway Fallback (`NFR-06`)**:
  - Thử gửi qua SMS Gateway.
  - Nếu SMS Gateway trả về lỗi kết nối / timeout: Tự động chuyển hướng (fallback) gửi mã OTP qua địa chỉ Email được cung cấp.

### 2.2. Xác thực mã OTP
- **Path**: `POST /api/v1/guest/checkout-otp/verify`
- **Request Body**: `{"phoneNumber": "0912345678", "otpCode": "123456"}`
- **Validation & Handling**:
  - Tra cứu bản ghi `otp_verifications` có `otp_type = 'GUEST_CHECKOUT'`.
  - Nếu số lần thử sai >= 5: khóa xác thực trên số điện thoại này trong 15 phút (`BR-03, NFR-03`).
  - Nếu mã OTP đúng:
    1. Đánh dấu OTP đã sử dụng (`is_consumed = TRUE`).
    2. Sinh chuỗi ngẫu nhiên ký số cryptographic `guestVerificationToken` (UUIDv4 + HMAC signature).
    3. Lưu bản ghi vào bảng `guest_checkout_verifications` với `expires_at = NOW() + INTERVAL '15 minutes'`.
    4. Trả về cho frontend:
       ```json
       {
         "verified": true,
         "guestVerificationToken": "gvt_sec_8f93a...",
         "expiresInSeconds": 900
       }
       ```

### 2.3. Tích hợp chặt chẽ với UC-08 (Place Order)
- Khi gọi `POST /api/v1/orders/place-order` với đơn hàng của Guest:
  - Header bắt buộc: `X-Guest-Verification-Token: gvt_sec_8f93a...`
  - Backend Service của UC-08 kiểm tra tính hợp lệ và thời hạn của token trong bảng `guest_checkout_verifications`.
  - Đảm bảo triệt để mục tiêu: **Không một đơn hàng Guest nào được tạo thành công nếu chưa vượt qua bước xác thực số điện thoại OTP**.
