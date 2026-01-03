"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DollarSign,
  Search,
  CheckCircle,
  RefreshCw,
  Volume2,
  VolumeX,
} from "lucide-react";
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
  paid: boolean;
}

function CounterPageContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true); // ✅ Sound toggle
  const { toast } = useToast();

  // ✅ Track previous delivered order count
  const previousDeliveredCountRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ✅ Initialize audio
  useEffect(() => {
    audioRef.current = new Audio("/notification.wav");
    audioRef.current.volume = 0.8;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // ✅ Play notification sound
  const playNotificationSound = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((error) => {
        console.log("Sound play blocked:", error);
      });
    }
  };

  async function fetchOrders() {
    try {
      const response = await fetch("/api/counter/orders");
      const data = await response.json();

      if (data.success) {
        const newOrders = data.data;

        // ✅ Count delivered but unpaid orders
        const deliveredUnpaid = newOrders.filter(
          (o: Order) => o.status === "DELIVERED" && !o.paid
        ).length;

        // ✅ Check if there are NEW delivered orders (count increased)
        if (
          previousDeliveredCountRef.current > 0 &&
          deliveredUnpaid > previousDeliveredCountRef.current
        ) {
          // New delivered order detected!
          playNotificationSound();

          toast({
            title: "🔔 Order Ready!",
            description: "New order ready for payment",
          });
        }

        // Update previous count
        previousDeliveredCountRef.current = deliveredUnpaid;
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

  async function markAsPaid(orderId: string) {
    try {
      const response = await fetch(`/api/counter/orders/${orderId}/pay`, {
        method: "PATCH",
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Payment received",
        });
        fetchOrders();
      } else {
        toast({
          title: "Error",
          description: "Failed to update payment status",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to update payment status",
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

  const deliveredOrders = orders.filter(
    (order) => order.status === "DELIVERED" && !order.paid
  );
  const paidOrders = orders.filter((order) => order.paid);

  const filteredDeliveredOrders = searchQuery
    ? deliveredOrders.filter((order) =>
        order.orderType === "DINEIN"
          ? order.tableNumber?.includes(searchQuery)
          : order.orderNumber.toString().includes(searchQuery)
      )
    : deliveredOrders;

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
              <h1 className="text-3xl font-bold">Counter / Payment</h1>
              <p className="text-blue-100 mt-1">
                Process payments for delivered orders
              </p>
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
                <DollarSign className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
                <p className="text-2xl font-bold">{deliveredOrders.length}</p>
                <p className="text-sm text-muted-foreground">
                  Awaiting Payment
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
                <p className="text-2xl font-bold">{paidOrders.length}</p>
                <p className="text-sm text-muted-foreground">Paid Today</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <DollarSign className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                <p className="text-2xl font-bold">
                  ฿{paidOrders.reduce((sum, o) => sum + o.total, 0).toFixed(0)}
                </p>
                <p className="text-sm text-muted-foreground">Revenue Today</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order number or table..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Delivered Orders (Awaiting Payment) */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            Ready for Payment ({filteredDeliveredOrders.length})
          </h2>

          {filteredDeliveredOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-16 w-16 mx-auto text-green-600 mb-4" />
                <p className="text-xl font-semibold">All caught up!</p>
                <p className="text-muted-foreground">
                  No orders awaiting payment
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDeliveredOrders.map((order) => (
                <Card key={order.id} className="border-2 border-green-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-2xl font-bold">
                          Order #{order.orderNumber}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <Badge className="bg-green-100 text-green-700 border-green-300">
                        READY
                      </Badge>
                    </div>

                    <div className="flex gap-2 mb-4">
                      <Badge variant="outline">
                        {order.orderType === "DINEIN" ? "Dine-in" : "Takeaway"}
                      </Badge>
                      {order.tableNumber && (
                        <Badge variant="outline">
                          Table {order.tableNumber}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2 mb-4">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between text-sm"
                        >
                          <span>
                            {item.quantity}x {item.name}
                          </span>
                          <span>
                            ฿{(item.price * item.quantity).toFixed(0)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mb-4 pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-lg">Total:</span>
                        <span className="text-2xl font-black text-green-600">
                          ฿{order.total.toFixed(0)}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={() => markAsPaid(order.id)}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Paid
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recent Paid Orders */}
        {paidOrders.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">
              Recent Payments ({paidOrders.slice(0, 6).length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paidOrders.slice(0, 6).map((order) => (
                <Card key={order.id} className="opacity-75">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold">Order #{order.orderNumber}</p>
                      <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                        PAID
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total:</span>
                      <span className="font-bold text-green-600">
                        ฿{order.total.toFixed(0)}
                      </span>
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

export default function CounterPage() {
  return (
    <RoleGuard allowedRoles={["COUNTER", "ADMIN"]}>
      <CounterPageContent />
    </RoleGuard>
  );
}
