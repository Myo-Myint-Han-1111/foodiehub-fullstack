"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UtensilsCrossed, Plus, Edit, Trash2, Search } from "lucide-react";
import RoleGuard from "@/components/RoleGuard";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  rating: number;
  prepTime: string;
  available: boolean;
  createdAt: string;
  updatedAt: string;
}

// ✅ FIXED: Match exact enum values from database schema
const CATEGORIES = [
  { value: "PIZZA", label: "Pizza & Snacks" },
  { value: "BURGERS", label: "Curries" },
  { value: "PASTA", label: "Rice & Noodles" },
  { value: "SEAFOOD", label: "Seafood" },
  { value: "SALADS", label: "Salads" },
  { value: "DESSERTS", label: "Desserts" },
  { value: "APPETIZERS", label: "Appetizers" },
  { value: "DRINKS", label: "Drinks" },
] as const;

// Helper function to get category label
function getCategoryLabel(value: string): string {
  return CATEGORIES.find((c) => c.value === value)?.label || value;
}

function AdminMenuContent() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "PIZZA",
    image: "",
    rating: "4.5",
    prepTime: "15-20 min",
    available: true,
  });

  const fetchMenuItems = useCallback(async () => {
    try {
      const response = await fetch("/api/menu");
      const data = await response.json();
      if (data.success) {
        setMenuItems(data.data);
      }
    } catch {
      toast({
        title: "Connection issue",
        description: "Could not load menu items. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  function openCreateDialog() {
    setEditingItem(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "PIZZA",
      image: "",
      rating: "4.5",
      prepTime: "15-20 min",
      available: true,
    });
    setDialogOpen(true);
  }

  function openEditDialog(item: MenuItem) {
    setEditingItem(item);
    // ✅ FIXED: Pre-fill form with item data including category
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category, // ✅ This will auto-select the category
      image: item.image,
      rating: item.rating.toString(),
      prepTime: item.prepTime,
      available: item.available,
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate price
    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid price greater than 0.",
        variant: "destructive",
      });
      return;
    }

    // Validate rating
    const rating = parseFloat(formData.rating);
    if (isNaN(rating) || rating < 0 || rating > 5) {
      toast({
        title: "Invalid rating",
        description: "Rating must be between 0 and 5.",
        variant: "destructive",
      });
      return;
    }

    try {
      const url = editingItem ? `/api/menu/${editingItem.id}` : "/api/menu";
      const method = editingItem ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          rating: parseFloat(formData.rating),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: editingItem ? "Item updated!" : "Item created!",
          description: editingItem ? "Menu item has been updated." : "New menu item has been added.",
          variant: "success",
        });
        setDialogOpen(false);
        fetchMenuItems();
      } else {
        toast({
          title: "Could not save",
          description: data.error || "Something went wrong. Please check the details and try again.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Something went wrong",
        description: "Could not save the menu item. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function handleDelete(itemId: string, itemName: string) {
    if (!confirm(`Are you sure you want to delete "${itemName}"?`)) return;

    try {
      const response = await fetch(`/api/menu/${itemId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Item deleted",
          description: "Menu item has been removed.",
          variant: "success",
        });
        fetchMenuItems();
      } else {
        toast({
          title: "Could not delete",
          description: data.error || "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Something went wrong",
        description: "Could not delete the menu item. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function toggleAvailability(item: MenuItem) {
    try {
      const response = await fetch(`/api/menu/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: !item.available }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: `Item ${!item.available ? "enabled" : "disabled"}`,
          description: `Menu item has been ${!item.available ? "made available" : "hidden from menu"}.`,
          variant: "success",
        });
        fetchMenuItems();
      }
    } catch {
      toast({
        title: "Something went wrong",
        description: "Could not update availability. Please try again.",
        variant: "destructive",
      });
    }
  }

  // Filter menu items
  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "ALL" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Group by category
  const itemsByCategory = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  if (loading) {
    return (
      <div className="container py-10 px-4">
        <div className="text-center">Loading menu items...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg">
        <div className="container px-4 py-4 sm:py-6 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                <UtensilsCrossed className="h-6 w-6 sm:h-8 sm:w-8" />
                Menu Management
              </h1>
              <p className="text-purple-100 mt-1 text-sm sm:text-base">
                Manage restaurant menu items
              </p>
            </div>
            <Button
              onClick={openCreateDialog}
              className="bg-white text-purple-600 hover:bg-purple-50 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Add Menu Item
            </Button>
          </div>
        </div>
      </div>

      <div className="container px-4 py-4 sm:py-6 max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                Total Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                {menuItems.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                Available
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-green-600">
                {menuItems.filter((i) => i.available).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                Unavailable
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-red-600">
                {menuItems.filter((i) => !i.available).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                Avg Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-yellow-600">
                {menuItems.length > 0
                  ? (
                      menuItems.reduce((sum, i) => sum + i.rating, 0) /
                      menuItems.length
                    ).toFixed(1)
                  : "0.0"}
                ⭐
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Menu Items by Category */}
        {Object.keys(itemsByCategory).length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <UtensilsCrossed className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No menu items found</p>
              <Button onClick={openCreateDialog} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Item
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(itemsByCategory).map(([category, items]) => (
              <div key={category}>
                <h2 className="text-xl font-bold mb-4 text-gray-800">
                  {getCategoryLabel(category)} ({items.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((item) => (
                    <Card
                      key={item.id}
                      className={!item.available ? "opacity-60" : ""}
                    >
                      <CardContent className="p-4">
                        {/* ✅ FIXED: Display image in card */}
                        <div className="relative w-full h-40 mb-3 rounded-lg overflow-hidden bg-gray-100">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            onError={(e) => {
                              // Fallback if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.src =
                                "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400";
                            }}
                          />
                        </div>

                        {/* Title, Rating & Price */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg">{item.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span>⭐ {item.rating.toFixed(1)}</span>
                              <span>•</span>
                              <span>{item.prepTime}</span>
                            </div>
                            <p className="text-2xl font-black text-purple-600 mt-1">
                              ฿{item.price.toFixed(0)}
                            </p>
                          </div>
                          <Badge
                            className={
                              item.available
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }
                          >
                            {item.available ? "Available" : "Unavailable"}
                          </Badge>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {item.description}
                        </p>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-3 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleAvailability(item)}
                            className="flex-1"
                          >
                            {item.available ? "Disable" : "Enable"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item.id, item.name)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {editingItem ? "Edit Menu Item" : "Create New Menu Item"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Mohinga"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description of the dish"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price (฿) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="rating">Rating (0-5) *</Label>
                  <Input
                    id="rating"
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={formData.rating}
                    onChange={(e) =>
                      setFormData({ ...formData, rating: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                {/* ✅ FIXED: Select will auto-select based on formData.category */}
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="prepTime">Prep Time *</Label>
                <Input
                  id="prepTime"
                  value={formData.prepTime}
                  onChange={(e) =>
                    setFormData({ ...formData, prepTime: e.target.value })
                  }
                  placeholder="e.g., 15-20 min"
                  required
                />
              </div>

              <div>
                <Label htmlFor="image">Photo *</Label>
                <Input
                  id="imageUpload"
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) {
                      toast({ title: "File too large", description: "Please select an image under 5MB", variant: "destructive" });
                      return;
                    }
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setFormData({ ...formData, image: reader.result as string });
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="cursor-pointer"
                />
                {formData.image && (
                  <div className="mt-2 relative w-full h-32 rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={formData.image}
                      alt="Preview"
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                      }}
                    />
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Upload a photo (max 5MB) or paste a URL below
                </p>
                <Input
                  id="imageUrl"
                  value={formData.image.startsWith("data:") ? "" : formData.image}
                  onChange={(e) =>
                    setFormData({ ...formData, image: e.target.value })
                  }
                  placeholder="Or paste image URL..."
                  className="mt-2"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="available"
                  checked={formData.available}
                  onChange={(e) =>
                    setFormData({ ...formData, available: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <Label htmlFor="available" className="cursor-pointer">
                  Available for ordering
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700"
              >
                {editingItem ? "Update Item" : "Create Item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminMenuPage() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <AdminMenuContent />
    </RoleGuard>
  );
}
