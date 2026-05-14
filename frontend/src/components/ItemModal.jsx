import { useState, useEffect } from "react";

const STATUSES = ["active", "pending", "completed"];
const PRIORITIES = ["low", "medium", "high"];

export default function ItemModal({ item, onSave, onClose }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "active",
    priority: "medium",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (item) setForm({ title: item.title, description: item.description, status: item.status, priority: item.priority });
  }, [item]);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async () => {
    if (!form.title.trim()) return setError("Title is required");
    setError("");
    setLoading(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">{item ? "Edit Item" : "New Item"}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="label">Title *</label>
            <input name="title" value={form.title} onChange={handle} className="input" placeholder="Item title..." />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handle}
              rows={3}
              className="input resize-none"
              placeholder="Optional description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Status</label>
              <select name="status" value={form.status} onChange={handle} className="input">
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select name="priority" value={form.priority} onChange={handle} className="input">
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-outline flex-1">Cancel</button>
          <button onClick={submit} disabled={loading} className="btn-primary flex-1">
            {loading ? (
              <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : item ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
