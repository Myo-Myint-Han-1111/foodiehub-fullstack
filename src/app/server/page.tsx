"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import RoleGuard from "@/components/RoleGuard";
import { apiFetch } from "@/lib/api-client";
import {
  Plus,
  Minus,
  Send,
  Save,
  RefreshCw,
  Check,
  X,
  Clock,
  ChefHat,
  ClipboardList,
  UtensilsCrossed,
  CreditCard,
  Bell,
  MapPin,
  Pencil,
  AlertTriangle,
  Trash2,
  ArrowRightLeft,
} from "lucide-react";

// ---------- Types ----------

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
}

interface OrderItemData {
  id: string;
  name: string;
  quantity: number;
  price: number;
  menuItemId?: string;
  itemStatus?: string;
}

interface OrderSetData {
  id: string;
  setNumber: number;
  status: string;
  sentAt: string | null;
  readyAt: string | null;
  servedAt: string | null;
  items: OrderItemData[];
}

interface OrderData {
  id: string;
  orderNumber: number;
  orderType: string;
  tableNumber: string | null;
  total: number;
  status: string;
  createdById: string | null;
  createdAt: string;
  items: OrderItemData[];
  sets: OrderSetData[];
  createdBy?: { id: string; name: string; role: string } | null;
}

interface CartEntry {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

// ---------- Constants ----------

const CATEGORIES = [
  "ALL",
  "PIZZA",
  "BURGERS",
  "PASTA",
  "SEAFOOD",
  "SALADS",
  "DESSERTS",
  "APPETIZERS",
  "DRINKS",
];

// ---------- Component ----------

function ServerPageContent() {
  const [activeTab, setActiveTab] = useState<
    "new-order" | "qr-orders" | "ready-serve" | "active-orders" | "tables"
  >("new-order");
  const { toast } = useToast();

  // Menu state
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // New Order form state
  const [orderType, setOrderType] = useState<"DINEIN" | "TAKEAWAY">("DINEIN");
  const [tableNumber, setTableNumber] = useState("");
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [creating, setCreating] = useState(false);

  // Orders state
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Reject dialog
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    orderId: string;
  }>({ open: false, orderId: "" });
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  // Add Set dialog
  const [addSetDialog, setAddSetDialog] = useState<{
    open: boolean;
    orderId: string;
    orderNumber: number;
  }>({ open: false, orderId: "", orderNumber: 0 });
  const [addSetCart, setAddSetCart] = useState<CartEntry[]>([]);
  const [addSetCategory, setAddSetCategory] = useState("ALL");
  const [addingSet, setAddingSet] = useState(false);

  // Edit Set dialog
  const [editSetDialog, setEditSetDialog] = useState<{
    open: boolean;
    orderId: string;
    orderNumber: number;
    set: OrderSetData | null;
  }>({ open: false, orderId: "", orderNumber: 0, set: null });
  const [editChanges, setEditChanges] = useState<Array<{
    type: "add" | "remove" | "updateQty" | "swap";
    itemId?: string;
    menuItemId?: string;
    name?: string;
    price?: number;
    quantity?: number;
    newMenuItemId?: string;
    newName?: string;
    newPrice?: number;
    newQuantity?: number;
  }>>([]);
  const [editReason, setEditReason] = useState("");
  const [editCategory, setEditCategory] = useState("ALL");
  const [savingEdit, setSavingEdit] = useState(false);

  // Request Change dialog (for PREPARING items)
  const [requestDialog, setRequestDialog] = useState<{
    open: boolean;
    orderId: string;
    orderNumber: number;
    item: OrderItemData | null;
    setStatus: string;
  }>({ open: false, orderId: "", orderNumber: 0, item: null, setStatus: "" });
  const [requestType, setRequestType] = useState<"CANCELLATION" | "MODIFICATION">("CANCELLATION");
  const [requestReason, setRequestReason] = useState("");
  const [requestNewMenuItemId, setRequestNewMenuItemId] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Cancel dialog (shared for set, order, and item cancellation)
  const [cancelDialog, setCancelDialog] = useState<{
    open: boolean;
    type: "set" | "order" | "item";
    orderId: string;
    orderNumber: number;
    setId?: string;
    setNumber?: number;
    itemId?: string;
    itemName?: string;
    setStatus?: string;
  }>({ open: false, type: "set", orderId: "", orderNumber: 0 });
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  // Sound for ready-to-serve
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const soundInitializedRef = useRef(false);
  const prevReadyCountRef = useRef(0);

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

  // ---------- Data Fetching ----------

