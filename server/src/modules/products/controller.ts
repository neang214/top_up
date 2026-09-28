import type { Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client.js";
import prisma from "../../utils/db.js";

export const getProducts = async (req: Request, res: Response) => {
    try {
        const { gameId } = req.params;

        if (typeof gameId !== "string" || gameId.trim() === "") {
            return res.status(400).json({
                message: "Invalid or missing game ID",
            });
        }

        const game = await prisma.game.findUnique({
            where: {
                id: gameId,
            },
            select: {
                id: true,
                isActive: true,
            },
        });

        if (!game) {
            return res.status(404).json({
                message: "Game not found",
            });
        }

        if (!game.isActive) {
            return res.status(404).json({
                message: "Game is inactive",
            });
        }

        const products = await prisma.product.findMany({
            where: {
                gameId,
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                amount: true,
                price: true,
            },
            orderBy: {
                amount: "asc",
            },
        });

        return res.status(200).json(products);
    } catch (error) {
        console.error("Get products error:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const createProduct = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { name, amount, price, imageUrl } = req.body;
        const { gameId } = req.params;

        if (typeof gameId !== "string" || gameId.trim() === "") {
            return res.status(400).json({
                message: "Invalid or missing game ID",
            });
        }

        if (
            typeof name !== "string" ||
            typeof amount !== "number" ||
            typeof price !== "number"
        ) {
            return res.status(400).json({
                message: "Name, amount, and price are required",
            });
        }

        if (
            name.trim() === "" ||
            (imageUrl !== undefined &&
                imageUrl !== null &&
                typeof imageUrl !== "string")
        ) {
            return res.status(400).json({
                message: "Name and image URL must be a string",
            });
        }

        if (amount <= 0 || price <= 0) {
            return res.status(400).json({
                message: "Amount and price must be greater than 0",
            });
        }

        const product = await prisma.product.create({
            data: {
                gameId,
                name: name.trim(),
                price,
                amount,
                imageUrl
            },
        });

        return res.status(201).json({
            message: "Product created successfully",
            product,
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2003") {
                return res.status(404).json({
                    message: "Game not found",
                });
            }
        }

        console.error("Error:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const { name, amount, price, imageUrl } = req.body;
        const { productId } = req.params;

        if (typeof productId !== "string") {
            return res
                .status(400)
                .json({ message: "Invalid or missing ID parameter" });
        }

        if (!name || amount === undefined || price === undefined) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (amount <= 0 || price <= 0) {
            return res.status(400).json({
                message: "Amount and price must be greater than 0",
            });
        }

        const product = await prisma.product.update({
            where: { id: productId },
            data: {
                name: name.trim(),
                amount,
                price,
                imageUrl
            },
        });

        return res.status(200).json({
            message: "Product updated succesfull",
            product,
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            const code = (error as { code: string }).code;

            if (code === "P2025") {
                return res.status(404).json({ message: "Product not found" });
            }
        }

        console.error("Unhandled error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const toggleProduct = async (req: Request, res: Response) => {
    try {
        const { productId } = req.params;
        const { isActive } = req.body;

        if (typeof productId !== "string") {
            return res
                .status(400)
                .json({ message: "Invalid or missing ID parameter" });
        }

        if (typeof isActive !== "boolean") {
            return res
                .status(400)
                .json({ message: "isActive must be a boolean" });
        }

        const product = await prisma.product.update({
            where: { id: productId },
            data: { isActive },
        });

        return res.status(200).json({
            message: "Product updated succesfull",
            product,
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            const code = (error as { code: string }).code;

            if (code === "P2025") {
                return res.status(404).json({ message: "Product not found" });
            }
        }

        console.error("Unhandled error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
