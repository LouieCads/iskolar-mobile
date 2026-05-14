/**
 * Admin scholarship routes — read and moderate all scholarships across sponsors.
 *
 * Exposes list, detail, and status-patch endpoints for the admin web dashboard.
 * Admin-only access is enforced inside the controller by checking req.user.role.
 */
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
