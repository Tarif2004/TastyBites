import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { sendEmailOtp, verifyEmailOtp } from "../services/api";
import Footer from "../components/Footer";
import GoogleLoginButton from "../components/GoogleLoginButton";

const Signup = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  // step 1 = info form, step 2 = email OTP
  const [step, setStep] = useState(1);

  // Step 1 fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 2 - email OTP
  const [emailOtp, setEmailOtp] = useState("");
  const [demoEmailOtp, setDemoEmailOtp] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendEmailOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!name.trim() || !email.trim() || !password || !confirmPassword) return setError("Please fill in all required fields.");
    if (password !== confirmPassword) return setError("Passwords do not match.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    try {
      setLoading(true);
      const res = await sendEmailOtp(email, "email_verification");
      setSuccess(`Verification code sent to ${email}`);
      if (res.demoOtp) {
        setDemoEmailOtp(res.demoOtp);
      }
      setCooldown(res.cooldownSeconds || 60);
      setStep(2);
    } catch (err) {
      setError(err.message || "Failed to send verification email.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmailOtp = async () => {
    if (cooldown > 0) return;
    setError("");
    setSuccess("");
    try {
      setLoading(true);
      const res = await sendEmailOtp(email, "email_verification");
      setSuccess("A fresh verification code was sent to your email.");
      if (res.demoOtp) {
        setDemoEmailOtp(res.demoOtp);
      }
      setCooldown(res.cooldownSeconds || 60);
    } catch (err) {
      setError(err.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOtpAndRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!emailOtp || emailOtp.length !== 6) return setError("Please enter the 6-digit email verification code.");
    try {
      setLoading(true);
      await verifyEmailOtp(email, emailOtp, "email_verification");
      await register(name, email, password, confirmPassword);
      setSuccess("Account created successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const stepLabel = step === 1 ? "Join TastyBites Club" : "Verify Your Email";
  const stepSubtitle =
    step === 1
      ? "Create an account for faster checkout and order history."
      : `Enter the 6-digit code sent to ${email}`;

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col justify-between">
      <main className="mx-auto flex flex-1 w-full max-w-md items-center justify-center px-4 py-16">
        <div className="w-full rounded-3xl bg-white border border-stone-200/80 p-8 sm:p-10 shadow-xl shadow-stone-900/5">

          {/* Progress steps */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold transition-all ${
                    step === s
                      ? "bg-rose-600 text-white shadow-md shadow-rose-200"
                      : step > s
                      ? "bg-emerald-500 text-white"
                      : "bg-stone-100 text-stone-400"
                  }`}
                >
                  {step > s ? "✓" : s}
                </div>
                {s < 2 && (
                  <div className={`h-0.5 w-8 rounded transition-all ${step > s ? "bg-emerald-400" : "bg-stone-200"}`} />
                )}
              </div>
            ))}
          </div>

          <div className="text-center mb-8">
            <span className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-rose-600 text-white font-black text-2xl shadow-sm mb-4">
              🍔
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">{stepLabel}</h1>
            <p className="mt-1.5 text-xs sm:text-sm text-stone-500">{stepSubtitle}</p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-semibold text-rose-700">{error}</div>
          )}
          {success && (
            <div className="mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-semibold text-emerald-700">{success}</div>
          )}

          {/* STEP 1: INFO FORM */}
          {step === 1 && (
            <div className="space-y-4">
              <GoogleLoginButton
                buttonText="Quick Register with Google"
                onSuccess={() => { navigate("/"); window.location.reload(); }}
              />
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-stone-200" />
                <span className="flex-shrink mx-3 text-stone-400 text-xs font-semibold uppercase">Or register with email</span>
                <div className="flex-grow border-t border-stone-200" />
              </div>
              <form onSubmit={handleSendEmailOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">Full Name</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jordan Miller"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-2.5 text-sm font-medium text-stone-900 outline-none transition focus:border-stone-400 focus:bg-white focus:ring-2 focus:ring-stone-900/5" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">Email Address</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-2.5 text-sm font-medium text-stone-900 outline-none transition focus:border-stone-400 focus:bg-white focus:ring-2 focus:ring-stone-900/5" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">Password</label>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-2.5 text-sm font-medium text-stone-900 outline-none transition focus:border-stone-400 focus:bg-white focus:ring-2 focus:ring-stone-900/5" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">Confirm Password</label>
                  <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-2.5 text-sm font-medium text-stone-900 outline-none transition focus:border-stone-400 focus:bg-white focus:ring-2 focus:ring-stone-900/5" />
                </div>
                <button type="submit" disabled={loading}
                  className="mt-4 w-full rounded-full bg-rose-600 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-rose-700 transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50">
                  {loading ? "Sending Verification Code..." : "Continue - Verify Email"}
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: EMAIL OTP → REGISTER */}
          {step === 2 && (
            <form onSubmit={handleVerifyEmailOtpAndRegister} className="space-y-4">
              <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 text-center">
                <span className="text-xs text-rose-700 font-bold uppercase tracking-wider block mb-1">Verification Code Sent</span>
                <p className="text-sm font-black text-stone-900">{email}</p>
                <button type="button" onClick={() => { setStep(1); setEmailOtp(""); setError(""); setSuccess(""); }}
                  className="text-xs text-rose-600 font-bold hover:underline mt-1">Change email address</button>
              </div>
              {demoEmailOtp && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-center">
                  <span className="text-xs text-amber-800 font-bold block mb-1">
                    Demo Email Verification Code:
                  </span>
                  <div className="font-mono text-2xl font-black text-rose-600 tracking-[6px] my-1">
                    {demoEmailOtp}
                  </div>
                  <button
                    type="button"
                    onClick={() => setEmailOtp(demoEmailOtp)}
                    className="inline-block mt-1 px-3 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg text-xs font-extrabold transition cursor-pointer"
                  >
                    Click to Auto-fill Code
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">Enter 6-Digit Email Code</label>
                <input type="text" maxLength={6} required value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ""))} placeholder="123456"
                  className="w-full text-center tracking-[8px] font-mono text-xl py-3 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none" />
              </div>
              <button type="submit" disabled={loading || emailOtp.length !== 6}
                className="w-full rounded-full bg-rose-600 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-rose-700 transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50">
                {loading ? "Creating Account..." : "Verify & Create Account"}
              </button>
              <div className="flex items-center justify-between text-xs pt-2">
                <span className="text-stone-500">Didn't receive code?</span>
                <button type="button" onClick={handleResendEmailOtp} disabled={loading || cooldown > 0}
                  className="font-bold text-rose-600 hover:underline disabled:text-stone-400">
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Email OTP"}
                </button>
              </div>
            </form>
          )}


          <p className="mt-6 text-center text-xs text-stone-500">
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-stone-900 hover:underline">Sign in instead</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Signup;
