import prisma from "../../utils/db.js";
import { createSupplierOrder } from "./supplier.service.js";

export const processTopUp = async (orderId: string) => {
    const topUp = await prisma.topUp.findUnique({
        where: { orderId },
        include: {
            order: {
                include: {
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
            },
        },
    });

    if (!topUp) {
        throw new Error("Top up not found");
    }

    if (topUp.order.status !== "PAID") {
        throw new Error("Order has not been paid");
    }

    const item = topUp.order.items[0];

    if (!item) {
        throw new Error("Order item not found");
    }

    const supplierResult = await createSupplierOrder(
        item.product.id,
        topUp.playerId,
        topUp.zoneId ?? undefined,
        orderId
    );

    if (supplierResult.status === "COMPLETED") {
        const completedAt = new Date();

        await prisma.$transaction([
            prisma.topUp.update({
                where: { orderId },
                data: {
                    status: "COMPLETED",
                },
            }),

            prisma.order.update({
                where: { id: orderId },
                data: {
                    status: "COMPLETED",
                    completedAt,
                },
            }),
        ]);
    }

    return supplierResult;
};
