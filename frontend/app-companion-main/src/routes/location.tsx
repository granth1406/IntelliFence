import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, Power, Crosshair, AlertTriangle, Plus, Siren, Car, Users, Shield, Zap, CloudRain, HelpCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useApp } from "@/context/AppContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const { socket, isAuthenticated, user } = useApp();
  const [tracking, setTracking] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Incident reporting state
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [incidentType, setIncidentType] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [description, setDescription] = useState("");
  const [riskLevel, setRiskLevel] = useState("medium");
  const [reporting, setReporting] = useState(false);

  // User alerts state
  const [currentAlert, setCurrentAlert] = useState<{
    zoneId: string;
    title: string;
    description: string;
    incidentType: string;
  } | null>(null);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);

  // Zone filters
  const [showApproved, setShowApproved] = useState(true);
  const [showUnapproved, setShowUnapproved] = useState(true);

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

    const handleUnapprovedZoneAlert = (data: any) => {
      toast.warning("Unapproved Incident Alert", {
        description: `${data.title} - ${data.incidentType}`,
        duration: 10000,
      });
    };

    const handleUserResponseRequest = (data: any) => {
      setCurrentAlert({
        zoneId: data.zoneId,
        title: data.title,
        description: data.description,
        incidentType: data.incidentType,
      });
      setAlertDialogOpen(true);
    };

    socket.on("zone-entered", handleZoneEntered);
    socket.on("near-zone-alert", handleNearZoneAlert);
    socket.on("unapproved-zone-alert", handleUnapprovedZoneAlert);
    socket.on("user-response-request", handleUserResponseRequest);

    return () => {
      socket.off("zone-entered", handleZoneEntered);
      socket.off("near-zone-alert", handleNearZoneAlert);
      socket.off("unapproved-zone-alert", handleUnapprovedZoneAlert);
      socket.off("user-response-request", handleUserResponseRequest);
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

  const handleReportIncident = async () => {
    if (!coords) {
      toast.error("Location not available. Please enable tracking first.");
      return;
    }

    if (!incidentType) {
      toast.error("Please select an incident type");
      return;
    }

    setReporting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/zones/report-incident`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          incidentType,
          title: customTitle || getIncidentTitle(incidentType),
          description: description || getIncidentDescription(incidentType),
          latitude: coords.lat,
          longitude: coords.lng,
          riskLevel,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to report incident");
      }

      const data = await response.json();
      toast.success("Incident reported successfully!", {
        description: "Authorities have been notified. The incident will be reviewed soon.",
      });

      // Reset form
      setIncidentType("");
      setCustomTitle("");
      setDescription("");
      setRiskLevel("medium");
      setReportDialogOpen(false);

    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to report incident");
    } finally {
      setReporting(false);
    }
  };

  const handleUserResponse = async (response: "ok" | "not_ok") => {
    if (!currentAlert) return;

    try {
      const token = localStorage.getItem("token");
      const apiResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/zones/${currentAlert.zoneId}/user-response`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ response }),
      });

      if (!apiResponse.ok) {
        throw new Error("Failed to submit response");
      }

      const data = await apiResponse.json();
      toast.success("Response recorded", {
        description: `Thank you for your feedback. ${data.okCount} OK, ${data.notOkCount} Not OK responses so far.`,
      });

      setAlertDialogOpen(false);
      setCurrentAlert(null);

    } catch (error) {
      toast.error("Failed to submit response");
    }
  };

  const getIncidentTitle = (type: string) => {
    const titles = {
      accident: "Traffic Accident Reported",
      traffic_jam: "Traffic Jam Reported",
      crime: "Crime Reported",
      suspicious_activity: "Suspicious Activity Reported",
      medical_emergency: "Medical Emergency Reported",
      natural_disaster: "Natural Disaster Reported",
      other: "Incident Reported",
    };
    return titles[type as keyof typeof titles] || "Incident Reported";
  };

  const getIncidentDescription = (type: string) => {
    const descriptions = {
      accident: "A traffic accident has been reported in this area.",
      traffic_jam: "Heavy traffic congestion reported.",
      crime: "Criminal activity reported in this area.",
      suspicious_activity: "Suspicious activity observed.",
      medical_emergency: "Medical emergency requiring immediate attention.",
      natural_disaster: "Natural disaster affecting this area.",
      other: "An incident has been reported in this area.",
    };
    return descriptions[type as keyof typeof descriptions] || "An incident has been reported.";
  };

  const getIncidentIcon = (type: string) => {
    const icons = {
      accident: Car,
      traffic_jam: Car,
      crime: Shield,
      suspicious_activity: HelpCircle,
      medical_emergency: Zap,
      natural_disaster: CloudRain,
      other: AlertTriangle,
    };
    return icons[type as keyof typeof icons] || AlertTriangle;
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

              {/* Zone Filters */}
              <div className="absolute top-4 right-4 glass rounded-xl px-4 py-2.5 flex items-center gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="approved"
                    checked={showApproved}
                    onChange={(e) => setShowApproved(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="approved" className="text-xs">Approved</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="unapproved"
                    checked={showUnapproved}
                    onChange={(e) => setShowUnapproved(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="unapproved" className="text-xs">Unapproved</Label>
                </div>
              </div>
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

              {/* Incident Reporting */}
              <Card>
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Siren className="h-4 w-4 text-red-500" /> Report Incident</h3>
                <p className="text-sm text-muted-foreground mb-4">Report emergencies or incidents in your area.</p>
                <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="w-full" disabled={!tracking || !coords}>
                      <Plus className="h-4 w-4 mr-2" />
                      Report Incident
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Report an Incident</DialogTitle>
                      <DialogDescription>
                        Help keep your community safe by reporting incidents. Quick options available below.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="incident-type">Incident Type</Label>
                        <Select value={incidentType} onValueChange={setIncidentType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select incident type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="accident">
                              <div className="flex items-center gap-2">
                                <Car className="h-4 w-4" />
                                Accident
                              </div>
                            </SelectItem>
                            <SelectItem value="traffic_jam">
                              <div className="flex items-center gap-2">
                                <Car className="h-4 w-4" />
                                Traffic Jam
                              </div>
                            </SelectItem>
                            <SelectItem value="crime">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Crime
                              </div>
                            </SelectItem>
                            <SelectItem value="suspicious_activity">
                              <div className="flex items-center gap-2">
                                <HelpCircle className="h-4 w-4" />
                                Suspicious Activity
                              </div>
                            </SelectItem>
                            <SelectItem value="medical_emergency">
                              <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4" />
                                Medical Emergency
                              </div>
                            </SelectItem>
                            <SelectItem value="natural_disaster">
                              <div className="flex items-center gap-2">
                                <CloudRain className="h-4 w-4" />
                                Natural Disaster
                              </div>
                            </SelectItem>
                            <SelectItem value="other">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                Other
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {incidentType === "other" && (
                        <div>
                          <Label htmlFor="custom-title">Title</Label>
                          <Input
                            id="custom-title"
                            value={customTitle}
                            onChange={(e) => setCustomTitle(e.target.value)}
                            placeholder="Brief title for the incident"
                          />
                        </div>
                      )}

                      <div>
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                          id="description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Additional details about the incident"
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label htmlFor="risk-level">Risk Level</Label>
                        <Select value={riskLevel} onValueChange={setRiskLevel}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low Risk</SelectItem>
                            <SelectItem value="medium">Medium Risk</SelectItem>
                            <SelectItem value="high">High Risk</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setReportDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          className="flex-1"
                          onClick={handleReportIncident}
                          disabled={reporting || !incidentType}
                        >
                          {reporting ? "Reporting..." : "Report"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
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

          {/* User Alert Dialog */}
          <Dialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Safety Check
                </DialogTitle>
                <DialogDescription>
                  You've entered or are near a reported incident area. Are you okay?
                </DialogDescription>
              </DialogHeader>

              {currentAlert && (
                <Alert>
                  <getIncidentIcon className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{currentAlert.title}</strong><br />
                    {currentAlert.description}<br />
                    <Badge variant="outline" className="mt-2">{currentAlert.incidentType}</Badge>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={() => handleUserResponse("ok")}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  I'm OK
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleUserResponse("not_ok")}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Need Help
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
