import prisma from "../../utils/db.js";
import type { Request, Response } from "express";
import { createPayment, qrToImage } from "./service.js";
import { createPurchase, newTranId } from "./payway.js";
import { settleIfPaid } from "./settle.js";

/** Which provider new payments use. Set PAYMENT_PROVIDER=payway to use ABA PayWay, otherwise Bakong. */
const activeProvider = () =>
    (process.env.PAYMENT_PROVIDER ?? "bakong").toLowerCase() === "payway"
        ? "PAYWAY"
        : "BAKONG";


export const generateKHQR = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.body;

        if (
            typeof orderId !== "string" ||
            orderId.trim() === ""
        ) {
            return res.status(400).json({
                message: "Order ID is required",
            });
        }

        const order = await prisma.order.findUnique({
            where: {
                id: orderId,
            },
            include: {
                items: true,
            },
        });

        if (!order) {
            return res.status(404).json({
                message: "Order not found",
            });
        }

        if (order.status !== "PENDING") {
            return res.status(400).json({
                message: "Order is not available for payment",
            });
        }

        const existingPayment = await prisma.payment.findUnique({
            where: {
                orderId,
            },
        });

        if (existingPayment) {
            if (existingPayment.status === "COMPLETED") {
                return res.status(400).json({
                    message: "Order has already been paid",
                });
            }

            if (
                existingPayment.status === "PENDING" &&
                existingPayment.providerPaymentId &&
                existingPayment.qrData
            ) {
                const qrImage = await qrToImage(
                    existingPayment.qrData
                );

                return res.status(200).json({
                    message: "Existing KHQR returned",
                    provider: existingPayment.provider,
                    md5: existingPayment.providerPaymentId,
                    qrImage,
                });
            }
        }

        const amount = Number(order.total);

        if (activeProvider() === "PAYWAY") {
            const tranId = newTranId();

            let purchase;
            try {
                purchase = await createPurchase({
                    tranId,
                    amount,
                    currency: order.currency,
                    itemName:
                        order.items[0]?.productName ?? order.orderNumber,
                });
            } catch (error) {
                console.error("PayWay purchase error:", error);

                return res.status(502).json({
                    message:
                        "The payment provider could not create a payment. Please try again.",
                });
            }

            await prisma.payment.create({
                data: {
                    orderId: order.id,
                    provider: "PAYWAY",
                    providerPaymentId: tranId,
                    amount: order.total,
                    status: "PENDING",
                    qrData: purchase.qrString,
                },
            });

            const qrImage = await qrToImage(purchase.qrString);

            return res.status(200).json({
                message: "KHQR generated successfully",
                provider: "PAYWAY",
                md5: tranId,
                qrImage,
            });
        }

        const { qr, md5, qrImage } = await createPayment(
            amount,
            order.orderNumber
        );

        if (
            typeof md5 !== "string" ||
            md5.trim() === ""
        ) {
            return res.status(400).json({
                message: "Payment reference is required",
            });
        }

        await prisma.payment.create({
            data: {
                orderId: order.id,
                provider: "BAKONG",
                providerPaymentId: md5,
                amount: order.total,
                status: "PENDING",
                qrData: qr,
            },
        });

        return res.status(200).json({
            message: "KHQR generated successfully",
            provider: "BAKONG",
            md5,
            qrImage,
        });
    } catch (error) {
        console.error("Generate KHQR error:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const verifyKHQRPayment = async (req: Request, res: Response) => {
    try {
        const { md5, orderId } = req.body;

        if (typeof md5 !== "string" || md5.trim() === "") {
            return res.status(400).json({
                message: "Payment reference is required",
            });
        }

        if (typeof orderId !== "string" || orderId.trim() === "") {
            return res.status(400).json({
                message: "Order ID is required",
            });
        }

        const payment = await prisma.payment.findFirst({
            where: {
                orderId,
            },
        });

        if (!payment) {
            return res.status(404).json({
                message: "Payment not found",
            });
        }

        if (payment.providerPaymentId !== md5) {
            return res.status(400).json({
                message: "Invalid payment reference",
            });
        }

        let result;
        try {
            result = await settleIfPaid(payment);
        } catch (error) {
            // The provider could not be reached. Keep the customer's page calm and try again on the next check.
            console.error("Payment check error:", error);

            return res.status(200).json({
                message: "Payment is still pending",
                status: "PENDING",
            });
        }

        if (result === "PENDING") {
            return res.status(200).json({
                message: "Payment is still pending",
                status: "PENDING",
            });
        }

        return res.status(200).json({
            message: "Payment completed successfully",
            status: "COMPLETED",
        });
    } catch (error) {
        console.error("Unhandled error:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

/**
 * PayWay calls this when a payment finishes. The body is only used to find the payment;
 * whether it was really paid is always confirmed with PayWay's own check API.
 */
export const paywayCallback = async (req: Request, res: Response) => {
    try {
        const tranId = String(req.body?.tran_id ?? "").trim();

        if (tranId !== "") {
            const payment = await prisma.payment.findFirst({
                where: {
                    provider: "PAYWAY",
                    providerPaymentId: tranId,
                },
            });

            if (payment) {
                await settleIfPaid(payment);
            }
        }

        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error("PayWay callback error:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
};
