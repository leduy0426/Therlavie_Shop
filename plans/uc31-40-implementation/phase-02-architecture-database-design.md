---
phase: 2
title: Architecture_Database_Design
status: completed
priority: P1
dependencies:
  - 1
---

# Phase 2: Multi-tier Client-Server Architecture & Database Design

## Overview
Xây dựng kiến trúc phân tầng Multi-tier Client-Server chuẩn mực cho nhóm Use Case 31-40 và hoàn thiện thiết kế cơ sở dữ liệu quan hệ (DDL), đảm bảo đáp ứng đầy đủ các thuộc tính chất lượng (Security, Scalability, Modularity, Maintainability).

---

## 1. Kiến trúc Multi-tier Client-Server

```
+-----------------------------------------------------------------------------------+
|                         TIER 1: PRESENTATION TIER (CLIENT)                         |
|                                                                                   |
|  [Storefront Client - Customer / Guest]       [Backoffice Admin Portal - Admin]   |
|  - Auth Views (Login, Register, OTP modals)   - User & Role Management Table      |
|  - Profile View & Avatar Crop Uploader        - Status Toggle Modal & Reason Input|
|  - Address Book UI (Cards, Form, Badges)      - Audit Log History Viewer          |
|  - Guest Checkout OTP Verification Dialog     - RBAC Role Assignment Dropdown     |
+-----------------------------------------+-----------------------------------------+
                                          | HTTPS / REST JSON API / Bearer JWT
+-----------------------------------------v-----------------------------------------+
|                  TIER 2: APPLICATION & BUSINESS LOGIC TIER (SERVER)               |
|                                                                                   |
|  [Security & Middleware Layer]                                                    |
|  - RateLimiterFilter (Brute-force protection: 5 attempts/15m)                     |
|  - JwtAuthenticationFilter (Extract JTI, check Blacklist, validate signature)     |
|  - RoleAuthorizationGuard (@PreAuthorize / RBAC middleware: Customer, Staff, Admin) |
|                                                                                   |
|  [Controller Layer (API Gateways)]                                                |
|  - AuthController: /api/v1/auth/* (register, verify, login, logout, password)      |
|  - UserController: /api/v1/users/profile, /api/v1/users/avatar                    |
|  - AddressController: /api/v1/addresses/* (CRUD, setDefault)                      |
|  - GuestAuthController: /api/v1/guest/checkout-otp/*                              |
|  - AdminUserController: /api/v1/admin/users/* (list, updateRole, toggleStatus)    |
|                                                                                   |
|  [Service & Business Domain Layer]                                                |
|  - AuthService: Xử lý quy trình Auth, BCrypt hashing, Token issuance, Lockout    |
|  - TokenService: Sinh JWT (Access 15m), RefreshToken (7d/30d), Blacklist JTI      |
|  - OtpService: Tạo mã OTP 6 số, Hash OTP lưu DB/Cache, Rate limit 3 req/h         |
|  - UserService: Đồng bộ User & CustomerProfile, Validate SĐT VN 10 số             |
|  - AddressService: Kiểm soát Max 5 địa chỉ, toggle default, check active order    |
|  - GuestVerificationService: Quản lý OTP checkout, cấp GuestCheckoutToken 15m    |
|  - AuditLogService: Ghi log kiểm toán bất biến (NFR-11)                           |
+-----------------------------------------+-----------------------------------------+
                                          | ORM / JDBC / Repository Pattern
+-----------------------------------------v-----------------------------------------+
|                      TIER 3: DATA ACCESS & PERSISTENCE TIER                       |
|                                                                                   |
|  [Repositories Layer]                                                             |
|  - UserRepository, RoleRepository, CustomerProfileRepository                      |
|  - DeliveryAddressRepository, RefreshTokenRepository, OtpRepository, AuditLogRepo|
|                                                                                   |
|  [Relational Database (PostgreSQL / MySQL)]                                       |
|  - Tables: users, roles, customer_profiles, delivery_addresses, refresh_tokens,   |
|            otp_verifications, audit_logs, guest_checkout_verifications            |
|                                                                                   |
|  [In-Memory Cache / Token Store (Redis / Memory)]                                 |
|  - JWT Revocation Blacklist (JTI -> Expiration)                                   |
|  - IP & Phone OTP Request Throttling Buckets                                      |
+-----------------------------------------+-----------------------------------------+
                                          | Outbound Adapters
+-----------------------------------------v-----------------------------------------+
|                        TIER 4: INTEGRATION SERVICES TIER                          |
|                                                                                   |
|  - NotificationService:                                                           |
|      * EmailServiceProvider (SMTP: Send OTP, Password Alerts)                     |
|      * SmsServiceProvider (SMS Gateway API: Send Guest Checkout OTP)              |
|  - MediaStorageService (Local Disk / AWS S3 / Cloudinary: Avatar processing)      |
+-----------------------------------------------------------------------------------+
```

