import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../services/api";
import {
  Store,
  User,
  Phone,
  Mail,
  MapPin,
  Scissors,
  CheckCircle,
  AlertCircle,
  FileText,
  ArrowRight,
  ChevronLeft,
} from "../../components/common/Icons";

function BarberApplication() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    owner_name: "",
    shop_name: "",
    mobile: "",
    email: "",
    address: "",
    city: "Jaipur",
    pincode: "",
    service_mode: "both",
    service_radius: "5",
    home_visit_charge: "0",
    category: "standard",
    provides_chair_mirror: false,
    haircut_shop_price: "",
    haircut_home_price: "",
    beard_shop_price: "",
    beard_home_price: "",
    aadhaar_document: null,
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.mobile || formData.mobile.length !== 10) {
      setError("Please provide a valid 10-digit mobile number.");
      setLoading(false);
      return;
    }

    if (!formData.aadhaar_document) {
      setError("Please upload your Aadhaar or ID verification document (PDF, JPG, PNG).");
      setLoading(false);
      return;
    }

    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        let val = formData[key];
        // Normalize price and number fields
        if (
          ["home_visit_charge", "haircut_shop_price", "haircut_home_price", "beard_shop_price", "beard_home_price"].includes(key)
        ) {
          val = val === "" || val === null || val === undefined ? "0" : String(val);
        }
        if (val !== null && val !== undefined) {
          data.append(key, val);
        }
      });

      const response = await fetch(`${API_BASE_URL}/api/barbers/apply/`, {
        method: "POST",
        body: data,
      });

      const result = await response.json();

      if (!response.ok) {
        let errorMsg = "Failed to submit application. Please check all details.";
        if (result.detail) {
          errorMsg = result.detail;
        } else if (result.message) {
          errorMsg = result.message;
        } else if (typeof result === "object") {
          const errors = Object.entries(result).map(([field, msgs]) => {
            const readableField = field.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
            const msgText = Array.isArray(msgs) ? msgs.join(", ") : String(msgs);
            return `${readableField}: ${msgText}`;
          });
          if (errors.length > 0) {
            errorMsg = errors.join(" • ");
          }
        }
        throw new Error(errorMsg);
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{
        minHeight: "100vh",
        backgroundColor: "#FAF7EF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px"
      }}>
        <div style={{
          maxWidth: "420px",
          width: "100%",
          backgroundColor: "#FFFFFF",
          borderRadius: "20px",
          padding: "32px 24px",
          textAlign: "center",
          boxShadow: "0 6px 24px rgba(0,0,0,0.06)",
          border: "1px solid rgba(212, 160, 23, 0.3)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px"
        }}>
          <div style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            backgroundColor: "#DCFCE7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <CheckCircle size={32} color="#16A34A" />
          </div>

          <div>
            <h1 style={{ fontSize: "20px", fontWeight: "800", color: "#151515", margin: "0 0 6px 0" }}>
              Application Submitted
            </h1>
            <p style={{ margin: 0, fontSize: "13px", color: "#6E6E6E", lineHeight: "1.4" }}>
              Thank you for applying to partner with Barber On Call. Our onboarding team will verify your credentials and shop location within 24 hours.
            </p>
          </div>

          <div style={{
            backgroundColor: "#FAF7EF",
            padding: "14px",
            borderRadius: "12px",
            fontSize: "12px",
            color: "#6E6E6E",
            textAlign: "left",
            width: "100%",
            boxSizing: "border-box"
          }}>
            Once approved, your partner credentials will be delivered to your registered mobile number (+91 {formData.mobile}) and email.
          </div>

          <button
            type="button"
            onClick={() => navigate("/")}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "12px",
              backgroundColor: "#151515",
              color: "#FAF7EF",
              fontWeight: "750",
              fontSize: "13.5px",
              border: "none",
              cursor: "pointer"
            }}
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

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
        maxWidth: "460px",
        width: "100%",
        backgroundColor: "#FFFFFF",
        borderRadius: "20px",
        padding: "32px 24px",
        boxShadow: "0 6px 24px rgba(0, 0, 0, 0.06)",
        border: "1px solid rgba(0, 0, 0, 0.06)",
        boxSizing: "border-box"
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={{
            width: "50px",
            height: "50px",
            borderRadius: "14px",
            backgroundColor: "#151515",
            border: "1px solid rgba(212, 160, 23, 0.4)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "10px"
          }}>
            <Store size={24} color="#D4A017" />
          </div>

          <h1 style={{ fontSize: "21px", fontWeight: "800", color: "#151515", margin: "0 0 4px 0" }}>
            Barber Partner Onboarding
          </h1>
          <p style={{ margin: 0, fontSize: "12.5px", color: "#6E6E6E" }}>
            Join our certified network of professional grooming stylists
          </p>
        </div>

        {error && (
          <div style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", padding: "12px", borderRadius: "10px", fontSize: "13px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
            <AlertCircle size={15} color="#DC2626" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Owner & Shop */}
          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "4px" }}>
              Owner / Barber Name *
            </label>
            <input
              type="text"
              name="owner_name"
              placeholder="e.g. Ramesh Sharma"
              value={formData.owner_name}
              onChange={handleChange}
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.12)", fontSize: "13px", boxSizing: "border-box" }}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "4px" }}>
              Shop / Brand Name *
            </label>
            <input
              type="text"
              name="shop_name"
              placeholder="e.g. Royal Cut Saloon"
              value={formData.shop_name}
              onChange={handleChange}
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.12)", fontSize: "13px", boxSizing: "border-box" }}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "4px" }}>
                Mobile Number *
              </label>
              <input
                type="tel"
                name="mobile"
                maxLength={10}
                placeholder="10-digit mobile"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, "") })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.12)", fontSize: "13px", boxSizing: "border-box" }}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "4px" }}>
                Email
              </label>
              <input
                type="email"
                name="email"
                placeholder="you@email.com"
                value={formData.email}
                onChange={handleChange}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.12)", fontSize: "13px", boxSizing: "border-box" }}
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "4px" }}>
              Shop Address *
            </label>
            <input
              type="text"
              name="address"
              placeholder="Shop No., Market, Colony"
              value={formData.address}
              onChange={handleChange}
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.12)", fontSize: "13px", boxSizing: "border-box" }}
              required
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
                value={formData.city}
                onChange={handleChange}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.12)", fontSize: "13px", boxSizing: "border-box" }}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "4px" }}>
                Pincode
              </label>
              <input
                type="text"
                name="pincode"
                placeholder="302001"
                value={formData.pincode}
                onChange={handleChange}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.12)", fontSize: "13px", boxSizing: "border-box" }}
              />
            </div>
          </div>

          {/* Service Mode & Category */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "4px" }}>
                Service Mode
              </label>
              <select
                name="service_mode"
                value={formData.service_mode}
                onChange={handleChange}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.12)", fontSize: "13px", boxSizing: "border-box" }}
              >
                <option value="both">Both Salon & Doorstep</option>
                <option value="shop">Salon Shop Only</option>
                <option value="home">Doorstep Only</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "4px" }}>
                Barber Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    category: val,
                    provides_chair_mirror: val === "premium" ? true : prev.provides_chair_mirror,
                  }));
                }}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.12)", fontSize: "13px", boxSizing: "border-box" }}
              >
                <option value="standard">Standard Barber</option>
                <option value="premium">✨ Premium Salon Barber</option>
              </select>
            </div>
          </div>

          {/* Portable Chair & Mirror Option */}
          <div
            style={{
              backgroundColor: formData.provides_chair_mirror ? "#FAF7EF" : "#F9FAFB",
              border: formData.provides_chair_mirror ? "1.5px solid #D4A017" : "1px solid rgba(0,0,0,0.1)",
              padding: "12px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              cursor: "pointer",
            }}
            onClick={() => setFormData((prev) => ({ ...prev, provides_chair_mirror: !prev.provides_chair_mirror }))}
          >
            <input
              type="checkbox"
              id="provides_chair_mirror"
              name="provides_chair_mirror"
              checked={formData.provides_chair_mirror}
              onChange={(e) => setFormData((prev) => ({ ...prev, provides_chair_mirror: e.target.checked }))}
              style={{ marginTop: "3px", width: "16px", height: "16px", accentColor: "#D4A017" }}
            />
            <label htmlFor="provides_chair_mirror" style={{ fontSize: "12px", color: "#151515", cursor: "pointer", lineHeight: "1.4" }}>
              <strong style={{ display: "block", color: formData.provides_chair_mirror ? "#92400E" : "#151515" }}>
                🪑 Portable Chair & Mirror Equipment Provider
              </strong>
              Check this if you carry a portable barber chair and vanity lighting mirror for doorstep visits.
            </label>
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "4px" }}>
              Doorstep Visit Fee (₹)
            </label>
            <input
              type="number"
              name="home_visit_charge"
              value={formData.home_visit_charge}
              onChange={handleChange}
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.12)", fontSize: "13px", boxSizing: "border-box" }}
            />
          </div>

          {/* Pricing Guidance */}
          <div style={{ backgroundColor: "#FAF7EF", padding: "12px", borderRadius: "10px", border: "1px solid rgba(212, 160, 23, 0.3)" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#D4A017", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
              Initial Service Pricing
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <input
                type="number"
                name="haircut_shop_price"
                placeholder="Haircut Salon ₹"
                value={formData.haircut_shop_price}
                onChange={handleChange}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid rgba(0,0,0,0.1)", fontSize: "12px", boxSizing: "border-box" }}
              />
              <input
                type="number"
                name="haircut_home_price"
                placeholder="Haircut Doorstep ₹"
                value={formData.haircut_home_price}
                onChange={handleChange}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid rgba(0,0,0,0.1)", fontSize: "12px", boxSizing: "border-box" }}
              />
            </div>
          </div>

          {/* Aadhaar / Document Upload */}
          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "4px" }}>
              Aadhaar / ID Verification Document *
            </label>
            <input
              type="file"
              name="aadhaar_document"
              onChange={handleChange}
              accept="image/*,.pdf"
              required
              style={{ fontSize: "12px", width: "100%", padding: "6px 0" }}
            />
            {formData.aadhaar_document && (
              <div style={{ marginTop: "4px", fontSize: "11.5px", color: "#16A34A", display: "flex", alignItems: "center", gap: "4px" }}>
                <CheckCircle size={13} color="#16A34A" />
                <span>Selected: {formData.aadhaar_document.name} ({(formData.aadhaar_document.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
            )}
            <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#888" }}>
              Accepted formats: PDF, JPG, JPEG, PNG (Max size: 5MB)
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "8px",
              padding: "13px",
              borderRadius: "12px",
              backgroundColor: loading ? "#CCC" : "#D4A017",
              color: "#151515",
              fontWeight: "800",
              fontSize: "14px",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              boxShadow: "0 3px 12px rgba(212, 160, 23, 0.3)"
            }}
          >
            <span>{loading ? "Submitting..." : "Submit Barber Application"}</span>
            <ArrowRight size={16} color="#151515" />
          </button>
        </form>

        <div style={{ marginTop: "18px", textAlign: "center", display: "flex", flexDirection: "column", gap: "8px" }}>
          <p style={{ margin: 0, fontSize: "12.5px", color: "#6E6E6E" }}>
            Already an approved partner?{" "}
            <Link to="/barber/login" style={{ color: "#D4A017", fontWeight: "700", textDecoration: "none" }}>
              Barber Login
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

export default BarberApplication;