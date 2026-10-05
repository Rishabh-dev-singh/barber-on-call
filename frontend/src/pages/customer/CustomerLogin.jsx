import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { API_BASE_URL } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import {
  Scissors,
  Eye,
  EyeOff,
  Phone,
  Lock,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
  X,
  Clock,
} from "../../components/common/Icons";

function CustomerLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { login, userRole, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (isAuthenticated && userRole === "customer") {
      navigate("/customer/dashboard", { replace: true });
    }
  }, [isAuthenticated, userRole, navigate]);

  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot Password / OTP modal state
  const [forgotModal, setForgotModal] = useState({
    isOpen: false,
    step: 1, // 1: enter mobile, 2: enter 6-digit OTP & new password
    mobile: "",
    otp: ["", "", "", "", "", ""],
    newPassword: "",
    timer: 60,
    loading: false,
    error: "",
  });

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!mobile || !password) {
      if (showToast) {
        showToast("Please enter mobile number and password.", "warning");
      } else {
        alert("Please enter mobile number and password.");
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
          username: mobile.trim(),
          password: password,
          role: "customer",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errMsg = data.detail || "Invalid mobile number or password.";
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
        role: "customer",
        name: data.name,
        username: data.username,
        user_id: data.user_id,
      });

      if (showToast) {
        showToast("Welcome back! Login successful.", "success");
      }

      const redirectTo = location.state?.from?.pathname || "/customer/barbers";
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

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...forgotModal.otp];
    newOtp[index] = value;
    setForgotModal({ ...forgotModal, otp: newOtp });

    // Focus next input automatically
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
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
            <Scissors size={26} color="#D4A017" />
          </div>

          <h1 style={{ fontSize: "22px", fontWeight: "800", color: "#151515", margin: "0 0 6px 0", letterSpacing: "-0.4px" }}>
            Customer Login
          </h1>
          <p style={{ margin: 0, fontSize: "13px", color: "#6E6E6E" }}>
            Access your bookings and favourite barbers
          </p>
        </div>

        {isAuthenticated && userRole === "barber" && (
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
            <span>Logged in as <strong>Barber</strong>. Logging in here will switch to Customer.</span>
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
              Sign Out Barber
            </button>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Mobile Number */}
          <div>
            <label style={{ fontSize: "12.5px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "6px" }}>
              Mobile Number
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <div style={{
                position: "absolute",
                left: "12px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                color: "#6E6E6E",
                fontSize: "13px",
                fontWeight: "600",
                pointerEvents: "none"
              }}>
                <Phone size={14} color="#D4A017" />
                <span>+91</span>
              </div>
              <input
                type="tel"
                maxLength={10}
                placeholder="Enter 10-digit mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                style={{
                  width: "100%",
                  padding: "12px 14px 12px 64px",
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
                onClick={() => setForgotModal({ ...forgotModal, isOpen: true, step: 1, mobile: mobile })}
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
              backgroundColor: loading ? "#CCCCCC" : "#D4A017",
              color: "#151515",
              fontWeight: "800",
              fontSize: "14px",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 3px 12px rgba(212, 160, 23, 0.35)",
              transition: "transform 0.15s ease"
            }}
          >
            <span>{loading ? "Authenticating..." : "Login"}</span>
            <ArrowRight size={16} color="#151515" />
          </button>
        </form>

        {/* Footer Actions */}
        <div style={{ marginTop: "24px", textAlign: "center", display: "flex", flexDirection: "column", gap: "12px" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "#6E6E6E" }}>
            Don't have an account?{" "}
            <Link to="/customer/register" style={{ color: "#D4A017", fontWeight: "700", textDecoration: "none" }}>
              Create Account
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

      {/* ================= ACCOUNT RECOVERY / ASSISTANCE MODAL ================= */}
      {forgotModal.isOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "16px",
          boxSizing: "border-box"
        }}>
          <div style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "20px",
            width: "100%",
            maxWidth: "400px",
            padding: "24px 20px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: "16px"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#151515", margin: 0 }}>
                Account Recovery
              </h3>
              <button
                type="button"
                onClick={() => setForgotModal({ ...forgotModal, isOpen: false })}
                style={{ background: "none", border: "none", cursor: "pointer" }}
                aria-label="Close"
              >
                <X size={18} color="#6E6E6E" />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <p style={{ margin: 0, fontSize: "13px", color: "#444444", lineHeight: "1.5" }}>
                For your account security, password resets are processed through our verified customer care desk.
              </p>

              <div style={{
                backgroundColor: "#FAF7EF",
                borderRadius: "12px",
                padding: "14px",
                border: "1px solid rgba(212, 160, 23, 0.3)",
                display: "flex",
                flexDirection: "column",
                gap: "6px"
              }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#D4A017", textTransform: "uppercase" }}>
                  Customer Care Desk
                </span>
                <span style={{ fontSize: "13px", color: "#151515" }}>
                  Email: <strong>support@barberoncall.com</strong>
                </span>
                <span style={{ fontSize: "12px", color: "#6E6E6E" }}>
                  Registered Mobile: <strong>{mobile ? `+91 ${mobile}` : "Not specified"}</strong>
                </span>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                <a
                  href={`mailto:support@barberoncall.com?subject=Password%20Reset%20Request%20-%20Barber%20On%20Call&body=Hello%20Support%20Team,%0A%0APlease%20help%20me%20reset%20the%20password%20for%20my%20Barber%20On%20Call%20customer%20account.%0ARegistered%20Mobile:%20${mobile || ""}%0A%0AThank%20you.`}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    padding: "12px",
                    borderRadius: "10px",
                    backgroundColor: "#D4A017",
                    color: "#151515",
                    fontWeight: "750",
                    fontSize: "13px",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  Contact Support
                </a>
                <button
                  type="button"
                  onClick={() => setForgotModal({ ...forgotModal, isOpen: false })}
                  style={{
                    padding: "12px 18px",
                    borderRadius: "10px",
                    backgroundColor: "#F3F4F6",
                    color: "#151515",
                    fontWeight: "650",
                    fontSize: "13px",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerLogin;