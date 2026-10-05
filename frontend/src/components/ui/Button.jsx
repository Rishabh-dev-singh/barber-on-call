import React from "react";
import "./Button.css";

export default function Button({
  children,
  variant = "primary", // primary, gold, secondary, outline, ghost, danger
  size = "md", // sm, md, lg
  loading = false,
  disabled = false,
  icon: Icon = null,
  iconPosition = "left",
  fullWidth = false,
  className = "",
  type = "button",
  onClick,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`boc-btn boc-btn-${variant} boc-btn-${size} ${
        fullWidth ? "boc-btn-full" : ""
      } ${loading ? "boc-btn-loading" : ""} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="boc-btn-spinner" />
      ) : (
        <>
          {Icon && iconPosition === "left" && <Icon size={size === "sm" ? 14 : size === "lg" ? 20 : 16} className="boc-btn-icon" />}
          <span className="boc-btn-text">{children}</span>
          {Icon && iconPosition === "right" && <Icon size={size === "sm" ? 14 : size === "lg" ? 20 : 16} className="boc-btn-icon" />}
        </>
      )}
    </button>
  );
}

