---
phase: 4
title: Profile_Address_UC37_UC38
status: completed
priority: P2
dependencies:
  - 2
  - 3
---

# Phase 4: Customer Profile & Delivery Address Management (UC-37, UC-38)

## Overview
Cài đặt cụm tính năng quản lý hồ sơ cá nhân của khách hàng (Cập nhật thông tin, Upload ảnh đại diện, Lưu sở thích thời trang) và Sổ địa chỉ giao hàng nhiều địa chỉ với cơ chế kiểm soát địa chỉ mặc định và giới hạn 5 địa chỉ theo `BR-14`.

---

## 1. UC-37: Cập nhật Hồ sơ Cá nhân (Update Profile)

### 1.1. API Endpoints
- `GET /api/v1/users/profile`: Lấy toàn bộ thông tin profile hiện tại của người dùng đang đăng nhập.
- `PUT /api/v1/users/profile`: Cập nhật thông tin text (Họ tên, SĐT, Sở thích phong cách, Kích cỡ).
- `POST /api/v1/users/avatar`: Tải lên và cập nhật ảnh đại diện (Multipart Form Data).

### 1.2. DTOs & Validation
- `UpdateProfileDto`:
  - `fullName`: chuỗi từ 2 đến 150 ký tự, không chứa ký tự đặc biệt nguy hiểm.
  - `phoneNumber`: chuỗi 10 chữ số đúng định dạng số di động Việt Nam (đầu số 03x, 05x, 07x, 08x, 09x).
  - `preferredFit`: chuỗi enum/text (Oversize, Regular, Slim-fit).
  - `favoriteColor`: chuỗi enum/text (Pastel, Monochrome, Earth-tone, Vibrant).
  - `heightCm`, `weightKg`: số dương hợp lý (phục vụ bộ máy gợi ý size BR-19).
- `AvatarUploadDto`: file multipart.
  - Kiểm tra MIME type: chỉ chấp nhận `image/jpeg`, `image/png`, `image/webp`.
  - Dung lượng file tối đa: `3MB` (3,145,728 bytes).

### 1.3. Workflow Xử lý Phân tầng (Multi-tier)
1. **Controller**: Trích xuất `currentUserId` từ Spring SecurityContext / Express Request `req.user.id`.
2. **Service**:
   - Mở Transaction (`@Transactional`).
   - Cập nhật bảng `users`: `full_name`, `phone_number`, `updated_at`.
   - Cập nhật bảng `customer_profiles`: `preferred_fit`, `favorite_color`, `height_cm`, `weight_kg`.
   - Nếu có upload avatar: Gọi `MediaStorageService.storeImage(file, "avatars/")`, nhận về public URL hoặc storage path, lưu vào `customer_profiles.avatar_url`.
3. **Response**: Trả về Profile DTO đầy đủ kèm `HTTP 200 OK`.

---

## 2. UC-38: Quản lý Sổ Địa chỉ Giao hàng (Manage Delivery Addresses)

### 2.1. API Endpoints
- `GET /api/v1/addresses`: Lấy danh sách địa chỉ chưa xóa (`is_deleted = FALSE`) của user hiện tại, địa chỉ mặc định (`is_default = TRUE`) được xếp đầu danh sách.
- `POST /api/v1/addresses`: Thêm địa chỉ nhận hàng mới.
- `PUT /api/v1/addresses/{id}`: Chỉnh sửa thông tin địa chỉ đã lưu.
- `PATCH /api/v1/addresses/{id}/default`: Đặt nhanh địa chỉ `{id}` làm mặc định.
- `DELETE /api/v1/addresses/{id}`: Xóa mềm địa chỉ (Soft-delete).

### 2.2. DTOs & Constraints
- `AddressRequestDto`:
  - `recipientName`: không được rỗng (tối đa 150 ký tự).
  - `phoneNumber`: 10 số di động hợp lệ.
  - `provinceCity`, `district`, `ward`: bắt buộc chọn theo danh mục hành chính.
  - `detailedAddress`: số nhà, tên đường, tòa nhà.
  - `isDefault`: boolean.

### 2.3. Quy tắc Nghiệp vụ Bắt buộc (Business Rules Enforcement)
1. **Ràng buộc số lượng tối đa (`BR-14`)**:
   - Trước khi thực hiện `POST`, hệ thống đếm số địa chỉ hiện có:
     `SELECT COUNT(*) FROM delivery_addresses WHERE user_id = :userId AND is_deleted = FALSE;`
   - Nếu `count >= 5`: ném lỗi `MaxAddressLimitReachedException` (HTTP 400: *"Address limit reached. A user can store a maximum of 5 delivery addresses (BR-14)"*).
2. **Quy tắc Duy nhất một Địa chỉ Mặc định**:
   - Nếu bản ghi mới được tạo hoặc cập nhật có `isDefault = true`:
     `UPDATE delivery_addresses SET is_default = FALSE WHERE user_id = :userId AND id != :currentId;`
   - Nếu là địa chỉ đầu tiên của người dùng: tự động gán `isDefault = true`.
3. **Bảo vệ Đơn hàng đang Vận chuyển (Transit Protection)**:
   - Trước khi thực hiện `DELETE /api/v1/addresses/{id}`:
     Kiểm tra xem địa chỉ này có đang được liên kết với bất kỳ đơn hàng nào ở trạng thái đang giao (`READY_TO_SHIP`, `DELIVERING`) hay không.
   - Nếu có: từ chối xóa với thông báo: *"Cannot delete address tied to an active transit order."*
   - Nếu an toàn: cập nhật `is_deleted = TRUE`.
