import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Scissors, ShieldCheck, Mail, Phone, MapPin } from "../../components/common/Icons";

export default function LegalLayout({ title, subtitle, lastUpdated, children }) {
  const navigate = useNavigate();

  const navLinks = [
    { path: "/privacy-policy", label: "Privacy Policy" },
    { path: "/terms-conditions", label: "Terms & Conditions" },
    { path: "/refund-policy", label: "Cancellation & Refund" },
    { path: "/contact-us", label: "Contact Us" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#111111",
        color: "#FAF7EF",
        display: "flex",
        flexDirection: "column",
        fontFamily: "inherit",
      }}
    >
      {/* Top Navigation Bar */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backgroundColor: "rgba(17, 17, 17, 0.92)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "14px 20px",
        }}
      >
        <div
          style={{
            maxWidth: "860px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <button
            onClick={() => navigate("/")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "none",
              border: "none",
              color: "#FAF7EF",
              cursor: "pointer",
              padding: "6px 10px",
              borderRadius: "8px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            <ArrowLeft size={16} />
            <span>Home</span>
          </button>

          <Link
            to="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                backgroundColor: "#E5A93C",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Scissors size={15} color="#151515" />
            </div>
            <span
              style={{
                fontSize: "15px",
                fontWeight: "800",
                color: "#FFFFFF",
                letterSpacing: "-0.3px",
              }}
            >
              Barber <span style={{ color: "#E5A93C" }}>On Call</span>
            </span>
          </Link>

          <Link
            to="/customer/login"
            style={{
              fontSize: "13px",
              fontWeight: "600",
              color: "#E5A93C",
              textDecoration: "none",
              padding: "6px 12px",
              borderRadius: "8px",
              backgroundColor: "rgba(229, 169, 60, 0.1)",
              border: "1px solid rgba(229, 169, 60, 0.3)",
            }}
          >
            Login
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main
        style={{
          flex: 1,
          maxWidth: "860px",
          width: "100%",
          margin: "0 auto",
          padding: "32px 20px 48px",
          boxSizing: "border-box",
        }}
      >
        {/* Page Header */}
        <div style={{ marginBottom: "28px", textAlign: "left" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "20px",
              backgroundColor: "rgba(229, 169, 60, 0.12)",
              color: "#E5A93C",
              fontSize: "12px",
              fontWeight: 600,
              marginBottom: "12px",
            }}
          >
            <ShieldCheck size={14} />
            <span>Official Policy & Compliance</span>
          </div>

          <h1
            style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#FFFFFF",
              margin: "0 0 8px",
              letterSpacing: "-0.5px",
            }}
          >
            {title}
          </h1>

          {subtitle && (
            <p
              style={{
                fontSize: "14px",
                color: "rgba(250, 247, 239, 0.65)",
                margin: "0 0 6px",
                lineHeight: 1.5,
              }}
            >
              {subtitle}
            </p>
          )}

          {lastUpdated && (
            <span
              style={{
                fontSize: "12px",
                color: "rgba(250, 247, 239, 0.4)",
              }}
            >
              Last Updated: {lastUpdated}
            </span>
          )}
        </div>

        {/* Policy Quick Tabs */}
        <nav
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            padding: "8px",
            backgroundColor: "#181818",
            borderRadius: "12px",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            marginBottom: "32px",
          }}
        >
          {navLinks.map((link) => {
            const isActive = window.location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                style={{
                  padding: "8px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: isActive ? 700 : 500,
                  textDecoration: "none",
                  backgroundColor: isActive ? "#E5A93C" : "transparent",
                  color: isActive ? "#111111" : "rgba(250, 247, 239, 0.7)",
                  transition: "all 0.15s ease",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Content Body Card */}
        <div
          style={{
            backgroundColor: "#181818",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "16px",
            padding: "32px 28px",
            lineHeight: 1.7,
            color: "rgba(250, 247, 239, 0.85)",
            fontSize: "14.5px",
          }}
        >
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          backgroundColor: "#0F0F0F",
          padding: "32px 20px 24px",
          marginTop: "auto",
        }}
      >
        <div
          style={{
            maxWidth: "860px",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: "20px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 800,
                  color: "#FFFFFF",
                  marginBottom: "6px",
                }}
              >
                Barber <span style={{ color: "#E5A93C" }}>On Call</span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: "12px",
                  color: "rgba(250, 247, 239, 0.5)",
                  maxWidth: "280px",
                }}
              >
                India's premier on-demand doorstep grooming & verified barber network platform.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                fontSize: "12.5px",
                color: "rgba(250, 247, 239, 0.7)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Phone size={14} color="#E5A93C" />
                <a href="tel:+919784863800" style={{ color: "inherit", textDecoration: "none" }}>
                  +91 9784 863800
                </a>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Mail size={14} color="#E5A93C" />
                <a href="mailto:matar4u@gmail.com" style={{ color: "inherit", textDecoration: "none" }}>
                  matar4u@gmail.com
                </a>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <MapPin size={14} color="#E5A93C" />
                <span>Jaipur, Rajasthan, India</span>
              </div>
            </div>
          </div>

          <div
            style={{
              borderTop: "1px solid rgba(255, 255, 255, 0.05)",
              paddingTop: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
              fontSize: "11.5px",
              color: "rgba(250, 247, 239, 0.4)",
            }}
          >
            <span>© {new Date().getFullYear()} Barber On Call (Prop. Atar Singh). All rights reserved.</span>
            <span>Razorpay Verified Merchant</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
