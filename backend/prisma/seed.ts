/*
    SE1990_NJ
    V1.0-11/09/2026
    Lê Duy - HE194188
*/


import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data for Thierlavier Shop...');

  const passwordHashAdmin = await bcrypt.hash('Admin@123456', 12);
  const passwordHashStaff = await bcrypt.hash('Staff@123456', 12);
  const passwordHashCustomer = await bcrypt.hash('Customer@123456', 12);

  // 1. Seed Administrator (BR-33)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@therlavie.com' },
    update: {},
    create: {
      email: 'admin@therlavie.com',
      fullName: 'System Administrator',
      passwordHash: passwordHashAdmin,
      role: UserRole.ROLE_ADMIN,
      status: UserStatus.ACTIVE,
      phoneNumber: '0901234567',
      emailVerifiedAt: new Date(),
    },
  });

  // 2. Seed Staff Account
  const staff = await prisma.user.upsert({
    where: { email: 'staff@therlavie.com' },
    update: {},
    create: {
      email: 'staff@therlavie.com',
      fullName: 'Shop Supervisor',
      passwordHash: passwordHashStaff,
      role: UserRole.ROLE_STAFF,
      status: UserStatus.ACTIVE,
      phoneNumber: '0907654321',
      emailVerifiedAt: new Date(),
    },
  });

  // 3. Seed Demo Customer Account (UC-37, UC-38)
  const customer = await prisma.user.upsert({
    where: { email: 'customer@therlavie.com' },
    update: {},
    create: {
      email: 'customer@therlavie.com',
      fullName: 'Le Duy Customer',
      passwordHash: passwordHashCustomer,
      role: UserRole.ROLE_CUSTOMER,
      status: UserStatus.ACTIVE,
      phoneNumber: '0912345678',
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          preferredFit: 'Oversize',
          favoriteColor: 'Monochrome',
          heightCm: 175,
          weightKg: 68,
        },
      },
      addresses: {
        create: [
          {
            recipientName: 'Le Duy',
            phoneNumber: '0912345678',
            provinceCity: 'TP. Ho Chi Minh',
            district: 'Quan 1',
            ward: 'Phuong Ben Nghe',
            detailedAddress: '123 Nguyen Hue',
            isDefault: true,
          },
          {
            recipientName: 'Le Duy Office',
            phoneNumber: '0912345678',
            provinceCity: 'TP. Ho Chi Minh',
            district: 'Quan 7',
            ward: 'Phuong Tan Phong',
            detailedAddress: '456 Nguyen Van Linh',
            isDefault: false,
          },
        ],
      },
    },
  });

  console.log(`Seeding complete: Admin(${admin.email}), Staff(${staff.email}), Customer(${customer.email})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

