import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import OtpInput from "../components/OtpInput";
import api from "../lib/axios";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [otpKey, setOtpKey] = useState(0); // increment to reset OtpInput boxes
  const [pendingEmail, setPendingEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [mailSent, setMailSent] = useState(false); // flash animation
  const cooldownRef = useRef(null);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // ── Step 1: submit form → trigger OTP email ──────────────────────────────
  const submitForm = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", form);
      setPendingEmail(data.email);
      setStep(2);
      flashMailSent();
      toast.success("OTP sent! Check your email.");
      startCooldown();
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify OTP → activate account ───────────────────────────────
  const submitOtp = async (e) => {
    e.preventDefault();
    if (otp.length < 6) return toast.error("Enter the full 6-digit OTP");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/verify-otp", { email: pendingEmail, otp });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      toast.success(data.message);
      navigate("/dashboard");
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP — actually calls API + sends a new email ──────────────────
  const resend = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    try {
      await api.post("/auth/resend-otp", { email: pendingEmail, type: "verify_email" });
      // Clear the OTP boxes so user types fresh
      setOtp("");
      setOtpKey((k) => k + 1);
      flashMailSent();
      toast.success(`New OTP sent to ${pendingEmail}`, { duration: 4000 });
      startCooldown();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  const startCooldown = () => {
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    setResendCooldown(60);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((c) => {
        if (c <= 1) { clearInterval(cooldownRef.current); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const flashMailSent = () => {
    setMailSent(true);
    setTimeout(() => setMailSent(false), 2500);
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* ── Step 1: Registration form ── */}
        {step === 1 && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold mb-1">Create an account</h1>
              <p className="text-slate-400 text-sm">We'll send an OTP to verify your email</p>
            </div>
            <form onSubmit={submitForm} className="card space-y-4">
              <div>
                <label className="label">Name</label>
                <input name="name" value={form.name} onChange={handle} className="input" placeholder="Your name" required />
              </div>
              <div>
                <label className="label">Email</label>
                <input name="email" type="email" value={form.email} onChange={handle} className="input" placeholder="you@example.com" required />
              </div>
              <div>
                <label className="label">Password</label>
                <input name="password" type="password" value={form.password} onChange={handle} className="input" placeholder="Min. 6 characters" required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading
                  ? <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  : "Send Verification OTP"}
              </button>
            </form>
            <p className="text-center text-sm text-slate-400 mt-4">
              Already have an account?{" "}
              <Link to="/login" className="text-brand-400 hover:text-brand-300 transition-colors">Sign in</Link>
            </p>
          </>
        )}

        {/* ── Step 2: OTP verification ── */}
        {step === 2 && (
          <>
            <div className="text-center mb-8">
              {/* Mail icon — animates when OTP is sent/resent */}
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 border transition-all duration-500 ${
                mailSent
                  ? "bg-brand-500/30 border-brand-400 scale-110"
                  : "bg-brand-500/10 border-brand-500/20"
              }`}>
                <svg className={`w-7 h-7 transition-colors duration-500 ${mailSent ? "text-brand-300" : "text-brand-400"}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>

              <h1 className="text-2xl font-semibold mb-1">Check your email</h1>
              <p className="text-slate-400 text-sm">
                We sent a 6-digit OTP to<br />
                <span className="text-slate-200 font-medium">{pendingEmail}</span>
              </p>
            </div>

            <form onSubmit={submitOtp} className="card">
              <label className="label text-center block mb-4">Enter OTP</label>

              {/* key prop resets child component when resend clears boxes */}
              <OtpInput key={otpKey} onChange={setOtp} />

              <button type="submit" disabled={loading || otp.length < 6} className="btn-primary w-full mt-6">
                {loading
                  ? <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  : "Verify & Create Account"}
              </button>

              {/* ── Resend section ── */}
              <div className="mt-5 pt-4 border-t border-slate-800">
                <p className="text-xs text-slate-500 text-center mb-3">Didn't receive the email?</p>
                <button
                  type="button"
                  onClick={resend}
                  disabled={resendCooldown > 0 || resendLoading}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${
                    resendCooldown > 0 || resendLoading
                      ? "border-slate-800 text-slate-600 cursor-not-allowed"
                      : "border-slate-700 text-slate-300 hover:border-brand-500/50 hover:text-brand-400 hover:bg-brand-500/5"
                  }`}
                >
                  {resendLoading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                      Sending new OTP...
                    </>
                  ) : resendCooldown > 0 ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Resend in {resendCooldown}s
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Resend OTP to email
                    </>
                  )}
                </button>

                {/* Cooldown progress bar */}
                {resendCooldown > 0 && (
                  <div className="mt-2 h-0.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500/50 rounded-full transition-all duration-1000"
                      style={{ width: `${(resendCooldown / 60) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </form>

            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors mx-auto mt-4"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to registration
            </button>
          </>
        )}
      </div>
    </div>
  );
}
