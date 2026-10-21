import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch, API_BASE_URL } from "../../services/api";
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
  Sparkles,
} from "../../components/common/Icons";
import Skeleton from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";

const CATEGORY_OPTIONS = [
  { id: "boys", label: "For Men & Boys" },
  { id: "girls", label: "For Women & Girls" },
  { id: "marriage", label: "Marriage Special" },
];

const SUBCATEGORY_MAP = {
  boys: [
    { id: "haircut", label: "Haircut & Styling" },
    { id: "beard", label: "Beard & Shaving" },
    { id: "massage", label: "Massage & Facials" },
    { id: "groom", label: "Special Packages" },
  ],
  girls: [
    { id: "skin_care", label: "Skin Care (Facial/Detan/Waxing)" },
    { id: "hair_care", label: "Hair Care (Cut/Spa/Color)" },
    { id: "nail_care", label: "Nail & Hand/Foot Care" },
    { id: "makeup_styling", label: "Makeup & Styling (Bridal/Party/Draping)" },
  ],
  marriage: [
    { id: "pre_bridal", label: "Pre-Bridal (3-7 Days Before)" },
    { id: "event_day", label: "Event-Day Styling (Function Day)" },
  ],
};

const initialFormState = {
  name: "",
  description: "",
  price: "",
  homePrice: "",
  duration: "30",
  serviceMode: "both",
  main_category: "boys",
  sub_category: "haircut",
  package_type: "single",
};

