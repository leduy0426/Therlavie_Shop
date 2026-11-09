---
phase: 7
title: Integration_Testing
status: completed
priority: P2
dependencies:
  - 3
  - 4
  - 5
  - 6
---

# Phase 7: Verification & Integration Testing (UC-31 to UC-40)

## Overview
Bộ kịch bản kiểm thử tích hợp (End-to-End & Integration Test Suites) nhằm bảo đảm toàn bộ 10 Use Cases hoạt động trơn tru theo kiến trúc Multi-tier, không phát sinh lỗi nghiệp vụ và tuân thủ tuyệt đối các ràng buộc phi chức năng (NFR).

---

## 1. Ma trận Kịch bản Kiểm thử Nghiệp vụ (Acceptance Test Matrix)

| Test Case ID | Mục tiêu kiểm thử | Đầu vào & Điều kiện tiền đề | Kết quả kỳ vọng (Expected Output) |
|--------------|-------------------|----------------------------|-----------------------------------|
| **TC-UC31-01** | Đăng ký tài khoản thành công | Email mới, password đủ 8 ký tự gồm hoa, thường, số | HTTP 201, User status `PENDING_VERIFICATION`, OTP email được dispatch, CustomerProfile rỗng được tạo. |
| **TC-UC31-02** | Trùng email đang hoạt động | Email đã có trong hệ thống và status `ACTIVE` | HTTP 409 Conflict, thông báo email đã tồn tại. |
| **TC-UC31-03** | Mật khẩu không đủ độ mạnh | Password < 8 ký tự hoặc toàn chữ thường | HTTP 400 Bad Request, danh sách lỗi trường dữ liệu cụ thể. |
| **TC-UC32-01** | Xác thực Email OTP chuẩn | Mã OTP 6 chữ số đúng, gửi trong vòng 5 phút | HTTP 200, User status chuyển sang `ACTIVE`, cấp cặp JWT token, tự động gộp giỏ hàng vãng lai. |
| **TC-UC32-02** | Nhập sai OTP liên tiếp 5 lần | Nhập sai mã OTP 5 lần liên tục | HTTP 400, sau lần 5 bị khóa xác thực trong 15 phút. |
| **TC-UC33-01** | Đăng nhập tài khoản Customer | Email và Password hợp lệ, status `ACTIVE` | HTTP 200, cấp Access Token 15m & Refresh Token HTTP-only cookie, redirect về Storefront. |
| **TC-UC33-02** | Đăng nhập sai mật khẩu 5 lần | Nhập sai mật khẩu 5 lần liên tục | HTTP 423 Locked, tài khoản bị tạm khóa 15 phút. |
| **TC-UC33-03** | Đăng nhập tài khoản chưa verify | Tài khoản status `PENDING_VERIFICATION` | HTTP 403 Forbidden, hướng dẫn chuyển sang màn hình verify OTP. |
| **TC-UC34-01** | Đăng xuất người dùng | Gửi Access Token hợp lệ và Refresh Token cookie | HTTP 200, JTI được thêm vào blacklist Redis, Refresh token chuyển trạng thái revoked, cookie bị xóa. |
| **TC-UC35-01** | Quên mật khẩu & Đặt lại thành công | Nhập OTP reset đúng và mật khẩu mới | HTTP 200, mật khẩu mới được băm BCrypt, toàn bộ phiên cũ trên các thiết bị khác bị hủy bỏ (BR-40). |
| **TC-UC36-01** | Đổi mật khẩu trong hồ sơ cá nhân | Nhập mật khẩu hiện tại đúng, mật khẩu mới khác mật khẩu cũ | HTTP 200, mật khẩu đổi thành công, gửi email cảnh báo bảo mật, hủy phiên trên các thiết bị khác. |
| **TC-UC37-01** | Cập nhật hồ sơ & Upload avatar | SĐT 10 số hợp lệ, file ảnh PNG 2MB | HTTP 200, cả bảng `users` (tên, SĐT) và `customer_profiles` (ảnh, sở thích) được cập nhật đồng bộ. |
| **TC-UC37-02** | Upload ảnh quá dung lượng (>3MB) | File ảnh dung lượng 4MB | HTTP 400 Payload Too Large, thông báo kích thước tối đa 3MB. |
| **TC-UC38-01** | Thêm địa chỉ mới & Đặt làm mặc định | Nhập đủ địa chỉ, tick `isDefault = true` | HTTP 201, địa chỉ được tạo với cờ default, các địa chỉ cũ tự động bị hủy cờ default. |
| **TC-UC38-02** | Vượt quá giới hạn 5 địa chỉ (BR-14) | Tài khoản đã có sẵn 5 địa chỉ, bấm thêm mới | HTTP 400 Bad Request, thông báo chạm giới hạn tối đa 5 địa chỉ theo BR-14. |
| **TC-UC38-03** | Xóa địa chỉ có đơn hàng đang giao | Địa chỉ đang gắn với đơn `DELIVERING` | HTTP 400 Bad Request, chặn xóa để bảo đảm an toàn vận chuyển. |
| **TC-UC39-01** | Xác thực OTP Guest Checkout thành công | SĐT 10 số hợp lệ, nhập OTP 6 số nhận qua SMS | HTTP 200, sinh `guestVerificationToken` có hạn 15 phút, cho phép mở khóa tiến trình đặt hàng UC-08. |
| **TC-UC40-01** | Admin đổi quyền & Khóa tài khoản khác | Admin đăng nhập, khóa tài khoản Customer có lý do | HTTP 200, tài khoản bị khóa, mọi phiên hoạt động của user bị thu hồi ngay lập tức, ghi Audit Log (NFR-11). |
| **TC-UC40-02** | Admin tự khóa hoặc tự tước quyền chính mình | Admin chọn tài khoản của chính mình để khóa | HTTP 400 Bad Request, từ chối hành vi tự can thiệp (Self-modification block). |
| **TC-UC40-03** | Khách hàng thông thường gọi API Admin | Gửi token của `ROLE_CUSTOMER` lên API Admin | HTTP 403 Forbidden, ghi nhận cảnh báo an ninh. |

---

## 2. Tiêu chuẩn Hoàn thành (Definition of Done - DoD)
- [ ] 100% các Use Case từ UC-31 đến UC-40 đều có Controller, Service, Repository, DTO và Validation hoàn chỉnh.
- [ ] Tích hợp đầy đủ Middleware bảo mật: JWT Filter, Token Blacklist, Brute-force Throttling, RBAC Guard.
- [ ] Tất cả các điểm mâu thuẫn giữa Spec và Biểu đồ đã được xử lý thống nhất trong code.
- [ ] 100% Test Case trong ma trận kiểm thử đều đạt kết quả PASS.
