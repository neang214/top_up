import prisma from "../../utils/db.js";
import type { Request, Response } from "express";
import { createPayment, isPaid, qrToImage } from "./service.js";
import { processTopUp } from ".././topups/service.js";


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
                    md5: existingPayment.providerPaymentId,
                    qrImage,
                });
            }
        }

        const amount = Number(order.total);

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

        if (payment.status === "COMPLETED") {
            return res.status(200).json({
                message: "Payment already completed",
                status: "COMPLETED",
            });
        }

        const paymentStatus = await isPaid(md5);

        if (!paymentStatus) {
            return res.status(200).json({
                message: "Payment is still pending",
                status: "PENDING",
            });
        }

        await prisma.$transaction([
            prisma.payment.update({
                where: {
                    id: payment.id,
                },
                data: {
                    status: "COMPLETED",
                    paidAt: new Date(),
                },
            }),

            prisma.order.update({
                where: {
                    id: orderId,
                },
                data: {
                    status: "PAID",
                    paidAt: new Date(),
                },
            }),

            prisma.topUp.update({
                where: {
                    orderId,
                },
                data: {
                    status: "PROCESSING",
                },
            }),
        ]);

        await processTopUp(orderId);

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
