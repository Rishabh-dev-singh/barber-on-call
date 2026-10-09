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
    step: 1, // 1: enter mobile, 2: enter 4-digit OTP & new password
    mobile: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
    showNewPassword: false,
    showConfirmPassword: false,
    timer: 0,
    loading: false,
    error: "",
  });

  // Countdown timer for Forgot Password OTP cooldown
  useEffect(() => {
    if (forgotModal.timer > 0) {
      const timer = setTimeout(() => {
        setForgotModal((prev) => ({ ...prev, timer: prev.timer - 1 }));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [forgotModal.timer]);

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

  const handleForgotSendOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanPhone = forgotModal.mobile.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      setForgotModal((prev) => ({ ...prev, error: "Please enter a valid 10-digit mobile number." }));
      return;
    }

    try {
      setForgotModal((prev) => ({ ...prev, loading: true, error: "" }));
      const res = await fetch(`${API_BASE_URL}/api/accounts/forgot-password/send-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone }),
      });

      const data = await res.json();
      if (!res.ok) {
        const err = data.detail || data.message || "Failed to send reset OTP.";
        setForgotModal((prev) => ({ ...prev, error: err }));
        if (showToast) showToast(err, "error");
        return;
      }

      setForgotModal((prev) => ({
        ...prev,
        step: 2,
        timer: 30,
        error: "",
        otp: "",
        newPassword: "",
        confirmPassword: "",
      }));

      if (showToast) {
        showToast(`Reset code sent to +91 ${cleanPhone}!`, "success");
      }
    } catch (err) {
      console.error("Forgot OTP Error:", err);
      setForgotModal((prev) => ({ ...prev, error: "Network error while sending OTP. Please try again." }));
    } finally {
      setForgotModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleForgotResetPassword = async (e) => {
    if (e) e.preventDefault();
    const cleanPhone = forgotModal.mobile.replace(/\D/g, "");
    const cleanOtp = forgotModal.otp.trim();

    if (cleanOtp.length !== 4) {
      setForgotModal((prev) => ({ ...prev, error: "Please enter the 4-digit OTP sent to your phone." }));
      return;
    }

    if (forgotModal.newPassword.length < 6) {
      setForgotModal((prev) => ({ ...prev, error: "New password must be at least 6 characters." }));
      return;
    }

    if (forgotModal.newPassword !== forgotModal.confirmPassword) {
      setForgotModal((prev) => ({ ...prev, error: "New password and Confirm password do not match." }));
      return;
    }

    try {
      setForgotModal((prev) => ({ ...prev, loading: true, error: "" }));
      const res = await fetch(`${API_BASE_URL}/api/accounts/forgot-password/reset/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: cleanPhone,
          otp: cleanOtp,
          new_password: forgotModal.newPassword,
          confirm_password: forgotModal.confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const err = data.detail || data.message || "Failed to reset password.";
        setForgotModal((prev) => ({ ...prev, error: err }));
        if (showToast) showToast(err, "error");
        return;
      }

      if (showToast) {
        showToast("Password reset successfully! Please login with your new password.", "success");
      } else {
        alert("Password reset successfully! Please login.");
      }

      setMobile(cleanPhone);
      setPassword("");
      setForgotModal({
        isOpen: false,
        step: 1,
        mobile: "",
        otp: "",
        newPassword: "",
        confirmPassword: "",
        showNewPassword: false,
        showConfirmPassword: false,
        timer: 0,
        loading: false,
        error: "",
      });
    } catch (err) {
      console.error("Password reset error:", err);
      setForgotModal((prev) => ({ ...prev, error: "Network error. Please try again." }));
    } finally {
      setForgotModal((prev) => ({ ...prev, loading: false }));
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
                onClick={() => setForgotModal({
                  isOpen: true,
                  step: 1,
                  mobile: mobile,
                  otp: "",
                  newPassword: "",
                  confirmPassword: "",
                  showNewPassword: false,
                  showConfirmPassword: false,
                  timer: 0,
                  loading: false,
                  error: ""
                })}
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

      {/* ================= FORGOT PASSWORD / OTP RESET MODAL ================= */}
      {forgotModal.isOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.65)",
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
            maxWidth: "410px",
            padding: "24px 20px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
            maxHeight: "90vh",
            overflowY: "auto"
          }}>
            {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  backgroundColor: "#FAF7EF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Lock size={16} color="#D4A017" />
                </div>
                <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#151515", margin: 0 }}>
                  {forgotModal.step === 1 ? "Reset Password" : "Set New Password"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setForgotModal((prev) => ({ ...prev, isOpen: false, error: "" }))}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}
                aria-label="Close"
              >
                <X size={20} color="#6E6E6E" />
              </button>
            </div>

            {/* Error Banner */}
            {forgotModal.error && (
              <div style={{
                backgroundColor: "#FEE2E2",
                border: "1px solid #FCA5A5",
                color: "#DC2626",
                padding: "10px 12px",
                borderRadius: "10px",
                fontSize: "12.5px",
                fontWeight: "600",
                lineHeight: "1.4"
              }}>
                {forgotModal.error}
              </div>
            )}

            {/* STEP 1: Enter Mobile Number */}
            {forgotModal.step === 1 && (
              <form onSubmit={handleForgotSendOtp} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <p style={{ margin: 0, fontSize: "13px", color: "#6E6E6E", lineHeight: "1.5" }}>
                  Enter your registered mobile number. We will send a 4-digit verification code to reset your password.
                </p>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "5px" }}>
                    Registered Mobile Number *
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
                      value={forgotModal.mobile}
                      onChange={(e) => setForgotModal((prev) => ({ ...prev, mobile: e.target.value.replace(/\D/g, ""), error: "" }))}
                      style={{
                        width: "100%",
                        padding: "11px 14px 11px 64px",
                        borderRadius: "10px",
                        border: "1px solid rgba(0, 0, 0, 0.12)",
                        fontSize: "14px",
                        boxSizing: "border-box",
                        fontFamily: "inherit"
                      }}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotModal.loading || forgotModal.mobile.length !== 10}
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    backgroundColor: (forgotModal.loading || forgotModal.mobile.length !== 10) ? "#E5E7EB" : "#D4A017",
                    color: (forgotModal.loading || forgotModal.mobile.length !== 10) ? "#9CA3AF" : "#151515",
                    fontWeight: "800",
                    fontSize: "13.5px",
                    border: "none",
                    cursor: (forgotModal.loading || forgotModal.mobile.length !== 10) ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    marginTop: "4px"
                  }}
                >
                  <span>{forgotModal.loading ? "Sending Code..." : "Send Verification Code"}</span>
                  <ArrowRight size={15} />
                </button>
              </form>
            )}

            {/* STEP 2: Enter OTP & New Password */}
            {forgotModal.step === 2 && (
              <form onSubmit={handleForgotResetPassword} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {/* Mobile Info Tag */}
                <div style={{
                  backgroundColor: "#F0FDF4",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid #BBF7D0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <ShieldCheck size={16} color="#16A34A" />
                    <span style={{ fontSize: "12px", color: "#166534", fontWeight: "600" }}>
                      Sent to +91 {forgotModal.mobile}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForgotModal((prev) => ({ ...prev, step: 1, error: "" }))}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#166534",
                      fontSize: "11.5px",
                      fontWeight: "700",
                      cursor: "pointer",
                      textDecoration: "underline"
                    }}
                  >
                    Change
                  </button>
                </div>

                {/* 4-digit OTP */}
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "5px" }}>
                    Enter 4-Digit OTP *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="• • • •"
                    value={forgotModal.otp}
                    onChange={(e) => setForgotModal((prev) => ({ ...prev, otp: e.target.value.replace(/\D/g, "").slice(0, 4), error: "" }))}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: "1.5px solid #86EFAC",
                      fontSize: "18px",
                      fontWeight: "800",
                      letterSpacing: "8px",
                      textAlign: "center",
                      backgroundColor: "#FFFFFF",
                      boxSizing: "border-box",
                      outline: "none"
                    }}
                    required
                    autoFocus
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "5px" }}>
                    <span style={{ fontSize: "11.5px", color: "#6E6E6E" }}>
                      Didn't receive code?
                    </span>
                    <button
                      type="button"
                      onClick={handleForgotSendOtp}
                      disabled={forgotModal.timer > 0 || forgotModal.loading}
                      style={{
                        background: "none",
                        border: "none",
                        color: forgotModal.timer > 0 ? "#9CA3AF" : "#16A34A",
                        fontSize: "11.5px",
                        fontWeight: "700",
                        cursor: (forgotModal.timer > 0 || forgotModal.loading) ? "not-allowed" : "pointer",
                        padding: 0
                      }}
                    >
                      {forgotModal.loading ? "Sending..." : forgotModal.timer > 0 ? `Resend in ${forgotModal.timer}s` : "Resend OTP"}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "5px" }}>
                    New Password *
                  </label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <div style={{ position: "absolute", left: "12px", pointerEvents: "none" }}>
                      <Lock size={15} color="#D4A017" />
                    </div>
                    <input
                      type={forgotModal.showNewPassword ? "text" : "password"}
                      placeholder="Enter new password (min 6 chars)"
                      value={forgotModal.newPassword}
                      onChange={(e) => setForgotModal((prev) => ({ ...prev, newPassword: e.target.value, error: "" }))}
                      style={{
                        width: "100%",
                        padding: "10px 38px 10px 36px",
                        borderRadius: "10px",
                        border: "1px solid rgba(0, 0, 0, 0.12)",
                        fontSize: "13px",
                        boxSizing: "border-box",
                        fontFamily: "inherit"
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setForgotModal((prev) => ({ ...prev, showNewPassword: !prev.showNewPassword }))}
                      style={{ position: "absolute", right: "10px", background: "none", border: "none", cursor: "pointer", padding: "2px" }}
                    >
                      {forgotModal.showNewPassword ? <EyeOff size={15} color="#6E6E6E" /> : <Eye size={15} color="#6E6E6E" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "5px" }}>
                    Confirm New Password *
                  </label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <div style={{ position: "absolute", left: "12px", pointerEvents: "none" }}>
                      <Lock size={15} color="#D4A017" />
                    </div>
                    <input
                      type={forgotModal.showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter new password"
                      value={forgotModal.confirmPassword}
                      onChange={(e) => setForgotModal((prev) => ({ ...prev, confirmPassword: e.target.value, error: "" }))}
                      style={{
                        width: "100%",
                        padding: "10px 38px 10px 36px",
                        borderRadius: "10px",
                        border: "1px solid rgba(0, 0, 0, 0.12)",
                        fontSize: "13px",
                        boxSizing: "border-box",
                        fontFamily: "inherit"
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setForgotModal((prev) => ({ ...prev, showConfirmPassword: !prev.showConfirmPassword }))}
                      style={{ position: "absolute", right: "10px", background: "none", border: "none", cursor: "pointer", padding: "2px" }}
                    >
                      {forgotModal.showConfirmPassword ? <EyeOff size={15} color="#6E6E6E" /> : <Eye size={15} color="#6E6E6E" />}
                    </button>
                  </div>
                </div>

                {/* Submit Reset CTA */}
                <button
                  type="submit"
                  disabled={forgotModal.loading}
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    backgroundColor: forgotModal.loading ? "#E5E7EB" : "#D4A017",
                    color: forgotModal.loading ? "#9CA3AF" : "#151515",
                    fontWeight: "800",
                    fontSize: "13.5px",
                    border: "none",
                    cursor: forgotModal.loading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    marginTop: "6px"
                  }}
                >
                  <span>{forgotModal.loading ? "Updating Password..." : "Reset Password"}</span>
                  <ArrowRight size={15} />
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerLogin;