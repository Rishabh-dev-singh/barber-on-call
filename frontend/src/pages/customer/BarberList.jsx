import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  API_BASE_URL as API_BASE,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
  clearAuthSession,
} from "../../services/api";
import {
  Search,
  MapPin,
  Star,
  ShieldCheck,
  Heart,
  Scissors,
  Store,
  Compass,
  X,
  SlidersHorizontal,
  Clock,
  ArrowRight,
  Sparkles,
} from "../../components/common/Icons";
import Skeleton from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import Button from "../../components/ui/Button";

function BarberList() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Search & Filters from URL params
  const initialType = searchParams.get("type") || "all";
  const initialSearch = searchParams.get("search") || "";
  const initialFilter = searchParams.get("filter") || "";

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [serviceType, setServiceType] = useState(initialType);
  const [filterMode, setFilterMode] = useState(initialFilter === "favorites" ? "favorites" : "all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState("recommended");

  // Geolocation
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationText, setLocationText] = useState("Jaipur, Rajasthan");
  const [userLocation, setUserLocation] = useState(null);

  // Barbers data
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Favorites in localStorage
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("boc_favorite_barbers") || "[]");
    } catch {
      return [];
    }
  });

  const toggleFavorite = (barberId) => {
    setFavorites((prev) => {
      const next = prev.includes(barberId)
        ? prev.filter((id) => id !== barberId)
        : [...prev, barberId];
      try {
        localStorage.setItem("boc_favorite_barbers", JSON.stringify(next));
      } catch (e) {
        console.error("Failed to save favorites", e);
      }
      return next;
    });
  };

  // Sync with searchParams
  useEffect(() => {
    const typeParam = searchParams.get("type");
    if (typeParam) setServiceType(typeParam);

    const filterParam = searchParams.get("filter");
    if (filterParam === "favorites") {
      setFilterMode("favorites");
    } else {
      setFilterMode("all");
    }

    const q = searchParams.get("search");
    if (q !== null && q !== undefined) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  // Fetch Barbers
  useEffect(() => {
    const fetchBarbers = async (retryCount = 0) => {
      try {
        setLoading(true);
        setError(null);
        const token = getAccessToken("customer");

        const response = await fetch(`${API_BASE}/api/barbers/list/`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });

        if (response.status === 401 && retryCount === 0) {
          const refreshToken = getRefreshToken("customer");
          if (!refreshToken) {
            clearAuthSession("customer");
            throw new Error("Session expired. Please log in again.");
          }

          const refreshResponse = await fetch(`${API_BASE}/api/accounts/refresh/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh: refreshToken }),
          });

          if (!refreshResponse.ok) {
            clearAuthSession("customer");
            throw new Error("Session expired. Please log in again.");
          }

          const refreshData = await refreshResponse.json();
          if (refreshData.access) {
            setAuthTokens({
              access: refreshData.access,
              refresh: refreshData.refresh || refreshToken,
              role: "customer",
            });
            return fetchBarbers(1);
          }
        }

        if (!response.ok) {
          throw new Error("Failed to fetch barbers");
        }

        const data = await response.json();
        const formatted = (Array.isArray(data) ? data : []).map((barber) => {
          const services = barber.services || [];
          const shopPrices = services
            .map((s) => Number(s.shop_price))
            .filter((p) => !isNaN(p) && p > 0);
          const homePrices = services
            .map((s) => Number(s.home_price))
            .filter((p) => !isNaN(p) && p > 0);

          const allPrices = [...shopPrices, ...homePrices];
          const startingPrice = allPrices.length > 0 ? Math.min(...allPrices) : 150;

          return {
            id: barber.id,
            name: barber.shop_name || "Premier Barber Studio",
            owner: barber.owner_name || "Stylist",
            rating: barber.rating ? Number(barber.rating) : 4.8,
            reviews: barber.reviews_count || 12,
            distance: null,
            city: barber.city || "Jaipur",
            address: barber.address || "Main Market, Jaipur",
            startingPrice,
            homeService: barber.home_service_enabled !== false,
            shopService: barber.shop_service_enabled !== false,
            category: barber.category || "standard",
            providesChairMirror: barber.provides_chair_mirror === true,
            latitude: barber.latitude,
            longitude: barber.longitude,
            image: barber.profile_picture
              ? barber.profile_picture.startsWith("http")
                ? barber.profile_picture
                : `${API_BASE}${barber.profile_picture}`
              : "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80",
            services,
          };
        });

        setBarbers(formatted);
      } catch (err) {
        console.error("Barber API Error:", err);
        setError(err.message || "Failed to load barbers.");
      } finally {
        setLoading(false);
      }
    };

    fetchBarbers();
  }, []);

  // GPS Location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Location is not supported on this device.");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        setLocationText(`GPS (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`);
        setSortBy("distance");
        setLocationLoading(false);
      },
      (err) => {
        console.warn("GPS error:", err);
        setLocationLoading(false);
        setLocationText("Location denied (Jaipur default)");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Filter & Sort
  const filteredBarbers = useMemo(() => {
    let result = [...barbers];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.owner.toLowerCase().includes(q) ||
          b.city.toLowerCase().includes(q) ||
          (b.services && b.services.some((s) => s.name && s.name.toLowerCase().includes(q)))
      );
    }

    // Favorites filter
    if (filterMode === "favorites") {
      result = result.filter((b) => favorites.includes(b.id));
    }

    // Service Type filter
    if (serviceType === "home") {
      result = result.filter((b) => b.homeService);
    } else if (serviceType === "shop") {
      result = result.filter((b) => b.shopService);
    }

    // Rating filter
    if (minRating > 0) {
      result = result.filter((b) => b.rating >= minRating);
    }

    // Premium / Chair & Mirror equipment filter
    if (categoryFilter === "premium") {
      result = result.filter((b) => b.category === "premium" || b.providesChairMirror);
    }

    // Compute distance if GPS active
    if (userLocation) {
      result = result.map((barber) => {
        if (!barber.latitude || !barber.longitude) {
          return { ...barber, distance: null };
        }
        const R = 6371;
        const dLat = ((barber.latitude - userLocation.latitude) * Math.PI) / 180;
        const dLon = ((barber.longitude - userLocation.longitude) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((userLocation.latitude * Math.PI) / 180) *
            Math.cos((barber.latitude * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return { ...barber, distance: R * c };
      });
    }

    // Sort
    if (sortBy === "distance") {
      result.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    } else if (sortBy === "rating") {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "price") {
      result.sort((a, b) => a.startingPrice - b.startingPrice);
    }

    return result;
  }, [barbers, searchQuery, filterMode, serviceType, minRating, sortBy, userLocation, favorites]);

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto", padding: "16px", boxSizing: "border-box" }}>
      
      {/* ================= SCREEN TITLE & LOCATION ================= */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "800", color: "#151515", margin: "0 0 4px 0", letterSpacing: "-0.4px" }}>
            Find a Barber
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#6E6E6E", fontSize: "12px" }}>
            <MapPin size={13} color="#D4A017" />
            <span>{locationText}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={locationLoading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "8px 12px",
            borderRadius: "20px",
            backgroundColor: "#FFFFFF",
            border: "1px solid rgba(212, 160, 23, 0.4)",
            color: "#151515",
            fontSize: "11px",
            fontWeight: "700",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.04)"
          }}
        >
          <Compass size={13} color="#D4A017" />
          <span>{locationLoading ? "Detecting..." : "Near Me"}</span>
        </button>
      </div>

      {/* ================= SEARCH INPUT ================= */}
      <div style={{ position: "relative", marginBottom: "14px" }}>
        <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
          <Search size={18} color="#6E6E6E" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search barber, salon, or service..."
          style={{
            width: "100%",
            padding: "13px 40px 13px 42px",
            borderRadius: "12px",
            border: "1px solid rgba(0, 0, 0, 0.1)",
            backgroundColor: "#FFFFFF",
            fontSize: "14px",
            color: "#151515",
            outline: "none",
            boxSizing: "border-box",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
            fontFamily: "inherit"
          }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center"
            }}
          >
            <X size={16} color="#6E6E6E" />
          </button>
        )}
      </div>

      {/* ================= FILTER CHIPS ================= */}
      <div style={{
        display: "flex",
        gap: "8px",
        overflowX: "auto",
        paddingBottom: "8px",
        marginBottom: "12px",
        scrollbarWidth: "none"
      }}>
        <button
          type="button"
          onClick={() => {
            setServiceType("all");
            setFilterMode("all");
            setCategoryFilter("all");
            setMinRating(0);
          }}
          style={{
            whiteSpace: "nowrap",
            padding: "7px 14px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "700",
            cursor: "pointer",
            border: serviceType === "all" && filterMode === "all" && categoryFilter === "all" && minRating === 0
              ? "1px solid #151515"
              : "1px solid rgba(0, 0, 0, 0.08)",
            backgroundColor: serviceType === "all" && filterMode === "all" && categoryFilter === "all" && minRating === 0
              ? "#151515"
              : "#FFFFFF",
            color: serviceType === "all" && filterMode === "all" && categoryFilter === "all" && minRating === 0
              ? "#FAF7EF"
              : "#151515"
          }}
        >
          All
        </button>

        <button
          type="button"
          onClick={() => setCategoryFilter(categoryFilter === "premium" ? "all" : "premium")}
          style={{
            whiteSpace: "nowrap",
            padding: "7px 14px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "700",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            border: categoryFilter === "premium" ? "1.5px solid #D4A017" : "1px solid rgba(0, 0, 0, 0.08)",
            backgroundColor: categoryFilter === "premium" ? "#FAF7EF" : "#FFFFFF",
            color: categoryFilter === "premium" ? "#B45309" : "#151515"
          }}
        >
          <Sparkles size={13} color="#D4A017" />
          <span>✨ Premium (Chair & Mirror)</span>
        </button>

        <button
          type="button"
          onClick={() => setServiceType(serviceType === "home" ? "all" : "home")}
          style={{
            whiteSpace: "nowrap",
            padding: "7px 14px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "700",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            border: serviceType === "home" ? "1px solid #D4A017" : "1px solid rgba(0, 0, 0, 0.08)",
            backgroundColor: serviceType === "home" ? "#FAF7EF" : "#FFFFFF",
            color: serviceType === "home" ? "#D4A017" : "#151515"
          }}
        >
          <Scissors size={13} color={serviceType === "home" ? "#D4A017" : "#6E6E6E"} />
          <span>Doorstep (Home)</span>
        </button>

        <button
          type="button"
          onClick={() => setServiceType(serviceType === "shop" ? "all" : "shop")}
          style={{
            whiteSpace: "nowrap",
            padding: "7px 14px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "700",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            border: serviceType === "shop" ? "1px solid #D4A017" : "1px solid rgba(0, 0, 0, 0.08)",
            backgroundColor: serviceType === "shop" ? "#FAF7EF" : "#FFFFFF",
            color: serviceType === "shop" ? "#D4A017" : "#151515"
          }}
        >
          <Store size={13} color={serviceType === "shop" ? "#D4A017" : "#6E6E6E"} />
          <span>Salon (Shop)</span>
        </button>

        <button
          type="button"
          onClick={() => setMinRating(minRating === 4.5 ? 0 : 4.5)}
          style={{
            whiteSpace: "nowrap",
            padding: "7px 14px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "700",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            border: minRating === 4.5 ? "1px solid #D4A017" : "1px solid rgba(0, 0, 0, 0.08)",
            backgroundColor: minRating === 4.5 ? "#FAF7EF" : "#FFFFFF",
            color: minRating === 4.5 ? "#D4A017" : "#151515"
          }}
        >
          <Star size={13} color="#D4A017" />
          <span>4.5+ Rating</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterMode(filterMode === "favorites" ? "all" : "favorites")}
          style={{
            whiteSpace: "nowrap",
            padding: "7px 14px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "700",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            border: filterMode === "favorites" ? "1px solid #DC2626" : "1px solid rgba(0, 0, 0, 0.08)",
            backgroundColor: filterMode === "favorites" ? "#FEF2F2" : "#FFFFFF",
            color: filterMode === "favorites" ? "#DC2626" : "#151515"
          }}
        >
          <Heart size={13} color={filterMode === "favorites" ? "#DC2626" : "#6E6E6E"} />
          <span>Favorites ({favorites.length})</span>
        </button>
      </div>

      {/* ================= SORT ROW ================= */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <span style={{ fontSize: "12px", color: "#6E6E6E", fontWeight: 600 }}>
          {filteredBarbers.length} {filteredBarbers.length === 1 ? "barber" : "barbers"} available
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <SlidersHorizontal size={13} color="#6E6E6E" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              backgroundColor: "transparent",
              border: "none",
              fontSize: "12px",
              fontWeight: "700",
              color: "#151515",
              cursor: "pointer",
              outline: "none",
              fontFamily: "inherit"
            }}
          >
            <option value="recommended">Sort: Recommended</option>
            <option value="distance">Sort: Distance</option>
            <option value="rating">Sort: Top Rated</option>
            <option value="price">Sort: Price (Low to High)</option>
          </select>
        </div>
      </div>

      {/* ================= BARBERS LIST ================= */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", padding: "16px", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", gap: "14px" }}>
                <Skeleton variant="avatar" width="80px" height="80px" />
                <div style={{ flex: 1 }}>
                  <Skeleton variant="title" width="60%" />
                  <Skeleton variant="text" width="40%" />
                  <Skeleton variant="text" width="80%" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={Compass}
          title="Unable to load barbers"
          description={error}
          actionLabel="Try Again"
          onAction={() => window.location.reload()}
        />
      ) : filteredBarbers.length === 0 ? (
        <EmptyState
          icon={Scissors}
          title={filterMode === "favorites" ? "No favorite barbers yet" : "No barbers found"}
          description={
            filterMode === "favorites"
              ? "Tap the heart icon on any barber card to add them to your favorites."
              : "Try adjusting your search or filters to discover available barbers."
          }
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchQuery("");
            setServiceType("all");
            setFilterMode("all");
            setMinRating(0);
          }}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {filteredBarbers.map((barber) => {
            const isFav = favorites.includes(barber.id);

            return (
              <div
                key={barber.id}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: "1px solid rgba(0, 0, 0, 0.07)",
                  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.04)",
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                {/* Large Barber Card Image Header with Heart & Tags */}
                <div style={{ position: "relative", width: "100%", height: "140px" }}>
                  <img
                    src={barber.image}
                    alt={barber.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover"
                    }}
                  />
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)"
                  }} />

                  {/* Favorite Toggle Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleFavorite(barber.id);
                    }}
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      width: "34px",
                      height: "34px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.15)"
                    }}
                    aria-label="Toggle Favorite"
                  >
                    <Heart
                      size={18}
                      color={isFav ? "#DC2626" : "#6E6E6E"}
                      style={{ fill: isFav ? "#DC2626" : "none" }}
                    />
                  </button>

                  {/* Service Availability Badge */}
                  <div style={{ position: "absolute", bottom: "10px", left: "12px", display: "flex", gap: "6px" }}>
                    {(barber.category === "premium" || barber.providesChairMirror) && (
                      <span style={{
                        backgroundColor: "#D4A017",
                        color: "#151515",
                        fontSize: "10px",
                        fontWeight: "800",
                        padding: "3px 8px",
                        borderRadius: "12px",
                        letterSpacing: "0.3px",
                      }}>
                        ✨ Premium
                      </span>
                    )}
                    {barber.homeService && (
                      <span style={{
                        backgroundColor: "rgba(21, 21, 21, 0.8)",
                        color: "#FAF7EF",
                        fontSize: "10px",
                        fontWeight: "700",
                        padding: "3px 8px",
                        borderRadius: "12px",
                        letterSpacing: "0.3px",
                        textTransform: "uppercase"
                      }}>
                        Doorstep
                      </span>
                    )}
                    {barber.shopService && (
                      <span style={{
                        backgroundColor: "rgba(21, 21, 21, 0.8)",
                        color: "#FAF7EF",
                        fontSize: "10px",
                        fontWeight: "700",
                        padding: "3px 8px",
                        borderRadius: "12px"
                      }}>
                        Shop Visit
                      </span>
                    )}
                  </div>
                </div>

                {/* Barber Info Details */}
                <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <h2 style={{ fontSize: "16px", fontWeight: "800", color: "#151515", margin: 0 }}>
                          {barber.name}
                        </h2>
                        <ShieldCheck size={16} color="#16A34A" />
                      </div>
                      <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#6E6E6E" }}>
                        {barber.owner} • {barber.city}
                      </p>
                      {(barber.category === "premium" || barber.providesChairMirror) && (
                        <div style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          backgroundColor: "#FEF3C7",
                          color: "#92400E",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "750",
                          width: "fit-content",
                          marginTop: "4px",
                        }}>
                          <Sparkles size={12} color="#D4A017" />
                          <span>✨ Premium • Chair & Mirror Provided</span>
                        </div>
                      )}
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "11px", color: "#6E6E6E" }}>Starting</div>
                      <div style={{ fontSize: "16px", fontWeight: "800", color: "#D4A017" }}>
                        ₹{barber.startingPrice}
                      </div>
                    </div>
                  </div>

                  {/* Rating & Distance Meta */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px", color: "#6E6E6E", borderTop: "1px solid rgba(0,0,0,0.05)", paddingTop: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Star size={14} color="#D4A017" />
                      <strong style={{ color: "#151515" }}>{barber.rating.toFixed(1)}</strong>
                      <span>({barber.reviews} reviews)</span>
                    </div>

                    {barber.distance !== null ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "3px", color: "#16A34A", fontWeight: "600" }}>
                        <MapPin size={12} color="#16A34A" />
                        <span>{barber.distance.toFixed(1)} km away</span>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                        <MapPin size={12} color="#6E6E6E" />
                        <span>{barber.address.substring(0, 24)}...</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons: View Profile & Book Now */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "2px" }}>
                    <Link
                      to={`/customer/barber/${barber.id}`}
                      style={{
                        textAlign: "center",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        backgroundColor: "#FAF7EF",
                        border: "1px solid rgba(212, 160, 23, 0.4)",
                        color: "#151515",
                        fontWeight: "700",
                        fontSize: "13px",
                        textDecoration: "none"
                      }}
                    >
                      View Profile
                    </Link>

                    <Link
                      to={`/customer/booking/${barber.id}`}
                      style={{
                        textAlign: "center",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        backgroundColor: "#D4A017",
                        color: "#151515",
                        fontWeight: "700",
                        fontSize: "13px",
                        textDecoration: "none",
                        boxShadow: "0 2px 8px rgba(212, 160, 23, 0.3)"
                      }}
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default BarberList;