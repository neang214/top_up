import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import type { UserRole } from "../generated/prisma/enums.js";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("FATAL: JWT_SECRET environment variable is missing.");
}

export interface AuthJwtPayload extends JwtPayload {
    userId: string;
    role: UserRole;
}

export const generateToken = (
    payload: Omit<AuthJwtPayload, "iat" | "exp">,
    options?: SignOptions
): string => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: "7d",
        ...options,
    });
};

export const verifyToken = (token: string): AuthJwtPayload => {
    return jwt.verify(token, JWT_SECRET) as AuthJwtPayload;
};