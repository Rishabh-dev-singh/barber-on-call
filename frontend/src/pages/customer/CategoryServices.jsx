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
  Tag,
} from "../../components/common/Icons";
import Skeleton from "../../components/ui/Skeleton";

const CATEGORY_META = {
  boys: {
    id: "boys",
    title: "For Men & Boys",
    subtitle: "Precision haircuts, beard grooming, head massage & sharp styling",
    badge: "Gentlemen's Grooming Lounge",
    accentColor: "#D4A017",
    accentBg: "rgba(212, 160, 23, 0.15)",
    bgGradient: "linear-gradient(135deg, #18181B 0%, #27272A 100%)",
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
    badge: "Ladies Beauty & Wellness Lounge",
    accentColor: "#E11D48",
    accentBg: "rgba(225, 29, 72, 0.18)",
    bgGradient: "linear-gradient(135deg, #240D18 0%, #43122B 100%)",
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
    accentBg: "rgba(245, 158, 11, 0.2)",
    bgGradient: "linear-gradient(135deg, #360F17 0%, #561A26 100%)",
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
    <div style={{
      maxWidth: "480px",
      margin: "0 auto",
      padding: "16px 16px 140px 16px", // Generous bottom space so floating bar NEVER overlaps content
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      minHeight: "100vh",
      backgroundColor: "#FAF7EF"
    }}>
      
      {/* Top Navigation Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button
          type="button"
          onClick={() => navigate("/customer/dashboard")}
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: "20px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            color: "#151515",
            fontSize: "12.5px",
            fontWeight: "750",
            padding: "6px 12px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.04)"
          }}
        >
          <ChevronLeft size={16} />
          <span>Dashboard</span>
        </button>

        <span style={{
          fontSize: "11px",
          fontWeight: "800",
          color: catConfig.accentColor,
          textTransform: "uppercase",
          backgroundColor: catConfig.accentBg,
          padding: "4px 10px",
          borderRadius: "12px",
          border: `1px solid ${catConfig.accentColor}33`
        }}>
          {catConfig.badge}
        </span>
      </div>

      {/* Segment Switcher Pills (Sticky and Sleek) */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: "6px",
        backgroundColor: "#FFFFFF",
        padding: "5px",
        borderRadius: "14px",
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
      }}>
        {[
          { id: "boys", label: "For Boys", color: "#D4A017", icon: "👨" },
          { id: "girls", label: "For Girls", color: "#E11D48", icon: "👩" },
          { id: "marriage", label: "Marriage", color: "#F59E0B", icon: "👑" },
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
                padding: "9px 4px",
                borderRadius: "10px",
                border: "none",
                backgroundColor: isActive ? "#151515" : "transparent",
                color: isActive ? "#FAF7EF" : "#6E6E6E",
                fontSize: "12px",
                fontWeight: "800",
                cursor: "pointer",
                textAlign: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
                transition: "all 0.2s ease",
                boxShadow: isActive ? "0 4px 12px rgba(0,0,0,0.15)" : "none"
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Hero Category Banner */}
      <div style={{
        background: catConfig.bgGradient,
        borderRadius: "20px",
        padding: "22px 20px",
        color: "#FAF7EF",
        border: `1px solid ${catConfig.accentColor}55`,
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Glow Accent Circle Background */}
        <div style={{
          position: "absolute",
          top: "-30px",
          right: "-30px",
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          backgroundColor: catConfig.accentColor,
          opacity: 0.15,
          filter: "blur(20px)",
          pointerEvents: "none"
        }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{
            fontSize: "11px",
            fontWeight: "800",
            color: catConfig.accentColor,
            textTransform: "uppercase",
            letterSpacing: "0.5px"
          }}>
            Verified Specialists • Doorstep & Salon
          </span>
          <Sparkles size={18} color={catConfig.accentColor} />
        </div>

        <h1 style={{ fontSize: "24px", fontWeight: "900", margin: 0, letterSpacing: "-0.4px", color: "#FAF7EF" }}>
          {catConfig.title}
        </h1>

        <p style={{ margin: 0, fontSize: "12.5px", color: "rgba(250, 247, 239, 0.8)", lineHeight: "1.45" }}>
          {catConfig.subtitle}
        </p>
      </div>

      {/* Subcategory Filter Tabs */}
      <div style={{
        display: "flex",
        gap: "6px",
        overflowX: "auto",
        paddingBottom: "4px",
        scrollbarWidth: "none"
      }}>
        {catConfig.subcategories.map((sub) => {
          const isActive = activeSubcategory === sub.id;
          return (
            <button
              key={sub.id}
              type="button"
              onClick={() => setActiveSubcategory(sub.id)}
              style={{
                padding: "8px 14px",
                borderRadius: "25px",
                fontSize: "12px",
                fontWeight: "750",
                border: isActive ? `1.5px solid ${catConfig.accentColor}` : "1px solid rgba(0,0,0,0.08)",
                cursor: "pointer",
                whiteSpace: "nowrap",
                backgroundColor: isActive ? "#151515" : "#FFFFFF",
                color: isActive ? "#FAF7EF" : "#4B5563",
                boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.12)" : "0 1px 3px rgba(0,0,0,0.03)",
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
          <Skeleton variant="card" height="130px" />
          <Skeleton variant="card" height="130px" />
          <Skeleton variant="card" height="130px" />
        </div>
      ) : filteredServices.length === 0 ? (
        <div style={{ backgroundColor: "#FFFFFF", padding: "28px", borderRadius: "16px", textAlign: "center", border: "1px solid rgba(0,0,0,0.06)" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "#6E6E6E" }}>
            No services found under this subcategory.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {filteredServices.map((srv) => {
            const isSelected = selectedServices.some((s) => s.template_id === srv.template_id);

            return (
              <div
                key={srv.template_id}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "18px",
                  padding: "16px",
                  border: isSelected
                    ? `2px solid ${catConfig.accentColor}`
                    : "1px solid rgba(0, 0, 0, 0.08)",
                  boxShadow: isSelected
                    ? `0 6px 18px ${catConfig.accentColor}26`
                    : "0 2px 8px rgba(0, 0, 0, 0.03)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "4px" }}>
                      <span style={{
                        fontSize: "10px",
                        fontWeight: "800",
                        textTransform: "uppercase",
                        padding: "2px 7px",
                        borderRadius: "6px",
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
                          padding: "2px 7px",
                          borderRadius: "6px"
                        }}>
                          ★ Popular Choice
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: "16px", fontWeight: "850", color: "#151515", margin: 0, letterSpacing: "-0.2px" }}>
                      {srv.name}
                    </h3>

                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#6E6E6E", lineHeight: "1.4" }}>
                      {srv.description}
                    </p>
                  </div>

                  {/* Add / Added Button */}
                  <button
                    type="button"
                    onClick={() => toggleSelectService(srv)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "10px",
                      border: "none",
                      backgroundColor: isSelected ? "#151515" : catConfig.accentColor,
                      color: isSelected ? "#FAF7EF" : "#151515",
                      fontSize: "12.5px",
                      fontWeight: "850",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      flexShrink: 0,
                      boxShadow: isSelected ? "none" : `0 3px 10px ${catConfig.accentColor}55`,
                      transition: "transform 0.15s ease"
                    }}
                  >
                    {isSelected ? <Check size={14} color="#FAF7EF" /> : <Plus size={14} color="#151515" />}
                    <span>{isSelected ? "Added" : "+ Add"}</span>
                  </button>
                </div>

                {/* Highlights / Features List */}
                {srv.highlights && srv.highlights.length > 0 && (
                  <div style={{
                    backgroundColor: "#F9FAFB",
                    borderRadius: "12px",
                    padding: "9px 12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    border: "1px solid rgba(0,0,0,0.03)"
                  }}>
                    {srv.highlights.map((h, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px", color: "#374151" }}>
                        <span style={{ color: catConfig.accentColor, fontWeight: "900", fontSize: "13px" }}>✓</span>
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer Price & Duration */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: "8px",
                  borderTop: "1px solid rgba(0,0,0,0.05)"
                }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                    <span style={{ fontSize: "11px", color: "#6E6E6E", fontWeight: "600" }}>Starting</span>
                    <span style={{ fontSize: "16px", fontWeight: "900", color: "#151515" }}>
                      ₹{srv.starting_shop_price || srv.default_shop_price}
                    </span>
                    {srv.starting_home_price && (
                      <span style={{ fontSize: "11.5px", color: "#92400E", fontWeight: "700" }}>
                        • Home: ₹{srv.starting_home_price}
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11.5px", color: "#6E6E6E", fontWeight: "600" }}>
                    <Clock size={13} color="#6E6E6E" />
                    <span>{srv.duration} mins</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= FIXED LUXURY CART BAR (NEVER OVERLAPPED) ================= */}
      {selectedServices.length > 0 && (
        <div style={{
          position: "fixed",
          bottom: "max(18px, env(safe-area-inset-bottom, 18px))",
          left: "50%",
          transform: "translateX(-50%)",
          width: "calc(100% - 32px)",
          maxWidth: "448px",
          backgroundColor: "#151515",
          borderRadius: "18px",
          padding: "14px 18px",
          color: "#FAF7EF",
          boxShadow: "0 12px 36px rgba(0, 0, 0, 0.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 1001, // HIGHER than any header or bottom nav
          border: `2px solid ${catConfig.accentColor}`,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          animation: "slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{
                fontSize: "10.5px",
                fontWeight: "800",
                color: "#151515",
                backgroundColor: catConfig.accentColor,
                padding: "2px 7px",
                borderRadius: "10px",
                textTransform: "uppercase"
              }}>
                {selectedServices.length} {selectedServices.length === 1 ? "Item" : "Items"}
              </span>
              <span style={{ fontSize: "11px", color: "rgba(250,247,239,0.7)" }}>
                Selected
              </span>
            </div>
            <div style={{ fontSize: "18px", fontWeight: "900", color: "#FAF7EF", marginTop: "2px" }}>
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
              padding: "11px 18px",
              borderRadius: "12px",
              fontSize: "13.5px",
              fontWeight: "900",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "7px",
              boxShadow: `0 4px 16px ${catConfig.accentColor}88`,
              transition: "transform 0.15s ease",
            }}
          >
            <span>Choose Specialist</span>
            <ArrowRight size={15} color="#151515" />
          </button>
        </div>
      )}

    </div>
  );
}

export default CategoryServices;
