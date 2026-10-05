import React, { createContext, useContext, useState, useCallback } from "react";
import Toast from "../components/common/Toast";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /**
   * Show a modern world-class toast notification
   * @param {string} message - Text or JSX to display
   * @param {'success' | 'error' | 'info' | 'warning'} type - Visual category
   * @param {number} duration - Auto dismiss timeout in ms (default: 3200)
   */
  const showToast = useCallback((message, type = "info", duration = 3200) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  // Bridge native window.alert to world-class Toast notifications
  React.useEffect(() => {
    window.__showToast = (msg, type = "info") => showToast(msg, type);
    const originalAlert = window.alert;
    window.alert = (msg) => {
      const text = String(msg || "");
      const lower = text.toLowerCase();
      const type =
        lower.includes("success") || lower.includes("successful")
          ? "success"
          : lower.includes("error") ||
            lower.includes("failed") ||
            lower.includes("invalid") ||
            lower.includes("unable") ||
            lower.includes("wrong")
          ? "error"
          : lower.includes("please") ||
            lower.includes("select") ||
            lower.includes("required") ||
            lower.includes("need")
          ? "warning"
          : "info";
      showToast(text, type);
    };
    return () => {
      window.alert = originalAlert;
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div className="toast-portal-root">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            id={t.id}
            message={t.message}
            type={t.type}
            duration={t.duration}
            onClose={() => removeToast(t.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback if rendered outside provider
    return {
      showToast: (msg) => console.log("[Toast fallback]:", msg),
      removeToast: () => {},
    };
  }
  return ctx;
}
