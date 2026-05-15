import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import api from "../lib/axios";
import ItemCard from "../components/ItemCard";
import ItemModal from "../components/ItemModal";
import { useAuth } from "../context/AuthContext";

const FILTERS = ["all", "active", "pending", "completed"];

export default function DashboardPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | "create" | item object
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== "all") params.status = filter;
      if (search.trim()) params.search = search.trim();
      const { data } = await api.get("/items", { params });
      setItems(data.items);
    } catch {
      toast.error("Failed to load items");
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    const t = setTimeout(fetchItems, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchItems, search]);

  const handleCreate = async (form) => {
    const { data } = await api.post("/items", form);
    setItems((prev) => [data.item, ...prev]);
    toast.success("Item created");
  };

  const handleUpdate = async (form) => {
    const { data } = await api.put(`/items/${modal._id}`, form);
    setItems((prev) => prev.map((i) => (i._id === modal._id ? data.item : i)));
    toast.success("Item updated");
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/items/${id}`);
      setItems((prev) => prev.filter((i) => i._id !== id));
      toast.success("Item deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleteId(null);
    }
  };

  const stats = {
    total: items.length,
    active: items.filter((i) => i.status === "active").length,
    pending: items.filter((i) => i.status === "pending").length,
    completed: items.filter((i) => i.status === "completed").length,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Your personal notes manager</p>
        </div>
        <button onClick={() => setModal("create")} className="btn-primary shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Item
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", value: stats.total, color: "text-slate-300" },
          { label: "Active", value: stats.active, color: "text-brand-400" },
          { label: "Pending", value: stats.pending, color: "text-yellow-400" },
          { label: "Done", value: stats.completed, color: "text-slate-500" },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
            <p className={`text-2xl font-semibold font-mono mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                filter === f
                  ? "bg-brand-500 text-slate-950"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
            placeholder="Search items..."
          />
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-slate-400">No items found</p>
          <p className="text-sm text-slate-600 mt-1">Create your first item to get started</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <ItemCard
              key={item._id}
              item={item}
              onEdit={setModal}
              onDelete={setDeleteId}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal && (
        <ItemModal
          item={modal === "create" ? null : modal}
          onSave={modal === "create" ? handleCreate : handleUpdate}
          onClose={() => setModal(null)}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-1">Delete item?</h3>
            <p className="text-sm text-slate-400 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-outline flex-1">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="btn flex-1 bg-red-500 hover:bg-red-400 text-white">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
