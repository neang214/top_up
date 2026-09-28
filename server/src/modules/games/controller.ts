import type { Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client.js";
import prisma from "../../utils/db.js";

export const getGames = async (req: Request, res: Response) => {
    try {
        const game = await prisma.game.findMany();
        return res.status(200).json(game);
    } catch (error) {
        console.log("Error: " + error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const createGame = async (req: Request, res: Response) => {
    try {
        const { name, slug, imageUrl } = req.body;

        if (!name || !slug) {
            console.log(name, slug);
            return res
                .status(400)
                .json({ message: "name and slug are require" });
        }

        if (
            imageUrl !== undefined &&
            imageUrl !== null &&
            typeof imageUrl !== "string"
        ) {
            return res.status(400).json({
                message: "Image URL must be a string",
            });
        }

        const game = await prisma.game.create({
            data: {
                name: name.trim(),
                slug: slug.trim(),
                imageUrl
            },
        });

        res.status(201).json({
            message: "Game created succesfull",
            game,
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2002") {
                return res.status(400).json({
                    messsage:
                        "Unique constraint failed on the fields: (`slug`)",
                });
            }
        }
        console.log("Error: " + error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const updateGame = async (req: Request, res: Response) => {
    try {
        const { name, slug, imageUrl } = req.body;
        const { gameId } = req.params;

        if (typeof gameId !== "string") {
            return res.status(404).json({ message: "Invalide game ID" });
        }

        if (!name || !slug) {
            return res
                .status(400)
                .json({ message: "name and slug are require" });
        }

        if (
            imageUrl !== undefined &&
            imageUrl !== null &&
            typeof imageUrl !== "string"
        ) {
            return res.status(400).json({
                message: "Image URL must be a string",
            });
        }

        const game = await prisma.game.update({
            where: { id: gameId },
            data: {
                name: name.trim(),
                slug: slug.trim(),
                imageUrl
            },
        });

        res.status(200).json({
            message: "Game update succesfull",
            game,
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            const code = (error as { code: string }).code;

            if (code === "P2025") {
                return res.status(404).json({ message: "Game not found" });
            }
        }

        console.error("Unhandled error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const toggleGame = async (req: Request, res: Response) => {
    try {
        const { isActive } = req.body;
        const id = req.params.gameId;

        if (typeof id !== "string") {
            return res
                .status(400)
                .json({ message: "Invalid or missing ID parameter" });
        }

        if (typeof isActive !== "boolean") {
            return res
                .status(400)
                .json({ message: "isActive must be a boolean" });
        }

        const game = await prisma.game.update({
            where: { id },
            data: { isActive },
        });

        return res.status(200).json({
            message: "Game updated succesfull",
            game,
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            const code = (error as { code: string }).code;

            if (code === "P2025") {
                return res.status(404).json({ message: "Game not found" });
            }
        }

        console.error("Unhandled error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
