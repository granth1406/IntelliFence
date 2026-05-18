import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Car,
  CheckCircle,
  CloudRain,
  Crosshair,
  HelpCircle,
  History,
  Map,
  MapPin,
  Navigation,
  Plus,
  Power,
  Route as RouteIcon,
  Shield,
  Siren,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import "leaflet/dist/leaflet.css";
// Leaflet requires `window` and must only be imported on the client.
// We'll dynamically load it inside effects to avoid SSR errors.
const leafletRef = { current: null } as any;
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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

const LAST_KNOWN_LOCATION_KEY = "intellifence:last-known-location";
const LOCATION_HISTORY_KEY = "intellifence:location-history";
const MAX_HISTORY_POINTS = 10;
const MAX_NEARBY_ZONES = 5;

type NearbyZone = {
  zone: any;
  distanceKm: number;
  distanceLabel: string;
};

function haversineDistanceKm(a: Pick<Coords, "lat" | "lng">, b: Pick<Coords, "lat" | "lng">) {
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const deltaLat = toRadians(b.lat - a.lat);
  const deltaLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const halfChord =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(halfChord), Math.sqrt(1 - halfChord));
}

function getZoneCenter(zone: any) {
  if (Number.isFinite(zone?.latitude) && Number.isFinite(zone?.longitude)) {
    return { lat: Number(zone.latitude), lng: Number(zone.longitude) };
  }

  const vertices = Array.isArray(zone?.vertices) ? zone.vertices : [];
  const validPoints = vertices
    .map((point: any) => {
      const lat = Array.isArray(point) ? Number(point[0]) : Number(point?.lat ?? point?.latitude);
      const lng = Array.isArray(point) ? Number(point[1]) : Number(point?.lng ?? point?.longitude);
      return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
    })
    .filter(Boolean) as Array<{ lat: number; lng: number }>;

  if (validPoints.length === 0) {
    return null;
  }

  const sum = validPoints.reduce(
    (acc, point) => ({ lat: acc.lat + point.lat, lng: acc.lng + point.lng }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: sum.lat / validPoints.length,
    lng: sum.lng / validPoints.length,
  };
}

function formatDistance(distanceKm: number) {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }

  return `${distanceKm.toFixed(1)} km`;
}

