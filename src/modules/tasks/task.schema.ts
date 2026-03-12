import { z } from "zod";

export const TASK_STATUSES = ["pending", "in_progress", "completed"] as const;

export const createTaskSchema = z.object({
    body: z.object({
        title: z.string().min(1).max(200),
        description: z.string().optional(),
        status: z.enum(TASK_STATUSES).default("pending"),
    }),
})

export const updateTaskSchema = z.object({
    body: z.object({
        title: z.string().min(1).max(200).optional(),
        description: z.string().optional(),
        status: z.enum(TASK_STATUSES).optional(),
    }),
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>["body"];
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>["body"];