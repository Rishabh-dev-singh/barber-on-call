import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Home,
  Search,
  Calendar,
  Heart,
  User,
  LayoutDashboard,
  Clock,
  TrendingUp,
} from "./Icons";
import "./BottomNav.css";

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isBarber, isAuthenticated } = useAuth();

  // Hide bottom nav on explicit authentication/registration flows and dedicated checkout/booking funnels
  const hiddenRoutes = [
    "/customer/login",
    "/customer/register",
    "/barber/login",
    "/barber/apply",
  ];

  if (
    hiddenRoutes.includes(location.pathname) ||
    location.pathname.startsWith("/customer/barber/") ||
    location.pathname.startsWith("/customer/booking")
  ) {
    return null;
  }

  // Customer Navigation Items (Exactly 5 tabs as requested)
  // Home | Find | Bookings | Favorites | Profile
  const customerTabs = [
    {
      id: "home",
      label: "Home",
      path: isAuthenticated && !isBarber ? "/customer/dashboard" : "/",
      icon: Home,
      match: (p) => p === "/" || p === "/customer/dashboard" || p === "/customer",
    },
    {
      id: "find",
      label: "Find",
      path: isAuthenticated ? "/customer/barbers" : "/customer/login",
      icon: Search,
      match: (p, s) =>
        p.startsWith("/customer/barbers") && !s.includes("filter=favorites"),
    },
    {
      id: "bookings",
      label: "Bookings",
      path: isAuthenticated ? "/customer/bookings" : "/customer/login",
      icon: Calendar,
      match: (p) => p.startsWith("/customer/bookings"),
    },
    {
      id: "favorites",
      label: "Favorites",
      path: isAuthenticated ? "/customer/barbers?filter=favorites" : "/customer/login",
      icon: Heart,
      match: (p, s) =>
        p.startsWith("/customer/barbers") && s.includes("filter=favorites"),
    },
    {
      id: "profile",
      label: "Profile",
      path: isAuthenticated ? "/customer/profile" : "/customer/login",
      icon: User,
      match: (p) =>
        p.startsWith("/customer/profile") ||
        p.startsWith("/customer/change-password"),
    },
  ];

  // Barber Navigation Items (Exactly 5 tabs as requested)
  // Dashboard | Schedule | Bookings | Earnings | Profile
  const barberTabs = [
    {
      id: "dashboard",
      label: "Dashboard",
      path: "/barber/dashboard",
      icon: LayoutDashboard,
      match: (p, s) => p === "/barber/dashboard" && !s.includes("tab=earnings"),
    },
    {
      id: "schedule",
      label: "Schedule",
      path: "/barber/availability",
      icon: Clock,
      match: (p) => p.startsWith("/barber/availability"),
    },
    {
      id: "bookings",
      label: "Bookings",
      path: "/barber/bookings",
      icon: Calendar,
      match: (p) => p.startsWith("/barber/bookings"),
    },
    {
      id: "earnings",
      label: "Earnings",
      path: "/barber/dashboard?tab=earnings",
      icon: TrendingUp,
      match: (p, s) => p === "/barber/dashboard" && s.includes("tab=earnings"),
    },
    {
      id: "profile",
      label: "Profile",
      path: "/barber/profile",
      icon: User,
      match: (p) =>
        p.startsWith("/barber/profile") ||
        p.startsWith("/barber/change-password"),
    },
  ];

  const tabs = isBarber ? barberTabs : customerTabs;

  return (
    <nav className="native-bottom-nav">
      <div className="bottom-nav-container">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.match
            ? tab.match(location.pathname, location.search)
            : location.pathname.startsWith(tab.path);

          return (
            <button
              key={tab.id}
              type="button"
              className={`bottom-nav-item ${isActive ? "active" : ""}`}
              onClick={() => navigate(tab.path)}
              aria-label={tab.label}
            >
              <div className="nav-icon-wrapper">
                <Icon size={20} className="nav-svg-icon" />
                {isActive && <div className="active-glow-pill" />}
              </div>
              <span className="nav-label">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
