import { Request, Response } from "express";
import { asyncHandler } from "../../shared/asyncHandler";
import { BadRequestError } from "../../shared/errors";
import { UserService } from "./user.service";

const userService = new UserService();

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1)
    throw new BadRequestError("ID must be a positive integer");
  return id;
}

export class UserController {
  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = await userService.create(req.body);
    res.status(201).json(user);
  });
  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await userService.login(req.body);
    res.status(200).json(result);
  });
  findAll = asyncHandler(
    async (_req: Request, res: Response): Promise<void> => {
      const users = await userService.findAll();
      res.status(200).json(users);
    },
  );
  findById = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const id = parseId(req.params.id as string);
      const user = await userService.findById(id);
      res.status(200).json(user);
    },
  );
  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseId(req.params.id as string);
    const user = await userService.update(id, req.body);
    res.status(200).json(user);
  });
  remove = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseId(req.params.id as string);
    await userService.remove(id);
    res.status(204).send();
  });
  findUserTasks = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const id = parseId(req.params.id as string);
      const tasks = await userService.findUserTasks(id);
      res.status(200).json(tasks);
    },
  );
}