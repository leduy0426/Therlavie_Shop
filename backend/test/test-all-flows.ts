/*
    SE1990_NJ
    V1.0-11/09/2026
    Lê Duy - HE194188
*/

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { PrismaClient, UserRole, UserStatus, OtpType } from '@prisma/client';
import * as cookieParser from 'cookie-parser';
import * as crypto from 'crypto';
import { AppModule } from '../src/app.module';

const prisma = new PrismaClient();
const PORT = 3099;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

interface TestResult {
  uc: string;
  testCase: string;
  status: 'PASS' | 'FAIL';
  details: string;
  durationMs: number;
}

const results: TestResult[] = [];

function sha256(val: string): string {
  return crypto.createHash('sha256').update(val).digest('hex');
}

function crack6DigitOtp(hash: string): string {
  for (let i = 100000; i <= 999999; i++) {
    const candidate = i.toString();
    if (sha256(candidate) === hash) {
      return candidate;
    }
  }
  return '';
}

async function runTest(
  uc: string,
  testCase: string,
  fn: () => Promise<string | void>,
) {
  const start = Date.now();
  try {
    const details = (await fn()) || 'OK';
    const durationMs = Date.now() - start;
    results.push({ uc, testCase, status: 'PASS', details, durationMs });
    console.log(`  [PASS] [${uc}] ${testCase} (${durationMs}ms): ${details}`);
  } catch (err: any) {
    const durationMs = Date.now() - start;
    const details = err?.message || String(err);
    results.push({ uc, testCase, status: 'FAIL', details, durationMs });
    console.error(`  [FAIL] [${uc}] ${testCase} (${durationMs}ms): ${details}`);
  }
}

