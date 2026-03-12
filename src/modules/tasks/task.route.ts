import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { createTaskSchema, updateTaskSchema } from "./task.schema";
import { TaskController } from "./task.controller";

const router = Router();
const taskController = new TaskController();

router.get("/my-tasks", authenticate, taskController.findMyTasks);
router.post("/", authenticate, validate(createTaskSchema), taskController.create);
router.get("/", taskController.findAll);
router.get("/:id", taskController.findById);
router.put("/:id", authenticate, validate(updateTaskSchema), taskController.update);
router.delete("/:id", authenticate, taskController.remove);

export default router;