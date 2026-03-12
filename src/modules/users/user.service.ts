import { prisma } from "../../lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../../shared/errors";
import { environment } from "../../config/environment";
import type { CreateUserInput, LoginInput } from "./user.schema";
import type { UserPublic } from "./user.types";

function toPublic(user: {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}): UserPublic {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export class UserService {
  async create(input: CreateUserInput): Promise<UserPublic> {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) throw new ConflictError("Email already registered");
    const hashedPassword = await bcrypt.hash(input.password, 10);
    const user = await prisma.user.create({
      data: { name: input.name, email: input.email, password: hashedPassword },
    });
    return toPublic(user);
  }

  async login(input: LoginInput): Promise<{ token: string; user: UserPublic }> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (!user || !(await bcrypt.compare(input.password, user.password))) {
      throw new UnauthorizedError("Invalid email or password");
    }
    const token = jwt.sign({ sub: user.id }, environment.JWT_SECRET, {
      expiresIn: environment.JWT_EXPIRES_IN,
    } as jwt.SignOptions);
    return { token, user: toPublic(user) };
  }

  async findAll(): Promise<UserPublic[]> {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findById(id: number): Promise<UserPublic> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError("User not found");
    return toPublic(user);
  }

  async update(
    id: number,
    data: { name?: string; email?: string; password?: string },
  ): Promise<UserPublic> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError("User not found");
    const updateData: { name?: string; email?: string; password?: string } = {
      ...data,
    };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }
    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
    });
    return toPublic(updated);
  }

  async remove(id: number): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError("User not found");
    await prisma.user.delete({ where: { id } });
  }

  async findUserTasks(id: number): Promise<Awaited<ReturnType<typeof prisma.task.findMany>>> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError("User not found");
    return prisma.task.findMany({ where: { userId: id } });
  }
}
