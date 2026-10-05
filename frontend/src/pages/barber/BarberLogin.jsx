import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { API_BASE_URL } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import {
  Store,
  Eye,
  EyeOff,
  Phone,
  Lock,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
  X,
} from "../../components/common/Icons";

function BarberLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { login, userRole, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (isAuthenticated && userRole === "barber") {
      navigate("/barber/dashboard", { replace: true });
    }
  }, [isAuthenticated, userRole, navigate]);

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [forgotModal, setForgotModal] = useState({
    isOpen: false,
    mobile: "",
  });

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!loginId || !password) {
      if (showToast) {
        showToast("Please enter login ID and password.", "warning");
      } else {
        alert("Please enter login ID and password.");
      }
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/accounts/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: loginId.trim(),
          password: password,
          role: "barber",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errMsg = data.detail || "Invalid login ID or password.";
        if (showToast) {
          showToast(errMsg, "error");
        } else {
          alert(errMsg);
        }
        return;
      }

      // Save tokens in unified AuthContext
      login({
        access: data.access,
        refresh: data.refresh,
        role: "barber",
        name: data.name,
        username: data.username,
        user_id: data.user_id,
      });

      if (showToast) {
        showToast("Barber login successful! Welcome.", "success");
      }

      const redirectTo = location.state?.from?.pathname || "/barber/dashboard";
      setTimeout(() => {
        navigate(redirectTo, { replace: true });
      }, 400);

    } catch (error) {
      console.error("Login Error:", error);
      if (showToast) {
        showToast("Unable to connect to server.", "error");
      } else {
        alert("Unable to connect to server.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#FAF7EF",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px 16px",
      boxSizing: "border-box"
    }}>
      <div style={{
        maxWidth: "420px",
        width: "100%",
        backgroundColor: "#FFFFFF",
        borderRadius: "20px",
        padding: "32px 24px",
        boxShadow: "0 6px 24px rgba(0, 0, 0, 0.06)",
        border: "1px solid rgba(0, 0, 0, 0.06)",
        boxSizing: "border-box"
      }}>
        {/* Brand Logo */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{
            width: "52px",
            height: "52px",
            borderRadius: "14px",
            backgroundColor: "#151515",
            border: "1px solid rgba(212, 160, 23, 0.4)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "12px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)"
          }}>
            <Store size={26} color="#D4A017" />
          </div>

          <h1 style={{ fontSize: "22px", fontWeight: "800", color: "#151515", margin: "0 0 6px 0", letterSpacing: "-0.4px" }}>
            Barber Partner Login
          </h1>
          <p style={{ margin: 0, fontSize: "13px", color: "#6E6E6E" }}>
            Access your appointments schedule and earnings
          </p>
        </div>

        {isAuthenticated && userRole === "customer" && (
          <div style={{
            backgroundColor: "#FFFBEB",
            border: "1px solid #F59E0B",
            borderRadius: "12px",
            padding: "10px 14px",
            marginBottom: "16px",
            fontSize: "12.5px",
            color: "#92400E",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            lineHeight: "1.4"
          }}>
            <span>Logged in as <strong>Customer</strong>. Logging in here will switch to Barber.</span>
            <button
              type="button"
              onClick={() => logout()}
              style={{
                background: "none",
                border: "none",
                color: "#DC2626",
                fontWeight: "700",
                cursor: "pointer",
                padding: "2px 4px",
                fontSize: "12px",
                textDecoration: "underline"
              }}
            >
              Sign Out Customer
            </button>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Login ID / Mobile */}
          <div>
            <label style={{ fontSize: "12.5px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "6px" }}>
              Mobile Number / Login ID
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <div style={{ position: "absolute", left: "14px", pointerEvents: "none" }}>
                <Phone size={15} color="#D4A017" />
              </div>
              <input
                type="text"
                placeholder="Enter mobile or username"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px 12px 40px",
                  borderRadius: "12px",
                  border: "1px solid rgba(0, 0, 0, 0.12)",
                  fontSize: "14px",
                  color: "#151515",
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "inherit"
                }}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label style={{ fontSize: "12.5px", fontWeight: "700", color: "#151515" }}>
                Password
              </label>
              <button
                type="button"
                onClick={() => setForgotModal({ isOpen: true, mobile: loginId })}
                style={{
                  background: "none",
                  border: "none",
                  color: "#D4A017",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                  padding: 0
                }}
              >
                Forgot Password?
              </button>
            </div>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <div style={{ position: "absolute", left: "14px", pointerEvents: "none" }}>
                <Lock size={15} color="#D4A017" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 42px 12px 40px",
                  borderRadius: "12px",
                  border: "1px solid rgba(0, 0, 0, 0.12)",
                  fontSize: "14px",
                  color: "#151515",
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "inherit"
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center"
                }}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={16} color="#6E6E6E" /> : <Eye size={16} color="#6E6E6E" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "8px",
              padding: "13px",
              borderRadius: "12px",
              backgroundColor: loading ? "#CCCCCC" : "#151515",
              color: "#FAF7EF",
              fontWeight: "800",
              fontSize: "14px",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 3px 12px rgba(0, 0, 0, 0.2)",
              transition: "transform 0.15s ease"
            }}
          >
            <span>{loading ? "Authenticating..." : "Login as Barber"}</span>
            <ArrowRight size={16} color="#D4A017" />
          </button>
        </form>

        {/* Footer Actions */}
        <div style={{ marginTop: "24px", textAlign: "center", display: "flex", flexDirection: "column", gap: "12px" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "#6E6E6E" }}>
            Want to partner with us?{" "}
            <Link to="/barber/apply" style={{ color: "#D4A017", fontWeight: "700", textDecoration: "none" }}>
              Barber Application
            </Link>
          </p>

          <Link
            to="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              fontSize: "12.5px",
              color: "#151515",
              fontWeight: "600",
              textDecoration: "none"
            }}
          >
            <ChevronLeft size={15} color="#151515" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      {forgotModal.isOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "16px"
        }}>
          <div style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "20px",
            width: "100%",
            maxWidth: "380px",
            padding: "24px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "14px"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#151515", margin: 0 }}>
                Barber Account Recovery
              </h3>
              <button
                type="button"
                onClick={() => setForgotModal({ isOpen: false, mobile: "" })}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={18} color="#6E6E6E" />
              </button>
            </div>
            <p style={{ margin: 0, fontSize: "12.5px", color: "#6E6E6E" }}>
              Please contact the Barber On Call Partner Support desk at <strong>support@barberoncall.com</strong> or call admin directly to reset your partner credentials.
            </p>
            <button
              type="button"
              onClick={() => setForgotModal({ isOpen: false, mobile: "" })}
              style={{
                padding: "11px",
                borderRadius: "10px",
                backgroundColor: "#D4A017",
                color: "#151515",
                fontWeight: "750",
                fontSize: "13px",
                border: "none",
                cursor: "pointer"
              }}
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BarberLogin;