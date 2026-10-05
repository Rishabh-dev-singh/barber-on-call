import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  API_BASE_URL,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
  clearAuthSession,
} from "../../services/api";
import {
  Scissors,
  Store,
  MapPin,
  Star,
  ShieldCheck,
  Clock,
  Check,
  ChevronLeft,
  ArrowRight,
  Heart,
  Calendar,
  Sparkles,
  Phone,
} from "../../components/common/Icons";
import Skeleton from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import Button from "../../components/ui/Button";

function BarberDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [serviceType, setServiceType] = useState("shop");
  const [selectedServices, setSelectedServices] = useState([]);
  const [barber, setBarber] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Favorites
  const [isFavorite, setIsFavorite] = useState(() => {
    try {
      const favs = JSON.parse(localStorage.getItem("boc_favorite_barbers") || "[]");
      return favs.includes(Number(id)) || favs.includes(String(id));
    } catch {
      return false;
    }
  });

  const toggleFavorite = () => {
    try {
      const favs = JSON.parse(localStorage.getItem("boc_favorite_barbers") || "[]");
      const targetId = Number(id);
      const next = favs.includes(targetId)
        ? favs.filter((item) => item !== targetId)
        : [...favs, targetId];
      localStorage.setItem("boc_favorite_barbers", JSON.stringify(next));
      setIsFavorite(!isFavorite);
    } catch (e) {
      console.error("Favorite error", e);
    }
  };

  // Fetch Barber Details
  useEffect(() => {
    const fetchBarber = async (retryCount = 0) => {
      try {
        setLoading(true);
        setError("");
        const token = getAccessToken("customer");

        const response = await fetch(`${API_BASE_URL}/api/barbers/${id}/`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });

        if (response.status === 401 && retryCount === 0) {
          const refreshToken = getRefreshToken("customer");
          if (refreshToken) {
            const refreshResponse = await fetch(`${API_BASE_URL}/api/accounts/refresh/`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refresh: refreshToken }),
            });
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              if (refreshData.access) {
                setAuthTokens({
                  access: refreshData.access,
                  refresh: refreshData.refresh || refreshToken,
                  role: "customer",
                });
                return fetchBarber(1);
              }
            }
          }
        }

        if (response.status === 404) {
          setError("Barber profile not found.");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch barber details");
        }

        const data = await response.json();

        setBarber({
          id: String(data.id),
          name: data.shop_name || "Professional Barber Studio",
          owner: data.owner_name || "Master Stylist",
          rating: data.rating ? Number(data.rating).toFixed(1) : "4.9",
          reviews: data.reviews_count || 18,
          city: data.city || "Jaipur",
          address: data.address || "Civil Lines, Jaipur",
          homeService: data.home_service_enabled !== false,
          shopService: data.shop_service_enabled !== false,
          category: data.category || "standard",
          providesChairMirror: data.provides_chair_mirror === true,
          homeRadius: `${data.home_service_radius || 10} km`,
          homeVisitCharge: Number(data.home_visit_charge || 0),
          image: data.profile_picture
            ? data.profile_picture.startsWith("http")
              ? data.profile_picture
              : `${API_BASE_URL}${data.profile_picture}`
            : "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1000&q=80",
          experience: "5+ years experience",
          workingHours: "09:00 AM - 08:30 PM",
        });

        const activeServices = (data.services || [])
          .filter((s) => s.is_active !== false)
          .map((s) => ({
            id: String(s.id),
            name: s.name,
            description: s.description || "Expert grooming tailored to your style",
            duration: Number(s.duration || 30),
            shopPrice: Number(s.shop_price || 0),
            homePrice: Number(s.home_price || 0),
          }));

        setServices(activeServices);

        // Pre-select first service
        if (activeServices.length > 0) {
          setSelectedServices([activeServices[0].id]);
        }

        if (!data.shop_service_enabled && data.home_service_enabled) {
          setServiceType("home");
        }
      } catch (err) {
        console.error("Barber Details Error:", err);
        setError("Unable to load barber details.");
      } finally {
        setLoading(false);
      }
    };

    fetchBarber();
  }, [id]);

  const toggleService = (serviceId) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((sId) => sId !== serviceId)
        : [...prev, serviceId]
    );
  };

  const selectedServiceObjects = services.filter((s) =>
    selectedServices.includes(s.id)
  );

  const totalPrice = selectedServiceObjects.reduce((acc, s) => {
    const p = serviceType === "home" ? s.homePrice : s.shopPrice;
    return acc + p;
  }, 0);

  const handleContinue = () => {
    if (selectedServices.length === 0) {
      alert("Please select at least one service.");
      return;
    }
    const serviceIdsString = selectedServices.join(",");
    navigate(
      `/customer/booking?barber=${barber.id}&services=${serviceIdsString}&type=${serviceType}`
    );
  };

  if (loading) {
    return (
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <Skeleton variant="card" height="200px" />
        <Skeleton variant="title" width="60%" />
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="card" height="80px" />
        <Skeleton variant="card" height="180px" />
      </div>
    );
  }

  if (error || !barber) {
    return (
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "32px 16px" }}>
        <EmptyState
          icon={Store}
          title="Barber Profile Unavailable"
          description={error || "The requested barber profile could not be found."}
          actionLabel="Back to Barbers"
          onAction={() => navigate("/customer/barbers")}
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto", padding: "16px 16px 100px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* ================= HERO COVER & PROFILE IMAGE ================= */}
      <div style={{
        position: "relative",
        borderRadius: "18px",
        overflow: "hidden",
        backgroundColor: "#151515",
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        border: "1px solid rgba(0,0,0,0.06)"
      }}>
        <div style={{ position: "relative", width: "100%", height: "180px" }}>
          <img
            src={barber.image}
            alt={barber.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(21,21,21,0.9) 0%, rgba(21,21,21,0.2) 60%, transparent 100%)"
          }} />

          {/* Top Actions: Back & Favorite */}
          <div style={{
            position: "absolute",
            top: "12px",
            left: "12px",
            right: "12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
              }}
              aria-label="Go Back"
            >
              <ChevronLeft size={20} color="#151515" />
            </button>

            <button
              type="button"
              onClick={toggleFavorite}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
              }}
              aria-label="Toggle Favorite"
            >
              <Heart
                size={18}
                color={isFavorite ? "#DC2626" : "#6E6E6E"}
                style={{ fill: isFavorite ? "#DC2626" : "none" }}
              />
            </button>
          </div>

          {/* Verified & Premium Badge Overlay */}
          <div style={{ position: "absolute", bottom: "12px", left: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              backgroundColor: "rgba(22, 163, 74, 0.95)",
              color: "#FFFFFF",
              fontSize: "11px",
              fontWeight: "700",
              padding: "4px 10px",
              borderRadius: "20px"
            }}>
              <ShieldCheck size={13} color="#FFFFFF" />
              <span>Verified Barber</span>
            </span>

            {(barber.category === "premium" || barber.providesChairMirror) && (
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                backgroundColor: "#D4A017",
                color: "#151515",
                fontSize: "11px",
                fontWeight: "800",
                padding: "4px 10px",
                borderRadius: "20px"
              }}>
                <Sparkles size={13} color="#151515" />
                <span>✨ Premium Salon</span>
              </span>
            )}
          </div>
        </div>

        {/* Hero Info Header */}
        <div style={{ padding: "16px", backgroundColor: "#FFFFFF", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: "800", color: "#151515", margin: 0, letterSpacing: "-0.3px" }}>
              {barber.name}
            </h1>
            <p style={{ margin: "3px 0 0", fontSize: "13px", color: "#6E6E6E" }}>
              Lead Stylist: <strong style={{ color: "#151515" }}>{barber.owner}</strong> • {barber.experience}
            </p>
          </div>

          {(barber.category === "premium" || barber.providesChairMirror) && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#FEF3C7",
              border: "1px solid #F59E0B",
              borderRadius: "10px",
              padding: "9px 12px",
              fontSize: "12px",
              color: "#92400E",
              fontWeight: "600",
            }}>
              <span style={{ fontSize: "16px" }}>🪑 🪞</span>
              <span>
                <strong>Portable Setup Provided:</strong> This stylist brings a portable styling chair & mirror kit for doorstep visits.
              </span>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12.5px", color: "#6E6E6E", borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Star size={15} color="#D4A017" />
              <strong style={{ color: "#151515", fontSize: "13px" }}>{barber.rating}</strong>
              <span>({barber.reviews} reviews)</span>
            </div>
            <span>•</span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <MapPin size={13} color="#D4A017" />
              <span>{barber.city}</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#6E6E6E", marginTop: "2px" }}>
            <Clock size={13} color="#16A34A" />
            <span style={{ color: "#16A34A", fontWeight: "600" }}>Open Today: {barber.workingHours}</span>
          </div>
        </div>
      </div>

      {/* ================= SERVICE LOCATION TOGGLE ================= */}
      <section style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "16px",
        padding: "16px",
        border: "1px solid rgba(0, 0, 0, 0.06)",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)"
      }}>
        <div style={{ marginBottom: "12px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: "800", color: "#151515", margin: 0 }}>
            Service Location
          </h2>
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6E6E6E" }}>
            Choose where you would like your grooming session
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {barber.shopService && (
            <button
              type="button"
              onClick={() => setServiceType("shop")}
              style={{
                textAlign: "left",
                padding: "12px",
                borderRadius: "12px",
                cursor: "pointer",
                border: serviceType === "shop" ? "2px solid #D4A017" : "1px solid rgba(0, 0, 0, 0.08)",
                backgroundColor: serviceType === "shop" ? "#FAF7EF" : "#FFFFFF",
                display: "flex",
                flexDirection: "column",
                gap: "6px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Store size={18} color={serviceType === "shop" ? "#D4A017" : "#151515"} />
                {serviceType === "shop" && <Check size={16} color="#D4A017" />}
              </div>
              <div>
                <strong style={{ fontSize: "13px", color: "#151515", display: "block" }}>At Salon / Shop</strong>
                <span style={{ fontSize: "11px", color: "#6E6E6E" }}>Visit barber's shop</span>
              </div>
            </button>
          )}

          {barber.homeService && (
            <button
              type="button"
              onClick={() => setServiceType("home")}
              style={{
                textAlign: "left",
                padding: "12px",
                borderRadius: "12px",
                cursor: "pointer",
                border: serviceType === "home" ? "2px solid #D4A017" : "1px solid rgba(0, 0, 0, 0.08)",
                backgroundColor: serviceType === "home" ? "#FAF7EF" : "#FFFFFF",
                display: "flex",
                flexDirection: "column",
                gap: "6px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Scissors size={18} color={serviceType === "home" ? "#D4A017" : "#151515"} />
                {serviceType === "home" && <Check size={16} color="#D4A017" />}
              </div>
              <div>
                <strong style={{ fontSize: "13px", color: "#151515", display: "block" }}>At Your Doorstep</strong>
                <span style={{ fontSize: "11px", color: "#6E6E6E" }}>
                  Up to {barber.homeRadius}
                  {barber.providesChairMirror && " • Chair & Mirror included"}
                </span>
              </div>
            </button>
          )}
        </div>
      </section>

      {/* ================= SELECT SERVICES ================= */}
      <section style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "16px",
        padding: "16px",
        border: "1px solid rgba(0, 0, 0, 0.06)",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <div>
            <h2 style={{ fontSize: "15px", fontWeight: "800", color: "#151515", margin: 0 }}>
              Services Catalogue
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6E6E6E" }}>
              {serviceType === "home" ? "Showing home service rates" : "Showing salon rates"}
            </p>
          </div>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "#D4A017" }}>
            {selectedServices.length} Selected
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {services.map((srv) => {
            const isSelected = selectedServices.includes(srv.id);
            const price = serviceType === "home" ? srv.homePrice : srv.shopPrice;

            return (
              <div
                key={srv.id}
                onClick={() => toggleService(srv.id)}
                style={{
                  padding: "14px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  border: isSelected ? "2px solid #D4A017" : "1px solid rgba(0, 0, 0, 0.07)",
                  backgroundColor: isSelected ? "#FAF7EF" : "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  transition: "all 0.15s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                  <div style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "6px",
                    border: isSelected ? "2px solid #D4A017" : "2px solid rgba(0,0,0,0.2)",
                    backgroundColor: isSelected ? "#D4A017" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    {isSelected && <Check size={14} color="#151515" />}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#151515", margin: 0 }}>
                      {srv.name}
                    </h3>
                    <p style={{ margin: "2px 0 0", fontSize: "11.5px", color: "#6E6E6E" }}>
                      {srv.description}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#6E6E6E", marginTop: "4px" }}>
                      <Clock size={11} color="#6E6E6E" />
                      <span>{srv.duration} mins</span>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: "16px", fontWeight: "800", color: "#151515" }}>
                    ₹{price}
                  </div>
                  <span style={{ fontSize: "10px", color: "#6E6E6E" }}>
                    {serviceType === "home" ? "Doorstep" : "Salon"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= FIXED BOTTOM ACTION BAR ================= */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#FFFFFF",
        borderTop: "1px solid rgba(0, 0, 0, 0.08)",
        padding: "12px 16px max(env(safe-area-inset-bottom, 0px), 12px)",
        display: "flex",
        justifyContent: "center",
        zIndex: 999,
        boxShadow: "0 -4px 16px rgba(0, 0, 0, 0.06)"
      }}>
        <div style={{ maxWidth: "480px", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
          <div>
            <div style={{ fontSize: "11px", color: "#6E6E6E" }}>
              Total ({selectedServiceObjects.length} {selectedServiceObjects.length === 1 ? "service" : "services"})
            </div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#151515" }}>
              ₹{totalPrice}
            </div>
          </div>

          <button
            type="button"
            onClick={handleContinue}
            disabled={selectedServices.length === 0}
            style={{
              flex: 1,
              backgroundColor: selectedServices.length > 0 ? "#D4A017" : "rgba(0,0,0,0.1)",
              color: selectedServices.length > 0 ? "#151515" : "#888",
              border: "none",
              padding: "14px 20px",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: "700",
              cursor: selectedServices.length > 0 ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: selectedServices.length > 0 ? "0 4px 12px rgba(212, 160, 23, 0.3)" : "none"
            }}
          >
            <span>Book Appointment</span>
            <ArrowRight size={16} color={selectedServices.length > 0 ? "#151515" : "#888"} />
          </button>
        </div>
      </div>

    </div>
  );
}

export default BarberDetails;