import { useState } from "react";

const STATUS_STYLES = {
  active: "bg-brand-500/15 text-brand-400 border-brand-500/20",
  pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  completed: "bg-slate-500/15 text-slate-400 border-slate-500/20",
};

const PRIORITY_STYLES = {
  low: "bg-slate-500/15 text-slate-400 border-slate-500/20",
  medium: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  high: "bg-red-500/15 text-red-400 border-red-500/20",
};

// ── View Modal ──────────────────────────────────────────────────────────────
function ViewModal({ item, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-lg"
        onClick={(e) => e.stopPropagation()} // modal outside click la close
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-5">
          {/* <h2 className="text-xl font-semibold text-slate-100 leading-snug">
            {item.title}
          </h2> */}
          <h2 className="font-medium text-slate-100 leading-snug break-words min-w-0">{item.title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Description */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-5 min-h-[100px]">
          {item.description ? (
            // <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
            //   {item.description}
            // </p>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed break-words">{item.description}</p>
          ) : (
            <p className="text-slate-600 text-sm italic">No description added.</p>
          )}
        </div>

        {/* Badges + Date */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`badge border ${STATUS_STYLES[item.status]}`}>
            {item.status}
          </span>
          <span className={`badge border ${PRIORITY_STYLES[item.priority]}`}>
            {item.priority}
          </span>
          <span className="ml-auto text-xs text-slate-500 font-mono">
            Created: {new Date(item.createdAt).toLocaleDateString("en-IN", {
              day: "numeric", month: "short", year: "numeric"
            })}
          </span>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="btn-outline w-full mt-5"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ── Item Card ───────────────────────────────────────────────────────────────
export default function ItemCard({ item, onEdit, onDelete }) {
  const [viewing, setViewing] = useState(false);

  return (
    <>
      {/* Card — click anywhere to view */}
      <div
        className="card hover:border-slate-700 transition-all duration-200 group cursor-pointer"
        onClick={() => setViewing(true)}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-medium text-slate-100 leading-snug">{item.title}</h3>
          {/* <h2 className="... break-words min-w-0">{item.title}</h2> */}

          {/* Edit / Delete — stop propagation so card click doesn't fire */}
          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(item); }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-brand-400 hover:bg-slate-800 transition-colors"
              title="Edit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(item._id); }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {item.description && (
          <p className="text-sm text-slate-400 mb-4 leading-relaxed line-clamp-2">
            {item.description}
          </p>
          // <p className="... break-words overflow-wrap-anywhere">{item.description}</p>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <span className={`badge border ${STATUS_STYLES[item.status]}`}>
            {item.status}
          </span>
          <span className={`badge border ${PRIORITY_STYLES[item.priority]}`}>
            {item.priority}
          </span>
          <span className="ml-auto text-xs text-slate-600 font-mono">
            {new Date(item.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Click hint */}
        <p className="text-xs text-slate-700 mt-3 group-hover:text-slate-500 transition-colors">
          Click to view full note
        </p>
      </div>

      {/* View Modal */}
      {viewing && (
        <ViewModal item={item} onClose={() => setViewing(false)} />
      )}
    </>
  );
}
