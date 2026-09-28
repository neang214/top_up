import crypto from "node:crypto";
import { Prisma } from "../../generated/prisma/client.js";
import type { Request, Response } from "express";
import prisma from "../../utils/db.js";
import { verifyToken } from "../../utils/jwt.js";

const getOptionalUserId = async (
    req: Request
): Promise<string | null> => {
    const token = req.cookies?.token;

    if (!token) {
        return null;
    }

    try {
        const { userId } = verifyToken(token);

        const user = await prisma.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                id: true,
            },
        });

        return user?.id ?? null;
    } catch {
        return null;
    }
};

export const createOrder = async (req: Request, res: Response) => {
    try {
        const { productId, playerId, zoneId } = req.body;

        const userId = await getOptionalUserId(req);

        if (
            typeof productId !== "string" ||
            productId.trim() === ""
        ) {
            return res.status(400).json({
                message: "Product ID is required",
            });
        }

        if (
            typeof playerId !== "string" ||
            playerId.trim() === ""
        ) {
            return res.status(400).json({
                message: "Player ID is required",
            });
        }

        if (
            zoneId !== undefined &&
            zoneId !== null &&
            typeof zoneId !== "string"
        ) {
            return res.status(400).json({
                message: "Zone ID must be a string",
            });
        }

        const product = await prisma.product.findUnique({
            where: {
                id: productId,
            },
            select: {
                id: true,
                name: true,
                price: true,
                isActive: true,
                game: {
                    select: {
                        isActive: true,
                    },
                },
            },
        });

        if (
            !product ||
            !product.isActive ||
            !product.game.isActive
        ) {
            return res.status(404).json({
                message: "Product not found or inactive",
            });
        }

        const orderNumber = `TOP-${Date.now()}-${crypto
            .randomBytes(3)
            .toString("hex")
            .toUpperCase()}`;

        const order = await prisma.order.create({
            data: {
                userId,
                orderNumber,
                total: product.price,
                currency: "USD",

                items: {
                    create: {
                        productId: product.id,
                        productName: product.name,
                        quantity: 1,
                        unitPrice: product.price,
                        totalPrice: product.price,
                    },
                },

                topUp: {
                    create: {
                        playerId: playerId.trim(),
                        zoneId:
                            typeof zoneId === "string" &&
                            zoneId.trim() !== ""
                                ? zoneId.trim()
                                : null,
                    },
                },
            },

            include: {
                items: true,
                topUp: true,
            },
        });

        return res.status(201).json({
            message: "Order created successfully",
            order,
        });
        
    } catch (error) {
        console.error("Unhandled error creating order:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const getOrder = async (
    req: Request,
    res: Response
) => {
    try {
        const { id } = req.params;

        if (
            typeof id !== "string" ||
            id.trim() === ""
        ) {
            return res.status(400).json({
                message: "Order ID is required",
            });
        }

        const order = await prisma.order.findUnique({
            where: {
                id,
            },
            include: {
                items: true,
                topUp: true,
                payment: {
                    select: {
                        status: true,
                        paidAt: true,
                    },
                },
            },
        });

        if (!order) {
            return res.status(404).json({
                message: "Order not found",
            });
        }

        return res.status(200).json(order);
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2023"
        ) {
            return res.status(400).json({
                message: "Invalid order ID",
            });
        }

        console.error("Unhandled error:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const getMyOrders = async (
    req: Request,
    res: Response
) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        const orders = await prisma.order.findMany({
            where: {
                userId,
            },
            include: {
                items: true,
                topUp: true,
                payment: {
                    select: {
                        status: true,
                        paidAt: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return res.status(200).json(orders);
    } catch (error) {
        console.error("Unhandled error:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const getOrders = async (
    req: Request,
    res: Response
) => {
    try {
        const orders = await prisma.order.findMany({
            include: {
                items: true,
                topUp: true,
                payment: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return res.status(200).json(orders);
    } catch (error) {
        console.error("Unhandled error:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
};