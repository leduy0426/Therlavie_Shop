# Thierlavier Shop - Fashion Shop Management System (FSMS)
> **Môn học:** SWD392 - Software Architecture and Design  
> **Đồ án Nhóm:** Group 5  
> **Cụm Use Cases triển khai:** UC-31 đến UC-40 (Authentication, Profile, Address Book, Guest Verification, User & Role RBAC)  
> **Kiến trúc:** Multi-tier Client-Server  
> **Công nghệ:** Frontend: React + Vite | Backend: NestJS + Prisma + PostgreSQL  

---

## 1. Cấu Trúc Dự Án (Multi-tier Architecture)

```
Therlavie_Shop/
├── database/
│   ├── schema.sql           # DDL PostgreSQL khởi tạo 7 bảng quan hệ & enums
│   └── seed.sql             # Dữ liệu mẫu (Tài khoản Admin, Staff, Customer & Địa chỉ)
├── backend/                 # Backend API (NestJS + Prisma + PostgreSQL)
│   ├── prisma/
│   │   ├── schema.prisma    # Prisma Data Model
│   │   └── seed.ts          # Script seed tài khoản
│   ├── src/
│   │   ├── common/          # Guards (JWT, Roles), Decorators, Strategies
│   │   ├── modules/
│   │   │   ├── auth/        # UC-31..36 (Register, Verify Email, Login, Logout, Forgot & Change Pass)
│   │   │   ├── user/        # UC-37 (Get/Update Profile, Upload Avatar)
│   │   │   ├── address/     # UC-38 (Manage Delivery Addresses - Max 5 theo BR-14)
│   │   │   ├── guest/       # UC-39 (Verify Guest Checkout via SMS OTP)
│   │   │   ├── admin/       # UC-40 (Manage Users & Roles, Self-lock block, Audit Logs)
│   │   │   └── notification/# Email SMTP & SMS Gateway services
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── .env                 # Cấu hình DATABASE_URL & JWT Secrets
│   └── package.json
├── frontend/                # Frontend Client (React + Vite + TailwindCSS)
│   ├── src/
│   │   ├── api/             # Axios API Clients
│   │   ├── components/      # UI Modals & Views cho 10 Use Cases
│   │   ├── context/         # AuthContext (State & Token management)
│   │   ├── App.tsx          # Storefront Home & Tab Switcher
│   │   └── main.tsx
│   ├── vite.config.ts
│   └── package.json
└── plans/                   # Kế hoạch chi tiết theo chuẩn ck:plan (7 phases)
```

---

## 2. Hướng Dẫn Cài Đặt & Khởi Chạy

### 2.1. Cấu hình Cơ sở Dữ liệu (PostgreSQL)
Chuỗi kết nối cơ sở dữ liệu đã được cấu hình trong `backend/.env`:
```env
DATABASE_URL="postgresql://123456@127.0.0.1:5432/databaseName?schema=public"
```

Bạn có thể chạy trực tiếp file SQL trong PostgreSQL:
```bash
psql -U postgres -d databaseName -f database/schema.sql
psql -U postgres -d databaseName -f database/seed.sql
```
Hoặc dùng Prisma CLI:
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
```

### 2.2. Khởi chạy Backend API Server (NestJS)
```bash
cd backend
npm install
npm run start:dev
```
Server sẽ lắng nghe tại: `http://localhost:3001`

### 2.3. Khởi chạy Frontend Client (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Client sẽ chạy tại: `http://localhost:5173`

---

## 3. Danh Sách Tài Khoản Mặc Định (Seed Accounts)
| Vai trò (Role) | Email | Mật khẩu | Quyền hạn |
|---|---|---|---|
| **Admin** | `admin@therlavie.com` | `Admin@123456` | Quản trị toàn quyền, đổi role, khóa/mở khóa tài khoản, xem Audit Log (UC-40) |
| **Staff** | `staff@therlavie.com` | `Staff@123456` | Nhân viên quản trị đơn hàng |
| **Customer** | `customer@therlavie.com` | `Customer@123456` | Khách hàng mua sắm, quản lý hồ sơ, sổ địa chỉ (UC-36, 37, 38) |

