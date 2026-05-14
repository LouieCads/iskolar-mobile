/**
 * Profile routes — CRUD for the authenticated user's profile.
 *
 * Profile pictures are stored in Azure Blob Storage; the `upload` multer
 * instance in the controller handles the multipart/form-data parsing.
 */
import express from "express";
import { getProfile, uploadProfilePicture, deleteProfilePicture, updateProfile, upload } from "../controllers/profile.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = express.Router();

// Get user profile
router.get("/profile", authenticateToken, getProfile);

// Update profile
router.put("/profile", authenticateToken, updateProfile);

// Upload profile picture
router.post("/profile/picture", authenticateToken, upload.single('profilePicture'), uploadProfilePicture);

// Delete profile picture
router.delete("/profile/picture", authenticateToken, deleteProfilePicture);

export default router;
