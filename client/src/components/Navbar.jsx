import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navClass = ({ isActive }) =>
    `text-sm font-semibold tracking-tight transition-colors duration-150 py-1.5 px-3 rounded-full ${
      isActive
        ? "text-rose-600 bg-rose-50"
        : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/70"
    }`;

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200/70 transition-all">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2 group">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white font-black text-xl shadow-sm group-hover:scale-105 transition-transform">
            🍔
          </span>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight text-stone-900 leading-none">
              Tasty<span className="text-rose-600">Bites</span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
              Kitchen & Bar
            </span>
          </div>
        </Link>

        {/* DESKTOP NAV LINKS */}
        <div className="hidden items-center gap-1.5 md:flex">
          <NavLink to="/" end className={navClass}>
            Home
          </NavLink>
          <NavLink to="/menu" className={navClass}>
            Menu
          </NavLink>
          {user && (
            <NavLink to="/my-orders" className={navClass}>
              Orders
            </NavLink>
          )}
          {user?.role === "admin" && (
            <NavLink to="/admin" className={navClass}>
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Admin
              </span>
            </NavLink>
          )}
        </div>

        {/* RIGHT ACTIONS */}
        <div className="hidden items-center gap-3 md:flex">
          {!user ? (
            <>
              <NavLink
                to="/login"
                className="text-sm font-semibold text-stone-700 hover:text-stone-950 px-3.5 py-2 rounded-full hover:bg-stone-100 transition"
              >
                Sign In
              </NavLink>
              <Link
                to="/signup"
                className="text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 px-4.5 py-2 rounded-full shadow-sm hover:shadow transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Order Now
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                Hi, {user.name?.split(" ")[0]}
              </span>
              <button
                onClick={logout}
                className="text-xs font-semibold text-stone-500 hover:text-rose-600 transition px-2.5 py-1"
              >
                Sign Out
              </button>
            </div>
          )}

          {/* Cart Pill */}
          <Link
            to="/cart"
            className="relative flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-stone-800 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>🛒</span>
            <span>Cart</span>
            {totalItems > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 text-xs font-bold text-white">
                {totalItems}
              </span>
            )}
          </Link>
        </div>

        {/* MOBILE CONTROLS */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            to="/cart"
            className="relative flex items-center justify-center h-10 w-10 rounded-full bg-stone-900 text-white shadow-sm"
          >
            <span className="text-sm">🛒</span>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-bold text-white border-2 border-white">
                {totalItems}
              </span>
            )}
          </Link>

          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 shadow-sm transition hover:bg-stone-50 active:bg-stone-100"
          >
            {mobileOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* MOBILE DROPDOWN */}
      {mobileOpen && (
        <div className="border-b border-stone-200 bg-white px-4 py-5 md:hidden shadow-lg animate-fadeIn">
          <div className="flex flex-col gap-2">
            <MobileLink to="/" onClick={() => setMobileOpen(false)}>Home</MobileLink>
            <MobileLink to="/menu" onClick={() => setMobileOpen(false)}>Menu</MobileLink>
            {user && (
              <MobileLink to="/my-orders" onClick={() => setMobileOpen(false)}>My Orders</MobileLink>
            )}
            {user?.role === "admin" && (
              <MobileLink to="/admin" onClick={() => setMobileOpen(false)}>Admin Panel</MobileLink>
            )}

            <div className="pt-3 mt-2 border-t border-stone-100 flex flex-col gap-2">
              {!user ? (
                <>
                  <MobileLink to="/login" onClick={() => setMobileOpen(false)}>Sign In</MobileLink>
                  <Link
                    to="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center rounded-xl bg-rose-600 py-3 text-sm font-bold text-white shadow-sm"
                  >
                    Create Account
                  </Link>
                </>
              ) : (
                <div className="flex items-center justify-between pt-1 px-3">
                  <span className="text-xs font-bold text-stone-500">
                    Logged in as <strong className="text-stone-800">{user.name}</strong>
                  </span>
                  <button
                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                    }}
                    className="text-xs font-bold text-rose-600 underline"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

const MobileLink = ({ to, children, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `block rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
        isActive
          ? "bg-rose-50 text-rose-700 font-bold"
          : "text-stone-700 hover:bg-stone-50"
      }`
    }
  >
    {children}
  </NavLink>
);

export default Navbar;