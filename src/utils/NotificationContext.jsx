// context/NotificationContext.jsx
import React, { createContext, useContext, useState, useCallback, useRef } from "react";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);
    const idRef = useRef(0);

    /** Push a new socket/system notification */
    const pushNotification = useCallback(({ title, body, type = "info" }) => {
        const id = ++idRef.current;
        setNotifications((prev) => [
            { id, title, body, type, timestamp: new Date(), read: false },
            ...prev.slice(0, 49), // keep max 50
        ]);
    }, []);

    /** Mark one as read */
    const markRead = useCallback((id) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
    }, []);

    /** Mark all as read */
    const markAllRead = useCallback(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }, []);

    /** Remove one */
    const remove = useCallback((id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    /** Clear all */
    const clearAll = useCallback(() => setNotifications([]), []);

    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
        <NotificationContext.Provider
            value={{ notifications, unreadCount, pushNotification, markRead, markAllRead, remove, clearAll }}
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