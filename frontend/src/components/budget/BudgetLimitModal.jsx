import { useState, useEffect } from "react";

const EXPENSE_CATEGORIES = ["Food", "Transport", "Bills", "Shopping", "Health", "Education", "Entertainment", "Rent", "Other"];

export default function BudgetLimitModal({ open, onClose, onSave, month }) {
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState("");

  useEffect(() => {
    if (open) { setCategory(""); setLimit(""); }
  }, [open]);

  const submit = (e) => {
    e.preventDefault();
    if (!category || !limit) return;
    onSave({ category, limit: Number(limit), month });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-lg">Set Budget Limit</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input" required>
              <option value="">Select category</option>
              {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Monthly Limit (₹)</label>
            <input
              type="number"
              min="1"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="input"
              placeholder="e.g. 5000"
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Set Limit</button>
          </div>
        </form>
      </div>
    </div>
  );
}
