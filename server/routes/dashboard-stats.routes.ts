import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import { getDashboardStats } from "../controllers/dashboard-stats.controller";

const router = Router();

router.get("/", authenticateToken as any, getDashboardStats as any);

export default router;
