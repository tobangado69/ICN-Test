import { Router } from "express";
import { validate } from "../../middleware/validate";
import { createUserSchema, loginSchema } from "./user.schema";
import { UserController } from "./user.controller";

const router = Router();
const userController = new UserController();

router.post("/", validate(createUserSchema), userController.create);
router.post("/login", validate(loginSchema), userController.login);
router.get("/", userController.findAll);
router.get("/:id/tasks", userController.findUserTasks);
router.get("/:id", userController.findById);
router.put("/:id", userController.update);
router.delete("/:id", userController.remove);

export default router;