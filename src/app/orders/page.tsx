"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, ShoppingCart, Clock, CheckCircle } from "lucide-react";
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
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();

  // Check if this is a customer QR session (no login) or staff user
  useEffect(() => {
    const orderType = sessionStorage.getItem("orderType");
    const tableNumber = sessionStorage.getItem("tableNumber");
    setSessionOrderType(orderType);
    setSessionTableNumber(tableNumber);

    // Customer session = has QR session data and NO logged in user
    // OR user is explicitly a CUSTOMER role
    const hasQRSession = orderType !== null;
    setIsCustomerSession(hasQRSession || user?.role === "CUSTOMER");
  }, [user]);

  async function fetchOrders() {
    try {
      const orderType = sessionStorage.getItem("orderType");
      const tableNumber = sessionStorage.getItem("tableNumber");

      // Determine if this is a customer view or staff view
      const isStaffUser =
        user && ["KITCHEN", "COUNTER", "ADMIN"].includes(user.role);

      const params = new URLSearchParams({
        timeFilter: isStaffUser ? "all" : "2h", // Staff sees all, customers see 2h
      });

      // For customer QR sessions, filter by session data
      if (!isStaffUser) {
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
  }, []);

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg">
        <div className="container px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                {isCustomerSession ? "My Orders" : "All Orders"}
              </h1>
              <p className="text-orange-100 mt-1">
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
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                      <span className="font-bold">Total:</span>
                      <span className="text-xl font-bold text-green-600">
                        ${order.total.toFixed(2)}
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
                    <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
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
