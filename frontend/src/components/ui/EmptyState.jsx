import React from "react";
import Button from "./Button";
import "./EmptyState.css";

export default function EmptyState({
  icon: Icon = null,
  title = "No Items Found",
  description = "There are no items to display at this time.",
  actionText = null,
  onAction = null,
  className = "",
}) {
  return (
    <div className={`boc-empty-state ${className}`}>
      {Icon && (
        <div className="boc-empty-icon-wrapper">
          <Icon size={32} className="boc-empty-icon" />
        </div>
      )}
      <h3 className="boc-empty-title">{title}</h3>
      <p className="boc-empty-desc">{description}</p>
      {actionText && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}

