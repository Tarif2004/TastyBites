import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/*
  ProtectedRoute — guards pages that require authentication.

  Props:
    adminOnly  boolean  (optional)  If true, admin or owner users can access.
*/

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafaf9]">
        <div className="rounded-2xl border border-stone-200 bg-white px-8 py-4 text-sm font-black text-stone-900 shadow-sm animate-pulse">
          Authenticating...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{
          from: location.pathname,
        }}
        replace
      />
    );
  }

  if (adminOnly && user.role !== "admin" && user.role !== "owner") {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;