import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BellRing, Shield, Smartphone, MoonStar, Save, Settings as SettingsIcon, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/context/AppContext";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — IntelliFence" },
      { name: "description", content: "Update your IntelliFence notification and privacy preferences." },
    ],
  }),
  component: SettingsPage,
});

type SettingsState = {
  pushAlerts: boolean;
  emailSummary: boolean;
  autoOpenMap: boolean;
  compactMode: boolean;
};

const STORAGE_KEY = "intellifence_settings";

function SettingsPage() {
  const { isAuthenticated, user } = useApp();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<SettingsState>({
    pushAlerts: true,
    emailSummary: false,
    autoOpenMap: true,
    compactMode: false,
  });

  // Redirect unauthenticated users
  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, navigate]);

  // Load settings from backend
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/settings`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setSettings((prev) => ({ ...prev, ...data.settings }));
        } else {
          // Fall back to localStorage if backend doesn't have settings
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            try {
              setSettings((prev) => ({ ...prev, ...JSON.parse(stored) }));
            } catch {
              localStorage.removeItem(STORAGE_KEY);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
        // Fall back to localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            setSettings((prev) => ({ ...prev, ...JSON.parse(stored) }));
          } catch {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [isAuthenticated]);

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      
      // Try to save to backend
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) {
        // If backend fails, still save locally
        throw new Error("Failed to save to backend");
      }

      // Also save locally as backup
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      toast.success("Settings saved");
      
      // Apply compact mode to document
      if (settings.compactMode) {
        document.documentElement.classList.add("compact-mode");
      } else {
        document.documentElement.classList.remove("compact-mode");
      }
    } catch (error) {
      // Save locally if backend fails
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        toast.success("Settings saved locally");
        
        // Apply compact mode to document
        if (settings.compactMode) {
          document.documentElement.classList.add("compact-mode");
        } else {
          document.documentElement.classList.remove("compact-mode");
        }
      } catch {
        toast.error("Failed to save settings");
      }
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="h-12 w-12 rounded-full bg-primary/20 mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading settings…</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-hero">
          <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_1px_1px,oklch(0.7_0.05_270/0.35)_1px,transparent_0)] [background-size:30px_30px]" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <Badge variant="secondary" className="mb-4">Settings</Badge>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Your preferences</h1>
              <p className="mt-3 text-muted-foreground max-w-2xl">Control alerts, privacy hints, and how IntelliFence behaves for you.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="glass" asChild>
                <Link to="/profile"><Shield className="h-4 w-4" /> Profile</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
          <Card className="bg-gradient-card border-border/60">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2"><BellRing className="h-4 w-4" /> Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingRow title="Push alerts" description="Receive live safety alerts in the app." icon={BellRing} checked={settings.pushAlerts} onCheckedChange={(checked) => updateSetting("pushAlerts", checked)} />
              <SettingRow title="Email summary" description="Get a daily digest of activity and incidents." icon={Smartphone} checked={settings.emailSummary} onCheckedChange={(checked) => updateSetting("emailSummary", checked)} />
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/60">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2"><MoonStar className="h-4 w-4" /> Experience</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingRow title="Auto-open map" description="Jump into the location view after sign-in." icon={Smartphone} checked={settings.autoOpenMap} onCheckedChange={(checked) => updateSetting("autoOpenMap", checked)} />
              <SettingRow title="Compact mode" description="Use denser spacing across the interface." icon={MoonStar} checked={settings.compactMode} onCheckedChange={(checked) => updateSetting("compactMode", checked)} />
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/60">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2"><LockKeyhole className="h-4 w-4" /> Account</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{user?.name ?? "Your account"}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <Button asChild variant="outline">
                <Link to="/profile">Edit profile</Link>
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={saveSettings} variant="hero" disabled={saving || loading}>
              <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save settings"}
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function SettingRow({
  title,
  description,
  icon: Icon,
  checked,
  onCheckedChange,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/40 p-4">
      <div className="flex items-start gap-3 min-w-0">
        <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} className="self-start sm:self-auto" />
    </div>
  );
}