import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Siren, Shield, Radio, MapPin, Users, Map, Activity } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

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
                <div className="grid grid-cols-3 gap-4 p-6">
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

          <div className="grid grid-cols-3 gap-6 mt-16 max-w-3xl mx-auto">
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
          <div className="relative bg-gradient-primary rounded-3xl p-12 sm:p-16 text-center overflow-hidden shadow-elegant">
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
