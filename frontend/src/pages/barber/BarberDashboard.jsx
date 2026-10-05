import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  API_BASE_URL,
  getMediaUrl,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
  clearAuthSession,
} from "../../services/api";
import {
  Store,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Scissors,
  User,
  ShieldCheck,
  TrendingUp,
  MapPin,
  ChevronRight,
  ArrowRight,
  Phone,
  Check,
  X,
} from "../../components/common/Icons";
import Skeleton from "../../components/ui/Skeleton";
import StatusBadge from "../../components/ui/StatusBadge";

function BarberDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEarningsTab = searchParams.get("tab") === "earnings";

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const knownOfferIdsRef = useRef(new Set());

  const [barber, setBarber] = useState({
    ownerName: "Barber",
    shopName: "Barber Studio",
    city: "Jaipur",
    profilePicture: null,
  });

  // Sound chime for incoming request
  const playNotificationChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(659.25, now);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.log("Audio chime error:", e);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");
      const token = getAccessToken("barber");

      if (!token) {
        setError("Please login as barber.");
        setLoading(false);
        navigate("/barber/login");
        return;
      }

      // Bookings request
      const bookingRes = await fetch(`${API_BASE_URL}/api/bookings/barber/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (bookingRes.status === 401) {
        clearAuthSession("barber");
        navigate("/barber/login");
        return;
      }

      if (bookingRes.ok) {
        const bookingData = await bookingRes.json();
        const rawBookings = Array.isArray(bookingData) ? bookingData : [];
        setBookings(rawBookings);

        const pendingOffers = rawBookings.filter(
          (b) => b.offer_status === "pending" && b.booking_status === "pending"
        );

        if (knownOfferIdsRef.current.size > 0) {
          const hasNewOffer = pendingOffers.some(
            (o) => !knownOfferIdsRef.current.has(o.offer_id)
          );
          if (hasNewOffer) playNotificationChime();
        }
        knownOfferIdsRef.current = new Set(pendingOffers.map((o) => o.offer_id));
      }

      // Profile request
      const profileRes = await fetch(`${API_BASE_URL}/api/barbers/profile/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (profileRes.ok) {
        const profile = await profileRes.json();
        setBarber({
          ownerName: profile.owner_name || "Barber Partner",
          shopName: profile.shop_name || "Premier Barber Studio",
          city: profile.city || "Jaipur",
          profilePicture: getMediaUrl(profile.profile_picture),
        });
      }
    } catch (err) {
      console.error("Dashboard error:", err);
      setError("Unable to load barber dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 15000);
    return () => clearInterval(interval);
  }, []);

  const acceptBooking = async (offerId) => {
    try {
      const token = getAccessToken("barber");
      const res = await fetch(`${API_BASE_URL}/api/bookings/barber/${offerId}/accept/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        alert("Booking offer accepted!");
        fetchDashboardData();
      } else {
        const d = await res.json();
        alert(d.detail || "Unable to accept booking.");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    }
  };

  const rejectBooking = async (offerId) => {
    try {
      const token = getAccessToken("barber");
      const res = await fetch(`${API_BASE_URL}/api/bookings/barber/${offerId}/reject/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        alert("Booking offer declined.");
        fetchDashboardData();
      } else {
        const d = await res.json();
        alert(d.detail || "Unable to decline booking.");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    }
  };

  // Metrics
  const today = new Date().toISOString().split("T")[0];

  const todayBookings = useMemo(() => {
    return bookings.filter((b) => b.booking_date === today);
  }, [bookings, today]);

  const pendingRequests = useMemo(() => {
    return bookings.filter((b) => b.offer_status === "pending" && b.booking_status === "pending");
  }, [bookings]);

  const confirmedBookings = useMemo(() => {
    return bookings.filter((b) => ["confirmed", "accepted", "in_service"].includes(b.booking_status));
  }, [bookings]);

  const todayEarnings = useMemo(() => {
    return todayBookings
      .filter((b) => ["confirmed", "completed"].includes(b.booking_status))
      .reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
  }, [todayBookings]);

  const totalEarnings = useMemo(() => {
    return bookings
      .filter((b) => ["confirmed", "completed"].includes(b.booking_status))
      .reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
  }, [bookings]);

  // Next upcoming booking
  const nextAppointment = useMemo(() => {
    const active = bookings.filter((b) => ["confirmed", "accepted"].includes(b.booking_status));
    return active.length > 0 ? active[0] : null;
  }, [bookings]);

  if (loading) {
    return (
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <Skeleton variant="card" height="120px" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Skeleton variant="card" height="90px" />
          <Skeleton variant="card" height="90px" />
        </div>
        <Skeleton variant="card" height="180px" />
      </div>
    );
  }

  const firstName = barber.ownerName.split(" ")[0] || "Partner";

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto", padding: "16px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* ================= GREETING HERO ================= */}
      <div style={{
        background: "linear-gradient(135deg, #151515 0%, #222222 100%)",
        borderRadius: "18px",
        padding: "20px",
        color: "#FAF7EF",
        border: "1px solid rgba(212, 160, 23, 0.25)",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#D4A017", textTransform: "uppercase" }}>
              Partner Studio
            </span>
          </div>
          <h1 style={{ fontSize: "20px", fontWeight: "800", color: "#FAF7EF", margin: 0, letterSpacing: "-0.3px" }}>
            Hello, {firstName}
          </h1>
          <p style={{ margin: "3px 0 0", fontSize: "12.5px", color: "rgba(250, 247, 239, 0.7)" }}>
            {barber.shopName} • {barber.city}
          </p>
        </div>

        <Link
          to="/barber/profile"
          style={{
            backgroundColor: "rgba(212, 160, 23, 0.15)",
            border: "1px solid rgba(212, 160, 23, 0.4)",
            color: "#D4A017",
            padding: "8px 14px",
            borderRadius: "10px",
            fontSize: "12px",
            fontWeight: "700",
            textDecoration: "none"
          }}
        >
          View Shop
        </Link>
      </div>

      {/* ================= METRIC CARDS GRID ================= */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        {/* Today's Bookings */}
        <div style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "14px",
          padding: "16px",
          border: "1px solid rgba(0, 0, 0, 0.06)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "11px", color: "#6E6E6E", fontWeight: "700", textTransform: "uppercase" }}>Today's Bookings</span>
            <div style={{ width: "28px", height: "28px", borderRadius: "8px", backgroundColor: "rgba(212, 160, 23, 0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Calendar size={15} color="#D4A017" />
            </div>
          </div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#151515" }}>
            {todayBookings.length}
          </div>
          <span style={{ fontSize: "11px", color: "#16A34A", fontWeight: "600" }}>
            {confirmedBookings.length} Confirmed
          </span>
        </div>

        {/* Pending Requests */}
        <div style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "14px",
          padding: "16px",
          border: pendingRequests.length > 0 ? "1px solid rgba(220, 38, 38, 0.3)" : "1px solid rgba(0, 0, 0, 0.06)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "11px", color: "#6E6E6E", fontWeight: "700", textTransform: "uppercase" }}>Pending Requests</span>
            <div style={{ width: "28px", height: "28px", borderRadius: "8px", backgroundColor: pendingRequests.length > 0 ? "#FEE2E2" : "rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Clock size={15} color={pendingRequests.length > 0 ? "#DC2626" : "#151515"} />
            </div>
          </div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: pendingRequests.length > 0 ? "#DC2626" : "#151515" }}>
            {pendingRequests.length}
          </div>
          <span style={{ fontSize: "11px", color: "#6E6E6E" }}>
            Action required
          </span>
        </div>
      </div>

      {/* ================= EARNINGS CARD ================= */}
      <section
        id="earnings-section"
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          padding: "18px 16px",
          border: isEarningsTab ? "2px solid #D4A017" : "1px solid rgba(0, 0, 0, 0.06)",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
          display: "flex",
          flexDirection: "column",
          gap: "14px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: "15px", fontWeight: "800", color: "#151515", margin: 0 }}>
              Earnings Overview
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6E6E6E" }}>
              Track revenue from completed services
            </p>
          </div>
          <div style={{
            width: "34px",
            height: "34px",
            borderRadius: "10px",
            backgroundColor: "rgba(22, 163, 74, 0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <TrendingUp size={18} color="#16A34A" />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", backgroundColor: "#FAF7EF", padding: "14px", borderRadius: "12px" }}>
          <div>
            <span style={{ fontSize: "11px", color: "#6E6E6E", textTransform: "uppercase" }}>Today's Earnings</span>
            <div style={{ fontSize: "22px", fontWeight: "800", color: "#16A34A", marginTop: "2px" }}>
              ₹{todayEarnings}
            </div>
          </div>
          <div>
            <span style={{ fontSize: "11px", color: "#6E6E6E", textTransform: "uppercase" }}>Total Collected</span>
            <div style={{ fontSize: "22px", fontWeight: "800", color: "#D4A017", marginTop: "2px" }}>
              ₹{totalEarnings}
            </div>
          </div>
        </div>
      </section>

      {/* ================= PENDING REQUESTS (NEW OFFERS) ================= */}
      {pendingRequests.length > 0 && (
        <section style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "800", color: "#151515", margin: 0 }}>
              Incoming Booking Requests ({pendingRequests.length})
            </h2>
          </div>

          {pendingRequests.map((req) => (
            <div
              key={req.offer_id || req.id}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "16px",
                padding: "16px",
                border: "1px solid rgba(220, 38, 38, 0.3)",
                boxShadow: "0 2px 10px rgba(220, 38, 38, 0.06)",
                display: "flex",
                flexDirection: "column",
                gap: "12px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: "#DC2626", textTransform: "uppercase" }}>
                    New Request #{req.booking_id || req.id}
                  </div>
                  <h3 style={{ fontSize: "15px", fontWeight: "800", color: "#151515", margin: "2px 0 0" }}>
                    {req.customer?.name || req.customer_name || "Customer Client"}
                  </h3>
                  <div style={{ fontSize: "12px", color: "#6E6E6E", marginTop: "2px" }}>
                    {req.services_display || req.service?.name || req.service_name || "Grooming Service"} • {req.booking_date} at {req.booking_time}
                  </div>
                  {req.needs_chair_mirror && (
                    <span style={{ fontSize: "10.5px", fontWeight: "750", color: "#92400E", backgroundColor: "#FEF3C7", padding: "2px 6px", borderRadius: "6px", display: "inline-block", marginTop: "4px" }}>
                      🪑 Bring Chair & Mirror
                    </span>
                  )}
                </div>

                <span style={{ fontSize: "15px", fontWeight: "800", color: "#D4A017" }}>
                  ₹{req.total_amount}
                </span>
              </div>

              <div style={{ fontSize: "11.5px", color: "#6E6E6E", display: "flex", alignItems: "center", gap: "4px" }}>
                <MapPin size={12} color="#D4A017" />
                <span>{req.address || "Jaipur, Rajasthan"}</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => rejectBooking(req.offer_id)}
                  style={{
                    padding: "10px",
                    borderRadius: "10px",
                    backgroundColor: "#FEF2F2",
                    border: "1px solid #FECACA",
                    color: "#DC2626",
                    fontWeight: "700",
                    fontSize: "12.5px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px"
                  }}
                >
                  <X size={14} color="#DC2626" />
                  <span>Decline</span>
                </button>

                <button
                  type="button"
                  onClick={() => acceptBooking(req.offer_id)}
                  style={{
                    padding: "10px",
                    borderRadius: "10px",
                    backgroundColor: "#16A34A",
                    border: "none",
                    color: "#FFFFFF",
                    fontWeight: "700",
                    fontSize: "12.5px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px"
                  }}
                >
                  <Check size={14} color="#FFFFFF" />
                  <span>Accept Request</span>
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ================= UPCOMING APPOINTMENT ================= */}
      {nextAppointment && (
        <section style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          padding: "16px",
          border: "1px solid rgba(212, 160, 23, 0.4)",
          display: "flex",
          flexDirection: "column",
          gap: "10px"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", fontWeight: "800", color: "#D4A017", textTransform: "uppercase" }}>
              Next Up Appointment
            </span>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#16A34A", backgroundColor: "#DCFCE7", padding: "2px 8px", borderRadius: "10px" }}>
              Confirmed
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "15px", fontWeight: "800", color: "#151515" }}>
                {nextAppointment.customer?.name || nextAppointment.customer_name || "Customer Client"}
              </div>
              <div style={{ fontSize: "12px", color: "#6E6E6E", marginTop: "2px" }}>
                {nextAppointment.services_display || nextAppointment.service?.name || nextAppointment.service_name || "Grooming Service"} • {nextAppointment.booking_date} at {nextAppointment.booking_time}
              </div>
            </div>
            <Link
              to="/barber/bookings"
              style={{ fontSize: "12.5px", fontWeight: "700", color: "#D4A017", textDecoration: "none", display: "flex", alignItems: "center", gap: "2px" }}
            >
              <span>Manage</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </section>
      )}

      {/* ================= QUICK ACTIONS ================= */}
      <section>
        <h2 style={{ fontSize: "16px", fontWeight: "800", color: "#151515", margin: "0 0 12px 0" }}>
          Quick Actions
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Link
            to="/barber/services"
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "14px",
              padding: "16px",
              border: "1px solid rgba(0, 0, 0, 0.06)",
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              gap: "8px"
            }}
          >
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "rgba(212, 160, 23, 0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Scissors size={18} color="#D4A017" />
            </div>
            <div>
              <strong style={{ fontSize: "13.5px", color: "#151515", display: "block" }}>Manage Services</strong>
              <span style={{ fontSize: "11px", color: "#6E6E6E" }}>Add or edit prices</span>
            </div>
          </Link>

          <Link
            to="/barber/availability"
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "14px",
              padding: "16px",
              border: "1px solid rgba(0, 0, 0, 0.06)",
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              gap: "8px"
            }}
          >
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "rgba(21, 21, 21, 0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Clock size={18} color="#151515" />
            </div>
            <div>
              <strong style={{ fontSize: "13.5px", color: "#151515", display: "block" }}>Weekly Schedule</strong>
              <span style={{ fontSize: "11px", color: "#6E6E6E" }}>Set open & break hours</span>
            </div>
          </Link>
        </div>
      </section>

    </div>
  );
}

export default BarberDashboard;