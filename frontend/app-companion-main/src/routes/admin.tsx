import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shield, CheckCircle, XCircle, Clock, AlertTriangle, Filter, MoreHorizontal, Users, MapPin, Archive } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — IntelliFence" },
      { name: "description", content: "Manage zones, incidents, and monitor public safety." },
    ],
  }),
  component: AdminDashboard,
});

interface Zone {
  _id: string;
  title: string;
  description: string;
  incidentType: string;
  riskLevel: "low" | "medium" | "high";
  status: "pending" | "approved" | "denied" | "resolved" | "verified_by_users" | "false";
  approved: boolean;
  latitude: number;
  longitude: number;
  createdBy: {
    name: string;
    email: string;
  };
  createdAt: string;
  userResponses?: Array<{
    response: "ok" | "not_ok";
  }>;
}

interface DashboardStats {
  totalZones: number;
  pendingCount: number;
  approvedCount: number;
  deniedCount: number;
  resolvedCount: number;
}

function AdminDashboard() {
  const { user, socket, isAuthenticated } = useApp();
  const [zones, setZones] = useState<Zone[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalZones: 0,
    pendingCount: 0,
    approvedCount: 0,
    deniedCount: 0,
    resolvedCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    status: "all",
    riskLevel: "all",
    incidentType: "all",
    limit: 50,
    offset: 0,
  });

  // Check if user is authority/admin
  useEffect(() => {
    if (!isAuthenticated || user?.role !== "authority") {
      toast.error("Access denied. Authority access required.");
      return;
    }
    fetchDashboard();
  }, [isAuthenticated, user, filters]);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleZoneUpdate = (updatedZone: Zone) => {
      setZones(prev => prev.map(z => z._id === updatedZone._id ? updatedZone : z));
      fetchDashboard(); // Refresh stats
    };

    const handleAdminNotification = (data: any) => {
      toast.info(`Zone ${data.zoneId}: ${data.okCount} OK, ${data.notOkCount} Not OK responses`);
    };

    socket.on("zone-approved", handleZoneUpdate);
    socket.on("zone-denied", handleZoneUpdate);
    socket.on("zone-resolved", handleZoneUpdate);
    socket.on("admin-notification", handleAdminNotification);

    return () => {
      socket.off("zone-approved", handleZoneUpdate);
      socket.off("zone-denied", handleZoneUpdate);
      socket.off("zone-resolved", handleZoneUpdate);
      socket.off("admin-notification", handleAdminNotification);
    };
  }, [socket]);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams();

      if (filters.status !== "all") queryParams.append("status", filters.status);
      if (filters.riskLevel !== "all") queryParams.append("riskLevel", filters.riskLevel);
      if (filters.incidentType !== "all") queryParams.append("incidentType", filters.incidentType);
      queryParams.append("limit", filters.limit.toString());
      queryParams.append("offset", filters.offset.toString());

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/zones/admin-dashboard?${queryParams}`,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch dashboard data");

      const data = await response.json();
      setZones(data.zones);
      setStats(data.stats);
    } catch (error) {
      toast.error("Failed to load dashboard data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action: "approve" | "deny" | "resolve") => {
    if (selectedZones.length === 0) {
      toast.error("Please select zones first");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/zones/bulk-${action}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ zoneIds: selectedZones }),
        }
      );

      if (!response.ok) throw new Error(`Failed to ${action} zones`);

      const data = await response.json();
      toast.success(`${data.message}`);
      setSelectedZones([]);
      fetchDashboard();
    } catch (error) {
      toast.error(`Failed to ${action} zones`);
      console.error(error);
    }
  };

  const handleSingleAction = async (zoneId: string, action: "approve" | "reject" | "resolve") => {
    try {
      const token = localStorage.getItem("token");
      const endpoint = action === "resolve" ? "resolve" : action;
      const method = action === "resolve" ? "PATCH" : "PATCH";

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/zones/${zoneId}/${endpoint}`,
        {
          method,
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error(`Failed to ${action} zone`);

      toast.success(`Zone ${action}d successfully`);
      fetchDashboard();
    } catch (error) {
      toast.error(`Failed to ${action} zone`);
      console.error(error);
    }
  };

  const getStatusBadge = (status: string, approved: boolean) => {
    const variants = {
      pending: "secondary",
      approved: "default",
      denied: "destructive",
      resolved: "outline",
      verified_by_users: "default",
      false: "destructive",
    } as const;

    const labels = {
      pending: approved ? "Unapproved" : "Pending",
      approved: "Approved",
      denied: "Denied",
      resolved: "Resolved",
      verified_by_users: "Verified",
      false: "False",
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getRiskBadge = (risk: string) => {
    const variants = {
      low: "secondary",
      medium: "default",
      high: "destructive",
    } as const;

    return <Badge variant={variants[risk as keyof typeof variants] || "secondary"}>{risk}</Badge>;
  };

  const resetFilters = () => {
    setFilters({
      status: "all",
      riskLevel: "all",
      incidentType: "all",
      limit: 50,
      offset: 0,
    });
  };

  if (!isAuthenticated || user?.role !== "authority") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md glass rounded-2xl p-10">
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground mt-2 mb-6">Authority access required for this dashboard.</p>
            <Button variant="hero" asChild>
              <a href="/">Go Home</a>
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
              <Badge variant="secondary" className="mb-4">Admin dashboard</Badge>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Zone Management</h1>
              <p className="mt-3 text-muted-foreground max-w-2xl">Monitor and manage all zones and incidents in real time.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="glass" asChild>
                <Link to="/cases"><Archive className="h-4 w-4" /> Cases</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-5 mb-8">
            <StatCard title="Total zones" value={String(stats.totalZones)} icon={AlertTriangle} />
            <StatCard title="Pending" value={String(stats.pendingCount)} icon={Clock} />
            <StatCard title="Approved" value={String(stats.approvedCount)} icon={CheckCircle} />
            <StatCard title="Denied" value={String(stats.deniedCount)} icon={XCircle} />
            <StatCard title="Resolved" value={String(stats.resolvedCount)} icon={Shield} />
          </div>

          {/* Filters and Bulk Actions */}
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
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="denied">Denied</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.riskLevel} onValueChange={(value) => setFilters(prev => ({ ...prev, riskLevel: value }))}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Risk Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risks</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.incidentType} onValueChange={(value) => setFilters(prev => ({ ...prev, incidentType: value }))}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Incident Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
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

              {selectedZones.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-2">
                  <Button variant="default" size="sm" onClick={() => handleBulkAction("approve")}>
                    Approve ({selectedZones.length})
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleBulkAction("deny")}>
                    Deny ({selectedZones.length})
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleBulkAction("resolve")}>
                    Resolve ({selectedZones.length})
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Zones Table */}
          <Card className="bg-gradient-card border-border/60">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Users className="h-4 w-4" /> Zones & Incidents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : zones.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <div className="text-lg font-semibold">No records match the current filters</div>
                  <p className="text-sm text-muted-foreground">Try clearing filters to show all incidents and zones.</p>
                  <Button variant="outline" onClick={resetFilters}>Show all records</Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedZones.length === zones.length && zones.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedZones(zones.map(z => z._id));
                            } else {
                              setSelectedZones([]);
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {zones.map((zone) => (
                      <TableRow key={zone._id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedZones.includes(zone._id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedZones(prev => [...prev, zone._id]);
                              } else {
                                setSelectedZones(prev => prev.filter(id => id !== zone._id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{zone.title}</div>
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {zone.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{zone.incidentType}</Badge>
                        </TableCell>
                        <TableCell>{getRiskBadge(zone.riskLevel)}</TableCell>
                        <TableCell>{getStatusBadge(zone.status, zone.approved)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{zone.createdBy.name}</div>
                            <div className="text-muted-foreground">{zone.createdBy.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(zone.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {zone.status === "pending" && (
                                <>
                                  <DropdownMenuItem onClick={() => handleSingleAction(zone._id, "approve")}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleSingleAction(zone._id, "reject")}>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Deny
                                  </DropdownMenuItem>
                                </>
                              )}
                              {zone.status !== "resolved" && (
                                <DropdownMenuItem onClick={() => handleSingleAction(zone._id, "resolve")}>
                                  <Shield className="h-4 w-4 mr-2" />
                                  Resolve
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function StatCard({ title, value, icon: Icon }: { title: string; value: string; icon: typeof AlertTriangle }) {
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