---

## 4. Bảng Tra Cứu API Endpoints (UC-31 đến UC-40)

| UC ID | Chức năng | Phương thức & URL | Ràng buộc bảo mật & Business Rule |
|---|---|---|---|
| **UC-31** | Đăng ký tài khoản | `POST /api/v1/auth/register` | Public, băm BCrypt, sinh OTP email 5m (BR-02, BR-11, NFR-01) |
| **UC-32** | Xác thực Email OTP | `POST /api/v1/auth/verify-email` | Public, kích hoạt ACTIVE, gộp giỏ hàng vãng lai (BR-15), cấp JWT |
| **UC-33** | Đăng nhập | `POST /api/v1/auth/login` | Public, chống Brute-force: khóa 15m sau 5 lần sai (BR-13), cấp JWT |
| **UC-34** | Đăng xuất | `POST /api/v1/auth/logout` | Authenticated, xóa Refresh Token DB, Blacklist JTI Access Token |
| **UC-35** | Quên mật khẩu | `POST /api/v1/auth/forgot-password` | Public, gửi OTP qua email |
| **UC-35** | Đặt lại mật khẩu | `POST /api/v1/auth/reset-password` | Public, xác thực OTP, đổi pass, hủy mọi session cũ (BR-40) |
| **UC-36** | Đổi mật khẩu | `PUT /api/v1/auth/change-password` | Authenticated, hủy session thiết bị khác (BR-40), gửi cảnh báo |
| **UC-37** | Xem hồ sơ cá nhân | `GET /api/v1/users/profile` | Authenticated |
| **UC-37** | Cập nhật hồ sơ | `PUT /api/v1/users/profile` | Đồng bộ cả User (Tên, SĐT 10 số) và CustomerProfile (Form, Màu, Size) |
| **UC-37** | Upload ảnh đại diện | `POST /api/v1/users/avatar` | Multipart, kiểm tra JPEG/PNG/WebP, tối đa 3MB (NFR-05) |
| **UC-38** | Danh sách địa chỉ | `GET /api/v1/addresses` | Authenticated, trả về danh sách, địa chỉ mặc định xếp đầu |
| **UC-38** | Thêm địa chỉ mới | `POST /api/v1/addresses` | **Kiểm tra tối đa 05 địa chỉ** (BR-14), quản lý duy nhất 1 cờ default |
| **UC-38** | Sửa địa chỉ | `PUT /api/v1/addresses/:id` | Authenticated |
| **UC-38** | Đặt nhanh mặc định | `PATCH /api/v1/addresses/:id/default` | Hủy cờ mặc định cũ, gán cờ mặc định cho địa chỉ được chọn |
| **UC-38** | Xóa địa chỉ | `DELETE /api/v1/addresses/:id` | Soft-delete, bảo vệ không xóa địa chỉ có đơn hàng đang ship |
| **UC-39** | Gửi OTP Guest Checkout | `POST /api/v1/guest/checkout-otp/request` | Public, SMS Gateway (fallback Email), rate limit 3 req/h (BR-03) |
| **UC-39** | Xác thực OTP Guest | `POST /api/v1/guest/checkout-otp/verify` | Cấp `guestVerificationToken` có hạn 15m để mở khóa UC-08 |
| **UC-40** | Xem danh sách User | `GET /api/v1/admin/users` | Admin Only (BR-33), phân trang, lọc theo vai trò và trạng thái |
| **UC-40** | Đổi vai trò / Khóa tài khoản | `PATCH /api/v1/admin/users/:id` | Admin Only, **chặn tự khóa chính mình (BR-11)**, ghi Audit Log (NFR-11) |
| **UC-40** | Xem Audit Logs | `GET /api/v1/admin/users/audit-logs` | Admin Only, xem toàn bộ lịch sử kiểm toán bảo mật |

