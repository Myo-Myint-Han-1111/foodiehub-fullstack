"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  RefreshCw,
  ShoppingCart,
  Clock,
  CheckCircle,
  Calendar,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";

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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionOrderType, setSessionOrderType] = useState<string | null>(null);
  const [sessionTableNumber, setSessionTableNumber] = useState<string | null>(
    null
  );
  const [isCustomerSession, setIsCustomerSession] = useState(false);

  // ✅ NEW: Date filter state for staff
  const [filterMode, setFilterMode] = useState<"quick" | "custom">("quick");
  const [quickFilter, setQuickFilter] = useState<"today" | "month" | "all">(
    "today"
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();

  // Check if this is a customer QR session (no login) or staff user
  useEffect(() => {
    const orderType = sessionStorage.getItem("orderType");
    const tableNumber = sessionStorage.getItem("tableNumber");
    setSessionOrderType(orderType);
    setSessionTableNumber(tableNumber);

    const hasQRSession = orderType !== null;
    setIsCustomerSession(hasQRSession || user?.role === "CUSTOMER");
  }, [user]);

  // ✅ NEW: Calculate date range based on filter
  const getDateRange = () => {
    const now = new Date();

    if (filterMode === "quick") {
      switch (quickFilter) {
        case "today":
          // Start of today to now
          const todayStart = new Date(now);
          todayStart.setHours(0, 0, 0, 0);
          return { start: todayStart, end: now };

        case "month":
          // Start of this month to now
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          return { start: monthStart, end: now };

        case "all":
          return null; // No date filter
      }
    } else {
      // Custom date range
      if (startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        return { start, end };
      }
      return null;
    }
  };

  async function fetchOrders() {
    try {
      const orderType = sessionStorage.getItem("orderType");
      const tableNumber = sessionStorage.getItem("tableNumber");

      // Determine if this is a customer view or staff view
      const isStaffUser =
        user && ["KITCHEN", "COUNTER", "ADMIN"].includes(user.role);

      const params = new URLSearchParams();

      if (isStaffUser) {
        // ✅ Staff: Use date filters
        const dateRange = getDateRange();

        if (dateRange) {
          params.append("startDate", dateRange.start.toISOString());
          params.append("endDate", dateRange.end.toISOString());
        }
        // If no date range, fetch all orders (no time filter)
      } else {
        // Customer: Use 2h filter
        params.append("timeFilter", "2h");

        // Filter by session data
        if (orderType === "dine-in" && tableNumber) {
          params.append("tableNumber", tableNumber);
        } else if (orderType === "takeaway") {
          params.append("orderType", "TAKEAWAY");
        }
      }

      const response = await fetch(`/api/orders?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setOrders(data.data);
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
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickFilter, startDate, endDate, filterMode]);

  function getStatusBadge(status: string) {
    const styles = {
      PENDING: "bg-yellow-100 text-yellow-700 border-yellow-300",
      CONFIRMED: "bg-blue-100 text-blue-700 border-blue-300",
      PREPARING: "bg-purple-100 text-purple-700 border-purple-300",
      READY: "bg-orange-100 text-orange-700 border-orange-300",
      DELIVERED: "bg-green-100 text-green-700 border-green-300",
      CANCELLED: "bg-red-100 text-red-700 border-red-300",
    };
    return (
      <Badge
        className={`${styles[status as keyof typeof styles] || ""} border`}
      >
        {status}
      </Badge>
    );
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "PENDING":
      case "CONFIRMED":
      case "PREPARING":
      case "READY":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "DELIVERED":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  }

  if (loading || authLoading) {
    return (
      <div className="container py-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-pond-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  const isStaffUser =
    user && ["KITCHEN", "COUNTER", "ADMIN"].includes(user.role);

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-pond-500 to-blue-pond-700 text-white shadow-lg">
        <div className="container px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                {isCustomerSession ? "My Orders" : "All Orders"}
              </h1>
              <p className="text-blue-100 mt-1">
                {isCustomerSession
                  ? sessionOrderType === "dine-in"
                    ? `Table ${sessionTableNumber} orders`
                    : "Your recent orders"
                  : "View and manage all orders"}
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
        </div>
      </div>

      <div className="container px-4 py-8">
        {/* ✅ NEW: Date Filter Section (Only for Staff) */}
        {isStaffUser && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Date Filter
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filter Mode Toggle */}
              <div className="flex gap-2 mb-4">
                <Button
                  onClick={() => setFilterMode("quick")}
                  variant={filterMode === "quick" ? "default" : "outline"}
                  className="flex-1"
                >
                  Quick Filter
                </Button>
                <Button
                  onClick={() => setFilterMode("custom")}
                  variant={filterMode === "custom" ? "default" : "outline"}
                  className="flex-1"
                >
                  Custom Range
                </Button>
              </div>

              {/* Quick Filter Buttons */}
              {filterMode === "quick" && (
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    onClick={() => setQuickFilter("today")}
                    variant={quickFilter === "today" ? "default" : "outline"}
                  >
                    Today
                  </Button>
                  <Button
                    onClick={() => setQuickFilter("month")}
                    variant={quickFilter === "month" ? "default" : "outline"}
                  >
                    This Month
                  </Button>
                  <Button
                    onClick={() => setQuickFilter("all")}
                    variant={quickFilter === "all" ? "default" : "outline"}
                  >
                    All Time
                  </Button>
                </div>
              )}

              {/* Custom Date Range Picker */}
              {filterMode === "custom" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Start Date
                    </label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      max={endDate || undefined}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      End Date
                    </label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || undefined}
                    />
                  </div>
                </div>
              )}

              {/* Active Filter Display */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  {filterMode === "quick" ? (
                    <>
                      Showing: {quickFilter === "today" && "Today's orders"}
                      {quickFilter === "month" && "This month's orders"}
                      {quickFilter === "all" && "All orders"}
                    </>
                  ) : (
                    <>
                      {startDate && endDate ? (
                        <>
                          Showing: {new Date(startDate).toLocaleDateString()} -{" "}
                          {new Date(endDate).toLocaleDateString()}
                        </>
                      ) : (
                        "Please select start and end dates"
                      )}
                    </>
                  )}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  {orders.length} order{orders.length !== 1 ? "s" : ""} found
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Orders List */}
        {orders.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-16 pb-16 text-center">
              <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
              <p className="text-muted-foreground mb-6">
                {isCustomerSession
                  ? "Start ordering to see your orders here"
                  : "No orders have been placed yet"}
              </p>
              {isCustomerSession && (
                <Link href="/menu">
                  <Button>Browse Menu</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Orders List */}
            <div className="space-y-4">
              {orders.map((order) => (
                <Card
                  key={order.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(order.status)}
                        <div>
                          <CardTitle className="text-lg">
                            Order #{order.orderNumber}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(order.status)}
                        {order.paid && (
                          <Badge className="ml-2 bg-green-100 text-green-700 border border-green-300">
                            PAID
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span className="text-muted-foreground">
                        Type:{" "}
                        <span className="font-medium text-foreground">
                          {order.orderType === "DINEIN"
                            ? "Dine-in"
                            : "Takeaway"}
                        </span>
                      </span>
                      {order.tableNumber && (
                        <span className="text-muted-foreground">
                          Table:{" "}
                          <span className="font-medium text-foreground">
                            {order.tableNumber}
                          </span>
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span>
                            {item.quantity}x {item.name}
                          </span>
                          <span className="font-medium">
                            ฿{(item.price * item.quantity).toFixed(0)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                      <span className="font-bold">Total:</span>
                      <span className="text-xl font-bold text-green-600">
                        ฿{order.total.toFixed(0)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Again Button - ONLY for Customer QR Sessions */}
            {isCustomerSession && (
              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardContent className="p-6 text-center">
                  <h3 className="font-bold text-lg mb-2">
                    Want to order more?
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Browse our menu and add more items to your order
                  </p>
                  <Link href="/menu">
                    <Button className="bg-blue-pond-500 hover:bg-blue-pond-600 w-full sm:w-auto">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Order Again
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
