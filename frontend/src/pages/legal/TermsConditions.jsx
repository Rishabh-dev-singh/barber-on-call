import React from "react";
import LegalLayout from "./LegalLayout";

export default function TermsConditions() {
  return (
    <LegalLayout
      title="Terms & Conditions"
      subtitle="Terms of Service governing the use of Barber On Call platform."
      lastUpdated="October 2026"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <section>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#E5A93C", marginTop: 0 }}>
            1. Agreement to Terms
          </h2>
          <p>
            By accessing or using the website <a href="https://barberoncall.site" style={{ color: "#E5A93C" }}>barberoncall.site</a>, 
            mobile platform, or booking any service through Barber On Call, you agree to be bound by these Terms and Conditions. 
            If you do not agree to these terms, please do not use our platform.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#E5A93C" }}>
            2. Platform Description
          </h2>
          <p>
            Barber On Call is an on-demand grooming marketplace connecting individual customers looking for hair grooming, beard trimming, styling, facials, and personal care services with independent verified barbers and grooming professionals ("Barber Partners") who provide either doorstep services or appointments at registered salons.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#E5A93C" }}>
            3. Account Registration & Security
          </h2>
          <p>
            To book or offer services, users must create an account. You agree to provide accurate, true, and complete information during registration. You are solely responsible for maintaining the confidentiality of your login credentials and for all activities conducted through your account.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#E5A93C" }}>
            4. Service Bookings & Delivery
          </h2>
          <ul style={{ paddingLeft: "20px", margin: "8px 0" }}>
            <li><strong>Doorstep Delivery:</strong> For at-home appointments, customers must ensure a safe, well-lit, and suitable environment with access to a power socket and water supply.</li>
            <li><strong>Salon Visits:</strong> For in-salon appointments, customers must arrive on time for their reserved slot.</li>
            <li><strong>Service Time & Punctuality:</strong> Both customers and barbers are expected to honor appointed time slots. Delays exceeding 20 minutes without notice may result in booking cancellation.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#E5A93C" }}>
            5. Pricing and Payments
          </h2>
          <p>
            All prices listed on the platform are in Indian Rupees (INR) and are inclusive of applicable taxes unless stated otherwise.
          </p>
          <ul style={{ paddingLeft: "20px", margin: "8px 0" }}>
            <li>Payment can be made online via credit/debit cards, UPI, net banking, or digital wallets powered by Razorpay.</li>
            <li>Cash on Delivery (COD) may be supported where explicitly offered.</li>
            <li>All online payments are processed securely through Razorpay's encrypted checkout gateway.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#E5A93C" }}>
            6. Hygiene and Safety Standards
          </h2>
          <p>
            Barber Partners on Barber On Call are required to adhere to high sanitation standards, including using sanitized scissors and clippers, disposable neck strips/towels, and fresh blades for every customer. Customers agree to inform barbers in advance of any skin conditions, allergies, or infections.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#E5A93C" }}>
            7. User Code of Conduct
          </h2>
          <p>
            Any harassment, abusive behavior, discrimination, or unlawful activity directed towards barbers, customers, or customer support staff will result in immediate termination of the account and appropriate legal reporting.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#E5A93C" }}>
            8. Limitation of Liability
          </h2>
          <p>
            Barber On Call acts as a technological facilitator connecting customers and independent professional barbers. While we screen and verify barber credentials, Barber On Call shall not be held liable for indirect, incidental, or consequential damages resulting from transactions between users.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#E5A93C" }}>
            9. Governing Law & Jurisdiction
          </h2>
          <p>
            These Terms shall be governed and interpreted in accordance with the laws of India. Any dispute arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts in Jaipur, Rajasthan.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#E5A93C" }}>
            10. Contact Information
          </h2>
          <p>
            For questions regarding these Terms, please contact us at:
          </p>
          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "10px",
              padding: "16px",
            }}
          >
            <p style={{ margin: "0 0 6px" }}><strong>Business Name:</strong> Barber On Call</p>
            <p style={{ margin: "0 0 6px" }}><strong>Email:</strong> <a href="mailto:matar4u@gmail.com" style={{ color: "#E5A93C" }}>matar4u@gmail.com</a></p>
            <p style={{ margin: "0 0 6px" }}><strong>Helpline:</strong> <a href="tel:+919784863800" style={{ color: "#E5A93C" }}>+91 9784 863800</a></p>
            <p style={{ margin: 0 }}><strong>City:</strong> Jaipur, Rajasthan, India</p>
          </div>
        </section>
      </div>
    </LegalLayout>
  );
}
