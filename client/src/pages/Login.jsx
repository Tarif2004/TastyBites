import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Footer from "../components/Footer";
import GoogleLoginButton from "../components/GoogleLoginButton";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Invalid email or password.");
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
              Welcome Back
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-stone-500">
              Sign in to track your orders and order faster.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          <div className="mb-6">
            <GoogleLoginButton
              onSuccess={() => {
                navigate(from, { replace: true });
                window.location.reload();
              }}
            />
          </div>

          <div className="relative flex py-2 items-center mb-4">
            <div className="flex-grow border-t border-stone-200"></div>
            <span className="flex-shrink mx-3 text-stone-400 text-xs font-semibold uppercase">Or sign in with email</span>
            <div className="flex-grow border-t border-stone-200"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-sm font-medium text-stone-900 outline-none transition focus:border-stone-400 focus:bg-white focus:ring-2 focus:ring-stone-900/5"
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
                placeholder="••••••••"
                className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-sm font-medium text-stone-900 outline-none transition focus:border-stone-400 focus:bg-white focus:ring-2 focus:ring-stone-900/5"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-full bg-stone-900 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-rose-600 transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? "Signing In..." : "Sign In & Continue"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-stone-500">
            Don't have an account yet?{" "}
            <Link to="/signup" className="font-bold text-rose-600 hover:underline">
              Create customer account
            </Link>
          </p>

          <div className="mt-4 pt-4 border-t border-stone-100 text-center">
            <Link to="/admin/register" className="text-xs font-bold text-amber-800 hover:underline">
              🔐 Register as Staff / Admin (Aadhaar & Owner Verification) &rarr;
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Login;