/*
    SE1990_NJ
    V1.0-11/09/2026
    Lê Duy - HE194188
*/

-- ========================================================
-- THIERLAVIER FASHION SHOP (SWD392)
-- Database DDL Schema (PostgreSQL) - UC-31 to UC-40
-- ========================================================

-- Drop existing tables/types if needed
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS guest_checkout_verifications CASCADE;
DROP TABLE IF EXISTS otp_verifications CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS delivery_addresses CASCADE;
DROP TABLE IF EXISTS customer_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS otp_type_enum CASCADE;
DROP TYPE IF EXISTS user_role_enum CASCADE;
DROP TYPE IF EXISTS user_status_enum CASCADE;

-- 1. ENUMS
CREATE TYPE user_status_enum AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'LOCKED');
CREATE TYPE user_role_enum AS ENUM ('ROLE_CUSTOMER', 'ROLE_STAFF', 'ROLE_ADMIN');
CREATE TYPE otp_type_enum AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET', 'GUEST_CHECKOUT');

-- 2. USERS TABLE (Core Account Entity)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
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

-- 3. CUSTOMER_PROFILES TABLE (UC-37 Extended Customer Profile)
CREATE TABLE customer_profiles (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    avatar_url VARCHAR(500) NULL,
    preferred_fit VARCHAR(50) NULL,      -- Oversize, Regular, Slim-fit
    favorite_color VARCHAR(50) NULL,     -- Pastel, Monochrome, Earth-tone
    height_cm DECIMAL(5, 2) NULL,
    weight_kg DECIMAL(5, 2) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. DELIVERY_ADDRESSES TABLE (UC-38 Address Book - Max 5 Addresses BR-14)
CREATE TABLE delivery_addresses (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

-- 5. REFRESH_TOKENS TABLE (UC-33, UC-34, UC-36 Session Management)
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    jti VARCHAR(100) NOT NULL,
    device_info VARCHAR(255) NULL,
    ip_address VARCHAR(45) NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id, is_revoked);

-- 6. OTP_VERIFICATIONS TABLE (UC-31, 32, 35, 39 OTP Lifecycle with BR-02 TTL)
CREATE TABLE otp_verifications (
    id SERIAL PRIMARY KEY,
    target_identifier VARCHAR(255) NOT NULL,
    otp_code_hash VARCHAR(255) NOT NULL,
    otp_type otp_type_enum NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    is_consumed BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    resend_cooldown_until TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_otp_target_type ON otp_verifications(target_identifier, otp_type, is_consumed);

-- 7. GUEST_CHECKOUT_VERIFICATIONS TABLE (UC-39 Guest Phone OTP Verification)
CREATE TABLE guest_checkout_verifications (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(15) NOT NULL,
    verification_token VARCHAR(255) NOT NULL UNIQUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_guest_verify_phone ON guest_checkout_verifications(phone_number, is_verified);

-- 8. AUDIT_LOGS TABLE (UC-40 Immutable Audit Records according to NFR-11)
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    actor_id INT NULL REFERENCES users(id) ON DELETE SET NULL,
    target_entity VARCHAR(100) NOT NULL,
    target_id INT NULL,
    action VARCHAR(100) NOT NULL,
    old_value JSONB NULL,
    new_value JSONB NULL,
    justification_reason TEXT NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor_action ON audit_logs(actor_id, action);

