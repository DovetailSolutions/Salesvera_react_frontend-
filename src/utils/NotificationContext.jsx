// utils/NotificationContext.jsx
// Fully connected to the REST notification API + socket push support
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

const NotificationContext = createContext(null);

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// Map a raw DB notification row → the shape the UI expects
const mapDbNotification = (n) => ({
    id: n.id,                           // real DB id — needed for API calls
    title: n.title || "Notification",
    body: n.body || "",
    type: n.type || "info",
    timestamp: n.createdAt || new Date(),
    read: n.isRead ?? false,
    data: n.data ?? null,
});

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    // Only used for socket-pushed notifications that don't yet have a DB id
    const localIdRef = useRef(0);

    const getToken = () => localStorage.getItem("accessToken");

    // ── Fetch from REST API ───────────────────────────────────────────────────
    const fetchNotifications = useCallback(async () => {
        const token = getToken();
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/notifications?limit=50`, {
                headers: { token },
            });
            const data = await res.json();
            if (data.success) {
                setNotifications(data.data.map(mapDbNotification));
            }
        } catch (err) {
            console.error("fetchNotifications error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load on mount (once user is authenticated — token already in localStorage by then)
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // ── Push a socket notification (backend already saved it to DB) ───────────
    // The socket `notification` event fires right after DB insert, so we just
    // prepend it locally using the DB id if the backend includes it, otherwise
    // we use a temporary local id and let the next fetch reconcile.
    const pushNotification = useCallback(({ title, body, type = "info", id: dbId, data }) => {
        const id = dbId ?? `local-${++localIdRef.current}`;
        setNotifications((prev) => {
            // Avoid duplicates if the initial fetch already loaded this notification
            if (dbId && prev.some((n) => n.id === dbId)) return prev;
            return [
                { id, title, body, type, timestamp: new Date(), read: false, data: data ?? null },
                ...prev.slice(0, 49),
            ];
        });
    }, []);

    // ── Mark one as read — optimistic + REST ─────────────────────────────────
    const markRead = useCallback(async (id) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        try {
            const token = getToken();
            // Only call API for real DB ids (not temp local-* ids)
            if (token && typeof id === "number") {
                await fetch(`${API_URL}/api/notifications/${id}/read`, {
                    method: "PATCH",
                    headers: { token },
                });
            }
        } catch (err) {
            console.error("markRead error:", err);
        }
    }, []);

    // ── Mark all as read ──────────────────────────────────────────────────────
    const markAllRead = useCallback(async () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        try {
            const token = getToken();
            if (token) {
                await fetch(`${API_URL}/api/notifications/read-all`, {
                    method: "PATCH",
                    headers: { token },
                });
            }
        } catch (err) {
            console.error("markAllRead error:", err);
        }
    }, []);

    // ── Remove one ────────────────────────────────────────────────────────────
    const remove = useCallback(async (id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        try {
            const token = getToken();
            if (token && typeof id === "number") {
                await fetch(`${API_URL}/api/notifications/${id}`, {
                    method: "DELETE",
                    headers: { token },
                });
            }
        } catch (err) {
            console.error("remove notification error:", err);
        }
    }, []);

    // ── Clear all ─────────────────────────────────────────────────────────────
    const clearAll = useCallback(async () => {
        setNotifications([]);
        try {
            const token = getToken();
            if (token) {
                await fetch(`${API_URL}/api/notifications/clear-all`, {
                    method: "DELETE",
                    headers: { token },
                });
            }
        } catch (err) {
            console.error("clearAll error:", err);
        }
    }, []);

    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                loading,
                pushNotification,
                markRead,
                markAllRead,
                remove,
                clearAll,
                fetchNotifications, // expose so any component can manually refresh
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error("useNotifications must be used inside <NotificationProvider>");
    return ctx;
}