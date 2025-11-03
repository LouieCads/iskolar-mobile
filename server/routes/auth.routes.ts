import { Router } from "express";
import { register, login, sendOTP, verifyOTP, resetPassword } from "../controllers/auth.controller";
import { rateLimit } from "../middlewares/rateLimit.middleware";

const router = Router();

// Registration & Login
router.post(
  "/register",
  rateLimit({ windowMs: 5 * 60 * 1000, max: 20 }),
  register
);
router.post(
  "/login",
  rateLimit({ windowMs: 2 * 60 * 1000, max: 15 }),
  login
);

// Forgot Password 
router.post(
  "/send-otp",
  rateLimit({ windowMs: 5 * 60 * 1000, max: 5 }),
  sendOTP
);
router.post(
  "/verify-otp",
  rateLimit({ windowMs: 5 * 60 * 1000, max: 8 }),
  verifyOTP
);
router.post(
  "/reset-password",
  rateLimit({ windowMs: 5 * 60 * 1000, max: 8 }),
  resetPassword
);

export default router;
