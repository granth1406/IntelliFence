import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shield, CheckCircle, XCircle, Clock, AlertTriangle, Filter, MoreHorizontal, Users, MapPin } from "lucide-react";
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
    status: "",
    riskLevel: "",
    incidentType: "",
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

      if (filters.status) queryParams.append("status", filters.status);
      if (filters.riskLevel) queryParams.append("riskLevel", filters.riskLevel);
      if (filters.incidentType) queryParams.append("incidentType", filters.incidentType);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-2">Admin Dashboard</p>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Zone Management</h1>
              <p className="mt-2 text-muted-foreground">Monitor and manage all zones and incidents.</p>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Authority Access</span>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalZones}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Approved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.approvedCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Denied
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.deniedCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  Resolved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.resolvedCount}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Bulk Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex gap-2 flex-wrap">
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="denied">Denied</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.riskLevel} onValueChange={(value) => setFilters(prev => ({ ...prev, riskLevel: value }))}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Risks</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.incidentType} onValueChange={(value) => setFilters(prev => ({ ...prev, incidentType: value }))}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Incident Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
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
              <div className="flex gap-2">
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
          </div>

          {/* Zones Table */}
          <Card>
            <CardHeader>
              <CardTitle>Zones & Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
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
        </div>
      </main>
      <Footer />
    </div>
  );
}