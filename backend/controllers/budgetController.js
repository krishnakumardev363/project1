import Transaction from "../models/Transaction.js";
import Budget from "../models/Budget.js";

const currentMonth = () => new Date().toISOString().slice(0, 7); // "2026-05"

// ── TRANSACTIONS ─────────────────────────────────────────────

// GET /api/budget/transactions?month=2026-05
export const getTransactions = async (req, res) => {
  try {
    const month = req.query.month || currentMonth();
    const [year, mon] = month.split("-").map(Number);
    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon, 0, 23, 59, 59);

    const transactions = await Transaction.find({
      user: req.user._id,
      date: { $gte: start, $lte: end },
    }).sort({ date: -1 });

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
};

// POST /api/budget/transactions
export const createTransaction = async (req, res) => {
  try {
    const { type, amount, category, note, date } = req.body;
    if (!type || !amount || !category)
      return res.status(400).json({ message: "type, amount, category required" });

    const tx = await Transaction.create({
      user: req.user._id,
      type,
      amount: Number(amount),
      category,
      note: note || "",
      date: date ? new Date(date) : new Date(),
    });
    res.status(201).json(tx);
  } catch (err) {
    res.status(500).json({ message: "Failed to create transaction" });
  }
};

// PUT /api/budget/transactions/:id
export const updateTransaction = async (req, res) => {
  try {
    const tx = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
    if (!tx) return res.status(404).json({ message: "Transaction not found" });

    const { type, amount, category, note, date } = req.body;
    if (type) tx.type = type;
    if (amount) tx.amount = Number(amount);
    if (category) tx.category = category;
    if (note !== undefined) tx.note = note;
    if (date) tx.date = new Date(date);

    await tx.save();
    res.json(tx);
  } catch (err) {
    res.status(500).json({ message: "Failed to update transaction" });
  }
};

// DELETE /api/budget/transactions/:id
export const deleteTransaction = async (req, res) => {
  try {
    const tx = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!tx) return res.status(404).json({ message: "Transaction not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete transaction" });
  }
};

// GET /api/budget/summary?month=2026-05
export const getSummary = async (req, res) => {
  try {
    const month = req.query.month || currentMonth();
    const [year, mon] = month.split("-").map(Number);
    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon, 0, 23, 59, 59);

    const transactions = await Transaction.find({
      user: req.user._id,
      date: { $gte: start, $lte: end },
    });

    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);

    const totalExpense = transactions
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);

    // Category-wise expense
    const categoryMap = {};
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
      });

    const byCategory = Object.entries(categoryMap).map(([category, amount]) => ({
      category,
      amount,
    }));

    // Budget limits for this month
    const budgets = await Budget.find({ user: req.user._id, month });
    const budgetMap = {};
    budgets.forEach((b) => { budgetMap[b.category] = b.limit; });

    res.json({
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      byCategory,
      budgets: budgetMap,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch summary" });
  }
};

// ── BUDGETS ──────────────────────────────────────────────────

// GET /api/budget/limits?month=2026-05
export const getBudgets = async (req, res) => {
  try {
    const month = req.query.month || currentMonth();
    const budgets = await Budget.find({ user: req.user._id, month });
    res.json(budgets);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch budgets" });
  }
};

// POST /api/budget/limits
export const upsertBudget = async (req, res) => {
  try {
    const { category, limit, month } = req.body;
    if (!category || !limit || !month)
      return res.status(400).json({ message: "category, limit, month required" });

    const budget = await Budget.findOneAndUpdate(
      { user: req.user._id, category, month },
      { limit: Number(limit) },
      { upsert: true, new: true }
    );
    res.json(budget);
  } catch (err) {
    res.status(500).json({ message: "Failed to set budget" });
  }
};

// DELETE /api/budget/limits/:id
export const deleteBudget = async (req, res) => {
  try {
    const b = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!b) return res.status(404).json({ message: "Budget not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete budget" });
  }
};