  const fetchMenu = useCallback(async () => {
    try {
      const res = await fetch("/api/menu");
      const data = await res.json();
      if (data.success) setMenuItems(data.data);
    } catch {
      toast({ title: "Connection issue", description: "Could not load menu. Please refresh.", variant: "destructive" });
    } finally {
      setMenuLoading(false);
    }
  }, [toast]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await apiFetch("/api/server/orders");
      const data = await res.json();
      if (data.success) {
        const newOrders: OrderData[] = data.data;
        // Notify for newly-ready sets
        const readyCount = newOrders.reduce(
          (c, o) => c + o.sets.filter((s) => s.status === "READY").length, 0
        );
        if (prevReadyCountRef.current > 0 && readyCount > prevReadyCountRef.current) {
          if (soundInitializedRef.current && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {});
          }
          toast({ title: "Set is ready!", description: "A set is ready to be served.", variant: "success" });
        }
        prevReadyCountRef.current = readyCount;
        setOrders(newOrders);
      }
    } catch { /* silent */ }
    finally { setOrdersLoading(false); }
  }, [toast]);

  useEffect(() => { fetchMenu(); fetchOrders(); }, [fetchMenu, fetchOrders]);
  useEffect(() => {
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // ---------- Cart Helpers ----------

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id);
      if (existing) return prev.map((c) => c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const updateCartQty = (menuItemId: string, delta: number) => {
    setCart((prev) => prev.map((c) => c.menuItemId === menuItemId ? { ...c, quantity: c.quantity + delta } : c).filter((c) => c.quantity > 0));
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);

  const resetForm = () => { setCart([]); setOrderType("DINEIN"); setTableNumber(""); };

  // Add-set cart helpers
  const addToSetCart = (item: MenuItem) => {
    setAddSetCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id);
      if (existing) return prev.map((c) => c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const updateSetCartQty = (menuItemId: string, delta: number) => {
    setAddSetCart((prev) => prev.map((c) => c.menuItemId === menuItemId ? { ...c, quantity: c.quantity + delta } : c).filter((c) => c.quantity > 0));
  };

  const addSetCartTotal = addSetCart.reduce((sum, c) => sum + c.price * c.quantity, 0);

  // ---------- Actions ----------

  const createOrder = async (sendToKitchen: boolean) => {
    if (cart.length === 0) { toast({ title: "No items added", description: "Please add items to the order first.", variant: "destructive" }); return; }
    if (orderType === "DINEIN" && !tableNumber) { toast({ title: "Table required", description: "Please select a table number for dine-in orders.", variant: "destructive" }); return; }
    setCreating(true);
    try {
      const res = await apiFetch("/api/server/orders", {
        method: "POST",
        body: JSON.stringify({ orderType, tableNumber: orderType === "DINEIN" ? tableNumber : undefined, items: cart, sendToKitchen }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Order created!", description: sendToKitchen ? `Order #${data.data.orderNumber} has been sent to kitchen.` : `Order #${data.data.orderNumber} saved as draft.`, variant: "success" });
        resetForm(); fetchOrders();
      } else { toast({ title: "Could not create order", description: data.error || "Something went wrong. Please try again.", variant: "destructive" }); }
    } catch { toast({ title: "Something went wrong", description: "Could not create order. Please try again.", variant: "destructive" }); }
    finally { setCreating(false); }
  };

  const approveOrder = async (orderId: string) => {
    try {
      const res = await apiFetch(`/api/server/orders/${orderId}/approve`, { method: "PATCH" });
      const data = await res.json();
      if (data.success) { toast({ title: "Order approved!", description: "Order has been sent to kitchen.", variant: "success" }); fetchOrders(); }
      else { toast({ title: "Could not approve", description: data.error || "Something went wrong. Please try again.", variant: "destructive" }); }
    } catch { toast({ title: "Something went wrong", description: "Could not approve the order. Please try again.", variant: "destructive" }); }
  };

  const rejectOrder = async () => {
    if (!rejectReason.trim()) return;
    setRejecting(true);
    try {
      const res = await apiFetch(`/api/server/orders/${rejectDialog.orderId}/reject`, { method: "PATCH", body: JSON.stringify({ reason: rejectReason.trim() }) });
      const data = await res.json();
      if (data.success) { toast({ title: "Order rejected", description: "The QR order has been rejected.", variant: "success" }); setRejectDialog({ open: false, orderId: "" }); setRejectReason(""); fetchOrders(); }
      else { toast({ title: "Could not reject", description: data.error || "Something went wrong. Please try again.", variant: "destructive" }); }
    } catch { toast({ title: "Something went wrong", description: "Could not reject the order. Please try again.", variant: "destructive" }); }
    finally { setRejecting(false); }
  };

  const sendSetToKitchen = async (orderId: string, setId: string) => {
    try {
      const res = await apiFetch(`/api/server/orders/${orderId}/sets/${setId}/send`, { method: "PATCH" });
      const data = await res.json();
      if (data.success) { toast({ title: "Sent to kitchen!", description: "Set has been sent to the kitchen.", variant: "success" }); fetchOrders(); }
      else { toast({ title: "Could not send", description: data.error || "Something went wrong. Please try again.", variant: "destructive" }); }
    } catch { toast({ title: "Something went wrong", description: "Could not send the set. Please try again.", variant: "destructive" }); }
  };

  const markSetServed = async (orderId: string, setId: string) => {
    try {
      const res = await apiFetch(`/api/server/orders/${orderId}/sets/${setId}/serve`, { method: "PATCH" });
      const data = await res.json();
      if (data.success) { toast({ title: "Marked as served!", description: "The set has been served to the table.", variant: "success" }); fetchOrders(); }
      else { toast({ title: "Could not update", description: data.error || "Something went wrong. Please try again.", variant: "destructive" }); }
    } catch { toast({ title: "Something went wrong", description: "Could not mark the set as served. Please try again.", variant: "destructive" }); }
  };

  const markReadyToPay = async (orderId: string) => {
    try {
      const res = await apiFetch(`/api/server/orders/${orderId}/ready-to-pay`, { method: "PATCH" });
      const data = await res.json();
      if (data.success) { toast({ title: "Ready to pay!", description: "Order has been sent to the counter.", variant: "success" }); fetchOrders(); }
      else { toast({ title: "Could not update", description: data.error || "Something went wrong. Please try again.", variant: "destructive" }); }
    } catch { toast({ title: "Something went wrong", description: "Could not update the order. Please try again.", variant: "destructive" }); }
  };

  const addSetToOrder = async (sendToKitchen: boolean) => {
    if (addSetCart.length === 0) { toast({ title: "No items added", description: "Please add items to the set first.", variant: "destructive" }); return; }
    setAddingSet(true);
    try {
      const res = await apiFetch(`/api/server/orders/${addSetDialog.orderId}/sets`, {
        method: "POST",
        body: JSON.stringify({ items: addSetCart, sendToKitchen }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Set added!", description: sendToKitchen ? "New set has been sent to kitchen." : "New set saved as draft.", variant: "success" });
        setAddSetDialog({ open: false, orderId: "", orderNumber: 0 }); setAddSetCart([]); setAddSetCategory("ALL"); fetchOrders();
      } else { toast({ title: "Could not add set", description: data.error || "Something went wrong. Please try again.", variant: "destructive" }); }
    } catch { toast({ title: "Something went wrong", description: "Could not add the set. Please try again.", variant: "destructive" }); }
    finally { setAddingSet(false); }
  };

  // ---------- Edit Set Actions ----------

  const openEditDialog = (order: OrderData, set: OrderSetData) => {
    setEditSetDialog({ open: true, orderId: order.id, orderNumber: order.orderNumber, set });
    setEditChanges([]);
    setEditReason("");
    setEditCategory("ALL");
  };

  // Build a "working copy" of items with edit changes applied for display
  const getEditedItems = (): OrderItemData[] => {
    if (!editSetDialog.set) return [];
    const items = [...editSetDialog.set.items.filter((i) => i.itemStatus !== "CHANGED" && i.itemStatus !== "CANCELLED" && i.itemStatus !== "WASTED")];
    const result: OrderItemData[] = [];

    for (const item of items) {
      const removeChange = editChanges.find((c) => c.type === "remove" && c.itemId === item.id);
      if (removeChange) continue;

      const qtyChange = editChanges.find((c) => c.type === "updateQty" && c.itemId === item.id);
      const swapChange = editChanges.find((c) => c.type === "swap" && c.itemId === item.id);

      if (swapChange) {
        result.push({
          id: item.id,
          name: swapChange.newName || item.name,
          quantity: swapChange.newQuantity || item.quantity,
          price: swapChange.newPrice || item.price,
          menuItemId: swapChange.newMenuItemId || item.menuItemId,
          itemStatus: "ACTIVE",
        });
      } else if (qtyChange) {
        result.push({ ...item, quantity: qtyChange.quantity || item.quantity });
      } else {
        result.push(item);
      }
    }

    // Add new items
    const addChanges = editChanges.filter((c) => c.type === "add");
    for (const add of addChanges) {
      result.push({
        id: `new-${add.menuItemId}`,
        name: add.name || "",
        quantity: add.quantity || 1,
        price: add.price || 0,
        menuItemId: add.menuItemId,
        itemStatus: "ACTIVE",
      });
    }

    return result;
  };

  const addEditItem = (menuItem: MenuItem) => {
    const existingAdd = editChanges.find((c) => c.type === "add" && c.menuItemId === menuItem.id);
    if (existingAdd) {
      setEditChanges((prev) => prev.map((c) => c === existingAdd ? { ...c, quantity: (c.quantity || 1) + 1 } : c));
    } else {
      setEditChanges((prev) => [...prev, { type: "add", menuItemId: menuItem.id, name: menuItem.name, price: menuItem.price, quantity: 1 }]);
    }
  };

  const removeEditItem = (itemId: string) => {
    // Check if it's a newly added item
    const isNew = itemId.startsWith("new-");
    if (isNew) {
      const menuItemId = itemId.replace("new-", "");
      setEditChanges((prev) => prev.filter((c) => !(c.type === "add" && c.menuItemId === menuItemId)));
    } else {
      // Remove existing item
      setEditChanges((prev) => {
        const filtered = prev.filter((c) => c.itemId !== itemId);
        return [...filtered, { type: "remove" as const, itemId }];
      });
    }
  };

  const updateEditItemQty = (itemId: string, newQty: number) => {
    if (newQty < 1) { removeEditItem(itemId); return; }
    const isNew = itemId.startsWith("new-");
    if (isNew) {
      const menuItemId = itemId.replace("new-", "");
      setEditChanges((prev) => prev.map((c) => c.type === "add" && c.menuItemId === menuItemId ? { ...c, quantity: newQty } : c));
    } else {
      setEditChanges((prev) => {
        const filtered = prev.filter((c) => !(c.type === "updateQty" && c.itemId === itemId));
        return [...filtered, { type: "updateQty" as const, itemId, quantity: newQty }];
      });
    }
  };

  const saveEditChanges = async () => {
    if (editChanges.length === 0) {
      toast({ title: "No changes", description: "No modifications were made." });
      return;
    }
    if (editSetDialog.set?.status === "PENDING" && !editReason.trim()) {
      toast({ title: "Reason needed", description: "Please provide a reason for editing a pending set.", variant: "destructive" });
      return;
    }
    setSavingEdit(true);
    try {
      const res = await apiFetch(
        `/api/server/orders/${editSetDialog.orderId}/sets/${editSetDialog.set?.id}/items`,
        {
          method: "PATCH",
          body: JSON.stringify({
            changes: editChanges,
            reason: editReason.trim() || undefined,
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        toast({ title: "Changes saved!", description: "Set items have been updated.", variant: "success" });
        setEditSetDialog({ open: false, orderId: "", orderNumber: 0, set: null });
        setEditChanges([]);
        setEditReason("");
        fetchOrders();
      } else {
        toast({ title: "Could not save", description: data.error || "Something went wrong. Please try again.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Something went wrong", description: "Could not save the changes. Please try again.", variant: "destructive" });
    } finally {
      setSavingEdit(false);
    }
  };

  // ---------- Request Change Actions (PREPARING items) ----------

  const submitRequest = async () => {
    if (!requestReason.trim()) {
      toast({ title: "Reason needed", description: "Please provide a reason for the request.", variant: "destructive" });
      return;
    }
    if (requestType === "MODIFICATION" && !requestNewMenuItemId) {
      toast({ title: "Replacement needed", description: "Please select a replacement item.", variant: "destructive" });
      return;
    }
    setSubmittingRequest(true);
    try {
      const res = await apiFetch("/api/server/requests", {
        method: "POST",
        body: JSON.stringify({
          type: requestType,
          itemId: requestDialog.item?.id,
          orderId: requestDialog.orderId,
          reason: requestReason.trim(),
          newMenuItemId: requestType === "MODIFICATION" ? requestNewMenuItemId : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Request submitted!", description: "Your request is waiting for admin approval.", variant: "success" });
        setRequestDialog({ open: false, orderId: "", orderNumber: 0, item: null, setStatus: "" });
        setRequestReason("");
        setRequestNewMenuItemId("");
        fetchOrders();
      } else {
        toast({ title: "Could not submit", description: data.error || "Something went wrong. Please try again.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Something went wrong", description: "Could not submit the request. Please try again.", variant: "destructive" });
    } finally {
      setSubmittingRequest(false);
    }
  };

  // ---------- Cancel Actions ----------

  const executeCancellation = async () => {
    const { type, orderId, setId, itemId } = cancelDialog;
    const needsReason = cancelDialog.setStatus !== "DRAFT";

    if (needsReason && !cancelReason.trim()) {
      toast({ title: "Reason needed", description: "Please provide a reason for cancellation.", variant: "destructive" });
      return;
    }

    setCancelling(true);
    try {
      let url = "";
      if (type === "order") {
        url = `/api/server/orders/${orderId}/cancel`;
      } else if (type === "set") {
        url = `/api/server/orders/${orderId}/sets/${setId}/cancel`;
      } else if (type === "item") {
        url = `/api/server/orders/${orderId}/sets/${setId}/items/${itemId}/cancel`;
      }

      const res = await apiFetch(url, {
        method: "PATCH",
        body: JSON.stringify({ reason: cancelReason.trim() || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        const label = type === "order" ? "Order" : type === "set" ? "Set" : "Item";
        toast({ title: `${label} cancelled`, description: `The ${label.toLowerCase()} has been cancelled.`, variant: "success" });
        setCancelDialog({ open: false, type: "set", orderId: "", orderNumber: 0 });
        setCancelReason("");
        fetchOrders();
      } else {
        toast({ title: "Could not cancel", description: data.error || "Something went wrong. Please try again.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Something went wrong", description: "Could not process the cancellation. Please try again.", variant: "destructive" });
    } finally {
      setCancelling(false);
    }
  };

  const openCancelSetDialog = (order: OrderData, set: OrderSetData) => {
    setCancelDialog({
      open: true,
      type: "set",
      orderId: order.id,
      orderNumber: order.orderNumber,
      setId: set.id,
      setNumber: set.setNumber,
      setStatus: set.status,
    });
    setCancelReason("");
  };

  const openCancelOrderDialog = (order: OrderData) => {
    setCancelDialog({
      open: true,
      type: "order",
      orderId: order.id,
      orderNumber: order.orderNumber,
      setStatus: order.sets.some((s) => ["PREPARING", "READY", "SERVED"].includes(s.status)) ? "PREPARING" : "DRAFT",
    });
    setCancelReason("");
  };

  const openCancelItemDialog = (order: OrderData, set: OrderSetData, item: OrderItemData) => {
    setCancelDialog({
      open: true,
      type: "item",
      orderId: order.id,
      orderNumber: order.orderNumber,
      setId: set.id,
      setNumber: set.setNumber,
      itemId: item.id,
      itemName: item.name,
      setStatus: set.status,
    });
    setCancelReason("");
  };

  // ---------- Derived Data ----------

  const filteredMenu = selectedCategory === "ALL" ? menuItems.filter((m) => m.available) : menuItems.filter((m) => m.category === selectedCategory && m.available);
  const addSetFilteredMenu = addSetCategory === "ALL" ? menuItems.filter((m) => m.available) : menuItems.filter((m) => m.category === addSetCategory && m.available);
  const editFilteredMenu = editCategory === "ALL" ? menuItems.filter((m) => m.available) : menuItems.filter((m) => m.category === editCategory && m.available);

  const qrOrders = orders.filter((o) => o.createdById === null && o.status !== "CANCELLED" && o.sets.some((s) => s.status === "DRAFT"));

  const readySets: { set: OrderSetData; order: OrderData }[] = [];
  orders.forEach((o) => o.sets.filter((s) => s.status === "READY").forEach((s) => readySets.push({ set: s, order: o })));
  readySets.sort((a, b) => new Date(a.set.readyAt || 0).getTime() - new Date(b.set.readyAt || 0).getTime());

  const activeOrders = orders.filter((o) => o.status !== "CANCELLED" && o.status !== "CLOSED");

  // Table overview: group active dine-in orders by table
  const tableMap = new Map<string, OrderData[]>();
  activeOrders.filter((o) => o.orderType === "DINEIN" && o.tableNumber).forEach((o) => {
    const t = o.tableNumber!;
    if (!tableMap.has(t)) tableMap.set(t, []);
    tableMap.get(t)!.push(o);
  });
  const occupiedTables = Array.from(tableMap.entries()).sort((a, b) => Number(a[0]) - Number(b[0]));

  // ---------- Helpers ----------

  function getSetStatusColor(status: string) {
    const map: Record<string, string> = {
      DRAFT: "bg-gray-100 text-gray-700 border-gray-300",
      PENDING: "bg-yellow-100 text-yellow-700 border-yellow-300",
      PREPARING: "bg-orange-100 text-orange-700 border-orange-300",
      READY: "bg-green-100 text-green-700 border-green-300",
      SERVED: "bg-blue-100 text-blue-700 border-blue-300",
      CANCELLED: "bg-red-100 text-red-700 border-red-300",
      WASTED: "bg-red-100 text-red-700 border-red-300",
    };
    return map[status] || "bg-gray-100 text-gray-700 border-gray-300";
  }

  function getOrderStatusColor(status: string) {
    const map: Record<string, string> = {
      OPEN: "bg-yellow-100 text-yellow-700 border-yellow-300",
      READY_TO_PAY: "bg-blue-100 text-blue-700 border-blue-300",
      PAID: "bg-green-100 text-green-700 border-green-300",
      CLOSED: "bg-gray-100 text-gray-700 border-gray-300",
      CANCELLED: "bg-red-100 text-red-700 border-red-300",
    };
    return map[status] || "";
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  // Check if all non-cancelled sets are SERVED (can mark ready-to-pay)
  function canMarkReadyToPay(order: OrderData) {
    if (order.status !== "OPEN") return false;
    const activeSets = order.sets.filter((s) => s.status !== "CANCELLED" && s.status !== "WASTED");
    return activeSets.length > 0 && activeSets.every((s) => s.status === "SERVED");
  }

  // ---------- Tab definitions ----------

  const tabs = [
    { key: "new-order" as const, label: "New Order", icon: <Plus className="h-4 w-4" /> },
    { key: "qr-orders" as const, label: "QR Orders", icon: <ClipboardList className="h-4 w-4" />, badge: qrOrders.length },
    { key: "ready-serve" as const, label: "Ready to Serve", icon: <Bell className="h-4 w-4" />, badge: readySets.length },
    { key: "active-orders" as const, label: "Active Orders", icon: <ChefHat className="h-4 w-4" />, badge: activeOrders.length },
    { key: "tables" as const, label: "Tables", icon: <MapPin className="h-4 w-4" /> },
  ];

  // ---------- Render Set row (reused in active orders) ----------

  function SetRow({ set, order }: { set: OrderSetData; order: OrderData }) {
    const activeItems = set.items.filter((i) => !i.itemStatus || i.itemStatus === "ACTIVE");
    const canEdit = set.status === "DRAFT" || set.status === "PENDING";
    const canRequest = set.status === "PREPARING";
    const canCancelSet = !["CANCELLED", "WASTED"].includes(set.status);

    return (
      <div className="border rounded-lg p-3 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Set {set.setNumber}</span>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Badge className={`${getSetStatusColor(set.status)} border text-xs`}>{set.status}</Badge>
            {canEdit && (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openEditDialog(order, set)}>
                <Pencil className="h-3 w-3 mr-1" />Edit
              </Button>
            )}
            {set.status === "DRAFT" && (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => sendSetToKitchen(order.id, set.id)}>
                <Send className="h-3 w-3 mr-1" />Send
              </Button>
            )}
            {set.status === "READY" && (
              <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700" onClick={() => markSetServed(order.id, set.id)}>
                <UtensilsCrossed className="h-3 w-3 mr-1" />Serve
              </Button>
            )}
            {canCancelSet && (
              <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => openCancelSetDialog(order, set)}>
                <X className="h-3 w-3 mr-1" />Cancel
              </Button>
            )}
          </div>
        </div>
        <div className="space-y-1">
          {activeItems.map((item) => (
            <div key={item.id} className="flex justify-between text-sm group">
              <div className="flex items-center gap-1">
                <span>{item.quantity}x {item.name}</span>
                {canRequest && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-5 px-1 text-xs text-orange-600 hover:text-orange-700"
                    onClick={() => {
                      setRequestDialog({ open: true, orderId: order.id, orderNumber: order.orderNumber, item, setStatus: set.status });
                      setRequestType("CANCELLATION");
                      setRequestReason("");
                      setRequestNewMenuItemId("");
                    }}
                  >
                    <AlertTriangle className="h-3 w-3" />
                  </Button>
                )}
                {activeItems.length > 1 && !canRequest && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-5 px-1 text-xs text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => openCancelItemDialog(order, set, item)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <span className="text-muted-foreground">฿{(item.price * item.quantity).toFixed(0)}</span>
            </div>
          ))}
          {/* Show changed/cancelled items dimmed */}
          {set.items.filter((i) => i.itemStatus === "CHANGED" || i.itemStatus === "CANCELLED" || i.itemStatus === "WASTED").map((item) => (
            <div key={item.id} className="flex justify-between text-sm opacity-40 line-through">
              <span>{item.quantity}x {item.name}</span>
              <Badge className="text-xs" variant="outline">{item.itemStatus}</Badge>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500 to-cyan-700 text-white shadow-lg">
        <div className="container px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Manage Tables & Orders</h1>
            </div>
            <Button onClick={() => fetchOrders()} variant="secondary" size="icon" className="h-10 w-10">
              <RefreshCw className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container px-4 pt-4">
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map((tab) => (
            <Button key={tab.key} onClick={() => setActiveTab(tab.key)} variant={activeTab === tab.key ? "default" : "outline"} className="flex items-center gap-2">
              {tab.icon}
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <Badge className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5">{tab.badge}</Badge>
              )}
            </Button>
          ))}
        </div>
      </div>

      <div className="container px-4">
        {/* ==================== TAB 1: New Order ==================== */}
        {activeTab === "new-order" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-4 items-end">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Order Type</label>
                      <div className="flex gap-2">
                        <Button size="sm" variant={orderType === "DINEIN" ? "default" : "outline"} onClick={() => setOrderType("DINEIN")}>Dine-in</Button>
                        <Button size="sm" variant={orderType === "TAKEAWAY" ? "default" : "outline"} onClick={() => setOrderType("TAKEAWAY")}>Takeaway</Button>
                      </div>
                    </div>
                    {orderType === "DINEIN" && (
                      <div className="w-40">
                        <label className="text-sm font-medium mb-1 block">Table</label>
                        <Select value={tableNumber} onValueChange={setTableNumber}>
                          <SelectTrigger><SelectValue placeholder="Select table" /></SelectTrigger>
                          <SelectContent className="max-h-60 overflow-y-auto">
                            {Array.from({ length: 100 }, (_, i) => (
                              <SelectItem key={i + 1} value={String(i + 1)}>Table {i + 1}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map((cat) => (
                  <Button key={cat} size="sm" variant={selectedCategory === cat ? "default" : "outline"} onClick={() => setSelectedCategory(cat)}>
                    {cat === "ALL" ? "All" : cat.charAt(0) + cat.slice(1).toLowerCase()}
                  </Button>
                ))}
              </div>
              {menuLoading ? (
                <div className="text-center py-8 text-gray-500">Loading menu...</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filteredMenu.map((item) => {
                    const inCart = cart.find((c) => c.menuItemId === item.id);
                    return (
                      <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => addToCart(item)}>
                        <CardContent className="p-3">
                          <p className="font-medium text-sm truncate">{item.name}</p>
                          <p className="text-sm text-green-600 font-semibold">฿{item.price}</p>
                          {inCart && <Badge className="mt-1 bg-cyan-100 text-cyan-700 text-xs">x{inCart.quantity}</Badge>}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
            <div>
              <Card className="sticky top-4">
                <CardHeader><CardTitle className="text-lg">Order Summary</CardTitle></CardHeader>
                <CardContent>
                  {cart.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Click menu items to add</p>
                  ) : (
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <div key={item.menuItemId} className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">฿{item.price} each</p>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateCartQty(item.menuItemId, -1)}><Minus className="h-3 w-3" /></Button>
                            <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateCartQty(item.menuItemId, 1)}><Plus className="h-3 w-3" /></Button>
                          </div>
                          <p className="text-sm font-semibold ml-3 w-16 text-right">฿{(item.price * item.quantity).toFixed(0)}</p>
                        </div>
                      ))}
                      <div className="border-t pt-3 mt-3">
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total</span>
                          <span className="text-green-600">฿{cartTotal.toFixed(0)}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <Button variant="outline" onClick={() => createOrder(false)} disabled={creating}><Save className="h-4 w-4 mr-1" />Save Draft</Button>
                        <Button onClick={() => createOrder(true)} disabled={creating} className="bg-cyan-600 hover:bg-cyan-700"><Send className="h-4 w-4 mr-1" />Send</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: QR Orders ==================== */}
        {activeTab === "qr-orders" && (
          <div className="max-w-3xl mx-auto space-y-4">
            {ordersLoading ? <div className="text-center py-8 text-gray-500">Loading...</div>
            : qrOrders.length === 0 ? (
              <Card><CardContent className="py-12 text-center">
                <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-lg font-semibold text-gray-700">No pending QR orders</p>
                <p className="text-sm text-muted-foreground mt-1">QR customer orders will appear here for approval</p>
              </CardContent></Card>
            ) : qrOrders.map((order) => (
              <Card key={order.id} className="border-l-4 border-l-yellow-400">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Order #{order.orderNumber}</CardTitle>
                      <div className="flex gap-3 text-sm text-muted-foreground mt-1">
                        <span>{order.orderType === "DINEIN" ? "Dine-in" : "Takeaway"}</span>
                        {order.tableNumber && <span>Table {order.tableNumber}</span>}
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{timeAgo(order.createdAt)}</span>
                      </div>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-700 border border-yellow-300">Awaiting Approval</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 mb-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.name}</span>
                        <span className="font-medium">฿{(item.price * item.quantity).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center border-t pt-3">
                    <span className="font-bold text-lg">Total: ฿{order.total.toFixed(0)}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => setRejectDialog({ open: true, orderId: order.id })}>
                        <X className="h-4 w-4 mr-1" />Reject
                      </Button>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => approveOrder(order.id)}>
                        <Check className="h-4 w-4 mr-1" />Approve & Send
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ==================== TAB 3: Ready to Serve ==================== */}
        {activeTab === "ready-serve" && (
          <div className="max-w-3xl mx-auto space-y-4">
            {readySets.length === 0 ? (
              <Card><CardContent className="py-12 text-center">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-lg font-semibold text-gray-700">No sets ready to serve</p>
                <p className="text-sm text-muted-foreground mt-1">Sets will appear here when the kitchen marks them ready</p>
              </CardContent></Card>
            ) : readySets.map(({ set, order }) => (
              <Card key={set.id} className="border-l-4 border-l-green-500">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Order #{order.orderNumber} <span className="text-sm font-normal text-muted-foreground">Set {set.setNumber}</span>
                      </CardTitle>
                      <div className="flex gap-3 text-sm text-muted-foreground mt-1">
                        <span>{order.orderType === "DINEIN" ? "Dine-in" : "Takeaway"}</span>
                        {order.tableNumber && <span>Table {order.tableNumber}</span>}
                        {set.readyAt && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Ready {timeAgo(set.readyAt)}</span>}
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700 border border-green-300">READY</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 mb-3">
                    {set.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-3">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => markSetServed(order.id, set.id)}>
                      <UtensilsCrossed className="h-4 w-4 mr-2" />Mark as Served
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ==================== TAB 4: Active Orders ==================== */}
        {activeTab === "active-orders" && (
          <div className="max-w-4xl mx-auto space-y-4">
            {ordersLoading ? <div className="text-center py-8 text-gray-500">Loading...</div>
            : activeOrders.length === 0 ? (
              <Card><CardContent className="py-12 text-center">
                <ChefHat className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-lg font-semibold text-gray-700">No active orders</p>
              </CardContent></Card>
            ) : activeOrders.map((order) => (
              <Card key={order.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Order #{order.orderNumber}</CardTitle>
                      <div className="flex gap-3 text-sm text-muted-foreground mt-1">
                        <span>{order.orderType === "DINEIN" ? "Dine-in" : "Takeaway"}</span>
                        {order.tableNumber && <span>Table {order.tableNumber}</span>}
                        <span>{timeAgo(order.createdAt)}</span>
                        {order.createdById === null && <Badge variant="outline" className="text-xs">QR</Badge>}
                      </div>
                    </div>
                    <Badge className={`${getOrderStatusColor(order.status)} border`}>{order.status.replace("_", " ")}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {order.sets.length > 0 && (
                    <div className="space-y-3">
                      {order.sets.map((set) => <SetRow key={set.id} set={set} order={order} />)}
                    </div>
                  )}
                  <div className="flex justify-between items-center border-t pt-3 mt-3">
                    <span className="font-bold">Total: ฿{order.total.toFixed(0)}</span>
                    <div className="flex gap-2">
                      {order.status === "OPEN" && (
                        <Button size="sm" variant="outline" onClick={() => { setAddSetDialog({ open: true, orderId: order.id, orderNumber: order.orderNumber }); setAddSetCart([]); setAddSetCategory("ALL"); }}>
                          <Plus className="h-4 w-4 mr-1" />Add Set
                        </Button>
                      )}
                      {canMarkReadyToPay(order) && (
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => markReadyToPay(order.id)}>
                          <CreditCard className="h-4 w-4 mr-1" />Ready to Pay
                        </Button>
                      )}
                      {order.status !== "CANCELLED" && order.status !== "CLOSED" && order.status !== "PAID" && (
                        <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => openCancelOrderDialog(order)}>
                          <X className="h-4 w-4 mr-1" />Cancel Order
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ==================== TAB 5: Tables ==================== */}
        {activeTab === "tables" && (
          <div className="space-y-6">
            {/* Occupied tables */}
            {occupiedTables.length === 0 ? (
              <Card><CardContent className="py-12 text-center">
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-lg font-semibold text-gray-700">No occupied tables</p>
              </CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {occupiedTables.map(([tbl, tblOrders]) => {
                  const hasReady = tblOrders.some((o) => o.sets.some((s) => s.status === "READY"));
                  const allServed = tblOrders.every((o) => o.sets.filter((s) => s.status !== "CANCELLED" && s.status !== "WASTED").every((s) => s.status === "SERVED"));
                  return (
                    <Card key={tbl} className={`border-2 ${hasReady ? "border-green-400 bg-green-50" : allServed ? "border-blue-300 bg-blue-50" : "border-gray-200"}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Table {tbl}
                          </CardTitle>
                          {hasReady && <Badge className="bg-green-100 text-green-700 border-green-300 border">READY</Badge>}
                          {!hasReady && allServed && <Badge className="bg-blue-100 text-blue-700 border-blue-300 border">ALL SERVED</Badge>}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {tblOrders.map((o) => (
                            <div key={o.id} className="text-sm border rounded p-2 bg-white">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">#{o.orderNumber}</span>
                                <Badge className={`${getOrderStatusColor(o.status)} border text-xs`}>{o.status.replace("_", " ")}</Badge>
                              </div>
                              <div className="flex gap-2 mt-1 flex-wrap">
                                {o.sets.map((s) => (
                                  <Badge key={s.id} className={`${getSetStatusColor(s.status)} border text-xs`}>
                                    S{s.setNumber}: {s.status}
                                  </Badge>
                                ))}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">฿{o.total.toFixed(0)} · {o.items.length} items</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Table grid overview */}
            <Card>
              <CardHeader><CardTitle className="text-lg">All Tables</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {Array.from({ length: 30 }, (_, i) => {
                    const t = String(i + 1);
                    const isOccupied = tableMap.has(t);
                    const tOrders = tableMap.get(t);
                    const hasReady = tOrders?.some((o) => o.sets.some((s) => s.status === "READY"));
                    return (
                      <div
                        key={t}
                        className={`aspect-square rounded-lg flex items-center justify-center text-sm font-semibold border-2 ${
                          hasReady
                            ? "bg-green-100 border-green-500 text-green-700"
                            : isOccupied
                              ? "bg-cyan-100 border-cyan-400 text-cyan-700"
                              : "bg-gray-50 border-gray-200 text-gray-400"
                        }`}
                      >
                        {t}
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-50 border-2 border-gray-200 inline-block"></span> Empty</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-cyan-100 border-2 border-cyan-400 inline-block"></span> Occupied</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 border-2 border-green-500 inline-block"></span> Ready</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => { if (!open) { setRejectDialog({ open: false, orderId: "" }); setRejectReason(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject QR Order</DialogTitle></DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Reason for rejection</label>
            <Input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g. Item out of stock" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectDialog({ open: false, orderId: "" }); setRejectReason(""); }}>Cancel</Button>
            <Button variant="destructive" onClick={rejectOrder} disabled={!rejectReason.trim() || rejecting}>{rejecting ? "Rejecting..." : "Reject Order"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Set Dialog */}
      <Dialog open={addSetDialog.open} onOpenChange={(open) => { if (!open) { setAddSetDialog({ open: false, orderId: "", orderNumber: 0 }); setAddSetCart([]); setAddSetCategory("ALL"); } }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Set to Order #{addSetDialog.orderNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((cat) => (
                <Button key={cat} size="sm" variant={addSetCategory === cat ? "default" : "outline"} onClick={() => setAddSetCategory(cat)}>
                  {cat === "ALL" ? "All" : cat.charAt(0) + cat.slice(1).toLowerCase()}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {addSetFilteredMenu.map((item) => {
                const inCart = addSetCart.find((c) => c.menuItemId === item.id);
                return (
                  <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => addToSetCart(item)}>
                    <CardContent className="p-2">
                      <p className="font-medium text-xs truncate">{item.name}</p>
                      <p className="text-xs text-green-600 font-semibold">฿{item.price}</p>
                      {inCart && <Badge className="mt-0.5 bg-cyan-100 text-cyan-700 text-xs">x{inCart.quantity}</Badge>}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {addSetCart.length > 0 && (
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    {addSetCart.map((item) => (
                      <div key={item.menuItemId} className="flex items-center justify-between">
                        <span className="text-sm flex-1 truncate">{item.name}</span>
                        <div className="flex items-center gap-1 ml-2">
                          <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateSetCartQty(item.menuItemId, -1)}><Minus className="h-3 w-3" /></Button>
                          <span className="text-sm w-5 text-center">{item.quantity}</span>
                          <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateSetCartQty(item.menuItemId, 1)}><Plus className="h-3 w-3" /></Button>
                        </div>
                        <span className="text-sm font-semibold ml-2 w-14 text-right">฿{(item.price * item.quantity).toFixed(0)}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>Total</span>
                      <span className="text-green-600">฿{addSetCartTotal.toFixed(0)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddSetDialog({ open: false, orderId: "", orderNumber: 0 }); setAddSetCart([]); }}>Cancel</Button>
            <Button variant="outline" onClick={() => addSetToOrder(false)} disabled={addSetCart.length === 0 || addingSet}><Save className="h-4 w-4 mr-1" />Save Draft</Button>
            <Button onClick={() => addSetToOrder(true)} disabled={addSetCart.length === 0 || addingSet} className="bg-cyan-600 hover:bg-cyan-700"><Send className="h-4 w-4 mr-1" />Send to Kitchen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Set Dialog */}
      <Dialog open={editSetDialog.open} onOpenChange={(open) => { if (!open) { setEditSetDialog({ open: false, orderId: "", orderNumber: 0, set: null }); setEditChanges([]); setEditReason(""); } }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit Set {editSetDialog.set?.setNumber} — Order #{editSetDialog.orderNumber}
              {editSetDialog.set?.status === "PENDING" && (
                <Badge className="ml-2 bg-yellow-100 text-yellow-700 border-yellow-300 border text-xs">PENDING — Kitchen will be notified</Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Current items with edit controls */}
            <div>
              <h4 className="text-sm font-medium mb-2">Current Items</h4>
              <div className="space-y-2">
                {getEditedItems().map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-white border rounded p-2">
                    <span className="text-sm flex-1 truncate">{item.name}</span>
                    <div className="flex items-center gap-1 ml-2">
                      <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateEditItemQty(item.id, item.quantity - 1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm w-5 text-center">{item.quantity}</span>
                      <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateEditItemQty(item.id, item.quantity + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="text-sm font-semibold ml-2 w-14 text-right">฿{(item.price * item.quantity).toFixed(0)}</span>
                    <Button size="icon" variant="ghost" className="h-6 w-6 ml-1 text-red-500 hover:text-red-700" onClick={() => removeEditItem(item.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {getEditedItems().length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">All items removed</p>
                )}
              </div>
            </div>

            {/* Add items from menu */}
            <div>
              <h4 className="text-sm font-medium mb-2">Add Items</h4>
              <div className="flex gap-2 flex-wrap mb-2">
                {CATEGORIES.map((cat) => (
                  <Button key={cat} size="sm" variant={editCategory === cat ? "default" : "outline"} onClick={() => setEditCategory(cat)} className="h-6 text-xs">
                    {cat === "ALL" ? "All" : cat.charAt(0) + cat.slice(1).toLowerCase()}
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                {editFilteredMenu.map((item) => (
                  <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => addEditItem(item)}>
                    <CardContent className="p-2">
                      <p className="font-medium text-xs truncate">{item.name}</p>
                      <p className="text-xs text-green-600 font-semibold">฿{item.price}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Reason (required for PENDING) */}
            {editSetDialog.set?.status === "PENDING" && (
              <div>
                <label className="text-sm font-medium mb-1 block">Reason for changes (required)</label>
                <Input value={editReason} onChange={(e) => setEditReason(e.target.value)} placeholder="e.g. Customer changed order" />
              </div>
            )}

            {editChanges.length > 0 && (
              <div className="text-xs text-muted-foreground bg-gray-100 rounded p-2">
                {editChanges.length} change{editChanges.length > 1 ? "s" : ""} pending
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditSetDialog({ open: false, orderId: "", orderNumber: 0, set: null }); setEditChanges([]); setEditReason(""); }}>
              Cancel
            </Button>
            <Button
              onClick={saveEditChanges}
              disabled={editChanges.length === 0 || savingEdit || (editSetDialog.set?.status === "PENDING" && !editReason.trim())}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              <Save className="h-4 w-4 mr-1" />{savingEdit ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Change Dialog (for PREPARING items) */}
      <Dialog open={requestDialog.open} onOpenChange={(open) => { if (!open) { setRequestDialog({ open: false, orderId: "", orderNumber: 0, item: null, setStatus: "" }); setRequestReason(""); setRequestNewMenuItemId(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Request Change — {requestDialog.item?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              This item is being prepared. Changes require admin approval.
            </p>
            <div>
              <label className="text-sm font-medium mb-1 block">Type</label>
              <div className="flex gap-2">
                <Button size="sm" variant={requestType === "CANCELLATION" ? "default" : "outline"} onClick={() => { setRequestType("CANCELLATION"); setRequestNewMenuItemId(""); }}>
                  <Trash2 className="h-3 w-3 mr-1" />Cancel Item
                </Button>
                <Button size="sm" variant={requestType === "MODIFICATION" ? "default" : "outline"} onClick={() => setRequestType("MODIFICATION")}>
                  <ArrowRightLeft className="h-3 w-3 mr-1" />Swap Item
                </Button>
              </div>
            </div>
            {requestType === "MODIFICATION" && (
              <div>
                <label className="text-sm font-medium mb-1 block">Replacement Item</label>
                <Select value={requestNewMenuItemId} onValueChange={setRequestNewMenuItemId}>
                  <SelectTrigger><SelectValue placeholder="Select replacement..." /></SelectTrigger>
                  <SelectContent>
                    {menuItems.filter((m) => m.available && m.id !== requestDialog.item?.menuItemId).map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.name} — ฿{m.price}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-1 block">Reason (required)</label>
              <Input value={requestReason} onChange={(e) => setRequestReason(e.target.value)} placeholder="e.g. Customer has allergy" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRequestDialog({ open: false, orderId: "", orderNumber: 0, item: null, setStatus: "" }); setRequestReason(""); }}>
              Cancel
            </Button>
            <Button
              onClick={submitRequest}
              disabled={!requestReason.trim() || submittingRequest || (requestType === "MODIFICATION" && !requestNewMenuItemId)}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <AlertTriangle className="h-4 w-4 mr-1" />{submittingRequest ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialog.open} onOpenChange={(open) => { if (!open) { setCancelDialog({ open: false, type: "set", orderId: "", orderNumber: 0 }); setCancelReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <X className="h-5 w-5" />
              Cancel {cancelDialog.type === "order" ? `Order #${cancelDialog.orderNumber}` : cancelDialog.type === "set" ? `Set ${cancelDialog.setNumber} (Order #${cancelDialog.orderNumber})` : `"${cancelDialog.itemName}" (Order #${cancelDialog.orderNumber})`}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            {cancelDialog.setStatus && ["PREPARING", "READY", "SERVED"].includes(cancelDialog.setStatus) && (
              <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
                <AlertTriangle className="h-4 w-4 inline mr-1" />
                Food is already being prepared. Cancelled items will be marked as <strong>wasted</strong>.
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Reason {cancelDialog.setStatus !== "DRAFT" ? "(required)" : "(optional)"}
              </label>
              <Input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="e.g. Customer changed mind, item out of stock" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCancelDialog({ open: false, type: "set", orderId: "", orderNumber: 0 }); setCancelReason(""); }}>
              Go Back
            </Button>
            <Button
              variant="destructive"
              onClick={executeCancellation}
              disabled={cancelling || (cancelDialog.setStatus !== "DRAFT" && !cancelReason.trim())}
            >
              {cancelling ? "Cancelling..." : `Cancel ${cancelDialog.type === "order" ? "Order" : cancelDialog.type === "set" ? "Set" : "Item"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ServerPage() {
  return (
    <RoleGuard allowedRoles={["SERVER", "ADMIN"]}>
      <ServerPageContent />
    </RoleGuard>
  );
}
