import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
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
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
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

const seedNotifications: Notification[] = [
  { id: "1", title: "Welcome aboard 🎉", message: "Your account is ready to go.", time: "Just now", read: false, type: "success" },
  { id: "2", title: "New feature live", message: "Realtime location tracking is here.", time: "2h ago", read: false, type: "info" },
  { id: "3", title: "Security tip", message: "Enable 2FA to protect your account.", time: "Yesterday", read: false, type: "warning" },
  { id: "4", title: "Profile updated", message: "Your changes were saved successfully.", time: "3d ago", read: true, type: "success" },
];

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>(seedNotifications);

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

  // Initialize socket connection when user is authenticated
  useEffect(() => {
    if (user && !socket) {
      const token = localStorage.getItem("token");
      const newSocket = io(import.meta.env.VITE_SOCKET_URL, {
        auth: { token }
      });

      newSocket.on("connect", () => {
        console.log("Connected to server");
      });

      newSocket.on("disconnect", () => {
        console.log("Disconnected from server");
      });

      setSocket(newSocket);
    } else if (!user && socket) {
      socket.disconnect();
      setSocket(null);
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user, socket]);

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

    // Get user profile (you might need to add a /me endpoint)
    const userResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/me`, {
      headers: {
        "Authorization": `Bearer ${data.token}`,
      },
    });

    if (userResponse.ok) {
      const userData = await userResponse.json();
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
    } else {
      // Fallback: create user object from email
      const fallbackUser = { name: email.split("@")[0], email };
      setUser(fallbackUser);
      localStorage.setItem("user", JSON.stringify(fallbackUser));
    }
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
    await login(email, password);
  }, [login]);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  const updateUser = useCallback(
    (patch: Partial<User>) => setUser((u) => (u ? { ...u, ...patch } : u)),
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
