/// <reference path="../types/express.d.ts" />
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { UnauthorizedError } from '../shared/errors';
import { environment } from '../config/environment';

export const authenticate: RequestHandler = (req: Request, _res: Response, next: NextFunction): void => {
    const auth = req.headers.authorization;
    if(!auth || !auth.startsWith('Bearer ')){
        next(new UnauthorizedError("Missing or invalid token"));
        return;
    }
    const token = auth.slice(7);
    try {
        const decoded = jwt.verify(token, environment.JWT_SECRET);

        if (typeof decoded !== 'object' || decoded === null) {
            throw new UnauthorizedError("Invalid token payload");
        }

        const payload = decoded as JwtPayload;
        const sub = payload.sub;

        if (sub === undefined) {
            throw new UnauthorizedError("Invalid token payload");
        }

        const id = typeof sub === 'string' ? Number(sub) : sub;
        if (!Number.isInteger(id) || id < 1) {
            throw new UnauthorizedError("Invalid token payload");
        }

        req.user = { id };
        next();
    } catch {
        next(new UnauthorizedError("Invalid or expired token"))
    }
}