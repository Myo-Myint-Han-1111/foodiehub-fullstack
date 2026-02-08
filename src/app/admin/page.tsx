"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Edit, Trash2, Users, AlertTriangle, Check, X, RefreshCw, Clock, BarChart3, TrendingUp, DollarSign, AlertCircle, ShoppingBag, Flame } from "lucide-react";
import RoleGuard from "@/components/RoleGuard";
import { useToast } from "@/components/ui/use-toast";
import { apiFetch } from "@/lib/api-client";
import { useCachedFetch, invalidateCache } from "@/lib/use-cached-fetch";

interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  createdAt: string;
}

interface ActionRequestData {
  id: string;
  type: string;
  orderItemId: string;
  orderId: string;
  reason: string;
  status: string;
  newMenuItemId: string | null;
  createdById: string;
  createdAt: string;
  createdBy: { id: string; name: string; role: string };
  item: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    set: { id: string; setNumber: number; status: string } | null;
  } | null;
  order: {
    id: string;
    orderNumber: number;
    orderType: string;
    tableNumber: string | null;
    status: string;
  } | null;
  newMenuItem: { id: string; name: string; price: number } | null;
}

interface ReportData {
  period: string;
  summary: {
    totalOrders: number;
    paidOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
  };
  statusBreakdown: Record<string, number>;
  paymentBreakdown: Record<string, number>;
  paymentRevenue: Record<string, number>;
  orderTypeBreakdown: Record<string, number>;
  hourlyVolume: { hour: number; label: string; count: number; revenue: number }[];
  waste: {
    count: number;
    total: number;
    items: { name: string; quantity: number; price: number; loss: number }[];
  };
  topItems: { name: string; totalQuantity: number; orderCount: number }[];
  recentLogs: {
    id: string;
    action: string;
    orderNumber: number;
    orderId: string;
    performedBy: string;
    performerRole: string;
    details: Record<string, unknown> | null;
    reason: string | null;
    createdAt: string;
  }[];
}

// ✅ Define staff roles only (customers use QR codes, not login)
const STAFF_ROLES = [
  { value: "KITCHEN", label: "Kitchen Staff" },
  { value: "COUNTER", label: "Counter Staff" },
  { value: "SERVER", label: "Server Staff" },
  { value: "ADMIN", label: "Administrator" },
] as const;

function AdminPageContent() {
  const [activeTab, setActiveTab] = useState<"staff" | "approvals" | "reports">("staff");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { toast } = useToast();

  // Reports state
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [reportPeriod, setReportPeriod] = useState("today");
  const [reportCustomDate, setReportCustomDate] = useState("");
  const [reportLoading, setReportLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    role: "KITCHEN",
  });

  const { data: users, isLoading: loading, refresh: fetchUsers } = useCachedFetch<User[]>(
    "/api/users",
    { maxAge: 15000 }
  );

  const { data: requests, isLoading: requestsLoading, refresh: fetchRequests } = useCachedFetch<ActionRequestData[]>(
    "/api/admin/requests",
    { pollInterval: 10000, maxAge: 5000 }
  );

  const fetchReports = useCallback(async () => {
    setReportLoading(true);
    try {
      let url = `/api/admin/reports?period=${reportPeriod}`;
      if (reportPeriod === "custom" && reportCustomDate) {
        url += `&date=${reportCustomDate}`;
      }
      const response = await apiFetch(url);
      const data = await response.json();
      if (data.success) {
        setReportData(data.data);
      }
    } catch {
      // silent
    } finally {
      setReportLoading(false);
    }
  }, [reportPeriod, reportCustomDate]);

  useEffect(() => {
    if (activeTab === "reports") {
      fetchReports();
    }
  }, [activeTab, fetchReports]);

  async function approveRequest(requestId: string) {
    try {
      const response = await apiFetch(`/api/admin/requests/${requestId}/approve`, { method: "PATCH" });
      const data = await response.json();
      if (data.success) {
        toast({ title: "Request approved!", description: "The request has been approved and applied.", variant: "success" });
        invalidateCache("/api/admin/requests");
        fetchRequests();
      } else {
        toast({ title: "Could not approve", description: data.error || "Something went wrong. Please try again.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Something went wrong", description: "Could not approve the request. Please try again.", variant: "destructive" });
    }
  }

  async function denyRequest(requestId: string) {
    try {
      const response = await apiFetch(`/api/admin/requests/${requestId}/deny`, { method: "PATCH", body: JSON.stringify({}) });
      const data = await response.json();
      if (data.success) {
        toast({ title: "Request denied", description: "The request has been denied.", variant: "success" });
        invalidateCache("/api/admin/requests");
        fetchRequests();
      } else {
        toast({ title: "Could not deny", description: data.error || "Something went wrong. Please try again.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Something went wrong", description: "Could not deny the request. Please try again.", variant: "destructive" });
    }
  }

  function openCreateDialog() {
    setEditingUser(null);
    setFormData({
      email: "",
      password: "",
      name: "",
      phone: "",
      role: "KITCHEN", // ✅ Default to KITCHEN
    });
    setDialogOpen(true);
  }

  function openEditDialog(user: User) {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: "",
      name: user.name,
      phone: user.phone || "",
      role: user.role,
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
      const method = editingUser ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: editingUser ? "User updated!" : "User created!",
          description: editingUser ? "Staff member details have been updated." : "New staff member has been added successfully.",
          variant: "success",
        });
        setDialogOpen(false);
        invalidateCache("/api/users");
        fetchUsers();
      } else {
        toast({
          title: "Could not save",
          description: data.error || "Something went wrong. Please check the details and try again.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Something went wrong",
        description: "Could not save user. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function handleDelete(userId: string) {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "User removed",
          description: "The staff member has been removed.",
          variant: "success",
        });
        invalidateCache("/api/users");
        fetchUsers();
      } else {
        toast({
          title: "Could not remove user",
          description: data.error || "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Something went wrong",
        description: "Could not remove the user. Please try again.",
        variant: "destructive",
      });
    }
  }

  function getRoleBadgeColor(role: string) {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-700";
      case "CUSTOMER":
        return "bg-blue-100 text-blue-700";
      case "KITCHEN":
        return "bg-orange-100 text-orange-700";
      case "COUNTER":
        return "bg-green-100 text-green-700";
      case "SERVER":
        return "bg-cyan-100 text-cyan-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  if (loading) {
    return (
      <div className="container py-10 px-4">
        <div className="text-center">Loading users...</div>
      </div>
    );
  }

  // ✅ Filter out CUSTOMER role from stats (they shouldn't be in user management)
  const staffUsers = (users || []).filter((u) => u.role !== "CUSTOMER");

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg">
        <div className="container px-4 py-4 sm:py-6 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                <Users className="h-6 w-6 sm:h-8 sm:w-8" />
                Admin Dashboard
              </h1>
              <p className="text-purple-100 mt-1 text-sm sm:text-base">
                Staff management, approvals & reports
              </p>
            </div>
            <div className="flex gap-2">
              {activeTab === "staff" && (
                <Button onClick={openCreateDialog} className="bg-white text-purple-600 hover:bg-purple-50">
                  <UserPlus className="h-4 w-4 mr-2" />Add Staff
                </Button>
              )}
              {activeTab === "approvals" && (
                <Button onClick={fetchRequests} variant="secondary" size="icon" className="h-10 w-10">
                  <RefreshCw className="h-5 w-5" />
                </Button>
              )}
              {activeTab === "reports" && (
                <Button onClick={fetchReports} variant="secondary" size="icon" className="h-10 w-10">
                  <RefreshCw className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container px-4 pt-4 max-w-7xl mx-auto">
        <div className="flex gap-2 mb-6">
          <Button onClick={() => setActiveTab("staff")} variant={activeTab === "staff" ? "default" : "outline"} className="flex items-center gap-2">
            <Users className="h-4 w-4" />Staff Management
          </Button>
          <Button onClick={() => setActiveTab("approvals")} variant={activeTab === "approvals" ? "default" : "outline"} className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />Approvals
            {(requests || []).length > 0 && (
              <Badge className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5">{(requests || []).length}</Badge>
            )}
          </Button>
          <Button onClick={() => setActiveTab("reports")} variant={activeTab === "reports" ? "default" : "outline"} className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />Reports
          </Button>
        </div>
      </div>

      <div className="container px-4 py-4 sm:py-6 max-w-7xl mx-auto">
        {/* ==================== Reports Tab ==================== */}
        {activeTab === "reports" && (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Period Selector */}
            <div className="flex gap-2 flex-wrap items-center">
              {[
                { value: "today", label: "Today" },
                { value: "week", label: "This Week" },
                { value: "month", label: "This Month" },
                { value: "all", label: "All Time" },
                { value: "custom", label: "Custom Day" },
              ].map((p) => (
                <Button
                  key={p.value}
                  size="sm"
                  variant={reportPeriod === p.value ? "default" : "outline"}
                  onClick={() => setReportPeriod(p.value)}
                >
                  {p.label}
                </Button>
              ))}
              {reportPeriod === "custom" && (
                <Input
                  type="date"
                  value={reportCustomDate}
                  onChange={(e) => setReportCustomDate(e.target.value)}
                  className="w-auto h-9"
                />
              )}
            </div>

            {reportLoading ? (
              <div className="text-center py-12 text-gray-500">Loading reports...</div>
            ) : !reportData ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  No report data available
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <ShoppingBag className="h-4 w-4 text-blue-500" />
                        <span className="text-xs text-muted-foreground">Total Orders</span>
                      </div>
                      <p className="text-2xl font-bold">{reportData.summary.totalOrders}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <span className="text-xs text-muted-foreground">Revenue</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600">&#3647;{reportData.summary.totalRevenue.toFixed(0)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="h-4 w-4 text-purple-500" />
                        <span className="text-xs text-muted-foreground">Avg Order</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-600">&#3647;{reportData.summary.avgOrderValue.toFixed(0)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Check className="h-4 w-4 text-emerald-500" />
                        <span className="text-xs text-muted-foreground">Paid</span>
                      </div>
                      <p className="text-2xl font-bold">{reportData.summary.paidOrders}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <X className="h-4 w-4 text-red-500" />
                        <span className="text-xs text-muted-foreground">Cancelled</span>
                      </div>
                      <p className="text-2xl font-bold text-red-600">{reportData.summary.cancelledOrders}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Order Status Breakdown */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Order Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(reportData.statusBreakdown).map(([status, count]) => {
                          const total = reportData.summary.totalOrders;
                          const pct = total > 0 ? (count / total) * 100 : 0;
                          const colors: Record<string, string> = {
                            OPEN: "bg-yellow-400",
                            READY_TO_PAY: "bg-blue-400",
                            PAID: "bg-green-400",
                            CLOSED: "bg-gray-400",
                            CANCELLED: "bg-red-400",
                          };
                          return (
                            <div key={status}>
                              <div className="flex justify-between text-sm mb-1">
                                <span>{status}</span>
                                <span className="font-medium">{count} ({pct.toFixed(0)}%)</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${colors[status] || "bg-gray-400"}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                        {Object.keys(reportData.statusBreakdown).length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">No orders</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment Methods */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Payment Methods</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(reportData.paymentBreakdown).map(([method, count]) => (
                          <div key={method} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-sm">{method}</p>
                              <p className="text-xs text-muted-foreground">{count} transaction{count !== 1 ? "s" : ""}</p>
                            </div>
                            <p className="font-bold text-green-600">&#3647;{(reportData.paymentRevenue[method] || 0).toFixed(0)}</p>
                          </div>
                        ))}
                        {Object.keys(reportData.paymentBreakdown).length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">No payments yet</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Items */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Flame className="h-4 w-4 text-orange-500" />Popular Items
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {reportData.topItems.map((item, idx) => (
                          <div key={item.name} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                              <span className={`font-bold text-sm w-6 text-center ${idx < 3 ? "text-orange-500" : "text-gray-400"}`}>
                                {idx + 1}
                              </span>
                              <span className="text-sm">{item.name}</span>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-sm">{item.totalQuantity} sold</p>
                              <p className="text-xs text-muted-foreground">{item.orderCount} orders</p>
                            </div>
                          </div>
                        ))}
                        {reportData.topItems.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">No items sold</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Waste Tracking */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500" />Waste Report
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-4 mb-4">
                        <div className="bg-red-50 rounded-lg p-3 flex-1 text-center">
                          <p className="text-2xl font-bold text-red-600">{reportData.waste.count}</p>
                          <p className="text-xs text-red-500">Wasted Items</p>
                        </div>
                        <div className="bg-red-50 rounded-lg p-3 flex-1 text-center">
                          <p className="text-2xl font-bold text-red-600">&#3647;{reportData.waste.total.toFixed(0)}</p>
                          <p className="text-xs text-red-500">Total Loss</p>
                        </div>
                      </div>
                      {reportData.waste.items.length > 0 ? (
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {reportData.waste.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm p-1.5 hover:bg-gray-50 rounded">
                              <span>{item.quantity}x {item.name}</span>
                              <span className="text-red-500 font-medium">-&#3647;{item.loss.toFixed(0)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-2">No waste recorded</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Hourly Volume (only for today) */}
                {reportData.hourlyVolume.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Hourly Order Volume</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-end gap-1 h-32">
                        {reportData.hourlyVolume.map((h) => {
                          const maxCount = Math.max(...reportData.hourlyVolume.map((v) => v.count), 1);
                          const heightPct = (h.count / maxCount) * 100;
                          return (
                            <div key={h.hour} className="flex-1 flex flex-col items-center gap-1" title={`${h.label} - ${h.count} orders, ฿${h.revenue.toFixed(0)}`}>
                              <div className="w-full flex flex-col justify-end" style={{ height: "100px" }}>
                                <div
                                  className={`w-full rounded-t ${h.count > 0 ? "bg-purple-400" : "bg-gray-100"}`}
                                  style={{ height: `${Math.max(heightPct, 2)}%` }}
                                />
                              </div>
                              {h.hour % 3 === 0 && (
                                <span className="text-[10px] text-muted-foreground">{h.label}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground text-center mt-2">Time (12-hour)</p>
                    </CardContent>
                  </Card>
                )}

                {/* Recent Activity Log */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reportData.recentLogs.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No activity</p>
                    ) : (
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {reportData.recentLogs.slice(0, 20).map((log) => (
                          <div key={log.id} className="flex items-start gap-3 p-2 rounded hover:bg-gray-50 text-sm">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {log.action.replace(/_/g, " ")}
                                <span className="font-normal text-muted-foreground ml-2">Order #{log.orderNumber}</span>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {log.performedBy} ({log.performerRole}) &middot; {new Date(log.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {/* ==================== Approval Queue Tab ==================== */}
        {activeTab === "approvals" && (
          <div className="max-w-4xl mx-auto space-y-4">
            {requestsLoading ? (
              <div className="text-center py-8 text-gray-500">Loading requests...</div>
            ) : (requests || []).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Check className="h-12 w-12 mx-auto text-green-400 mb-3" />
                  <p className="text-lg font-semibold text-gray-700">No pending requests</p>
                  <p className="text-sm text-muted-foreground mt-1">Modification and cancellation requests will appear here</p>
                </CardContent>
              </Card>
            ) : (
              (requests || []).map((req) => (
                <Card key={req.id} className={`border-l-4 ${req.type === "CANCELLATION" ? "border-l-red-400" : "border-l-orange-400"}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {req.type === "CANCELLATION" ? (
                            <Badge className="bg-red-100 text-red-700 border-red-300 border">CANCEL</Badge>
                          ) : (
                            <Badge className="bg-orange-100 text-orange-700 border-orange-300 border">MODIFY</Badge>
                          )}
                          Order #{req.order?.orderNumber}
                          {req.item?.set && <span className="text-sm font-normal text-muted-foreground ml-1">Set {req.item.set.setNumber}</span>}
                        </CardTitle>
                        <div className="flex gap-3 text-sm text-muted-foreground mt-1">
                          {req.order?.tableNumber && <span>Table {req.order.tableNumber}</span>}
                          <span>By: {req.createdBy.name} ({req.createdBy.role})</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(req.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Current item */}
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-sm font-medium mb-1">Item: {req.item?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {req.item?.quantity} &middot; ฿{((req.item?.price || 0) * (req.item?.quantity || 0)).toFixed(0)}
                          {req.item?.set && <span className="ml-2">Set status: <Badge variant="outline" className="text-xs">{req.item.set.status}</Badge></span>}
                        </p>
                      </div>

                      {/* For modification: show replacement */}
                      {req.type === "MODIFICATION" && req.newMenuItem && (
                        <div className="bg-orange-50 rounded p-3">
                          <p className="text-sm font-medium">Replace with: {req.newMenuItem.name}</p>
                          <p className="text-sm text-muted-foreground">฿{req.newMenuItem.price}</p>
                        </div>
                      )}

                      {/* Reason */}
                      <div className="bg-yellow-50 rounded p-3">
                        <p className="text-sm"><span className="font-medium">Reason:</span> {req.reason}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => approveRequest(req.id)}>
                          <Check className="h-4 w-4 mr-1" />Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => denyRequest(req.id)}>
                          <X className="h-4 w-4 mr-1" />Deny
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* ==================== Staff Management Tab ==================== */}
        {activeTab === "staff" && <>
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                Total Staff
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                {staffUsers.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                Kitchen & Counter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-orange-600">
                {
                  staffUsers.filter(
                    (u) => u.role === "KITCHEN" || u.role === "COUNTER"
                  ).length
                }
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                Administrators
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-purple-600">
                {staffUsers.filter((u) => u.role === "ADMIN").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">
              All Staff Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 sm:p-3 font-medium text-sm sm:text-base">
                      Name
                    </th>
                    <th className="text-left p-2 sm:p-3 font-medium text-sm sm:text-base hidden md:table-cell">
                      Email
                    </th>
                    <th className="text-left p-2 sm:p-3 font-medium text-sm sm:text-base hidden lg:table-cell">
                      Phone
                    </th>
                    <th className="text-left p-2 sm:p-3 font-medium text-sm sm:text-base">
                      Role
                    </th>
                    <th className="text-left p-2 sm:p-3 font-medium text-sm sm:text-base hidden xl:table-cell">
                      Created
                    </th>
                    <th className="text-right p-2 sm:p-3 font-medium text-sm sm:text-base">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {staffUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 sm:p-3">
                        <div className="font-medium text-sm sm:text-base">
                          {user.name}
                        </div>
                        <div className="text-xs text-gray-600 md:hidden">
                          {user.email}
                        </div>
                      </td>
                      <td className="p-2 sm:p-3 text-gray-600 text-sm sm:text-base hidden md:table-cell">
                        {user.email}
                      </td>
                      <td className="p-2 sm:p-3 text-gray-600 text-sm sm:text-base hidden lg:table-cell">
                        {user.phone || "—"}
                      </td>
                      <td className="p-2 sm:p-3">
                        <Badge
                          className={`${getRoleBadgeColor(
                            user.role
                          )} text-xs sm:text-sm`}
                        >
                          {user.role}
                        </Badge>
                      </td>
                      <td className="p-2 sm:p-3 text-gray-600 text-xs sm:text-sm hidden xl:table-cell">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-2 sm:p-3">
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(user)}
                            className="h-8 w-8"
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        </>}
      </div>

      {/* Create/Edit Dialog - ✅ CUSTOMER role removed */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {editingUser ? "Edit Staff User" : "Create New Staff User"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">
                  Password {editingUser && "(leave blank to keep current)"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required={!editingUser}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {/* ✅ Only staff roles - customers use QR codes */}
                    {STAFF_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Note: Customers do not need accounts - they use QR codes
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700"
              >
                {editingUser ? "Update User" : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminPage() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <AdminPageContent />
    </RoleGuard>
  );
}
