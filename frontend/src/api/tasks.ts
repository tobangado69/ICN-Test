import type { Task, CreateTaskInput, UpdateTaskInput } from "../types/task";
import { api } from "./client";

export async function getMyTasks(): Promise<Task[]> {
  return api<Task[]>("/tasks/my-tasks");
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  return api<Task>("/tasks", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateTask(id: number, input: UpdateTaskInput): Promise<Task> {
  return api<Task>(`/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteTask(id: number): Promise<void> {
  await api(`/tasks/${id}`, { method: "DELETE" });
}
