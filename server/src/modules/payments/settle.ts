import type { Payment } from "@prisma/client";
import prisma from "../../utils/db.js";
import { processTopUp } from "../topups/service.js";
import { checkTransaction } from "./payway.js";
import { isPaid } from "./service.js";

export type SettleResult = "COMPLETED" | "PENDING";

/** Asks the payment's own provider whether the customer really paid the right amount. */
const providerSaysPaid = async (payment: Payment): Promise<boolean> => {
    if (!payment.providerPaymentId) return false;

    if (payment.provider === "PAYWAY") {
        const check = await checkTransaction(payment.providerPaymentId);
        if (check.state !== "PAID") return false;

        const order = await prisma.order.findUnique({
            where: { id: payment.orderId },
            select: { currency: true },
        });

        const sameAmount = check.paidAmount !== null && Math.abs(check.paidAmount - Number(payment.amount)) <= 0.009;
        const sameCurrency = check.currency === null || check.currency === order?.currency;

        if (!sameAmount || !sameCurrency) {
            console.error(
                `PayWay amount mismatch for order ${payment.orderId}: expected ${payment.amount} ${order?.currency}, got ${check.paidAmount} ${check.currency}`
            );
            return false;
        }

        return true;
    }

    return isPaid(payment.providerPaymentId);
};

/**
 * Marks the order paid and delivers the top-up, but only if the provider confirms payment.
 * Safe to call from several places at once (customer polling, provider callback):
 * only the call that wins the PENDING -> COMPLETED update goes on to deliver.
 */
export const settleIfPaid = async (payment: Payment): Promise<SettleResult> => {
    if (payment.status === "COMPLETED") return "COMPLETED";

    if (!(await providerSaysPaid(payment))) return "PENDING";

    const won = await prisma.$transaction(async (tx) => {
        const claim = await tx.payment.updateMany({
            where: { id: payment.id, status: "PENDING" },
            data: { status: "COMPLETED", paidAt: new Date() },
        });

        if (claim.count === 0) return false;

        await tx.order.update({
            where: { id: payment.orderId },
            data: { status: "PAID", paidAt: new Date() },
        });

        await tx.topUp.update({
            where: { orderId: payment.orderId },
            data: { status: "PROCESSING" },
        });

        return true;
    });

    if (won) {
        try {
            await processTopUp(payment.orderId);
        } catch (error) {
            // The customer has paid. Keep the order PAID so it shows up as "needs attention" for the admin.
            console.error(`Top-up failed after payment for order ${payment.orderId}:`, error);
        }
    }

    return "COMPLETED";
};
