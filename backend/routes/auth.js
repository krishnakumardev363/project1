import express from "express";
import {
  register,
  verifyOtp,
  resendOtp,
  login,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  getMe,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Registration flow
router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);

// Login
router.post("/login", login);

// Forgot / reset password flow
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);

// Protected
router.get("/me", protect, getMe);

export default router;
