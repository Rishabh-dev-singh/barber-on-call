import React from "react";
import "./Skeleton.css";

export default function Skeleton({
  variant = "rectangular", // text, circular, rectangular, card
  width,
  height,
  borderRadius,
  className = "",
  style = {},
}) {
  return (
    <div
      className={`boc-skeleton boc-skeleton-${variant} ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  );
}

