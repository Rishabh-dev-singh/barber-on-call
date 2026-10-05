import { Link } from "react-router-dom";
import { User, Store, Scissors, ShieldCheck } from "./common/Icons";

function Footer() {
  return (
    <footer style={{
      backgroundColor: "#151515",
      borderTop: "1px solid rgba(212, 160, 23, 0.2)",
      padding: "32px 16px 24px",
      color: "#FAF7EF",
      marginTop: "auto"
    }}>
      <div style={{ maxWidth: "480px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* Customer Actions Card */}
        <div style={{
          backgroundColor: "#1E1E1E",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "14px",
          padding: "16px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              backgroundColor: "rgba(212, 160, 23, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <User size={18} color="#D4A017" />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#FAF7EF" }}>Customer Portal</h4>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "rgba(250, 247, 239, 0.6)" }}>Book grooming at doorstep or salon</p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <Link
              to="/customer/login"
              style={{
                textAlign: "center",
                padding: "10px",
                borderRadius: "8px",
                backgroundColor: "#D4A017",
                color: "#151515",
                fontWeight: "700",
                fontSize: "13px",
                textDecoration: "none"
              }}
            >
              Customer Login
            </Link>
            <Link
              to="/customer/register"
              style={{
                textAlign: "center",
                padding: "10px",
                borderRadius: "8px",
                backgroundColor: "transparent",
                border: "1px solid rgba(212, 160, 23, 0.4)",
                color: "#D4A017",
                fontWeight: "600",
                fontSize: "13px",
                textDecoration: "none"
              }}
            >
              Create Account
            </Link>
          </div>
        </div>

        {/* Barber Actions Card */}
        <div style={{
          backgroundColor: "#1E1E1E",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "14px",
          padding: "16px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              backgroundColor: "rgba(212, 160, 23, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Store size={18} color="#D4A017" />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#FAF7EF" }}>Barber Partner</h4>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "rgba(250, 247, 239, 0.6)" }}>Grow your grooming client network</p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <Link
              to="/barber/login"
              style={{
                textAlign: "center",
                padding: "10px",
                borderRadius: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#FAF7EF",
                fontWeight: "600",
                fontSize: "13px",
                textDecoration: "none"
              }}
            >
              Barber Login
            </Link>
            <Link
              to="/barber/apply"
              style={{
                textAlign: "center",
                padding: "10px",
                borderRadius: "8px",
                backgroundColor: "transparent",
                border: "1px solid rgba(212, 160, 23, 0.4)",
                color: "#D4A017",
                fontWeight: "600",
                fontSize: "13px",
                textDecoration: "none"
              }}
            >
              Join as Partner
            </Link>
          </div>
        </div>

        {/* Legal Links (Razorpay & Compliance) */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px 16px",
            fontSize: "12px",
            borderTop: "1px solid rgba(255, 255, 255, 0.06)",
            paddingTop: "16px",
          }}
        >
          <Link to="/privacy-policy" style={{ color: "rgba(250, 247, 239, 0.7)", textDecoration: "none", fontWeight: 500 }}>
            Privacy Policy
          </Link>
          <span style={{ color: "rgba(255, 255, 255, 0.2)" }}>•</span>
          <Link to="/terms-conditions" style={{ color: "rgba(250, 247, 239, 0.7)", textDecoration: "none", fontWeight: 500 }}>
            Terms & Conditions
          </Link>
          <span style={{ color: "rgba(255, 255, 255, 0.2)" }}>•</span>
          <Link to="/refund-policy" style={{ color: "rgba(250, 247, 239, 0.7)", textDecoration: "none", fontWeight: 500 }}>
            Cancellation & Refund
          </Link>
          <span style={{ color: "rgba(255, 255, 255, 0.2)" }}>•</span>
          <Link to="/contact-us" style={{ color: "#D4A017", textDecoration: "none", fontWeight: 600 }}>
            Contact Us
          </Link>
        </div>

        {/* Minimal Copyright & Guarantee */}
        <div style={{ textAlign: "center", paddingTop: "8px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#16A34A", fontSize: "12px", fontWeight: 600, marginBottom: "8px" }}>
            <ShieldCheck size={14} color="#16A34A" />
            <span>Verified Professionals • 100% Hygienic Service</span>
          </div>
          <p style={{ margin: 0, fontSize: "11px", color: "rgba(250, 247, 239, 0.5)" }}>
            © {new Date().getFullYear()} Barber On Call (Prop. Atar Singh) • Premium Grooming Platform
          </p>
        </div>

      </div>
    </footer>
  );
}

export default Footer;
