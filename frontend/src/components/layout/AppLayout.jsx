import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import MobileHeader from "../common/MobileHeader";
import BottomNav from "../common/BottomNav";
import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL, getAccessToken } from "../../services/api";
import "./AppLayout.css";

export default function AppLayout({ children }) {
  const location = useLocation();
  const { isAuthenticated, isCustomer } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // Chrome (Mobile Header & Bottom Navigation) is hidden on public landing and authentication screens
  const hideChrome = [
    "/",
    "/customer/login",
    "/customer/register",
    "/barber/login",
    "/barber/apply",
  ].includes(location.pathname);

  useEffect(() => {
    if (!isAuthenticated || !isCustomer) return;

    const fetchNotifications = async () => {
      try {
        const token = getAccessToken("customer");
        if (!token) return;

        const res = await fetch(`${API_BASE_URL}/api/bookings/notifications/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unread_count || 0);
        }
      } catch (e) {
        // Silently handle
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated, isCustomer, location.pathname]);

  if (hideChrome) {
    return <>{children}</>;
  }

  return (
    <div className="native-app-shell">
      <MobileHeader unreadCount={unreadCount} />
      <main className="native-app-content">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
