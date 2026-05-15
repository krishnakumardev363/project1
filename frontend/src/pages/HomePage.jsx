import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="max-w-5xl mx-auto px-4 py-20 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium mb-8">
        <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
        {/* Notes · Stories · Tasks */}
        Krishna
      </div>

      <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-4">
        Capture your{" "}
        <span className="text-brand-400">thoughts</span>
      </h1>
      <p className="text-slate-400 text-lg max-w-lg mx-auto mb-10">
        Save notes, write stories, and to-do lists organized and accessible anytime.
      </p>

      <div className="flex flex-wrap gap-4 justify-center">
        {user ? (
          <Link to="/dashboard" className="btn-primary px-6 py-3 text-base">
            Go to Dashboard →
          </Link>
        ) : (
          <>
            <Link to="/register" className="btn-primary px-6 py-3 text-base">
              Start Writting
            </Link>
            <Link to="/login" className="btn-outline px-6 py-3 text-base">
              Sign In
            </Link>
          </>
        )}
      </div>

      {/* Tech stack badges */}
      <div className="flex flex-wrap justify-center gap-2 mt-16">
        {["Notes", "Stories", "To-Do Lists", "Secure", "Organized", "Private", "Daily Journal"].map((tech) => (
          <span key={tech} className="badge border border-slate-700 bg-slate-900 text-slate-400 px-3 py-1 text-xs">
            {tech}
          </span>
        ))}
      </div>
    </div>
  );
}
