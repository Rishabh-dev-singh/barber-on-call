import React from "react";
import LegalLayout from "./LegalLayout";

export default function PrivacyPolicy() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="How Barber On Call collects, protects, and handles your personal data."
      lastUpdated="October 2026"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <section>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#E5A93C", marginTop: 0 }}>
            1. Introduction
          </h2>
          <p>
            Welcome to <strong>Barber On Call</strong> (operated by Atar Singh, having its principal operations in Jaipur, Rajasthan, India). 
            We respect your privacy and are committed to protecting personal data collected through our website (
            <a href="https://barberoncall.site" style={{ color: "#E5A93C" }}>https://barberoncall.site</a>) and related web/mobile applications.
          </p>
          <p>
            This Privacy Policy is published in accordance with the Information Technology Act, 2000, and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#E5A93C" }}>
            2. Information We Collect
          </h2>
          <p>We collect information necessary to deliver grooming services smoothly and securely:</p>
          <ul style={{ paddingLeft: "20px", margin: "8px 0" }}>
            <li><strong>Account & Identity Data:</strong> Full Name, Email Address, Contact Phone Number.</li>
            <li><strong>Service Delivery Details:</strong> Service address, street landmarks, pin code, GPS coordinates (solely to dispatch the nearest barber to your doorstep).</li>
            <li><strong>Booking & Transaction History:</strong> Services requested, appointment date & slot, barber assigned, booking status, and invoices.</li>
            <li><strong>Barber Partner Data:</strong> Identity verification documents (Government ID/Aadhaar/PAN verification, grooming certifications, salon shop address).</li>
            <li><strong>Technical Data:</strong> IP address, browser type, device identifiers, and operating system used to maintain session security and prevent fraud.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#E5A93C" }}>
            3. Payment Data Security (Razorpay Integration)
          </h2>
          <p>
            All online payments made on Barber On Call are processed via our authorized, PCI-DSS Level 1 compliant payment partner, <strong>Razorpay Software Private Limited</strong>.
          </p>
          <p>
            <strong>Important:</strong> Barber On Call does <em>not</em> store, capture, or have access to your full credit/debit card numbers, CVV codes, or net banking passwords. All sensitive payment credentials are encrypted directly through Razorpay’s secured payment gateway.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#E5A93C" }}>
            4. How We Use Your Information
          </h2>
          <p>We utilize the collected information strictly for legitimate business purposes:</p>
          <ul style={{ paddingLeft: "20px", margin: "8px 0" }}>
            <li>To match, confirm, and fulfill your grooming appointment with verified barbers.</li>
            <li>To send automated SMS, WhatsApp, and email notifications regarding booking status, OTPs, barber arrival updates, and invoice receipts.</li>
            <li>To verify barber identity and maintain safety standards for both clients and professionals.</li>
            <li>To process payments, dispute resolutions, and issue refunds.</li>
            <li>To comply with statutory legal requirements and law enforcement directives.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#E5A93C" }}>
            5. Data Sharing and Disclosure
          </h2>
          <p>
            We strictly do <strong>not</strong> sell, rent, or trade your personal data to any third-party advertisers. We only share necessary data with:
          </p>
          <ul style={{ paddingLeft: "20px", margin: "8px 0" }}>
            <li><strong>Assigned Barbers:</strong> Only customer name, contact phone number, and service address are shared with the assigned barber for the duration of the booked service.</li>
            <li><strong>Payment Gateway (Razorpay):</strong> Transaction amount, order ID, and contact details to verify authorization.</li>
            <li><strong>Legal Authorities:</strong> Only when strictly mandated by applicable Indian law, court order, or governmental authority.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#E5A93C" }}>
            6. Data Retention and Security
          </h2>
          <p>
            We implement stringent physical, electronic, and procedural safeguards (including TLS 1.3/HTTPS encryption, firewall restrictions, and role-based access control) to protect your personal data from unauthorized access, alteration, or disclosure.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#E5A93C" }}>
            7. Your Rights
          </h2>
          <p>
            You have the right to access, update, correct, or request deletion of your account and personal data at any time by contacting our Grievance Officer or visiting your account profile settings.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#E5A93C" }}>
            8. Grievance Officer & Contact Information
          </h2>
          <p>
            In accordance with the Information Technology Act, 2000 and rules made thereunder, the details of our Grievance Officer are:
          </p>
          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "10px",
              padding: "16px",
              marginTop: "12px",
            }}
          >
            <p style={{ margin: "0 0 6px" }}><strong>Entity Name:</strong> Barber On Call</p>
            <p style={{ margin: "0 0 6px" }}><strong>Grievance Officer:</strong> Atar Singh</p>
            <p style={{ margin: "0 0 6px" }}><strong>Email:</strong> <a href="mailto:matar4u@gmail.com" style={{ color: "#E5A93C" }}>matar4u@gmail.com</a></p>
            <p style={{ margin: "0 0 6px" }}><strong>Phone:</strong> <a href="tel:+919784863800" style={{ color: "#E5A93C" }}>+91 9784 863800</a></p>
            <p style={{ margin: 0 }}><strong>Address:</strong> Jaipur, Rajasthan, India - 302001</p>
          </div>
        </section>
      </div>
    </LegalLayout>
  );
}
