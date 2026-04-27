import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, Power, Crosshair, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useApp } from "@/context/AppContext";

export const Route = createFileRoute("/location")({
  head: () => ({
    meta: [
      { title: "Location tracking — IntelliFence" },
      { name: "description", content: "Realtime location tracking with privacy-first controls." },
    ],
  }),
  component: LocationPage,
});

interface Coords {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

function LocationPage() {
  const { socket, isAuthenticated } = useApp();
  const [tracking, setTracking] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleZoneEntered = (data: any) => {
      toast.warning(`Entered restricted zone: ${data.zoneName}`, {
        description: `Risk level: ${data.riskLevel}`,
      });
    };

    const handleNearZoneAlert = (data: any) => {
      toast.warning("Approaching restricted zone", {
        description: data.message,
      });
    };

    socket.on("zone-entered", handleZoneEntered);
    socket.on("near-zone-alert", handleNearZoneAlert);

    return () => {
      socket.off("zone-entered", handleZoneEntered);
      socket.off("near-zone-alert", handleNearZoneAlert);
    };
  }, [socket]);

  // Use the browser geolocation API; no third-party map key required
  useEffect(() => {
    if (!tracking) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported in this browser.");
      setTracking(false);
      return;
    }
    setError(null);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        };
        setCoords(newCoords);

        // Send location update to backend if authenticated
        if (isAuthenticated) {
          try {
            const token = localStorage.getItem("token");
            fetch(`${import.meta.env.VITE_API_BASE_URL}/location/update`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
              },
              body: JSON.stringify({
                latitude: newCoords.lat,
                longitude: newCoords.lng,
              }),
            }).catch((err) => {
              console.error("Failed to send location update:", err);
            });
          } catch (err) {
            console.error("Error sending location update:", err);
          }
        }
      },
      (err) => {
        setError(err.message);
        setTracking(false);
        toast.error("Could not access your location");
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [tracking, socket, isAuthenticated]);

  const handleToggle = (next: boolean) => {
    if (!isAuthenticated) {
      toast.error("Please log in to enable location tracking");
      return;
    }
    setTracking(next);
    toast(next ? "Tracking enabled" : "Tracking stopped", {
      description: next ? "Your location updates in realtime." : "We've stopped reading your location.",
    });
  };

  // Free, key-less map embed via OpenStreetMap
  const mapSrc = coords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng - 0.01}%2C${coords.lat - 0.01}%2C${coords.lng + 0.01}%2C${coords.lat + 0.01}&layer=mapnik&marker=${coords.lat}%2C${coords.lng}`
    : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-2">Live tracking</p>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Where in the world</h1>
              <p className="mt-2 text-muted-foreground">Privacy-first location tracking. You're in control.</p>
            </div>
            <div className="flex items-center gap-3 glass rounded-xl px-4 py-3">
              <div className={`h-2.5 w-2.5 rounded-full ${tracking ? "bg-success animate-pulse" : "bg-muted-foreground"}`} />
              <span className="text-sm font-medium">{tracking ? "Tracking on" : "Idle"}</span>
              <Switch checked={tracking} onCheckedChange={handleToggle} />
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Map */}
            <div className="lg:col-span-2 relative bg-gradient-card glass rounded-2xl overflow-hidden shadow-elegant aspect-[16/11]">
              {mapSrc ? (
                <iframe
                  title="Your location"
                  src={mapSrc}
                  className="w-full h-full border-0"
                  loading="lazy"
                />
              ) : (
                <MapPlaceholder tracking={tracking} />
              )}
              {coords && (
                <div className="absolute top-4 left-4 glass rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm">
                  <Crosshair className="h-4 w-4 text-primary" />
                  <span className="font-mono">
                    {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                  </span>
                </div>
              )}
            </div>

            {/* Side panel */}
            <div className="space-y-4">
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2"><Navigation className="h-4 w-4 text-primary" /> Status</h3>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${tracking ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                    {tracking ? "ACTIVE" : "OFF"}
                  </span>
                </div>
                <Stat label="Latitude" value={coords ? coords.lat.toFixed(6) : "—"} />
                <Stat label="Longitude" value={coords ? coords.lng.toFixed(6) : "—"} />
                <Stat label="Accuracy" value={coords ? `±${Math.round(coords.accuracy)} m` : "—"} />
                <Stat label="Updated" value={coords ? new Date(coords.timestamp).toLocaleTimeString() : "—"} />
              </Card>

              <Card>
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Power className="h-4 w-4 text-accent" /> Controls</h3>
                <p className="text-sm text-muted-foreground mb-4">Toggle tracking at any time. Coordinates never leave your device in this demo.</p>
                <Button
                  variant={tracking ? "outline" : "hero"}
                  className="w-full"
                  onClick={() => handleToggle(!tracking)}
                >
                  {tracking ? "Stop tracking" : "Enable tracking"}
                </Button>
              </Card>

              {error && (
                <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-destructive">Couldn't fetch location</p>
                    <p className="text-destructive/80 text-xs mt-1">{error}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-gradient-card glass rounded-2xl p-5 shadow-card">{children}</div>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className="text-sm font-mono font-medium">{value}</span>
    </div>
  );
}

function MapPlaceholder({ tracking }: { tracking: boolean }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-hero">
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(oklch(0.7_0.05_270/0.15)_1px,transparent_1px),linear-gradient(90deg,oklch(0.7_0.05_270/0.15)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="relative">
        <div className={`h-20 w-20 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow ${tracking ? "animate-pulse-glow" : ""}`}>
          <MapPin className="h-9 w-9 text-primary-foreground" />
        </div>
      </div>
      <p className="relative mt-6 text-center max-w-xs px-4">
        <span className="font-semibold block mb-1">{tracking ? "Locating you…" : "Tracking is off"}</span>
        <span className="text-sm text-muted-foreground">
          {tracking ? "Allow location access in your browser to see the map." : "Enable tracking to see your position on the map."}
        </span>
      </p>
    </div>
  );
}
