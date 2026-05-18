import { useState, useEffect } from "react";

const INCOME_CATEGORIES = ["Salary", "Freelance", "Investment", "Gift", "Other Income"];
const EXPENSE_CATEGORIES = ["Food", "Transport", "Bills", "Shopping", "Health", "Education", "Entertainment", "Rent", "Other"];

export default function TransactionModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState({
    type: "expense",
    amount: "",
    category: "",
    note: "",
    date: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    if (initial) {
      setForm({
        type: initial.type,
        amount: initial.amount,
        category: initial.category,
        note: initial.note || "",
        date: new Date(initial.date).toISOString().slice(0, 10),
      });
    } else {
      setForm({ type: "expense", amount: "", category: "", note: "", date: new Date().toISOString().slice(0, 10) });
    }
  }, [initial, open]);

  const categories = form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handle = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: value,
      ...(name === "type" ? { category: "" } : {}),
    }));
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.amount || !form.category) return;
    onSave(form);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-lg">{initial ? "Edit Transaction" : "New Transaction"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* Type toggle */}
          <div className="flex gap-2 p-1 bg-slate-800 rounded-xl">
            {["expense", "income"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: t, category: "" }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  form.type === t
                    ? t === "income"
                      ? "bg-brand-500 text-slate-950"
                      : "bg-red-500 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {t === "income" ? "💰 Income" : "💸 Expense"}
              </button>
            ))}
          </div>

          <div>
            <label className="label">Amount (₹)</label>
            <input
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={handle}
              className="input"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="label">Category</label>
            <select name="category" value={form.category} onChange={handle} className="input" required>
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Date</label>
            <input name="date" type="date" value={form.date} onChange={handle} className="input" required />
          </div>

          <div>
            <label className="label">Note (optional)</label>
            <input
              name="note"
              value={form.note}
              onChange={handle}
              className="input"
              placeholder="Add a note..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
            <button
              type="submit"
              className={`flex-1 btn font-medium text-white ${
                form.type === "income" ? "bg-brand-500 hover:bg-brand-400 text-slate-950" : "bg-red-500 hover:bg-red-400"
              }`}
            >
              {initial ? "Update" : "Add Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
