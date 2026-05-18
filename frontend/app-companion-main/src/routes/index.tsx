import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Siren, Shield, Radio, MapPin, Users, Map, Activity, Bell } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/context/AppContext";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IntelliFence — Real-time Public Safety & Monitoring System" },
      { name: "description", content: "IntelliFence helps authorities monitor public safety, manage emergencies, and respond rapidly with live tracking, geo-fencing, and centralized incident management." },
      { property: "og:title", content: "IntelliFence — Real-time Public Safety & Monitoring System" },
      { property: "og:description", content: "Live tracking, geo-fencing, SOS alerts and centralized incident response." },
    ],
  }),
  component: LandingPage,
});

const features = [
  { icon: MapPin, title: "Real-time tracking", desc: "Continuous GPS updates over WebSockets keep every active user visible on the authority dashboard." },
  { icon: Siren, title: "One-click SOS", desc: "Instant emergency alerts auto-create incidents with live location and notify responders in seconds." },
  { icon: Map, title: "Geo-fencing engine", desc: "Define polygon-based restricted or high-risk zones with entry/exit alerts and risk categorization." },
  { icon: Radio, title: "Authority broadcasts", desc: "Push public safety announcements and warnings directly to active users in affected areas." },
  { icon: Activity, title: "Incident lifecycle", desc: "Track every incident from Pending → Responding → Resolved with full response-time analytics." },
  { icon: Shield, title: "Secure by design", desc: "JWT auth, role-based access, consent-driven location, and protected administrative endpoints." },
];

