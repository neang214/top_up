import { PrismaClient } from "../src/generated/prisma/client.js";

const prisma = new PrismaClient();

async function main() {
    await prisma.payment.deleteMany();
    await prisma.topUp.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.game.deleteMany();
    await prisma.user.deleteMany();

    const pubg = await prisma.game.create({
        data: {
            name: "PUBG MOBILE",
            slug: "pubg-mobile",
            isActive: true,
        },
    });

    const mlbb = await prisma.game.create({
        data: {
            name: "Mobile Legends",
            slug: "mobile-legends",
            isActive: true,
        },
    });

    await prisma.product.createMany({
        data: [
            {
                gameId: pubg.id,
                supplierPackageId: "DEV-PUBG-60-UC",
                name: "60 UC",
                amount: 60,
                price: 0.99,
                isActive: true,
            },
            {
                gameId: pubg.id,
                supplierPackageId: "DEV-PUBG-325-UC",
                name: "325 UC",
                amount: 325,
                price: 4.99,
                isActive: true,
            },
            {
                gameId: pubg.id,
                supplierPackageId: "DEV-PUBG-660-UC",
                name: "660 UC",
                amount: 660,
                price: 9.99,
                isActive: true,
            },
            {
                gameId: pubg.id,
                supplierPackageId: "DEV-PUBG-1800-UC",
                name: "1800 UC",
                amount: 1800,
                price: 24.99,
                isActive: true,
            },

            {
                gameId: mlbb.id,
                supplierPackageId: "DEV-MLBB-86-DM",
                name: "86 Diamonds",
                amount: 86,
                price: 0.99,
                isActive: true,
            },
            {
                gameId: mlbb.id,
                supplierPackageId: "DEV-MLBB-172-DM",
                name: "172 Diamonds",
                amount: 172,
                price: 1.99,
                isActive: true,
            },
            {
                gameId: mlbb.id,
                supplierPackageId: "DEV-MLBB-257-DM",
                name: "257 Diamonds",
                amount: 257,
                price: 2.99,
                isActive: true,
            },
            {
                gameId: mlbb.id,
                supplierPackageId: "DEV-MLBB-344-DM",
                name: "344 Diamonds",
                amount: 344,
                price: 3.99,
                isActive: true,
            },
            {
                gameId: mlbb.id,
                supplierPackageId: "DEV-MLBB-429-DM",
                name: "429 Diamonds",
                amount: 429,
                price: 4.99,
                isActive: true,
            },
        ],
    });

    console.log("Seed completed successfully.");
}

main()
    .catch((error) => {
        console.error("Seed failed:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
    