import { prisma } from "../../lib/prisma";
import { CreateTaskInput, UpdateTaskInput } from "./task.schema";
import { ForbiddenError, NotFoundError } from "../../shared/errors";

export class TaskService {
  async create(input: CreateTaskInput, userId: number) {
    return prisma.task.create({
      data: {
        title: input.title,
        description: input.description ?? null,
        status: input.status ?? "pending",
        userId,
      },
    });
  }
  async findMyTasks(userId: number) {
    return prisma.task.findMany({ where: { userId } });
  }

  async findAll() {
    return prisma.task.findMany();
  }

  async findById(id: number) {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundError("Task not found");
    return task;
  }

  async update(id: number, input: UpdateTaskInput, userId: number) {
    const task = await this.findById(id);
    if (!task) throw new NotFoundError("Task not found");
    if (task.userId !== userId)
      throw new ForbiddenError(
        "You do not have permission to update this task",
      );
    return prisma.task.update({ where: { id }, data: input });
  }

  async remove(id: number, userId: number) {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundError("Task not found");
    if (task.userId !== userId)
      throw new ForbiddenError(
        "You do not have permission to delete this task",
      );
    await prisma.task.delete({ where: { id } });
  }
}
