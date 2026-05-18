import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    limit: {
      type: Number,
      required: true,
      min: [1, "Limit must be at least 1"],
    },
    month: {
      type: String, // "2026-05"
      required: true,
    },
  },
  { timestamps: true }
);

// One budget per user per category per month
budgetSchema.index({ user: 1, category: 1, month: 1 }, { unique: true });

export default mongoose.model("Budget", budgetSchema);