function LandingPage() {
  const { isAuthenticated, user, notifications, unreadCount, socket } = useApp();
  if (isAuthenticated) {
    const recent = notifications.slice(0, 3);

    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />

        <section className="relative overflow-hidden bg-gradient-hero">
          <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_1px_1px,oklch(0.7_0.05_270/0.35)_1px,transparent_0)] [background-size:30px_30px]" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div>
                <Badge variant="secondary" className="mb-4">Signed in home</Badge>
                <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-tight max-w-4xl leading-[1.05]">
                  Welcome back, <span className="text-gradient">{user?.name ?? "there"}</span>
                </h1>
                <p className="mt-4 text-lg sm:text-xl text-muted-foreground max-w-2xl">
                  Your account is live. Jump into your dashboard, track your location, or review the latest safety activity.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="hero" size="xl" asChild>
                  <Link to="/dashboard">Open dashboard <ArrowRight className="h-4 w-4" /></Link>
                </Button>
                <Button variant="glass" size="xl" asChild>
                  <Link to="/location"><MapPin className="h-4 w-4" /> Location</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mt-10">
              <MiniStat label="Connection" value={socket?.connected ? "Live" : "Offline"} />
              <MiniStat label="Unread alerts" value={String(unreadCount)} />
              <MiniStat label="Total alerts" value={String(notifications.length)} />
              <MiniStat label="Role" value={user?.role ?? "user"} />
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className="bg-gradient-card border-border/60">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center justify-between gap-3 mb-5">
                  <div>
                    <h2 className="text-2xl font-bold">What you can do next</h2>
                    <p className="text-sm text-muted-foreground mt-1">Shortcuts to the live parts of the app.</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <ActionCard title="Dashboard" desc="See live status and recent notifications." to="/dashboard" icon={Activity} />
                  <ActionCard title="Notifications" desc="Review the full live feed." to="/notifications" icon={Bell} />
                  <ActionCard title="Location" desc="Track your position and nearby zones." to="/location" icon={MapPin} />
                  <ActionCard title="Profile" desc="Update your account and preferences." to="/profile" icon={Users} />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/60">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-2xl font-bold">Latest activity</h2>
                <p className="text-sm text-muted-foreground mt-1">Recent app events are shown here.</p>
                <div className="mt-5 space-y-3">
                  {recent.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                      No activity yet.
                    </div>
                  ) : (
                    recent.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-border/50 bg-background/40 p-4">
                        <p className="font-medium">{item.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{item.message}</p>
                        <p className="mt-2 text-[11px] text-muted-foreground">{item.time}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative bg-gradient-hero overflow-hidden">
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,oklch(0.7_0.05_270/0.4)_1px,transparent_0)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-medium mb-8 animate-float">
            <Siren className="h-3.5 w-3.5 text-primary" />
            <span>Live incident response — now in beta</span>
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl mx-auto leading-[1.05]">
            Public safety,{" "}
            <span className="text-gradient">in real time</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            IntelliFence gives authorities live tracking, geo-fenced danger zones, and one-click SOS — so emergencies are seen, triaged, and resolved faster.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="hero" size="xl" asChild>
              <Link to="/signup">
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="glass" size="xl" asChild>
              <a href="#features">See what's inside</a>
            </Button>
          </div>

          {/* Floating product mock */}
          <div className="relative mt-20 max-w-5xl mx-auto">
            <div className="absolute -inset-4 bg-gradient-primary opacity-20 blur-3xl rounded-3xl" />
            <div className="relative glass rounded-2xl p-2 shadow-elegant">
              <div className="rounded-xl bg-card overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                  <div className="flex gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-destructive/80" />
                    <span className="h-3 w-3 rounded-full bg-chart-4/80" />
                    <span className="h-3 w-3 rounded-full bg-success/80" />
                  </div>
                  <span className="ml-3 text-xs text-muted-foreground">dashboard.intellifence.app/live</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 sm:p-6">
                  {[
                    { Icon: Users, label: "Active users", value: "1,284" },
                    { Icon: Siren, label: "Open incidents", value: "07" },
                    { Icon: Map, label: "Danger zones", value: "12" },
                  ].map(({ Icon, label, value }) => (
                    <div key={label} className="bg-gradient-card rounded-xl p-5 border border-border text-left">
                      <Icon className="h-6 w-6 text-primary mb-3" />
                      <div className="text-2xl font-bold">{value}</div>
                      <div className="text-xs text-muted-foreground mt-1">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">Everything you need, nothing you don't</h2>
            <p className="mt-4 text-lg text-muted-foreground">Six core capabilities, each crafted with the same obsessive attention to detail.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group relative bg-gradient-card border border-border rounded-2xl p-6 hover:border-primary/40 transition-smooth shadow-card hover:shadow-glow"
              >
                <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-5 group-hover:scale-110 transition-smooth">
                  <Icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-24 sm:py-32 relative">
        <div className="absolute inset-0 bg-gradient-hero opacity-40" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-accent uppercase tracking-widest mb-3">About</p>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            Built for <span className="text-gradient">cities, campuses & crowds</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            IntelliFence is a real-time public safety platform designed for general deployment — cities, campuses, public events, and disaster zones.
            It combines live location, geo-fencing, and centralized incident management into one reliable, rule-based system that scales.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 max-w-3xl mx-auto">
            {[
              { num: "<2s", label: "Alert latency" },
              { num: "24/7", label: "Live monitoring" },
              { num: "100%", label: "Consent-driven" },
            ].map(({ num, label }) => (
              <div key={label} className="glass rounded-2xl p-6">
                <div className="text-3xl sm:text-4xl font-bold text-gradient">{num}</div>
                <div className="text-sm text-muted-foreground mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-gradient-primary rounded-3xl p-8 sm:p-12 lg:p-16 text-center overflow-hidden shadow-elegant">
            <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]" />
            <div className="relative">
              <h2 className="text-4xl sm:text-5xl font-bold text-primary-foreground tracking-tight">Be ready before the next emergency.</h2>
              <p className="mt-4 text-primary-foreground/80 text-lg max-w-xl mx-auto">Spin up an IntelliFence portal for your city, campus or event in minutes.</p>
              <Button size="xl" variant="glass" asChild className="mt-8 text-foreground">
                <Link to="/signup">Create your free account <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-2xl p-4 border border-border/50">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
}

function ActionCard({ title, desc, to, icon: Icon }: { title: string; desc: string; to: string; icon: any }) {
  return (
    <Link to={to} className="group rounded-2xl border border-border/60 bg-background/40 p-4 hover:border-primary/40 hover:bg-background/60 transition-smooth">
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-smooth">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
        </div>
      </div>
    </Link>
  );
}
