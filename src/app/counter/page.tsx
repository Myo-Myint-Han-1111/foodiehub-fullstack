"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DollarSign,
  Search,
  CheckCircle,
  RefreshCw,
  Volume2,
  VolumeX,
  Banknote,
  Smartphone,
  Clock,
  Receipt,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import RoleGuard from "@/components/RoleGuard";
import { apiFetch } from "@/lib/api-client";
import { useCachedFetch, invalidateCache } from "@/lib/use-cached-fetch";

// ---------- Types ----------

interface OrderItemData {
  id: string;
  name: string;
  quantity: number;
  price: number;
  itemStatus?: string;
}

interface OrderSetData {
  id: string;
  setNumber: number;
  status: string;
  items: OrderItemData[];
}

interface OrderData {
  id: string;
  orderNumber: number;
  orderType: string;
  tableNumber: string | null;
  subtotal: number;
  total: number;
  status: string;
  paid: boolean;
  paymentMethod: string | null;
  paidAt: string | null;
  createdAt: string;
  items: OrderItemData[];
  sets: OrderSetData[];
  createdBy?: { id: string; name: string } | null;
}

// ---------- Component ----------

function CounterPageContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { toast } = useToast();

  // Payment dialog
  const [payDialog, setPayDialog] = useState<{
    open: boolean;
    order: OrderData | null;
  }>({ open: false, order: null });
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [processing, setProcessing] = useState(false);

  const previousCountRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const soundInitializedRef = useRef(false);
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  useEffect(() => {
    audioRef.current = new Audio("/notification.wav");
    audioRef.current.volume = 0.8;
    const init = () => {
      if (!soundInitializedRef.current && audioRef.current) {
        audioRef.current.play().then(() => {
          audioRef.current!.pause();
          audioRef.current!.currentTime = 0;
          soundInitializedRef.current = true;
        }).catch(() => {});
      }
    };
    const events = ["click", "touchstart", "keydown"];
    events.forEach((e) => document.addEventListener(e, init, { once: true }));
    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      events.forEach((e) => document.removeEventListener(e, init));
    };
  }, []);

  const toastRef = useRef(toast);
  toastRef.current = toast;

  const handleNewData = useCallback((newData: unknown, prevData: unknown | null) => {
    if (!prevData) return;
    const newOrders = newData as OrderData[];
    const awaitingCount = newOrders.filter((o) => o.status === "READY_TO_PAY" && !o.paid).length;
    if (previousCountRef.current > 0 && awaitingCount > previousCountRef.current) {
      if (soundEnabledRef.current && audioRef.current && soundInitializedRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      toastRef.current({ title: "New order is ready!", description: "An order is waiting for payment.", variant: "success" });
    }
    previousCountRef.current = awaitingCount;
  }, []);

  const { data: orders, isLoading: loading, refresh: fetchOrders } = useCachedFetch<OrderData[]>(
    "/api/counter/orders",
    { pollInterval: 10000, maxAge: 5000, onData: handleNewData }
  );

  // ---------- Actions ----------

  const processPayment = async () => {
    if (!payDialog.order) return;
    setProcessing(true);
    try {
      const res = await apiFetch(`/api/counter/orders/${payDialog.order.id}/pay`, {
        method: "PATCH",
        body: JSON.stringify({ paymentMethod, autoClose: true }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Payment successful!", description: `Order #${payDialog.order.orderNumber} has been paid via ${paymentMethod}.`, variant: "success" });
        setPayDialog({ open: false, order: null });
        invalidateCache("/api/counter/orders");
        fetchOrders();
      } else {
        toast({ title: "Payment could not be processed", description: data.error || "Please try again.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Something went wrong", description: "Could not process payment. Please try again.", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  // ---------- Derived ----------

  const allOrders = orders || [];
  const awaitingOrders = allOrders.filter((o) => o.status === "READY_TO_PAY" && !o.paid);
  const paidOrders = allOrders.filter((o) => o.paid);

  const filteredAwaiting = searchQuery
    ? awaitingOrders.filter((o) =>
        o.orderNumber.toString().includes(searchQuery) ||
        (o.tableNumber && o.tableNumber.includes(searchQuery))
      )
    : awaitingOrders;

  const todayRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const avgOrderValue = paidOrders.length > 0 ? todayRevenue / paidOrders.length : 0;

  // ---------- Helpers ----------

  function getActiveItems(order: OrderData): OrderItemData[] {
    // Collect items from sets, filtering out non-active
    const items: OrderItemData[] = [];
    for (const set of order.sets) {
      if (set.status === "CANCELLED" || set.status === "WASTED") continue;
      for (const item of set.items) {
        if (!item.itemStatus || item.itemStatus === "ACTIVE") {
          items.push(item);
        }
      }
    }
    return items;
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m ago`;
  }

  function payMethodIcon(method: string) {
    switch (method) {
      case "CASH": return <Banknote className="h-4 w-4" />;
      case "SCAN": return <Smartphone className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  }

  // ---------- Render ----------

  if (loading) {
    return (
      <div className="container py-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg">
        <div className="container px-3 sm:px-4 py-3 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-3xl font-bold flex items-center gap-1.5 sm:gap-2">
                <Receipt className="h-5 w-5 sm:h-8 sm:w-8 flex-shrink-0" />
                <span className="truncate">Counter & Payment</span>
              </h1>
              <p className="text-emerald-100 mt-0.5 sm:mt-1 text-xs sm:text-base">Process payments for completed orders</p>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <Button
                onClick={() => setSoundEnabled(!soundEnabled)}
                variant="secondary"
                size="icon"
                className="h-8 w-8 sm:h-10 sm:w-10"
              >
                {soundEnabled ? <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" /> : <VolumeX className="h-4 w-4 sm:h-5 sm:w-5" />}
              </Button>
              <Button onClick={fetchOrders} variant="secondary" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
                <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container px-3 sm:px-4 py-4 sm:py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <Card>
            <CardContent className="pt-4 sm:pt-6 text-center">
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-yellow-600 mb-1" />
              <p className="text-xl sm:text-2xl font-bold">{awaitingOrders.length}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Awaiting Payment</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 sm:pt-6 text-center">
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-green-600 mb-1" />
              <p className="text-xl sm:text-2xl font-bold">{paidOrders.length}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Paid Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 sm:pt-6 text-center">
              <Banknote className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-emerald-600 mb-1" />
              <p className="text-xl sm:text-2xl font-bold">฿{todayRevenue.toFixed(0)}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Revenue Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 sm:pt-6 text-center">
              <Receipt className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-blue-600 mb-1" />
              <p className="text-xl sm:text-2xl font-bold">฿{avgOrderValue.toFixed(0)}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Avg Order Value</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-4 sm:mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order # or table..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Awaiting Payment */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-yellow-600" />
            Ready for Payment ({filteredAwaiting.length})
          </h2>

          {filteredAwaiting.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-green-400 mb-3" />
                <p className="text-lg font-semibold text-gray-700">All caught up!</p>
                <p className="text-sm text-muted-foreground">No orders awaiting payment</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredAwaiting.map((order) => {
                const activeItems = getActiveItems(order);
                return (
                  <Card key={order.id} className="border-2 border-yellow-300 hover:border-yellow-400 transition-colors">
                    <CardHeader className="px-3 sm:px-6 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <CardTitle className="text-lg sm:text-xl">Order #{order.orderNumber}</CardTitle>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] sm:text-xs">
                              {order.orderType === "DINEIN" ? "Dine-in" : "Takeaway"}
                            </Badge>
                            {order.tableNumber && (
                              <Badge variant="outline" className="text-[10px] sm:text-xs">Table {order.tableNumber}</Badge>
                            )}
                            <span className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />{timeAgo(order.createdAt)}
                            </span>
                          </div>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 border text-[10px] sm:text-xs flex-shrink-0 whitespace-nowrap">
                          READY TO PAY
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="px-3 sm:px-6">
                      {/* Items breakdown */}
                      <div className="space-y-1 mb-3">
                        {activeItems.map((item) => (
                          <div key={item.id} className="flex justify-between text-xs sm:text-sm">
                            <span className="truncate mr-2">{item.quantity}x {item.name}</span>
                            <span className="flex-shrink-0">฿{(item.price * item.quantity).toFixed(0)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Total */}
                      <div className="border-t pt-2 sm:pt-3 mb-3 sm:mb-4">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-base sm:text-lg">Total</span>
                          <span className="text-xl sm:text-2xl font-black text-green-600">฿{order.total.toFixed(0)}</span>
                        </div>
                      </div>

                      {/* Pay button */}
                      <Button
                        onClick={() => { setPayDialog({ open: true, order }); setPaymentMethod("CASH"); }}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-sm sm:text-lg h-10 sm:h-12"
                      >
                        <Banknote className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
                        Process Payment
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Payments */}
        {paidOrders.length > 0 && (
          <div>
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Recent Payments ({paidOrders.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {paidOrders.slice(0, 9).map((order) => (
                <Card key={order.id} className="opacity-80">
                  <CardContent className="pt-3 sm:pt-4 pb-2 sm:pb-3 px-3 sm:px-6">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm sm:text-base">Order #{order.orderNumber}</span>
                      <Badge className="bg-green-100 text-green-700 border-green-300 border text-[10px] sm:text-xs">PAID</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                        {order.paymentMethod && payMethodIcon(order.paymentMethod)}
                        <span>{order.paymentMethod || "CASH"}</span>
                        {order.tableNumber && <span>· T{order.tableNumber}</span>}
                      </div>
                      <span className="font-bold text-green-600">฿{order.total.toFixed(0)}</span>
                    </div>
                    {order.paidAt && (
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                        Paid {new Date(order.paidAt).toLocaleTimeString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Payment Dialog */}
      <Dialog open={payDialog.open} onOpenChange={(open) => { if (!open) setPayDialog({ open: false, order: null }); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Payment — Order #{payDialog.order?.orderNumber}
            </DialogTitle>
          </DialogHeader>
          {payDialog.order && (
            <div className="space-y-4 py-2">
              {/* Order summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex gap-2 mb-3">
                  <Badge variant="outline">{payDialog.order.orderType === "DINEIN" ? "Dine-in" : "Takeaway"}</Badge>
                  {payDialog.order.tableNumber && <Badge variant="outline">Table {payDialog.order.tableNumber}</Badge>}
                </div>
                <div className="space-y-1 mb-3">
                  {getActiveItems(payDialog.order).map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.name}</span>
                      <span>฿{(item.price * item.quantity).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-green-600">฿{payDialog.order.total.toFixed(0)}</span>
                  </div>
                </div>
              </div>

              {/* Payment method */}
              <div>
                <label className="text-sm font-medium mb-2 block">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "CASH", label: "Cash", icon: <Banknote className="h-5 w-5" /> },
                    { value: "SCAN", label: "Scan", icon: <Smartphone className="h-5 w-5" /> },
                  ].map((method) => (
                    <Button
                      key={method.value}
                      variant={paymentMethod === method.value ? "default" : "outline"}
                      className={`h-16 flex-col gap-1 ${paymentMethod === method.value ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
                      onClick={() => setPaymentMethod(method.value)}
                    >
                      {method.icon}
                      <span className="text-xs">{method.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialog({ open: false, order: null })}>
              Cancel
            </Button>
            <Button
              onClick={processPayment}
              disabled={processing}
              className="bg-emerald-600 hover:bg-emerald-700 min-w-32"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {processing ? "Processing..." : `Pay ฿${payDialog.order?.total.toFixed(0)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
