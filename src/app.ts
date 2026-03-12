import express from "express";
import cors from "cors";
import { requestLogger } from "./middleware/requestLogger";
import { errorHandler } from "./middleware/errorHandler";
import userRoutes from "./modules/users/user.routes";
import taskRoutes from "./modules/tasks/task.route";

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.use("/users", userRoutes);
app.use("/tasks", taskRoutes);

app.use(errorHandler);

export default app;