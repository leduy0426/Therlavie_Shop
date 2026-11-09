---
phase: 6
title: Admin_RBAC_Audit_UC40
status: completed
priority: P1
dependencies:
  - 2
  - 3
---

# Phase 6: Admin User & Role Management & Audit Logging (UC-40)

## Overview
Cài đặt màn hình quản trị và API phân quyền vai trò (RBAC), quản lý trạng thái tài khoản (Khóa/Mở khóa), cơ chế bảo vệ tài khoản quản trị (chống tự tước quyền/tự khóa), thu hồi phiên làm việc tức thì và ghi nhật ký kiểm toán bất biến (Immutable Audit Log).

---

## 1. Phân quyền Endpoint & Security Guard
- Mọi endpoint trong phase này bắt buộc yêu cầu:
  - Header: `Authorization: Bearer <accessToken>`
  - Role kiểm tra: `@PreAuthorize("hasRole('ROLE_ADMIN')")` / `RequireRole('ROLE_ADMIN')`.
  - Nếu user không mang vai trò Admin -> trả về ngay `HTTP 403 Forbidden` và ghi nhận một cảnh báo an ninh (`SECURITY_ALERT`).

---

## 2. Chi tiết Endpoints & DTOs

### 2.1. Lấy danh sách tài khoản phân trang & tìm kiếm
- **Path**: `GET /api/v1/admin/users`
- **Query Params**:
  - `page`: số trang (mặc định 0, 1)
  - `size`: số bản ghi trên trang (mặc định 10, 20)
  - `search`: tìm kiếm tương đối theo Họ tên, Email, SĐT (`ILIKE %search%`)
  - `role`: lọc theo `ROLE_CUSTOMER`, `ROLE_STAFF`, `ROLE_ADMIN`
  - `status`: lọc theo `PENDING_VERIFICATION`, `ACTIVE`, `LOCKED`
- **Response**:
  ```json
  {
    "content": [
      {
        "id": 1,
        "email": "user@example.com",
        "fullName": "Nguyen Van A",
        "phoneNumber": "0912345678",
        "role": "ROLE_CUSTOMER",
        "status": "ACTIVE",
        "createdAt": "2026-10-01T08:00:00Z"
      }
    ],
    "totalElements": 150,
    "totalPages": 15,
    "currentPage": 0
  }
  ```

### 2.2. Cập nhật Vai trò hoặc Trạng thái người dùng
- **Path**: `PATCH /api/v1/admin/users/{targetUserId}`
- **Request Body**:
  ```json
  {
    "newRole": "ROLE_STAFF",          // nullable nếu chỉ toggle status
    "newStatus": "LOCKED",            // nullable nếu chỉ đổi role
    "justificationReason": "Vi phạm chính sách đánh giá sản phẩm spam liên tục" // Bắt buộc khi khóa
  }
  ```
- **Business Logic & Quy tắc an toàn**:
  1. Trích xuất `currentAdminId` từ token.
  2. **Quy tắc Chống Tự Can Thiệp (Self-Modification Safety Rule)**:
     - Nếu `currentAdminId == targetUserId`:
       Kiểm tra nếu `newStatus == 'LOCKED'` hoặc `newRole != 'ROLE_ADMIN'`:
       -> **Từ chối ngay lập tức với HTTP 400 Bad Request**: *"Administrator cannot lock their own account or revoke their own Admin privileges (BR-11 / Safety Policy)"*.
  3. Tìm kiếm `targetUser` trong cơ sở dữ liệu. Nếu không thấy -> `HTTP 404 Not Found`.
  4. Lưu vết giá trị cũ (`oldRole`, `oldStatus`) để ghi audit log.
  5. Cập nhật `users.role` và `users.status`.
  6. **Thu hồi phiên làm việc tức thì (Immediate Session Revocation)**:
     - Nếu `newStatus == 'LOCKED'` hoặc có sự thay đổi quyền (`newRole != oldRole`):
       Hệ thống đánh dấu toàn bộ refresh token của `targetUserId` trong bảng `refresh_tokens` thành `is_revoked = TRUE`.
       Đồng thời đưa `targetUserId` vào danh sách Blacklist hiệu lực người dùng (Redis), đảm bảo bất kỳ Access Token nào còn thời hạn 15 phút của user này khi gửi lên các request tiếp theo đều bị chặn lại tại `JwtAuthenticationFilter`.
  7. **Ghi Nhật ký Kiểm toán Bất biến (Immutable Audit Log)**:
     - Gọi `AuditLogRepository.save(AuditLog)` lưu đầy đủ:
       `actor_id = currentAdminId`, `target_entity = 'USER'`, `target_id = targetUserId`, `action = 'USER_STATUS_OR_ROLE_MODIFIED'`, `old_value = {role, status}`, `new_value = {newRole, newStatus}`, `justification_reason`, `ip_address`, `timestamp = NOW()`.
  8. Trả về `HTTP 200 OK` kèm thông báo thành công cho Admin Portal.
