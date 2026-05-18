import { Logo } from "@/components/Logo";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, MapPin, Activity, Siren } from "lucide-react";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-hero overflow-x-hidden">
      <Navbar />
      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_1px_1px,oklch(0.7_0.05_270/0.35)_1px,transparent_0)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
            <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div className="max-w-2xl">
                <Badge variant="secondary" className="mb-4">Secure access</Badge>
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
                  {title}
                </h1>
                <p className="mt-4 text-lg sm:text-xl text-muted-foreground max-w-xl">
                  {subtitle}
                </p>

                <div className="hidden lg:grid gap-4 sm:grid-cols-2 mt-8">
                  <Card className="bg-gradient-card border-border/60">
                    <CardContent className="p-5 flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                        <Shield className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">Protected by design</p>
                        <p className="text-sm text-muted-foreground mt-1">JWT auth, role checks, and account-level access controls.</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-card border-border/60">
                    <CardContent className="p-5 flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">Location-aware tools</p>
                        <p className="text-sm text-muted-foreground mt-1">Live tracking and zone alerts are ready after sign-in.</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-card border-border/60">
                    <CardContent className="p-5 flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                        <Activity className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">Real-time activity</p>
                        <p className="text-sm text-muted-foreground mt-1">Notifications and dashboard updates stay in sync.</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-card border-border/60">
                    <CardContent className="p-5 flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                        <Siren className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">Emergency ready</p>
                        <p className="text-sm text-muted-foreground mt-1">Quick access to SOS, reports, and incident tools.</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="w-full max-w-md lg:justify-self-end">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-primary opacity-30 blur-2xl rounded-2xl" />
                  <div className="relative glass rounded-2xl p-6 sm:p-8 lg:p-10 shadow-elegant">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Account access</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
                    <div className="mt-8">{children}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
