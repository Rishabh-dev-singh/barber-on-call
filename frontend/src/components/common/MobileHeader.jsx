import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ArrowLeft, Bell, MapPin, Scissors } from "./Icons";
import NotificationsModal from "./NotificationsModal";
import "./MobileHeader.css";

export default function MobileHeader({ unreadCount: initialUnreadCount = 0 }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isCustomer, isBarber, isAuthenticated } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);

  // Hide header on login, register, and public landing page (which has its own Navbar)
  const hiddenRoutes = [
    "/",
    "/customer/login",
    "/customer/register",
    "/barber/login",
    "/barber/apply",
  ];

  if (hiddenRoutes.includes(location.pathname)) {
    return null;
  }

  // Determine if current screen is a root tab screen
  const isRootTab = [
    "/customer/dashboard",
    "/customer/barbers",
    "/customer/bookings",
    "/customer/profile",
    "/barber/dashboard",
    "/barber/bookings",
    "/barber/availability",
    "/barber/services",
    "/barber/profile",
  ].includes(location.pathname);

  // Derive title for subpages
  const getPageTitle = () => {
    if (location.pathname.includes("/customer/barber/")) return "Barber Details";
    if (location.pathname.includes("/customer/booking")) return "Book Appointment";
    if (location.pathname.includes("/customer/change-password")) return "Change Password";
    if (location.pathname.includes("/barber/change-password")) return "Change Password";
    return "Barber On Call";
  };

  return (
    <>
      <header className="native-mobile-header">
        <div className="mobile-header-inner">
          {!isRootTab ? (
            /* Subpage Header with Back Button */
            <div className="subpage-header-row">
              <button
                type="button"
                className="header-back-btn"
                onClick={() => navigate(-1)}
                aria-label="Back"
              >
                <ArrowLeft size={20} color="#151515" />
              </button>
              <h1 className="header-subpage-title">{getPageTitle()}</h1>
              <div className="header-spacer" />
            </div>
          ) : (
            <div className="root-header-row">
              <div className="header-left">
                <div
                  className="brand-badge"
                  onClick={() => navigate(isBarber ? "/barber/dashboard" : (isAuthenticated ? "/customer/dashboard" : "/"))}
                  style={{ cursor: "pointer" }}
                >
                  <div className="brand-logo-circle">
                    <Scissors size={18} color="#D4A017" />
                  </div>
                  <div className="brand-info">
                    <span className="brand-title">Barber On Call</span>
                    <div className="location-pill">
                      <MapPin size={11} color="#D4A017" />
                      <span className="location-text">Jaipur, Rajasthan</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="header-right">
                {isAuthenticated && isCustomer && (
                  <button
                    type="button"
                    className="header-icon-btn"
                    onClick={() => setShowNotifications(true)}
                    aria-label="Notifications"
                  >
                    <Bell size={18} color="#151515" />
                    {unreadCount > 0 && (
                      <span className="notification-badge-dot">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>
                )}

                {isAuthenticated ? (
                  <button
                    type="button"
                    className="header-avatar-btn"
                    onClick={() =>
                      navigate(isBarber ? "/barber/profile" : "/customer/profile")
                    }
                    aria-label="User Profile"
                  >
                    <div className="user-avatar-initial">
                      {user?.name ? user.name[0].toUpperCase() : (isBarber ? "B" : "C")}
                    </div>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate("/customer/login")}
                    style={{
                      background: "#D4A017",
                      color: "#151515",
                      border: "none",
                      borderRadius: "8px",
                      padding: "6px 14px",
                      fontWeight: 700,
                      fontSize: "12px",
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(212, 160, 23, 0.25)"
                    }}
                  >
                    Login
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Interactive Global Notifications Sheet */}
      <NotificationsModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        onCountChange={setUnreadCount}
      />
    </>
  );
}
