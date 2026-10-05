import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "./Icons";

export default function Toast({ message, type = "info", duration = 3200, onClose }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 250);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(onClose, 250);
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle2 size={22} color="#10B981" />;
      case "error":
        return <AlertCircle size={22} color="#F43F5E" />;
      case "warning":
        return <AlertCircle size={22} color="#F59E0B" />;
      default:
        return <Info size={22} color="#38BDF8" />;
    }
  };

  return (
    <div className={`toast-card toast-${type} ${isExiting ? "toast-exit" : "toast-enter"}`}>
      <div className="toast-icon-wrapper">{getIcon()}</div>
      <div className="toast-content-wrapper">
        <p className="toast-message">{message}</p>
      </div>
      <button type="button" className="toast-close-btn" onClick={handleDismiss} aria-label="Dismiss">
        <X size={16} color="rgba(255,255,255,0.6)" />
      </button>
      <div
        className="toast-progress-bar"
        style={{ animationDuration: `${duration}ms` }}
      />
    </div>
  );
}

