import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Bell, Check, CheckCheck, Clock3, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApp, type Notification } from "@/context/AppContext";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — IntelliFence" },
      { name: "description", content: "Live IntelliFence notifications and safety updates." },
    ],
  }),
  component: NotificationsPage,
});

const iconMap = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
};

function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isAuthenticated } = useApp();
  const sorted = useMemo(() => [...notifications], [notifications]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-hero">
      <Navbar />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-hero">
          <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_1px_1px,oklch(0.7_0.05_270/0.35)_1px,transparent_0)] [background-size:30px_30px]" />
          <div className="relative max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <Badge variant="secondary" className="mb-3">Live feed</Badge>
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Notifications</h1>
                <p className="mt-2 text-muted-foreground">Your app notifications update here in real time.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="glass rounded-2xl px-4 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-primary" />
                    <span>{unreadCount} unread</span>
                  </div>
                </div>
                {unreadCount > 0 && (
                  <Button variant="hero" onClick={markAllAsRead}>
                    <CheckCheck className="h-4 w-4" /> Mark all read
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-background/95">
          <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {!isAuthenticated ? (
              <div className="glass rounded-3xl p-10 text-center">
                <h2 className="text-2xl font-bold">Sign in to see your live feed</h2>
                <p className="mt-2 text-muted-foreground">Notifications are tied to your signed-in session.</p>
                <div className="mt-6 flex justify-center gap-3">
                  <Button asChild variant="hero"><Link to="/login">Sign in</Link></Button>
                  <Button asChild variant="outline"><Link to="/signup">Create account</Link></Button>
                </div>
              </div>
            ) : sorted.length === 0 ? (
              <div className="glass rounded-3xl p-10 text-center">
                <Bell className="h-10 w-10 mx-auto text-muted-foreground" />
                <h2 className="mt-4 text-2xl font-bold">No notifications yet</h2>
                <p className="mt-2 text-muted-foreground">When zones, incidents, or safety alerts arrive, they will show up here automatically.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sorted.map((n) => (
                  <NotificationRow key={n.id} notification={n} onRead={markAsRead} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function NotificationRow({ notification, onRead }: { notification: Notification; onRead: (id: string) => void }) {
  const Icon = iconMap[notification.type];

  return (
    <div className={cn("rounded-3xl border border-border bg-gradient-card p-5 sm:p-6 flex gap-4", !notification.read && "ring-1 ring-primary/20")}>
      <div
        className={cn(
          "h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center",
          notification.type === "success" && "bg-success/15 text-success",
          notification.type === "info" && "bg-primary/15 text-primary",
          notification.type === "warning" && "bg-destructive/15 text-destructive"
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">{notification.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
          </div>
          {!notification.read && <span className="mt-2 h-2.5 w-2.5 rounded-full bg-primary shrink-0" />}
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">{notification.time}</span>
          {!notification.read ? (
            <button onClick={() => onRead(notification.id)} className="inline-flex items-center gap-1 text-primary hover:underline">
              <Check className="h-4 w-4" /> Mark read
            </button>
          ) : (
            <span className="text-success inline-flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Read</span>
          )}
        </div>
      </div>
    </div>
  );
}
