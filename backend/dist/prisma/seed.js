/*
    SE1990_NJ
    V1.0-11/09/2026
    Lê Duy - HE194188
*/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding initial data for Thierlavier Shop...');
    const passwordHashAdmin = await bcrypt.hash('Admin@123456', 12);
    const passwordHashStaff = await bcrypt.hash('Staff@123456', 12);
    const passwordHashCustomer = await bcrypt.hash('Customer@123456', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@therlavie.com' },
        update: {},
        create: {
            email: 'admin@therlavie.com',
            fullName: 'System Administrator',
            passwordHash: passwordHashAdmin,
            role: client_1.UserRole.ROLE_ADMIN,
            status: client_1.UserStatus.ACTIVE,
            phoneNumber: '0901234567',
            emailVerifiedAt: new Date(),
        },
    });
    const staff = await prisma.user.upsert({
        where: { email: 'staff@therlavie.com' },
        update: {},
        create: {
            email: 'staff@therlavie.com',
            fullName: 'Shop Supervisor',
            passwordHash: passwordHashStaff,
            role: client_1.UserRole.ROLE_STAFF,
            status: client_1.UserStatus.ACTIVE,
            phoneNumber: '0907654321',
            emailVerifiedAt: new Date(),
        },
    });
    const customer = await prisma.user.upsert({
        where: { email: 'customer@therlavie.com' },
        update: {},
        create: {
            email: 'customer@therlavie.com',
            fullName: 'Le Duy Customer',
            passwordHash: passwordHashCustomer,
            role: client_1.UserRole.ROLE_CUSTOMER,
            status: client_1.UserStatus.ACTIVE,
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
//# sourceMappingURL=seed.js.map