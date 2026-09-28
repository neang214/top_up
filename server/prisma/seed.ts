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
            imageUrl: "/images/games/pubg-mobile.webp",
            isActive: true,
        },
    });

    const mlbb = await prisma.game.create({
        data: {
            name: "Mobile Legends",
            slug: "mobile-legends",
            imageUrl: "/images/games/mobile-legends.webp",
            isActive: true,
        },
    });

    await prisma.product.createMany({
        data: [
            {
                gameId: pubg.id,
                name: "60 UC",
                amount: 60,
                price: 0.99,
                imageUrl: "/images/products/pubg-60-uc.webp",
                isActive: true,
            },
            {
                gameId: pubg.id,
                name: "325 UC",
                amount: 325,
                price: 4.99,
                imageUrl: "/images/products/pubg-325-uc.webp",
                isActive: true,
            },
            {
                gameId: pubg.id,
                name: "660 UC",
                amount: 660,
                price: 9.99,
                imageUrl: "/images/products/pubg-660-uc.webp",
                isActive: true,
            },
            {
                gameId: pubg.id,
                name: "1800 UC",
                amount: 1800,
                price: 24.99,
                imageUrl: "/images/products/pubg-1800-uc.webp",
                isActive: true,
            },

            {
                gameId: mlbb.id,
                name: "86 Diamonds",
                amount: 86,
                price: 0.99,
                imageUrl: "/images/products/mlbb-86-diamonds.webp",
                isActive: true,
            },
            {
                gameId: mlbb.id,
                name: "172 Diamonds",
                amount: 172,
                price: 1.99,
                imageUrl: "/images/products/mlbb-172-diamonds.webp",
                isActive: true,
            },
            {
                gameId: mlbb.id,
                name: "257 Diamonds",
                amount: 257,
                price: 2.99,
                imageUrl: "/images/products/mlbb-257-diamonds.webp",
                isActive: true,
            },
            {
                gameId: mlbb.id,
                name: "344 Diamonds",
                amount: 344,
                price: 3.99,
                imageUrl: "/images/products/mlbb-344-diamonds.webp",
                isActive: true,
            },
            {
                gameId: mlbb.id,
                name: "429 Diamonds",
                amount: 429,
                price: 4.99,
                imageUrl: "/images/products/mlbb-429-diamonds.webp",
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