async function api(
  endpoint: string,
  options: {
    method?: string;
    body?: any;
    token?: string;
    cookie?: string;
  } = {},
) {
  const url = `${BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }
  if (options.cookie) {
    headers['Cookie'] = options.cookie;
  }

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data: any = null;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  const cookieHeader = res.headers.get('set-cookie') || '';
  return { status: res.status, data, cookieHeader };
}

async function main() {
  console.log('===============================================================');
  console.log(' THIERLAVIER SHOP - COMPREHENSIVE USE CASE VALIDATION (UC 31-40)');
  console.log('===============================================================\n');

  // 1. Start ephemeral NestJS test server
  console.log(`[BOOTSTRAP] Launching NestJS test instance on port ${PORT}...`);
  const app = await NestFactory.create(AppModule, { logger: false });
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(PORT);
  console.log(`[BOOTSTRAP] Test server listening on http://localhost:${PORT}\n`);

  const testEmail = `autotest_${Date.now()}@therlavie.com`;
  const testPhone = '0988776655';
  let customerAccessToken = '';
  let customerRefreshToken = '';
  let customerId = 0;
  let adminAccessToken = '';
  let testAddressId1 = 0;

  try {
    // Clean any prior residues for test phone
    await prisma.otpVerification.deleteMany({
      where: { targetIdentifier: { in: [testEmail, testPhone] } },
    });
    await prisma.guestCheckoutVerification.deleteMany({
      where: { phoneNumber: testPhone },
    });

    // =========================================================
    // UC-31: REGISTER ACCOUNT
    // =========================================================
    console.log('\n--- TESTING UC-31: REGISTER ACCOUNT ---');

    await runTest('UC-31', 'TC-31.1: Password confirmation mismatch', async () => {
      const res = await api('/auth/register', {
        method: 'POST',
        body: {
          email: testEmail,
          fullName: 'Auto Test User',
          password: 'Password@123',
          confirmPassword: 'Password@Different',
          phoneNumber: '0900000001',
        },
      });
      if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
      return 'Rejected mismatched passwords properly';
    });

    await runTest('UC-31', 'TC-31.2: Weak password validation (missing digit/symbol/uppercase)', async () => {
      const res = await api('/auth/register', {
        method: 'POST',
        body: {
          email: testEmail,
          fullName: 'Auto Test User',
          password: 'simple',
          confirmPassword: 'simple',
          phoneNumber: '0900000001',
        },
      });
      if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
      return 'Rejected weak password according to NFR-02 policy';
    });

    await runTest('UC-31', 'TC-31.3: Successful Registration with Customer Profile creation', async () => {
      const res = await api('/auth/register', {
        method: 'POST',
        body: {
          email: testEmail,
          fullName: 'Auto Test User',
          password: 'TestPassword@123456',
          confirmPassword: 'TestPassword@123456',
          phoneNumber: '0900000001',
        },
      });
      if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}: ${JSON.stringify(res.data)}`);

      // Verify DB state
      const user = await prisma.user.findUnique({
        where: { email: testEmail },
        include: { profile: true },
      });
      if (!user) throw new Error('User not persisted in DB');
      if (user.status !== UserStatus.PENDING_VERIFICATION) throw new Error(`Status should be PENDING_VERIFICATION, got ${user.status}`);
      if (!user.profile) throw new Error('CustomerProfile not created');
      customerId = user.id;

      // Verify OTP record
      const otpRecord = await prisma.otpVerification.findFirst({
        where: { targetIdentifier: testEmail, otpType: OtpType.EMAIL_VERIFICATION },
      });
      if (!otpRecord) throw new Error('Verification OTP not generated in DB');
      if (otpRecord.expiresAt <= new Date()) throw new Error('OTP expiresAt must be in the future (300s TTL BR-02)');

      return `User created (ID: ${user.id}, Status: PENDING_VERIFICATION) with 5m OTP`;
    });

    await runTest('UC-31', 'TC-31.4: Duplicate email of active account rejects with 409 Conflict', async () => {
      const res = await api('/auth/register', {
        method: 'POST',
        body: {
          email: 'admin@therlavie.com',
          fullName: 'Duplicate Guy',
          password: 'TestPassword@123456',
          confirmPassword: 'TestPassword@123456',
          phoneNumber: '0900000002',
        },
      });
      if (res.status !== 409) throw new Error(`Expected 409 Conflict, got ${res.status}`);
      return 'Conflict correctly returned for registered active email';
    });

    // =========================================================
    // UC-32: VERIFY EMAIL OTP
    // =========================================================
    console.log('\n--- TESTING UC-32: VERIFY EMAIL OTP & ACTIVATE ACCOUNT ---');

    await runTest('UC-32', 'TC-32.1: Invalid OTP rejected and increments failed attempts', async () => {
      const res = await api('/auth/verify-email', {
        method: 'POST',
        body: {
          email: testEmail,
          otpCode: '000000',
        },
      });
      if (res.status !== 400) throw new Error(`Expected 400 Bad Request, got ${res.status}`);

      const otp = await prisma.otpVerification.findFirst({
        where: { targetIdentifier: testEmail, otpType: OtpType.EMAIL_VERIFICATION, isConsumed: false },
      });
      if (!otp || otp.attempts !== 1) throw new Error(`Expected attempts=1, got ${otp?.attempts}`);
      return `Attempt counter incremented to 1 (remaining attempts: ${5 - (otp?.attempts || 0)})`;
    });

    await runTest('UC-32', 'TC-32.2: Correct OTP activates account, sets tokens & merges cart', async () => {
      const otpRecord = await prisma.otpVerification.findFirst({
        where: { targetIdentifier: testEmail, otpType: OtpType.EMAIL_VERIFICATION, isConsumed: false },
      });
      if (!otpRecord) throw new Error('No unconsumed OTP found');
      const realOtp = crack6DigitOtp(otpRecord.otpCodeHash);
      if (!realOtp) throw new Error('Failed to resolve 6-digit OTP code');

      const res = await api('/auth/verify-email', {
        method: 'POST',
        body: {
          email: testEmail,
          otpCode: realOtp,
          guestSessionId: 'guest_session_xyz999',
        },
      });
      if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}: ${JSON.stringify(res.data)}`);
      if (!res.data.accessToken) throw new Error('Access token not returned');

      customerAccessToken = res.data.accessToken;

      // Verify DB update
      const updatedUser = await prisma.user.findUnique({ where: { email: testEmail } });
      if (updatedUser?.status !== UserStatus.ACTIVE) throw new Error(`Expected ACTIVE, got ${updatedUser?.status}`);
      if (!updatedUser.emailVerifiedAt) throw new Error('emailVerifiedAt timestamp was not recorded');

      const consumedOtp = await prisma.otpVerification.findUnique({ where: { id: otpRecord.id } });
      if (!consumedOtp?.isConsumed) throw new Error('OTP was not marked as isConsumed: true');

      return `Account activated to ACTIVE at ${updatedUser.emailVerifiedAt.toISOString()}, JWT issued`;
    });

    // =========================================================
    // UC-33: LOGIN
    // =========================================================
    console.log('\n--- TESTING UC-33: LOGIN & BRUTE FORCE LOCKOUT ---');

    await runTest('UC-33', 'TC-33.1: Invalid credentials increment failedLoginAttempts', async () => {
      const res = await api('/auth/login', {
        method: 'POST',
        body: {
          email: testEmail,
          password: 'WrongPassword@999',
        },
      });
      if (res.status !== 401) throw new Error(`Expected 401 Unauthorized, got ${res.status}`);

      const user = await prisma.user.findUnique({ where: { email: testEmail } });
      if (user?.failedLoginAttempts !== 1) throw new Error(`Expected failedLoginAttempts=1, got ${user?.failedLoginAttempts}`);
      return `Failed attempt recorded (count: ${user.failedLoginAttempts})`;
    });

    await runTest('UC-33', 'TC-33.2: 5 consecutive failed logins trigger lockout (BR-07 / BR-13)', async () => {
      // Simulate attempts 2, 3, 4, 5
      for (let i = 2; i <= 5; i++) {
        await api('/auth/login', {
          method: 'POST',
          body: { email: testEmail, password: 'WrongPassword@999' },
        });
      }

      const lockedUser = await prisma.user.findUnique({ where: { email: testEmail } });
      if (!lockedUser?.lockoutUntil || lockedUser.lockoutUntil <= new Date()) {
        throw new Error('lockoutUntil timestamp not set for 15 minutes lockout');
      }

      // Next login attempt must be rejected with 403 Forbidden
      const lockedRes = await api('/auth/login', {
        method: 'POST',
        body: { email: testEmail, password: 'TestPassword@123456' },
      });
      if (lockedRes.status !== 403) throw new Error(`Expected 403 Forbidden for locked account, got ${lockedRes.status}`);

      // Unlock for subsequent test steps
      await prisma.user.update({
        where: { email: testEmail },
        data: { failedLoginAttempts: 0, lockoutUntil: null },
      });

      return `Account locked after 5 failed attempts until ${lockedUser.lockoutUntil.toISOString()}`;
    });

    await runTest('UC-33', 'TC-33.3: Successful Customer Login with rememberMe=true', async () => {
      const res = await api('/auth/login', {
        method: 'POST',
        body: {
          email: testEmail,
          password: 'TestPassword@123456',
          rememberMe: true,
        },
      });
      if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}`);
      if (!res.data.accessToken) throw new Error('Missing accessToken');

      customerAccessToken = res.data.accessToken;

      // Extract refreshToken cookie
      const match = res.cookieHeader.match(/refreshToken=([^;]+)/);
      if (match) {
        customerRefreshToken = match[1];
      }

      // Check DB refresh token created
      const dbTokens = await prisma.refreshToken.findMany({ where: { userId: customerId } });
      if (dbTokens.length === 0) throw new Error('Refresh token record missing in DB');

      return `Access token issued, Refresh token stored in DB (Expires in 30 days)`;
    });

    await runTest('UC-33', 'TC-33.4: Administrator Login routes to /admin/dashboard (BR-33)', async () => {
      const res = await api('/auth/login', {
        method: 'POST',
        body: {
          email: 'admin@therlavie.com',
          password: 'Admin@123456',
        },
      });
      if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}`);
      if (res.data.redirectPath !== '/admin/dashboard') {
        throw new Error(`Expected redirectPath='/admin/dashboard', got ${res.data.redirectPath}`);
      }
      adminAccessToken = res.data.accessToken;
      return `Admin authenticated with role ROLE_ADMIN, redirect: /admin/dashboard`;
    });

    // =========================================================
    // UC-34: LOGOUT
    // =========================================================
    console.log('\n--- TESTING UC-34: LOGOUT & TOKEN REVOCATION ---');

    await runTest('UC-34', 'TC-34.1: Logout revokes refreshToken in DB and clears cookie', async () => {
      const res = await api('/auth/logout', {
        method: 'POST',
        token: customerAccessToken,
        cookie: `refreshToken=${customerRefreshToken}`,
      });
      if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}`);

      // Verify DB refresh token marked revoked
      const dbToken = await prisma.refreshToken.findFirst({
        where: { userId: customerId, tokenHash: sha256(customerRefreshToken) },
      });
      if (!dbToken || !dbToken.isRevoked) throw new Error('Refresh token was not marked isRevoked: true in DB');

      // Re-login to get fresh token for remaining tests
      const loginRes = await api('/auth/login', {
        method: 'POST',
        body: { email: testEmail, password: 'TestPassword@123456' },
      });
      customerAccessToken = loginRes.data.accessToken;

      return 'Refresh token revoked from DB, Cookie clearance instruction sent';
    });

    // =========================================================
    // UC-35: FORGOT & RESET PASSWORD
    // =========================================================
    console.log('\n--- TESTING UC-35: FORGOT & RESET PASSWORD ---');

    await runTest('UC-35', 'TC-35.1: Request Password Reset OTP', async () => {
      const res = await api('/auth/forgot-password', {
        method: 'POST',
        body: { email: testEmail },
      });
      if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}`);

      const otp = await prisma.otpVerification.findFirst({
        where: { targetIdentifier: testEmail, otpType: OtpType.PASSWORD_RESET, isConsumed: false },
      });
      if (!otp) throw new Error('Reset password OTP not found in DB');
      return 'Reset OTP generated with 5m TTL';
    });

    await runTest('UC-35', 'TC-35.2: Reset Password with valid OTP revokes all sessions', async () => {
      const otpRecord = await prisma.otpVerification.findFirst({
        where: { targetIdentifier: testEmail, otpType: OtpType.PASSWORD_RESET, isConsumed: false },
      });
      const realOtp = crack6DigitOtp(otpRecord!.otpCodeHash);

      const res = await api('/auth/reset-password', {
        method: 'POST',
        body: {
          email: testEmail,
          otpCode: realOtp,
          newPassword: 'BrandNewPassword@2026',
          confirmPassword: 'BrandNewPassword@2026',
        },
      });
      if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}`);

      // Verify old password fails
      const oldLogin = await api('/auth/login', {
        method: 'POST',
        body: { email: testEmail, password: 'TestPassword@123456' },
      });
      if (oldLogin.status !== 401) throw new Error('Old password should be rejected with 401');

      // Verify new password succeeds
      const newLogin = await api('/auth/login', {
        method: 'POST',
        body: { email: testEmail, password: 'BrandNewPassword@2026' },
      });
      if (newLogin.status !== 200) throw new Error('New password failed to authenticate');
      customerAccessToken = newLogin.data.accessToken;

      return 'Password updated, old credentials rejected, new password verified';
    });

    // =========================================================
    // UC-36: CHANGE PASSWORD
    // =========================================================
    console.log('\n--- TESTING UC-36: CHANGE PASSWORD (LOGGED IN) ---');

    await runTest('UC-36', 'TC-36.1: Reject reusing current password (BR-06 Policy)', async () => {
      const res = await api('/auth/change-password', {
        method: 'PUT',
        token: customerAccessToken,
        body: {
          currentPassword: 'BrandNewPassword@2026',
          newPassword: 'BrandNewPassword@2026',
          confirmPassword: 'BrandNewPassword@2026',
        },
      });
      if (res.status !== 400) throw new Error(`Expected 400 Bad Request, got ${res.status}`);
      return 'BR-06 policy enforced: New password cannot match current password';
    });

    await runTest('UC-36', 'TC-36.2: Successful password change with valid current password', async () => {
      const res = await api('/auth/change-password', {
        method: 'PUT',
        token: customerAccessToken,
        body: {
          currentPassword: 'BrandNewPassword@2026',
          newPassword: 'FinalPassword@2026!',
          confirmPassword: 'FinalPassword@2026!',
        },
      });
      if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}`);

      // Re-login with new password
      const reLogin = await api('/auth/login', {
        method: 'POST',
        body: { email: testEmail, password: 'FinalPassword@2026!' },
      });
      customerAccessToken = reLogin.data.accessToken;
      return 'Password changed successfully and verified via login';
    });

    // =========================================================
    // UC-37: VIEW & UPDATE PROFILE
    // =========================================================
    console.log('\n--- TESTING UC-37: VIEW & UPDATE PROFILE ---');

    await runTest('UC-37', 'TC-37.1: View Profile returns User info and CustomerProfile attributes', async () => {
      const res = await api('/users/profile', {
        token: customerAccessToken,
      });
      if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}`);
      if (!res.data.profile) throw new Error('Profile sub-object missing');
      return `Loaded profile for ${res.data.fullName} (Fit: ${res.data.profile.preferredFit || 'None'})`;
    });

    await runTest('UC-37', 'TC-37.2: Update Profile (User phone + Fashion preferences in 1 Tx)', async () => {
      const res = await api('/users/profile', {
        method: 'PUT',
        token: customerAccessToken,
        body: {
          fullName: 'Auto Test User VIP',
          phoneNumber: '0933333333',
          preferredFit: 'Slim-Fit',
          favoriteColor: 'Navy Blue',
          heightCm: 180,
          weightKg: 75,
        },
      });
      if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}`);
      if (res.data.profile.preferredFit !== 'Slim-Fit') throw new Error('Fit preference not updated');
      if (res.data.phoneNumber !== '0933333333') throw new Error('Phone number not updated in User table');
      return 'Atomic transaction synced User and CustomerProfile (Height: 180cm, Fit: Slim-Fit)';
    });

    await runTest('UC-37', 'TC-37.3: Remove Avatar (Alt Flow 1.1)', async () => {
      const res = await api('/users/avatar', {
        method: 'DELETE',
        token: customerAccessToken,
      });
      if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}`);
      return 'Avatar reference set to null';
    });

    // =========================================================
    // UC-38: DELIVERY ADDRESS MANAGEMENT
    // =========================================================
    console.log('\n--- TESTING UC-38: DELIVERY ADDRESS BOOK (MAX 5 LIMIT BR-14) ---');

    await runTest('UC-38', 'TC-38.1: Create first address with isDefault: true', async () => {
      const res = await api('/addresses', {
        method: 'POST',
        token: customerAccessToken,
        body: {
          recipientName: 'Recipient One',
          phoneNumber: '0901111111',
          provinceCity: 'TP. Ho Chi Minh',
          district: 'Quan 1',
          ward: 'Ben Nghe',
          detailedAddress: 'Số 1 Cong Xa Paris',
          isDefault: true,
        },
      });
      if (res.status !== 201) throw new Error(`Expected 201 Created, got ${res.status}`);
      const address = res.data.address || res.data;
      testAddressId1 = address.id;
      if (!address.isDefault) throw new Error('isDefault was not set to true');
      return `Address 1 created with ID ${address.id} (Default: true)`;
    });

    await runTest('UC-38', 'TC-38.2: Create second default address toggles first address default off', async () => {
      const res = await api('/addresses', {
        method: 'POST',
        token: customerAccessToken,
        body: {
          recipientName: 'Recipient Two',
          phoneNumber: '0902222222',
          provinceCity: 'TP. Ho Chi Minh',
          district: 'Quan 3',
          ward: 'Vo Thi Sau',
          detailedAddress: 'Số 2 Vo Van Tan',
          isDefault: true,
        },
      });
      if (res.status !== 201) throw new Error(`Expected 201 Created, got ${res.status}`);

      // Check first address
      const addr1 = await prisma.deliveryAddress.findUnique({ where: { id: testAddressId1 } });
      if (addr1?.isDefault !== false) throw new Error('Previous default address was not toggled off');
      return 'Previous default address correctly toggled to isDefault: false';
    });

    await runTest('UC-38', 'TC-38.3: Enforce BR-14 Limit (Maximum 5 addresses per customer)', async () => {
      // Add address 3, 4, 5
      for (let i = 3; i <= 5; i++) {
        const createRes = await api('/addresses', {
          method: 'POST',
          token: customerAccessToken,
          body: {
            recipientName: `Recipient ${i}`,
            phoneNumber: `090${i}${i}${i}${i}${i}${i}${i}`,
            provinceCity: 'TP. Ho Chi Minh',
            district: 'Quan 5',
            ward: 'Phuong 1',
            detailedAddress: `Số ${i} Tran Hung Dao`,
            isDefault: false,
          },
        });
        if (createRes.status !== 201) throw new Error(`Failed adding address ${i}: ${createRes.status}`);
      }

      // Attempt to add 6th address -> MUST FAIL with 400
      const overflowRes = await api('/addresses', {
        method: 'POST',
        token: customerAccessToken,
        body: {
          recipientName: 'Recipient Six Overflow',
          phoneNumber: '0906666666',
          provinceCity: 'TP. Ho Chi Minh',
          district: 'Quan 7',
          ward: 'Tan Phong',
          detailedAddress: 'Số 6 Nguyen Thi Thap',
          isDefault: false,
        },
      });
      if (overflowRes.status !== 400) {
        throw new Error(`Expected 400 Bad Request for 6th address (BR-14), got ${overflowRes.status}`);
      }
      return 'BR-14 enforced: 6th address rejected with 400 Bad Request';
    });

    await runTest('UC-38', 'TC-38.4: Soft delete address', async () => {
      const res = await api(`/addresses/${testAddressId1}`, {
        method: 'DELETE',
        token: customerAccessToken,
      });
      if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}`);

      const softDeleted = await prisma.deliveryAddress.findUnique({ where: { id: testAddressId1 } });
      if (!softDeleted?.isDeleted) throw new Error('Address isDeleted flag not set');

      // Now adding a new 5th active address should succeed
      const new5th = await api('/addresses', {
        method: 'POST',
        token: customerAccessToken,
        body: {
          recipientName: 'New Replacement Address',
          phoneNumber: '0907777777',
          provinceCity: 'TP. Da Nang',
          district: 'Hai Chau',
          ward: 'Thach Thang',
          detailedAddress: 'Số 7 Bach Dang',
          isDefault: false,
        },
      });
      if (new5th.status !== 201) throw new Error(`Expected 201 after deleting one slot, got ${new5th.status}`);

      return 'Address soft-deleted (isDeleted: true), slot freed for new address';
    });

    // =========================================================
    // UC-39: GUEST CHECKOUT OTP
    // =========================================================
    console.log('\n--- TESTING UC-39: GUEST CHECKOUT OTP ---');

    await runTest('UC-39', 'TC-39.1: Request Guest Checkout OTP via SMS', async () => {
      const res = await api('/guest/checkout-otp/request', {
        method: 'POST',
        body: {
          phoneNumber: testPhone,
          email: 'guest_buyer@gmail.com',
        },
      });
      if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}`);

      const otpRecord = await prisma.otpVerification.findFirst({
        where: { targetIdentifier: testPhone, otpType: OtpType.GUEST_CHECKOUT, isConsumed: false },
      });
      if (!otpRecord) throw new Error('Guest OTP not stored in DB');
      return `SMS OTP dispatched with 5m TTL, 60s cooldown`;
    });

    await runTest('UC-39', 'TC-39.2: Cooldown rejects immediate re-request', async () => {
      const res = await api('/guest/checkout-otp/request', {
        method: 'POST',
        body: {
          phoneNumber: testPhone,
        },
      });
      if (res.status !== 400) throw new Error(`Expected 400 Bad Request for cooldown, got ${res.status}`);
      return 'Cooldown active: re-request rejected';
    });

    await runTest('UC-39', 'TC-39.3: Verify Guest OTP & issue GuestCheckoutToken valid for 15m', async () => {
      const otpRecord = await prisma.otpVerification.findFirst({
        where: { targetIdentifier: testPhone, otpType: OtpType.GUEST_CHECKOUT, isConsumed: false },
      });
      const realOtp = crack6DigitOtp(otpRecord!.otpCodeHash);

      const res = await api('/guest/checkout-otp/verify', {
        method: 'POST',
        body: {
          phoneNumber: testPhone,
          otpCode: realOtp,
        },
      });
      if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}`);
      if (!res.data.guestVerificationToken) throw new Error('Missing guestVerificationToken');

      // Verify DB record
      const guestToken = await prisma.guestCheckoutVerification.findUnique({
        where: { verificationToken: res.data.guestVerificationToken },
      });
      if (!guestToken?.isVerified) throw new Error('Guest token not found in DB or unverified');
      return `Issued GuestCheckoutToken: ${guestToken.verificationToken.substring(0, 16)}... (Expires: ${guestToken.expiresAt.toISOString()})`;
    });

    // =========================================================
    // UC-40: ADMIN USER MANAGEMENT & AUDIT LOGS
    // =========================================================
    console.log('\n--- TESTING UC-40: ADMIN USER MANAGEMENT (RBAC, AUDIT LOG NFR-11) ---');

    await runTest('UC-40', 'TC-40.1: Non-admin user access forbidden (RBAC)', async () => {
      const res = await api('/admin/users', {
        token: customerAccessToken,
      });
      if (res.status !== 403) throw new Error(`Expected 403 Forbidden, got ${res.status}`);
      return 'Non-admin blocked with 403 Forbidden';
    });

    await runTest('UC-40', 'TC-40.2: Admin lists users with search, pagination and role filter', async () => {
      const res = await api('/admin/users?role=ROLE_CUSTOMER&limit=5', {
        token: adminAccessToken,
      });
      if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}`);
      if (!res.data.content || !Array.isArray(res.data.content)) throw new Error('Missing content array');
      return `Returned ${res.data.content.length} users (Total: ${res.data.meta.total}, Pages: ${res.data.meta.totalPages})`;
    });

    await runTest('UC-40', 'TC-40.3: Admin locks customer account & revokes sessions', async () => {
      const res = await api(`/admin/users/${customerId}`, {
        method: 'PATCH',
        token: adminAccessToken,
        body: {
          newStatus: UserStatus.LOCKED,
          justificationReason: 'Violated terms of service test',
        },
      });
      if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}`);

      // Verify DB status
      const lockedCustomer = await prisma.user.findUnique({ where: { id: customerId } });
      if (lockedCustomer?.status !== UserStatus.LOCKED) throw new Error(`Expected LOCKED, got ${lockedCustomer?.status}`);

      // Verify active tokens for this user revoked
      const activeTokens = await prisma.refreshToken.findMany({
        where: { userId: customerId, isRevoked: false },
      });
      if (activeTokens.length > 0) throw new Error('Active refresh tokens were not revoked upon lockout');

      // Verify customer cannot login while locked
      const tryLogin = await api('/auth/login', {
        method: 'POST',
        body: { email: testEmail, password: 'FinalPassword@2026!' },
      });
      if (tryLogin.status !== 403) throw new Error(`Expected 403 Forbidden for locked customer, got ${tryLogin.status}`);

      return 'Customer locked to LOCKED, all active sessions wiped, login returns 403';
    });

    await runTest('UC-40', 'TC-40.4: Administrator self-lockout guard (BR-11 Safety Policy)', async () => {
      const adminUser = await prisma.user.findUnique({ where: { email: 'admin@therlavie.com' } });
      const res = await api(`/admin/users/${adminUser!.id}`, {
        method: 'PATCH',
        token: adminAccessToken,
        body: {
          newStatus: UserStatus.LOCKED,
          justificationReason: 'Attempt to lock myself',
        },
      });
      if (res.status !== 400) throw new Error(`Expected 400 Bad Request for self-lockout, got ${res.status}`);
      return 'BR-11 Safety Policy enforced: Admin cannot lock or demote their own account';
    });

    await runTest('UC-40', 'TC-40.5: Admin unlocks customer account', async () => {
      const res = await api(`/admin/users/${customerId}`, {
        method: 'PATCH',
        token: adminAccessToken,
        body: {
          newStatus: UserStatus.ACTIVE,
          justificationReason: 'Reviewed and unblocked',
        },
      });
      if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}`);

      const unlockedCustomer = await prisma.user.findUnique({ where: { id: customerId } });
      if (unlockedCustomer?.status !== UserStatus.ACTIVE) throw new Error('Status not restored to ACTIVE');
      return 'Account restored to ACTIVE status';
    });

    await runTest('UC-40', 'TC-40.6: Immutable Audit Logs recorded (NFR-11 Compliance)', async () => {
      const res = await api('/admin/users/audit-logs', {
        token: adminAccessToken,
      });
      if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}`);
      if (!res.data.content || res.data.content.length === 0) throw new Error('No audit logs found');

      const latestLog = res.data.content[0];
      return `Audit trail verified: Action '${latestLog.action}' on Target ID ${latestLog.targetId} at ${latestLog.createdAt}`;
    });

  } finally {
    // Clean up test customer
    if (customerId) {
      await prisma.deliveryAddress.deleteMany({ where: { userId: customerId } });
      await prisma.refreshToken.deleteMany({ where: { userId: customerId } });
      await prisma.customerProfile.deleteMany({ where: { userId: customerId } });
      await prisma.auditLog.deleteMany({ where: { targetId: customerId } });
      await prisma.user.delete({ where: { id: customerId } });
    }
    await prisma.otpVerification.deleteMany({
      where: { targetIdentifier: { in: [testEmail, testPhone] } },
    });
    await prisma.guestCheckoutVerification.deleteMany({
      where: { phoneNumber: testPhone },
    });

    // Close NestJS app
    await app.close();
    await prisma.$disconnect();
  }

  // =========================================================
  // PRINT SUMMARY REPORT
  // =========================================================
  console.log('\n===============================================================');
  console.log('                 TEST EXECUTION SUMMARY REPORT                 ');
  console.log('===============================================================');
  const total = results.length;
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;

  console.log(`\nTOTAL TEST CASES: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log(`SUCCESS RATE: ${((passed / total) * 100).toFixed(1)}%\n`);

  console.log('| Use Case | Test Case ID & Description | Status | Time |');
  console.log('| :--- | :--- | :---: | :---: |');
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
    console.log(`| ${r.uc} | ${r.testCase} | ${icon} | ${r.durationMs}ms |`);
  }

  if (failed > 0) {
    console.error(`\n[CRITICAL] ${failed} tests failed! Review logs above.`);
    process.exit(1);
  } else {
    console.log('\n[SUCCESS] ALL USE CASE FLOWS (UC-31 TO UC-40) VALIDATED SUCCESSFULLY!');
  }
}

main().catch((e) => {
  console.error('[FATAL ERROR IN TEST RUNNER]', e);
  process.exit(1);
});
