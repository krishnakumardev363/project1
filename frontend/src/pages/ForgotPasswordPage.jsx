import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import OtpInput from "../components/OtpInput";
import api from "../lib/axios";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpKey, setOtpKey] = useState(0); // resets OTP boxes on resend
  const [resetToken, setResetToken] = useState("");
  const [passwords, setPasswords] = useState({ password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [mailSent, setMailSent] = useState(false);
  const cooldownRef = useRef(null);

  // ── Step 1: send OTP ─────────────────────────────────────────────────────
  const submitEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setStep(2);
      flashMailSent();
      toast.success("OTP sent! Check your email.");
      startCooldown();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify OTP ───────────────────────────────────────────────────
  const submitOtp = async (e) => {
    e.preventDefault();
    if (otp.length < 6) return toast.error("Enter the full 6-digit OTP");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/verify-reset-otp", { email, otp });
      setResetToken(data.resetToken);
      setStep(3);
      toast.success("OTP verified!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: new password ─────────────────────────────────────────────────
  const submitPassword = async (e) => {
    e.preventDefault();
    if (passwords.password.length < 6) return toast.error("Password must be at least 6 characters");
    if (passwords.password !== passwords.confirm) return toast.error("Passwords don't match");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/reset-password", {
        resetToken,
        password: passwords.password,
      });
      toast.success(data.message);
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed");
      if (err.response?.status === 400) setStep(1);
    } finally {
      setLoading(false);
    }
  };

  // ── Resend: calls API → sends real email → resets OTP boxes ─────────────
  const resend = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    try {
      await api.post("/auth/resend-otp", { email, type: "reset_password" });
      setOtp("");
      setOtpKey((k) => k + 1); // unmount/remount OtpInput → clears boxes
      flashMailSent();
      toast.success(`New OTP sent to ${email}`, { duration: 4000 });
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

  // ── Step indicator ───────────────────────────────────────────────────────
  const StepIndicator = () => (
    <div className="flex items-center gap-2 justify-center mb-8">
      {["Email", "OTP", "Password"].map((label, i) => {
        const n = i + 1;
        const done = step > n;
        const active = step === n;
        return (
          <div key={n} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border transition-all duration-300 ${
              done ? "bg-brand-500 border-brand-500 text-slate-950"
                   : active ? "border-brand-500 text-brand-400 bg-brand-500/10"
                   : "border-slate-700 text-slate-600"}`}>
              {done ? "✓" : n}
            </div>
            <span className={`text-xs hidden sm:block ${active ? "text-slate-300" : "text-slate-600"}`}>{label}</span>
            {i < 2 && <div className={`w-8 h-px transition-colors duration-300 ${step > n ? "bg-brand-500" : "bg-slate-700"}`} />}
          </div>
        );
      })}
    </div>
  );

  // ── Resend button (shared between steps that need it) ────────────────────
  const ResendSection = () => (
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
      {resendCooldown > 0 && (
        <div className="mt-2 h-0.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500/50 rounded-full transition-all duration-1000"
            style={{ width: `${(resendCooldown / 60) * 100}%` }}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <StepIndicator />

        {/* ── Step 1: Enter email ── */}
        {step === 1 && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold mb-1">Forgot password?</h1>
              <p className="text-slate-400 text-sm">Enter your email to receive a reset OTP</p>
            </div>
            <form onSubmit={submitEmail} className="card space-y-4">
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading
                  ? <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  : "Send Reset OTP"}
              </button>
            </form>
          </>
        )}

        {/* ── Step 2: Verify OTP ── */}
        {step === 2 && (
          <>
            <div className="text-center mb-8">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 border transition-all duration-500 ${
                mailSent ? "bg-brand-500/30 border-brand-400 scale-110" : "bg-brand-500/10 border-brand-500/20"
              }`}>
                <svg className={`w-7 h-7 transition-colors duration-500 ${mailSent ? "text-brand-300" : "text-brand-400"}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h1 className="text-2xl font-semibold mb-1">Enter OTP</h1>
              <p className="text-slate-400 text-sm">
                Sent to <span className="text-slate-200 font-medium">{email}</span>
              </p>
            </div>

            <form onSubmit={submitOtp} className="card">
              <label className="label text-center block mb-4">6-digit OTP</label>
              <OtpInput key={otpKey} onChange={setOtp} />

              <button type="submit" disabled={loading || otp.length < 6} className="btn-primary w-full mt-6">
                {loading
                  ? <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  : "Verify OTP"}
              </button>

              <ResendSection />
            </form>

            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors mx-auto mt-4"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Change email
            </button>
          </>
        )}

        {/* ── Step 3: New password ── */}
        {step === 3 && (
          <>
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-2xl font-semibold mb-1">New password</h1>
              <p className="text-slate-400 text-sm">Choose a strong password</p>
            </div>
            <form onSubmit={submitPassword} className="card space-y-4">
              <div>
                <label className="label">New Password</label>
                <input
                  type="password"
                  value={passwords.password}
                  onChange={(e) => setPasswords((p) => ({ ...p, password: e.target.value }))}
                  className="input"
                  placeholder="Min. 6 characters"
                  required
                />
              </div>
              <div>
                <label className="label">Confirm Password</label>
                <input
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                  className="input"
                  placeholder="Repeat password"
                  required
                />
                {passwords.confirm && passwords.password !== passwords.confirm && (
                  <p className="text-xs text-red-400 mt-1.5">Passwords don't match</p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading || passwords.password !== passwords.confirm || passwords.password.length < 6}
                className="btn-primary w-full"
              >
                {loading
                  ? <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  : "Reset Password"}
              </button>
            </form>
          </>
        )}

        <p className="text-center text-sm text-slate-400 mt-6">
          Remember it?{" "}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
