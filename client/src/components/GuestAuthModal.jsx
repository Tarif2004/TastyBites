import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GoogleLoginButton from "./GoogleLoginButton";
import { loginUser, sendOtp, verifyOtp, registerUser } from "../services/api";

const GuestAuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("user"); // 'user' or 'admin'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await loginUser({ email, password });
      localStorage.setItem("token", data.token);
      if (onAuthSuccess) onAuthSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phone || phone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await sendOtp(phone, "user_verification");
      setOtpSent(true);
      if (data.demoOtp) {
        alert(`Demo OTP sent: ${data.demoOtp}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpAndRegister = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError("Please enter 6-digit OTP code");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await verifyOtp(phone, otp, "user_verification");
      const randomPassword = `Pass_${Date.now()}`;
      const userEmail = `${phone}@tastybites.guest`;
      const data = await registerUser({
        name: name || `Diner ${phone.slice(-4)}`,
        email: userEmail,
        phone,
        password: randomPassword,
        confirmPassword: randomPassword,
      });
      localStorage.setItem("token", data.token);
      if (onAuthSuccess) onAuthSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600 to-amber-600 p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold"
          >
            ✕
          </button>
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            Checkout Requires Account
          </span>
          <h2 className="text-2xl font-black font-serif">Sign In or Quick Register</h2>
          <p className="text-xs text-white/90 mt-1">
            Choose options to continue placing your order
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={() => { setTab("user"); setError(""); }}
            className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition ${
              tab === "user"
                ? "border-rose-600 text-rose-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            🍔 Customer / Diner
          </button>
          <button
            type="button"
            onClick={() => { setTab("admin"); setError(""); }}
            className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition ${
              tab === "admin"
                ? "border-rose-600 text-rose-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            🔐 Staff / Admin / Owner
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border-l-4 border-rose-600 text-rose-700 text-xs rounded font-medium">
              {error}
            </div>
          )}

          {tab === "user" ? (
            <div className="space-y-4">
              {/* Quick Mobile OTP Sign In */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-amber-50/40">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span>📱</span> Fast Phone OTP Verification
                </h3>
                {!otpSent ? (
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={loading}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition"
                    >
                      Send OTP
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleVerifyOtpAndRegister} className="space-y-2">
                    <input
                      type="text"
                      placeholder="Your Name (Optional)"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none font-mono"
                      />
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition"
                      >
                        Verify & Order
                      </button>
                    </div>
                  </form>
                )}
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-slate-400 text-xs font-semibold uppercase">Or login with</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Google Sign-in */}
              <GoogleLoginButton
                onSuccess={(data) => {
                  if (onAuthSuccess) onAuthSuccess(data.user);
                  onClose();
                }}
              />

              {/* Password Login */}
              <form onSubmit={handlePasswordLogin} className="space-y-3 pt-2">
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition shadow"
                >
                  {loading ? "Signing in..." : "Sign In with Password"}
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              <form onSubmit={handlePasswordLogin} className="space-y-3">
                <input
                  type="email"
                  placeholder="Staff / Admin Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition shadow"
                >
                  {loading ? "Verifying..." : "Staff / Admin Sign In"}
                </button>
              </form>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-slate-400 text-xs font-semibold uppercase">Or</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <GoogleLoginButton
                roleTarget="admin"
                buttonText="Admin Sign in with Google"
                onSuccess={(data) => {
                  if (onAuthSuccess) onAuthSuccess(data.user);
                  onClose();
                }}
              />

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate("/admin/register");
                  }}
                  className="text-xs font-bold text-rose-600 hover:underline"
                >
                  Apply to Register as New Admin (Aadhaar & Owner Verification required) →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuestAuthModal;
