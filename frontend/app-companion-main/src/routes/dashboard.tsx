import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useEffect } from "react";
import { Activity, Bell, MapPin, Shield, Users, ArrowRight, Radio, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/context/AppContext";
import { ScrollReveal } from "@/components/ScrollReveal";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — IntelliFence" },
      { name: "description", content: "Live overview of your IntelliFence account, notifications, and safety tools." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, isAuthenticated, socket, notifications, unreadCount } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  const recentNotifications = useMemo(() => notifications.slice(0, 5), [notifications]);
  const unreadWarnings = useMemo(() => notifications.filter((n) => !n.read && n.type === "warning").length, [notifications]);
  const successCount = useMemo(() => notifications.filter((n) => n.type === "success").length, [notifications]);
  const liveStatus = socket?.connected ? "Live" : "Offline";
  const nextAction = unreadCount > 0 ? "Review notifications" : "Check your location";
  const priorityAlerts = useMemo(
    () => notifications.filter((n) => !n.read && n.type === "warning").slice(0, 3),
    [notifications]
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <ScrollReveal>
          <section className="relative overflow-hidden bg-gradient-hero">
            <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_1px_1px,oklch(0.7_0.05_270/0.35)_1px,transparent_0)] [background-size:30px_30px]" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
              <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
                <div>
                  <Badge variant="secondary" className="mb-4">Operations overview</Badge>
                  <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Welcome back, {user?.name ?? "there"}.</h1>
                  <p className="mt-3 text-muted-foreground max-w-2xl">
                    Track live safety signals, recent alerts, and key account metrics in one place.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button variant="hero" asChild>
                      <Link to="/notifications"><Bell className="h-4 w-4" /> Review alerts</Link>
                    </Button>
                    <Button variant="glass" asChild>
                      <Link to="/location"><MapPin className="h-4 w-4" /> Open live map</Link>
                    </Button>
                  </div>
                </div>
                <Card className="bg-gradient-card border-border/60">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">System status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Connection</span>
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${socket?.connected ? "bg-success" : "bg-destructive"}`} />
                        <span className="font-medium">{liveStatus}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Role</span>
                      <span className="font-medium capitalize">{user?.role ?? "user"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Unread alerts</span>
                      <span className="font-medium">{unreadCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total alerts</span>
                      <span className="font-medium">{notifications.length}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal delay={120}>
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard title="Connection" value={liveStatus} icon={Radio} tone={socket?.connected ? "success" : "warning"} />
              <StatCard title="Unread alerts" value={String(unreadCount)} icon={Bell} tone="primary" />
              <StatCard title="Total alerts" value={String(notifications.length)} icon={Activity} tone="neutral" />
              <StatCard title="Next action" value={nextAction} icon={Shield} tone="neutral" />
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_1fr_0.9fr]">
              <Card className="bg-gradient-card border-border/60">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <div>
                    <CardTitle className="text-xl">Priority alerts</CardTitle>
                    <p className="text-sm text-muted-foreground">Warnings that need attention first.</p>
                  </div>
                  <Badge variant={priorityAlerts.length > 0 ? "destructive" : "secondary"}>
                    {priorityAlerts.length > 0 ? "Needs review" : "All clear"}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {priorityAlerts.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                      No critical warnings right now.
                    </div>
                  ) : (
                    priorityAlerts.map((item) => (
                      <div key={item.id} className="flex gap-3 rounded-2xl border border-border/50 bg-background/40 p-4">
                        <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-destructive/15 text-destructive">
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium truncate">{item.title}</p>
                            <span className="mt-1 h-2 w-2 rounded-full bg-destructive shrink-0" />
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{item.message}</p>
                          <p className="text-[11px] text-muted-foreground mt-2">{item.time}</p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-border/60">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <div>
                    <CardTitle className="text-xl">Live safety feed</CardTitle>
                    <p className="text-sm text-muted-foreground">Recent updates delivered through the notification socket.</p>
                  </div>
                  <Badge variant={socket?.connected ? "default" : "secondary"}>{liveStatus}</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentNotifications.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                      No live notifications yet.
                    </div>
                  ) : (
                    recentNotifications.map((item) => (
                      <div key={item.id} className="flex gap-3 rounded-2xl border border-border/50 bg-background/40 p-4">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${item.type === "success" ? "bg-success/15 text-success" : item.type === "warning" ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary"}`}>
                          {item.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : item.type === "warning" ? <AlertTriangle className="h-5 w-5" /> : <Activity className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium truncate">{item.title}</p>
                            {!item.read && <span className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{item.message}</p>
                          <p className="text-[11px] text-muted-foreground mt-2">{item.time}</p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="bg-gradient-card border-border/60">
                  <CardHeader>
                    <CardTitle className="text-xl">Action center</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="rounded-2xl border border-border/50 bg-background/40 p-4">
                      <div className="text-muted-foreground text-xs uppercase tracking-widest">Recommended</div>
                      <div className="mt-1 text-lg font-semibold">{nextAction}</div>
                      <p className="mt-2 text-muted-foreground">
                        {unreadCount > 0
                          ? "You have live alerts waiting. Open the notification feed to catch up quickly."
                          : "No unread alerts right now. Check your location and keep monitoring live activity."}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <MiniPill label="Unread warnings" value={String(unreadWarnings)} />
                      <MiniPill label="Successful updates" value={String(successCount)} />
                    </div>

                    <div className="grid gap-2">
                      <Button asChild variant="hero" className="justify-start">
                        <Link to="/notifications"><Bell className="h-4 w-4" /> Open notifications</Link>
                      </Button>
                      <Button asChild variant="outline" className="justify-start">
                        <Link to="/location"><MapPin className="h-4 w-4" /> Update location</Link>
                      </Button>
                      <Button asChild variant="outline" className="justify-start">
                        <Link to="/profile"><Users className="h-4 w-4" /> Edit profile</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-card border-border/60">
                  <CardHeader>
                    <CardTitle className="text-xl">Account snapshot</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <Row label="Name" value={user?.name ?? "—"} />
                    <Row label="Email" value={user?.email ?? "—"} />
                    <Row label="Role" value={user?.role ?? "user"} />
                    <Row label="Socket" value={socket?.connected ? "Connected" : "Disconnected"} />
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        </ScrollReveal>
      </main>
      <Footer />
    </div>
  );
}

function StatCard({ title, value, icon: Icon, tone }: { title: string; value: string; icon: typeof Activity; tone: "primary" | "success" | "warning" | "neutral" }) {
  return (
    <Card className="bg-gradient-card border-border/60">
      <CardContent className="p-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="mt-2 text-3xl font-bold">{value}</div>
        </div>
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${tone === "success" ? "bg-success/15 text-success" : tone === "warning" ? "bg-destructive/15 text-destructive" : tone === "primary" ? "bg-primary/15 text-primary" : "bg-secondary text-foreground"}`}>
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/50 pb-3 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right truncate">{value}</span>
    </div>
  );
}

function MiniPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-background/40 p-4">
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
