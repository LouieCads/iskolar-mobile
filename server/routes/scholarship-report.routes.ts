import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import { getScholarshipReport } from "../controllers/scholarship-report.controller";

const router = Router();

router.get("/", authenticateToken as any, getScholarshipReport as any);

export default router;
