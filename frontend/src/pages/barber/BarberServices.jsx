import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import {
  Scissors,
  Plus,
  Clock,
  Store,
  Check,
  X,
  Trash2,
  CheckCircle,
  AlertCircle,
} from "../../components/common/Icons";
import Skeleton from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";

const initialFormState = {
  name: "",
  description: "",
  price: "",
  homePrice: "",
  duration: "30",
  serviceMode: "both",
};

function BarberServices() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialFormState);

  const formatService = (srv) => {
    const shopPrice = Number(srv.shop_price || 0);
    const homePrice = Number(srv.home_price || 0);

    let serviceMode = "both";
    if (shopPrice > 0 && homePrice === 0) serviceMode = "shop";
    else if (homePrice > 0 && shopPrice === 0) serviceMode = "home";

    return {
      id: srv.id,
      name: srv.name,
      description: srv.description || "",
      price: shopPrice,
      homePrice: homePrice,
      duration: Number(srv.duration || 30),
      serviceMode: serviceMode,
      active: Boolean(srv.is_active),
    };
  };

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiFetch("/api/barbers/services/");

      if (response.status === 401) {
        setError("Session expired. Please login again.");
        setTimeout(() => navigate("/barber/login"), 1500);
        return;
      }

      if (!response.ok) throw new Error("Unable to load services.");
      const data = await response.json();
      setServices(Array.isArray(data) ? data.map(formatService) : []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load services.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenAddForm = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setShowForm(true);
  };

  const handleEditClick = (service) => {
    setEditingId(service.id);
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price ? String(service.price) : "",
      homePrice: service.homePrice ? String(service.homePrice) : "",
      duration: String(service.duration),
      serviceMode: service.serviceMode,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Please enter service name.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        duration: parseInt(formData.duration, 10) || 30,
        shop_price: formData.serviceMode !== "home" ? parseFloat(formData.price) || 0 : 0,
        home_price: formData.serviceMode !== "shop" ? parseFloat(formData.homePrice || formData.price) || 0 : 0,
        is_active: true,
      };

      const url = editingId ? `/api/barbers/services/${editingId}/` : "/api/barbers/services/";
      const method = editingId ? "PATCH" : "POST";

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save service.");

      if (showToast) showToast(editingId ? "Service updated!" : "Service added!", "success");
      else alert(editingId ? "Service updated!" : "Service added!");

      setShowForm(false);
      setEditingId(null);
      setFormData(initialFormState);
      fetchServices();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error saving service.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (serviceId) => {
    if (!window.confirm("Are you sure you want to delete this service?")) return;
    try {
      const res = await apiFetch(`/api/barbers/services/${serviceId}/`, {
        method: "DELETE",
      });
      if (res.ok) {
        setServices((prev) => prev.filter((s) => s.id !== serviceId));
        if (showToast) showToast("Service deleted.", "info");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete service.");
    }
  };

  const handleToggleActive = async (service) => {
    try {
      const newActive = !service.active;
      const res = await apiFetch(`/api/barbers/services/${service.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: newActive }),
      });
      if (res.ok) {
        setServices((prev) =>
          prev.map((s) => (s.id === service.id ? { ...s, active: newActive } : s))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <Skeleton variant="card" height="120px" />
        <Skeleton variant="card" height="90px" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto", padding: "16px 16px 40px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "16px" }}>
      
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: "800", color: "#151515", margin: 0, letterSpacing: "-0.3px" }}>
            Services Catalogue
          </h1>
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6E6E6E" }}>
            Add, update pricing, and manage your offerings
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddForm}
          style={{
            backgroundColor: "#D4A017",
            color: "#151515",
            border: "none",
            padding: "8px 14px",
            borderRadius: "10px",
            fontSize: "12.5px",
            fontWeight: "750",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            boxShadow: "0 2px 8px rgba(212, 160, 23, 0.3)"
          }}
        >
          <Plus size={15} color="#151515" />
          <span>Add Service</span>
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", padding: "12px", borderRadius: "12px", fontSize: "13px" }}>
          {error}
        </div>
      )}

      {/* Services List */}
      {services.length === 0 ? (
        <EmptyState
          icon={Scissors}
          title="No Services Created"
          description="Add your first grooming haircut or beard styling service to start receiving bookings."
          actionLabel="Add New Service"
          onAction={handleOpenAddForm}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {services.map((srv) => (
            <div
              key={srv.id}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "14px",
                padding: "16px",
                border: "1px solid rgba(0, 0, 0, 0.06)",
                boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                opacity: srv.active ? 1 : 0.6
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: "750", color: "#151515", margin: 0 }}>
                      {srv.name}
                    </h3>
                    {!srv.active && (
                      <span style={{ fontSize: "10px", fontWeight: "700", color: "#6E6E6E", backgroundColor: "#F3F4F6", padding: "2px 6px", borderRadius: "6px" }}>
                        Inactive
                      </span>
                    )}
                  </div>
                  {srv.description && (
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6E6E6E" }}>
                      {srv.description}
                    </p>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#6E6E6E", marginTop: "4px" }}>
                    <Clock size={11} color="#6E6E6E" />
                    <span>{srv.duration} mins</span>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "16px", fontWeight: "800", color: "#D4A017" }}>
                    ₹{srv.price || srv.homePrice}
                  </div>
                  <span style={{ fontSize: "10px", color: "#6E6E6E" }}>
                    {srv.serviceMode === "both" ? "Salon & Home" : srv.serviceMode === "home" ? "Doorstep" : "Salon"}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(0,0,0,0.05)", paddingTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => handleToggleActive(srv)}
                  style={{
                    background: "none",
                    border: "none",
                    color: srv.active ? "#16A34A" : "#6E6E6E",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                    padding: 0
                  }}
                >
                  {srv.active ? "Status: Active" : "Status: Hidden"}
                </button>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => handleEditClick(srv)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      backgroundColor: "#FAF7EF",
                      border: "1px solid rgba(212, 160, 23, 0.4)",
                      fontSize: "12px",
                      fontWeight: "700",
                      color: "#151515",
                      cursor: "pointer"
                    }}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(srv.id)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: "8px",
                      backgroundColor: "#FEF2F2",
                      border: "1px solid #FECACA",
                      color: "#DC2626",
                      fontSize: "12px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center"
                    }}
                  >
                    <Trash2 size={13} color="#DC2626" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Service Modal */}
      {showForm && (
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
            maxWidth: "420px",
            padding: "20px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: "14px"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#151515", margin: 0 }}>
                {editingId ? "Edit Service" : "Add New Service"}
              </h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={18} color="#6E6E6E" />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "4px" }}>
                  Service Name *
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Classic Fade & Beard Trim"
                  value={formData.name}
                  onChange={handleChange}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.12)", fontSize: "13px", boxSizing: "border-box" }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "4px" }}>
                  Description (Optional)
                </label>
                <input
                  type="text"
                  name="description"
                  placeholder="Includes wash, precision trimming, and styling"
                  value={formData.description}
                  onChange={handleChange}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.12)", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "4px" }}>
                    Salon Price (₹)
                  </label>
                  <input
                    type="number"
                    name="price"
                    placeholder="150"
                    value={formData.price}
                    onChange={handleChange}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.12)", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "4px" }}>
                    Home Price (₹)
                  </label>
                  <input
                    type="number"
                    name="homePrice"
                    placeholder="200"
                    value={formData.homePrice}
                    onChange={handleChange}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.12)", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "4px" }}>
                  Duration (mins)
                </label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.12)", fontSize: "13px", boxSizing: "border-box" }}
                >
                  <option value="15">15 Minutes</option>
                  <option value="30">30 Minutes</option>
                  <option value="45">45 Minutes</option>
                  <option value="60">60 Minutes</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  marginTop: "6px",
                  padding: "12px",
                  borderRadius: "10px",
                  backgroundColor: "#D4A017",
                  color: "#151515",
                  fontWeight: "800",
                  fontSize: "13.5px",
                  border: "none",
                  cursor: submitting ? "not-allowed" : "pointer"
                }}
              >
                {submitting ? "Saving..." : editingId ? "Update Service" : "Save Service"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default BarberServices;