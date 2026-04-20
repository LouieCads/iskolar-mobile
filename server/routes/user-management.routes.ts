import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import { getUsers, getUserById, updateUserStatus, triggerAutoDeactivate } from "../controllers/user-management.controller";

const router = Router();

// All routes require authentication (admin-only enforced in controller)
router.get("/", authenticateToken as any, getUsers as any);
router.get("/:userId", authenticateToken as any, getUserById as any);
router.patch("/:userId/status", authenticateToken as any, updateUserStatus as any);
router.post("/trigger-auto-deactivate", authenticateToken as any, triggerAutoDeactivate as any);

export default router;