---

## 2. Thiết kế Cơ sở Dữ liệu Quan hệ (DDL Schema)

```sql
-- ========================================================
-- 1. ENUMS & ROLES
-- ========================================================
CREATE TYPE user_status_enum AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'LOCKED');
CREATE TYPE user_role_enum AS ENUM ('ROLE_CUSTOMER', 'ROLE_STAFF', 'ROLE_ADMIN');
CREATE TYPE otp_type_enum AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET', 'GUEST_CHECKOUT');

-- ========================================================
-- 2. USERS TABLE (Tài khoản cốt lõi)
-- ========================================================
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(15) NULL,
    status user_status_enum NOT NULL DEFAULT 'PENDING_VERIFICATION',
    role user_role_enum NOT NULL DEFAULT 'ROLE_CUSTOMER',
    failed_login_attempts INT NOT NULL DEFAULT 0,
    lockout_until TIMESTAMPTZ NULL,
    email_verified_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_status ON users(role, status);

-- ========================================================
-- 3. CUSTOMER_PROFILES TABLE (Hồ sơ mở rộng & sở thích cá nhân)
-- ========================================================
CREATE TABLE customer_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    avatar_url VARCHAR(500) NULL,
    preferred_fit VARCHAR(50) NULL,      -- Oversize, Regular, Slim-fit
    favorite_color VARCHAR(50) NULL,     -- Pastel, Monochrome, Earth-tone
    height_cm DECIMAL(5, 2) NULL,
    weight_kg DECIMAL(5, 2) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================================
-- 4. DELIVERY_ADDRESSES TABLE (Sổ địa chỉ - tối đa 5 địa chỉ / user)
-- ========================================================
CREATE TABLE delivery_addresses (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    province_city VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    ward VARCHAR(100) NOT NULL,
    detailed_address VARCHAR(255) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_delivery_addresses_user ON delivery_addresses(user_id) WHERE is_deleted = FALSE;

-- ========================================================
-- 5. REFRESH_TOKENS TABLE (Quản lý phiên đăng nhập)
-- ========================================================
CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    jti VARCHAR(100) NOT NULL,
    device_info VARCHAR(255) NULL,
    ip_address VARCHAR(45) NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id, is_revoked);

-- ========================================================
-- 6. OTP_VERIFICATIONS TABLE (Lưu mã OTP có bảo mật hash & rate-limit)
-- ========================================================
CREATE TABLE otp_verifications (
    id BIGSERIAL PRIMARY KEY,
    target_identifier VARCHAR(255) NOT NULL, -- email hoặc phone_number
    otp_code_hash VARCHAR(255) NOT NULL,     -- Hash SHA-256 / BCrypt
    otp_type otp_type_enum NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    is_consumed BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    resend_cooldown_until TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_otp_target_type ON otp_verifications(target_identifier, otp_type, is_consumed);

-- ========================================================
-- 7. GUEST_CHECKOUT_VERIFICATIONS TABLE (Lưu session OTP Guest)
-- ========================================================
CREATE TABLE guest_checkout_verifications (
    id BIGSERIAL PRIMARY KEY,
    phone_number VARCHAR(15) NOT NULL,
    verification_token VARCHAR(255) NOT NULL UNIQUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,        -- Có hạn 15 phút để Place Order
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_guest_verify_phone ON guest_checkout_verifications(phone_number, is_verified);

-- ========================================================
-- 8. AUDIT_LOGS TABLE (Ghi vết kiểm toán bất biến theo NFR-11)
-- ========================================================
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_id BIGINT NULL REFERENCES users(id) ON DELETE SET NULL, -- NULL nếu là System hoặc Guest
    target_entity VARCHAR(100) NOT NULL,
    target_id BIGINT NULL,
    action VARCHAR(100) NOT NULL,             -- USER_ROLE_CHANGED, USER_LOCKED, PASSWORD_RESET, etc.
    old_value JSONB NULL,
    new_value JSONB NULL,
    justification_reason TEXT NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor_action ON audit_logs(actor_id, action);
```
