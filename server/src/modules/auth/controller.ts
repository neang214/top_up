import prisma from "../../utils/db.js";
import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { generateToken } from "../../utils/jwt.js";

export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;

        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            name.trim() === "" ||
            email.trim() === "" ||
            password.trim() === ""
        ) {
            return res.status(400).json({
                message: "Name, email, and password are required"
            });
        }

        const existingUser = await prisma.user.findUnique({
            where: {
                email: email.trim().toLowerCase()
            }
        });

        if (existingUser) {
            return res.status(409).json({
                message: "User already exists"
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name: name.trim(),
                email: email.trim().toLowerCase(),
                password: passwordHash
            }
        });

        const token = generateToken({
            userId: user.id,
            role: user.role
        });

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(201).json({
            message: "User created successfully",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Register Error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            email.trim() === "" ||
            password.trim() === ""
        ) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await prisma.user.findUnique({
            where: {
                email: email.trim().toLowerCase()
            }
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = generateToken({
            userId: user.id,
            role: user.role
        });

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            message: "Login successful",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login Error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

export const checkAuth = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        const user = await prisma.user.findUnique({
            where: {
                id: userId
            },
            omit: {
                password: true
            }
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json(user);

    } catch (error) {
        console.error("Check Auth Error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

export const logOut = async (req: Request, res: Response) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/"
        });

        return res.status(200).json({
            message: "Logout successful"
        });

    } catch (error) {
        console.error("Logout Error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};
