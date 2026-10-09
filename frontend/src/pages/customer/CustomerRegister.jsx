import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import {
  Scissors,
  Eye,
  EyeOff,
  User,
  Phone,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
} from "../../components/common/Icons";

function CustomerRegister() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Countdown timer for OTP cooldown
  useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setTimeout(() => {
        setOtpCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCooldown]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSendOtp = async () => {
    const cleaned = formData.mobile.replace(/\D/g, "");
    if (cleaned.length !== 10) {
      if (showToast) showToast("Please enter a valid 10-digit mobile number.", "warning");
      else alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    try {
      setSendingOtp(true);
      const res = await fetch(`${API_BASE_URL}/api/accounts/send-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleaned }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errMsg = data.detail || data.message || "Failed to send OTP.";
        if (showToast) showToast(errMsg, "error");
        else alert(errMsg);
        return;
      }

      setOtpSent(true);
      setOtpCooldown(30);
      if (showToast) {
        showToast(`OTP sent successfully to +91 ${cleaned}!`, "success");
      } else {
        alert(`OTP sent to +91 ${cleaned}`);
      }
    } catch (err) {
      console.error("Error sending OTP:", err);
      if (showToast) showToast("Network error while sending OTP. Please try again.", "error");
      else alert("Network error.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      if (showToast) showToast("Please enter your full name.", "warning");
      else alert("Please enter your full name.");
      return;
    }

    const cleanedMobile = formData.mobile.replace(/\D/g, "");
    if (cleanedMobile.length !== 10) {
      if (showToast) showToast("Please enter a valid 10-digit mobile number.", "warning");
      else alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!otpSent) {
      if (showToast) showToast("Please click 'Send OTP' to verify your phone number first.", "warning");
      else alert("Please click 'Send OTP' first.");
      return;
    }

    if (!otp.trim() || otp.trim().length !== 4) {
      if (showToast) showToast("Please enter the 4-digit OTP sent to your phone.", "warning");
      else alert("Please enter the 4-digit OTP.");
      return;
    }

    if (formData.password.length < 6) {
      if (showToast) showToast("Password must be at least 6 characters.", "warning");
      else alert("Password must be at least 6 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      if (showToast) showToast("Password and Confirm Password do not match.", "warning");
      else alert("Password and Confirm Password do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/accounts/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          username: cleanedMobile,
          email: formData.email.trim(),
          password: formData.password,
          phone: cleanedMobile,
          otp: otp.trim(),
          role: "customer",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMsg = "Registration failed. Please check your details.";

        if (typeof data === "string") {
          errorMsg = data;
        } else if (data.detail) {
          errorMsg = data.detail;
        } else if (data.message) {
          errorMsg = data.message;
        } else if (data.non_field_errors && data.non_field_errors.length) {
          errorMsg = data.non_field_errors[0];
        } else if (data.otp) {
          errorMsg = Array.isArray(data.otp) ? data.otp[0] : data.otp;
        } else if (data.password) {
          errorMsg = Array.isArray(data.password) ? data.password[0] : data.password;
        } else if (data.phone) {
          errorMsg = Array.isArray(data.phone) ? data.phone[0] : data.phone;
        } else if (data.username) {
          errorMsg = Array.isArray(data.username) ? data.username[0] : data.username;
        } else if (data.email) {
          errorMsg = Array.isArray(data.email) ? data.email[0] : data.email;
        } else if (data.name) {
          errorMsg = Array.isArray(data.name) ? data.name[0] : data.name;
        } else if (typeof data === "object") {
          for (const key of Object.keys(data)) {
            const val = data[key];
            if (Array.isArray(val) && val.length > 0 && typeof val[0] === "string") {
              errorMsg = `${val[0]}`;
              break;
            } else if (typeof val === "string") {
              errorMsg = val;
              break;
            }
          }
        }

        if (showToast) showToast(errorMsg, "error");
        else alert(errorMsg);
        return;
      }

      // If tokens returned, auto-login directly
      if (data.tokens && data.tokens.access) {
        login({
          access: data.tokens.access,
          refresh: data.tokens.refresh,
          role: "customer",
          name: data.user.name,
          username: data.user.username,
          user_id: data.user.id,
        });

        if (showToast) {
          showToast("Account created successfully! Welcome to Barber On Call.", "success");
        }
        setTimeout(() => {
          navigate("/customer/barbers", { replace: true });
        }, 500);
      } else {
        if (showToast) {
          showToast("Account created successfully! Please login.", "success");
        } else {
          alert("Account created successfully! Please login.");
        }
        setTimeout(() => {
          navigate("/customer/login");
        }, 500);
      }
    } catch (err) {
      console.error("Registration error:", err);
      if (showToast) {
        showToast("Server connection error. Please try again.", "error");
      } else {
        alert("Server connection error.");
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
      padding: "20px 12px",
      boxSizing: "border-box"
    }}>
      <div style={{
        maxWidth: "420px",
        width: "100%",
        backgroundColor: "#FFFFFF",
        borderRadius: "20px",
        padding: "28px 18px",
        boxShadow: "0 6px 24px rgba(0, 0, 0, 0.06)",
        border: "1px solid rgba(0, 0, 0, 0.06)",
        boxSizing: "border-box"
      }}>
        {/* Brand Logo */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
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
            Create Account
          </h1>
          <p style={{ margin: 0, fontSize: "13px", color: "#6E6E6E" }}>
            Join Barber On Call for premium doorstep grooming
          </p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Full Name */}
          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "5px" }}>
              Full Name *
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <div style={{ position: "absolute", left: "12px", pointerEvents: "none" }}>
                <User size={15} color="#D4A017" />
              </div>
              <input
                type="text"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "11px 14px 11px 38px",
                  borderRadius: "10px",
                  border: "1px solid rgba(0, 0, 0, 0.12)",
                  fontSize: "13.5px",
                  boxSizing: "border-box",
                  fontFamily: "inherit"
                }}
                required
              />
            </div>
          </div>

          {/* Mobile Number + Send OTP */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515" }}>
                Mobile Number *
              </label>
              {otpSent && (
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#D4A017",
                    fontSize: "11.5px",
                    fontWeight: "700",
                    cursor: "pointer",
                    padding: 0
                  }}
                >
                  Change Number
                </button>
              )}
            </div>

            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <div style={{ position: "relative", display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
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
                  name="mobile"
                  maxLength={10}
                  placeholder="Enter 10-digit mobile"
                  value={formData.mobile}
                  disabled={otpSent}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setFormData({ ...formData, mobile: val });
                    if (otpSent && val !== formData.mobile) {
                      setOtpSent(false);
                      setOtp("");
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "11px 14px 11px 64px",
                    borderRadius: "10px",
                    border: "1px solid rgba(0, 0, 0, 0.12)",
                    fontSize: "13.5px",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                    backgroundColor: otpSent ? "#F9FAFB" : "#FFFFFF",
                    color: otpSent ? "#4B5563" : "#151515",
                  }}
                  required
                />
              </div>

              {!otpSent && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={formData.mobile.length !== 10 || sendingOtp}
                  style={{
                    padding: "11px 14px",
                    borderRadius: "10px",
                    backgroundColor: formData.mobile.length === 10 && !sendingOtp ? "#D4A017" : "#E5E7EB",
                    color: formData.mobile.length === 10 && !sendingOtp ? "#151515" : "#9CA3AF",
                    fontWeight: "700",
                    fontSize: "12px",
                    border: "none",
                    cursor: formData.mobile.length === 10 && !sendingOtp ? "pointer" : "not-allowed",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    transition: "all 0.2s ease"
                  }}
                >
                  {sendingOtp ? "Sending..." : "Send OTP"}
                </button>
              )}
            </div>
          </div>

          {/* OTP Verification Box (Shows after OTP is sent) */}
          {otpSent && (
            <div style={{
              backgroundColor: "#F0FDF4",
              padding: "14px",
              borderRadius: "12px",
              border: "1px solid #BBF7D0",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              boxSizing: "border-box"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <ShieldCheck size={16} color="#16A34A" />
                  <span style={{ fontSize: "12.5px", fontWeight: "700", color: "#166534" }}>
                    Enter 4-Digit OTP
                  </span>
                </div>
                <span style={{ fontSize: "11.5px", color: "#166534", fontWeight: "600" }}>
                  Sent to +91 {formData.mobile}
                </span>
              </div>

              {/* Full-width OTP Input (Mobile Friendly) */}
              <div style={{ width: "100%" }}>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="• • • •"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  style={{
                    width: "100%",
                    padding: "11px 12px",
                    borderRadius: "10px",
                    border: "1.5px solid #86EFAC",
                    fontSize: "20px",
                    fontWeight: "800",
                    letterSpacing: "10px",
                    textAlign: "center",
                    backgroundColor: "#FFFFFF",
                    boxSizing: "border-box",
                    outline: "none",
                    color: "#151515"
                  }}
                  required
                />
              </div>

              {/* Resend Action Row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "2px" }}>
                <span style={{ fontSize: "11.5px", color: "#4B5563" }}>
                  Didn't receive code?
                </span>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpCooldown > 0 || sendingOtp}
                  style={{
                    background: "none",
                    border: "none",
                    color: otpCooldown > 0 ? "#6B7280" : "#16A34A",
                    fontSize: "12px",
                    fontWeight: "700",
                    cursor: (otpCooldown > 0 || sendingOtp) ? "not-allowed" : "pointer",
                    padding: "2px 4px",
                    textDecoration: otpCooldown > 0 ? "none" : "underline"
                  }}
                >
                  {sendingOtp ? "Sending..." : otpCooldown > 0 ? `Resend in ${otpCooldown}s` : "Resend OTP"}
                </button>
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "5px" }}>
              Email (Optional)
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <div style={{ position: "absolute", left: "12px", pointerEvents: "none" }}>
                <Mail size={15} color="#D4A017" />
              </div>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "11px 14px 11px 38px",
                  borderRadius: "10px",
                  border: "1px solid rgba(0, 0, 0, 0.12)",
                  fontSize: "13.5px",
                  boxSizing: "border-box",
                  fontFamily: "inherit"
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "5px" }}>
              Password *
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <div style={{ position: "absolute", left: "12px", pointerEvents: "none" }}>
                <Lock size={15} color="#D4A017" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Create password"
                value={formData.password}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "11px 38px 11px 38px",
                  borderRadius: "10px",
                  border: "1px solid rgba(0, 0, 0, 0.12)",
                  fontSize: "13.5px",
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
                  padding: "4px"
                }}
              >
                {showPassword ? <EyeOff size={16} color="#6E6E6E" /> : <Eye size={16} color="#6E6E6E" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "5px" }}>
              Confirm Password *
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <div style={{ position: "absolute", left: "12px", pointerEvents: "none" }}>
                <Lock size={15} color="#D4A017" />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "11px 38px 11px 38px",
                  borderRadius: "10px",
                  border: "1px solid rgba(0, 0, 0, 0.12)",
                  fontSize: "13.5px",
                  boxSizing: "border-box",
                  fontFamily: "inherit"
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px"
                }}
              >
                {showConfirmPassword ? <EyeOff size={16} color="#6E6E6E" /> : <Eye size={16} color="#6E6E6E" />}
              </button>
            </div>
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "4px",
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
              boxShadow: "0 3px 12px rgba(212, 160, 23, 0.35)"
            }}
          >
            <span>{loading ? "Creating Account..." : "Create Account"}</span>
            <ArrowRight size={16} color="#151515" />
          </button>
        </form>

        {/* Footer Actions */}
        <div style={{ marginTop: "20px", textAlign: "center", display: "flex", flexDirection: "column", gap: "10px" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "#6E6E6E" }}>
            Already have an account?{" "}
            <Link to="/customer/login" style={{ color: "#D4A017", fontWeight: "700", textDecoration: "none" }}>
              Customer Login
            </Link>
          </p>

          <Link
            to="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              fontSize: "12px",
              color: "#151515",
              fontWeight: "600",
              textDecoration: "none"
            }}
          >
            <ChevronLeft size={14} color="#151515" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default CustomerRegister;