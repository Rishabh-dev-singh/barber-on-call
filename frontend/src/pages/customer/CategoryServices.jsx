import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../../services/api";
import {
  Scissors,
  Sparkles,
  Clock,
  Check,
  Plus,
  ArrowRight,
  ChevronLeft,
  Store,
  ShieldCheck,
  Star,
  MapPin,
} from "../../components/common/Icons";
import Skeleton from "../../components/ui/Skeleton";

const CATEGORY_META = {
  boys: {
    id: "boys",
    title: "For Men & Boys",
    subtitle: "Precision haircuts, beard grooming, head massage & sharp styling",
    badge: "Gents Grooming",
    accentColor: "#D4A017",
    bgGradient: "linear-gradient(135deg, #151515 0%, #2A2A2A 100%)",
    subcategories: [
      { id: "all", label: "All Services" },
      { id: "haircut", label: "Haircut & Styling" },
      { id: "beard", label: "Beard & Shave" },
      { id: "massage", label: "Massage & Cleanup" },
      { id: "groom", label: "Groom Packages" },
    ],
  },
  girls: {
    id: "girls",
    title: "For Women & Girls",
    subtitle: "Skin care, hair spa, manicure, pedicure, party makeup & saree draping",
    badge: "Ladies Beauty & Salon",
    accentColor: "#E11D48",
    bgGradient: "linear-gradient(135deg, #2A101C 0%, #4A122E 100%)",
    subcategories: [
      { id: "all", label: "All Services" },
      { id: "skin_care", label: "Skin Care" },
      { id: "hair_care", label: "Hair Care" },
      { id: "nail_care", label: "Nail & Hand/Foot" },
      { id: "makeup_styling", label: "Makeup & Styling" },
    ],
  },
  marriage: {
    id: "marriage",
    title: "Marriage Special",
    subtitle: "Pre-Bridal grooming packages (3-7 days before) & Function-day bridal styling",
    badge: "Royal Wedding Experience",
    accentColor: "#F59E0B",
    bgGradient: "linear-gradient(135deg, #3B1218 0%, #5B1B27 100%)",
    subcategories: [
      { id: "all", label: "All Wedding Services" },
      { id: "pre_bridal", label: "Pre-Bridal (3-7 Days Before)" },
      { id: "event_day", label: "Event-Day Function Styling" },
    ],
  },
};

