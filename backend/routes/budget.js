import express from "express";
import { protect } from "../middleware/auth.js";
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getSummary,
  getBudgets,
  upsertBudget,
  deleteBudget,
} from "../controllers/budgetController.js";

const router = express.Router();

// All routes protected
router.use(protect);

// Transactions
router.get("/transactions", getTransactions);
router.post("/transactions", createTransaction);
router.put("/transactions/:id", updateTransaction);
router.delete("/transactions/:id", deleteTransaction);

// Summary
router.get("/summary", getSummary);

// Budget limits
router.get("/limits", getBudgets);
router.post("/limits", upsertBudget);
router.delete("/limits/:id", deleteBudget);

export default router;
