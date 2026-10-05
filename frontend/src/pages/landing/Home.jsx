import React from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getAccessToken } from "../../services/api";
import {
  Scissors,
  User,
  Store,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  LogIn,
  UserPlus,
  Calendar,
  Home as HomeIcon,
  Tag,
} from "../../components/common/Icons";

export default function Home() {
  const { customerToken, barberToken, hasCustomerSession, hasBarberSession } = useAuth();
  const isCustomer = Boolean(hasCustomerSession || customerToken || getAccessToken("customer"));
  const isBarber = Boolean(hasBarberSession || barberToken || getAccessToken("barber"));

  return (
    <div
      className="public-home-container"
      style={{
        backgroundColor: "#FAF7EF",
        color: "#151515",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        margin: 0,
        padding: 0,
      }}
    >
      {/* =========================================================================
          HERO BANNER SECTION (Dark Immersive Visual with Header Overlay)
          ========================================================================= */}
      <section
        style={{
          position: "relative",
          width: "100%",
          backgroundColor: "#121212",
          overflow: "hidden",
        }}
      >
        {/* Background Image: Barber Styling Client Hair */}
        <img
          src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1000&q=85"
          alt="Professional Barber At Work"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center 25%",
            filter: "brightness(0.65) contrast(1.1)",
          }}
        />

        {/* Cinematic Vignette Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(14, 14, 14, 0.8) 0%, rgba(14, 14, 14, 0.45) 40%, rgba(14, 14, 14, 0.88) 85%, #FAF7EF 100%)",
          }}
        />

        {/* Hero Content Shell (Max 480px) */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            maxWidth: "480px",
            margin: "0 auto",
            padding: "max(env(safe-area-inset-top, 0px), 14px) 16px 28px 16px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Top Header Row */}
          <header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "36px",
            }}
          >
            {/* Left: Brand Logo & Title */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "10px",
                  backgroundColor: "#E5A93C",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(229, 169, 60, 0.35)",
                  flexShrink: 0,
                }}
              >
                <Scissors size={20} color="#151515" />
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: "5px" }}>
                <span style={{ fontSize: "19px", fontWeight: "800", color: "#FFFFFF", letterSpacing: "-0.3px" }}>
                  Barber
                </span>
                <span style={{ fontSize: "19px", fontWeight: "800", color: "#E5A93C", letterSpacing: "-0.3px" }}>
                  On Call
                </span>
              </div>
            </div>

            {/* Right: Quick Action based on authentic session */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {isBarber ? (
                <Link
                  to="/barber/dashboard"
                  style={{
                    backgroundColor: "rgba(229, 169, 60, 0.2)",
                    border: "1px solid #E5A93C",
                    color: "#FAF7EF",
                    fontSize: "11px",
                    fontWeight: "700",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Store size={12} color="#E5A93C" />
                  <span>Barber Dashboard</span>
                </Link>
              ) : isCustomer ? (
                <Link
                  to="/customer/dashboard"
                  style={{
                    backgroundColor: "rgba(229, 169, 60, 0.2)",
                    border: "1px solid #E5A93C",
                    color: "#FAF7EF",
                    fontSize: "11px",
                    fontWeight: "700",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <User size={12} color="#E5A93C" />
                  <span>My Dashboard</span>
                </Link>
              ) : (
                <Link
                  to="/barber/login"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.25)",
                    color: "#FAF7EF",
                    fontSize: "11px",
                    fontWeight: "600",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Store size={12} color="#FAF7EF" />
                  <span>For Barbers</span>
                </Link>
              )}
            </div>
          </header>

          {/* Gold Accent Dash */}
          <div
            style={{
              width: "32px",
              height: "3.5px",
              backgroundColor: "#E5A93C",
              borderRadius: "2px",
              marginBottom: "14px",
            }}
          />

          {/* Hero Headlines */}
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "800",
              lineHeight: "1.2",
              margin: "0 0 10px 0",
              letterSpacing: "-0.4px",
            }}
          >
            <span style={{ color: "#FFFFFF" }}>Premium Grooming.</span>
            <br />
            <span style={{ color: "#E5A93C" }}>At Your Doorstep.</span>
          </h1>

          {/* Hero Subtitle */}
          <p
            style={{
              fontSize: "13.5px",
              lineHeight: "1.5",
              color: "rgba(255, 255, 255, 0.85)",
              margin: "0 0 22px 0",
              maxWidth: "340px",
            }}
          >
            Professional grooming services, whenever and wherever you need them.
          </p>

          {/* Primary CTA: Customer Access */}
          <Link
            to={isCustomer ? "/customer/dashboard" : "/customer/login"}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              background: "linear-gradient(180deg, #F3C351 0%, #DDA028 100%)",
              color: "#151515",
              fontWeight: "800",
              fontSize: "15px",
              padding: "14px 20px",
              borderRadius: "14px",
              textDecoration: "none",
              boxShadow: "0 4px 16px rgba(221, 160, 40, 0.45)",
              transition: "transform 0.15s ease",
            }}
          >
            <User size={18} color="#151515" />
            <span style={{ flex: 1, textAlign: "center" }}>
              {isCustomer ? "Continue to Customer Dashboard" : "Customer Login"}
            </span>
            <ArrowRight size={18} color="#151515" />
          </Link>

          {/* Bottom Row under CTA */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "14px",
            }}
          >
            <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.75)" }}>
              <span>New to Barber On Call? </span>
              <Link
                to="/customer/register"
                style={{
                  color: "#E5A93C",
                  fontWeight: "750",
                  textDecoration: "none",
                }}
              >
                Create Account
              </Link>
            </div>

            {/* Handwritten cursive watermark */}
            <div
              style={{
                fontFamily: "'Caveat', cursive",
                fontSize: "22px",
                lineHeight: "0.95",
                color: "#E5A93C",
                textAlign: "right",
                transform: "rotate(-6deg)",
                userSelect: "none",
                letterSpacing: "0.5px",
              }}
            >
              Good<br />Look<br />
              <span style={{ borderBottom: "1.5px solid #E5A93C", paddingBottom: "1px" }}>Anywhere</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          MAIN BODY CARDS CONTAINER (Max 480px Centered)
          ========================================================================= */}
      <main
        style={{
          width: "100%",
          maxWidth: "480px",
          margin: "0 auto",
          padding: "8px 16px 28px 16px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >
        {/* ================= FOR BARBER PARTNERS CARD ================= */}
        <section
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "18px",
            padding: "16px",
            boxShadow: "0 4px 18px rgba(0, 0, 0, 0.04)",
            border: "1px solid rgba(0, 0, 0, 0.06)",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          {/* Left Text & Icon */}
          <div style={{ flex: 1.15, display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  backgroundColor: "#FDF5E6",
                  border: "1px solid rgba(229, 169, 60, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Store size={22} color="#A67818" />
              </div>

              <div>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: "800",
                    color: "#C69225",
                    letterSpacing: "0.7px",
                    textTransform: "uppercase",
                    display: "block",
                  }}
                >
                  FOR BARBER PARTNERS
                </span>
                <h2
                  style={{
                    fontSize: "15px",
                    fontWeight: "800",
                    color: "#151515",
                    margin: "2px 0 0 0",
                    lineHeight: "1.2",
                    letterSpacing: "-0.2px",
                  }}
                >
                  Grow Your Barber Business
                </h2>
              </div>
            </div>

            <p
              style={{
                fontSize: "11px",
                color: "#6E6E6E",
                lineHeight: "1.4",
                margin: "4px 0 0 0",
              }}
            >
              Join our platform and connect with customers looking for professional grooming services.
            </p>
          </div>

          {/* Right Action Buttons */}
          <div style={{ flex: 0.85, display: "flex", flexDirection: "column", gap: "8px" }}>
            <Link
              to={isBarber ? "/barber/dashboard" : "/barber/login"}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                backgroundColor: isBarber ? "#E5A93C" : "#1C1C1C",
                color: isBarber ? "#151515" : "#FFFFFF",
                borderRadius: "12px",
                padding: "10px 10px",
                textDecoration: "none",
                fontWeight: "750",
                fontSize: "12.5px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
              }}
            >
              {isBarber ? (
                <>
                  <Store size={14} color="#151515" />
                  <span>Barber Dashboard</span>
                </>
              ) : (
                <>
                  <LogIn size={14} color="#FFFFFF" />
                  <span>Barber Login</span>
                </>
              )}
            </Link>

            <Link
              to="/barber/apply"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                backgroundColor: "#FAF4E8",
                color: "#151515",
                borderRadius: "12px",
                padding: "9px 10px",
                textDecoration: "none",
                fontWeight: "750",
                fontSize: "12px",
                border: "1px solid rgba(229, 169, 60, 0.45)",
              }}
            >
              <UserPlus size={14} color="#A67818" />
              <span>Apply as a Barber</span>
            </Link>
          </div>
        </section>

        {/* ================= PROMOTIONAL BANNER: Self-Care Made Simple ================= */}
        <section
          style={{
            position: "relative",
            borderRadius: "18px",
            overflow: "hidden",
            height: "170px",
            backgroundColor: "#161616",
            boxShadow: "0 4px 18px rgba(0, 0, 0, 0.08)",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          {/* Background Grooming Towel & Shears */}
          <img
            src="https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1000&q=80"
            alt="Grooming Tools and Salon Care"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "brightness(0.55) contrast(1.15)",
            }}
          />

          {/* Vignette Overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg, rgba(14, 14, 14, 0.95) 0%, rgba(14, 14, 14, 0.72) 55%, rgba(14, 14, 14, 0.25) 100%)",
            }}
          />

          {/* Content on Left */}
          <div
            style={{
              position: "relative",
              zIndex: 2,
              padding: "18px",
              height: "100%",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                fontWeight: "800",
                color: "#E5A93C",
                letterSpacing: "1px",
                textTransform: "uppercase",
                display: "block",
                marginBottom: "4px",
              }}
            >
              PROFESSIONAL GROOMING
            </span>

            <h3
              style={{
                fontSize: "21px",
                fontWeight: "800",
                lineHeight: "1.15",
                margin: "0 0 6px 0",
                letterSpacing: "-0.3px",
              }}
            >
              <span style={{ color: "#FFFFFF" }}>Self-Care</span>
              <br />
              <span style={{ color: "#E5A93C" }}>Made Simple</span>
            </h3>

            <p
              style={{
                fontSize: "11.5px",
                color: "rgba(255, 255, 255, 0.8)",
                margin: "0 0 10px 0",
                lineHeight: "1.35",
              }}
            >
              Look better. Feel better.<br />
              Anytime, anywhere.
            </p>

            <div
              style={{
                width: "28px",
                height: "2.5px",
                backgroundColor: "#E5A93C",
                borderRadius: "2px",
              }}
            />
          </div>

          {/* Subtle Embroidery Motif on Right */}
          <div
            style={{
              position: "absolute",
              right: "18px",
              top: "50%",
              transform: "translateY(-50%)",
              textAlign: "center",
              pointerEvents: "none",
              opacity: 0.65,
            }}
          >
            <span
              style={{
                fontSize: "12px",
                fontWeight: "700",
                color: "#E5A93C",
                letterSpacing: "2px",
                lineHeight: "1.35",
                display: "block",
                fontFamily: "'Playfair Display', Georgia, serif",
                fontStyle: "italic",
              }}
            >
              GOOD<br />GROOMING<br />BETTER YOU
            </span>
          </div>
        </section>

        {/* =========================================================================
            HOW IT WORKS SECTION (3 Columns Horizontal)
            ========================================================================= */}
        <section style={{ marginTop: "4px" }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: "14px",
            }}
          >
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "800",
                color: "#151515",
                margin: 0,
                letterSpacing: "-0.3px",
              }}
            >
              How It Works
            </h2>
            <span style={{ fontSize: "11.5px", color: "#6E6E6E", fontWeight: "500" }}>
              Get groomed in just a few simple steps.
            </span>
          </div>

          {/* 3 Step Cards in a Row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "8px",
            }}
          >
            {/* Step 1 */}
            <div
              style={{
                backgroundColor: "transparent",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <span style={{ fontSize: "15px", fontWeight: "750", color: "#777" }}>01</span>
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    backgroundColor: "#FDF5E6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <User size={16} color="#A67818" />
                </div>
              </div>
              <h3 style={{ fontSize: "12px", fontWeight: "800", color: "#151515", margin: "0 0 3px 0", lineHeight: "1.2" }}>
                Choose Your Barber
              </h3>
              <p style={{ fontSize: "10px", color: "#6E6E6E", lineHeight: "1.35", margin: 0 }}>
                Find verified professionals near you.
              </p>
            </div>

            {/* Step 2 */}
            <div
              style={{
                backgroundColor: "transparent",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <span style={{ fontSize: "15px", fontWeight: "750", color: "#777" }}>02</span>
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    backgroundColor: "#FDF5E6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Calendar size={16} color="#A67818" />
                </div>
              </div>
              <h3 style={{ fontSize: "12px", fontWeight: "800", color: "#151515", margin: "0 0 3px 0", lineHeight: "1.2" }}>
                Select Service & Time
              </h3>
              <p style={{ fontSize: "10px", color: "#6E6E6E", lineHeight: "1.35", margin: 0 }}>
                Pick your service and convenient time.
              </p>
            </div>

            {/* Step 3 */}
            <div
              style={{
                backgroundColor: "transparent",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <span style={{ fontSize: "15px", fontWeight: "750", color: "#777" }}>03</span>
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    backgroundColor: "#FDF5E6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckCircle size={16} color="#A67818" />
                </div>
              </div>
              <h3 style={{ fontSize: "12px", fontWeight: "800", color: "#151515", margin: "0 0 3px 0", lineHeight: "1.2" }}>
                Enjoy Your Grooming
              </h3>
              <p style={{ fontSize: "10px", color: "#6E6E6E", lineHeight: "1.35", margin: 0 }}>
                Relax while we take care of the rest.
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================================
            TRUST / VALUE CARDS (3 in a Row)
            ========================================================================= */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "8px",
            marginTop: "4px",
          }}
        >
          {/* Card 1 */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "14px",
              padding: "12px 10px",
              border: "1px solid rgba(0, 0, 0, 0.05)",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "10px",
                backgroundColor: "#FDF5E6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShieldCheck size={18} color="#A67818" />
            </div>
            <div>
              <h4 style={{ fontSize: "11px", fontWeight: "800", color: "#151515", margin: "0 0 2px 0", lineHeight: "1.2" }}>
                Verified<br />Professionals
              </h4>
              <p style={{ fontSize: "9.5px", color: "#6E6E6E", margin: 0 }}>
                Trained & trusted
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "14px",
              padding: "12px 10px",
              border: "1px solid rgba(0, 0, 0, 0.05)",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "10px",
                backgroundColor: "#FDF5E6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Tag size={18} color="#A67818" />
            </div>
            <div>
              <h4 style={{ fontSize: "11px", fontWeight: "800", color: "#151515", margin: "0 0 2px 0", lineHeight: "1.2" }}>
                Transparent<br />Pricing
              </h4>
              <p style={{ fontSize: "9.5px", color: "#6E6E6E", margin: 0 }}>
                No hidden charges
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "14px",
              padding: "12px 10px",
              border: "1px solid rgba(0, 0, 0, 0.05)",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "10px",
                backgroundColor: "#FDF5E6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <HomeIcon size={18} color="#A67818" />
            </div>
            <div>
              <h4 style={{ fontSize: "11px", fontWeight: "800", color: "#151515", margin: "0 0 2px 0", lineHeight: "1.2" }}>
                Doorstep &<br />Salon Services
              </h4>
              <p style={{ fontSize: "9.5px", color: "#6E6E6E", margin: 0 }}>
                Grooming your way
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* =========================================================================
          MINIMAL DARK FOOTER
          ========================================================================= */}
      <footer
        style={{
          marginTop: "auto",
          backgroundColor: "#111111",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "24px 16px max(env(safe-area-inset-bottom, 0px), 24px)",
          color: "#FAF7EF",
        }}
      >
        <div
          style={{
            maxWidth: "480px",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          {/* Top Brand & Links Row */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "14px",
            }}
          >
            {/* Brand Logo & Name */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "8px",
                  backgroundColor: "#E5A93C",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Scissors size={16} color="#151515" />
              </div>
              <div>
                <div style={{ fontSize: "15px", fontWeight: "800", color: "#FFFFFF", lineHeight: 1.1 }}>
                  Barber <span style={{ color: "#E5A93C" }}>On Call</span>
                </div>
                <p style={{ margin: "2px 0 0 0", fontSize: "10.5px", color: "#777" }}>
                  Premium grooming, made simple.
                </p>
              </div>
            </div>

            {/* Quick Links */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <Link
                to="/customer/login"
                style={{
                  color: "rgba(255, 255, 255, 0.75)",
                  fontSize: "11.5px",
                  fontWeight: "500",
                  textDecoration: "none",
                }}
              >
                Customer Login
              </Link>
              <Link
                to="/barber/login"
                style={{
                  color: "rgba(255, 255, 255, 0.75)",
                  fontSize: "11.5px",
                  fontWeight: "500",
                  textDecoration: "none",
                }}
              >
                Barber Login
              </Link>
              <Link
                to="/barber/apply"
                style={{
                  color: "rgba(255, 255, 255, 0.75)",
                  fontSize: "11.5px",
                  fontWeight: "500",
                  textDecoration: "none",
                }}
              >
                Apply as a Barber
              </Link>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: "1px", backgroundColor: "rgba(255, 255, 255, 0.08)" }} />

          {/* Legal Links (Razorpay & Compliance) */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px 18px",
              fontSize: "12px",
            }}
          >
            <Link
              to="/privacy-policy"
              style={{
                color: "rgba(250, 247, 239, 0.7)",
                textDecoration: "none",
                fontWeight: 500,
                transition: "color 0.15s ease",
              }}
            >
              Privacy Policy
            </Link>
            <span style={{ color: "rgba(255, 255, 255, 0.2)" }}>•</span>
            <Link
              to="/terms-conditions"
              style={{
                color: "rgba(250, 247, 239, 0.7)",
                textDecoration: "none",
                fontWeight: 500,
                transition: "color 0.15s ease",
              }}
            >
              Terms & Conditions
            </Link>
            <span style={{ color: "rgba(255, 255, 255, 0.2)" }}>•</span>
            <Link
              to="/refund-policy"
              style={{
                color: "rgba(250, 247, 239, 0.7)",
                textDecoration: "none",
                fontWeight: 500,
                transition: "color 0.15s ease",
              }}
            >
              Cancellation & Refund
            </Link>
            <span style={{ color: "rgba(255, 255, 255, 0.2)" }}>•</span>
            <Link
              to="/contact-us"
              style={{
                color: "#E5A93C",
                textDecoration: "none",
                fontWeight: 600,
                transition: "color 0.15s ease",
              }}
            >
              Contact Us
            </Link>
          </div>

          {/* Bottom Copyright & Trust Note */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              textAlign: "center",
              fontSize: "11px",
              color: "rgba(250, 247, 239, 0.5)",
              paddingTop: "4px",
            }}
          >
            <div>
              © 2026 <strong>Barber On Call</strong> (Prop. Atar Singh). All rights reserved.
            </div>
            <div style={{ fontSize: "10.5px", color: "rgba(250, 247, 239, 0.4)" }}>
              Jaipur, Rajasthan • Helpline: +91 9784 863800 • Razorpay Secured
            </div>
          </div>

          {/* iOS Home Indicator Bar */}
          <div
            style={{
              width: "134px",
              height: "4px",
              backgroundColor: "rgba(255, 255, 255, 0.25)",
              borderRadius: "4px",
              margin: "12px auto 0",
            }}
          />
        </div>
      </footer>
    </div>
  );
}