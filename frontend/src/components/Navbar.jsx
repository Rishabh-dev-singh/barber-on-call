import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getAccessToken, clearAuthSession } from "../services/api";
import { Scissors, MapPin, Bell, User, Calendar, LogOut, Store } from "./common/Icons";
import NotificationsModal from "./common/NotificationsModal";

function Navbar() {
  const [customerToken, setCustomerToken] = useState(null);
  const [barberToken, setBarberToken] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setCustomerToken(getAccessToken("customer"));
    setBarberToken(getAccessToken("barber"));
  }, [location.pathname]);

  const handleCustomerLogout = () => {
    clearAuthSession("customer");
    setCustomerToken(null);
    navigate("/customer/login");
  };

  const handleBarberLogout = () => {
    clearAuthSession("barber");
    setBarberToken(null);
    navigate("/barber/login");
  };

  return (
    <>
      <nav className="navbar" style={{
        backgroundColor: "#151515",
        borderBottom: "1px solid rgba(212, 160, 23, 0.2)",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        boxShadow: "0 2px 10px rgba(0,0,0,0.15)"
      }}>
        {/* Brand Logo & Location */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              backgroundColor: "rgba(212, 160, 23, 0.15)",
              border: "1px solid rgba(212, 160, 23, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Scissors size={20} color="#D4A017" />
            </div>
            <div>
              <div style={{ fontSize: "16px", fontWeight: "800", color: "#FAF7EF", lineHeight: 1.1, letterSpacing: "-0.2px" }}>
                Barber<span style={{ color: "#D4A017", marginLeft: "4px" }}>On Call</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                <MapPin size={11} color="#D4A017" />
                <span style={{ fontSize: "11px", color: "rgba(250, 247, 239, 0.7)", fontWeight: 500 }}>Jaipur, Rajasthan</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Header Right Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {customerToken ? (
            <>
              <button
                type="button"
                onClick={() => setShowNotifications(true)}
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px",
                  color: "#FAF7EF",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative"
                }}
                aria-label="Notifications"
              >
                <Bell size={18} color="#FAF7EF" />
                {unreadCount > 0 && (
                  <span style={{
                    position: "absolute",
                    top: "3px",
                    right: "3px",
                    background: "#DC2626",
                    color: "#fff",
                    borderRadius: "50%",
                    width: "8px",
                    height: "8px"
                  }} />
                )}
              </button>

              <Link
                to="/customer/bookings"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: "rgba(212, 160, 23, 0.15)",
                  color: "#D4A017",
                  border: "1px solid rgba(212, 160, 23, 0.3)",
                  fontSize: "13px",
                  fontWeight: 600,
                  textDecoration: "none"
                }}
              >
                <Calendar size={15} color="#D4A017" />
                <span>Bookings</span>
              </Link>

              <Link
                to="/customer/profile"
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  background: "#D4A017",
                  color: "#151515",
                  fontWeight: 700,
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none"
                }}
                title="Customer Profile"
              >
                <User size={18} color="#151515" />
              </Link>

              <button
                type="button"
                onClick={handleCustomerLogout}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "8px",
                  color: "#ccc",
                  padding: "7px 10px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center"
                }}
                title="Logout Customer"
              >
                <LogOut size={16} color="#bbb" />
              </button>
            </>
          ) : barberToken ? (
            <>
              <Link
                to="/barber/dashboard"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  background: "#D4A017",
                  color: "#151515",
                  fontSize: "13px",
                  fontWeight: 700,
                  textDecoration: "none"
                }}
              >
                <Store size={15} color="#151515" />
                <span>Dashboard</span>
              </Link>

              <Link
                to="/barber/profile"
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  background: "rgba(212, 160, 23, 0.2)",
                  border: "1px solid rgba(212, 160, 23, 0.4)",
                  color: "#D4A017",
                  fontWeight: 700,
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none"
                }}
                title="Barber Profile"
              >
                <User size={18} color="#D4A017" />
              </Link>

              <button
                type="button"
                onClick={handleBarberLogout}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "8px",
                  color: "#ccc",
                  padding: "7px 10px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center"
                }}
                title="Logout Barber"
              >
                <LogOut size={16} color="#bbb" />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/customer/login"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  background: "#D4A017",
                  color: "#151515",
                  fontSize: "13px",
                  fontWeight: 700,
                  textDecoration: "none"
                }}
              >
                <User size={15} color="#151515" />
                <span>Login</span>
              </Link>
              <Link
                to="/barber/login"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: "transparent",
                  border: "1px solid rgba(212, 160, 23, 0.5)",
                  color: "#D4A017",
                  fontSize: "13px",
                  fontWeight: 600,
                  textDecoration: "none"
                }}
              >
                <Store size={15} color="#D4A017" />
                <span>For Barbers</span>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Global Notifications Modal */}
      <NotificationsModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        onCountChange={setUnreadCount}
      />
    </>
  );
}

export default Navbar;