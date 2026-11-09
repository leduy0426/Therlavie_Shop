---
title: Implementation Plan for UC-31 to UC-40 (Multi-tier Architecture)
description: >-
  Master plan to develop UC-31 through UC-40 for Thierlavier Shop based on
  multi-tier client-server architecture, resolving discrepancies between specs,
  interaction diagrams, and business rules.
status: in-progress
priority: P1
branch: feature/uc31-40-auth-user-management
tags:
  - swd392
  - auth
  - user-management
  - multi-tier
  - security
  - course-project
blockedBy: []
blocks: []
created: '2026-11-09T01:08:03.405Z'
createdBy: ck-cli
source: cli
---

# Implementation Plan for UC-31 to UC-40 (Multi-tier Architecture)

## Overview

Kế hoạch toàn diện triển khai cụm tính năng Quản lý Tài khoản, Xác thực, Hồ sơ Khách hàng và Phân quyền Quản trị (UC-31 đến UC-40) thuộc dự án Thierlavier Shop (SWD392). 
Hệ thống tuân thủ kiến trúc **Multi-tier Client-Server** phân tầng nghiêm ngặt (Client UI -> API Controller -> Service/Domain Logic -> Repository Data Access -> Database & External Providers), chuẩn hóa các mâu thuẫn giữa Use Case Specification, Sequence Diagram, Communication Diagram, Activity Diagram và Business Rules.

## Phases

| Phase | Name | Status | Summary |
|-------|------|--------|---------|
| 1 | [Analysis_Discrepancies](./phase-01-analysis-discrepancies.md) | In-Progress | Completed |
| 2 | [Architecture_Database_Design](./phase-02-architecture-database-design.md) | Pending | Completed |
| 3 | [Auth_Lifecycle_UC31_UC36](./phase-03-auth-lifecycle-uc31-uc36.md) | Pending | Completed |
| 4 | [Profile_Address_UC37_UC38](./phase-04-profile-address-uc37-uc38.md) | Pending | Completed |
| 5 | [Guest_Verification_UC39](./phase-05-guest-verification-uc39.md) | Pending | Completed |
| 6 | [Admin_RBAC_Audit_UC40](./phase-06-admin-rbac-audit-uc40.md) | Pending | Completed |
| 7 | [Integration_Testing](./phase-07-integration-testing.md) | Pending | Completed |

## Dependencies

- **Database Server**: PostgreSQL / MySQL cơ sở dữ liệu quan hệ cho persistence.
- **Cache Engine**: Redis / In-memory Store phục vụ Rate Limiter, OTP cache (TTL 3-5m), JWT Blacklist (TTL 15-60m).
- **External Mock Services**: 
  - Mock SMTP Server (Nodemailer / Ethereal Email / MailHog) gửi email xác thực.
  - Mock SMS Gateway API (Twilio / eSMS Sandbox) gửi OTP qua tin nhắn SMS.
  - Local Storage / Cloudinary Mock lưu trữ ảnh đại diện (Avatar).
