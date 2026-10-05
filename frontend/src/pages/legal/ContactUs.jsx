import React, { useState } from "react";
import LegalLayout from "./LegalLayout";
import { Mail, Phone, MapPin, Clock, CheckCircle } from "../../components/common/Icons";

export default function ContactUs() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <LegalLayout
      title="Contact Us & Support"
      subtitle="Have questions, need help with a booking, or looking for partnership? We're here for you."
      lastUpdated="October 2026"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
        
        {/* Contact Info Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "16px",
          }}
        >
          {/* Card 1: Phone */}
          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "14px",
              padding: "20px",
              display: "flex",
              alignItems: "flex-start",
              gap: "14px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: "rgba(229, 169, 60, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Phone size={20} color="#E5A93C" />
            </div>
            <div>
              <h4 style={{ margin: "0 0 4px", fontSize: "15px", color: "#FFFFFF" }}>Phone & WhatsApp</h4>
              <p style={{ margin: "0 0 6px", fontSize: "13px", color: "rgba(250, 247, 239, 0.6)" }}>
                Instant booking & assistance
              </p>
              <a
                href="tel:+919784863800"
                style={{
                  color: "#E5A93C",
                  fontWeight: 700,
                  fontSize: "14px",
                  textDecoration: "none",
                }}
              >
                +91 9784 863800
              </a>
            </div>
          </div>

          {/* Card 2: Email */}
          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "14px",
              padding: "20px",
              display: "flex",
              alignItems: "flex-start",
              gap: "14px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: "rgba(229, 169, 60, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Mail size={20} color="#E5A93C" />
            </div>
            <div>
              <h4 style={{ margin: "0 0 4px", fontSize: "15px", color: "#FFFFFF" }}>Email Support</h4>
              <p style={{ margin: "0 0 6px", fontSize: "13px", color: "rgba(250, 247, 239, 0.6)" }}>
                Responses within 4-6 hours
              </p>
              <a
                href="mailto:matar4u@gmail.com"
                style={{
                  color: "#E5A93C",
                  fontWeight: 700,
                  fontSize: "14px",
                  textDecoration: "none",
                }}
              >
                matar4u@gmail.com
              </a>
            </div>
          </div>

          {/* Card 3: Address & Hours */}
          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "14px",
              padding: "20px",
              display: "flex",
              alignItems: "flex-start",
              gap: "14px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: "rgba(229, 169, 60, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <MapPin size={20} color="#E5A93C" />
            </div>
            <div>
              <h4 style={{ margin: "0 0 4px", fontSize: "15px", color: "#FFFFFF" }}>Registered Address</h4>
              <p style={{ margin: 0, fontSize: "13px", color: "rgba(250, 247, 239, 0.8)", lineHeight: 1.5 }}>
                Barber On Call (Prop. Atar Singh)<br />
                Jaipur, Rajasthan, India - 302001
              </p>
            </div>
          </div>
        </div>

        {/* Operating Hours Banner */}
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.02)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            borderRadius: "12px",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <Clock size={18} color="#E5A93C" />
          <span style={{ fontSize: "13.5px", color: "rgba(250, 247, 239, 0.85)" }}>
            <strong>Operational Timings:</strong> Monday to Sunday — <strong>8:00 AM to 9:00 PM IST</strong> (Doorstep booking & telephone customer support).
          </span>
        </div>

        {/* Quick Message Form */}
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.02)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            borderRadius: "14px",
            padding: "24px",
          }}
        >
          <h3 style={{ margin: "0 0 8px", fontSize: "17px", color: "#FFFFFF" }}>
            Send Us a Message
          </h3>
          <p style={{ margin: "0 0 20px", fontSize: "13px", color: "rgba(250, 247, 239, 0.6)" }}>
            Have a custom query or partner request? Leave a message and our team will get in touch.
          </p>

          {submitted ? (
            <div
              style={{
                padding: "20px",
                backgroundColor: "rgba(22, 163, 74, 0.15)",
                border: "1px solid rgba(22, 163, 74, 0.3)",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                color: "#4ADE80",
              }}
            >
              <CheckCircle size={20} />
              <span style={{ fontSize: "14px", fontWeight: 600 }}>
                Thank you! Your inquiry has been received. Our team will contact you shortly.
              </span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", color: "rgba(250, 247, 239, 0.7)", marginBottom: "6px" }}>
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your name"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      backgroundColor: "#111111",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      color: "#FAF7EF",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12.5px", color: "rgba(250, 247, 239, 0.7)", marginBottom: "6px" }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Mobile number"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      backgroundColor: "#111111",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      color: "#FAF7EF",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12.5px", color: "rgba(250, 247, 239, 0.7)", marginBottom: "6px" }}>
                  Message or Booking ID
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="How can we help you?"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    backgroundColor: "#111111",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    color: "#FAF7EF",
                    fontSize: "14px",
                    outline: "none",
                    resize: "vertical",
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: "#E5A93C",
                  color: "#111111",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 24px",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Send Message
              </button>
            </form>
          )}
        </div>

      </div>
    </LegalLayout>
  );
}