function CategoryServices() {
  const { categoryKey = "girls" } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeCategory = CATEGORY_META[categoryKey] ? categoryKey : "girls";
  const catConfig = CATEGORY_META[activeCategory];

  const [activeSubcategory, setActiveSubcategory] = useState("all");
  const [catalogData, setCatalogData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedServices, setSelectedServices] = useState([]);

  // Fetch Catalog
  useEffect(() => {
    let mounted = true;
    const fetchCatalog = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/barbers/catalog/?category=${activeCategory}`);
        if (res.ok) {
          const data = await res.json();
          if (mounted) {
            const cat = (data.categories || []).find((c) => c.id === activeCategory);
            setCatalogData(cat?.services || []);
          }
        }
      } catch (err) {
        console.error("Error fetching catalog", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchCatalog();
    setActiveSubcategory("all");

    return () => {
      mounted = false;
    };
  }, [activeCategory]);

  const toggleSelectService = (service) => {
    setSelectedServices((prev) => {
      const exists = prev.some((s) => s.template_id === service.template_id);
      if (exists) {
        return prev.filter((s) => s.template_id !== service.template_id);
      } else {
        return [...prev, service];
      }
    });
  };

  const filteredServices = useMemo(() => {
    if (activeSubcategory === "all") return catalogData;
    return catalogData.filter((s) => s.sub_category === activeSubcategory);
  }, [catalogData, activeSubcategory]);

  const totalEstimatedPrice = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + (Number(s.starting_shop_price) || 0), 0);
  }, [selectedServices]);

  const handleProceedToBooking = () => {
    if (selectedServices.length === 0) return;
    const serviceNames = selectedServices.map((s) => s.name).join(",");
    navigate(`/customer/barbers?category=${activeCategory}&selected_category=${activeCategory}&services_list=${encodeURIComponent(serviceNames)}`);
  };

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto", padding: "16px 16px 90px 16px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "16px" }}>
      
      {/* Top Navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button
          type="button"
          onClick={() => navigate("/customer/dashboard")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            color: "#151515",
            fontSize: "13px",
            fontWeight: "700",
            padding: 0
          }}
        >
          <ChevronLeft size={18} />
          <span>Dashboard</span>
        </button>

        <span style={{ fontSize: "12px", fontWeight: "700", color: "#6E6E6E" }}>
          Segment Menu
        </span>
      </div>

      {/* Segment Switcher Pills */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
        {[
          { id: "boys", label: "For Boys", color: "#D4A017" },
          { id: "girls", label: "For Girls", color: "#E11D48" },
          { id: "marriage", label: "Marriage", color: "#F59E0B" },
        ].map((tab) => {
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                navigate(`/customer/category/${tab.id}`);
                setSelectedServices([]);
              }}
              style={{
                padding: "8px 4px",
                borderRadius: "10px",
                border: isActive ? `1.5px solid ${tab.color}` : "1px solid rgba(0,0,0,0.08)",
                backgroundColor: isActive ? "#151515" : "#FFFFFF",
                color: isActive ? "#FAF7EF" : "#4B5563",
                fontSize: "12px",
                fontWeight: "750",
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.15s ease",
                boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.1)" : "none"
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Hero Category Banner */}
      <div style={{
        background: catConfig.bgGradient,
        borderRadius: "18px",
        padding: "20px",
        color: "#FAF7EF",
        border: `1px solid ${catConfig.accentColor}44`,
        boxShadow: "0 6px 20px rgba(0, 0, 0, 0.12)",
        display: "flex",
        flexDirection: "column",
        gap: "8px"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{
            fontSize: "10.5px",
            fontWeight: "800",
            color: catConfig.accentColor,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            backgroundColor: "rgba(255,255,255,0.1)",
            padding: "2px 8px",
            borderRadius: "6px"
          }}>
            {catConfig.badge}
          </span>
          <Sparkles size={16} color={catConfig.accentColor} />
        </div>

        <h1 style={{ fontSize: "22px", fontWeight: "850", margin: 0, letterSpacing: "-0.3px", color: "#FAF7EF" }}>
          {catConfig.title}
        </h1>

        <p style={{ margin: 0, fontSize: "12px", color: "rgba(250, 247, 239, 0.8)", lineHeight: "1.4" }}>
          {catConfig.subtitle}
        </p>
      </div>

      {/* Subcategory Filter Tabs */}
      <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px" }}>
        {catConfig.subcategories.map((sub) => {
          const isActive = activeSubcategory === sub.id;
          return (
            <button
              key={sub.id}
              type="button"
              onClick={() => setActiveSubcategory(sub.id)}
              style={{
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "11.5px",
                fontWeight: "750",
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
                backgroundColor: isActive ? "#151515" : "#FFFFFF",
                color: isActive ? "#FAF7EF" : "#4B5563",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                transition: "all 0.15s ease",
              }}
            >
              {sub.label}
            </button>
          );
        })}
      </div>

      {/* Services Cards List */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Skeleton variant="card" height="120px" />
          <Skeleton variant="card" height="120px" />
          <Skeleton variant="card" height="120px" />
        </div>
      ) : filteredServices.length === 0 ? (
        <div style={{ backgroundColor: "#FFFFFF", padding: "24px", borderRadius: "14px", textAlign: "center", border: "1px solid rgba(0,0,0,0.06)" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "#6E6E6E" }}>
            No services found under this subcategory.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filteredServices.map((srv) => {
            const isSelected = selectedServices.some((s) => s.template_id === srv.template_id);

            return (
              <div
                key={srv.template_id}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "16px",
                  padding: "16px",
                  border: isSelected
                    ? `1.5px solid ${catConfig.accentColor}`
                    : "1px solid rgba(0, 0, 0, 0.07)",
                  boxShadow: isSelected
                    ? `0 4px 14px ${catConfig.accentColor}22`
                    : "0 2px 6px rgba(0, 0, 0, 0.03)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                      <span style={{
                        fontSize: "10px",
                        fontWeight: "800",
                        textTransform: "uppercase",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        backgroundColor: "#F3F4F6",
                        color: "#4B5563"
                      }}>
                        {srv.sub_category?.replace(/_/g, " ")}
                      </span>
                      {srv.popular && (
                        <span style={{
                          fontSize: "10px",
                          fontWeight: "800",
                          backgroundColor: "#FEF3C7",
                          color: "#B45309",
                          padding: "2px 6px",
                          borderRadius: "4px"
                        }}>
                          ★ Popular
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: "15.5px", fontWeight: "800", color: "#151515", margin: 0 }}>
                      {srv.name}
                    </h3>

                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#6E6E6E", lineHeight: "1.4" }}>
                      {srv.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleSelectService(srv)}
                    style={{
                      padding: "7px 12px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: isSelected ? "#151515" : catConfig.accentColor,
                      color: isSelected ? "#FAF7EF" : "#151515",
                      fontSize: "12px",
                      fontWeight: "800",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      flexShrink: 0,
                      boxShadow: isSelected ? "none" : `0 2px 8px ${catConfig.accentColor}44`,
                      transition: "transform 0.1s ease"
                    }}
                  >
                    {isSelected ? <Check size={13} color="#FAF7EF" /> : <Plus size={13} color="#151515" />}
                    <span>{isSelected ? "Added" : "Add"}</span>
                  </button>
                </div>

                {/* Highlights / Features List */}
                {srv.highlights && srv.highlights.length > 0 && (
                  <div style={{
                    backgroundColor: "#F9FAFB",
                    borderRadius: "10px",
                    padding: "8px 10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}>
                    {srv.highlights.map((h, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#4B5563" }}>
                        <span style={{ color: catConfig.accentColor, fontWeight: "900" }}>✓</span>
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer Price & Duration */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "6px", borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                    <span style={{ fontSize: "11px", color: "#6E6E6E" }}>Starts from</span>
                    <span style={{ fontSize: "15px", fontWeight: "850", color: "#151515" }}>
                      ₹{srv.starting_shop_price || srv.default_shop_price}
                    </span>
                    {srv.starting_home_price && (
                      <span style={{ fontSize: "11px", color: "#92400E" }}>
                        (Home: ₹{srv.starting_home_price})
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "11.5px", color: "#6E6E6E" }}>
                    <Clock size={12} color="#6E6E6E" />
                    <span>{srv.duration} mins</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= FLOATING CART & BOOKING BAR ================= */}
      {selectedServices.length > 0 && (
        <div style={{
          position: "fixed",
          bottom: "16px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "calc(100% - 32px)",
          maxWidth: "448px",
          backgroundColor: "#151515",
          borderRadius: "16px",
          padding: "12px 16px",
          color: "#FAF7EF",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 90,
          border: `1.5px solid ${catConfig.accentColor}`,
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: catConfig.accentColor, textTransform: "uppercase" }}>
                {selectedServices.length} {selectedServices.length === 1 ? "Service" : "Services"} Selected
              </span>
            </div>
            <div style={{ fontSize: "16px", fontWeight: "850", color: "#FAF7EF" }}>
              Est. ₹{totalEstimatedPrice}
            </div>
          </div>

          <button
            type="button"
            onClick={handleProceedToBooking}
            style={{
              backgroundColor: catConfig.accentColor,
              color: "#151515",
              border: "none",
              padding: "10px 16px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: "800",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: `0 2px 10px ${catConfig.accentColor}66`,
            }}
          >
            <span>Choose Specialist</span>
            <ArrowRight size={14} color="#151515" />
          </button>
        </div>
      )}

    </div>
  );
}

export default CategoryServices;
