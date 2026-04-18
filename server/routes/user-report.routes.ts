import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import { getUserReport } from "../controllers/user-report.controller";

const router = Router();

router.get("/", authenticateToken as any, getUserReport as any);

export default router;
