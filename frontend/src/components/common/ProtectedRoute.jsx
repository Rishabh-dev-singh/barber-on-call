import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getAccessToken } from "../../services/api";

export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, isBarber, isCustomer, hasRoleAuth } = useAuth();
  const location = useLocation();

  // 1. If not authenticated for this role at all
  const hasAuth = hasRoleAuth ? hasRoleAuth(requiredRole) : Boolean(getAccessToken(requiredRole));

  if (!isAuthenticated && !hasAuth) {
    const loginPath = requiredRole === "barber" ? "/barber/login" : "/customer/login";
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // 2. Strict Cross-Role Security Boundary:
  // If user is a Customer trying to access Barber dashboard/portal
  if (requiredRole === "barber" && !isBarber) {
    return <Navigate to="/customer/dashboard" replace />;
  }

  // If user is a Barber trying to access Customer dashboard/app
  if (requiredRole === "customer" && !isCustomer) {
    return <Navigate to="/barber/dashboard" replace />;
  }

  return children;
}

