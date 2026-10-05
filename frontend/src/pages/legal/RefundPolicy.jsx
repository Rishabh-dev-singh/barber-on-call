import React from "react";
import LegalLayout from "./LegalLayout";

export default function RefundPolicy() {
  return (
    <LegalLayout
      title="Cancellation & Refund Policy"
      subtitle="Clear, transparent terms regarding booking cancellations, rescheduling, and payment refunds."
      lastUpdated="October 2026"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <section>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#E5A93C", marginTop: 0 }}>
            1. Overview
          </h2>
          <p>
            At <strong>Barber On Call</strong>, we strive to deliver an exceptional grooming experience. We understand that plans can change unexpectedly. This policy outlines how cancellations, rescheduling, and payment refunds are handled for all services booked through our platform.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#E5A93C" }}>
            2. Customer Cancellation & Rescheduling Rules
          </h2>
          <ul style={{ paddingLeft: "20px", margin: "8px 0" }}>
            <li>
              <strong>Cancellations More Than 2 Hours in Advance:</strong> If you cancel your scheduled booking at least 2 hours prior to the slot, you are eligible for a <strong>100% full refund</strong> of the pre-paid amount.
            </li>
            <li>
              <strong>Cancellations Within 2 Hours of the Slot:</strong> If the barber has already confirmed and started travelling to your doorstep location, a nominal convenience fee of up to ₹50 - ₹100 may be deducted to compensate the barber for their travel expenses, and the remaining balance will be promptly refunded.
            </li>
            <li>
              <strong>Free Rescheduling:</strong> You may reschedule your appointment to any other available slot at zero extra charge up to 1 hour before the scheduled time.
            </li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#E5A93C" }}>
            3. Barber Cancellation or No-Show
          </h2>
          <p>
            If a Barber Partner cancels the booking or fails to arrive at your location within 30 minutes of the scheduled appointment window:
          </p>
          <ul style={{ paddingLeft: "20px", margin: "8px 0" }}>
            <li>You will immediately receive an option to re-assign an alternative premium barber.</li>
            <li>If you choose not to re-assign, a <strong>100% instant full refund</strong> will be initiated without questions.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#E5A93C" }}>
            4. Service Satisfaction & Quality Disputes
          </h2>
          <p>
            If you are not satisfied with the quality of the grooming service provided, please report the issue within 24 hours of service completion by contacting our support team or sending photos/details to <a href="mailto:matar4u@gmail.com" style={{ color: "#E5A93C" }}>matar4u@gmail.com</a>.
          </p>
          <p>
            Our customer grievance team will inspect the case and may offer a complimentary corrective touch-up, service voucher, or partial/full refund depending on the investigation.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#E5A93C" }}>
            5. Refund Processing Timeline (Razorpay Mode)
          </h2>
          <div
            style={{
              backgroundColor: "rgba(229, 169, 60, 0.08)",
              border: "1px solid rgba(229, 169, 60, 0.25)",
              borderRadius: "12px",
              padding: "16px",
              margin: "12px 0",
            }}
          >
            <h4 style={{ margin: "0 0 8px", color: "#E5A93C", fontSize: "15px" }}>
              💳 How will I receive my refund?
            </h4>
            <p style={{ margin: "0 0 6px", fontSize: "14px" }}>
              All online refunds are credited directly back to the original source payment method (UPI, Debit Card, Credit Card, Netbanking) used during the transaction via our secure <strong>Razorpay</strong> payment gateway.
            </p>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>
              ⏱️ <strong>Timeline:</strong> Once approved, the refund is initiated within 24 hours and takes <strong>5 to 7 business days</strong> to reflect in your bank account / card statement, depending on your bank's clearance cycle.
            </p>
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#E5A93C" }}>
            6. How to Request a Refund or Cancellation
          </h2>
          <p>You can request a cancellation or refund through any of the following channels:</p>
          <ol style={{ paddingLeft: "20px", margin: "8px 0" }}>
            <li>Through your account: Go to <strong>My Bookings</strong> &gt; Select Booking &gt; Click <strong>Cancel / Request Refund</strong>.</li>
            <li>By contacting customer support directly:</li>
          </ol>
          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "10px",
              padding: "16px",
              marginTop: "8px",
            }}
          >
            <p style={{ margin: "0 0 6px" }}><strong>Support Phone / WhatsApp:</strong> <a href="tel:+919784863800" style={{ color: "#E5A93C" }}>+91 9784 863800</a></p>
            <p style={{ margin: "0 0 6px" }}><strong>Support Email:</strong> <a href="mailto:matar4u@gmail.com" style={{ color: "#E5A93C" }}>matar4u@gmail.com</a></p>
            <p style={{ margin: 0 }}><strong>Hours:</strong> Mon - Sun, 8:00 AM - 9:00 PM IST</p>
          </div>
        </section>
      </div>
    </LegalLayout>
  );
}
