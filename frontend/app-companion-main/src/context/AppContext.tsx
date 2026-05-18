import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

// ---- Types ----
export interface User {
  name: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  role?: string;
  _id?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "info" | "success" | "warning";
}

interface AppContextValue {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
  updateUser: (patch: Partial<User>) => void;

  // Socket
  socket: Socket | null;

  // Notifications
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("notifications");
      return saved ? (JSON.parse(saved) as Notification[]) : [];
    } catch {
      return [];
    }
  });

  const pushNotification = useCallback((notification: Omit<Notification, "id" | "time" | "read"> & { id?: string; time?: string; read?: boolean }) => {
    setNotifications((current) => [
      {
        id: notification.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        time: notification.time ?? "Just now",
        read: notification.read ?? false,
        title: notification.title,
        message: notification.message,
        type: notification.type,
      },
      ...current,
    ]);
  }, []);

  // Initialize user state from localStorage on client-side only
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        // Invalid data, clear it
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("refreshToken");
      }
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("notifications", JSON.stringify(notifications));
    } catch {
      // ignore storage errors
    }
  }, [notifications]);

  // Initialize socket connection when user is authenticated
  const isLoggedIn = !!user;

  useEffect(() => {
    if (isLoggedIn && !socketRef.current) {
      const token = localStorage.getItem("token");
      const newSocket = io(import.meta.env.VITE_SOCKET_URL, {
        auth: { token }
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      newSocket.on("connect", () => {
        console.log("Connected to server");
      });

      newSocket.on("disconnect", () => {
        console.log("Disconnected from server");
      });

      newSocket.on("zone-created", (payload: any) => {
        pushNotification({
          title: "New zone reported",
          message: payload?.title || "A new incident zone was created.",
          type: "info",
        });
      });

      newSocket.on("unapproved-zone-alert", (payload: any) => {
        pushNotification({
          title: "Nearby incident alert",
          message: `${payload?.title || "Incident"} ${payload?.incidentType ? `(${payload.incidentType})` : ""}`.trim(),
          type: "warning",
        });
      });

      newSocket.on("zone-approved", (payload: any) => {
        pushNotification({
          title: "Zone approved",
          message: payload?.title || "A zone was approved.",
          type: "success",
        });
      });

      newSocket.on("zone-denied", (payload: any) => {
        pushNotification({
          title: "Zone denied",
          message: payload?.title || "A zone was denied.",
          type: "warning",
        });
      });

      newSocket.on("zone-resolved", (payload: any) => {
        pushNotification({
          title: "Zone resolved",
          message: payload?.title || "A zone was resolved.",
          type: "info",
        });
      });

      newSocket.on("admin-notification", (payload: any) => {
        pushNotification({
          title: "Admin notification",
          message: payload?.type === "user_response"
            ? `User responses: ${payload.okCount} OK, ${payload.notOkCount} Not OK`
            : "You have a new update.",
          type: "info",
        });
      });

      newSocket.on("user-response-request", (payload: any) => {
        pushNotification({
          title: "Safety check",
          message: payload?.title || "Please confirm your safety.",
          type: "warning",
        });
      });

    } else if (!isLoggedIn && socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isLoggedIn, pushNotification]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Login failed");
    }

    const data = await response.json();
    localStorage.setItem("token", data.token);
    localStorage.setItem("refreshToken", data.refreshToken);
    const userData = data.user ?? { name: email.split("@")[0], email };
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    return userData;
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Registration failed");
    }

    const data = await response.json();
    // After signup, automatically log in
    return await login(email, password);
  }, [login]);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  const updateUser = useCallback(
    (patch: Partial<User>) => {
      setUser((u) => {
        if (!u) return u;
        const nextUser = { ...u, ...patch };
        localStorage.setItem("user", JSON.stringify(nextUser));
        return nextUser;
      });
    },
    []
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((n) => n.map((x) => (x.id === id ? { ...x, read: true } : x)));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((n) => n.map((x) => ({ ...x, read: true })));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        updateUser,
        socket,
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}
