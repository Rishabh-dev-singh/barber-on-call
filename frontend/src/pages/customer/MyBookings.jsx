import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL as API_BASE, getAccessToken } from "../../services/api";
import {
  Scissors,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Star,
  CreditCard,
  Phone,
  Store,
  X,
  ChevronRight,
  ShieldCheck,
} from "../../components/common/Icons";
import StatusBadge from "../../components/ui/StatusBadge";
import EmptyState from "../../components/ui/EmptyState";
import Skeleton from "../../components/ui/Skeleton";
import "./MyBookings.css";

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payingId, setPayingId] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  // Booking Details Modal state
  const [detailsModal, setDetailsModal] = useState({
    isOpen: false,
    booking: null,
  });

  // Review Modal state
  const [reviewModal, setReviewModal] = useState({
    isOpen: false,
    booking: null,
    rating: 5,
    comment: "",
  });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError("");
      const token = getAccessToken("customer");

      if (!token) {
        setError("Please login to view your bookings.");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE}/api/bookings/customer/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        setError("Session expired. Please login again.");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to load bookings");
      }

      const data = await response.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("My Bookings Error:", err);
      setError("Unable to load your bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const verifyPayment = async (bookingId, paymentData, bookingAmount) => {
    try {
      const token = getAccessToken("customer");
      const response = await fetch(
        `${API_BASE}/api/bookings/customer/${bookingId}/verify-payment/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...paymentData,
            amount: bookingAmount,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) {
        alert(result.detail || "Payment verification failed. Please contact support.");
        return;
      }

      alert("🎉 Payment Successful! Your booking is confirmed.");
      await fetchBookings();
    } catch (err) {
      console.error("Verify payment error:", err);
      alert("Payment verification error. Please check your connection.");
    } finally {
      setPayingId(null);
    }
  };

  const handlePayOnline = async (booking) => {
    try {
      setPayingId(booking.id);
      const token = getAccessToken("customer");
      if (!token) {
        alert("Please login first.");
        setPayingId(null);
        return;
      }

      // Ensure Razorpay SDK is loaded
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        alert("Failed to load Razorpay payment SDK. Please check your internet connection and try again.");
        setPayingId(null);
        return;
      }

      const response = await fetch(
        `${API_BASE}/api/bookings/customer/${booking.id}/create-razorpay-order/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        alert(data.detail || "Unable to initiate payment.");
        setPayingId(null);
        return;
      }

      const rzpKey = data.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID;

      if (
        window.Razorpay &&
        rzpKey &&
        !rzpKey.startsWith("rzp_test_placeholder")
      ) {
        const options = {
          key: rzpKey,
          amount: data.amount,
          currency: data.currency || "INR",
          name: data.barber_shop_name || "Barber On Call",
          description: `Payment for ${data.service_name || "Barber Service"}`,
          order_id: data.order_id,
          prefill: {
            name: data.customer?.name || "",
            email: data.customer?.email || "",
            contact: data.customer?.phone || "",
          },
          theme: { color: "#D4A017" },
          handler: async function (paymentResponse) {
            await verifyPayment(booking.id, {
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            }, booking.total_amount);
          },
          modal: {
            ondismiss: function () {
              setPayingId(null);
            },
          },
        };

        const rzp = new window.Razorpay(options);

        rzp.on("payment.failed", function (failResponse) {
          console.error("Razorpay Payment Failed:", failResponse.error);
          alert(`Payment Failed: ${failResponse.error?.description || "Transaction failed"}. Your booking remains awaiting payment so you can retry anytime.`);
          setPayingId(null);
        });

        rzp.open();
      } else {
        alert("Payment gateway key is missing or not configured.");
        setPayingId(null);
      }
    } catch (err) {
      console.error("Initiate payment error:", err);
      alert("Something went wrong while connecting to payment gateway.");
      setPayingId(null);
    }
  };

  const handleCancelBooking = async (bookingId, isPaid = false) => {
    const confirmMessage = isPaid
      ? "Are you sure you want to cancel this booking? A refund will be initiated."
      : "Are you sure you want to cancel this booking?";
    const confirmCancel = window.confirm(confirmMessage);
    if (!confirmCancel) return;

    try {
      const token = getAccessToken("customer");
      const response = await fetch(
        `${API_BASE}/api/bookings/customer/${bookingId}/cancel/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        alert(data.detail || "Unable to cancel booking.");
        return;
      }

      alert(data.detail || "Booking cancelled successfully.");
      if (detailsModal.isOpen) {
        setDetailsModal({ isOpen: false, booking: null });
      }
      await fetchBookings();
    } catch (err) {
      console.error("Cancel booking error:", err);
      alert("Failed to cancel booking.");
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewModal.booking) return;
    const barberId = reviewModal.booking.barber?.id;
    if (!barberId) {
      alert("Barber information is missing.");
      return;
    }

    try {
      setReviewSubmitting(true);
      const token = getAccessToken("customer");
      const response = await fetch(
        `${API_BASE}/api/barbers/${barberId}/reviews/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            booking_id: reviewModal.booking.id,
            rating: reviewModal.rating,
            comment: reviewModal.comment.trim(),
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        alert(data.detail || "Failed to submit review.");
        return;
      }

      alert("Thank you! Your review has been submitted.");
      setReviewModal({ isOpen: false, booking: null, rating: 5, comment: "" });
      await fetchBookings();
    } catch (err) {
      console.error("Submit review error:", err);
      alert("Failed to submit review.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Date not set";
    try {
      const date = new Date(dateString + "T00:00:00");
      return date.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return "Time not set";
    try {
      const [hours, minutes] = timeString.split(":");
      const date = new Date();
      date.setHours(Number(hours), Number(minutes));
      return date.toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return timeString;
    }
  };

  // Filter Bookings by Tab
  const filteredBookings = bookings.filter((b) => {
    if (activeTab === "all") return true;
    if (activeTab === "upcoming") {
      return ["pending", "awaiting_payment", "confirmed", "accepted", "in_service"].includes(b.status);
    }
    if (activeTab === "completed") {
      return b.status === "completed";
    }
    if (activeTab === "cancelled") {
      return ["cancelled", "rejected", "payment_failed"].includes(b.status);
    }
    return true;
  });

  return (
    <div className="luxury-bookings-container">
      {/* ================= HEADER HERO ================= */}
      <div className="luxury-bookings-hero">
        <div className="hero-eyebrow-row">
          <span className="luxury-eyebrow">
            <Scissors size={14} color="#D4A017" />
            <span>MY APPOINTMENTS</span>
          </span>
          <button
            type="button"
            onClick={fetchBookings}
            className="luxury-refresh-pill"
          >
            <RefreshCw size={13} className={loading ? "spin-icon" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="hero-title-row">
          <div>
            <h1 className="luxury-page-title">My Bookings</h1>
            <p className="luxury-page-subtitle">
              Manage appointments and track doorstep visits
            </p>
          </div>
          <div className="luxury-count-pill">
            <span className="count-num">{bookings.length}</span>
            <span className="count-label">Total</span>
          </div>
        </div>
      </div>

      {/* ================= FILTER TABS ================= */}
      <div className="luxury-filter-tabs">
        {[
          { id: "all", label: "All" },
          { id: "upcoming", label: "Upcoming" },
          { id: "completed", label: "Completed" },
          { id: "cancelled", label: "Cancelled" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`luxury-tab-pill ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ================= ERROR STATE ================= */}
      {error && (
        <div className="luxury-error-box">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertCircle size={16} color="#DC2626" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchBookings}
            className="cancel-ghost-btn"
            style={{ padding: "6px 12px" }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* ================= LOADING STATE ================= */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", padding: "16px", border: "1px solid rgba(0,0,0,0.06)" }}>
              <Skeleton variant="text" width="40%" height="20px" />
              <Skeleton variant="title" width="70%" />
              <Skeleton variant="card" height="50px" />
            </div>
          ))}
        </div>
      )}

      {/* ================= EMPTY STATE ================= */}
      {!loading && !error && filteredBookings.length === 0 && (
        <EmptyState
          icon={Calendar}
          title={activeTab === "all" ? "No Appointments Yet" : `No ${activeTab} Bookings`}
          description={
            activeTab === "all"
              ? "Discover expert barbers in Jaipur and schedule your first doorstep or salon service."
              : `You have no appointments currently under "${activeTab}".`
          }
          actionLabel="Find a Barber"
          onAction={() => window.location.href = "/customer/barbers"}
        />
      )}

      {/* ================= BOOKINGS LIST ================= */}
      {!loading && !error && filteredBookings.length > 0 && (
        <div className="luxury-bookings-list">
          {filteredBookings.map((booking) => {
            const barberName =
              booking.barber?.shop_name ||
              booking.barber?.owner_name ||
              "Barber On Call Specialist";
            const serviceNames = booking.services?.length
              ? booking.services.map((s) => s.name).join(", ")
              : booking.services_display || booking.service?.name || "Grooming Service";

            return (
              <div key={booking.id} className="luxury-booking-card">
                {/* Header Row */}
                <div className="card-header-row">
                  <div className="card-title-group">
                    <div className="booking-ref-badge">
                      <Scissors size={12} color="#D4A017" />
                      <span>#{booking.id}</span>
                    </div>
                    <h3 className="service-title-text">{serviceNames}</h3>
                  </div>

                  <StatusBadge status={booking.status} />
                </div>

                {/* Barber Info Row */}
                <div className="card-barber-row">
                  <div className="barber-circle-avatar">
                    {barberName.charAt(0).toUpperCase()}
                  </div>
                  <div className="barber-info-text">
                    <span className="barber-shop-name">{barberName}</span>
                    <div className="barber-location-tag">
                      <MapPin size={11} color="#6E6E6E" />
                      <span>{booking.barber?.city || "Jaipur"}</span>
                    </div>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="card-metrics-grid">
                  <div className="metric-box">
                    <span className="metric-label">Date</span>
                    <span className="metric-value">{formatDate(booking.booking_date)}</span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-label">Time</span>
                    <span className="metric-value">{formatTime(booking.booking_time)}</span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-label">Total Amount</span>
                    <span className="metric-value price">₹{booking.total_amount}</span>
                  </div>
                </div>

                {/* Service Type Tag */}
                <div className="card-meta-row">
                  <span className="meta-pill-type">
                    {booking.booking_type === "home" ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <Scissors size={12} color="#D4A017" />
                        <span>Doorstep Visit</span>
                      </span>
                    ) : (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <Store size={12} color="#151515" />
                        <span>Salon Visit</span>
                      </span>
                    )}
                  </span>
                  {booking.booking_type === "home" && booking.needs_chair_mirror && (
                    <span style={{ fontSize: "10.5px", fontWeight: "750", color: "#92400E", backgroundColor: "#FEF3C7", padding: "3px 8px", borderRadius: "12px", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                      <span>🪑 Stylist brings chair & mirror</span>
                    </span>
                  )}
                  <span className="meta-address-text">
                    {booking.address || (booking.booking_type === "home" ? "Home Address" : "Salon Address")}
                  </span>
                </div>

                {/* Actions Row */}
                <div className="card-actions-row">
                  <button
                    type="button"
                    onClick={() => setDetailsModal({ isOpen: true, booking })}
                    style={{
                      backgroundColor: "#FAF7EF",
                      border: "1px solid rgba(212, 160, 23, 0.4)",
                      borderRadius: "10px",
                      padding: "8px 14px",
                      fontSize: "12px",
                      fontWeight: "700",
                      color: "#151515",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    <span>View Details</span>
                    <ChevronRight size={14} color="#151515" />
                  </button>

                  {/* Payment CTA if required */}
                  {booking.status === "awaiting_payment" && (
                    <button
                      type="button"
                      className="gold-pay-btn"
                      disabled={payingId === booking.id}
                      onClick={() => handlePayOnline(booking)}
                    >
                      <CreditCard size={14} color="#151515" />
                      <span>{payingId === booking.id ? "Connecting..." : `Pay ₹${booking.total_amount}`}</span>
                    </button>
                  )}

                  {/* Rate & Review if completed */}
                  {booking.status === "completed" && !booking.is_reviewed && (
                    <button
                      type="button"
                      className="rate-barber-btn"
                      onClick={() => setReviewModal({ isOpen: true, booking, rating: 5, comment: "" })}
                    >
                      <Star size={13} color="#D4A017" />
                      <span>Rate Barber</span>
                    </button>
                  )}

                  {booking.status === "pending" && (
                    <button
                      type="button"
                      className="cancel-ghost-btn"
                      onClick={() => handleCancelBooking(booking.id)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= BOOKING DETAILS MODAL ================= */}
      {detailsModal.isOpen && detailsModal.booking && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          zIndex: 1000,
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            backgroundColor: "#FFFFFF",
            borderTopLeftRadius: "24px",
            borderTopRightRadius: "24px",
            width: "100%",
            maxWidth: "500px",
            maxHeight: "85vh",
            overflowY: "auto",
            padding: "20px 20px 32px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: "16px"
          }}>
            {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(0,0,0,0.06)", paddingBottom: "12px" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#151515", margin: 0 }}>
                  Booking Details
                </h3>
                <span style={{ fontSize: "12px", color: "#6E6E6E" }}>
                  Ref #{detailsModal.booking.id}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDetailsModal({ isOpen: false, booking: null })}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: "#FAF7EF",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer"
                }}
              >
                <X size={18} color="#151515" />
              </button>
            </div>

            {/* Status Pill & Alert */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#FAF7EF", padding: "12px 14px", borderRadius: "12px" }}>
              <div>
                <div style={{ fontSize: "11px", color: "#6E6E6E" }}>Current Status</div>
                <div style={{ fontSize: "14px", fontWeight: "800", color: "#151515", textTransform: "capitalize", marginTop: "2px" }}>
                  {detailsModal.booking.status.replace("_", " ")}
                </div>
              </div>
              <StatusBadge status={detailsModal.booking.status} />
            </div>

            {/* Barber Information */}
            <div style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "14px", padding: "14px" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "#D4A017", textTransform: "uppercase", marginBottom: "6px" }}>
                Barber Specialist
              </div>
              <h4 style={{ fontSize: "15px", fontWeight: "800", color: "#151515", margin: "0 0 2px 0" }}>
                {detailsModal.booking.barber?.shop_name || "Professional Barber Studio"}
              </h4>
              <p style={{ margin: 0, fontSize: "12px", color: "#6E6E6E" }}>
                Stylist: {detailsModal.booking.barber?.owner_name || "Assigned Stylist"} • {detailsModal.booking.barber?.city || "Jaipur"}
              </p>

              {detailsModal.booking.barber?.phone && (
                <a
                  href={`tel:${detailsModal.booking.barber.phone}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    marginTop: "10px",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    backgroundColor: "#FAF7EF",
                    border: "1px solid rgba(212, 160, 23, 0.4)",
                    color: "#151515",
                    fontSize: "12px",
                    fontWeight: "700",
                    textDecoration: "none"
                  }}
                >
                  <Phone size={13} color="#D4A017" />
                  <span>Call Barber ({detailsModal.booking.barber.phone})</span>
                </a>
              )}
            </div>

            {/* Service & Schedule Breakdown */}
            <div style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "14px", padding: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "#6E6E6E", textTransform: "uppercase" }}>
                Schedule & Location
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#151515" }}>
                <Calendar size={14} color="#D4A017" />
                <span>{formatDate(detailsModal.booking.booking_date)} at {formatTime(detailsModal.booking.booking_time)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#151515" }}>
                <MapPin size={14} color="#D4A017" />
                <span>{detailsModal.booking.address}</span>
              </div>
            </div>

            {/* Price Breakdown */}
            <div style={{ backgroundColor: "#FAF7EF", borderRadius: "14px", padding: "14px", display: "flex", flexDirection: "column", gap: "6px", fontSize: "12.5px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#6E6E6E" }}>
                <span>Service Mode:</span>
                <strong style={{ color: "#151515" }}>{detailsModal.booking.booking_type === "home" ? "Doorstep Visit" : "Salon Chair"}</strong>
              </div>
              {detailsModal.booking.booking_type === "home" && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "#6E6E6E" }}>
                  <span>Chair & Mirror:</span>
                  <strong style={{ color: detailsModal.booking.needs_chair_mirror ? "#D4A017" : "#16A34A" }}>
                    {detailsModal.booking.needs_chair_mirror ? "Stylist Brings Portable Kit" : "Customer Provided"}
                  </strong>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", color: "#6E6E6E" }}>
                <span>Payment Mode:</span>
                <strong style={{ color: "#151515" }}>{detailsModal.booking.payment_method === "online" ? "Online Paid" : "Pay After Service"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14.5px", fontWeight: "800", color: "#151515", borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: "8px", marginTop: "4px" }}>
                <span>Total Amount:</span>
                <span style={{ color: "#D4A017" }}>₹{detailsModal.booking.total_amount}</span>
              </div>
            </div>

            {/* Actions Inside Modal */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {detailsModal.booking.status === "awaiting_payment" && (
                <button
                  type="button"
                  className="gold-pay-btn"
                  onClick={() => {
                    const b = detailsModal.booking;
                    setDetailsModal({ isOpen: false, booking: null });
                    handlePayOnline(b);
                  }}
                  style={{ width: "100%" }}
                >
                  <CreditCard size={16} color="#151515" />
                  <span>Pay ₹{detailsModal.booking.total_amount} Online</span>
                </button>
              )}

              {["pending", "awaiting_payment", "confirmed"].includes(detailsModal.booking.status) && (
                <button
                  type="button"
                  onClick={() => handleCancelBooking(detailsModal.booking.id, detailsModal.booking.status === "confirmed")}
                  style={{
                    width: "100%",
                    padding: "11px",
                    borderRadius: "10px",
                    backgroundColor: "#FEF2F2",
                    border: "1px solid #FECACA",
                    color: "#DC2626",
                    fontWeight: "700",
                    fontSize: "13px",
                    cursor: "pointer"
                  }}
                >
                  Cancel Booking
                </button>
              )}

              <button
                type="button"
                onClick={() => setDetailsModal({ isOpen: false, booking: null })}
                style={{
                  width: "100%",
                  padding: "11px",
                  borderRadius: "10px",
                  backgroundColor: "transparent",
                  border: "1px solid rgba(0,0,0,0.1)",
                  color: "#151515",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= RATE & REVIEW MODAL ================= */}
      {reviewModal.isOpen && (
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
            padding: "24px 20px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: "16px"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#151515", margin: 0 }}>
                Rate Your Experience
              </h3>
              <button
                type="button"
                onClick={() => setReviewModal({ isOpen: false, booking: null, rating: 5, comment: "" })}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={18} color="#6E6E6E" />
              </button>
            </div>

            <div style={{ textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", gap: "8px", margin: "12px 0" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewModal({ ...reviewModal, rating: star })}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px"
                    }}
                  >
                    <Star
                      size={28}
                      color="#D4A017"
                      style={{ fill: star <= reviewModal.rating ? "#D4A017" : "none" }}
                    />
                  </button>
                ))}
              </div>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "#151515" }}>
                {reviewModal.rating} of 5 Stars
              </span>
            </div>

            <textarea
              placeholder="Share feedback on grooming quality, punctuality, and styling..."
              rows={4}
              value={reviewModal.comment}
              onChange={(e) => setReviewModal({ ...reviewModal, comment: e.target.value })}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid rgba(0,0,0,0.12)",
                fontSize: "13px",
                boxSizing: "border-box",
                fontFamily: "inherit"
              }}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setReviewModal({ isOpen: false, booking: null, rating: 5, comment: "" })}
                style={{
                  padding: "11px",
                  borderRadius: "10px",
                  backgroundColor: "#FAF7EF",
                  border: "1px solid rgba(0,0,0,0.1)",
                  color: "#151515",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reviewSubmitting}
                onClick={handleSubmitReview}
                style={{
                  padding: "11px",
                  borderRadius: "10px",
                  backgroundColor: "#D4A017",
                  border: "none",
                  color: "#151515",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: reviewSubmitting ? "not-allowed" : "pointer"
                }}
              >
                {reviewSubmitting ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default MyBookings;