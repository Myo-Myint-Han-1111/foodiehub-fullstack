"use client";

import { useState, useEffect } from "react";
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
import { RefreshCw, Search, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import RoleGuard from "@/components/RoleGuard";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: number;
  orderType: string;
  tableNumber: string | null;
  items: OrderItem[];
  total: number;
  status: string;
  paid: boolean;
  createdAt: string;
}

function AdminOrdersContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [timeFilter, setTimeFilter] = useState("all");
  const { toast } = useToast();

  async function fetchOrders() {
    try {
      const params = new URLSearchParams({
        timeFilter: timeFilter, // Admin can see all, 30d, 24h, or 2h
      });

      const response = await fetch(`/api/orders?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setOrders(data.data);
        setFilteredOrders(data.data);
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeFilter]);

  // Filter orders based on search and status
  useEffect(() => {
    let filtered = [...orders];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (order) =>
          order.orderNumber.toString().includes(searchQuery) ||
          order.tableNumber?.includes(searchQuery) ||
          order.items.some((item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    // Status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  }, [searchQuery, statusFilter, orders]);

  function getStatusBadge(status: string) {
    const styles = {
      PENDING: "bg-yellow-100 text-yellow-700",
      DELIVERED: "bg-green-100 text-green-700",
      CANCELLED: "bg-red-100 text-red-700",
    };
    return (
      <Badge className={styles[status as keyof typeof styles] || ""}>
        {status}
      </Badge>
    );
  }

  function exportToCSV() {
    const headers = [
      "Order #",
      "Date",
      "Type",
      "Table",
      "Items",
      "Total",
      "Status",
      "Paid",
    ];
    const rows = filteredOrders.map((order) => [
      order.orderNumber,
      new Date(order.createdAt).toLocaleString(),
      order.orderType,
      order.tableNumber || "N/A",
      order.items.map((i) => `${i.quantity}x ${i.name}`).join("; "),
      order.total.toFixed(2),
      order.status,
      order.paid ? "Yes" : "No",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Orders exported to CSV",
    });
  }

  const totalRevenue = filteredOrders.reduce(
    (sum, order) => sum + order.total,
    0
  );
  const paidRevenue = filteredOrders
    .filter((order) => order.paid)
    .reduce((sum, order) => sum + order.total, 0);

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
        <div className="container px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">All Orders (Admin)</h1>
              <p className="text-purple-100 mt-1">
                {filteredOrders.length} orders • ${totalRevenue.toFixed(2)}{" "}
                total
              </p>
            </div>
            <Button
              onClick={fetchOrders}
              variant="secondary"
              size="icon"
              className="h-12 w-12"
            >
              <RefreshCw className="h-6 w-6" />
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-4">
                <p className="text-purple-100 text-sm">Total Orders</p>
                <p className="text-2xl font-bold">{filteredOrders.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-4">
                <p className="text-purple-100 text-sm">Revenue</p>
                <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-4">
                <p className="text-purple-100 text-sm">Paid</p>
                <p className="text-2xl font-bold">${paidRevenue.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-4">
                <p className="text-purple-100 text-sm">Pending</p>
                <p className="text-2xl font-bold">
                  {filteredOrders.filter((o) => o.status === "PENDING").length}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="container px-4 py-6">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by order #, table, or item..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              {/* Time Filter */}
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="2h">Last 2 Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-4">
              <Button
                onClick={exportToCSV}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Download className="h-4 w-4 mr-2" />
                Export to CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500">No orders found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Order #{order.orderNumber}
                        {order.orderType === "DINEIN" && order.tableNumber && (
                          <span className="text-sm font-normal text-gray-600 ml-2">
                            (Table {order.tableNumber})
                          </span>
                        )}
                        {order.orderType === "TAKEAWAY" && (
                          <span className="text-sm font-normal text-gray-600 ml-2">
                            (Takeaway)
                          </span>
                        )}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(order.status)}
                      {order.paid ? (
                        <Badge className="bg-green-600 text-white">PAID</Badge>
                      ) : (
                        <Badge variant="outline">UNPAID</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm"
                      >
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                        <span className="font-medium">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <span className="font-bold">Total:</span>
                    <span className="text-xl font-bold text-purple-600">
                      ${order.total.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
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
