import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Archive, Clock, Filter, Shield, RefreshCw, CalendarDays, MapPin, BadgeAlert } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

export const Route = createFileRoute("/cases")({
  head: () => ({
    meta: [
      { title: "Cases — IntelliFence" },
      { name: "description", content: "Archived resolved and denied cases in IntelliFence." },
    ],
  }),
  component: CasesPage,
});

type CaseRecord = {
  _id: string;
  originalZoneId: string;
  caseStatus: "resolved" | "denied";
  handledAt: string;
  createdAt: string;
  handledBy: {
    name: string;
    email: string;
    role: string;
  };
  zoneSnapshot: {
    title?: string;
    description?: string;
    incidentType?: string;
    riskLevel?: string;
    latitude?: number;
    longitude?: number;
    status?: string;
    approved?: boolean;
    createdAt?: string;
    updatedAt?: string;
  };
};

function CasesPage() {
  const { user, isAuthenticated } = useApp();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<CaseRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    caseStatus: "all",
    limit: 50,
    offset: 0,
  });

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "authority") {
      return;
    }
    fetchCases();
  }, [isAuthenticated, user, filters]);

  const fetchCases = async () => {
    try {
      const token = localStorage.getItem("token");
      const query = new URLSearchParams();

      if (filters.caseStatus !== "all") query.append("caseStatus", filters.caseStatus);
      query.append("limit", String(filters.limit));
      query.append("offset", String(filters.offset));

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/zones/cases?${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to load cases");

      const data = await response.json();
      setRecords(data.cases || []);
      setTotal(data.total || 0);
    } catch (error) {
      toast.error("Failed to load cases");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({ caseStatus: "all", limit: 50, offset: 0 });
  };

  if (!isAuthenticated || user?.role !== "authority") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md glass rounded-3xl p-10 text-center">
            <Shield className="h-10 w-10 mx-auto text-primary" />
            <h1 className="mt-4 text-2xl font-bold">Authority access required</h1>
            <p className="mt-2 text-muted-foreground">Sign in with an authority account to view archived cases.</p>
            <Button asChild variant="hero" className="mt-6">
              <Link to="/login">Sign in</Link>
            </Button>
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
              <Badge variant="secondary" className="mb-4">Case archive</Badge>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Resolved & denied cases</h1>
              <p className="mt-3 text-muted-foreground max-w-2xl">
                Every resolved or denied incident is removed from live zones and archived here as a case record.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="glass" asChild>
                <Link to="/admin"><BadgeAlert className="h-4 w-4" /> Back to admin</Link>
              </Button>
              <Button variant="hero" onClick={fetchCases}>
                <RefreshCw className="h-4 w-4" /> Refresh
              </Button>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <StatCard title="Archived cases" value={String(total)} icon={Archive} />
            <StatCard title="Resolved cases" value={String(records.filter((r) => r.caseStatus === "resolved").length)} icon={Shield} />
            <StatCard title="Denied cases" value={String(records.filter((r) => r.caseStatus === "denied").length)} icon={BadgeAlert} />
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
                <Select value={filters.caseStatus} onValueChange={(value) => setFilters((prev) => ({ ...prev, caseStatus: value }))}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Case status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All cases</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="denied">Denied</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/60">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Clock className="h-4 w-4" /> Archived case records
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-10 text-center text-muted-foreground">Loading cases...</div>
              ) : records.length === 0 ? (
                <div className="py-10 text-center space-y-3">
                  <div className="text-lg font-semibold">No cases match the current filters</div>
                  <p className="text-sm text-muted-foreground">Try showing all cases.</p>
                  <Button variant="outline" onClick={resetFilters}>Reset filters</Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {records.map((record) => (
                    <div key={record._id} className="rounded-2xl border border-border/60 bg-background/40 p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge variant={record.caseStatus === "resolved" ? "default" : "destructive"}>
                              {record.caseStatus}
                            </Badge>
                            <Badge variant="outline">{record.zoneSnapshot.incidentType || "incident"}</Badge>
                            <Badge variant="secondary">{record.zoneSnapshot.riskLevel || "medium"}</Badge>
                          </div>
                          <h3 className="text-lg font-semibold">{record.zoneSnapshot.title || "Untitled case"}</h3>
                          <p className="mt-1 text-sm text-muted-foreground max-w-3xl">{record.zoneSnapshot.description || "No description available."}</p>
                        </div>
                        <div className="text-sm text-muted-foreground text-right">
                          <div className="flex items-center gap-2 justify-end"><CalendarDays className="h-4 w-4" /> {new Date(record.handledAt).toLocaleString()}</div>
                          <div className="flex items-center gap-2 justify-end mt-1"><MapPin className="h-4 w-4" /> {record.zoneSnapshot.latitude ?? "—"}, {record.zoneSnapshot.longitude ?? "—"}</div>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2 text-sm">
                        <InfoRow label="Handled by" value={`${record.handledBy.name} (${record.handledBy.email})`} />
                        <InfoRow label="Original zone ID" value={record.originalZoneId} />
                        <InfoRow label="Current status" value={record.zoneSnapshot.status || record.caseStatus} />
                        <InfoRow label="Archived at" value={new Date(record.createdAt).toLocaleString()} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function StatCard({ title, value, icon: Icon }: { title: string; value: string; icon: typeof Archive }) {
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
