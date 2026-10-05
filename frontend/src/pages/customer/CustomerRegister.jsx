import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../services/api";
import { useToast } from "../../context/ToastContext";
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
  RefreshCw,
} from "../../components/common/Icons";

function CustomerRegister() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [loadingCaptcha, setLoadingCaptcha] = useState(false);

  const fetchCaptcha = async () => {
    try {
      setLoadingCaptcha(true);
      const res = await fetch(`${API_BASE_URL}/api/accounts/captcha/`);
      if (res.ok) {
        const data = await res.json();
        setCaptchaQuestion(data.question);
        setCaptchaToken(data.captcha_token);
        setCaptchaAnswer("");
      }
    } catch (err) {
      console.error("Failed to load captcha:", err);
    } finally {
      setLoadingCaptcha(false);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      if (showToast) showToast("Please enter your full name.", "warning");
      else alert("Please enter your full name.");
      return;
    }

    if (formData.mobile.length !== 10) {
      if (showToast) showToast("Please enter a valid 10-digit mobile number.", "warning");
      else alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      if (showToast) showToast("Password and Confirm Password do not match.", "warning");
      else alert("Password and Confirm Password do not match.");
      return;
    }

    if (!captchaAnswer.trim()) {
      if (showToast) showToast("Please answer the security verification question.", "warning");
      else alert("Please answer the security verification question.");
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
          username: formData.mobile,
          email: formData.email,
          password: formData.password,
          phone: formData.mobile,
          role: "customer",
          captcha_token: captchaToken,
          captcha_answer: captchaAnswer.trim(),
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
        } else if (data.captcha_answer) {
          errorMsg = Array.isArray(data.captcha_answer) ? data.captcha_answer[0] : data.captcha_answer;
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

        fetchCaptcha();
        return;
      }

      if (showToast) {
        showToast("Account created successfully! Please login.", "success");
      } else {
        alert("Account created successfully! Please login.");
      }

      setTimeout(() => {
        navigate("/customer/login");
      }, 500);
    } catch (err) {
      console.error("Registration error:", err);
      if (showToast) {
        showToast("Server connection error. Please try again.", "error");
      } else {
        alert("Server connection error.");
      }
      fetchCaptcha();
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
      padding: "24px 16px",
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

          {/* Mobile Number */}
          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "5px" }}>
              Mobile Number *
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
                name="mobile"
                maxLength={10}
                placeholder="Enter 10-digit mobile"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, "") })}
                style={{
                  width: "100%",
                  padding: "11px 14px 11px 64px",
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

          {/* Security Captcha Challenge */}
          <div style={{ backgroundColor: "#FAF7EF", padding: "12px", borderRadius: "10px", border: "1px solid rgba(212, 160, 23, 0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#D4A017", textTransform: "uppercase" }}>
                Security Check
              </span>
              <button
                type="button"
                onClick={fetchCaptcha}
                disabled={loadingCaptcha}
                style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#6E6E6E" }}
              >
                <RefreshCw size={11} className={loadingCaptcha ? "spin-icon" : ""} />
                <span>Reload</span>
              </button>
            </div>

            <div style={{ fontSize: "13px", fontWeight: "700", color: "#151515", marginBottom: "6px" }}>
              {loadingCaptcha ? "Generating math problem..." : `${captchaQuestion} = ?`}
            </div>

            <input
              type="text"
              placeholder="Your answer"
              value={captchaAnswer}
              onChange={(e) => setCaptchaAnswer(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "8px",
                border: "1px solid rgba(0,0,0,0.12)",
                fontSize: "13px",
                backgroundColor: "#FFFFFF",
                boxSizing: "border-box"
              }}
              required
            />
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