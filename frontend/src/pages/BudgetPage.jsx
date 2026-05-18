import { useState, useEffect, useCallback } from "react";
import api from "../lib/axios";
import toast from "react-hot-toast";
import TransactionModal from "../components/budget/TransactionModal";
import BudgetLimitModal from "../components/budget/BudgetLimitModal";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";

const COLORS = ["#14b8a6","#f59e0b","#3b82f6","#ef4444","#8b5cf6","#ec4899","#10b981","#f97316","#6366f1"];

const fmt = (n) => "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 0 });

export default function BudgetPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.toISOString().slice(0, 7));
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0, byCategory: [], budgets: {} });
  const [transactions, setTransactions] = useState([]);
  const [budgetLimits, setBudgetLimits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [txModal, setTxModal] = useState({ open: false, initial: null });
  const [budgetModal, setBudgetModal] = useState(false);
  const [filter, setFilter] = useState("all"); // all | income | expense
  const [search, setSearch] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, txRes, bRes] = await Promise.all([
        api.get(`/budget/summary?month=${month}`),
        api.get(`/budget/transactions?month=${month}`),
        api.get(`/budget/limits?month=${month}`),
      ]);
      setSummary(sumRes.data);
      setTransactions(txRes.data);
      setBudgetLimits(bRes.data);
    } catch {
      toast.error("Failed to load budget data");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSaveTx = async (form) => {
    try {
      if (txModal.initial) {
        await api.put(`/budget/transactions/${txModal.initial._id}`, form);
        toast.success("Transaction updated");
      } else {
        await api.post("/budget/transactions", form);
        toast.success("Transaction added");
      }
      setTxModal({ open: false, initial: null });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    }
  };

  const handleDeleteTx = async (id) => {
    if (!confirm("Delete this transaction?")) return;
    try {
      await api.delete(`/budget/transactions/${id}`);
      toast.success("Deleted");
      fetchAll();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleSaveBudget = async (data) => {
    try {
      await api.post("/budget/limits", data);
      toast.success("Budget limit set!");
      setBudgetModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to set budget");
    }
  };

  const handleDeleteBudget = async (id) => {
    try {
      await api.delete(`/budget/limits/${id}`);
      toast.success("Budget limit removed");
      fetchAll();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const filtered = transactions.filter((t) => {
    const matchType = filter === "all" || t.type === filter;
    const matchSearch = t.category.toLowerCase().includes(search.toLowerCase()) ||
      t.note.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  // Pie chart data
  const pieData = summary.byCategory.map((c, i) => ({
    name: c.category,
    value: c.amount,
    color: COLORS[i % COLORS.length],
  }));

  // Bar chart: income vs expense per category for expense categories
  const barData = summary.byCategory.map((c) => ({
    name: c.category,
    Spent: c.amount,
    Limit: summary.budgets[c.category] || 0,
  })).filter(d => d.Limit > 0 || d.Spent > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Budget</h1>
          <p className="text-slate-400 text-sm">Track income, expenses & limits</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="input !w-auto text-sm"
          />
          <button onClick={() => setBudgetModal(true)} className="btn-outline text-sm">
            🎯 Set Limit
          </button>
          <button onClick={() => setTxModal({ open: true, initial: null })} className="btn-primary text-sm">
            + Add Transaction
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Balance", value: summary.balance, color: summary.balance >= 0 ? "text-brand-400" : "text-red-400" },
          { label: "Income", value: summary.totalIncome, color: "text-brand-400" },
          { label: "Expense", value: summary.totalExpense, color: "text-red-400" },
          { label: "Transactions", value: transactions.length, color: "text-slate-300", isCount: true },
        ].map((s) => (
          <div key={s.label} className="card !p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>
              {s.isCount ? s.value : fmt(s.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      {summary.byCategory.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Pie */}
          <div className="card">
            <h3 className="font-medium mb-4">Expense by Category</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar: Spent vs Limit */}
          {barData.length > 0 && (
            <div className="card">
              <h3 className="font-medium mb-4">Spent vs Budget Limit</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }} />
                  <Legend />
                  <Bar dataKey="Spent" fill="#ef4444" radius={[4,4,0,0]} />
                  <Bar dataKey="Limit" fill="#14b8a6" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Budget Limits Section */}
      {budgetLimits.length > 0 && (
        <div className="card mb-8">
          <h3 className="font-medium mb-4">Budget Limits — {month}</h3>
          <div className="space-y-3">
            {budgetLimits.map((b) => {
              const spent = summary.byCategory.find((c) => c.category === b.category)?.amount || 0;
              const pct = Math.min((spent / b.limit) * 100, 100);
              const over = spent > b.limit;
              return (
                <div key={b._id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-300">{b.category}</span>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium ${over ? "text-red-400" : "text-slate-400"}`}>
                        {fmt(spent)} / {fmt(b.limit)}
                        {over && " ⚠️ Over budget!"}
                      </span>
                      <button onClick={() => handleDeleteBudget(b._id)} className="text-slate-600 hover:text-red-400 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${over ? "bg-red-500" : pct > 80 ? "bg-yellow-500" : "bg-brand-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transactions List */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <h3 className="font-medium">Transactions</h3>
          <div className="flex gap-2 flex-wrap">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="input !w-40 text-sm"
            />
            {["all", "income", "expense"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-lg capitalize transition-all ${
                  filter === f ? "bg-brand-500 text-slate-950 font-medium" : "btn-outline"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p className="text-4xl mb-3">💸</p>
            <p>No transactions found</p>
            <button onClick={() => setTxModal({ open: true, initial: null })} className="btn-primary mt-4 text-sm">
              Add First Transaction
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((t) => (
              <div key={t._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${t.type === "income" ? "bg-brand-500/15" : "bg-red-500/15"}`}>
                    {t.type === "income" ? "💰" : "💸"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{t.category}</p>
                    <p className="text-xs text-slate-500">
                      {t.note || "—"} · {new Date(t.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-semibold text-sm ${t.type === "income" ? "text-brand-400" : "text-red-400"}`}>
                    {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setTxModal({ open: true, initial: t })}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-brand-400 hover:bg-slate-700 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteTx(t._id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TransactionModal
        open={txModal.open}
        onClose={() => setTxModal({ open: false, initial: null })}
        onSave={handleSaveTx}
        initial={txModal.initial}
      />
      <BudgetLimitModal
        open={budgetModal}
        onClose={() => setBudgetModal(false)}
        onSave={handleSaveBudget}
        month={month}
      />
    </div>
  );
}