function LocationPage() {
  const { socket, isAuthenticated } = useApp();
  const [tracking, setTracking] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [lastKnownCoords, setLastKnownCoords] = useState<Coords | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const saved = window.localStorage.getItem(LAST_KNOWN_LOCATION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [tripHistory, setTripHistory] = useState<Coords[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      const saved = window.localStorage.getItem(LOCATION_HISTORY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== "undefined" ? navigator.onLine : true));
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
  const [zonesOnMap, setZonesOnMap] = useState<any[]>([]);
  const [openAccordion, setOpenAccordion] = useState<string | null>("status");

  const handleAccordionActivate = (value: string) => {
    setOpenAccordion((prev) => (prev === value ? prev : value));
  };

  const displayCoords = coords ?? lastKnownCoords;

  const nearbyZones = useMemo<NearbyZone[]>(() => {
    if (!displayCoords) {
      return [];
    }

    return zonesOnMap
      .map((zone) => {
        const center = getZoneCenter(zone);
        if (!center) {
          return null;
        }

        const distanceKm = haversineDistanceKm(displayCoords, center);
        return {
          zone,
          distanceKm,
          distanceLabel: formatDistance(distanceKm),
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, MAX_NEARBY_ZONES) as NearbyZone[];
  }, [displayCoords, zonesOnMap]);

  const safetySnapshot = useMemo(() => {
    if (!displayCoords) {
      return {
        tone: "neutral" as const,
        label: isOnline ? "Waiting for location" : "Offline",
        description: isOnline
          ? "Enable tracking to calculate nearby safety status."
          : "You're offline. Showing the last known location if available.",
      };
    }

    if (nearbyZones.length === 0) {
      return {
        tone: "safe" as const,
        label: "Safe",
        description: "No nearby zones are close enough to raise a caution.",
      };
    }

    const nearestZone = nearbyZones[0];
    const riskLevelValue = String(nearestZone.zone?.riskLevel || "low");
    const isHighRisk = riskLevelValue === "high";

    if (nearestZone.distanceKm <= 0.35 || (isHighRisk && nearestZone.distanceKm <= 0.8)) {
      return {
        tone: "danger" as const,
        label: "High risk",
        description: `${nearestZone.zone?.title || "A zone"} is very close and marked ${riskLevelValue} risk.`,
      };
    }

    if (nearestZone.distanceKm <= 1.25 || riskLevelValue === "medium") {
      return {
        tone: "caution" as const,
        label: "Caution",
        description: `${nearestZone.zone?.title || "A zone"} is nearby. Keep an eye on the map and alerts.`,
      };
    }

    return {
      tone: "safe" as const,
      label: "Safe",
      description: "You are away from the closest monitored zones.",
    };
  }, [displayCoords, nearbyZones, isOnline]);

  const computeHexagon = (lat: number, lng: number, radius: number) => {
    const pts: [number, number][] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const dLat = radius * Math.sin(angle);
      const dLng = radius * Math.cos(angle) / Math.cos((lat * Math.PI) / 180);
      pts.push([lat + dLat, lng + dLng]);
    }
    return pts;
  };

  const riskColor = (risk: string) => {
    if (risk === "high") return "rgba(220,38,38,0.35)";
    if (risk === "medium") return "rgba(234,179,8,0.28)";
    return "rgba(16,185,129,0.22)";
  };

  const escapeHtml = (value: string) =>
    value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!coords) {
      return;
    }

    setLastKnownCoords(coords);
    setTripHistory((previous) => {
      const nextHistory = [...previous, coords].slice(-MAX_HISTORY_POINTS);

      try {
        window.localStorage.setItem(LAST_KNOWN_LOCATION_KEY, JSON.stringify(coords));
        window.localStorage.setItem(LOCATION_HISTORY_KEY, JSON.stringify(nextHistory));
      } catch {
        // Ignore storage issues and keep the page usable.
      }

      return nextHistory;
    });
  }, [coords]);

  useEffect(() => {
    let mounted = true;
    const fetchZones = async () => {
      try {
        const base = import.meta.env.VITE_API_BASE_URL;
        const results: any[] = [];

        if (showApproved) {
          const r = await fetch(`${base}/zones/zones`);
          if (r.ok) {
            const data = await r.json();
            results.push(...data);
          }
        }

        if (showUnapproved) {
          const r2 = await fetch(`${import.meta.env.VITE_API_BASE_URL}/zones/incidents?approved=false`);
          if (r2.ok) {
            const data2 = await r2.json();
            results.push(...data2);
          }
        }

        if (!mounted) return;

        const normalized = results.map((z: any) => {
          if (z.hexagonVertices && z.hexagonVertices.length) {
            return { ...z, vertices: z.hexagonVertices.map((v: any) => [v.latitude, v.longitude]) };
          }
          const radius = z.radius || 0.003;
          return { ...z, vertices: computeHexagon(z.latitude, z.longitude, radius) };
        });

        setZonesOnMap(normalized);
      } catch (err) {
        console.error("Failed to fetch zones for map", err);
      }
    };

    fetchZones();
    return () => {
      mounted = false;
    };
  }, [showApproved, showUnapproved]);

  const mapRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const zonesLayerRef = useRef<any>(null);
  const LRef = useRef<any>(null);

  useEffect(() => {
    if (!displayCoords) return;

    const init = async () => {
      if (!LRef.current) {
        const Leaflet = await import("leaflet");
        LRef.current = Leaflet.default || Leaflet;
      }

      const L = LRef.current;

      if (!mapRef.current) {
        mapRef.current = L.map("map", { center: [displayCoords.lat, displayCoords.lng], zoom: 15, preferCanvas: true });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap",
        }).addTo(mapRef.current);
      } else {
        mapRef.current.setView([displayCoords.lat, displayCoords.lng], 15);
      }

      if (!zonesLayerRef.current) {
        zonesLayerRef.current = L.layerGroup().addTo(mapRef.current);
      } else {
        try {
          zonesLayerRef.current.clearLayers();
        } catch {
          // Ignore layer clear errors.
        }
      }

      zonesOnMap.forEach((zone) => {
        try {
          const verts = (zone.vertices || [])
            .map((v: any) => {
              const lat = typeof v[0] === "string" ? parseFloat(v[0]) : v[0];
              const lng = typeof v[1] === "string" ? parseFloat(v[1]) : v[1];
              return [lat, lng];
            })
            .filter((p: any) => Number.isFinite(p[0]) && Number.isFinite(p[1]));

          if (!verts || verts.length < 3) {
            return;
          }

          const polygon = L.polygon(verts, {
            color: riskColor(zone.riskLevel),
            weight: 1.5,
            fillColor: riskColor(zone.riskLevel),
            fillOpacity: 0.35,
          });
          const incidentTitle = zone.title || zone.name || "Incident zone";
          const incidentDescription = zone.description || "No additional details provided.";
          const incidentTypeLabel = zone.incidentType ? String(zone.incidentType).replaceAll("_", " ") : "incident";

          polygon.bindTooltip(escapeHtml(incidentTitle), {
            sticky: true,
            direction: "top",
            opacity: 0.95,
            className: "zone-tooltip",
            permanent: false,
          });

          const reportedTime = zone.createdAt ? new Date(zone.createdAt).toLocaleString() : "Time not available";

          polygon.bindPopup(`
            <div style="min-width: 220px; max-width: 280px;">
              <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; margin-bottom: 6px;">Incident Info</div>
              <div style="font-size: 16px; font-weight: 700; margin-bottom: 6px;">${escapeHtml(incidentTitle)}</div>
              <div style="font-size: 13px; line-height: 1.5; margin-bottom: 10px; color: #374151;">${escapeHtml(incidentDescription)}</div>
              <div style="display:flex; flex-wrap: wrap; gap: 8px; font-size: 12px; color: #4b5563; margin-bottom: 8px;">
                <span><strong>Type:</strong> ${escapeHtml(incidentTypeLabel)}</span>
                <span><strong>Risk:</strong> ${escapeHtml(String(zone.riskLevel || "medium"))}</span>
                <span><strong>Status:</strong> ${escapeHtml(String(zone.status || "pending"))}</span>
              </div>
              <div style="padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
                <strong>Reported:</strong> ${escapeHtml(reportedTime)}
              </div>
            </div>
          `);

          polygon.on("click", () => {
            polygon.openPopup();
          });

          polygon.on("mouseover", () => {
            polygon.setStyle({ weight: 2.2, fillOpacity: 0.45 });
          });

          polygon.on("mouseout", () => {
            polygon.setStyle({ weight: 1.5, fillOpacity: 0.35 });
          });

          zonesLayerRef.current.addLayer(polygon);
        } catch (err) {
          console.error("Failed to draw zone", err, zone);
        }
      });

      if (userMarkerRef.current) {
        try {
          userMarkerRef.current.setLatLng([displayCoords.lat, displayCoords.lng]);
          if (typeof userMarkerRef.current.bringToFront === "function") userMarkerRef.current.bringToFront();
        } catch (err) {
          console.warn("Failed to update user marker", err);
        }
      } else {
        try {
          const pinHtml = `
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ff7a00" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" fill="#ff7a00"/>
              <circle cx="12" cy="10" r="3" fill="white" />
            </svg>`;
          const icon = L.divIcon({ html: pinHtml, className: "", iconSize: [28, 28], iconAnchor: [14, 28] });
          userMarkerRef.current = L.marker([displayCoords.lat, displayCoords.lng], { icon });
          userMarkerRef.current.addTo(mapRef.current);
          if (typeof userMarkerRef.current.bringToFront === "function") userMarkerRef.current.bringToFront();
        } catch (err) {
          console.error("Failed to add user marker", err);
        }
      }
    };

    init();
  }, [displayCoords, zonesOnMap]);

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

        if (isAuthenticated) {
          try {
            const token = localStorage.getItem("token");
            fetch(`${import.meta.env.VITE_API_BASE_URL}/location/update`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
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
  }, [tracking, isAuthenticated]);

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
          Authorization: `Bearer ${token}`,
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

      toast.success("Incident reported successfully!", {
        description: "Authorities have been notified. The incident will be reviewed soon.",
      });

      setIncidentType("");
      setCustomTitle("");
      setDescription("");
      setRiskLevel("medium");
      setReportDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to report incident");
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
          Authorization: `Bearer ${token}`,
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
    } catch {
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

  const IncidentIcon = currentAlert ? getIncidentIcon(currentAlert.incidentType) : AlertTriangle;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-hero">
      <Navbar />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-hero">
          <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_1px_1px,oklch(0.7_0.05_270/0.35)_1px,transparent_0)] [background-size:30px_30px]" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div>
                <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-2">Live tracking</p>
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Where in the world</h1>
                <p className="mt-3 text-muted-foreground max-w-2xl">Privacy-first location tracking. You're in control.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 glass rounded-xl px-4 py-3 w-full sm:w-auto">
                <div className={`h-2.5 w-2.5 rounded-full ${tracking ? "bg-success animate-pulse" : "bg-muted-foreground"}`} />
                <span className="text-sm font-medium">{tracking ? "Tracking on" : "Idle"}</span>
                <Switch checked={tracking} onCheckedChange={handleToggle} />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-background/95">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6 grid gap-4 lg:grid-cols-2">
              <Card>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Safety snapshot</p>
                    <Badge variant={safetySnapshot.tone === "danger" ? "destructive" : safetySnapshot.tone === "caution" ? "secondary" : "default"}>
                      {safetySnapshot.label}
                    </Badge>
                  </div>
                  <div className="text-lg font-semibold">{safetySnapshot.description}</div>
                </div>
              </Card>

              <Card>
                <div className="flex items-start gap-4 lg:items-center">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Connection mode</p>
                    <p className="mt-1 text-lg font-semibold">{tracking ? (isOnline ? (displayCoords ? "Live + saved" : "Online") : "Offline") : "Offline"}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {displayCoords
                        ? `Showing ${tracking ? "live" : "last known"} location at ${new Date(displayCoords.timestamp).toLocaleTimeString()}.`
                        : "No location stored yet. Enable tracking to start building a local history."}
                    </p>
                  </div>
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${tracking && isOnline ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {tracking && isOnline ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3 lg:min-h-[calc(100vh-24rem)]">
              <div className="lg:col-span-2 relative bg-gradient-card glass rounded-2xl overflow-hidden shadow-elegant aspect-[16/11]">
                {displayCoords ? (
                  <div id="map" className="w-full h-full"></div>
                ) : (
                  <MapPlaceholder tracking={tracking} />
                )}
                {displayCoords && (
                  <div className="absolute top-4 left-4 glass rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm">
                    <Crosshair className="h-4 w-4 text-primary" />
                    <span className="font-mono">
                      {displayCoords.lat.toFixed(5)}, {displayCoords.lng.toFixed(5)}
                    </span>
                    <Badge variant="outline" className="ml-2 text-[10px] uppercase tracking-widest">
                      {tracking ? "Live" : lastKnownCoords ? "Last known" : "Location"}
                    </Badge>
                  </div>
                )}
              </div>

              <div className="space-y-4 lg:sticky lg:top-24 lg:pr-2" onMouseLeave={() => setOpenAccordion("status")}>
                <Accordion
                  type="single"
                  collapsible
                  value={openAccordion ?? undefined}
                  onValueChange={(value) => setOpenAccordion(value || null)}
                  className="space-y-4"
                >
                  <AccordionItem
                    value="status"
                    className="border-0"
                    onMouseEnter={() => setOpenAccordion("status")}
                    onClickCapture={() => handleAccordionActivate("status")}
                  >
                    <Card>
                      <AccordionTrigger className="py-0 hover:no-underline">
                        <div className="flex w-full items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Navigation className="h-4 w-4 text-primary" />
                            <span className="font-semibold">Status</span>
                          </div>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${tracking ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                            {tracking ? "ACTIVE" : "OFF"}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <Stat label="Latitude" value={displayCoords ? displayCoords.lat.toFixed(6) : "—"} />
                        <Stat label="Longitude" value={displayCoords ? displayCoords.lng.toFixed(6) : "—"} />
                        <Stat label="Accuracy" value={displayCoords ? `±${Math.round(displayCoords.accuracy)} m` : "—"} />
                        <Stat label="Updated" value={displayCoords ? new Date(displayCoords.timestamp).toLocaleTimeString() : "—"} />
                      </AccordionContent>
                    </Card>
                  </AccordionItem>

                  <AccordionItem
                    value="nearby"
                    className="border-0"
                    onMouseEnter={() => setOpenAccordion("nearby")}
                    onClickCapture={() => handleAccordionActivate("nearby")}
                  >
                    <Card>
                      <AccordionTrigger className="py-0 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <Map className="h-4 w-4 text-primary" />
                          <span className="font-semibold">Nearby zones</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <div className="space-y-3">
                          {displayCoords ? (
                            nearbyZones.length > 0 ? (
                              nearbyZones.map((zone) => (
                                <div key={zone.zone._id || zone.zone.id || `${zone.zone.title}-${zone.distanceKm}`} className="rounded-xl border border-border/60 bg-background/40 p-3">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="font-medium truncate">{zone.zone.title || zone.zone.name || "Unnamed zone"}</p>
                                      <p className="text-xs text-muted-foreground mt-1">{zone.distanceLabel} away</p>
                                    </div>
                                    <Badge variant={zone.zone.riskLevel === "high" ? "destructive" : zone.zone.riskLevel === "medium" ? "secondary" : "outline"}>
                                      {zone.zone.riskLevel || "low"}
                                    </Badge>
                                  </div>
                                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
                                    <span>{zone.zone.incidentType || "incident"}</span>
                                    <span>{zone.zone.status || "pending"}</span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                                No nearby zones detected yet.
                              </div>
                            )
                          ) : (
                            <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                              Enable tracking or load a last-known location to see nearby zones.
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </Card>
                  </AccordionItem>


                  <AccordionItem
                    value="filters"
                    className="border-0"
                    onMouseEnter={() => setOpenAccordion("filters")}
                    onClickCapture={() => handleAccordionActivate("filters")}
                  >
                    <Card>
                      <AccordionTrigger className="py-0 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="font-semibold">Zone filters</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <div className="flex flex-col gap-3">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="approved-side"
                              checked={showApproved}
                              onChange={(e) => setShowApproved(e.target.checked)}
                              className="rounded h-4 w-4 accent-primary"
                            />
                            <span className="text-sm">Show Approved Zones</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="unapproved-side"
                              checked={showUnapproved}
                              onChange={(e) => setShowUnapproved(e.target.checked)}
                              className="rounded h-4 w-4 accent-primary"
                            />
                            <span className="text-sm">Show Unapproved Incidents</span>
                          </label>
                        </div>
                      </AccordionContent>
                    </Card>
                  </AccordionItem>

                  <AccordionItem
                    value="report"
                    className="border-0"
                    onMouseEnter={() => setOpenAccordion("report")}
                    onClickCapture={() => handleAccordionActivate("report")}
                  >
                    <Card>
                      <AccordionTrigger className="py-0 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <Siren className="h-4 w-4 text-red-500" />
                          <span className="font-semibold">Report incident</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
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
                      </AccordionContent>
                    </Card>
                  </AccordionItem>

                </Accordion>

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

            <Dialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Safety Check
                  </DialogTitle>
                  <DialogDescription>
                    You have entered or are near a reported incident area. Are you okay?
                  </DialogDescription>
                </DialogHeader>

                {currentAlert && (
                  <Alert>
                    <IncidentIcon className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{currentAlert.title}</strong>
                      <br />
                      {currentAlert.description}
                      <br />
                      <Badge variant="outline" className="mt-2">{currentAlert.incidentType}</Badge>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button variant="default" className="flex-1" onClick={() => handleUserResponse("ok")}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    I'm OK
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={() => handleUserResponse("not_ok")}>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Need Help
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </section>
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
        <span className="font-semibold block mb-1">{tracking ? "Locating you..." : "Tracking is off"}</span>
        <span className="text-sm text-muted-foreground">
          {tracking ? "Allow location access in your browser to see the map." : "Enable tracking to see your position on the map."}
        </span>
      </p>
    </div>
  );
}
