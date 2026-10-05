import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL, getAccessToken } from "../../services/api";
import {
  Clock,
  Store,
  Scissors,
  CheckCircle,
  AlertCircle,
  Copy,
  Save,
  Check,
} from "../../components/common/Icons";
import Skeleton from "../../components/ui/Skeleton";

const createSchedule = () => [
  { id: "monday", day: "Monday", enabled: true, open: "10:00", close: "20:00" },
  { id: "tuesday", day: "Tuesday", enabled: true, open: "10:00", close: "20:00" },
  { id: "wednesday", day: "Wednesday", enabled: true, open: "10:00", close: "20:00" },
  { id: "thursday", day: "Thursday", enabled: true, open: "10:00", close: "20:00" },
  { id: "friday", day: "Friday", enabled: true, open: "10:00", close: "20:00" },
  { id: "saturday", day: "Saturday", enabled: true, open: "10:00", close: "21:00" },
  { id: "sunday", day: "Sunday", enabled: false, open: "10:00", close: "20:00" },
];

function BarberAvailability() {
  const [activeService, setActiveService] = useState("shop");
  const [shopSchedule, setShopSchedule] = useState(createSchedule());
  const [homeSchedule, setHomeSchedule] = useState(
    createSchedule().map((item) => ({ ...item, open: "11:00", close: "18:00" }))
  );

  const [breakTime, setBreakTime] = useState({
    enabled: true,
    start: "13:00",
    end: "14:00",
  });

  const [slotDuration, setSlotDuration] = useState("30");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        setError("");
        const token = getAccessToken("barber");
        if (!token) return;

        const res = await fetch(`${API_BASE_URL}/api/barbers/schedule/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.weekly_schedule) {
            if (Array.isArray(data.weekly_schedule.shop)) setShopSchedule(data.weekly_schedule.shop);
            if (Array.isArray(data.weekly_schedule.home)) setHomeSchedule(data.weekly_schedule.home);
          }
          if (data.break_start && data.break_end) {
            setBreakTime({
              enabled: Boolean(data.break_enabled),
              start: data.break_start,
              end: data.break_end,
            });
          }
          if (data.slot_duration) setSlotDuration(String(data.slot_duration));
        }
      } catch (err) {
        console.error("Fetch schedule error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  const currentSchedule = activeService === "shop" ? shopSchedule : homeSchedule;
  const setCurrentSchedule = activeService === "shop" ? setShopSchedule : setHomeSchedule;

  const toggleDay = (dayId) => {
    setCurrentSchedule((prev) =>
      prev.map((item) => (item.id === dayId ? { ...item, enabled: !item.enabled } : item))
    );
  };

  const handleTimeChange = (dayId, field, value) => {
    setCurrentSchedule((prev) =>
      prev.map((item) => (item.id === dayId ? { ...item, [field]: value } : item))
    );
  };

  const copyMondayToAll = () => {
    const monday = currentSchedule.find((item) => item.id === "monday");
    if (!monday) return;
    setCurrentSchedule((prev) =>
      prev.map((item) => ({ ...item, open: monday.open, close: monday.close }))
    );
    alert("Monday hours copied to all days.");
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSaved(false);
      const token = getAccessToken("barber");
      if (!token) return;

      const payload = {
        weekly_schedule: { shop: shopSchedule, home: homeSchedule },
        break_enabled: breakTime.enabled,
        break_start: breakTime.start,
        break_end: breakTime.end,
        slot_duration: parseInt(slotDuration, 10),
      };

      const res = await fetch(`${API_BASE_URL}/api/barbers/schedule/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save schedule.");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      setError("Unable to save schedule.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <Skeleton variant="card" height="120px" />
        <Skeleton variant="card" height="240px" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto", padding: "16px 16px 40px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "16px" }}>
      
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "20px", fontWeight: "800", color: "#151515", margin: 0, letterSpacing: "-0.3px" }}>
          Schedule & Availability
        </h1>
        <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6E6E6E" }}>
          Configure working hours, breaks, and booking slot duration
        </p>
      </div>

      {saved && (
        <div style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0", color: "#16A34A", padding: "12px 14px", borderRadius: "12px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
          <CheckCircle size={16} color="#16A34A" />
          <span>Schedule saved successfully!</span>
        </div>
      )}

      {error && (
        <div style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", padding: "12px 14px", borderRadius: "12px", fontSize: "13px" }}>
          {error}
        </div>
      )}

      {/* Mode Selector */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <button
          type="button"
          onClick={() => setActiveService("shop")}
          style={{
            padding: "12px",
            borderRadius: "12px",
            cursor: "pointer",
            border: activeService === "shop" ? "2px solid #D4A017" : "1px solid rgba(0,0,0,0.08)",
            backgroundColor: activeService === "shop" ? "#FAF7EF" : "#FFFFFF",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <Store size={18} color={activeService === "shop" ? "#D4A017" : "#151515"} />
          <div style={{ textAlign: "left" }}>
            <strong style={{ fontSize: "13px", color: "#151515", display: "block" }}>Salon Hours</strong>
            <span style={{ fontSize: "11px", color: "#6E6E6E" }}>In-shop visits</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveService("home")}
          style={{
            padding: "12px",
            borderRadius: "12px",
            cursor: "pointer",
            border: activeService === "home" ? "2px solid #D4A017" : "1px solid rgba(0,0,0,0.08)",
            backgroundColor: activeService === "home" ? "#FAF7EF" : "#FFFFFF",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <Scissors size={18} color={activeService === "home" ? "#D4A017" : "#151515"} />
          <div style={{ textAlign: "left" }}>
            <strong style={{ fontSize: "13px", color: "#151515", display: "block" }}>Doorstep Hours</strong>
            <span style={{ fontSize: "11px", color: "#6E6E6E" }}>Home service</span>
          </div>
        </button>
      </div>

      {/* Weekly Schedule Card */}
      <section style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "16px",
        padding: "16px",
        border: "1px solid rgba(0, 0, 0, 0.06)",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
        display: "flex",
        flexDirection: "column",
        gap: "12px"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: "15px", fontWeight: "800", color: "#151515", margin: 0 }}>
              {activeService === "shop" ? "Salon Working Hours" : "Doorstep Working Hours"}
            </h2>
          </div>
          <button
            type="button"
            onClick={copyMondayToAll}
            style={{
              background: "none",
              border: "1px solid rgba(212, 160, 23, 0.4)",
              color: "#151515",
              borderRadius: "8px",
              padding: "5px 10px",
              fontSize: "11px",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            <Copy size={11} color="#D4A017" />
            <span>Copy Monday</span>
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {currentSchedule.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                borderRadius: "10px",
                backgroundColor: item.enabled ? "#FAF7EF" : "#F9FAFB",
                border: "1px solid rgba(0, 0, 0, 0.05)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => toggleDay(item.id)}
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "6px",
                    border: item.enabled ? "2px solid #D4A017" : "2px solid rgba(0,0,0,0.2)",
                    backgroundColor: item.enabled ? "#D4A017" : "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0
                  }}
                >
                  {item.enabled && <Check size={13} color="#151515" />}
                </button>
                <span style={{ fontSize: "13px", fontWeight: "750", color: item.enabled ? "#151515" : "#9CA3AF" }}>
                  {item.day}
                </span>
              </div>

              {item.enabled ? (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <input
                    type="time"
                    value={item.open}
                    onChange={(e) => handleTimeChange(item.id, "open", e.target.value)}
                    style={{ padding: "5px 6px", borderRadius: "6px", border: "1px solid rgba(0,0,0,0.15)", fontSize: "12px", backgroundColor: "#fff" }}
                  />
                  <span style={{ fontSize: "12px", color: "#6E6E6E" }}>to</span>
                  <input
                    type="time"
                    value={item.close}
                    onChange={(e) => handleTimeChange(item.id, "close", e.target.value)}
                    style={{ padding: "5px 6px", borderRadius: "6px", border: "1px solid rgba(0,0,0,0.15)", fontSize: "12px", backgroundColor: "#fff" }}
                  />
                </div>
              ) : (
                <span style={{ fontSize: "12px", color: "#9CA3AF", fontStyle: "italic" }}>Closed</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Break Time & Slot Duration */}
      <section style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "16px",
        padding: "16px",
        border: "1px solid rgba(0, 0, 0, 0.06)",
        display: "flex",
        flexDirection: "column",
        gap: "12px"
      }}>
        <h3 style={{ fontSize: "14px", fontWeight: "800", color: "#151515", margin: 0 }}>
          Slot Duration & Daily Break
        </h3>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "#151515" }}>Appointment Slot Duration</div>
            <div style={{ fontSize: "11px", color: "#6E6E6E" }}>Time allocated per booking</div>
          </div>
          <select
            value={slotDuration}
            onChange={(e) => setSlotDuration(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.15)", fontSize: "12px", fontWeight: "700" }}
          >
            <option value="15">15 Minutes</option>
            <option value="30">30 Minutes</option>
            <option value="45">45 Minutes</option>
            <option value="60">60 Minutes</option>
          </select>
        </div>

        <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "#151515" }}>Daily Lunch / Break Time</div>
            <div style={{ fontSize: "11px", color: "#6E6E6E" }}>Slots during this period will be blocked</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <input
              type="time"
              value={breakTime.start}
              onChange={(e) => setBreakTime({ ...breakTime, start: e.target.value })}
              style={{ padding: "4px", borderRadius: "6px", border: "1px solid rgba(0,0,0,0.15)", fontSize: "12px" }}
            />
            <span>-</span>
            <input
              type="time"
              value={breakTime.end}
              onChange={(e) => setBreakTime({ ...breakTime, end: e.target.value })}
              style={{ padding: "4px", borderRadius: "6px", border: "1px solid rgba(0,0,0,0.15)", fontSize: "12px" }}
            />
          </div>
        </div>
      </section>

      {/* Save Button */}
      <button
        type="button"
        disabled={saving}
        onClick={handleSave}
        style={{
          padding: "13px",
          borderRadius: "12px",
          backgroundColor: "#D4A017",
          color: "#151515",
          fontWeight: "800",
          fontSize: "14px",
          border: "none",
          cursor: saving ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          boxShadow: "0 3px 10px rgba(212, 160, 23, 0.3)"
        }}
      >
        <Save size={16} color="#151515" />
        <span>{saving ? "Saving Schedule..." : "Save Availability Schedule"}</span>
      </button>

    </div>
  );
}

export default BarberAvailability;