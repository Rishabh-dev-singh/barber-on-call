import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL, getMediaUrl, getAccessToken, clearAuthSession } from "../../services/api";
import {
  Store,
  User,
  Phone,
  Mail,
  MapPin,
  Camera,
  Scissors,
  Lock,
  LogOut,
  ShieldCheck,
  Compass,
  CheckCircle,
  AlertCircle,
  Save,
  ArrowRight,
} from "../../components/common/Icons";
import Skeleton from "../../components/ui/Skeleton";

const emptyProfile = {
  ownerName: "",
  shopName: "",
  mobile: "",
  email: "",
  address: "",
  city: "",
  pincode: "",
  serviceMode: "both",
  serviceRadius: "10",
  homeVisitCharge: "0",
  latitude: "",
  longitude: "",
  profilePicture: null,
};

function BarberProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [detectingGps, setDetectingGps] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError("");

    try {
      const token = getAccessToken("barber");
      if (!token) {
        navigate("/barber/login");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/barbers/profile/`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        clearAuthSession("barber");
        navigate("/barber/login");
        return;
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Unable to load profile.");

      const serviceMode =
        data.home_service_enabled && data.shop_service_enabled
          ? "both"
          : data.home_service_enabled
          ? "home"
          : "shop";

      setProfile({
        ownerName: data.owner_name || "",
        shopName: data.shop_name || "",
        mobile: data.mobile || "",
        email: data.email || "",
        address: data.address || "",
        city: data.city || "",
        pincode: data.pincode || "",
        serviceMode,
        serviceRadius: String(data.home_service_radius ?? 10),
        homeVisitCharge: String(data.home_visit_charge ?? 0),
        latitude: data.latitude !== null && data.latitude !== undefined ? String(data.latitude) : "",
        longitude: data.longitude !== null && data.longitude !== undefined ? String(data.longitude) : "",
        profilePicture: getMediaUrl(data.profile_picture),
      });
    } catch (err) {
      setError(err.message || "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setProfile((prev) => ({ ...prev, profilePicture: preview, imageFile: file }));
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser/device.");
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setProfile((prev) => ({
          ...prev,
          latitude: String(pos.coords.latitude.toFixed(6)),
          longitude: String(pos.coords.longitude.toFixed(6)),
        }));
        setDetectingGps(false);
        alert("GPS Location Coordinates tagged!");
      },
      (err) => {
        console.warn(err);
        setDetectingGps(false);
        alert("Unable to detect GPS position.");
      }
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!profile.shopName.trim() || !profile.ownerName.trim()) {
      alert("Please fill shop name and owner name.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSaved(false);

      const token = getAccessToken("barber");
      if (!token) {
        navigate("/barber/login");
        return;
      }

      const formData = new FormData();
      formData.append("shop_name", profile.shopName.trim());
      formData.append("owner_name", profile.ownerName.trim());
      formData.append("email", profile.email.trim());
      formData.append("address", profile.address.trim());
      formData.append("city", profile.city.trim());
      formData.append("pincode", profile.pincode.trim());

      formData.append("home_service_enabled", String(profile.serviceMode !== "shop"));
      formData.append("shop_service_enabled", String(profile.serviceMode !== "home"));
      formData.append("home_service_radius", profile.serviceRadius || "10");
      formData.append("home_visit_charge", profile.homeVisitCharge || "0");

      if (profile.latitude) formData.append("latitude", profile.latitude);
      if (profile.longitude) formData.append("longitude", profile.longitude);

      if (profile.imageFile) {
        formData.append("profile_picture", profile.imageFile);
      }

      const res = await fetch(`${API_BASE_URL}/api/barbers/profile/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Failed to update profile.");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    clearAuthSession("barber");
    navigate("/barber/login");
  };

  if (loading) {
    return (
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <Skeleton variant="avatar" width="70px" height="70px" />
        <Skeleton variant="card" height="180px" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto", padding: "16px 16px 40px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "16px" }}>
      
      {/* Header Profile Card */}
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
        <div style={{ position: "relative" }}>
          {profile.profilePicture ? (
            <img
              src={profile.profilePicture}
              alt="Shop"
              style={{ width: "68px", height: "68px", borderRadius: "50%", objectFit: "cover", border: "2px solid #D4A017" }}
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
              {profile.shopName ? profile.shopName.charAt(0).toUpperCase() : "B"}
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
            <h2 style={{ fontSize: "17px", fontWeight: "800", color: "#FAF7EF", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {profile.shopName || "Barber Studio"}
            </h2>
            <ShieldCheck size={16} color="#16A34A" />
          </div>
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "rgba(250, 247, 239, 0.7)" }}>
            Owner: {profile.ownerName || "Barber"} • {profile.city || "Jaipur"}
          </p>
          <div style={{ marginTop: "4px", display: "inline-block", backgroundColor: "rgba(212, 160, 23, 0.15)", color: "#D4A017", fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "10px" }}>
            Verified Partner
          </div>
        </div>
      </div>

      {saved && (
        <div style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0", color: "#16A34A", padding: "12px 14px", borderRadius: "12px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
          <CheckCircle size={16} color="#16A34A" />
          <span>Shop profile updated successfully!</span>
        </div>
      )}

      {error && (
        <div style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", padding: "12px 14px", borderRadius: "12px", fontSize: "13px" }}>
          {error}
        </div>
      )}

      {/* Form Details */}
      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <section style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          padding: "16px",
          border: "1px solid rgba(0, 0, 0, 0.06)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}>
          <h3 style={{ fontSize: "14px", fontWeight: "800", color: "#151515", margin: 0 }}>
            Shop & Owner Profile
          </h3>

          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "4px" }}>
              Shop / Salon Name *
            </label>
            <input
              type="text"
              name="shopName"
              value={profile.shopName}
              onChange={handleChange}
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.12)", fontSize: "13px", boxSizing: "border-box" }}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "4px" }}>
              Owner / Lead Stylist Name *
            </label>
            <input
              type="text"
              name="ownerName"
              value={profile.ownerName}
              onChange={handleChange}
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.12)", fontSize: "13px", boxSizing: "border-box" }}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "4px" }}>
                Phone Number
              </label>
              <input
                type="tel"
                value={profile.mobile}
                disabled
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.1)", backgroundColor: "#F9F9F9", color: "#666", fontSize: "13px", boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "4px" }}>
                Email
              </label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.12)", fontSize: "13px", boxSizing: "border-box" }}
              />
            </div>
          </div>
        </section>

        {/* Location & Delivery Mode */}
        <section style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          padding: "16px",
          border: "1px solid rgba(0, 0, 0, 0.06)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "800", color: "#151515", margin: 0 }}>
              Shop Location & Mode
            </h3>
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={detectingGps}
              style={{
                background: "none",
                border: "1px solid rgba(212, 160, 23, 0.4)",
                color: "#151515",
                padding: "4px 8px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: "700",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <Compass size={12} color="#D4A017" />
              <span>{detectingGps ? "Detecting..." : "Tag GPS"}</span>
            </button>
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "4px" }}>
              Shop Address
            </label>
            <input
              type="text"
              name="address"
              value={profile.address}
              onChange={handleChange}
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.12)", fontSize: "13px", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "4px" }}>
                City
              </label>
              <input
                type="text"
                name="city"
                value={profile.city}
                onChange={handleChange}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.12)", fontSize: "13px", boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "4px" }}>
                Pincode
              </label>
              <input
                type="text"
                name="pincode"
                value={profile.pincode}
                onChange={handleChange}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.12)", fontSize: "13px", boxSizing: "border-box" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "4px" }}>
                Service Mode
              </label>
              <select
                name="serviceMode"
                value={profile.serviceMode}
                onChange={handleChange}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.12)", fontSize: "13px", boxSizing: "border-box" }}
              >
                <option value="both">Both Salon & Doorstep</option>
                <option value="shop">Salon Shop Only</option>
                <option value="home">Doorstep Home Only</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "4px" }}>
                Home Visit Charge (₹)
              </label>
              <input
                type="number"
                name="homeVisitCharge"
                value={profile.homeVisitCharge}
                onChange={handleChange}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.12)", fontSize: "13px", boxSizing: "border-box" }}
              />
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={saving}
          style={{
            padding: "13px",
            borderRadius: "12px",
            backgroundColor: "#151515",
            color: "#FAF7EF",
            fontWeight: "800",
            fontSize: "14px",
            border: "none",
            cursor: saving ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px"
          }}
        >
          <Save size={16} color="#D4A017" />
          <span>{saving ? "Saving..." : "Save Shop Profile"}</span>
        </button>
      </form>

      {/* Account Links */}
      <section style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "16px",
        overflow: "hidden",
        border: "1px solid rgba(0, 0, 0, 0.06)"
      }}>
        <Link
          to="/barber/change-password"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            textDecoration: "none"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Lock size={16} color="#151515" />
            <span style={{ fontSize: "13px", fontWeight: "700", color: "#151515" }}>Change Password</span>
          </div>
          <ArrowRight size={14} color="#6E6E6E" />
        </Link>
      </section>

      {/* Logout */}
      <button
        type="button"
        onClick={handleLogout}
        style={{
          padding: "12px",
          borderRadius: "12px",
          backgroundColor: "#FEF2F2",
          border: "1px solid #FECACA",
          color: "#DC2626",
          fontSize: "13px",
          fontWeight: "700",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px"
        }}
      >
        <LogOut size={15} color="#DC2626" />
        <span>Log Out as Barber</span>
      </button>

    </div>
  );
}

export default BarberProfile;