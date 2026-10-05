import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "../components/common/ProtectedRoute";

import Home from "../pages/landing/Home";

import CustomerLogin from "../pages/customer/CustomerLogin";
import CustomerRegister from "../pages/customer/CustomerRegister";
import CustomerDashboard from "../pages/customer/CustomerDashboard";
import CustomerProfile from "../pages/customer/CustomerProfile";
import ChangePassword from "../pages/customer/ChangePassword";
import BarberList from "../pages/customer/BarberList";
import BarberDetails from "../pages/customer/BarberDetails";
import Booking from "../pages/customer/Booking";
import MyBookings from "../pages/customer/MyBookings";

import BarberLogin from "../pages/barber/BarberLogin";
import BarberDashboard from "../pages/barber/BarberDashboard";
import BarberServices from "../pages/barber/BarberServices";
import BarberAvailability from "../pages/barber/BarberAvailability";
import BarberBookings from "../pages/barber/BarberBookings";
import BarberProfile from "../pages/barber/BarberProfile";
import BarberChangePassword from "../pages/barber/BarberChangePassword";
import BarberApplication from "../pages/barber/BarberApplication";

import PrivacyPolicy from "../pages/legal/PrivacyPolicy";
import TermsConditions from "../pages/legal/TermsConditions";
import RefundPolicy from "../pages/legal/RefundPolicy";
import ContactUs from "../pages/legal/ContactUs";

function AppRoutes() {
  return (
    <Routes>
      {/* Landing */}
      <Route path="/" element={<Home />} />

      {/* Legal & Policy Pages (Razorpay & Compliance) */}
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms-conditions" element={<TermsConditions />} />
      <Route path="/terms" element={<TermsConditions />} />
      <Route path="/refund-policy" element={<RefundPolicy />} />
      <Route path="/refund" element={<RefundPolicy />} />
      <Route path="/contact-us" element={<ContactUs />} />
      <Route path="/contact" element={<ContactUs />} />

      {/* Public Customer Routes */}
      <Route path="/customer/login" element={<CustomerLogin />} />
      <Route path="/customer/register" element={<CustomerRegister />} />
      {/* Customer Directory & Profile Routes (Protected) */}
      <Route
        path="/customer/barbers"
        element={
          <ProtectedRoute requiredRole="customer">
            <BarberList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/barber/:id"
        element={
          <ProtectedRoute requiredRole="customer">
            <BarberDetails />
          </ProtectedRoute>
        }
      />

      {/* Protected Customer Routes */}
      <Route
        path="/customer/dashboard"
        element={
          <ProtectedRoute requiredRole="customer">
            <CustomerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/profile"
        element={
          <ProtectedRoute requiredRole="customer">
            <CustomerProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/change-password"
        element={
          <ProtectedRoute requiredRole="customer">
            <ChangePassword />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/booking"
        element={
          <ProtectedRoute requiredRole="customer">
            <Booking />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/booking/:id"
        element={
          <ProtectedRoute requiredRole="customer">
            <Booking />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/bookings"
        element={
          <ProtectedRoute requiredRole="customer">
            <MyBookings />
          </ProtectedRoute>
        }
      />

      {/* Public Barber Routes */}
      <Route path="/barber/login" element={<BarberLogin />} />
      <Route path="/barber/apply" element={<BarberApplication />} />

      {/* Protected Barber Routes */}
      <Route
        path="/barber/dashboard"
        element={
          <ProtectedRoute requiredRole="barber">
            <BarberDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/barber/services"
        element={
          <ProtectedRoute requiredRole="barber">
            <BarberServices />
          </ProtectedRoute>
        }
      />
      <Route
        path="/barber/availability"
        element={
          <ProtectedRoute requiredRole="barber">
            <BarberAvailability />
          </ProtectedRoute>
        }
      />
      <Route
        path="/barber/bookings"
        element={
          <ProtectedRoute requiredRole="barber">
            <BarberBookings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/barber/profile"
        element={
          <ProtectedRoute requiredRole="barber">
            <BarberProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/barber/change-password"
        element={
          <ProtectedRoute requiredRole="barber">
            <BarberChangePassword />
          </ProtectedRoute>
        }
      />
      {/* Catch-all fallback */}
      <Route path="*" element={<Home />} />
    </Routes>
  );
}

export default AppRoutes;
 