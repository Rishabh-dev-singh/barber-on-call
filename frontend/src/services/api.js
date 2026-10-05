// ==============================================================================
// Centralized API Service for Barber On Call
// ==============================================================================
import { Capacitor } from "@capacitor/core";

// Base URL resolved dynamically based on environment, Capacitor native runtime, and window location
const resolveBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL?.trim();

  // 1. If running natively in Android / iOS via Capacitor APK
  if (Capacitor.isNativePlatform()) {
    // If an env URL is provided and not pointing to localhost loopback, use it
    if (envUrl && !envUrl.includes("127.0.0.1") && !envUrl.includes("localhost")) {
      return envUrl;
    }
    // If env URL is explicitly set, honor it
    if (envUrl && envUrl !== "http://127.0.0.1:8000") {
      return envUrl;
    }
    // Default fallback for Android Emulator if loopback was given
    return "http://10.0.2.2:8000";
  }

  // 2. If an HTTPS production URL is defined, always use it
  if (envUrl && envUrl.startsWith("https://")) {
    return envUrl;
  }

  // 3. Browser environment dynamic resolution
  if (typeof window !== "undefined" && window.location) {
    const hostname = window.location.hostname;

    // Local network Wi-Fi testing from mobile phone browser
    if (/^192\.168\./.test(hostname) || /^10\./.test(hostname) || /^172\./.test(hostname)) {
      return `http://${hostname}:8000`;
    }

    // Localhost on PC browser
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return envUrl || "http://127.0.0.1:8000";
    }

    // Production web deployment (e.g. yourdomain.com)
    if (envUrl) {
      return envUrl;
    }
    return `${window.location.protocol}//${window.location.host}`;
  }

  return envUrl || "http://127.0.0.1:8000";
};

export const API_BASE_URL = resolveBaseUrl().replace(/\/+$/, "");

/**
 * Returns full API URL for a given relative endpoint path
 * @param {string} endpoint - e.g. "/api/accounts/login/" or "api/barbers/list/"
 */
