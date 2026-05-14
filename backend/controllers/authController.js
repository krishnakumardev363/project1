import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Otp from "../models/Otp.js";
import { sendOTPEmail } from "../utils/email.js";

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const OTP_EXPIRES_MS = () =>
  (Number(process.env.OTP_EXPIRES_MINUTES) || 10) * 60 * 1000;

// ─── STEP 1: Register — send OTP ─────────────────────────────────────────────
// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    // Block if already verified
    const existing = await User.findOne({ email });
    if (existing && existing.isVerified)
      return res.status(409).json({ message: "Email already in use" });

    // Create/update unverified user (allow re-registration if not yet verified)
    if (!existing) {
      await User.create({ name, email, password, isVerified: false });
    } else {
      existing.name = name;
      existing.password = password; // will be re-hashed by pre-save hook
      await existing.save();
    }

    // Delete any existing OTP for this email
    await Otp.deleteMany({ email, type: "verify_email" });

    const { otp, otpHash } = Otp.generate();
    await Otp.create({
      email,
      otpHash,
      type: "verify_email",
      pendingName: name,
      expiresAt: new Date(Date.now() + OTP_EXPIRES_MS()),
    });

    await sendOTPEmail({ to: email, name, otp, type: "verify" });

    res.status(200).json({ message: "OTP sent to your email", email });
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    console.error(err);
    res.status(500).json({ message: "Registration failed" });
  }
};

// ─── STEP 2: Verify OTP → activate account ───────────────────────────────────
// POST /api/auth/verify-otp
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: "Email and OTP are required" });

    const record = await Otp.findOne({ email, type: "verify_email" });
    if (!record)
      return res.status(400).json({ message: "OTP not found or expired. Please register again." });

    if (record.expiresAt < new Date())
      return res.status(400).json({ message: "OTP has expired. Please register again." });

    // Limit brute-force
    if (record.attempts >= 5) {
      await record.deleteOne();
      return res.status(429).json({ message: "Too many attempts. Please register again." });
    }

    if (!Otp.verify(otp, record.otpHash)) {
      record.attempts += 1;
      await record.save();
      return res.status(400).json({
        message: `Invalid OTP. ${5 - record.attempts} attempts remaining.`,
      });
    }

    // Activate user
    const user = await User.findOneAndUpdate(
      { email },
      { isVerified: true },
      { new: true }
    );
    await record.deleteOne();

    const token = signToken(user._id);
    res.json({
      message: "Email verified! Welcome aboard.",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Verification failed" });
  }
};

// ─── Resend OTP ───────────────────────────────────────────────────────────────
// POST /api/auth/resend-otp
export const resendOtp = async (req, res) => {
  try {
    const { email, type = "verify_email" } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "No account found for this email" });

    if (type === "verify_email" && user.isVerified)
      return res.status(400).json({ message: "Email already verified" });

    await Otp.deleteMany({ email, type });

    const { otp, otpHash } = Otp.generate();
    await Otp.create({
      email,
      otpHash,
      type,
      expiresAt: new Date(Date.now() + OTP_EXPIRES_MS()),
    });

    await sendOTPEmail({
      to: email,
      name: user.name,
      otp,
      type: type === "reset_password" ? "reset" : "verify",
    });

    res.json({ message: "OTP resent to your email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to resend OTP" });
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: "Invalid email or password" });

    if (!user.isVerified)
      return res.status(403).json({
        message: "Email not verified. Please verify your email first.",
        needsVerification: true,
        email,
      });

    const token = signToken(user._id);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed" });
  }
};

// ─── Forgot Password — send OTP ───────────────────────────────────────────────
// POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    // Always return 200 to prevent email enumeration
    if (!user || !user.isVerified) {
      return res.json({ message: "If that email exists, an OTP has been sent." });
    }

    await Otp.deleteMany({ email, type: "reset_password" });

    const { otp, otpHash } = Otp.generate();
    await Otp.create({
      email,
      otpHash,
      type: "reset_password",
      expiresAt: new Date(Date.now() + OTP_EXPIRES_MS()),
    });

    await sendOTPEmail({ to: email, name: user.name, otp, type: "reset" });

    res.json({ message: "If that email exists, an OTP has been sent.", email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send reset OTP" });
  }
};

// ─── Verify Reset OTP (just validates, returns a short-lived reset token) ─────
// POST /api/auth/verify-reset-otp
export const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: "Email and OTP are required" });

    const record = await Otp.findOne({ email, type: "reset_password" });
    if (!record || record.expiresAt < new Date())
      return res.status(400).json({ message: "OTP expired or not found. Please request a new one." });

    if (record.attempts >= 5) {
      await record.deleteOne();
      return res.status(429).json({ message: "Too many attempts. Please request a new OTP." });
    }

    if (!Otp.verify(otp, record.otpHash)) {
      record.attempts += 1;
      await record.save();
      return res.status(400).json({
        message: `Invalid OTP. ${5 - record.attempts} attempts remaining.`,
      });
    }

    // OTP valid — issue a short-lived reset token (5 min) so frontend can call /reset-password
    const user = await User.findOne({ email });
    const resetToken = jwt.sign(
      { id: user._id, purpose: "reset" },
      process.env.JWT_SECRET,
      { expiresIn: "5m" }
    );

    await record.deleteOne();
    res.json({ message: "OTP verified", resetToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Verification failed" });
  }
};

// ─── Reset Password (uses resetToken from verifyResetOtp) ────────────────────
// POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
  try {
    const { resetToken, password } = req.body;
    if (!resetToken || !password)
      return res.status(400).json({ message: "Reset token and new password are required" });

    if (password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters" });

    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    if (decoded.purpose !== "reset")
      return res.status(400).json({ message: "Invalid reset token" });

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = password; // pre-save hook will hash it
    await user.save();

    res.json({ message: "Password reset successfully. You can now log in." });
  } catch (err) {
    if (err.name === "TokenExpiredError")
      return res.status(400).json({ message: "Reset session expired. Please start over." });
    if (err.name === "JsonWebTokenError")
      return res.status(400).json({ message: "Invalid reset token" });
    console.error(err);
    res.status(500).json({ message: "Password reset failed" });
  }
};

// ─── Get current user ─────────────────────────────────────────────────────────
// GET /api/auth/me
export const getMe = async (req, res) => {
  res.json({
    user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role },
  });
};
