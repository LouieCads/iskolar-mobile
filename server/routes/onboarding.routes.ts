/**
 * Onboarding routes — post-registration flow for new users.
 *
 * After signup, users must: (1) select a role (student|sponsor), then
 * (2) complete a role-specific profile before accessing main features.
 * The `profile-status` endpoint is polled by the mobile client on launch
 * to determine where to resume an interrupted onboarding session.
 */
import express from "express";
import { selectRole, getProfileStatus, setupStudentProfile, setupSponsorProfile } from "../controllers/onboarding.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = express.Router();

// Role selection 
router.post("/select-role", authenticateToken, selectRole);

// Get profile status 
router.post("/profile-status", authenticateToken, getProfileStatus);

// Profile setup 
router.post("/setup-student-profile", authenticateToken, setupStudentProfile);
router.post("/setup-sponsor-profile", authenticateToken, setupSponsorProfile);


export default router;
