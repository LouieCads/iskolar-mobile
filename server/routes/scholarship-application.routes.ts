import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import {
  submitApplication,
  uploadApplicationFiles,
  getMyApplications,
  getApplicationById,
  checkApplicationExists,
  getScholarshipApplications,
  updateApplicationStatus,
  upload,
} from "../controllers/scholarship-application.controller";

const router = Router();

// ==========================================
// Student Routes (authenticated students)
// ==========================================

/**
 * @route   POST /scholarship-application/submit
 * @desc    Submit a new scholarship application
 * @access  Private (Student)
 */
router.post("/submit", authenticateToken, submitApplication);

/**
 * @route   POST /scholarship-application/:application_id/upload-files
 * @desc    Upload files for a custom form field
 * @access  Private (Student - application owner)
 */
router.post(
  "/:application_id/upload-files",
  authenticateToken,
  upload.array("files", 10),
  uploadApplicationFiles
);

/**
 * @route   GET /scholarship-application/my-applications
 * @desc    Get all applications for the current student
 * @access  Private (Student)
 */
router.get("/my-applications", authenticateToken, getMyApplications);

/**
 * @route   GET /scholarship-application/check/:scholarship_id
 * @desc    Check if student has already applied to a scholarship
 * @access  Private (Student)
 */
router.get("/check/:scholarship_id", authenticateToken, checkApplicationExists);

/**
 * @route   GET /scholarship-application/:application_id
 * @desc    Get a specific application by ID
 * @access  Private (Student - application owner)
 */
router.get("/:application_id", authenticateToken, getApplicationById);

// ==========================================
// Sponsor Routes (authenticated sponsors)
// ==========================================

/**
 * @route   GET /scholarship-application/scholarship/:scholarship_id
 * @desc    Get all applications for a specific scholarship
 * @access  Private (Sponsor - scholarship owner)
 */
router.get(
  "/scholarship/:scholarship_id",
  authenticateToken,
  getScholarshipApplications
);

/**
 * @route   PUT /scholarship-application/:application_id/status
 * @desc    Update application status (approve/deny)
 * @access  Private (Sponsor - scholarship owner)
 */
router.put(
  "/:application_id/status",
  authenticateToken,
  updateApplicationStatus
);

export default router;