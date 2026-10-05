import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams, useParams, useNavigate } from "react-router-dom";
import {
  API_BASE_URL,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
  clearAuthSession,
} from "../../services/api";
import {
  Scissors,
  Calendar,
  Clock,
  MapPin,
  Check,
  CreditCard,
  Store,
  ChevronLeft,
  ArrowRight,
  ShieldCheck,
  Compass,
  AlertCircle,
  Sparkles,
  Star,
  X,
} from "../../components/common/Icons";
import Skeleton from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import Button from "../../components/ui/Button";

const STEPS = [
  { id: 1, label: "Service", icon: Scissors },
  { id: 2, label: "Date & Time", icon: Calendar },
  { id: 3, label: "Location", icon: MapPin },
  { id: 4, label: "Summary", icon: CreditCard },
  { id: 5, label: "Confirm", icon: ShieldCheck },
];

function Booking() {
  const [searchParams] = useSearchParams();
  const { id: paramId, barberId: paramBarberId } = useParams();
  const navigate = useNavigate();

  const [activeBarberId, setActiveBarberId] = useState(
    paramId || paramBarberId || searchParams.get("barber") || ""
  );

  useEffect(() => {
    const currentId = paramId || paramBarberId || searchParams.get("barber") || "";
    if (currentId && currentId !== activeBarberId) {
      setActiveBarberId(currentId);
    }
  }, [paramId, paramBarberId, searchParams, activeBarberId]);

  const initialType = searchParams.get("type") === "home" ? "home" : "shop";
  const servicesParam = searchParams.get("services");

  // Home visit chair & mirror setup states
  const [hasChairMirror, setHasChairMirror] = useState(true);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [premiumBarbers, setPremiumBarbers] = useState([]);
  const [loadingPremiumBarbers, setLoadingPremiumBarbers] = useState(false);

  // Step state (1 to 5)
  const [currentStep, setCurrentStep] = useState(1);

  const [barber, setBarber] = useState(null);
  const [barberSchedule, setBarberSchedule] = useState(null);
  const [allServices, setAllServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [serviceType, setServiceType] = useState(initialType);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingBookedSlots, setLoadingBookedSlots] = useState(false);

  // Selected service IDs
  const [selectedServiceIds, setSelectedServiceIds] = useState(() => {
    if (!servicesParam) return [];
    return servicesParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  });

  const [formData, setFormData] = useState({
    address: "",
    landmark: "",
    city: "Jaipur",
    pincode: "",
  });

  const [locationLoading, setLocationLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");
  const [coordinates, setCoordinates] = useState({ lat: null, lng: null });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState(null);

  // Fetch Barber & Services
  useEffect(() => {
    const fetchBarberAndServices = async (retryCount = 0) => {
      try {
        setLoading(true);
        setError("");
        const token = getAccessToken("customer");

        if (!token) {
          setError("Please login first. Redirecting...");
          setLoading(false);
          setTimeout(() => navigate("/customer/login"), 1000);
          return;
        }

        let targetId = activeBarberId;
        if (!targetId) {
          try {
            const listRes = await fetch(`${API_BASE_URL}/api/barbers/list/`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (listRes.ok) {
              const listData = await listRes.json();
              const first = Array.isArray(listData) ? listData[0] : (listData.results ? listData.results[0] : null);
              if (first) {
                targetId = String(first.id);
                setActiveBarberId(targetId);
              }
            }
          } catch (e) {
            console.error("Default barber lookup error", e);
          }
        }

        if (!targetId) {
          setError("No barbers available at the moment. Please try again later.");
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/barbers/${targetId}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401 && retryCount === 0) {
          const refreshToken = getRefreshToken();
          if (refreshToken) {
            const refreshResponse = await fetch(`${API_BASE_URL}/api/accounts/refresh/`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refresh: refreshToken }),
            });
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              if (refreshData.access) {
                setAuthTokens({
                  access: refreshData.access,
                  refresh: refreshData.refresh || refreshToken,
                });
                return fetchBarberAndServices(1);
              }
            }
          }
          clearAuthSession();
          setError("Session expired. Redirecting...");
          setTimeout(() => navigate("/customer/login"), 1000);
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to load barber details.");
        }

        const foundBarber = await response.json();
        setBarber({
          id: foundBarber.id,
          name: foundBarber.shop_name || "Professional Barber Studio",
          owner: foundBarber.owner_name || "Stylist",
          rating: foundBarber.rating ? Number(foundBarber.rating).toFixed(1) : "4.9",
          address: foundBarber.address || "Civil Lines, Jaipur",
          city: foundBarber.city || "Jaipur",
          homeRadius: Number(foundBarber.home_service_radius || 10),
          homeVisitCharge: Number(foundBarber.home_visit_charge || 0),
          homeService: foundBarber.home_service_enabled !== false,
          shopService: foundBarber.shop_service_enabled !== false,
          category: foundBarber.category || "standard",
          providesChairMirror: foundBarber.provides_chair_mirror === true,
        });

        const formattedServices = (foundBarber.services || [])
          .filter((s) => s.is_active !== false)
          .map((s) => ({
            id: String(s.id),
            name: s.name,
            duration: Number(s.duration || 30),
            shopPrice: Number(s.shop_price || 0),
            homePrice: Number(s.home_price || 0),
          }));

        setAllServices(formattedServices);

        // Pre-select service if none selected
        if (selectedServiceIds.length === 0 && formattedServices.length > 0) {
          setSelectedServiceIds([formattedServices[0].id]);
        }

        // Fetch Schedule
        try {
          const schedRes = await fetch(`${API_BASE_URL}/api/barbers/${targetId}/schedule/`);
          if (schedRes.ok) {
            const schedData = await schedRes.json();
            setBarberSchedule(schedData);
          }
        } catch (e) {
          console.error("Schedule error", e);
        }

      } catch (err) {
        console.error("Booking Error:", err);
        setError("Unable to load booking details.");
      } finally {
        setLoading(false);
      }
    };

    fetchBarberAndServices();
  }, [activeBarberId, navigate]);

  // Fetch Booked Slots when date changes
  useEffect(() => {
    const targetId = barber?.id || activeBarberId;
    if (!selectedDate || !targetId) {
      setBookedSlots([]);
      return;
    }

    const fetchBookedSlots = async () => {
      try {
        setLoadingBookedSlots(true);
        const res = await fetch(
          `${API_BASE_URL}/api/barbers/${targetId}/booked-slots/?date=${selectedDate}`
        );
        if (res.ok) {
          const data = await res.json();
          setBookedSlots(data.booked_slots || []);
        } else {
          setBookedSlots([]);
        }
      } catch (err) {
        console.error("Booked slots err", err);
      } finally {
        setLoadingBookedSlots(false);
      }
    };

    fetchBookedSlots();
  }, [activeBarberId, barber?.id, selectedDate]);

  // Fetch Premium Barbers who provide portable chair & mirror
  const fetchPremiumBarbers = async () => {
    try {
      setLoadingPremiumBarbers(true);
      const res = await fetch(`${API_BASE_URL}/api/barbers/list/?provides_chair_mirror=true`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.results || []);
        setPremiumBarbers(list);
      }
    } catch (e) {
      console.error("Failed to load premium barbers", e);
    } finally {
      setLoadingPremiumBarbers(false);
    }
  };

  useEffect(() => {
    if (showSwitchModal) {
      fetchPremiumBarbers();
    }
  }, [showSwitchModal]);

  const toggleService = (serviceId) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const selectedServicesList = useMemo(() => {
    return allServices.filter((s) => selectedServiceIds.includes(s.id));
  }, [allServices, selectedServiceIds]);

  // Available Dates (next 7 days)
  const availableDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().split("T")[0];
      dates.push({
        value: iso,
        day: i === 0 ? "Today" : d.toLocaleDateString("en-IN", { weekday: "short" }),
        date: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      });
    }
    return dates;
  }, []);

  // Pre-select today's date if not set
  useEffect(() => {
    if (availableDates.length > 0 && !selectedDate) {
      setSelectedDate(availableDates[0].value);
    }
  }, [availableDates, selectedDate]);

  // Schedule Open/Close for Chosen Date
  const selectedDayInfo = useMemo(() => {
    if (!selectedDate) {
      return { isOpen: true, dayName: "", openTime: "10:00", closeTime: "20:00" };
    }
    const dateObj = new Date(selectedDate + "T00:00:00");
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayName = dayNames[dateObj.getDay()];

    if (!barberSchedule?.weekly_schedule) {
      return { isOpen: dayName !== "Sunday", dayName, openTime: "10:00", closeTime: "20:00" };
    }

    const scheduleList =
      serviceType === "home"
        ? barberSchedule.weekly_schedule.home
        : barberSchedule.weekly_schedule.shop;

    if (!Array.isArray(scheduleList)) {
      return { isOpen: dayName !== "Sunday", dayName, openTime: "10:00", closeTime: "20:00" };
    }

    const dayConfig = scheduleList.find((d) => d.day.toLowerCase() === dayName.toLowerCase());
    if (!dayConfig || !dayConfig.enabled) {
      return { isOpen: false, dayName };
    }

    return {
      isOpen: true,
      dayName,
      openTime: dayConfig.open || "10:00",
      closeTime: dayConfig.close || "20:00",
    };
  }, [selectedDate, barberSchedule, serviceType]);

  // Time Slots
  const timeSlots = useMemo(() => {
    if (!selectedDayInfo.isOpen) return [];

    const openTime = selectedDayInfo.openTime || "10:00";
    const closeTime = selectedDayInfo.closeTime || "20:00";
    const duration = parseInt(barberSchedule?.slot_duration, 10) || 30;

    const [openH, openM] = openTime.split(":").map(Number);
    const [closeH, closeM] = closeTime.split(":").map(Number);
    const openMins = (openH || 10) * 60 + (openM || 0);
    const closeMins = (closeH || 20) * 60 + (closeM || 0);

    const breakEnabled = Boolean(barberSchedule?.break_enabled);
    let breakStartMins = -1;
    let breakEndMins = -1;
    if (breakEnabled && barberSchedule?.break_start && barberSchedule?.break_end) {
      const [bsh, bsm] = barberSchedule.break_start.split(":").map(Number);
      const [beh, bem] = barberSchedule.break_end.split(":").map(Number);
      breakStartMins = (bsh || 13) * 60 + (bsm || 0);
      breakEndMins = (beh || 14) * 60 + (bem || 0);
    }

    const slots = [];
    for (let m = openMins; m + duration <= closeMins; m += duration) {
      if (breakEnabled && breakStartMins !== -1 && breakEndMins !== -1) {
        if (m >= breakStartMins && m < breakEndMins) continue;
      }
      const h = Math.floor(m / 60);
      const min = m % 60;
      const period = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 === 0 ? 12 : h % 12;
      const timeStr = `${String(h12).padStart(2, "0")}:${String(min).padStart(2, "0")} ${period}`;
      slots.push(timeStr);
    }

    return slots;
  }, [selectedDayInfo, barberSchedule]);

  // Pre-select first available time slot
  useEffect(() => {
    if (timeSlots.length > 0 && !selectedTime) {
      const firstOpen = timeSlots.find((s) => !bookedSlots.includes(s));
      if (firstOpen) setSelectedTime(firstOpen);
    }
  }, [timeSlots, bookedSlots, selectedTime]);

  const basePrice = selectedServicesList.reduce((total, service) => {
    const price = serviceType === "home" ? service.homePrice : service.shopPrice;
    return total + price;
  }, 0);

  const homeVisitCharge = serviceType === "home" && barber ? barber.homeVisitCharge : 0;
  const totalAmount = Number(basePrice) + Number(homeVisitCharge);

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Location is not supported on this device.");
      return;
    }
    setLocationLoading(true);
    setLocationStatus("Detecting GPS coordinates & resolving address...");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoordinates({ lat, lng });

        try {
          let resolvedAddress = "";
          let resolvedLandmark = "";
          let resolvedCity = "";
          let resolvedPincode = "";

          // 1. OpenStreetMap Nominatim reverse geocoding
          try {
            const nominatimRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
              { headers: { "Accept-Language": "en" } }
            );

            if (nominatimRes.ok) {
              const data = await nominatimRes.json();
              const addr = data.address || {};

              const streetParts = [
                addr.house_number || addr.building,
                addr.road || addr.street,
                addr.suburb || addr.residential || addr.neighbourhood,
              ].filter(Boolean);

              resolvedAddress =
                streetParts.length > 0
                  ? streetParts.join(", ")
                  : data.display_name?.split(",").slice(0, 3).join(",") || "";
              resolvedLandmark =
                addr.neighbourhood ||
                addr.suburb ||
                addr.amenity ||
                addr.commercial ||
                "";
              resolvedCity =
                addr.city ||
                addr.town ||
                addr.village ||
                addr.state_district ||
                addr.county ||
                "";
              resolvedPincode = addr.postcode || "";
            }
          } catch (e) {
            console.warn("Nominatim geocode failed, trying fallback...", e);
          }

          // 2. Fallback to BigDataCloud client API if Nominatim didn't return address or city
          if (!resolvedAddress || !resolvedCity) {
            try {
              const bdcRes = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
              );
              if (bdcRes.ok) {
                const bdcData = await bdcRes.json();
                if (!resolvedAddress) {
                  resolvedAddress =
                    bdcData.locality || bdcData.principalSubdivision || "";
                }
                if (!resolvedCity) {
                  resolvedCity =
                    bdcData.city || bdcData.locality || "";
                }
                if (!resolvedPincode && bdcData.postcode) {
                  resolvedPincode = bdcData.postcode;
                }
              }
            } catch (e) {
              console.warn("Fallback geocoding error", e);
            }
          }

          // Auto-fill formData with resolved address fields
          setFormData((prev) => ({
            ...prev,
            address: resolvedAddress || prev.address,
            landmark: resolvedLandmark || prev.landmark,
            city: resolvedCity || prev.city || "Jaipur",
            pincode: resolvedPincode || prev.pincode,
          }));

          setLocationStatus(
            resolvedAddress
              ? "✓ Full address & GPS auto-filled successfully!"
              : "✓ GPS coordinates tagged! Please confirm your door/street number."
          );
        } catch (err) {
          console.warn("Reverse geocode failed:", err);
          setLocationStatus("✓ GPS coordinates tagged. Please confirm street details.");
        } finally {
          setLocationLoading(false);
        }
      },
      (err) => {
        console.warn("Geolocation error:", err);
        setLocationLoading(false);
        let errorMsg = "Unable to detect GPS. Please type your address.";
        if (err.code === 1) {
          errorMsg = "Location permission denied. Please allow location access in your browser or type address manually.";
        } else if (err.code === 2) {
          errorMsg = "Position unavailable. Please type your address manually.";
        } else if (err.code === 3) {
          errorMsg = "Location request timed out. Please try again or type address.";
        }
        setLocationStatus(errorMsg);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const convertTo24Hour = (time12h) => {
    if (!time12h) return "10:00";
    const [time, modifier] = time12h.split(" ");
    let [hours, minutes] = time.split(":");
    if (hours === "12") hours = "00";
    if (modifier === "PM") hours = parseInt(hours, 10) + 12;
    hours = hours.toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  // Step validation
  const validateStep = (step) => {
    if (step === 1) {
      if (selectedServiceIds.length === 0) {
        alert("Please select at least one service to proceed.");
        return false;
      }
    }
    if (step === 2) {
      if (!selectedDate) {
        alert("Please choose an appointment date.");
        return false;
      }
      if (!selectedTime) {
        alert("Please choose a time slot.");
        return false;
      }
    }
    if (step === 3) {
      if (serviceType === "home" && !formData.address.trim()) {
        alert("Please enter your doorstep address.");
        return false;
      }
    }
    return true;
  };

  const goToNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const goToPrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Final submit
  const handleFinalBookingSubmit = async () => {
    const token = getAccessToken("customer");
    if (!token) {
      alert("Session expired. Please log in again.");
      navigate("/customer/login");
      return;
    }

    setIsSubmitting(true);

    const fullAddress = serviceType === "home"
      ? `${formData.address}${formData.landmark ? ", Near " + formData.landmark : ""}, ${formData.city} - ${formData.pincode}`
      : barber.address;

    const payload = {
      service_ids: selectedServiceIds.map((id) => parseInt(id, 10)),
      service: parseInt(selectedServiceIds[0], 10),
      booking_type: serviceType,
      needs_chair_mirror: serviceType === "home" && hasChairMirror === false,
      booking_date: selectedDate,
      booking_time: convertTo24Hour(selectedTime),
      address: fullAddress,
      latitude: coordinates.lat,
      longitude: coordinates.lng,
      total_amount: totalAmount,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/customer/create/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.detail || data.error || data.message || "Failed to create booking.";
        throw new Error(errorMsg);
      }

      setCreatedBookingId(data.id || data.booking_id || "BOC-" + Date.now().toString().slice(-4));
      setBookingSuccess(true);
    } catch (err) {
      console.error("Booking error:", err);
      alert(err.message || "An error occurred while creating booking.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <Skeleton variant="card" height="60px" />
        <Skeleton variant="card" height="180px" />
        <Skeleton variant="card" height="120px" />
      </div>
    );
  }

  if (error || !barber) {
    return (
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "32px 16px" }}>
        <EmptyState
          icon={AlertCircle}
          title="Booking Not Available"
          description={error || "Barber information could not be retrieved."}
          actionLabel="Back to Barbers"
          onAction={() => navigate("/customer/barbers")}
        />
      </div>
    );
  }

  // ================= BOOKING SUCCESS MODAL =================
  if (bookingSuccess) {
    return (
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "32px 16px", textAlign: "center" }}>
        <div style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "20px",
          padding: "32px 20px",
          border: "1px solid rgba(212, 160, 23, 0.3)",
          boxShadow: "0 6px 24px rgba(0,0,0,0.06)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px"
        }}>
          <div style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            backgroundColor: "#DCFCE7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <ShieldCheck size={36} color="#16A34A" />
          </div>

          <div>
            <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#151515", margin: "0 0 4px 0" }}>
              Booking Confirmed!
            </h2>
            <p style={{ margin: 0, fontSize: "13px", color: "#6E6E6E" }}>
              Your appointment request has been sent to {barber.name}.
            </p>
          </div>

          <div style={{
            backgroundColor: "#FAF7EF",
            borderRadius: "12px",
            padding: "16px",
            width: "100%",
            boxSizing: "border-box",
            textAlign: "left",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            fontSize: "12.5px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#6E6E6E" }}>Booking ID:</span>
              <strong style={{ color: "#151515" }}>#{createdBookingId}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#6E6E6E" }}>Service Type:</span>
              <strong style={{ color: "#151515" }}>{serviceType === "home" ? "Doorstep (Home)" : "At Salon"}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#6E6E6E" }}>Date & Time:</span>
              <strong style={{ color: "#151515" }}>{selectedDate} at {selectedTime}</strong>
            </div>
            {serviceType === "home" && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6E6E6E" }}>Chair & Mirror:</span>
                <strong style={{ color: hasChairMirror ? "#16A34A" : "#D4A017" }}>
                  {hasChairMirror ? "Customer Provided" : "Stylist Brings Portable Kit"}
                </strong>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "8px" }}>
              <span style={{ color: "#6E6E6E" }}>Total Amount:</span>
              <strong style={{ color: "#D4A017", fontSize: "14px" }}>₹{totalAmount}</strong>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
            <Link
              to="/customer/bookings"
              style={{
                padding: "13px",
                borderRadius: "12px",
                backgroundColor: "#D4A017",
                color: "#151515",
                fontWeight: "700",
                fontSize: "14px",
                textDecoration: "none",
                display: "block",
                boxShadow: "0 3px 10px rgba(212, 160, 23, 0.3)"
              }}
            >
              View My Bookings
            </Link>

            <Link
              to="/customer/dashboard"
              style={{
                padding: "12px",
                borderRadius: "12px",
                backgroundColor: "transparent",
                border: "1px solid rgba(0,0,0,0.1)",
                color: "#151515",
                fontWeight: "600",
                fontSize: "13px",
                textDecoration: "none",
                display: "block"
              }}
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto", padding: "16px 16px 100px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "18px" }}>
      
      {/* ================= STEP INDICATOR ================= */}
      <div style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "16px",
        padding: "14px 10px",
        border: "1px solid rgba(0, 0, 0, 0.06)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {STEPS.map((s, idx) => {
            const isCompleted = s.id < currentStep;
            const isCurrent = s.id === currentStep;

            return (
              <div
                key={s.id}
                onClick={() => {
                  if (s.id < currentStep) setCurrentStep(s.id);
                }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                  cursor: s.id < currentStep ? "pointer" : "default",
                  flex: 1,
                  position: "relative"
                }}
              >
                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: isCurrent ? "#D4A017" : isCompleted ? "#151515" : "#FAF7EF",
                  color: isCurrent ? "#151515" : isCompleted ? "#FAF7EF" : "#888",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: "800",
                  border: isCurrent ? "2px solid #D4A017" : "1px solid rgba(0,0,0,0.1)",
                  transition: "all 0.15s ease"
                }}>
                  {isCompleted ? <Check size={14} color="#D4A017" /> : s.id}
                </div>
                <span style={{
                  fontSize: "10px",
                  fontWeight: isCurrent ? "800" : "600",
                  color: isCurrent ? "#151515" : "#6E6E6E",
                  textAlign: "center"
                }}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= BARBER HEADER BANNER ================= */}
      <div style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "14px",
        padding: "12px 14px",
        border: "1px solid rgba(0,0,0,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "38px",
            height: "38px",
            borderRadius: "10px",
            backgroundColor: "rgba(212, 160, 23, 0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Scissors size={18} color="#D4A017" />
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: "800", color: "#151515" }}>{barber.name}</div>
            <div style={{ fontSize: "11.5px", color: "#6E6E6E" }}>{barber.owner} • {barber.city}</div>
          </div>
        </div>

        <span style={{
          fontSize: "11px",
          fontWeight: "700",
          backgroundColor: "#FAF7EF",
          color: "#D4A017",
          padding: "4px 8px",
          borderRadius: "8px",
          border: "1px solid rgba(212, 160, 23, 0.3)"
        }}>
          {serviceType === "home" ? "Doorstep" : "Salon"}
        </span>
      </div>

      {/* ================= STEP 1: SERVICE SELECTION ================= */}
      {currentStep === 1 && (
        <section style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          padding: "18px 16px",
          border: "1px solid rgba(0, 0, 0, 0.06)",
          display: "flex",
          flexDirection: "column",
          gap: "14px"
        }}>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: "800", color: "#151515", margin: 0 }}>
              1. Choose Services
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6E6E6E" }}>
              Select one or more grooming services
            </p>
          </div>

          {/* Service Mode Selector */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <button
              type="button"
              onClick={() => setServiceType("shop")}
              style={{
                padding: "10px",
                borderRadius: "10px",
                border: serviceType === "shop" ? "2px solid #D4A017" : "1px solid rgba(0,0,0,0.1)",
                backgroundColor: serviceType === "shop" ? "#FAF7EF" : "#FFFFFF",
                fontSize: "12.5px",
                fontWeight: "700",
                color: "#151515",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px"
              }}
            >
              <Store size={15} color={serviceType === "shop" ? "#D4A017" : "#151515"} />
              <span>At Salon</span>
            </button>

            <button
              type="button"
              onClick={() => setServiceType("home")}
              style={{
                padding: "10px",
                borderRadius: "10px",
                border: serviceType === "home" ? "2px solid #D4A017" : "1px solid rgba(0,0,0,0.1)",
                backgroundColor: serviceType === "home" ? "#FAF7EF" : "#FFFFFF",
                fontSize: "12.5px",
                fontWeight: "700",
                color: "#151515",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px"
              }}
            >
              <Scissors size={15} color={serviceType === "home" ? "#D4A017" : "#151515"} />
              <span>At Home (+₹{barber.homeVisitCharge})</span>
            </button>
          </div>

          {/* Chair & Mirror Setup Question for Home Visits */}
          {serviceType === "home" && (
            <div
              style={{
                backgroundColor: "#FAF7EF",
                borderRadius: "14px",
                border: "1.5px solid #D4A017",
                padding: "14px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span style={{ fontSize: "16px" }}>🪑 🪞</span>
                  <strong style={{ fontSize: "13px", color: "#151515" }}>
                    Do you have a chair and mirror available at home?
                  </strong>
                </div>
                <p style={{ margin: 0, fontSize: "11.5px", color: "#6E6E6E" }}>
                  Please let your stylist know if you have a comfortable chair and mirror ready for grooming.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setHasChairMirror(true)}
                  style={{
                    padding: "9px 10px",
                    borderRadius: "9px",
                    border: hasChairMirror === true ? "2px solid #16A34A" : "1px solid rgba(0,0,0,0.12)",
                    backgroundColor: hasChairMirror === true ? "#F0FDF4" : "#FFFFFF",
                    color: hasChairMirror === true ? "#15803D" : "#151515",
                    fontWeight: "700",
                    fontSize: "12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "5px",
                  }}
                >
                  <Check size={14} color={hasChairMirror === true ? "#16A34A" : "#6E6E6E"} />
                  <span>Yes, I have both</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setHasChairMirror(false);
                    if (!barber?.providesChairMirror) {
                      setShowSwitchModal(true);
                    }
                  }}
                  style={{
                    padding: "9px 10px",
                    borderRadius: "9px",
                    border: hasChairMirror === false ? "2px solid #D4A017" : "1px solid rgba(0,0,0,0.12)",
                    backgroundColor: hasChairMirror === false ? "#FEF3C7" : "#FFFFFF",
                    color: hasChairMirror === false ? "#B45309" : "#151515",
                    fontWeight: "700",
                    fontSize: "12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "5px",
                  }}
                >
                  <Sparkles size={14} color={hasChairMirror === false ? "#D4A017" : "#6E6E6E"} />
                  <span>No, arrange for me</span>
                </button>
              </div>

              {hasChairMirror === false && barber?.providesChairMirror && (
                <div
                  style={{
                    backgroundColor: "#FFFFFF",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #16A34A",
                    fontSize: "11.5px",
                    color: "#15803D",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Check size={14} color="#16A34A" />
                  <span>
                    <strong>{barber.name}</strong> is a Premium Partner and carries a portable styling chair & LED vanity mirror.
                  </span>
                </div>
              )}

              {hasChairMirror === false && !barber?.providesChairMirror && (
                <div
                  style={{
                    backgroundColor: "#FFFBEB",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #F59E0B",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div style={{ fontSize: "11.5px", color: "#92400E", lineHeight: "1.4" }}>
                    <strong>Notice:</strong> {barber.name} brings standard grooming tools, but does not carry portable salon furniture.
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSwitchModal(true)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      backgroundColor: "#D4A017",
                      color: "#151515",
                      fontWeight: "700",
                      fontSize: "12px",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      boxShadow: "0 2px 6px rgba(212, 160, 23, 0.25)",
                    }}
                  >
                    <Sparkles size={13} color="#151515" />
                    <span>Switch to Premium Salon (Chair & Mirror Included)</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Services Checklist */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {allServices.map((s) => {
              const isSelected = selectedServiceIds.includes(s.id);
              const price = serviceType === "home" ? s.homePrice : s.shopPrice;

              return (
                <div
                  key={s.id}
                  onClick={() => toggleService(s.id)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "12px",
                    border: isSelected ? "2px solid #D4A017" : "1px solid rgba(0,0,0,0.08)",
                    backgroundColor: isSelected ? "#FAF7EF" : "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "6px",
                      backgroundColor: isSelected ? "#D4A017" : "transparent",
                      border: isSelected ? "2px solid #D4A017" : "2px solid rgba(0,0,0,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      {isSelected && <Check size={13} color="#151515" />}
                    </div>
                    <div>
                      <div style={{ fontSize: "13.5px", fontWeight: "750", color: "#151515" }}>{s.name}</div>
                      <div style={{ fontSize: "11px", color: "#6E6E6E" }}>{s.duration} mins</div>
                    </div>
                  </div>
                  <strong style={{ fontSize: "14px", color: "#151515" }}>₹{price}</strong>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ================= STEP 2: DATE & TIME ================= */}
      {currentStep === 2 && (
        <section style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          padding: "18px 16px",
          border: "1px solid rgba(0, 0, 0, 0.06)",
          display: "flex",
          flexDirection: "column",
          gap: "16px"
        }}>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: "800", color: "#151515", margin: 0 }}>
              2. Select Date & Time
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6E6E6E" }}>
              Pick your preferred schedule slot
            </p>
          </div>

          {/* Date Selector Pills */}
          <div>
            <div style={{ fontSize: "12.5px", fontWeight: "700", color: "#151515", marginBottom: "8px" }}>
              Select Date
            </div>
            <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px", scrollbarWidth: "none" }}>
              {availableDates.map((d) => {
                const isSelected = selectedDate === d.value;
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => {
                      setSelectedDate(d.value);
                      setSelectedTime("");
                    }}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "12px",
                      border: isSelected ? "2px solid #D4A017" : "1px solid rgba(0,0,0,0.08)",
                      backgroundColor: isSelected ? "#151515" : "#FFFFFF",
                      color: isSelected ? "#FAF7EF" : "#151515",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      minWidth: "64px"
                    }}
                  >
                    <span style={{ fontSize: "11px", fontWeight: "600", opacity: 0.8 }}>{d.day}</span>
                    <span style={{ fontSize: "13px", fontWeight: "800", marginTop: "2px" }}>{d.date}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slots Grid */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <div style={{ fontSize: "12.5px", fontWeight: "700", color: "#151515" }}>
                Select Time Slot
              </div>
              {loadingBookedSlots && (
                <span style={{ fontSize: "11px", color: "#6E6E6E" }}>Checking slots...</span>
              )}
            </div>

            {!selectedDayInfo.isOpen ? (
              <div style={{ padding: "20px", textAlign: "center", backgroundColor: "#FAF7EF", borderRadius: "12px" }}>
                <Clock size={24} color="#6E6E6E" style={{ marginBottom: "6px" }} />
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#151515" }}>Barber is closed on {selectedDayInfo.dayName}</div>
                <div style={{ fontSize: "11.5px", color: "#6E6E6E" }}>Please select another date above.</div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                {timeSlots.map((slot) => {
                  const isBooked = bookedSlots.includes(slot);
                  const isSelected = selectedTime === slot;

                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={isBooked}
                      onClick={() => setSelectedTime(slot)}
                      style={{
                        padding: "10px 6px",
                        borderRadius: "10px",
                        border: isSelected ? "2px solid #D4A017" : "1px solid rgba(0,0,0,0.08)",
                        backgroundColor: isBooked ? "#F3F4F6" : isSelected ? "#FAF7EF" : "#FFFFFF",
                        color: isBooked ? "#9CA3AF" : isSelected ? "#D4A017" : "#151515",
                        fontSize: "12px",
                        fontWeight: isSelected ? "800" : "600",
                        cursor: isBooked ? "not-allowed" : "pointer",
                        textDecoration: isBooked ? "line-through" : "none"
                      }}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ================= STEP 3: LOCATION ================= */}
      {currentStep === 3 && (
        <section style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          padding: "18px 16px",
          border: "1px solid rgba(0, 0, 0, 0.06)",
          display: "flex",
          flexDirection: "column",
          gap: "16px"
        }}>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: "800", color: "#151515", margin: 0 }}>
              3. Service Location
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6E6E6E" }}>
              {serviceType === "home" ? "Provide your address for doorstep visit" : "Confirm salon appointment address"}
            </p>
          </div>

          {serviceType === "shop" ? (
            <div style={{ backgroundColor: "#FAF7EF", padding: "16px", borderRadius: "12px", border: "1px solid rgba(212, 160, 23, 0.3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <Store size={18} color="#D4A017" />
                <strong style={{ fontSize: "14px", color: "#151515" }}>{barber.name}</strong>
              </div>
              <p style={{ margin: 0, fontSize: "13px", color: "#6E6E6E" }}>
                {barber.address}, {barber.city}
              </p>
              <div style={{ fontSize: "11px", color: "#16A34A", fontWeight: "700", marginTop: "8px" }}>
                Salon appointment will be reserved under your name.
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button
                type="button"
                onClick={handleUseLocation}
                disabled={locationLoading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "11px",
                  borderRadius: "10px",
                  backgroundColor: "#FAF7EF",
                  border: "1px solid rgba(212, 160, 23, 0.5)",
                  color: "#151515",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: "pointer"
                }}
              >
                <Compass size={16} color="#D4A017" />
                <span>{locationLoading ? "Detecting GPS..." : "Auto-Fill Current GPS Location"}</span>
              </button>

              {locationStatus && (
                <div style={{ fontSize: "11.5px", color: coordinates.lat ? "#16A34A" : "#DC2626", fontWeight: "600" }}>
                  {locationStatus}
                </div>
              )}

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "4px" }}>
                  House / Flat / Street Address *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Flat 302, Royal Palms, Vaishali Nagar"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "11px",
                    borderRadius: "10px",
                    border: "1px solid rgba(0,0,0,0.12)",
                    fontSize: "13px",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "4px" }}>
                  Landmark (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Near Community Center"
                  value={formData.landmark}
                  onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "11px",
                    borderRadius: "10px",
                    border: "1px solid rgba(0,0,0,0.12)",
                    fontSize: "13px",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "4px" }}>
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Jaipur"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "11px",
                      borderRadius: "10px",
                      border: "1px solid rgba(0,0,0,0.12)",
                      fontSize: "13px",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#151515", display: "block", marginBottom: "4px" }}>
                    Pincode
                  </label>
                  <input
                    type="text"
                    placeholder="302021"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "11px",
                      borderRadius: "10px",
                      border: "1px solid rgba(0,0,0,0.12)",
                      fontSize: "13px",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ================= STEP 4: SUMMARY ================= */}
      {currentStep === 4 && (
        <section style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          padding: "18px 16px",
          border: "1px solid rgba(0, 0, 0, 0.06)",
          display: "flex",
          flexDirection: "column",
          gap: "14px"
        }}>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: "800", color: "#151515", margin: 0 }}>
              4. Booking Summary
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6E6E6E" }}>
              Review appointment information
            </p>
          </div>

          <div style={{ backgroundColor: "#FAF7EF", borderRadius: "12px", padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
              <span style={{ color: "#6E6E6E" }}>Barber:</span>
              <strong style={{ color: "#151515" }}>{barber.name}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
              <span style={{ color: "#6E6E6E" }}>Service Mode:</span>
              <strong style={{ color: "#151515" }}>{serviceType === "home" ? "Doorstep at Home" : "At Salon"}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
              <span style={{ color: "#6E6E6E" }}>Date:</span>
              <strong style={{ color: "#151515" }}>{selectedDate}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
              <span style={{ color: "#6E6E6E" }}>Time Slot:</span>
              <strong style={{ color: "#151515" }}>{selectedTime}</strong>
            </div>
            {serviceType === "home" && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <span style={{ color: "#6E6E6E" }}>Chair & Mirror:</span>
                <strong style={{ color: hasChairMirror ? "#16A34A" : "#D4A017" }}>
                  {hasChairMirror ? "Available at Home" : "Arranged by Stylist (Portable Kit)"}
                </strong>
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ fontSize: "12.5px", fontWeight: "750", color: "#151515" }}>Selected Services:</div>
            {selectedServicesList.map((s) => (
              <div key={s.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", color: "#444" }}>
                <span>{s.name} ({s.duration} min)</span>
                <strong>₹{serviceType === "home" ? s.homePrice : s.shopPrice}</strong>
              </div>
            ))}
            {serviceType === "home" && barber.homeVisitCharge > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", color: "#444" }}>
                <span>Doorstep Visit Charge</span>
                <strong>₹{barber.homeVisitCharge}</strong>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", fontWeight: "800", color: "#151515", borderTop: "1px solid rgba(0,0,0,0.1)", paddingTop: "8px", marginTop: "4px" }}>
              <span>Total Payable:</span>
              <span style={{ color: "#D4A017" }}>₹{totalAmount}</span>
            </div>
          </div>
        </section>
      )}

      {/* ================= STEP 5: PAYMENT & CONFIRMATION ================= */}
      {currentStep === 5 && (
        <section style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          padding: "18px 16px",
          border: "1px solid rgba(0, 0, 0, 0.06)",
          display: "flex",
          flexDirection: "column",
          gap: "16px"
        }}>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: "800", color: "#151515", margin: 0 }}>
              5. Payment Method
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6E6E6E" }}>
              Choose how you wish to complete payment
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{
              padding: "14px",
              borderRadius: "12px",
              border: "2px solid #D4A017",
              backgroundColor: "#FAF7EF",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <CreditCard size={20} color="#D4A017" />
                <div>
                  <div style={{ fontSize: "13.5px", fontWeight: "750", color: "#151515" }}>Pay After Service</div>
                  <div style={{ fontSize: "11px", color: "#6E6E6E" }}>Pay Cash or UPI directly to barber after grooming</div>
                </div>
              </div>
              <Check size={18} color="#D4A017" />
            </div>
          </div>

          <div style={{ backgroundColor: "#F0FDF4", padding: "12px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
            <ShieldCheck size={16} color="#16A34A" />
            <span style={{ fontSize: "11.5px", color: "#16A34A", fontWeight: "600" }}>
              Free cancellation up to 1 hour before scheduled time.
            </span>
          </div>
        </section>
      )}

      {/* ================= NAVIGATION FOOTER BAR ================= */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#FFFFFF",
        borderTop: "1px solid rgba(0,0,0,0.08)",
        padding: "12px 16px max(env(safe-area-inset-bottom, 0px), 12px)",
        display: "flex",
        justifyContent: "center",
        zIndex: 999,
        boxShadow: "0 -4px 16px rgba(0,0,0,0.06)"
      }}>
        <div style={{ maxWidth: "480px", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          {currentStep > 1 && (
            <button
              type="button"
              onClick={goToPrevStep}
              style={{
                padding: "12px 16px",
                borderRadius: "10px",
                backgroundColor: "#FAF7EF",
                border: "1px solid rgba(0,0,0,0.1)",
                color: "#151515",
                fontWeight: "700",
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <ChevronLeft size={16} color="#151515" />
              <span>Back</span>
            </button>
          )}

          <div style={{ flex: 1, textAlign: currentStep > 1 ? "left" : "left" }}>
            <div style={{ fontSize: "11px", color: "#6E6E6E" }}>Total Amount</div>
            <div style={{ fontSize: "18px", fontWeight: "800", color: "#151515" }}>₹{totalAmount}</div>
          </div>

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={goToNextStep}
              style={{
                flex: currentStep === 1 ? 1 : "initial",
                minWidth: "140px",
                padding: "12px 20px",
                borderRadius: "12px",
                backgroundColor: "#D4A017",
                color: "#151515",
                fontWeight: "800",
                fontSize: "13.5px",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                boxShadow: "0 2px 8px rgba(212, 160, 23, 0.3)"
              }}
            >
              <span>Continue</span>
              <ArrowRight size={15} color="#151515" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinalBookingSubmit}
              style={{
                minWidth: "150px",
                padding: "12px 20px",
                borderRadius: "12px",
                backgroundColor: isSubmitting ? "#CCC" : "#151515",
                color: "#FAF7EF",
                fontWeight: "800",
                fontSize: "13.5px",
                border: "none",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                boxShadow: "0 3px 10px rgba(0,0,0,0.2)"
              }}
            >
              <span>{isSubmitting ? "Confirming..." : "Confirm Booking"}</span>
              <ShieldCheck size={15} color="#D4A017" />
            </button>
          )}
        </div>
      </div>

      {/* ================= SWITCH TO PREMIUM BARBER MODAL (ENGLISH) ================= */}
      {showSwitchModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            backdropFilter: "blur(4px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSwitchModal(false);
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "20px",
              padding: "22px 18px",
              width: "100%",
              maxWidth: "440px",
              maxHeight: "85vh",
              overflowY: "auto",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.25)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              position: "relative",
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div style={{ paddingRight: "14px" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "#FEF3C7", color: "#B45309", padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "800", marginBottom: "8px" }}>
                  <Sparkles size={13} color="#D4A017" />
                  <span>PREMIUM SALON PARTNERS</span>
                </div>
                <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#151515", margin: 0 }}>
                  Need Chair & Mirror Arranged?
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#6E6E6E", lineHeight: "1.4" }}>
                  These verified premium barbers bring portable hydraulic chairs and LED vanity mirrors directly to your home.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowSwitchModal(false)}
                style={{
                  background: "#F3F4F6",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#6E6E6E",
                  flexShrink: 0,
                }}
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body / Barbers List */}
            {loadingPremiumBarbers ? (
              <div style={{ padding: "30px 10px", textAlign: "center", color: "#6E6E6E", fontSize: "13px" }}>
                <Clock size={28} color="#D4A017" style={{ marginBottom: "8px" }} />
                <div>Searching for premium equipment providers...</div>
              </div>
            ) : premiumBarbers.filter((b) => String(b.id) !== String(barber?.id)).length === 0 ? (
              <div style={{ padding: "20px 12px", backgroundColor: "#FAF7EF", borderRadius: "12px", textAlign: "center" }}>
                <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#151515", fontWeight: "700" }}>
                  No other premium partners with portable equipment found nearby.
                </p>
                <p style={{ margin: 0, fontSize: "12px", color: "#6E6E6E" }}>
                  You can proceed with your current stylist using your existing home setup.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {premiumBarbers
                  .filter((b) => String(b.id) !== String(barber?.id))
                  .map((pBarber) => (
                    <div
                      key={pBarber.id}
                      style={{
                        border: "1.5px solid #D4A017",
                        borderRadius: "14px",
                        padding: "14px",
                        backgroundColor: "#FFFDF9",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <strong style={{ fontSize: "14px", color: "#151515" }}>
                              {pBarber.shop_name}
                            </strong>
                            <ShieldCheck size={14} color="#16A34A" />
                          </div>
                          <div style={{ fontSize: "11.5px", color: "#6E6E6E", marginTop: "2px" }}>
                            {pBarber.owner_name} • {pBarber.city || "Jaipur"}
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "4px", backgroundColor: "#FAF7EF", padding: "3px 8px", borderRadius: "8px" }}>
                          <Star size={12} color="#D4A017" />
                          <strong style={{ fontSize: "11.5px", color: "#151515" }}>
                            {Number(pBarber.rating || 4.9).toFixed(1)}
                          </strong>
                        </div>
                      </div>

                      {/* Equipment Included Badge */}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#15803D", backgroundColor: "#F0FDF4", padding: "6px 10px", borderRadius: "8px", fontWeight: "600" }}>
                        <Check size={13} color="#16A34A" />
                        <span>Brings portable styling chair & LED vanity mirror</span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "2px" }}>
                        <span style={{ fontSize: "11.5px", color: "#6E6E6E" }}>
                          Doorstep Fee: <strong>₹{pBarber.home_visit_charge || 0}</strong>
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveBarberId(String(pBarber.id));
                            setShowSwitchModal(false);
                            setHasChairMirror(false);
                            navigate(`/customer/booking/${pBarber.id}?type=home`);
                          }}
                          style={{
                            padding: "8px 14px",
                            borderRadius: "10px",
                            backgroundColor: "#151515",
                            color: "#FAF7EF",
                            fontWeight: "700",
                            fontSize: "12px",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <span>Switch to this Barber</span>
                          <ArrowRight size={13} color="#D4A017" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Modal Footer */}
            <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: "12px", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowSwitchModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#6E6E6E",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                  padding: "6px 12px",
                }}
              >
                Keep Current Stylist
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Booking;