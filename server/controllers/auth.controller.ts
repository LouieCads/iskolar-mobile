import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import User from "../models/Users";
import { normalizeEmail, isValidEmail, sanitizeString, isValidPassword, isValidOTP, normalizeOTP, enforceMaxLength, isSafeInput } from "../utils/validation";
import { ok, created, badRequest, notFound, serverError } from "../utils/responses";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}
const otpStore: Map<string, { otp: string; expiresAt: Date; verified: boolean }> = new Map(); // Temporary storage

const PASSWORD_PATTERNS = {
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /[0-9]/,
  special: /[@$!%*?&]/,
};

export const register = async (req: Request, res: Response) => {
  try {
    const rawEmail = enforceMaxLength(String(req.body?.email ?? ""), 254);
    const email = normalizeEmail(rawEmail);
    const password = String(req.body?.password ?? "");
    const confirmPassword = String(req.body?.confirmPassword ?? "");

    if (!email || !password || !confirmPassword) {
      return badRequest(res, "All fields are required");
    }
    if (!isValidEmail(email)) {
      return badRequest(res, "Invalid email format");
    }

    if (password !== confirmPassword) {
      return badRequest(res, "Passwords do not match");
    }
    if (!isValidPassword(password)) {
      return badRequest(res, "Password does not meet complexity requirements");
    }

    if (!isSafeInput(email)) {
      return badRequest(res, "Invalid characters in email");
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return badRequest(res, "Email already registered");
    }

    // Hash password 
    const hashedPassword = await bcrypt.hash(password, 15);
    const newUser = await User.create({ email, password: hashedPassword });

    return created(res, "Account created successfully!", { 
      user: { 
        id: newUser.user_id, 
        email: newUser.email 
      } 
    });
  } catch (error) {
    console.error("Registration error:", error);
    return serverError(res, "Error registering user. Please try again later.");
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const rawEmail = enforceMaxLength(String(req.body?.email ?? ""), 254);
    const email = normalizeEmail(rawEmail);
    const password = String(req.body?.password ?? "");
    const rememberMe = Boolean(req.body?.rememberMe);

    if (!email || !password) {
      return badRequest(res, "Email and password required");
    }
    if (!isValidEmail(email) || !isSafeInput(email)) {
      return badRequest(res, "Invalid email format");
    }
    if (password.length > 128) {
      return badRequest(res, "Invalid credentials");
    }

    const user = await User.findOne({ where: { email } });
    if (!user) return badRequest(res, "Invalid email or password");

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return badRequest(res, "Invalid email or password");

    const expiresIn = rememberMe ? "30d" : "1d";

    // Generate JWT
    const token = jwt.sign({ 
      id: user.user_id, 
      email: user.email,
    }, 
    JWT_SECRET, 
    { expiresIn });

    const expiresInMs = rememberMe 
      ? 30 * 24 * 60 * 60 * 1000  // 30 days in milliseconds
      : 24 * 60 * 60 * 1000;       // 1 day in milliseconds
    
    const expiryTimestamp = Date.now() + expiresInMs;

    return ok(res, "Login successful!", {
      token,
      expiresAt: expiryTimestamp,
      user: { id: user.user_id, email: user.email },
    });
  } catch (error) {
    console.error("Login error:", error);
    return serverError(res, "Error logging in. Please try again later.");
  }
};

// Send OTP 
export const sendOTP = async (req: Request, res: Response) => {
  try {
    const rawEmail = enforceMaxLength(String(req.body?.email ?? ""), 254);
    const email = normalizeEmail(sanitizeString(rawEmail, { max: 254 }));
    if (!email) return badRequest(res, "Email is required");
    if (!isValidEmail(email) || !isSafeInput(email)) {
      return badRequest(res, "Invalid email format");
    }

    const user = await User.findOne({ where: { email } });
    if (!user) return notFound(res, "Email not found. Please create an account");

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    otpStore.set(email.toLowerCase(), {
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // expires in 5 mins
      verified: false,
    });

    const transporter = nodemailer.createTransport({
      service: "gmail", 
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Send OTP 
    await transporter.sendMail({
      from: `"iSkolar" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Code - iSkolar Password Reset",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3A52A6;">Password Reset Request</h2>
          <p>You have requested to reset your password. Please use the following OTP code:</p>
          <div style="background-color: #f0f7ff; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #3A52A6; letter-spacing: 5px; margin: 0;">${otp}</h1>
          </div>
          <p style="color: #666;">This code will expire in 5 minutes.</p>
          <p style="color: #666; font-size: 12px;">If you did not request this, please ignore this email.</p>
        </div>
      `,
    });

    return ok(res, "OTP sent successfully to your email");
  } catch (error) {
    console.error("Error sending OTP:", error);
    return serverError(res, "Error sending OTP. Please try again later.");
  }
};

// Verify OTP
export const verifyOTP = (req: Request, res: Response) => {
  try {
    const rawEmail = enforceMaxLength(String(req.body?.email ?? ""), 254);
    const email = normalizeEmail(sanitizeString(rawEmail, { max: 254 }));
    const otp = normalizeOTP(req.body?.otp);

    if (!email || !otp) {
      return badRequest(res, "Email and OTP are required");
    }
    if (!isValidEmail(email) || !isSafeInput(email)) {
      return badRequest(res, "Invalid email format");
    }
    if (!isValidOTP(otp)) {
      return badRequest(res, "Invalid OTP. Please try again.");
    }

    const otpData = otpStore.get(email.toLowerCase());
    if (!otpData) return badRequest(res, "No OTP found for this email. Please request a new one.");

    if (otpData.expiresAt < new Date()) {
      otpStore.delete(email.toLowerCase());
      return badRequest(res, "OTP has expired. Please request a new one.");
    }

    if (otpData.otp !== otp) {
      return badRequest(res, "Invalid OTP. Please try again.");
    }

    otpData.verified = true;
    otpStore.set(email.toLowerCase(), otpData);

    return ok(res, "OTP verified successfully");
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return serverError(res, "Error verifying OTP. Please try again later.");
  }
};

// Reset Password
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const rawEmail = enforceMaxLength(String(req.body?.email ?? ""), 254);
    const email = normalizeEmail(sanitizeString(rawEmail, { max: 254 }));
    const password = String(req.body?.password ?? "");
    const confirmPassword = String(req.body?.confirmPassword ?? "");

    if (!email || !password || !confirmPassword) {
      return badRequest(res, "All fields are required");
    }
    if (!isValidEmail(email) || !isSafeInput(email)) {
      return badRequest(res, "Invalid email format");
    }

    if (password !== confirmPassword) {
      return badRequest(res, "Passwords do not match");
    }
    if (!isValidPassword(password)) {
      return badRequest(res, "Password does not meet complexity requirements");
    }

    // Check if OTP was verified
    const otpData = otpStore.get(email.toLowerCase());
    if (!otpData || !otpData.verified) {
      return badRequest(res, "OTP not verified. Please verify OTP first.");
    }

    const user = await User.findOne({ where: { email } });
    if (!user) return notFound(res, "User not found");

    const hashedPassword = await bcrypt.hash(password, 15);
    user.password = hashedPassword;
    await user.save();

    // Remove from OTP store
    otpStore.delete(email.toLowerCase());

    return ok(res, "Password reset successful! Please login");
  } catch (error) {
    console.error("Error resetting password:", error);
    return serverError(res, "Error resetting password. Please try again later.");
  }
};