"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

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
  const { toast } = useToast();

  async function fetchOrders() {
    try {
      const response = await fetch("/api/orders");
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

  function getStatusColor(status: string) {
    switch (status) {
      case "PENDING":
        return "bg-orange-100 text-orange-700";
      case "DELIVERED":
        return "bg-green-100 text-green-700";
      case "CANCELLED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  if (loading) {
    return (
      <div className="container py-10">
        <div className="text-center">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
        <div className="container px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">All Orders</h1>
              <p className="text-blue-100 mt-1">{orders.length} total orders</p>
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

      <div className="container px-4 py-6">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500 text-lg">No orders yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => (
              <Card
                key={order.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl flex items-center gap-3">
                        {order.orderType === "DINEIN" ? (
                          <span className="flex items-center gap-2">
                            🪑 Table {order.tableNumber}
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            📦 TAKEAWAY #{order.orderNumber}
                          </span>
                        )}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                      {order.paid ? (
                        <Badge className="bg-green-100 text-green-700">
                          PAID
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700">
                          UNPAID
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
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
                  <div className="border-t pt-3 flex justify-between items-center">
                    <span className="font-bold">Total:</span>
                    <span className="text-xl font-bold text-green-600">
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
