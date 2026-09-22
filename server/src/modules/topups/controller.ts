import type { Request, Response } from "express";
import prisma from "../../utils/db.js";
import * as services from './service.js'


export const getUserTopUps = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        const topUps = await prisma.topUp.findMany({
            where: {
                order: {
                    userId
                }
            },
            include: {
                order: true
            },
            orderBy: {
                order: {
                    createdAt: "desc"
                }
            }
        });

        return res.status(200).json(topUps);

    } catch (error) {
        console.error("Unhandled error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

export const getTopUps = async (req: Request, res: Response) => {
    try {
        const topUps = await prisma.topUp.findMany({
            include: {
                order: true
            },
            orderBy: {
                order: {
                    createdAt: "desc"
                }
            }
        });

        return res.status(200).json(topUps);

    } catch (error) {
        console.error("Unhandled error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};