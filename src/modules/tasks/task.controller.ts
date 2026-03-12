import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/asyncHandler";
import { BadRequestError } from "../../shared/errors";
import { TaskService } from "./task.service";

const taskService = new TaskService();

function parseId(raw: string): number {
    const id = Number(raw);
    if(!Number.isInteger(id) || id < 1) throw new BadRequestError("ID must be a positive integer");
    return id;
}

export class TaskController {
    create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const task = await taskService.create(req.body, req.user!.id);
        res.status(201).json(task);
    });

    findMyTasks = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const tasks = await taskService.findMyTasks(req.user!.id);
        res.status(200).json(tasks);
    });
    
    findAll = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
        const tasks = await taskService.findAll();
        res.status(200).json(tasks);
    });

    findById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const id = parseId(req.params.id as string);
        const task = await taskService.findById(id);
        res.status(200).json(task);
    });
    update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const id = parseId(req.params.id as string);
        const task = await taskService.update(id, req.body, req.user!.id);
        res.status(200).json(task);
    });
    remove = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const id = parseId(req.params.id as string);
        await taskService.remove(id, req.user!.id);
        res.status(204).send();
    });
}