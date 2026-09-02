import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Footer from "../components/Footer";

const Signup = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      await register(name, email, password, confirmPassword);
      setSuccess("Account created successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col justify-between">
      <main className="mx-auto flex flex-1 w-full max-w-md items-center justify-center px-4 py-16">
        <div className="w-full rounded-3xl bg-white border border-stone-200/80 p-8 sm:p-10 shadow-xl shadow-stone-900/5">
          
          <div className="text-center mb-8">
            <span className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-rose-600 text-white font-black text-2xl shadow-sm mb-4">
              🍔
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              Join TastyBites Club
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-stone-500">
              Create an account for faster checkout and order history.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-semibold text-emerald-700">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jordan Miller"
                className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-2.5 text-sm font-medium text-stone-900 outline-none transition focus:border-stone-400 focus:bg-white focus:ring-2 focus:ring-stone-900/5"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-2.5 text-sm font-medium text-stone-900 outline-none transition focus:border-stone-400 focus:bg-white focus:ring-2 focus:ring-stone-900/5"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-2.5 text-sm font-medium text-stone-900 outline-none transition focus:border-stone-400 focus:bg-white focus:ring-2 focus:ring-stone-900/5"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-2.5 text-sm font-medium text-stone-900 outline-none transition focus:border-stone-400 focus:bg-white focus:ring-2 focus:ring-stone-900/5"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full rounded-full bg-rose-600 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-rose-700 transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Create Account & Start"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-stone-500">
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-stone-900 hover:underline">
              Sign in instead
            </Link>
          </p>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Signup;