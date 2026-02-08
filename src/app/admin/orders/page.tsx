"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  RefreshCw,
  Search,
  Download,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import RoleGuard from "@/components/RoleGuard";
import { apiFetch } from "@/lib/api-client";

interface OrderItemData {
  id: string;
  name: string;
  quantity: number;
  price: number;
  itemStatus: string;
  cancelReason: string | null;
}

interface OrderSetData {
  id: string;
  setNumber: number;
  status: string;
  sentAt: string | null;
  readyAt: string | null;
  servedAt: string | null;
  items: OrderItemData[];
}

interface OrderData {
  id: string;
  orderNumber: number;
  orderType: string;
  tableNumber: string | null;
  items: OrderItemData[];
  sets: OrderSetData[];
  total: number;
  subtotal: number;
  tax: number;
  status: string;
  paid: boolean;
  paymentMethod: string | null;
  paidAt: string | null;
  createdById: string | null;
  createdAt: string;
  createdBy: { id: string; name: string } | null;
}

interface LogEntry {
  id: string;
  action: string;
  details: Record<string, unknown> | null;
  reason: string | null;
  performedBy: { id: string; name: string; role: string };
  approvedBy: { id: string; name: string; role: string } | null;
  createdAt: string;
}

function AdminOrdersContent() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [timeFilter, setTimeFilter] = useState("24h");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Logs dialog
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const [logsOrderNumber, setLogsOrderNumber] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const { toast } = useToast();

  const fetchOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams();

      if (timeFilter === "today") {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        params.append("startDate", start.toISOString());
        params.append("endDate", new Date().toISOString());
      } else if (timeFilter !== "all") {
        params.append("timeFilter", timeFilter);
      }

      const response = await apiFetch(`/api/orders?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setOrders(data.data);
      }
    } catch {
      toast({
        title: "Connection issue",
        description: "Could not load orders. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [timeFilter, toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Filter orders
  useEffect(() => {
    let filtered = [...orders];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.orderNumber.toString().includes(q) ||
          order.tableNumber?.toLowerCase().includes(q) ||
          order.items.some((item) => item.name.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  }, [searchQuery, statusFilter, orders]);

  async function fetchLogs(orderId: string, orderNumber: number) {
    setLogsOrderNumber(orderNumber);
    setLogsDialogOpen(true);
    setLogsLoading(true);
    setLogs([]);

    try {
      const response = await apiFetch(`/api/admin/orders/${orderId}/logs`);
      const data = await response.json();
      if (data.success) {
        setLogs(data.data.logs);
      }
    } catch {
      toast({
        title: "Connection issue",
        description: "Could not load order logs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLogsLoading(false);
    }
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      OPEN: "bg-yellow-100 text-yellow-700",
      READY_TO_PAY: "bg-blue-100 text-blue-700",
      PAID: "bg-green-100 text-green-700",
      CLOSED: "bg-gray-100 text-gray-700",
      CANCELLED: "bg-red-100 text-red-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  }

  function getSetStatusColor(status: string) {
    const colors: Record<string, string> = {
      DRAFT: "bg-gray-100 text-gray-600",
      PENDING: "bg-yellow-100 text-yellow-700",
      PREPARING: "bg-orange-100 text-orange-700",
      READY: "bg-green-100 text-green-700",
      SERVED: "bg-blue-100 text-blue-700",
      CANCELLED: "bg-red-100 text-red-700",
      WASTED: "bg-red-100 text-red-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  }

  function getItemStatusColor(status: string) {
    const colors: Record<string, string> = {
      ACTIVE: "",
      CHANGED: "text-orange-500 line-through",
      CANCELLED: "text-red-400 line-through",
      WASTED: "text-red-500 line-through",
    };
    return colors[status] || "";
  }

  function getActionLabel(action: string) {
    const labels: Record<string, string> = {
      ORDER_CREATED: "Order Created",
      SET_SENT_TO_KITCHEN: "Set Sent to Kitchen",
      QR_ORDER_APPROVED: "QR Order Approved",
      QR_ORDER_REJECTED: "QR Order Rejected",
      SET_STATUS_UPDATED: "Set Status Updated",
      SET_ITEMS_MODIFIED_DRAFT: "Set Items Modified (Draft)",
      SET_ITEMS_MODIFIED_PENDING: "Set Items Modified (Pending)",
      SET_CANCELLED: "Set Cancelled",
      ORDER_CANCELLED: "Order Cancelled",
      ITEM_CANCELLED: "Item Cancelled",
      ITEM_CANCELLATION_APPROVED: "Item Cancellation Approved",
      ITEM_MODIFICATION_APPROVED: "Item Modification Approved",
      ORDER_PAID: "Order Paid",
      ORDER_MARKED_READY_TO_PAY: "Marked Ready to Pay",
    };
    return labels[action] || action;
  }

  function exportToCSV() {
    const headers = [
      "Order #",
      "Date",
      "Type",
      "Table",
      "Sets",
      "Items",
      "Total",
      "Status",
      "Paid",
      "Payment Method",
      "Created By",
    ];
    const rows = filteredOrders.map((order) => [
      order.orderNumber,
      new Date(order.createdAt).toLocaleString(),
      order.orderType,
      order.tableNumber || "N/A",
      order.sets.length,
      order.sets
        .flatMap((s) => s.items)
        .filter((i) => i.itemStatus === "ACTIVE")
        .map((i) => `${i.quantity}x ${i.name}`)
        .join("; "),
      order.total.toFixed(2),
      order.status,
      order.paid ? "Yes" : "No",
      order.paymentMethod || "N/A",
      order.createdBy?.name || "QR Customer",
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "Export complete!", description: "Orders have been exported to CSV.", variant: "success" });
  }

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
  const paidRevenue = filteredOrders
    .filter((o) => o.paid)
    .reduce((sum, o) => sum + o.total, 0);
  const cancelledCount = filteredOrders.filter(
    (o) => o.status === "CANCELLED"
  ).length;
  const wastedItems = filteredOrders.flatMap((o) =>
    o.sets.flatMap((s) => s.items.filter((i) => i.itemStatus === "WASTED"))
  );

  if (loading) {
    return (
      <div className="container py-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg">
        <div className="container px-4 py-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Order Management</h1>
              <p className="text-purple-100 mt-1">
                {filteredOrders.length} orders
              </p>
            </div>
            <Button
              onClick={fetchOrders}
              variant="secondary"
              size="icon"
              className="h-10 w-10"
            >
              <RefreshCw className="h-5 w-5" />
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-3">
                <p className="text-purple-100 text-xs">Orders</p>
                <p className="text-xl font-bold">{filteredOrders.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-3">
                <p className="text-purple-100 text-xs">Revenue</p>
                <p className="text-xl font-bold">
                  &#3647;{totalRevenue.toFixed(0)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-3">
                <p className="text-purple-100 text-xs">Collected</p>
                <p className="text-xl font-bold">
                  &#3647;{paidRevenue.toFixed(0)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-3">
                <p className="text-purple-100 text-xs">Cancelled</p>
                <p className="text-xl font-bold">{cancelledCount}</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-3">
                <p className="text-purple-100 text-xs">Wasted Items</p>
                <p className="text-xl font-bold">{wastedItems.length}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="container px-4 py-6 max-w-7xl mx-auto">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search order #, table, or item..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="READY_TO_PAY">Ready to Pay</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mt-3">
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Orders */}
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500">No orders found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const isExpanded = expandedOrder === order.id;
              return (
                <Card key={order.id} className="overflow-hidden">
                  {/* Order Header Row */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() =>
                      setExpandedOrder(isExpanded ? null : order.id)
                    }
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="font-bold text-lg">
                          #{order.orderNumber}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="hidden sm:flex items-center gap-2">
                        <Badge variant="outline">
                          {order.orderType === "DINEIN"
                            ? `Dine-in${order.tableNumber ? ` T${order.tableNumber}` : ""}`
                            : "Takeaway"}
                        </Badge>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                        {order.paid && (
                          <Badge className="bg-green-600 text-white">
                            PAID{order.paymentMethod ? ` (${order.paymentMethod})` : ""}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg">
                        &#3647;{order.total.toFixed(0)}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Mobile badges */}
                  {!isExpanded && (
                    <div className="flex items-center gap-2 px-4 pb-3 sm:hidden">
                      <Badge variant="outline" className="text-xs">
                        {order.orderType === "DINEIN"
                          ? `Dine-in${order.tableNumber ? ` T${order.tableNumber}` : ""}`
                          : "Takeaway"}
                      </Badge>
                      <Badge className={`${getStatusColor(order.status)} text-xs`}>
                        {order.status}
                      </Badge>
                      {order.paid && (
                        <Badge className="bg-green-600 text-white text-xs">PAID</Badge>
                      )}
                    </div>
                  )}

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t bg-gray-50 p-4">
                      {/* Order Info */}
                      <div className="flex flex-wrap gap-4 text-sm mb-4">
                        <span>
                          Created by:{" "}
                          <span className="font-medium">
                            {order.createdBy?.name || "QR Customer"}
                          </span>
                        </span>
                        {order.paidAt && (
                          <span>
                            Paid at:{" "}
                            <span className="font-medium">
                              {new Date(order.paidAt).toLocaleString()}
                            </span>
                          </span>
                        )}
                      </div>

                      {/* Sets */}
                      {order.sets.length > 0 ? (
                        <div className="space-y-3">
                          {order.sets
                            .sort((a, b) => a.setNumber - b.setNumber)
                            .map((set) => (
                              <div
                                key={set.id}
                                className="bg-white rounded-lg p-3 border"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-sm">
                                    Set {set.setNumber}
                                  </span>
                                  <Badge
                                    className={`${getSetStatusColor(set.status)} text-xs`}
                                  >
                                    {set.status}
                                  </Badge>
                                </div>
                                <div className="space-y-1">
                                  {set.items.map((item) => (
                                    <div
                                      key={item.id}
                                      className={`flex justify-between text-sm ${getItemStatusColor(item.itemStatus)}`}
                                    >
                                      <span>
                                        {item.quantity}x {item.name}
                                        {item.itemStatus !== "ACTIVE" && (
                                          <span className="text-xs ml-1">
                                            [{item.itemStatus}]
                                          </span>
                                        )}
                                      </span>
                                      <span>
                                        &#3647;
                                        {(item.price * item.quantity).toFixed(0)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                {set.sentAt && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Sent: {new Date(set.sentAt).toLocaleTimeString()}
                                    {set.readyAt && ` | Ready: ${new Date(set.readyAt).toLocaleTimeString()}`}
                                    {set.servedAt && ` | Served: ${new Date(set.servedAt).toLocaleTimeString()}`}
                                  </p>
                                )}
                              </div>
                            ))}
                        </div>
                      ) : (
                        /* Legacy: flat items */
                        <div className="bg-white rounded-lg p-3 border">
                          {order.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between text-sm"
                            >
                              <span>
                                {item.quantity}x {item.name}
                              </span>
                              <span>
                                &#3647;{(item.price * item.quantity).toFixed(0)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Totals */}
                      <div className="mt-4 pt-3 border-t">
                        <div className="text-sm text-muted-foreground">
                          Subtotal: &#3647;{order.subtotal.toFixed(0)}
                          {order.tax > 0 && ` | Tax: ฿${order.tax.toFixed(0)}`}
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Logs Dialog */}
      <Dialog open={logsDialogOpen} onOpenChange={setLogsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Audit Log — Order #{logsOrderNumber}
            </DialogTitle>
          </DialogHeader>
          {logsLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No audit logs found for this order
            </div>
          ) : (
            <div className="space-y-0">
              {logs.map((log, idx) => (
                <div key={log.id} className="relative pl-6 pb-4">
                  {/* Timeline line */}
                  {idx < logs.length - 1 && (
                    <div className="absolute left-[9px] top-6 bottom-0 w-0.5 bg-gray-200" />
                  )}
                  {/* Timeline dot */}
                  <div className="absolute left-0 top-1.5 h-[18px] w-[18px] rounded-full bg-purple-100 border-2 border-purple-400 flex items-center justify-center">
                    <Clock className="h-2.5 w-2.5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {getActionLabel(log.action)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()} &mdash;{" "}
                      {log.performedBy.name} ({log.performedBy.role})
                      {log.approvedBy &&
                        ` | Approved by: ${log.approvedBy.name}`}
                    </p>
                    {log.reason && (
                      <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 mt-1">
                        Reason: {log.reason}
                      </p>
                    )}
                    {log.details && (
                      <pre className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1 mt-1 overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <AdminOrdersContent />
    </RoleGuard>
  );
}
