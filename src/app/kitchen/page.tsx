"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, RefreshCw, Volume2, VolumeX } from "lucide-react";
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
  createdAt: string;
}

function KitchenPageContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true); // ✅ Sound toggle
  const { toast } = useToast();

  // ✅ Track previous order count to detect new orders
  const previousOrderCountRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ✅ Initialize audio
  useEffect(() => {
    // Create audio element
    audioRef.current = new Audio("/notification.wav");
    audioRef.current.volume = 0.8;

    return () => {
      // Cleanup
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // ✅ Play notification sound
  const playNotificationSound = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0; // Reset to start
      audioRef.current.play().catch((error) => {
        console.log("Sound play blocked:", error);
      });
    }
  };

  async function fetchOrders() {
    try {
      const response = await fetch("/api/kitchen/orders");
      const data = await response.json();

      if (data.success) {
        const newOrders = data.data;

        // ✅ Check if there are NEW orders (count increased)
        if (
          previousOrderCountRef.current > 0 &&
          newOrders.length > previousOrderCountRef.current
        ) {
          // New order detected!
          playNotificationSound();

          toast({
            title: "🔔 New Order!",
            description: `Order #${newOrders[0].orderNumber} received`,
          });
        }

        // Update previous count
        previousOrderCountRef.current = newOrders.length;
        setOrders(newOrders);
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
    const interval = setInterval(fetchOrders, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingOrders = orders.filter((order) => order.status !== "DELIVERED");
  const completedOrders = orders.filter(
    (order) => order.status === "DELIVERED"
  );

  if (loading) {
    return (
      <div className="container py-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-pond-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header with Sound Toggle */}
      <div className="bg-gradient-to-r from-blue-pond-500 to-blue-pond-700 text-white shadow-lg">
        <div className="container px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Kitchen Display</h1>
              <p className="text-blue-100 mt-1">Manage incoming orders</p>
            </div>
            <div className="flex items-center gap-3">
              {/* ✅ Sound Toggle Button */}
              <Button
                onClick={() => setSoundEnabled(!soundEnabled)}
                variant={soundEnabled ? "secondary" : "outline"}
                size="icon"
                className="h-12 w-12"
                title={soundEnabled ? "Sound On" : "Sound Off"}
              >
                {soundEnabled ? (
                  <Volume2 className="h-6 w-6" />
                ) : (
                  <VolumeX className="h-6 w-6" />
                )}
              </Button>

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
      </div>

      <div className="container px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Clock className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
                <p className="text-2xl font-bold">{pendingOrders.length}</p>
                <p className="text-sm text-muted-foreground">Pending Orders</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
                <p className="text-2xl font-bold">{completedOrders.length}</p>
                <p className="text-sm text-muted-foreground">Completed Today</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                <p className="text-2xl font-bold">{orders.length}</p>
                <p className="text-sm text-muted-foreground">Total Orders</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Orders */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            Pending Orders ({pendingOrders.length})
          </h2>

          {pendingOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-16 w-16 mx-auto text-green-600 mb-4" />
                <p className="text-xl font-semibold">All caught up!</p>
                <p className="text-muted-foreground">No pending orders</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingOrders.map((order) => (
                <Card key={order.id} className="border-2 border-yellow-200">
                  <CardHeader className="bg-yellow-50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Order #{order.orderNumber}
                      </CardTitle>
                      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">
                        {order.orderType === "DINEIN" ? "Dine-in" : "Takeaway"}
                      </Badge>
                      {order.tableNumber && (
                        <Badge variant="outline">
                          Table {order.tableNumber}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center text-sm"
                        >
                          <span className="font-medium">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="text-muted-foreground">
                            ฿{(item.price * item.quantity).toFixed(0)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <Button
                        onClick={() => markAsDelivered(order.id)}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Delivered
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Completed Orders */}
        {completedOrders.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">
              Completed Orders ({completedOrders.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedOrders.map((order) => (
                <Card key={order.id} className="opacity-75">
                  <CardHeader className="bg-green-50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Order #{order.orderNumber}
                      </CardTitle>
                      <Badge className="bg-green-100 text-green-700 border-green-300">
                        DELIVERED
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-1">
                      {order.items.map((item) => (
                        <div key={item.id} className="text-sm">
                          {item.quantity}x {item.name}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function KitchenPage() {
  return (
    <RoleGuard allowedRoles={["KITCHEN", "ADMIN"]}>
      <KitchenPageContent />
    </RoleGuard>
  );
}
