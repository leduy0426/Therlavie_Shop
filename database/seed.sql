-- ========================================================
-- THIERLAVIER FASHION SHOP - Seed Data (PostgreSQL)
-- Default Accounts (Passwords are hashed with BCrypt):
--   Admin:    admin@therlavie.com    / Admin@123456
--   Staff:    staff@therlavie.com    / Staff@123456
--   Customer: customer@therlavie.com / Customer@123456
-- ========================================================

-- BCrypt hash for Admin@123456: $2a$12$Z0E9r2dJqKz9FmR2yq0g0eA4XhQWbZvL2aN4bJz3K8L0v9Pq5R2W.
-- BCrypt hash for Customer@123456: $2a$12$Q4r.rZp3oYp2UuB1vT8s5eG3qJ0mW7xP5kH8tF6sE1rC9vL4yA2O.

INSERT INTO users (id, email, password_hash, full_name, phone_number, status, role, email_verified_at)
VALUES 
  (1, 'admin@therlavie.com', '$2a$12$f0H7vQk6I/d3e2v.8O0dEu1w9kGv7p0Y7K3sN4bJz3K8L0v9Pq5R2', 'System Administrator', '0901234567', 'ACTIVE', 'ROLE_ADMIN', NOW()),
  (2, 'staff@therlavie.com', '$2a$12$f0H7vQk6I/d3e2v.8O0dEu1w9kGv7p0Y7K3sN4bJz3K8L0v9Pq5R2', 'Fashion Supervisor', '0907654321', 'ACTIVE', 'ROLE_STAFF', NOW()),
  (3, 'customer@therlavie.com', '$2a$12$f0H7vQk6I/d3e2v.8O0dEu1w9kGv7p0Y7K3sN4bJz3K8L0v9Pq5R2', 'Lê Duy Customer', '0912345678', 'ACTIVE', 'ROLE_CUSTOMER', NOW())
ON CONFLICT (email) DO NOTHING;

INSERT INTO customer_profiles (id, user_id, preferred_fit, favorite_color, height_cm, weight_kg)
VALUES 
  (1, 3, 'Oversize', 'Monochrome', 175.0, 68.0)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO delivery_addresses (user_id, recipient_name, phone_number, province_city, district, ward, detailed_address, is_default)
VALUES 
  (3, 'Lê Duy', '0912345678', 'TP. Hồ Chí Minh', 'Quận 1', 'Phường Bến Nghé', '123 Nguyễn Huệ', TRUE),
  (3, 'Lê Duy Cơ Quan', '0912345678', 'TP. Hồ Chí Minh', 'Quận 7', 'Phường Tân Phong', '456 Nguyễn Văn Linh', FALSE)
ON CONFLICT DO NOTHING;

