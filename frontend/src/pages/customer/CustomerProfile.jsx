import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  API_BASE_URL as API_BASE,
  getAccessToken,
  clearAuthSession,
} from "../../services/api";
import {
  User,
  Mail,
  Phone,
  Camera,
  Lock,
  Calendar,
  LogOut,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Heart,
} from "../../components/common/Icons";
import Skeleton from "../../components/ui/Skeleton";

function CustomerProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    profile_picture: null,
    profile_picture_file: null,
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const token = getAccessToken("customer");
    if (!token) {
      navigate("/customer/login");
      return;
    }
    fetchProfile();
  }, [navigate]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const token = getAccessToken("customer");
      if (!token) {
        logoutCustomer();
        return;
      }

      const response = await fetch(`${API_BASE}/api/accounts/profile/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        logoutCustomer();
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        setError(data.detail || "Unable to load profile.");
        return;
      }

      setProfile({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        profile_picture: data.profile_picture || null,
        profile_picture_file: null,
      });

      setPreviewImage(data.profile_picture || null);
    } catch (err) {
      console.error("Profile Error:", err);
      setError("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const logoutCustomer = () => {
    clearAuthSession("customer");
    navigate("/customer/login");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
    setSuccess("");
    setError("");
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = 3 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("Profile picture must be 3 MB or smaller.");
      e.target.value = "";
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setPreviewImage(imageUrl);
    setProfile((prev) => ({
      ...prev,
      profile_picture_file: file,
    }));
    setSuccess("");
    setError("");
  };

  const handleSave = async () => {
    if (!profile.name.trim()) {
      setError("Please enter your name.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const formData = new FormData();
      formData.append("name", profile.name.trim());
      formData.append("email", profile.email.trim());
      formData.append("phone", profile.phone.trim());

      if (profile.profile_picture_file) {
        formData.append("profile_picture", profile.profile_picture_file);
      }

      const token = getAccessToken("customer");
      if (!token) {
        logoutCustomer();
        return;
      }

      const response = await fetch(`${API_BASE}/api/accounts/profile/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.status === 401) {
        logoutCustomer();
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        setError(data.detail || "Unable to update profile.");
        return;
      }

      const updated = data.profile || {};
      setProfile({
        name: updated.name || profile.name,
        email: updated.email || profile.email,
        phone: updated.phone || profile.phone,
        profile_picture: updated.profile_picture || profile.profile_picture,
        profile_picture_file: null,
      });

      setSuccess("Profile details updated successfully.");
    } catch (err) {
      console.error("Update Profile Error:", err);
      setError("Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <Skeleton variant="avatar" width="80px" height="80px" />
        <Skeleton variant="title" width="60%" />
        <Skeleton variant="card" height="150px" />
      </div>
    );
  }

  const initial = profile.name ? profile.name.trim().charAt(0).toUpperCase() : "C";

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto", padding: "16px 16px 40px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* ================= PROFILE CARD HEADER ================= */}
      <div style={{
        background: "linear-gradient(135deg, #151515 0%, #222222 100%)",
        borderRadius: "18px",
        padding: "20px",
        color: "#FAF7EF",
        border: "1px solid rgba(212, 160, 23, 0.25)",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
        display: "flex",
        alignItems: "center",
        gap: "16px"
      }}>
        {/* Avatar with Camera Trigger */}
        <div style={{ position: "relative" }}>
          {previewImage ? (
            <img
              src={previewImage}
              alt="Profile"
              style={{
                width: "68px",
                height: "68px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid #D4A017"
              }}
            />
          ) : (
            <div style={{
              width: "68px",
              height: "68px",
              borderRadius: "50%",
              backgroundColor: "rgba(212, 160, 23, 0.15)",
              border: "2px solid #D4A017",
              color: "#D4A017",
              fontSize: "24px",
              fontWeight: "800",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              {initial}
            </div>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            style={{
              position: "absolute",
              bottom: "-2px",
              right: "-2px",
              width: "26px",
              height: "26px",
              borderRadius: "50%",
              backgroundColor: "#D4A017",
              border: "2px solid #151515",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer"
            }}
            aria-label="Upload photo"
          >
            <Camera size={13} color="#151515" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            style={{ display: "none" }}
          />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#FAF7EF", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {profile.name || "Customer"}
            </h2>
            <ShieldCheck size={16} color="#16A34A" />
          </div>
          <p style={{ margin: "2px 0 0", fontSize: "12.5px", color: "rgba(250, 247, 239, 0.7)" }}>
            +91 {profile.phone || "No phone added"}
          </p>
          <div style={{ marginTop: "6px", display: "inline-block", backgroundColor: "rgba(212, 160, 23, 0.15)", color: "#D4A017", fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "10px" }}>
            Verified Customer
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", padding: "12px 14px", borderRadius: "12px", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertCircle size={16} color="#DC2626" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0", color: "#16A34A", padding: "12px 14px", borderRadius: "12px", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
          <CheckCircle size={16} color="#16A34A" />
          <span>{success}</span>
        </div>
      )}

      {/* ================= EDIT PROFILE DETAILS ================= */}
      <section style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "16px",
        padding: "18px 16px",
        border: "1px solid rgba(0, 0, 0, 0.06)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        display: "flex",
        flexDirection: "column",
        gap: "14px"
      }}>
        <h3 style={{ fontSize: "15px", fontWeight: "800", color: "#151515", margin: 0 }}>
          Personal Information
        </h3>

        <div>
          <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "5px" }}>
            Full Name
          </label>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <div style={{ position: "absolute", left: "12px", pointerEvents: "none" }}>
              <User size={15} color="#D4A017" />
            </div>
            <input
              type="text"
              name="name"
              value={profile.name}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "11px 14px 11px 38px",
                borderRadius: "10px",
                border: "1px solid rgba(0, 0, 0, 0.12)",
                fontSize: "13.5px",
                boxSizing: "border-box"
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "5px" }}>
            Mobile Number
          </label>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <div style={{ position: "absolute", left: "12px", pointerEvents: "none" }}>
              <Phone size={15} color="#D4A017" />
            </div>
            <input
              type="tel"
              name="phone"
              value={profile.phone}
              disabled
              style={{
                width: "100%",
                padding: "11px 14px 11px 38px",
                borderRadius: "10px",
                border: "1px solid rgba(0, 0, 0, 0.1)",
                backgroundColor: "#F9F9F9",
                color: "#6E6E6E",
                fontSize: "13.5px",
                boxSizing: "border-box"
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "5px" }}>
            Email Address
          </label>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <div style={{ position: "absolute", left: "12px", pointerEvents: "none" }}>
              <Mail size={15} color="#D4A017" />
            </div>
            <input
              type="email"
              name="email"
              value={profile.email}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "11px 14px 11px 38px",
                borderRadius: "10px",
                border: "1px solid rgba(0, 0, 0, 0.12)",
                fontSize: "13.5px",
                boxSizing: "border-box"
              }}
            />
          </div>
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          style={{
            marginTop: "6px",
            padding: "12px",
            borderRadius: "10px",
            backgroundColor: "#151515",
            color: "#FAF7EF",
            fontWeight: "700",
            fontSize: "13.5px",
            border: "none",
            cursor: saving ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px"
          }}
        >
          <span>{saving ? "Saving..." : "Save Changes"}</span>
        </button>
      </section>

      {/* ================= ACCOUNT SHORTCUTS ================= */}
      <section style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "16px",
        overflow: "hidden",
        border: "1px solid rgba(0, 0, 0, 0.06)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
      }}>
        <Link
          to="/customer/bookings"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            textDecoration: "none",
            borderBottom: "1px solid rgba(0,0,0,0.06)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Calendar size={18} color="#D4A017" />
            <span style={{ fontSize: "13.5px", fontWeight: "700", color: "#151515" }}>My Appointments</span>
          </div>
          <ArrowRight size={14} color="#6E6E6E" />
        </Link>

        <Link
          to="/customer/barbers?filter=favorites"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            textDecoration: "none",
            borderBottom: "1px solid rgba(0,0,0,0.06)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Heart size={18} color="#DC2626" />
            <span style={{ fontSize: "13.5px", fontWeight: "700", color: "#151515" }}>Favorite Barbers</span>
          </div>
          <ArrowRight size={14} color="#6E6E6E" />
        </Link>

        <Link
          to="/customer/change-password"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            textDecoration: "none"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Lock size={18} color="#151515" />
            <span style={{ fontSize: "13.5px", fontWeight: "700", color: "#151515" }}>Change Password</span>
          </div>
          <ArrowRight size={14} color="#6E6E6E" />
        </Link>
      </section>

      {/* ================= LOGOUT ================= */}
      <button
        type="button"
        onClick={logoutCustomer}
        style={{
          padding: "13px",
          borderRadius: "12px",
          backgroundColor: "#FEF2F2",
          border: "1px solid #FECACA",
          color: "#DC2626",
          fontSize: "13.5px",
          fontWeight: "700",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px"
        }}
      >
        <LogOut size={16} color="#DC2626" />
        <span>Log Out</span>
      </button>

    </div>
  );
}

export default CustomerProfile;