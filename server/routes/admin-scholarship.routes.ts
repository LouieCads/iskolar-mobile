import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import {
  getAdminScholarships,
  getAdminScholarshipById,
  updateScholarshipStatus,
} from "../controllers/admin-scholarship.controller";

const router = Router();

router.get("/", authenticateToken as any, getAdminScholarships as any);
router.get("/:scholarshipId", authenticateToken as any, getAdminScholarshipById as any);
router.patch("/:scholarshipId/status", authenticateToken as any, updateScholarshipStatus as any);

export default router;
