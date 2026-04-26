import { createContext, useContext, useState, useCallback, ReactNode } from "react";

// ---- Types ----
export interface User {
  name: string;
  email: string;
  bio: string;
  avatarUrl?: string;
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
  login: (email: string) => void;
  signup: (name: string, email: string) => void;
  logout: () => void;
  updateUser: (patch: Partial<User>) => void;

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
  // Static demo user — wired into context state for editability
  const [user, setUser] = useState<User | null>({
    name: "Alex Morgan",
    email: "alex@intellifence.app",
    bio: "Field officer • Zone 4 monitoring",
  });
  const [notifications, setNotifications] = useState<Notification[]>(seedNotifications);

  const login = useCallback((email: string) => {
    setUser({ name: email.split("@")[0], email, bio: "" });
  }, []);
  const signup = useCallback((name: string, email: string) => {
    setUser({ name, email, bio: "" });
  }, []);
  const logout = useCallback(() => setUser(null), []);
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
