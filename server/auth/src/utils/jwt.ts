import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface TokenPayload {
    sub: string,
    email: string,
}

export function signToken(payLoad: TokenPayload): string {
    return jwt.sign(payLoad, env.jwtSecret, { expiresIn: env.jwtExpiresIn as any });
}

export function verifyToken(token: string): TokenPayload {
    return jwt.verify(token, env.jwtSecret) as TokenPayload;
}
