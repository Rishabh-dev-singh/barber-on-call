 import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL as API_BASE, getAccessToken, clearAuthSession } from "../../services/api";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
} from "../../components/common/Icons";

function ChangePassword() {
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const token = getAccessToken("customer");
    if (!token) {
      navigate("/customer/login");
      return;
    }

    if (!currentPassword) {
      setError("Please enter your current password.");
      return;
    }

    if (!newPassword) {
      setError("Please enter your new password.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("New password must be different from current password.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`${API_BASE}/api/accounts/change-password/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      if (response.status === 401) {
        clearAuthSession();
        navigate("/customer/login");
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        setError(data.detail || "Unable to change password.");
        return;
      }

      setSuccess("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate(-1);
      }, 1200);
    } catch (err) {
      console.error("Change Password Error:", err);
      setError("Unable to connect to server.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto", padding: "16px", boxSizing: "border-box" }}>
      <div style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "18px",
        padding: "24px 20px",
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
        display: "flex",
        flexDirection: "column",
        gap: "18px"
      }}>
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#151515", margin: "0 0 4px 0" }}>
            Update Security Credentials
          </h2>
          <p style={{ margin: 0, fontSize: "12.5px", color: "#6E6E6E" }}>
            Create a strong, secure password for your account
          </p>
        </div>

        {error && (
          <div style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", padding: "12px", borderRadius: "10px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
            <AlertCircle size={15} color="#DC2626" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0", color: "#16A34A", padding: "12px", borderRadius: "10px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
            <CheckCircle size={15} color="#16A34A" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "5px" }}>
              Current Password
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                type={showCurrent ? "text" : "password"}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                style={{ width: "100%", padding: "11px 38px 11px 12px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.12)", fontSize: "13.5px", boxSizing: "border-box" }}
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                style={{ position: "absolute", right: "12px", background: "none", border: "none", cursor: "pointer" }}
              >
                {showCurrent ? <EyeOff size={16} color="#6E6E6E" /> : <Eye size={16} color="#6E6E6E" />}
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "5px" }}>
              New Password (min 6 characters)
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                type={showNew ? "text" : "password"}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ width: "100%", padding: "11px 38px 11px 12px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.12)", fontSize: "13.5px", boxSizing: "border-box" }}
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                style={{ position: "absolute", right: "12px", background: "none", border: "none", cursor: "pointer" }}
              >
                {showNew ? <EyeOff size={16} color="#6E6E6E" /> : <Eye size={16} color="#6E6E6E" />}
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "5px" }}>
              Confirm New Password
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ width: "100%", padding: "11px 38px 11px 12px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.12)", fontSize: "13.5px", boxSizing: "border-box" }}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={{ position: "absolute", right: "12px", background: "none", border: "none", cursor: "pointer" }}
              >
                {showConfirm ? <EyeOff size={16} color="#6E6E6E" /> : <Eye size={16} color="#6E6E6E" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              marginTop: "8px",
              padding: "12px",
              borderRadius: "10px",
              backgroundColor: "#D4A017",
              color: "#151515",
              fontWeight: "750",
              fontSize: "13.5px",
              border: "none",
              cursor: saving ? "not-allowed" : "pointer"
            }}
          >
            {saving ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChangePassword;