import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
  getAccessToken,
  getCurrentContextRole,
  setAuthTokens,
  clearAuthSession,
} from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const location = useLocation();

  const [customerToken, setCustomerToken] = useState(() => getAccessToken("customer"));
  const [barberToken, setBarberToken] = useState(() => getAccessToken("barber"));
  const [customerUser, setCustomerUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("customer_user") || "null");
    } catch {
      return null;
    }
  });
  const [barberUser, setBarberUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("barber_user") || "null");
    } catch {
      return null;
    }
  });

  // Calculate current context role reactively based on active URL and tab sessionStorage
  const currentRole = useMemo(() => {
    if (location.pathname.startsWith("/barber")) {
      return "barber";
    }
    if (location.pathname.startsWith("/customer")) {
      return "customer";
    }
    return (
      (typeof sessionStorage !== "undefined" && sessionStorage.getItem("active_role")) ||
      (typeof localStorage !== "undefined" && localStorage.getItem("active_role")) ||
      "customer"
    );
  }, [location.pathname]);

  // Sync state whenever route or tokens change
  useEffect(() => {
    setCustomerToken(getAccessToken("customer"));
    setBarberToken(getAccessToken("barber"));
    try {
      setCustomerUser(JSON.parse(localStorage.getItem("customer_user") || "null"));
      setBarberUser(JSON.parse(localStorage.getItem("barber_user") || "null"));
    } catch {
      // Ignore parse errors
    }
  }, [location.pathname]);

  // Sync state gracefully across tabs via window storage event
  useEffect(() => {
    const handleStorageChange = () => {
      setCustomerToken(getAccessToken("customer"));
      setBarberToken(getAccessToken("barber"));
      try {
        setCustomerUser(JSON.parse(localStorage.getItem("customer_user") || "null"));
        setBarberUser(JSON.parse(localStorage.getItem("barber_user") || "null"));
      } catch {
        // Ignore parse errors
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = useCallback(({ access, refresh, role: userRole, ...userData }) => {
    setAuthTokens({ access, refresh, role: userRole });
    if (userRole === "barber") {
      setBarberToken(access);
      setCustomerToken(null);
      setCustomerUser(null);
      if (userData && Object.keys(userData).length > 0) {
        localStorage.setItem("barber_user", JSON.stringify(userData));
        setBarberUser(userData);
      }
    } else {
      setCustomerToken(access);
      setBarberToken(null);
      setBarberUser(null);
      if (userData && Object.keys(userData).length > 0) {
        localStorage.setItem("customer_user", JSON.stringify(userData));
        setCustomerUser(userData);
      }
    }
  }, []);

  const logout = useCallback((specificRole) => {
    const roleToLogout = specificRole || currentRole;
    clearAuthSession(roleToLogout);
    if (roleToLogout === "barber") {
      setBarberToken(null);
      setBarberUser(null);
    } else {
      setCustomerToken(null);
      setCustomerUser(null);
    }
  }, [currentRole]);

  // Strict role exclusivity: An authenticated session is either Customer or Barber, never both
  const activeRole = barberToken ? "barber" : (customerToken ? "customer" : currentRole);
  const currentToken = activeRole === "barber" ? barberToken : customerToken;
  const currentUser = activeRole === "barber" ? barberUser : customerUser;

  const isBarber = activeRole === "barber" && Boolean(barberToken);
  const isCustomer = activeRole === "customer" && Boolean(customerToken);

  const isAuthenticated = Boolean(currentToken);

  const hasRoleAuth = useCallback(
    (requiredRole) => {
      if (requiredRole === "barber") return Boolean(barberToken || getAccessToken("barber"));
      if (requiredRole === "customer") return Boolean(customerToken || getAccessToken("customer"));
      return false;
    },
    [barberToken, customerToken]
  );

  return (
    <AuthContext.Provider
      value={{
        token: currentToken,
        role: activeRole,
        user: currentUser,
        customerToken,
        barberToken,
        customerUser,
        barberUser,
        isCustomer,
        isBarber,
        isAuthenticated,
        hasRoleAuth,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

