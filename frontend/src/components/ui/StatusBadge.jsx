import React from "react";
import "./StatusBadge.css";

const STATUS_CONFIG = {
  pending: { label: "Pending", variant: "warning" },
  awaiting_payment: { label: "Action Required", variant: "gold" },
  accepted: { label: "Accepted", variant: "info" },
  confirmed: { label: "Confirmed", variant: "success" },
  on_the_way: { label: "On The Way", variant: "info" },
  in_service: { label: "In Service", variant: "info" },
  completed: { label: "Completed", variant: "neutral" },
  cancelled: { label: "Cancelled", variant: "error" },
  rejected: { label: "Declined", variant: "error" },
  payment_failed: { label: "Payment Failed", variant: "error" },
};

export default function StatusBadge({ status, label = null, className = "" }) {
  const config = STATUS_CONFIG[status] || {
    label: label || status || "Pending",
    variant: "neutral",
  };

  return (
    <span className={`boc-status-badge boc-badge-${config.variant} ${className}`}>
      <span className="boc-badge-dot" />
      <span className="boc-badge-label">{label || config.label}</span>
    </span>
  );
}

