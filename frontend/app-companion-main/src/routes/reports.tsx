import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, MapPin, AlertTriangle, CheckCircle, Clock, Filter, RefreshCw, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/context/AppContext";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "My Reports — IntelliFence" },
      { name: "description", content: "View and track all your incident reports." },
    ],
  }),
  component: ReportsPage,
});

interface Report {
  _id: string;
  title: string;
  description: string;
  incidentType: string;
  riskLevel: "low" | "medium" | "high";
  status: "pending" | "approved" | "denied" | "resolved" | "verified_by_users" | "false";
  latitude: number;
  longitude: number;
  createdAt: string;
  updatedAt: string;
}

function ReportsPage() {
  const { isAuthenticated, user } = useApp();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [incidentTypeFilter, setIncidentTypeFilter] = useState<string>("all");

  // Redirect unauthenticated users
  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, navigate]);

  const fetchReports = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (incidentTypeFilter !== "all") params.append("incidentType", incidentTypeFilter);

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/zones/user-reports?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch reports");

      const data = await response.json();
      setReports(data.reports || []);
    } catch (error) {
      toast.error("Failed to load your reports");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, incidentTypeFilter]);

  useEffect(() => {
    if (!isAuthenticated) return;

    setLoading(true);
    fetchReports();
  }, [isAuthenticated, fetchReports]);

  if (!isAuthenticated) {
    return null;
  }

  const stats = useMemo(
    () => ({
      total: reports.length,
      pending: reports.filter((r) => r.status === "pending").length,
      approved: reports.filter((r) => r.status === "approved").length,
      denied: reports.filter((r) => r.status === "denied").length,
      resolved: reports.filter((r) => r.status === "resolved").length,
    }),
    [reports]
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: "secondary",
      approved: "default",
      denied: "destructive",
      resolved: "outline",
    };
    const labels: Record<string, string> = {
      pending: "Pending Review",
      approved: "Approved",
      denied: "Denied",
      resolved: "Resolved",
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getRiskBadge = (risk: string) => {
    const variants: Record<string, any> = {
      low: "secondary",
      medium: "default",
      high: "destructive",
    };
    return <Badge variant={variants[risk] || "secondary"}>{risk}</Badge>;
  };

  const resetFilters = () => {
    setStatusFilter("all");
    setIncidentTypeFilter("all");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-hero">
          <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_1px_1px,oklch(0.7_0.05_270/0.35)_1px,transparent_0)] [background-size:30px_30px]" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <Badge variant="secondary" className="mb-4">Your reports</Badge>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">My incident reports</h1>
              <p className="mt-3 text-muted-foreground max-w-2xl">
                Track the status of your reports and review how each incident was handled.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="glass" asChild>
                <Link to="/location"><MapPin className="h-4 w-4" /> New report</Link>
              </Button>
              <Button variant="hero" onClick={() => {
                setLoading(true);
                fetchReports();
              }}>
                <RefreshCw className="h-4 w-4" /> Refresh
              </Button>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4 mb-8">
            <StatCard title="Total reports" value={String(stats.total)} icon={FileText} />
            <StatCard title="Pending review" value={String(stats.pending)} icon={Clock} />
            <StatCard title="Approved" value={String(stats.approved)} icon={CheckCircle} />
            <StatCard title="Resolved" value={String(stats.resolved)} icon={AlertTriangle} />
          </div>

          <Card className="mb-6 bg-gradient-card border-border/60">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                <Filter className="h-4 w-4" /> Filters
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={resetFilters}>Show all</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="denied">Denied</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={incidentTypeFilter} onValueChange={setIncidentTypeFilter}>
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Incident type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="accident">Accident</SelectItem>
                    <SelectItem value="traffic_jam">Traffic Jam</SelectItem>
                    <SelectItem value="crime">Crime</SelectItem>
                    <SelectItem value="suspicious_activity">Suspicious Activity</SelectItem>
                    <SelectItem value="medical_emergency">Medical Emergency</SelectItem>
                    <SelectItem value="natural_disaster">Natural Disaster</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="py-10 text-center text-muted-foreground">Loading reports...</div>
          ) : reports.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <div className="text-lg font-semibold">No reports match the current filters</div>
              <p className="text-sm text-muted-foreground">Try showing all reports.</p>
              <Button variant="outline" onClick={resetFilters}>Reset filters</Button>
            </div>
          ) : (
            <Card className="bg-gradient-card border-border/60">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" /> Report history
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {reports.map((report) => (
                    <div key={report._id} className="rounded-2xl border border-border/60 bg-background/40 p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            {getStatusBadge(report.status)}
                            {getRiskBadge(report.riskLevel)}
                            <Badge variant="outline">{report.incidentType}</Badge>
                          </div>
                          <h3 className="text-lg font-semibold">{report.title}</h3>
                          <p className="mt-1 text-sm text-muted-foreground max-w-3xl">{report.description}</p>
                        </div>
                        <div className="text-sm text-muted-foreground text-right">
                          <div className="flex items-center gap-2 justify-end"><CalendarDays className="h-4 w-4" /> {new Date(report.createdAt).toLocaleString()}</div>
                          <div className="flex items-center gap-2 justify-end mt-1"><MapPin className="h-4 w-4" /> {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}</div>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2 text-sm">
                        <InfoRow label="Updated at" value={new Date(report.updatedAt).toLocaleString()} />
                        <InfoRow label="Current status" value={report.status} />
                        <InfoRow label="Incident type" value={report.incidentType} />
                        <InfoRow label="Risk level" value={report.riskLevel} />
                    </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

function StatCard({ title, value, icon: Icon }: { title: string; value: string; icon: typeof FileText }) {
  return (
    <Card className="bg-gradient-card border-border/60">
      <CardContent className="p-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="mt-2 text-3xl font-bold">{value}</div>
        </div>
        <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-primary/15 text-primary">
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-background/30 p-3">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium break-words">{value}</div>
    </div>
  );
}
