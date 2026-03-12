import type { Request, Response, NextFunction} from 'express';
import { AppError, ValidationError } from '../shared/errors';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void{
    if( err instanceof ValidationError){
        res.status(400).json({ error: err.message, details: err.validationDetails})
        return;
    }
    if( err instanceof AppError){
        res.status(err.statusCode).json({ error: err.message })
        return;
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
}