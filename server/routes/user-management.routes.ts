import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import { getUsers, getUserById } from "../controllers/user-management.controller";

const router = Router();

// All routes require authentication (admin-only enforced in controller)
router.get("/", authenticateToken as any, getUsers as any);
router.get("/:userId", authenticateToken as any, getUserById as any);

export default router;
