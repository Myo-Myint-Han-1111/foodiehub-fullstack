"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Clock,
  RefreshCw,
  Volume2,
  VolumeX,
  ChefHat,
  Flame,
  UtensilsCrossed,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import RoleGuard from "@/components/RoleGuard";
import { apiFetch } from "@/lib/api-client";
import { useCachedFetch, invalidateCache } from "@/lib/use-cached-fetch";

// ---------- Types ----------

interface SetItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  itemStatus?: string;
}

interface SetOrder {
  id: string;
  orderNumber: number;
  orderType: string;
  tableNumber: string | null;
  total: number;
  status: string;
  createdAt: string;
  createdById: string | null;
}

interface KitchenSet {
  id: string;
  orderId: string;
  setNumber: number;
  status: string;
  sentAt: string | null;
  readyAt: string | null;
  updatedAt: string;
  createdAt: string;
  items: SetItem[];
  order: SetOrder;
}

// ---------- Component ----------

function KitchenPageContent() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { toast } = useToast();

  const previousPendingIdsRef = useRef<Set<string>>(new Set());
  const setTimestampsRef = useRef<Map<string, string>>(new Map());
  const [modifiedSetIds, setModifiedSetIds] = useState<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const soundInitializedRef = useRef(false);
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio("/notification.wav");
    audioRef.current.volume = 0.8;

    const initializeSound = () => {
      if (!soundInitializedRef.current && audioRef.current) {
        audioRef.current
          .play()
          .then(() => {
            audioRef.current!.pause();
            audioRef.current!.currentTime = 0;
            soundInitializedRef.current = true;
          })
          .catch(() => {});
      }
    };

    const events = ["click", "touchstart", "keydown", "mousemove"];
    events.forEach((event) => {
      document.addEventListener(event, initializeSound, { once: true });
    });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      events.forEach((event) => {
        document.removeEventListener(event, initializeSound);
      });
    };
  }, []);

  const playNotificationSound = useCallback(() => {
    if (soundEnabledRef.current && audioRef.current && soundInitializedRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }, []);

  const toastRef = useRef(toast);
  toastRef.current = toast;

  const handleNewData = useCallback(
    (newData: unknown, prevData: unknown | null) => {
      const newSets = newData as KitchenSet[];
      if (!prevData) return; // First load, skip notifications

      // Check for new PENDING sets
      const newPendingIds = new Set(
        newSets.filter((s) => s.status === "PENDING").map((s) => s.id)
      );
      if (previousPendingIdsRef.current.size > 0) {
        const brandNew = [...newPendingIds].filter(
          (id) => !previousPendingIdsRef.current.has(id)
        );
        if (brandNew.length > 0) {
          playNotificationSound();
          const newSet = newSets.find((s) => s.id === brandNew[0]);
          if (newSet) {
            toastRef.current({
              title: "New order received!",
              description: `Order #${newSet.order.orderNumber} Set ${newSet.setNumber} is ready to prepare.`,
              variant: "success",
            });
          }
        }
      }
      previousPendingIdsRef.current = newPendingIds;

      // Check for modified sets (updatedAt changed for existing sets)
      if (setTimestampsRef.current.size > 0) {
        const modified = new Set<string>();
        for (const set of newSets) {
          const prev = setTimestampsRef.current.get(set.id);
          if (prev && prev !== set.updatedAt) {
            modified.add(set.id);
            playNotificationSound();
            toastRef.current({
              title: "Heads up — Set Updated",
              description: `Order #${set.order.orderNumber} Set ${set.setNumber} has been modified. Please check the updated items.`,
            });
          }
        }
        if (modified.size > 0) {
          setModifiedSetIds(modified);
          setTimeout(() => setModifiedSetIds(new Set()), 15000);
        }
      }
      // Store current timestamps
      const newTimestamps = new Map<string, string>();
      for (const set of newSets) {
        newTimestamps.set(set.id, set.updatedAt);
      }
      setTimestampsRef.current = newTimestamps;
    },
    [playNotificationSound]
  );

  const { data: sets, isLoading: loading, refresh: fetchSets } = useCachedFetch<KitchenSet[]>(
    "/api/kitchen/orders",
    { pollInterval: 10000, maxAge: 5000, onData: handleNewData }
  );

  // ---------- Actions ----------

  const updateSetStatus = async (
    orderId: string,
    setId: string,
    newStatus: string
  ) => {
    try {
      const res = await apiFetch(
        `/api/kitchen/orders/${orderId}/sets/${setId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: newStatus }),
        }
      );
      const data = await res.json();
      if (data.success) {
        const label = newStatus === "PREPARING" ? "Preparing" : "Ready";
        toast({ title: `Marked as ${label}`, description: `Set has been updated successfully.`, variant: "success" });
        invalidateCache("/api/kitchen/orders");
        fetchSets();
      } else {
        toast({
          title: "Something went wrong",
          description: data.error || "Could not update the set. Please try again.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Something went wrong",
        description: "Could not update set status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // ---------- Derived ----------

  const allSets = sets || [];
  const pendingSets = allSets.filter((s) => s.status === "PENDING");
  const preparingSets = allSets.filter((s) => s.status === "PREPARING");
  const readySets = allSets.filter((s) => s.status === "READY");

  // ---------- Helpers ----------

  function timeAgo(dateStr: string | null) {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m ago`;
  }

  function elapsedMinutes(dateStr: string | null) {
    if (!dateStr) return 0;
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  }

  function urgencyClass(mins: number) {
    if (mins >= 20) return "border-red-500 bg-red-50";
    if (mins >= 10) return "border-orange-400 bg-orange-50";
    return "border-yellow-300";
  }

  // ---------- Set Card ----------

  function SetCard({
    set,
    action,
  }: {
    set: KitchenSet;
    action?: React.ReactNode;
  }) {
    const mins = elapsedMinutes(set.sentAt);
    const isModified = modifiedSetIds.has(set.id);
    const borderClass = isModified
      ? "border-purple-500 bg-purple-50"
      : set.status === "PENDING"
        ? urgencyClass(mins)
        : set.status === "PREPARING"
          ? "border-orange-300"
          : "border-green-300";

    const activeItems = set.items.filter((i) => !i.itemStatus || i.itemStatus === "ACTIVE");
    const changedItems = set.items.filter((i) => i.itemStatus === "CHANGED" || i.itemStatus === "CANCELLED" || i.itemStatus === "WASTED");

    return (
      <Card className={`border-2 ${borderClass} transition-all`}>
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">
                #{set.order.orderNumber}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  Set {set.setNumber}
                </span>
              </CardTitle>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {set.order.orderType === "DINEIN" ? "Dine-in" : "Takeaway"}
                </Badge>
                {set.order.tableNumber && (
                  <Badge variant="outline" className="text-xs">
                    T{set.order.tableNumber}
                  </Badge>
                )}
                {set.order.createdById === null && (
                  <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                    QR
                  </Badge>
                )}
                {isModified && (
                  <Badge className="text-xs bg-purple-100 text-purple-700 border-purple-300 border animate-pulse">
                    <AlertCircle className="h-3 w-3 mr-1" />MODIFIED
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {timeAgo(set.sentAt)}
              </div>
              {set.status === "PENDING" && mins >= 10 && (
                <span className="text-xs font-semibold text-red-600">
                  {mins}m
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="space-y-1">
            {activeItems.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="font-medium">
                  {item.quantity}x {item.name}
                </span>
              </div>
            ))}
            {changedItems.map((item) => (
              <div key={item.id} className="flex justify-between text-sm opacity-40 line-through">
                <span>{item.quantity}x {item.name}</span>
                <Badge variant="outline" className="text-xs">{item.itemStatus}</Badge>
              </div>
            ))}
          </div>
          {action && <div className="mt-3 pt-2 border-t">{action}</div>}
        </CardContent>
      </Card>
    );
  }

  // ---------- Render ----------

  if (loading) {
    return (
      <div className="container py-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-pond-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading kitchen display...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg">
        <div className="container px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ChefHat className="h-7 w-7" />
                Kitchen Display
              </h1>
              <p className="text-orange-100 text-sm mt-0.5">
                {pendingSets.length} pending · {preparingSets.length} preparing · {readySets.length} ready
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setSoundEnabled(!soundEnabled)}
                variant="secondary"
                size="icon"
                className="h-10 w-10"
                title={soundEnabled ? "Sound On" : "Sound Off"}
              >
                {soundEnabled ? (
                  <Volume2 className="h-5 w-5" />
                ) : (
                  <VolumeX className="h-5 w-5" />
                )}
              </Button>
              <Button
                onClick={fetchSets}
                variant="secondary"
                size="icon"
                className="h-10 w-10"
              >
                <RefreshCw className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[calc(100vh-120px)]">
          {/* PENDING Column */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Clock className="h-5 w-5 text-yellow-600" />
              <h2 className="text-lg font-bold text-yellow-700">PENDING</h2>
              <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 border">
                {pendingSets.length}
              </Badge>
            </div>
            {pendingSets.length === 0 ? (
              <Card className="border-dashed border-2 border-gray-300">
                <CardContent className="py-8 text-center">
                  <CheckCircle className="h-10 w-10 mx-auto text-green-400 mb-2" />
                  <p className="text-sm text-muted-foreground">No pending sets</p>
                </CardContent>
              </Card>
            ) : (
              pendingSets.map((set) => (
                <SetCard
                  key={set.id}
                  set={set}
                  action={
                    <Button
                      onClick={() =>
                        updateSetStatus(set.order.id, set.id, "PREPARING")
                      }
                      className="w-full bg-orange-500 hover:bg-orange-600"
                      size="sm"
                    >
                      <Flame className="h-4 w-4 mr-1" />
                      Start Preparing
                    </Button>
                  }
                />
              ))
            )}
          </div>

          {/* PREPARING Column */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Flame className="h-5 w-5 text-orange-600" />
              <h2 className="text-lg font-bold text-orange-700">PREPARING</h2>
              <Badge className="bg-orange-100 text-orange-700 border-orange-300 border">
                {preparingSets.length}
              </Badge>
            </div>
            {preparingSets.length === 0 ? (
              <Card className="border-dashed border-2 border-gray-300">
                <CardContent className="py-8 text-center">
                  <ChefHat className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nothing cooking
                  </p>
                </CardContent>
              </Card>
            ) : (
              preparingSets.map((set) => (
                <SetCard
                  key={set.id}
                  set={set}
                  action={
                    <Button
                      onClick={() =>
                        updateSetStatus(set.order.id, set.id, "READY")
                      }
                      className="w-full bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Mark Ready
                    </Button>
                  }
                />
              ))
            )}
          </div>

          {/* READY Column */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <UtensilsCrossed className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-bold text-green-700">READY</h2>
              <Badge className="bg-green-100 text-green-700 border-green-300 border">
                {readySets.length}
              </Badge>
            </div>
            {readySets.length === 0 ? (
              <Card className="border-dashed border-2 border-gray-300">
                <CardContent className="py-8 text-center">
                  <UtensilsCrossed className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No sets ready
                  </p>
                </CardContent>
              </Card>
            ) : (
              readySets.map((set) => (
                <SetCard
                  key={set.id}
                  set={set}
                  action={
                    <div className="text-center text-sm text-green-700 font-medium flex items-center justify-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      Ready — waiting for server
                    </div>
                  }
                />
              ))
            )}
          </div>
        </div>
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
