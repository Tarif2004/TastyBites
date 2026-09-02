import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/*
  ProtectedRoute — guards pages that require authentication.

  Props:
    adminOnly  boolean  (optional)  If true, only admin users can access.
*/

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  /*
    Wait for authentication restoration
    after browser refresh.
  */

  if (loading) {
    return (
      <div
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-[#f7e7b4]
        "
      >
        <div
          className="
            border-4
            border-black
            bg-[#f0b429]
            px-8
            py-4
            text-2xl
            font-black
            uppercase
            shadow-[6px_6px_0_#000]
          "
        >
          Loading...
        </div>
      </div>
    );
  }

  /*
    User isn't authenticated — redirect to login.
  */

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

  /*
    Admin-only route — redirect non-admins to home.
  */

  if (adminOnly && user.role !== "admin") {
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