function BarberServices() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [selectedTab, setSelectedTab] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialFormState);

  // Quick Catalog Picker Modal
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogCategories, setCatalogCategories] = useState([]);
  const [catalogTab, setCatalogTab] = useState("girls");
  const [loadingCatalog, setLoadingCatalog] = useState(false);

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
      main_category: srv.main_category || "boys",
      sub_category: srv.sub_category || "haircut",
      package_type: srv.package_type || "single",
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

  const openCatalogPicker = async () => {
    setShowCatalogModal(true);
    if (catalogCategories.length === 0) {
      try {
        setLoadingCatalog(true);
        const res = await fetch(`${API_BASE_URL}/api/barbers/catalog/`);
        if (res.ok) {
          const data = await res.json();
          setCatalogCategories(data.categories || []);
        }
      } catch (err) {
        console.error("Failed to load catalog", err);
      } finally {
        setLoadingCatalog(false);
      }
    }
  };

  const handleSelectTemplate = (template) => {
    setShowCatalogModal(false);
    setEditingId(null);
    setFormData({
      name: template.name,
      description: template.description || "",
      price: String(template.default_shop_price || 299),
      homePrice: String(template.default_home_price || 399),
      duration: String(template.duration || 30),
      serviceMode: "both",
      main_category: template.main_category || "boys",
      sub_category: template.sub_category || "haircut",
      package_type: template.package_type || "single",
    });
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "main_category") {
      const defaultSub = SUBCATEGORY_MAP[value]?.[0]?.id || "general";
      setFormData((prev) => ({
        ...prev,
        main_category: value,
        sub_category: defaultSub,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
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
      main_category: service.main_category || "boys",
      sub_category: service.sub_category || "haircut",
      package_type: service.package_type || "single",
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
        main_category: formData.main_category,
        sub_category: formData.sub_category,
        package_type: formData.package_type,
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

  // Filtered services by active category tab
  const filteredServices = useMemo(() => {
    if (selectedTab === "all") return services;
    return services.filter((s) => s.main_category === selectedTab);
  }, [services, selectedTab]);

  const activeCatalogCat = catalogCategories.find((c) => c.id === catalogTab);

  if (loading) {
    return (
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <Skeleton variant="text" width="60%" height="28px" />
        <Skeleton variant="card" height="120px" />
        <Skeleton variant="card" height="120px" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto", padding: "16px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "16px" }}>
      
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: "800", color: "#151515", margin: 0, letterSpacing: "-0.3px" }}>
            Services Catalogue
          </h1>
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6E6E6E" }}>
            Boys, Girls & Marriage Special grooming services
          </p>
        </div>

        <div style={{ display: "flex", gap: "6px" }}>
          <button
            type="button"
            onClick={openCatalogPicker}
            style={{
              backgroundColor: "#FAF7EF",
              color: "#92400E",
              border: "1px solid rgba(212, 160, 23, 0.5)",
              padding: "7px 11px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: "750",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Sparkles size={14} color="#D4A017" />
            <span>+ Templates</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddForm}
            style={{
              backgroundColor: "#D4A017",
              color: "#151515",
              border: "none",
              padding: "7px 12px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: "750",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              boxShadow: "0 2px 8px rgba(212, 160, 23, 0.3)"
            }}
          >
            <Plus size={14} color="#151515" />
            <span>Add Custom</span>
          </button>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px" }}>
        {[
          { id: "all", label: `All (${services.length})` },
          { id: "boys", label: "For Boys" },
          { id: "girls", label: "For Girls" },
          { id: "marriage", label: "Marriage Special" },
        ].map((tab) => {
          const isActive = selectedTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedTab(tab.id)}
              style={{
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "700",
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
                backgroundColor: isActive ? "#151515" : "#F3F4F6",
                color: isActive ? "#FAF7EF" : "#4B5563",
                transition: "all 0.15s ease",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", padding: "12px", borderRadius: "12px", fontSize: "13px" }}>
          {error}
        </div>
      )}

      {/* Services List */}
      {filteredServices.length === 0 ? (
        <EmptyState
          icon={Scissors}
          title={selectedTab === "all" ? "No Services Created" : `No ${selectedTab} Services`}
          description="Use '+ Templates' to quickly add popular salon services or click '+ Add Custom' to create your own."
          actionLabel="+ Add from Catalog Templates"
          onAction={openCatalogPicker}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filteredServices.map((srv) => {
            const isGirls = srv.main_category === "girls";
            const isMarriage = srv.main_category === "marriage";

            return (
              <div
                key={srv.id}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "14px",
                  padding: "16px",
                  border: isMarriage
                    ? "1px solid rgba(245, 158, 11, 0.4)"
                    : isGirls
                    ? "1px solid rgba(225, 29, 72, 0.25)"
                    : "1px solid rgba(0, 0, 0, 0.06)",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  opacity: srv.active ? 1 : 0.6,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "3px" }}>
                      <span style={{
                        fontSize: "10px",
                        fontWeight: "800",
                        textTransform: "uppercase",
                        padding: "2px 7px",
                        borderRadius: "6px",
                        backgroundColor: isMarriage ? "#FEF3C7" : isGirls ? "#FFE4E6" : "#FEF3C7",
                        color: isMarriage ? "#B45309" : isGirls ? "#BE123C" : "#92400E",
                      }}>
                        {isMarriage ? "Marriage Special" : isGirls ? "For Girls" : "For Boys"}
                      </span>

                      {srv.sub_category && (
                        <span style={{ fontSize: "10px", fontWeight: "700", color: "#6B7280", backgroundColor: "#F3F4F6", padding: "2px 6px", borderRadius: "6px" }}>
                          {srv.sub_category.replace(/_/g, " ")}
                        </span>
                      )}

                      {!srv.active && (
                        <span style={{ fontSize: "10px", fontWeight: "700", color: "#6E6E6E", backgroundColor: "#F3F4F6", padding: "2px 6px", borderRadius: "6px" }}>
                          Inactive
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: "15px", fontWeight: "750", color: "#151515", margin: 0 }}>
                      {srv.name}
                    </h3>

                    {srv.description && (
                      <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#6E6E6E", lineHeight: "1.4" }}>
                        {srv.description}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleActive(srv)}
                    style={{
                      border: "none",
                      backgroundColor: srv.active ? "#DCFCE7" : "#F3F4F6",
                      color: srv.active ? "#15803D" : "#6E6E6E",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "3px"
                    }}
                  >
                    {srv.active ? <Check size={12} /> : null}
                    <span>{srv.active ? "Live" : "Paused"}</span>
                  </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ fontSize: "13px", fontWeight: "800", color: "#151515" }}>
                      Salon: ₹{srv.price}
                    </div>
                    {srv.homePrice > 0 && (
                      <div style={{ fontSize: "13px", fontWeight: "800", color: "#D4A017" }}>
                        Home: ₹{srv.homePrice}
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "11.5px", color: "#6E6E6E" }}>
                      <Clock size={12} color="#6E6E6E" />
                      <span>{srv.duration}m</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => handleEditClick(srv)}
                      style={{
                        backgroundColor: "#FAF7EF",
                        border: "1px solid rgba(212, 160, 23, 0.4)",
                        color: "#151515",
                        fontSize: "11.5px",
                        fontWeight: "700",
                        padding: "5px 10px",
                        borderRadius: "6px",
                        cursor: "pointer"
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(srv.id)}
                      style={{
                        backgroundColor: "#FEF2F2",
                        border: "1px solid #FECACA",
                        color: "#DC2626",
                        padding: "5px 8px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center"
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= ADD / EDIT SERVICE MODAL ================= */}
      {showForm && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          zIndex: 100,
        }}>
          <div style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "20px",
            width: "100%",
            maxWidth: "420px",
            maxHeight: "90vh",
            overflowY: "auto",
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
              {/* Category Picker */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "4px" }}>
                  Main Segment *
                </label>
                <select
                  name="main_category"
                  value={formData.main_category}
                  onChange={handleChange}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.12)", fontSize: "13px", boxSizing: "border-box", fontWeight: "600" }}
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Sub-Category Picker */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "4px" }}>
                  Subcategory
                </label>
                <select
                  name="sub_category"
                  value={formData.sub_category}
                  onChange={handleChange}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.12)", fontSize: "13px", boxSizing: "border-box" }}
                >
                  {(SUBCATEGORY_MAP[formData.main_category] || []).map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "4px" }}>
                  Service Name *
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Hydra Facial & Clean-up"
                  value={formData.name}
                  onChange={handleChange}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.12)", fontSize: "13px", boxSizing: "border-box" }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "4px" }}>
                  Description / Bullet Highlights
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="e.g. Deep pore cleansing, hydration, glowing face massage"
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
                    placeholder="499"
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
                    placeholder="599"
                    value={formData.homePrice}
                    onChange={handleChange}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.12)", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "4px" }}>
                    Duration
                  </label>
                  <select
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.12)", fontSize: "13px", boxSizing: "border-box" }}
                  >
                    <option value="15">15 Mins</option>
                    <option value="30">30 Mins</option>
                    <option value="45">45 Mins</option>
                    <option value="60">60 Mins (1 hr)</option>
                    <option value="90">90 Mins (1.5 hr)</option>
                    <option value="120">120 Mins (2 hr)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "4px" }}>
                    Package Type
                  </label>
                  <select
                    name="package_type"
                    value={formData.package_type}
                    onChange={handleChange}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.12)", fontSize: "13px", boxSizing: "border-box" }}
                  >
                    <option value="single">Single Service</option>
                    <option value="package">Special Package</option>
                  </select>
                </div>
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

      {/* ================= 1-CLICK QUICK CATALOG TEMPLATE PICKER MODAL ================= */}
      {showCatalogModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          zIndex: 110,
        }}>
          <div style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "20px",
            width: "100%",
            maxWidth: "460px",
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
          }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#151515", margin: 0 }}>
                  Master Service Catalog
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: "11.5px", color: "#6E6E6E" }}>
                  Pick any service template to add to your salon with 1-click
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={18} color="#6E6E6E" />
              </button>
            </div>

            {/* Catalog category selector */}
            <div style={{ display: "flex", backgroundColor: "#F9FAFB", padding: "8px 16px", gap: "6px" }}>
              {[
                { id: "boys", label: "Boys / Men" },
                { id: "girls", label: "Girls / Women" },
                { id: "marriage", label: "Marriage Special" },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCatalogTab(c.id)}
                  style={{
                    flex: 1,
                    padding: "7px 4px",
                    borderRadius: "8px",
                    border: "none",
                    fontSize: "12px",
                    fontWeight: "750",
                    cursor: "pointer",
                    backgroundColor: catalogTab === c.id ? "#151515" : "transparent",
                    color: catalogTab === c.id ? "#FAF7EF" : "#4B5563",
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Templates list */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {loadingCatalog ? (
                <div style={{ padding: "30px", textAlign: "center", color: "#6E6E6E", fontSize: "13px" }}>
                  Loading catalog templates...
                </div>
              ) : !activeCatalogCat || (activeCatalogCat.services || []).length === 0 ? (
                <div style={{ padding: "30px", textAlign: "center", color: "#6E6E6E", fontSize: "13px" }}>
                  No templates available in this category.
                </div>
              ) : (
                activeCatalogCat.services.map((tmpl) => (
                  <div
                    key={tmpl.template_id}
                    style={{
                      backgroundColor: "#F9FAFB",
                      borderRadius: "12px",
                      padding: "12px",
                      border: "1px solid rgba(0,0,0,0.06)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: "10.5px", fontWeight: "700", color: "#92400E", textTransform: "uppercase" }}>
                          {tmpl.sub_category?.replace(/_/g, " ")}
                        </div>
                        <h4 style={{ fontSize: "14px", fontWeight: "800", color: "#151515", margin: "2px 0 0" }}>
                          {tmpl.name}
                        </h4>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectTemplate(tmpl)}
                        style={{
                          backgroundColor: "#D4A017",
                          color: "#151515",
                          border: "none",
                          padding: "5px 10px",
                          borderRadius: "6px",
                          fontSize: "11.5px",
                          fontWeight: "750",
                          cursor: "pointer"
                        }}
                      >
                        + Use Template
                      </button>
                    </div>

                    <p style={{ margin: 0, fontSize: "11.5px", color: "#6E6E6E", lineHeight: "1.35" }}>
                      {tmpl.description}
                    </p>

                    {tmpl.highlights && tmpl.highlights.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "2px" }}>
                        {tmpl.highlights.slice(0, 2).map((h, i) => (
                          <span key={i} style={{ fontSize: "10px", color: "#4B5563", backgroundColor: "#FFFFFF", padding: "1px 6px", borderRadius: "4px", border: "1px solid rgba(0,0,0,0.06)" }}>
                            • {h}
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "11.5px", color: "#151515", fontWeight: "700", marginTop: "2px" }}>
                      <span>Sug. Salon: ₹{tmpl.default_shop_price}</span>
                      <span>Sug. Home: ₹{tmpl.default_home_price}</span>
                      <span style={{ color: "#6E6E6E", fontWeight: "500" }}>• {tmpl.duration} mins</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default BarberServices;
