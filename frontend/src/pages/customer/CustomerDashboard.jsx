import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL as API_BASE, getAccessToken } from "../../services/api";
import {
  Scissors,
  Store,
  Calendar,
  Search,
  Heart,
  User,
  ArrowRight,
  ShieldCheck,
  Star,
  MapPin,
  Clock,
  Sparkles,
} from "../../components/common/Icons";
import Skeleton from "../../components/ui/Skeleton";

function CustomerDashboard() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState({
    name: "Customer",
    city: "Jaipur",
    phone: "",
    email: "",
    profile_picture: null,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nearbyBarbers, setNearbyBarbers] = useState([]);
  const [upcomingBooking, setUpcomingBooking] = useState(null);

  // Load Profile and Barbers
  useEffect(() => {
    let mounted = true;

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const token = getAccessToken("customer");

        // Profile request
        if (token) {
          try {
            const profileRes = await fetch(`${API_BASE}/api/accounts/profile/`, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            });
            if (profileRes.ok) {
              const profileData = await profileRes.json();
              if (mounted) {
                setCustomer({
                  name: profileData.name || profileData.first_name || profileData.username || "Customer",
                  city: profileData.city || "Jaipur",
                  phone: profileData.phone || "",
                  email: profileData.email || "",
                  profile_picture: profileData.profile_picture || null,
                });
              }
            }
          } catch (e) {
            console.error("Profile load err", e);
          }

          // Active/upcoming booking check
          try {
            const bookingsRes = await fetch(`${API_BASE}/api/bookings/customer/`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (bookingsRes.ok) {
              const bookingsData = await bookingsRes.json();
              const list = Array.isArray(bookingsData) ? bookingsData : (bookingsData.results || []);
              const active = list.find((b) => ["pending", "accepted", "awaiting_payment", "confirmed", "in_service"].includes(b.status));
              if (mounted && active) {
                setUpcomingBooking(active);
              }
            }
          } catch (e) {
            console.error("Bookings check err", e);
          }
        }

        // Nearby barbers preview
        try {
          const barberHeaders = token ? { Authorization: `Bearer ${token}` } : {};
          const barbersRes = await fetch(`${API_BASE}/api/barbers/list/`, {
            headers: barberHeaders,
          });
          if (barbersRes.ok) {
            const barbersData = await barbersRes.json();
            if (mounted) {
              setNearbyBarbers(Array.isArray(barbersData) ? barbersData.slice(0, 3) : []);
            }
          }
        } catch (e) {
          console.error("Barbers list load err", e);
        }

      } catch (err) {
        console.error("Dashboard error:", err);
        if (mounted) setError("Unable to load complete dashboard information.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadDashboardData();

    return () => {
      mounted = false;
    };
  }, []);

  const firstName = customer.name.split(" ")[0] || "Customer";

  if (loading) {
    return (
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <Skeleton variant="text" width="50%" height="28px" />
        <Skeleton variant="card" height="120px" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Skeleton variant="card" height="100px" />
          <Skeleton variant="card" height="100px" />
        </div>
        <Skeleton variant="card" height="180px" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto", padding: "16px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* ================= GREETING HERO CARD ================= */}
      <div style={{
        background: "linear-gradient(135deg, #151515 0%, #222222 100%)",
        borderRadius: "18px",
        padding: "20px",
        color: "#FAF7EF",
        border: "1px solid rgba(212, 160, 23, 0.25)",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#D4A017", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Welcome back
            </span>
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: "800", margin: "0 0 4px 0", color: "#FAF7EF", letterSpacing: "-0.3px" }}>
            Hello, {firstName}
          </h1>
          <p style={{ margin: 0, fontSize: "12.5px", color: "rgba(250, 247, 239, 0.7)" }}>
            Book premium grooming at your doorstep or salon.
          </p>
        </div>

        <div style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          backgroundColor: "rgba(212, 160, 23, 0.15)",
          border: "1px solid rgba(212, 160, 23, 0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#D4A017",
          fontSize: "18px",
          fontWeight: "800",
          flexShrink: 0
        }}>
          {firstName.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* ================= UPCOMING APPOINTMENT ALERT (IF ANY) ================= */}
      {upcomingBooking && (
        <div style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "14px",
          padding: "16px",
          border: "1px solid rgba(212, 160, 23, 0.4)",
          boxShadow: "0 2px 10px rgba(212, 160, 23, 0.08)",
          display: "flex",
          flexDirection: "column",
          gap: "10px"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Clock size={16} color="#D4A017" />
              <span style={{ fontSize: "12px", fontWeight: "800", color: "#151515", textTransform: "uppercase" }}>
                Active Appointment
              </span>
            </div>
            <span style={{
              fontSize: "11px",
              fontWeight: "700",
              color: "#16A34A",
              backgroundColor: "#DCFCE7",
              padding: "2px 8px",
              borderRadius: "10px"
            }}>
              {upcomingBooking.status.replace("_", " ").toUpperCase()}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: "800", color: "#151515" }}>
                {upcomingBooking.barber_name || upcomingBooking.barber_shop_name || "Professional Barber"}
              </div>
              <div style={{ fontSize: "12px", color: "#6E6E6E", marginTop: "2px" }}>
                {upcomingBooking.service_name || "Grooming Service"} • {upcomingBooking.booking_date} at {upcomingBooking.booking_time}
              </div>
            </div>
            <Link
              to="/customer/bookings"
              style={{
                fontSize: "12px",
                fontWeight: "700",
                color: "#D4A017",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "2px"
              }}
            >
              <span>Details</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      )}

      {/* ================= SERVICE TYPE SELECTION ================= */}
      <section>
        <div style={{ marginBottom: "12px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "800", color: "#151515", margin: 0 }}>
            Choose Service Type
          </h2>
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6E6E6E" }}>
            Select how you would like to receive your grooming
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {/* Doorstep Home Option */}
          <Link
            to="/customer/barbers?type=home"
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              padding: "16px",
              border: "1px solid rgba(0, 0, 0, 0.07)",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "12px",
              transition: "transform 0.15s ease"
            }}
          >
            <div style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              backgroundColor: "rgba(212, 160, 23, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Scissors size={22} color="#D4A017" />
            </div>

            <div>
              <div style={{ fontSize: "15px", fontWeight: "800", color: "#151515" }}>
                Barber at Home
              </div>
              <div style={{ fontSize: "11.5px", color: "#6E6E6E", marginTop: "2px", lineHeight: "1.3" }}>
                Doorstep styling at your convenience
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: "700", color: "#D4A017" }}>
              <span>Book Home</span>
              <ArrowRight size={13} />
            </div>
          </Link>

          {/* Salon Shop Option */}
          <Link
            to="/customer/barbers?type=shop"
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              padding: "16px",
              border: "1px solid rgba(0, 0, 0, 0.07)",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "12px",
              transition: "transform 0.15s ease"
            }}
          >
            <div style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              backgroundColor: "rgba(21, 21, 21, 0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Store size={22} color="#151515" />
            </div>

            <div>
              <div style={{ fontSize: "15px", fontWeight: "800", color: "#151515" }}>
                Visit Salon
              </div>
              <div style={{ fontSize: "11.5px", color: "#6E6E6E", marginTop: "2px", lineHeight: "1.3" }}>
                Walk into nearby verified barber studio
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: "700", color: "#151515" }}>
              <span>Book Salon</span>
              <ArrowRight size={13} />
            </div>
          </Link>
        </div>
      </section>

      {/* ================= NEARBY BARBERS PREVIEW ================= */}
      <section>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: "800", color: "#151515", margin: 0 }}>
              Top Rated Barbers
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6E6E6E" }}>
              Verified grooming experts in {customer.city}
            </p>
          </div>
          <Link
            to="/customer/barbers"
            style={{ fontSize: "13px", fontWeight: "700", color: "#D4A017", textDecoration: "none", display: "flex", alignItems: "center", gap: "2px" }}
          >
            <span>See All</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {nearbyBarbers.length === 0 ? (
            <div style={{ backgroundColor: "#FFFFFF", padding: "16px", borderRadius: "14px", textAlign: "center", border: "1px solid rgba(0,0,0,0.06)" }}>
              <p style={{ margin: 0, fontSize: "13px", color: "#6E6E6E" }}>Explore the complete list of barbers in your city.</p>
            </div>
          ) : (
            nearbyBarbers.map((b) => (
              <div
                key={b.id}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "14px",
                  padding: "12px 14px",
                  border: "1px solid rgba(0, 0, 0, 0.06)",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                  <div style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(212, 160, 23, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    <Scissors size={20} color="#D4A017" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <h4 style={{ fontSize: "14px", fontWeight: "750", color: "#151515", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {b.shop_name}
                      </h4>
                      <ShieldCheck size={14} color="#16A34A" />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px", color: "#6E6E6E", marginTop: "2px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                        <Star size={11} color="#D4A017" />
                        <span style={{ fontWeight: 700, color: "#151515" }}>{b.rating ? Number(b.rating).toFixed(1) : "4.8"}</span>
                      </div>
                      <span>•</span>
                      <span>{b.city || "Jaipur"}</span>
                    </div>
                  </div>
                </div>

                <Link
                  to={`/customer/barber/${b.id}`}
                  style={{
                    backgroundColor: "#FAF7EF",
                    border: "1px solid rgba(212, 160, 23, 0.4)",
                    color: "#151515",
                    fontSize: "12px",
                    fontWeight: "700",
                    padding: "7px 12px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    whiteSpace: "nowrap"
                  }}
                >
                  Book
                </Link>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ================= QUICK SHORTCUTS ================= */}
      <section style={{ marginBottom: "8px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "800", color: "#151515", margin: "0 0 12px 0" }}>
          Quick Shortcuts
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
          <Link
            to="/customer/bookings"
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "14px",
              padding: "14px 10px",
              textAlign: "center",
              border: "1px solid rgba(0, 0, 0, 0.06)",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "rgba(212, 160, 23, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Calendar size={18} color="#D4A017" />
            </div>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#151515" }}>Bookings</span>
          </Link>

          <Link
            to="/customer/barbers?filter=favorites"
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "14px",
              padding: "14px 10px",
              textAlign: "center",
              border: "1px solid rgba(0, 0, 0, 0.06)",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "#FEF2F2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Heart size={18} color="#DC2626" />
            </div>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#151515" }}>Favorites</span>
          </Link>

          <Link
            to="/customer/profile"
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "14px",
              padding: "14px 10px",
              textAlign: "center",
              border: "1px solid rgba(0, 0, 0, 0.06)",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "rgba(21, 21, 21, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <User size={18} color="#151515" />
            </div>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#151515" }}>Profile</span>
          </Link>
        </div>
      </section>

    </div>
  );
}

export default CustomerDashboard;