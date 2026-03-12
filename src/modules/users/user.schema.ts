import { z } from 'zod';

export const createUserSchema = z.object({
    body: z.object({
        name: z.string().min(1).max(100),
        email: z.email().max(255),
        password: z.string().min(6),
    }),
})

export const loginSchema = z.object({
    body: z.object({
        email: z.email(),
        password: z.string().min(1),
    })
})

export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];