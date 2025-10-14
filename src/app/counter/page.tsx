"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DollarSign, Search, CheckCircle, RefreshCw } from "lucide-react";
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
  const { toast } = useToast();

  async function fetchOrders() {
    try {
      const response = await fetch("/api/counter/orders");
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
    const interval = setInterval(fetchOrders, 30000);
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

  const totalUnpaid = deliveredOrders.reduce(
    (sum, order) => sum + order.total,
    0
  );
  const totalPaidToday = paidOrders.reduce(
    (sum, order) => sum + order.total,
    0
  );

  if (loading) {
    return (
      <div className="container py-10">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg sticky top-0 z-10">
        <div className="container px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">Counter / Payment</h1>
              <p className="text-green-100 mt-1">Manage customer payments</p>
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
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-4">
                <p className="text-green-100 text-sm">Unpaid Orders</p>
                <p className="text-3xl font-black">${totalUnpaid.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-4">
                <p className="text-green-100 text-sm">Paid Today</p>
                <p className="text-3xl font-black">
                  ${totalPaidToday.toFixed(2)}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="container px-4 py-6">
        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search by table number or order number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-lg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Unpaid Orders */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-orange-600" />
            Awaiting Payment ({filteredDeliveredOrders.length})
          </h2>

          {filteredDeliveredOrders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-500 text-lg">
                  {searchQuery
                    ? "No matching orders"
                    : "No orders awaiting payment"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDeliveredOrders.map((order) => (
                <Card
                  key={order.id}
                  className="border-4 border-orange-500 shadow-lg"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-3xl font-black">
                        {order.orderType === "DINEIN" ? (
                          <>🪑 Table {order.tableNumber}</>
                        ) : (
                          <>📦 #{order.orderNumber}</>
                        )}
                      </div>
                      <Badge className="bg-orange-600 text-white text-lg px-4 py-2">
                        UNPAID
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </p>

                    <div className="space-y-2 mb-6">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center"
                        >
                          <div>
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-sm text-gray-600">
                              ${item.price.toFixed(2)} × {item.quantity}
                            </p>
                          </div>
                          <p className="font-bold text-orange-600">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="border-t-4 border-orange-600 pt-4 mb-6">
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold">TOTAL:</span>
                        <span className="text-3xl font-black text-green-600">
                          ${order.total.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={() => markAsPaid(order.id)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-bold"
                    >
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Mark as Paid
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Paid Orders */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            Paid Orders Today ({paidOrders.length})
          </h2>

          {paidOrders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-500 text-lg">No paid orders yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
              {paidOrders.map((order) => (
                <Card key={order.id} className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold">
                        {order.orderType === "DINEIN" ? (
                          <>🪑 Table {order.tableNumber}</>
                        ) : (
                          <>📦 #{order.orderNumber}</>
                        )}
                      </p>
                      <Badge className="bg-green-600 text-white">PAID</Badge>
                    </div>
                    <p className="text-xl font-bold text-green-600">
                      ${order.total.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </p>
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

export default function CounterPage() {
  return (
    <RoleGuard allowedRoles={["COUNTER"]}>
      <CounterPageContent />
    </RoleGuard>
  );
}
