import { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger";


export class AppError extends Error {
    statusCode: number;

    constructor(message:string, statusCode = 400) {
        super(message);
        this.statusCode = statusCode
    }
}

export function errorMiddleware(
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
) {
    if ( err instanceof AppError ) {
        return res.status(err.statusCode).json({ error: err.message });
    }

    logger.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor'})
}
