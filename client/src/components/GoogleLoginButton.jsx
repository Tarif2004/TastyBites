import React, { useState, useEffect, useRef } from "react";
import { googleAuth } from "../services/api";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

const isRealClientId = (id) => {
  return id && id.trim().length > 10 && !id.includes("exampleclientid");
};

const GoogleLoginButton = ({
  onSuccess,
  roleTarget = "user",
  buttonText = "Continue with Google",
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const googleBtnRef = useRef(null);
  const hasValidClientId = isRealClientId(GOOGLE_CLIENT_ID);

  useEffect(() => {
    if (!hasValidClientId) return;

    const loadGsiScript = () => {
      if (document.getElementById("google-gsi-script")) return;

      const script = document.createElement("script");
      script.id = "google-gsi-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initGoogleSignIn();
      };
      document.body.appendChild(script);
    };

    const initGoogleSignIn = () => {
      if (window.google?.accounts?.id && googleBtnRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
          });

          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: "outline",
            size: "large",
            width: "100%",
            text: "continue_with",
            shape: "pill",
          });
        } catch (err) {
          console.warn("GIS initialization warning:", err.message);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGoogleSignIn();
    } else {
      loadGsiScript();
    }
  }, [roleTarget, hasValidClientId]);

  const handleGoogleCredentialResponse = async (response) => {
    try {
      setLoading(true);
      setError("");

      if (!response.credential) {
        throw new Error("No Google credential received.");
      }

      const res = await googleAuth({
        credential: response.credential,
        targetRole: roleTarget,
      });

      if (res.token) {
        localStorage.setItem("token", res.token);
      }

      if (onSuccess) {
        onSuccess(res);
      }
    } catch (err) {
      console.error("Google Auth error:", err);
      setError(err.message || "Google Sign-In failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualFallbackClick = async () => {
    try {
      setLoading(true);
      setError("");

      if (hasValidClientId && window.google?.accounts?.id) {
        window.google.accounts.id.prompt();
        setLoading(false);
        return;
      }

      const email = prompt("Enter your Google Account Email Address to sign in:", "user@gmail.com");
      if (!email) {
        setLoading(false);
        return;
      }

      const name = email.split("@")[0];
      const res = await googleAuth({
        email,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        googleId: `google_${Date.now()}`,
        targetRole: roleTarget,
      });

      if (res.token) {
        localStorage.setItem("token", res.token);
      }

      if (onSuccess) {
        onSuccess(res);
      }
    } catch (err) {
      setError(err.message || "Google Sign-In failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-2 p-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
          {error}
        </div>
      )}

      {/* Render Google Identity Services Button Container if valid Client ID exists */}
      {hasValidClientId ? (
        <div ref={googleBtnRef} className="w-full mb-1 min-h-[44px]"></div>
      ) : (
        <button
          type="button"
          onClick={handleManualFallbackClick}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-300 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm shadow-sm transition duration-200"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{loading ? "Authenticating..." : buttonText}</span>
        </button>
      )}
    </div>
  );
};

export default GoogleLoginButton;
