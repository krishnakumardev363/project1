import mongoose from "mongoose";
import crypto from "crypto";

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    index: true,
  },
  // hashed OTP stored in DB — plaintext only ever lives in memory + email
  otpHash: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["verify_email", "reset_password"],
    required: true,
  },
  // for reset flow — we also store the pending name so we can create user after verify
  pendingName: String,
  expiresAt: {
    type: Date,
    required: true,
  },
  attempts: {
    type: Number,
    default: 0,
  },
});

// TTL index — MongoDB auto-deletes expired docs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Generate a 6-digit OTP, return plaintext + hash
otpSchema.statics.generate = function () {
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
  return { otp, otpHash };
};

// Verify a plaintext OTP against a stored hash
otpSchema.statics.verify = function (plainOtp, storedHash) {
  const hash = crypto.createHash("sha256").update(plainOtp).digest("hex");
  return hash === storedHash;
};

export default mongoose.model("Otp", otpSchema);
