"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  ShoppingCart,
  Clock,
  CheckCircle,
  User,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface OrderSet {
  id: string;
  setNumber: number;
  status: string;
}

interface Order {
  id: string;
  orderNumber: number;
  orderType: string;
  tableNumber: string | null;
  items: OrderItem[];
  sets?: OrderSet[];
  total: number;
  status: string;
  paid: boolean;
  createdAt: string;
  createdBy?: { id: string; name: string } | null;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionOrderType, setSessionOrderType] = useState<string | null>(null);
  const [sessionTableNumber, setSessionTableNumber] = useState<string | null>(
    null
  );
  const [isCustomerSession, setIsCustomerSession] = useState(false);

  // Quick filter for staff
  const [quickFilter, setQuickFilter] = useState<"today" | "month" | "all">(
    "today"
  );

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

  // Calculate date range based on filter
  const getDateRange = () => {
    const now = new Date();

    switch (quickFilter) {
      case "today": {
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        return { start: todayStart, end: now };
      }
      case "month": {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: monthStart, end: now };
      }
      case "all":
        return null;
    }
  };

  async function fetchOrders() {
    try {
      const orderType = sessionStorage.getItem("orderType");
      const tableNumber = sessionStorage.getItem("tableNumber");

      const isStaffUser =
        user && ["KITCHEN", "COUNTER", "ADMIN"].includes(user.role);

      const params = new URLSearchParams();

      if (isStaffUser) {
        const dateRange = getDateRange();
        if (dateRange) {
          params.append("startDate", dateRange.start.toISOString());
          params.append("endDate", dateRange.end.toISOString());
        }
      } else {
        params.append("timeFilter", "2h");

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
        title: "Connection issue",
        description: "Could not load your orders. Please try again.",
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
  }, [quickFilter]);

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      OPEN: "bg-yellow-100 text-yellow-700 border-yellow-300",
      READY_TO_PAY: "bg-blue-100 text-blue-700 border-blue-300",
      PAID: "bg-green-100 text-green-700 border-green-300",
      CLOSED: "bg-gray-100 text-gray-700 border-gray-300",
      CANCELLED: "bg-red-100 text-red-700 border-red-300",
    };
    return (
      <Badge className={`${styles[status] || ""} border text-[10px] sm:text-xs`}>
        {status.replace("_", " ")}
      </Badge>
    );
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "OPEN":
        return <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />;
      case "READY_TO_PAY":
        return <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />;
      case "PAID":
      case "CLOSED":
        return <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />;
      default:
        return <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />;
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
        <div className="container px-3 sm:px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold">
                {isCustomerSession ? "My Orders" : "All Orders"}
              </h1>
              <p className="text-blue-100 mt-0.5 sm:mt-1 text-xs sm:text-base">
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
              className="h-9 w-9 sm:h-12 sm:w-12"
            >
              <RefreshCw className="h-4 w-4 sm:h-6 sm:w-6" />
            </Button>
          </div>
        </div>
      </div>

      <div className="container px-3 sm:px-4 py-4 sm:py-8">
        {/* Compact Filter Bar (Staff only) */}
        {isStaffUser && (
          <div className="flex flex-wrap items-center gap-2 mb-4 sm:mb-6">
            {(["today", "month", "all"] as const).map((filter) => (
              <Button
                key={filter}
                onClick={() => setQuickFilter(filter)}
                variant={quickFilter === filter ? "default" : "outline"}
                size="sm"
                className="text-xs sm:text-sm"
              >
                {filter === "today" && "Today"}
                {filter === "month" && "This Month"}
                {filter === "all" && "All Time"}
              </Button>
            ))}
            <span className="text-xs sm:text-sm text-muted-foreground ml-auto">
              {orders.length} order{orders.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Orders List */}
        {orders.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-12 sm:pt-16 pb-12 sm:pb-16 text-center">
              <ShoppingCart className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold mb-2">No orders yet</h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-6">
                {isCustomerSession
                  ? "Start ordering to see your orders here"
                  : "No orders found for this period"}
              </p>
              {isCustomerSession && (
                <Link href="/menu">
                  <Button>Browse Menu</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
            {/* Orders */}
            <div className="space-y-3 sm:space-y-4">
              {orders.map((order) => (
                <Card
                  key={order.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 px-3 sm:px-6 py-3 sm:pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                        {getStatusIcon(order.status)}
                        <div className="min-w-0">
                          <CardTitle className="text-base sm:text-lg">
                            Order #{order.orderNumber}
                          </CardTitle>
                          <p className="text-[10px] sm:text-sm text-muted-foreground">
                            {new Date(order.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 justify-end flex-shrink-0">
                        {getStatusBadge(order.status)}
                        {order.paid && (
                          <Badge className="bg-green-100 text-green-700 border border-green-300 text-[10px] sm:text-xs">
                            PAID
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-4 mt-1.5 sm:mt-2 text-xs sm:text-sm">
                      <span className="text-muted-foreground">
                        {order.orderType === "DINEIN" ? "Dine-in" : "Takeaway"}
                      </span>
                      {order.tableNumber && (
                        <span className="text-muted-foreground">
                          Table {order.tableNumber}
                        </span>
                      )}
                      {isStaffUser && order.createdBy && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <User className="h-3 w-3" />
                          {order.createdBy.name}
                        </span>
                      )}
                      {isStaffUser && !order.createdBy && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <User className="h-3 w-3" />
                          QR Customer
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 pt-3 sm:pt-4">
                    {/* QR order awaiting server approval */}
                    {order.sets?.length &&
                      order.sets.length > 0 &&
                      order.sets[0].status === "DRAFT" &&
                      order.status === "OPEN" && (
                        <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-md flex items-center gap-2">
                          <Clock className="h-4 w-4 text-amber-600 flex-shrink-0" />
                          <span className="text-xs sm:text-sm text-amber-700 font-medium">
                            Waiting for server confirmation
                          </span>
                        </div>
                      )}
                    <div className="space-y-1.5 sm:space-y-2">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-xs sm:text-sm"
                        >
                          <span className="truncate mr-2">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="font-medium flex-shrink-0">
                            ฿{(item.price * item.quantity).toFixed(0)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t flex justify-between items-center">
                      <span className="font-bold text-sm sm:text-base">Total:</span>
                      <span className="text-lg sm:text-xl font-bold text-green-600">
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
                <CardContent className="p-4 sm:p-6 text-center">
                  <h3 className="font-bold text-base sm:text-lg mb-2">
                    Want to order more?
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
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
