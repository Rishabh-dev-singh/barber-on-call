import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  API_BASE_URL as API_BASE,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
  clearAuthSession,
} from "../../services/api";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
  Phone,
  Store,
  Scissors,
  Check,
  X,
  RefreshCw,
  User,
  Lock,
  ShieldCheck,
} from "../../components/common/Icons";
import StatusBadge from "../../components/ui/StatusBadge";
import EmptyState from "../../components/ui/EmptyState";
import Skeleton from "../../components/ui/Skeleton";

function BarberBookings() {
  const [activeTab, setActiveTab] = useState("pending");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [otpModal, setOtpModal] = useState({
    isOpen: false,
    bookingId: null,
    customerName: "",
    otp: "",
    error: "",
    loading: false,
  });

  const refreshAccessToken = async () => {
    const refreshToken = getRefreshToken("barber");
    if (!refreshToken) return null;
    try {
      const response = await fetch(`${API_BASE}/api/accounts/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      if (!response.ok) {
        clearAuthSession("barber");
        return null;
      }
      const data = await response.json();
      if (data.access) {
        setAuthTokens({
          access: data.access,
          refresh: data.refresh || refreshToken,
          role: "barber",
        });
        return data.access;
      }
      return null;
    } catch {
      return null;
    }
  };

  const authenticatedFetch = async (url, options = {}) => {
    let token = getAccessToken("barber");
    if (!token) throw new Error("NO_TOKEN");

    let response = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      token = await refreshAccessToken();
      if (!token) throw new Error("SESSION_EXPIRED");
      response = await fetch(url, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return response;
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await authenticatedFetch(`${API_BASE}/api/bookings/barber/`);
      if (!response.ok) throw new Error("FAILED");
      const data = await response.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Barber bookings error:", err);
      if (err.message === "SESSION_EXPIRED" || err.message === "NO_TOKEN") {
        setError("Session expired. Please login again.");
      } else {
        setError("Unable to load bookings.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const acceptBooking = async (offerId) => {
    try {
      const response = await authenticatedFetch(
        `${API_BASE}/api/bookings/barber/${offerId}/accept/`,
        { method: "POST" }
      );
      const data = await response.json();
      if (!response.ok) {
        alert(data.detail || "Unable to accept booking.");
        return;
      }
      alert("Booking offer accepted!");
      await fetchBookings();
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    }
  };

  const rejectBooking = async (offerId) => {
    try {
      const response = await authenticatedFetch(
        `${API_BASE}/api/bookings/barber/${offerId}/reject/`,
        { method: "POST" }
      );
      const data = await response.json();
      if (!response.ok) {
        alert(data.detail || "Unable to reject booking.");
        return;
      }
      alert("Booking rejected.");
      await fetchBookings();
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    }
  };

  const handleOpenCompleteModal = (booking) => {
    setOtpModal({
      isOpen: true,
      bookingId: booking.booking_id || booking.id,
      customerName: booking.customer?.name || "Client",
      otp: "",
      error: "",
      loading: false,
    });
  };

  const handleVerifyAndComplete = async (e) => {
    e.preventDefault();
    const enteredOtp = otpModal.otp.trim();
    if (!enteredOtp || enteredOtp.length !== 4) {
      setOtpModal((prev) => ({
        ...prev,
        error: "Please enter the valid 4-digit Service OTP from the customer.",
      }));
      return;
    }

    setOtpModal((prev) => ({ ...prev, loading: true, error: "" }));

    try {
      const response = await authenticatedFetch(
        `${API_BASE}/api/bookings/barber/${otpModal.bookingId}/complete/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ otp: enteredOtp }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setOtpModal((prev) => ({
          ...prev,
          loading: false,
          error: data.detail || "Invalid OTP. Please check with customer.",
        }));
        return;
      }
      setOtpModal({
        isOpen: false,
        bookingId: null,
        customerName: "",
        otp: "",
        error: "",
        loading: false,
      });
      alert("🎉 Booking successfully completed! Earnings updated.");
      await fetchBookings();
    } catch (err) {
      console.error(err);
      setOtpModal((prev) => ({
        ...prev,
        loading: false,
        error: "Network error. Please try again.",
      }));
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";
    try {
      return new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
    } catch {
      return date;
    }
  };

  const formatTime = (time) => {
    if (!time) return "-";
    try {
      const [hours, minutes] = time.split(":");
      const d = new Date();
      d.setHours(Number(hours), Number(minutes));
      return d.toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return time;
    }
  };

  // Filter Bookings by Tab
  const filteredBookings = bookings.filter((b) => {
    if (activeTab === "pending") {
      return b.offer_status === "pending" && b.booking_status === "pending";
    }
    if (activeTab === "confirmed") {
      return ["confirmed", "accepted", "in_service", "awaiting_payment"].includes(b.booking_status);
    }
    if (activeTab === "completed") {
      return b.booking_status === "completed";
    }
    if (activeTab === "declined") {
      return ["rejected", "cancelled"].includes(b.booking_status) || b.offer_status === "rejected";
    }
    return true;
  });

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto", padding: "16px 16px 40px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "16px" }}>
      
      {/* Header Row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: "800", color: "#151515", margin: 0, letterSpacing: "-0.3px" }}>
            Booking Requests
          </h1>
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6E6E6E" }}>
            Manage appointments, offers, and completions
          </p>
        </div>

        <button
          type="button"
          onClick={fetchBookings}
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid rgba(0, 0, 0, 0.1)",
            padding: "8px 12px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "700",
            color: "#151515",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px"
          }}
        >
          <RefreshCw size={13} color="#D4A017" className={loading ? "spin-icon" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px", scrollbarWidth: "none" }}>
        {[
          { id: "pending", label: "New Offers" },
          { id: "confirmed", label: "Confirmed" },
          { id: "completed", label: "Completed" },
          { id: "declined", label: "Declined" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "8px 16px",
              borderRadius: "20px",
              fontSize: "12.5px",
              fontWeight: "700",
              cursor: "pointer",
              whiteSpace: "nowrap",
              border: activeTab === tab.id ? "1px solid #151515" : "1px solid rgba(0,0,0,0.08)",
              backgroundColor: activeTab === tab.id ? "#151515" : "#FFFFFF",
              color: activeTab === tab.id ? "#FAF7EF" : "#151515"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", padding: "12px 14px", borderRadius: "12px", fontSize: "13px" }}>
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ backgroundColor: "#FFFFFF", borderRadius: "14px", padding: "16px", border: "1px solid rgba(0,0,0,0.06)" }}>
              <Skeleton variant="text" width="50%" />
              <Skeleton variant="card" height="60px" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filteredBookings.length === 0 && (
        <EmptyState
          icon={Calendar}
          title={`No ${activeTab} bookings`}
          description="New booking requests from customers will appear here."
        />
      )}

      {/* Bookings List */}
      {!loading && !error && filteredBookings.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filteredBookings.map((b) => (
            <div
              key={b.offer_id || b.id}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "16px",
                padding: "16px",
                border: "1px solid rgba(0, 0, 0, 0.07)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                display: "flex",
                flexDirection: "column",
                gap: "12px"
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: "#D4A017", textTransform: "uppercase" }}>
                    Ref #{b.booking_id || b.id}
                  </div>
                  <h3 style={{ fontSize: "15px", fontWeight: "800", color: "#151515", margin: "2px 0 0" }}>
                    {b.customer?.name || b.customer_name || "Customer Client"}
                  </h3>
                  <div style={{ fontSize: "12px", color: "#6E6E6E", marginTop: "2px" }}>
                    {b.services_display || b.service?.name || b.service_name || "Grooming Service"}
                  </div>
                </div>

                <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                  <div style={{ fontSize: "16px", fontWeight: "800", color: "#151515" }}>
                    ₹{b.total_amount}
                  </div>
                  <span style={{ fontSize: "10px", fontWeight: "700", color: "#D4A017", backgroundColor: "#FAF7EF", padding: "2px 6px", borderRadius: "6px" }}>
                    {b.booking_type === "home" ? "Doorstep" : "Salon"}
                  </span>
                  {b.needs_chair_mirror && (
                    <span style={{ fontSize: "10px", fontWeight: "750", color: "#92400E", backgroundColor: "#FEF3C7", padding: "2px 6px", borderRadius: "6px" }}>
                      🪑 Bring Chair & Mirror
                    </span>
                  )}
                </div>
              </div>

              {/* Schedule & Location */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", backgroundColor: "#FAF7EF", padding: "10px 12px", borderRadius: "10px", fontSize: "12px", color: "#444" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Clock size={13} color="#D4A017" />
                  <span>{formatDate(b.booking_date)} at {formatTime(b.booking_time)}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <MapPin size={13} color="#D4A017" />
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.address || "Jaipur, Rajasthan"}</span>
                </div>
              </div>

              {/* Actions Row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "10px" }}>
                {(b.customer?.phone || b.customer_phone) && (
                  <a
                    href={`tel:${b.customer?.phone || b.customer_phone}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      backgroundColor: "#FAF7EF",
                      border: "1px solid rgba(0,0,0,0.1)",
                      color: "#151515",
                      fontSize: "12px",
                      fontWeight: "700",
                      textDecoration: "none"
                    }}
                  >
                    <Phone size={13} color="#151515" />
                    <span>Call Client</span>
                  </a>
                )}

                {/* Offer Action Buttons */}
                {b.offer_status === "pending" && b.booking_status === "pending" && (
                  <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
                    <button
                      type="button"
                      onClick={() => rejectBooking(b.offer_id)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "8px",
                        backgroundColor: "#FEF2F2",
                        border: "1px solid #FECACA",
                        color: "#DC2626",
                        fontWeight: "700",
                        fontSize: "12px",
                        cursor: "pointer"
                      }}
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      onClick={() => acceptBooking(b.offer_id)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        backgroundColor: "#16A34A",
                        border: "none",
                        color: "#FFFFFF",
                        fontWeight: "700",
                        fontSize: "12px",
                        cursor: "pointer"
                      }}
                    >
                      Accept
                    </button>
                  </div>
                )}

                {/* Complete Button */}
                {["confirmed", "accepted", "in_service"].includes(b.booking_status) && (
                  <button
                    type="button"
                    onClick={() => handleOpenCompleteModal(b)}
                    style={{
                      marginLeft: "auto",
                      padding: "9px 16px",
                      borderRadius: "8px",
                      backgroundColor: "#151515",
                      color: "#FAF7EF",
                      border: "none",
                      fontWeight: "750",
                      fontSize: "12.5px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <CheckCircle size={14} color="#D4A017" />
                    <span>Mark Completed</span>
                  </button>
                )}

                {b.booking_status === "completed" && (
                  <span style={{ marginLeft: "auto", fontSize: "12px", fontWeight: "700", color: "#16A34A" }}>
                    Completed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= OTP VERIFICATION MODAL ================= */}
      {otpModal.isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "16px",
            backdropFilter: "blur(4px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !otpModal.loading) {
              setOtpModal((prev) => ({ ...prev, isOpen: false }));
            }
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "20px",
              padding: "24px 20px",
              width: "100%",
              maxWidth: "380px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.25)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              position: "relative",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  backgroundColor: "#FAF7EF",
                  border: "1px solid rgba(212, 160, 23, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <ShieldCheck size={20} color="#D4A017" />
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#151515", margin: 0 }}>
                    Verify Completion
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: "11.5px", color: "#6E6E6E" }}>
                    Service OTP verification
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={otpModal.loading}
                onClick={() => setOtpModal((prev) => ({ ...prev, isOpen: false }))}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  color: "#6E6E6E",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{
              backgroundColor: "#FAF7EF",
              padding: "12px",
              borderRadius: "12px",
              fontSize: "12px",
              color: "#6E6E6E",
              lineHeight: "1.4",
            }}>
              Ask <strong>{otpModal.customerName}</strong> for the <strong>4-digit Service OTP</strong> displayed on their screen to complete this job.
            </div>

            {otpModal.error && (
              <div style={{
                backgroundColor: "#FEF2F2",
                border: "1px solid #FECACA",
                color: "#DC2626",
                padding: "10px 12px",
                borderRadius: "10px",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}>
                <AlertCircle size={15} color="#DC2626" />
                <span>{otpModal.error}</span>
              </div>
            )}

            <form onSubmit={handleVerifyAndComplete} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "750", color: "#6E6E6E", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                  Customer 4-Digit OTP
                </label>
                <input
                  type="text"
                  maxLength={4}
                  autoFocus
                  placeholder="• • • •"
                  value={otpModal.otp}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setOtpModal((prev) => ({ ...prev, otp: clean, error: "" }));
                  }}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "12px",
                    border: "2px solid #D4A017",
                    backgroundColor: "#FAF7EF",
                    fontSize: "24px",
                    fontWeight: "900",
                    textAlign: "center",
                    letterSpacing: "12px",
                    color: "#151515",
                    boxSizing: "border-box",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  disabled={otpModal.loading}
                  onClick={() => setOtpModal((prev) => ({ ...prev, isOpen: false }))}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "10px",
                    backgroundColor: "#F3F4F6",
                    border: "none",
                    color: "#374151",
                    fontWeight: "700",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={otpModal.loading || otpModal.otp.length !== 4}
                  style={{
                    flex: 2,
                    padding: "12px",
                    borderRadius: "10px",
                    backgroundColor: (otpModal.loading || otpModal.otp.length !== 4) ? "#9CA3AF" : "#151515",
                    border: "none",
                    color: "#FAF7EF",
                    fontWeight: "800",
                    fontSize: "13px",
                    cursor: (otpModal.loading || otpModal.otp.length !== 4) ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  {otpModal.loading ? "Verifying..." : "Verify & Complete"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default BarberBookings;