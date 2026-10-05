import React, { useEffect, useState } from "react";
import { X, Bell, Check, Clock } from "./Icons";
import { API_BASE_URL, getAccessToken } from "../../services/api";
import "./NotificationsModal.css";

export default function NotificationsModal({ isOpen, onClose, onCountChange }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = getAccessToken("customer");
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/bookings/notifications/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        const count = Number(data.unread_count || 0);
        setUnreadCount(count);
        if (onCountChange) onCountChange(count);
      }
    } catch (e) {
      console.error("Notifications fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const markAllAsRead = async () => {
    try {
      const token = getAccessToken("customer");
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/bookings/notifications/read-all/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
        if (onCountChange) onCountChange(0);
      }
    } catch (e) {
      console.error("Mark all read error:", e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="boc-modal-backdrop" onClick={onClose}>
      <div className="boc-modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="boc-modal-header">
          <div className="boc-modal-title-group">
            <Bell size={18} className="boc-modal-icon" />
            <h3 className="boc-modal-title">Notifications</h3>
            {unreadCount > 0 && <span className="boc-modal-count-pill">{unreadCount}</span>}
          </div>
          <div className="boc-modal-header-actions">
            {unreadCount > 0 && (
              <button type="button" className="boc-modal-text-btn" onClick={markAllAsRead}>
                Mark all read
              </button>
            )}
            <button type="button" className="boc-modal-close-btn" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="boc-modal-body">
          {loading && notifications.length === 0 ? (
            <div className="boc-modal-empty">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="boc-modal-empty">
              <Bell size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              <p>No notifications right now.</p>
            </div>
          ) : (
            <div className="boc-notification-items">
              {notifications.map((item) => (
                <div key={item.id} className={`boc-notif-card ${!item.is_read ? "unread" : ""}`}>
                  <div className="boc-notif-main">
                    <strong className="boc-notif-title">{item.title}</strong>
                    <p className="boc-notif-msg">{item.message}</p>
                    <span className="boc-notif-time">
                      <Clock size={11} />
                      {new Date(item.created_at).toLocaleTimeString("en-IN", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

