export type TaskStatus = "pending" | "in_progress" | "completed";

export interface Task {
    id: number;
    title:string;
    description: string | null;
    status: TaskStatus;
    userId: number;
    createdAt: Date;
    updatedAt: Date;
}