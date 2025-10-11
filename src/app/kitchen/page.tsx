"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  tableNumber: string;
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: string;
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  async function fetchOrders() {
    try {
      const response = await fetch("/api/kitchen/orders");
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

  async function markAsDelivered(orderId: string) {
    try {
      const response = await fetch(`/api/kitchen/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "DELIVERED" }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Order marked as delivered",
        });
        fetchOrders();
      } else {
        toast({
          title: "Error",
          description: "Failed to update order",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive",
      });
    }
  }

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingOrders = orders.filter((order) => order.status === "PENDING");
  const deliveredOrders = orders.filter(
    (order) => order.status === "DELIVERED"
  );

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
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg sticky top-0 z-10">
        <div className="container px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Kitchen Display</h1>
              <p className="text-orange-100 mt-1">
                {pendingOrders.length} pending orders
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

      <div className="container px-4 py-6">
        {/* Pending Orders */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Clock className="h-6 w-6 text-orange-600" />
            Pending Orders ({pendingOrders.length})
          </h2>

          {pendingOrders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-500 text-lg">No pending orders</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingOrders.map((order) => (
                <Card
                  key={order.id}
                  className="border-4 border-orange-500 shadow-lg"
                >
                  <CardHeader className="bg-orange-50 pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-3xl font-black">
                        Table {order.tableNumber}
                      </CardTitle>
                      <Badge className="bg-orange-600 text-white text-lg px-4 py-2">
                        PENDING
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </p>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3 mb-6">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"
                        >
                          <div>
                            <p className="font-bold text-lg">{item.name}</p>
                            <p className="text-sm text-gray-600">
                              ${item.price.toFixed(2)} each
                            </p>
                          </div>
                          <div className="text-2xl font-black text-orange-600">
                            x{item.quantity}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4 mb-4">
                      <div className="flex justify-between text-xl font-bold">
                        <span>Total:</span>
                        <span className="text-orange-600">
                          ${order.total.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={() => markAsDelivered(order.id)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-bold"
                    >
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Mark as Delivered
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Delivered Orders (Today) */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            Delivered Today ({deliveredOrders.length})
          </h2>

          {deliveredOrders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-500 text-lg">
                  No delivered orders yet today
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {deliveredOrders.map((order) => (
                <Card key={order.id} className="border-2 border-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-2xl font-black">
                        Table {order.tableNumber}
                      </p>
                      <Badge className="bg-green-600 text-white">DONE</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </p>
                    <div className="space-y-1 text-sm">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between text-gray-700"
                        >
                          <span>{item.name}</span>
                          <span className="font-semibold">
                            x{item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex justify-between font-bold">
                        <span>Total:</span>
                        <span className="text-green-600">
                          ${order.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
