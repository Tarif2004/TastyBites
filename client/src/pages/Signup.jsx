import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { sendEmailOtp, verifyEmailOtp, sendOtp, verifyOtp } from "../services/api";
import Footer from "../components/Footer";
import GoogleLoginButton from "../components/GoogleLoginButton";

const Signup = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  // step 1 = info form, step 2 = email OTP, step 3 = phone OTP
  const [step, setStep] = useState(1);

  // Step 1 fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 2 - email OTP
  const [emailOtp, setEmailOtp] = useState("");

  // Step 3 - phone OTP
  const [phone, setPhone] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneSent, setPhoneSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

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
      if (res.demoOtp) alert(`[Dev Mode] Email OTP: ${res.demoOtp}`);
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
      if (res.demoOtp) alert(`[Dev Mode] New Email OTP: ${res.demoOtp}`);
      setCooldown(res.cooldownSeconds || 60);
    } catch (err) {
      setError(err.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!emailOtp || emailOtp.length !== 6) return setError("Please enter the 6-digit email verification code.");
    try {
      setLoading(true);
      await verifyEmailOtp(email, emailOtp, "email_verification");
      setSuccess("Email verified! Now verify your mobile number.");
      setCooldown(0);
      setStep(3);
    } catch (err) {
      setError(err.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendPhoneOtp = async () => {
    setError("");
    if (!phone || !/^\d{10}$/.test(phone)) return setError("Please enter a valid 10-digit mobile number.");
    if (cooldown > 0) return;
    try {
      setLoading(true);
      const res = await sendOtp(phone, "user_verification");
      setPhoneSent(true);
      setSuccess(res.message || "OTP sent to your mobile number.");
      if (res.demoOtp) alert(`[Dev Mode] Phone OTP: ${res.demoOtp}`);
      setCooldown(res.cooldownSeconds || 60);
    } catch (err) {
      // 429 means an OTP was already sent and cooldown is still active.
      // Show the OTP input so the user can enter the code they already received.
      if (err.status === 429) {
        setPhoneSent(true);
        const remaining = err.data?.cooldownRemainingSeconds || 60;
        setCooldown(remaining);
        setError(`An OTP was already sent to this number. Please enter it below, or wait ${remaining}s to resend.`);
      } else {
        setError(err.message || "Failed to send SMS. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhoneAndRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!isPhoneVerified) {
      if (!phoneOtp || phoneOtp.length !== 6) return setError("Please enter the 6-digit SMS verification code.");
      try {
        setLoading(true);
        await verifyOtp(phone, phoneOtp, "user_verification");
        setIsPhoneVerified(true);
      } catch (err) {
        setLoading(false);
        return setError(err.message || "Invalid OTP code.");
      }
    }
    try {
      await register(name, email, password, confirmPassword, phone);
      setSuccess("Account created successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const stepLabel = step === 1 ? "Join TastyBites Club" : step === 2 ? "Verify Your Email" : "Verify Mobile Number";
  const stepSubtitle =
    step === 1
      ? "Create an account for faster checkout and order history."
      : step === 2
      ? `Enter the 6-digit code sent to ${email}`
      : "Enter the 6-digit SMS code sent to your mobile number";

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col justify-between">
      <main className="mx-auto flex flex-1 w-full max-w-md items-center justify-center px-4 py-16">
        <div className="w-full rounded-3xl bg-white border border-stone-200/80 p-8 sm:p-10 shadow-xl shadow-stone-900/5">

          {/* Progress steps */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
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
                  {step > s ? "+" : s}
                </div>
                {s < 3 && (
                  <div className={`h-0.5 w-8 rounded transition-all ${step > s ? "bg-emerald-400" : "bg-stone-200"}`} />
                )}
              </div>
            ))}
          </div>

          <div className="text-center mb-8">
            <span className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-rose-600 text-white font-black text-2xl shadow-sm mb-4">
              {step === 3 ? "📱" : "🍔"}
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

          {/* STEP 2: EMAIL OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyEmailOtp} className="space-y-4">
              <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 text-center">
                <span className="text-xs text-rose-700 font-bold uppercase tracking-wider block mb-1">Verification Code Sent</span>
                <p className="text-sm font-black text-stone-900">{email}</p>
                <button type="button" onClick={() => { setStep(1); setEmailOtp(""); setError(""); setSuccess(""); }}
                  className="text-xs text-rose-600 font-bold hover:underline mt-1">Change email address</button>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">Enter 6-Digit Email Code</label>
                <input type="text" maxLength={6} required value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ""))} placeholder="123456"
                  className="w-full text-center tracking-[8px] font-mono text-xl py-3 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none" />
              </div>
              <button type="submit" disabled={loading || emailOtp.length !== 6}
                className="w-full rounded-full bg-rose-600 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-rose-700 transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50">
                {loading ? "Verifying..." : "Verify Email - Next Step"}
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

          {/* STEP 3: PHONE OTP */}
          {step === 3 && (
            <form onSubmit={handleVerifyPhoneAndRegister} className="space-y-4">
              <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-3 text-center">
                <span className="text-xs text-blue-700 font-bold block">Email Verified</span>
                <p className="text-xs text-stone-600 mt-0.5">Now verify your mobile number to complete signup.</p>
              </div>

              {!isPhoneVerified && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">Mobile Number</label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 rounded-xl border border-stone-200 bg-stone-100 text-sm font-semibold text-stone-500 select-none">
                      +91
                    </div>
                    <input type="tel" maxLength={10} value={phone}
                      disabled={phoneSent && cooldown > 0}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      placeholder="10-digit number"
                      className="flex-1 rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-2.5 text-sm font-medium text-stone-900 outline-none transition focus:border-stone-400 focus:bg-white focus:ring-2 focus:ring-stone-900/5 disabled:opacity-60" />
                    <button type="button" onClick={handleSendPhoneOtp}
                      disabled={loading || phone.length !== 10 || cooldown > 0}
                      className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition disabled:opacity-50 whitespace-nowrap">
                      {cooldown > 0 ? `${cooldown}s` : phoneSent ? "Resend" : "Send OTP"}
                    </button>
                  </div>
                </div>
              )}

              {isPhoneVerified && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center">
                  <span className="text-xs text-emerald-700 font-bold">
                    Mobile Verified: +91 {phone.slice(0, 2)}XXXXXX{phone.slice(-2)}
                  </span>
                </div>
              )}

              {phoneSent && !isPhoneVerified && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">Enter 6-Digit SMS Code</label>
                  <input type="text" maxLength={6} value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ""))} placeholder="123456"
                    className="w-full text-center tracking-[8px] font-mono text-xl py-3 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none" />
                </div>
              )}

              <button type="submit"
                disabled={loading || (!isPhoneVerified && (!phoneSent || phoneOtp.length !== 6))}
                className="w-full rounded-full bg-rose-600 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-rose-700 transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50">
                {loading
                  ? isPhoneVerified ? "Creating Account..." : "Verifying..."
                  : isPhoneVerified
                  ? "Create My Account"
                  : "Verify Mobile & Complete Signup"}
              </button>

              <p className="text-center text-xs text-stone-400">
                Mobile verification helps secure your account and deliveries.
              </p>
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
