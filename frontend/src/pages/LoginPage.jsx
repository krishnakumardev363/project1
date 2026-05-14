import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      toast.error(msg);
      // If email not verified, redirect to verify page
      if (err.response?.data?.needsVerification) {
        navigate(`/verify-email?email=${encodeURIComponent(form.email)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold mb-1">Welcome back</h1>
          <p className="text-slate-400 text-sm">Sign in to your account</p>
        </div>

        <form onSubmit={submit} className="card space-y-4">
          <div>
            <label className="label">Email</label>
            <input name="email" type="email" value={form.email} onChange={handle} className="input" placeholder="you@example.com" required />
          </div>
          <div>
            <label className="label">Password</label>
            <input name="password" type="password" value={form.password} onChange={handle} className="input" placeholder="••••••••" required />
          </div>
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-xs text-slate-500 hover:text-brand-400 transition-colors">
              Forgot password?
            </Link>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading
              ? <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-4">
          No account?{" "}
          <Link to="/register" className="text-brand-400 hover:text-brand-300 transition-colors">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
