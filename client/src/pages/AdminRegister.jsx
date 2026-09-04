import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerAdmin, sendOtp, verifyOtp } from "../services/api";

const AdminRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    aadhaarNumber: "",
    password: "",
    confirmPassword: "",
    captchaAnswer: "",
  });

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  // Generate Math Captcha
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    setNum1(Math.floor(Math.random() * 10) + 1);
    setNum2(Math.floor(Math.random() * 10) + 1);
    setFormData((prev) => ({ ...prev, captchaAnswer: "" }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSendOtp = async () => {
    if (!formData.phone || formData.phone.length !== 10) {
      setError("Please enter a valid 10-digit mobile phone number first.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await sendOtp(formData.phone, "admin_verification");
      setOtpSent(true);
      if (data.demoOtp) {
        alert(`Demo Admin Verification OTP: ${data.demoOtp}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setError("Please enter 6-digit OTP code");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await verifyOtp(formData.phone, otp, "admin_verification");
      setIsPhoneVerified(true);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!isPhoneVerified) {
      setError("You must verify your mobile number with OTP before submitting.");
      return;
    }

    const expectedCaptcha = num1 + num2;
    if (parseInt(formData.captchaAnswer, 10) !== expectedCaptcha) {
      setError(`Captcha incorrect. ${num1} + ${num2} equals ${expectedCaptcha}.`);
      generateCaptcha();
      return;
    }

    setLoading(true);
    try {
      const res = await registerAdmin({
        ...formData,
        captchaExpected: expectedCaptcha,
      });

      setSuccessMsg(res.message);
      setTimeout(() => {
        navigate("/login");
      }, 4000);
    } catch (err) {
      setError(err.message);
      generateCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 py-12">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-8 border border-slate-100 relative overflow-hidden">
        {/* Header Badge */}
        <div className="text-center mb-8">
          <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-extrabold uppercase tracking-widest rounded-full">
            Staff Portal Security
          </span>
          <h1 className="text-3xl font-black font-serif text-slate-900 mt-2">
            Register as Admin
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Admin applications require identity verification and Owner approval.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border-l-4 border-rose-600 text-rose-700 text-xs rounded-xl font-semibold">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border-l-4 border-emerald-600 text-emerald-800 text-xs rounded-xl font-bold">
            ✅ {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Official Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@restaurant.com"
                className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                required
              />
            </div>
          </div>

          {/* Aadhaar Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              12-Digit Aadhaar Card Number
            </label>
            <input
              type="text"
              name="aadhaarNumber"
              maxLength={12}
              value={formData.aadhaarNumber}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  aadhaarNumber: e.target.value.replace(/\D/g, ""),
                }))
              }
              placeholder="1234 5678 9012"
              className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-rose-500 outline-none"
              required
            />
          </div>

          {/* Phone Number + Swiggy/Zomato OTP Verification */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase">
              Mobile Contact Number Verification
            </label>
            <div className="flex gap-2">
              <input
                type="tel"
                name="phone"
                maxLength={10}
                value={formData.phone}
                disabled={isPhoneVerified}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    phone: e.target.value.replace(/\D/g, ""),
                  }))
                }
                placeholder="10-digit mobile number"
                className="flex-1 px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                required
              />
              {!isPhoneVerified ? (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading || !formData.phone}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition"
                >
                  {otpSent ? "Resend OTP" : "Send OTP"}
                </button>
              ) : (
                <span className="px-4 py-2.5 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl flex items-center gap-1">
                  ✓ Verified
                </span>
              )}
            </div>

            {otpSent && !isPhoneVerified && (
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter 6-digit OTP code"
                  className="flex-1 px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-rose-500 outline-none"
                />
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={loading}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition"
                >
                  Verify Code
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                required
              />
            </div>
          </div>

          {/* Interactive Math Captcha */}
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Security Captcha Check
              </span>
              <p className="text-sm font-black text-slate-900">
                What is <span className="text-rose-600 font-mono text-base">{num1} + {num2}</span>?
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                name="captchaAnswer"
                value={formData.captchaAnswer}
                onChange={handleChange}
                placeholder="?"
                className="w-20 px-3 py-2 text-center text-sm font-bold bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                required
              />
              <button
                type="button"
                onClick={generateCaptcha}
                className="text-xs text-amber-800 hover:underline"
                title="Refresh Captcha"
              >
                🔄
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !isPhoneVerified}
            className="w-full py-4 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-extrabold rounded-2xl shadow-lg transition duration-200 text-sm uppercase tracking-wider"
          >
            {loading ? "Submitting Application..." : "Submit Admin Application"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Already registered?{" "}
          <Link to="/login" className="text-rose-600 font-bold hover:underline">
            Back to Staff Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminRegister;