export function getApiUrl(endpoint = "") {
  const cleanPath = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanPath}`;
}

/**
 * Resolves media/image URLs (handles relative vs absolute URLs)
 * @param {string|null} url
 */
export function getMediaUrl(url) {
  if (!url) return null;
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `${API_BASE_URL}${cleanPath}`;
}

// ==============================================================================
// Token Management (Role-Isolated: Customer and Barber can coexist on 1 device)
// ==============================================================================

export function getCurrentContextRole() {
  if (typeof window !== "undefined" && window.location) {
    if (window.location.pathname.startsWith("/barber")) {
      return "barber";
    }
    if (window.location.pathname.startsWith("/customer")) {
      return "customer";
    }
  }
  // Check tab-specific sessionStorage first so separate browser tabs do not overlap
  if (typeof sessionStorage !== "undefined") {
    const sessionRole = sessionStorage.getItem("active_role");
    if (sessionRole === "barber" || sessionRole === "customer") {
      return sessionRole;
    }
  }
  if (typeof localStorage !== "undefined") {
    const localRole = localStorage.getItem("active_role");
    if (localRole === "barber" || localRole === "customer") {
      return localRole;
    }
  }
  return "customer";
}

export function getAccessToken(preferredRole) {
  const role = preferredRole || getCurrentContextRole();
  if (role === "barber") {
    return (
      (typeof sessionStorage !== "undefined" && sessionStorage.getItem("barber_access_token")) ||
      localStorage.getItem("barber_access_token") ||
      null
    );
  }
  return (
    (typeof sessionStorage !== "undefined" && sessionStorage.getItem("customer_access_token")) ||
    localStorage.getItem("customer_access_token") ||
    localStorage.getItem("access_token") ||
    null
  );
}

export function getRefreshToken(preferredRole) {
  const role = preferredRole || getCurrentContextRole();
  if (role === "barber") {
    return (
      (typeof sessionStorage !== "undefined" && sessionStorage.getItem("barber_refresh_token")) ||
      localStorage.getItem("barber_refresh_token") ||
      null
    );
  }
  return (
    (typeof sessionStorage !== "undefined" && sessionStorage.getItem("customer_refresh_token")) ||
    localStorage.getItem("customer_refresh_token") ||
    localStorage.getItem("refresh_token") ||
    null
  );
}

export function getUserRole() {
  return getCurrentContextRole();
}

export function setAuthTokens({ access, refresh, role = null }) {
  const targetRole = role || getCurrentContextRole();

  if (targetRole === "barber") {
    // 1. Completely purge any customer tokens & profile to prevent cross-account access
    localStorage.removeItem("customer_access_token");
    localStorage.removeItem("customer_refresh_token");
    localStorage.removeItem("customer_role");
    localStorage.removeItem("customer_user");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_role");
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem("customer_access_token");
      sessionStorage.removeItem("customer_refresh_token");
    }

    // 2. Set only barber credentials
    if (access) {
      localStorage.setItem("barber_access_token", access);
      if (typeof sessionStorage !== "undefined") sessionStorage.setItem("barber_access_token", access);
    }
    if (refresh) {
      localStorage.setItem("barber_refresh_token", refresh);
      if (typeof sessionStorage !== "undefined") sessionStorage.setItem("barber_refresh_token", refresh);
    }
    localStorage.setItem("barber_role", "barber");
    localStorage.setItem("active_role", "barber");
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("active_role", "barber");
    }
  } else {
    // 1. Completely purge any barber tokens & profile to prevent cross-account access
    localStorage.removeItem("barber_access_token");
    localStorage.removeItem("barber_refresh_token");
    localStorage.removeItem("barber_role");
    localStorage.removeItem("barber_user");
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem("barber_access_token");
      sessionStorage.removeItem("barber_refresh_token");
    }

    // 2. Set only customer credentials
    if (access) {
      localStorage.setItem("customer_access_token", access);
      if (typeof sessionStorage !== "undefined") sessionStorage.setItem("customer_access_token", access);
    }
    if (refresh) {
      localStorage.setItem("customer_refresh_token", refresh);
      if (typeof sessionStorage !== "undefined") sessionStorage.setItem("customer_refresh_token", refresh);
    }
    localStorage.setItem("customer_role", "customer");
    localStorage.setItem("active_role", "customer");
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("active_role", "customer");
    }
  }
}

export function clearAuthSession(targetRole) {
  const role = targetRole || getCurrentContextRole();
  if (role === "barber") {
    localStorage.removeItem("barber_access_token");
    localStorage.removeItem("barber_refresh_token");
    localStorage.removeItem("barber_role");
    localStorage.removeItem("barber_user");
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem("barber_access_token");
      sessionStorage.removeItem("barber_refresh_token");
      if (sessionStorage.getItem("active_role") === "barber") {
        sessionStorage.removeItem("active_role");
      }
    }
  } else {
    localStorage.removeItem("customer_access_token");
    localStorage.removeItem("customer_refresh_token");
    localStorage.removeItem("customer_role");
    localStorage.removeItem("customer_user");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_role");
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem("customer_access_token");
      sessionStorage.removeItem("customer_refresh_token");
      if (sessionStorage.getItem("active_role") === "customer") {
        sessionStorage.removeItem("active_role");
      }
    }
  }
  if (localStorage.getItem("active_role") === role) {
    localStorage.removeItem("active_role");
  }
}

/**
 * Attempts to refresh the access token using the stored refresh token
 */
export async function refreshAccessToken(preferredRole) {
  const role = preferredRole || getCurrentContextRole();
  const refresh = getRefreshToken(role);
  if (!refresh) {
    clearAuthSession(role);
    return null;
  }

  try {
    const response = await fetch(getApiUrl("/api/accounts/refresh/"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh }),
    });

    if (!response.ok) {
      clearAuthSession(role);
      return null;
    }

    const data = await response.json();
    if (data.access) {
      setAuthTokens({
        access: data.access,
        refresh: data.refresh || refresh,
        role,
      });
      return data.access;
    }
    return null;
  } catch (err) {
    console.error("Token refresh failed:", err);
    return null;
  }
}

/**
 * Standard fetch wrapper with automatic Bearer token and 401 token refresh retry
 */
export async function apiFetch(endpoint, options = {}) {
  const url = endpoint.startsWith("http") ? endpoint : getApiUrl(endpoint);
  
  // Intelligent role resolution for endpoint:
  let role = options.role;
  if (!role) {
    const lowerEp = endpoint.toLowerCase();
    if (lowerEp.includes("/barber") || lowerEp.includes("/barbers/")) {
      role = "barber";
    } else if (lowerEp.includes("/customer") || lowerEp.includes("/bookings/customer/")) {
      role = "customer";
    } else {
      role = getCurrentContextRole();
    }
  }

  let token = getAccessToken(role);

  const headers = {
    ...(options.headers || {}),
  };

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Default to JSON Content-Type unless sending FormData
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  let response = await fetch(url, {
    ...options,
    headers,
  });

  // If unauthorized, attempt token refresh once with proper role
  if (response.status === 401) {
    token = await refreshAccessToken(role);
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      response = await fetch(url, {
        ...options,
        headers,
      });
    }
  }

  return response;
}

