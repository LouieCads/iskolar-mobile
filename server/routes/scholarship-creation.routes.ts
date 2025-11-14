import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import { 
  createScholarship, 
  uploadScholarshipImage, 
  getAllScholarships,
  getSponsorScholarships,
  getScholarshipById,
  updateScholarship,
  deleteScholarship,
  archiveScholarship,
  upload 
} from "../controllers/scholarship-creation.controller";

const router = Router();

// Get all scholarships (public endpoint)
router.get("/", getAllScholarships);

// Get sponsor's scholarships
router.get("/my-scholarships", authenticateToken, getSponsorScholarships);

// Get single scholarship (public)
router.get("/:scholarship_id", getScholarshipById);

// Create scholarship 
router.post("/create", authenticateToken, createScholarship);

// Update scholarship (sponsor-only)
router.put("/:scholarship_id", authenticateToken, updateScholarship);

// Archive scholarship (sponsor-only, only when deadline passed)
router.post("/:scholarship_id/archive", authenticateToken, archiveScholarship);

// Delete scholarship (sponsor-only, only before deadline)
router.delete("/:scholarship_id", authenticateToken, deleteScholarship);

// Upload scholarship image 
router.post("/:scholarship_id/image", authenticateToken, upload.single('image'), uploadScholarshipImage);

export default router;