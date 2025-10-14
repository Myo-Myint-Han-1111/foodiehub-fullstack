"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { MenuItem } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Plus, Minus, AlertCircle } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/ui/use-toast";
import RoleGuard from "@/components/RoleGuard";

const categories = [
  { id: "ALL", label: "All" },
  { id: "PIZZA", label: "Pizza" },
  { id: "BURGERS", label: "Burgers" },
  { id: "PASTA", label: "Pasta" },
  { id: "SEAFOOD", label: "Seafood" },
  { id: "SALADS", label: "Salads" },
  { id: "DESSERTS", label: "Desserts" },
  { id: "APPETIZERS", label: "Appetizers" },
  { id: "DRINKS", label: "Drinks" },
];

function MenuPageContent() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const router = useRouter();

  const { items, addItem, updateQuantity, itemCount, total } = useCart();
  const { toast } = useToast();

  // Check for valid QR session
  useEffect(() => {
    const orderType = sessionStorage.getItem("orderType");

    if (!orderType) {
      // No valid session - redirect to home
      setHasValidSession(false);
    } else {
      setHasValidSession(true);
    }
  }, []);

  const fetchMenuItems = useCallback(async () => {
    try {
      const response = await fetch("/api/menu");
      const data = await response.json();
      if (data.success) {
        setMenuItems(data.data);
        setFilteredItems(data.data);
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load menu items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const filterItems = useCallback(() => {
    let filtered = menuItems;
    if (selectedCategory !== "ALL") {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }
    setFilteredItems(filtered);
  }, [menuItems, selectedCategory]);

  useEffect(() => {
    if (hasValidSession) {
      fetchMenuItems();
    }
  }, [fetchMenuItems, hasValidSession]);

  useEffect(() => {
    filterItems();
  }, [filterItems]);

  function getItemQuantity(itemId: string): number {
    const cartItem = items.find((item) => item.id === itemId);
    return cartItem?.quantity || 0;
  }

  function handleAdd(item: MenuItem) {
    addItem(item);
  }

  function handleDecrease(itemId: string) {
    const quantity = getItemQuantity(itemId);
    if (quantity > 0) {
      updateQuantity(itemId, quantity - 1);
    }
  }

  // Show blocked message if no valid session
  if (!hasValidSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-2 border-orange-200">
          <CardContent className="pt-12 pb-12 text-center">
            <AlertCircle className="h-16 w-16 text-orange-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              QR Code Required
            </h2>
            <p className="text-gray-600 mb-8">
              Please scan a QR code from the restaurant to access the menu and
              place orders.
            </p>
            <Button
              onClick={() => router.push("/")}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container py-10">
        <div className="text-center">Loading menu...</div>
      </div>
    );
  }

  const orderType = sessionStorage.getItem("orderType");
  const tableNumber = sessionStorage.getItem("tableNumber");

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header with Order Type Badge */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Menu</h1>
            {orderType === "dine-in" && tableNumber ? (
              <Badge className="bg-orange-100 text-orange-700 text-sm px-3 py-1">
                🪑 Table {tableNumber}
              </Badge>
            ) : (
              <Badge className="bg-blue-100 text-blue-700 text-sm px-3 py-1">
                📦 Takeaway
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white border-b sticky top-[73px] z-10">
        <div className="overflow-x-auto">
          <div className="flex gap-2 px-4 py-3 min-w-max">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={
                  selectedCategory === category.id ? "default" : "outline"
                }
                onClick={() => setSelectedCategory(category.id)}
                className="whitespace-nowrap"
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="container px-4 py-6">
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const quantity = getItemQuantity(item.id);
            return (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Image */}
                    <div className="flex-shrink-0 w-24 h-24 relative rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg">{item.name}</h3>
                      <p className="text-sm text-gray-600 line-clamp-1">
                        {item.description}
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <Badge variant="secondary" className="text-xs">
                          {item.prepTime}
                        </Badge>
                        <p className="text-xl font-bold text-orange-600">
                          ${item.price.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Add/Remove Buttons */}
                    <div className="flex-shrink-0">
                      {quantity === 0 ? (
                        <Button
                          onClick={() => handleAdd(item)}
                          className="bg-orange-600 hover:bg-orange-700 h-10 w-10 p-0"
                        >
                          <Plus className="h-5 w-5" />
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDecrease(item.id)}
                            className="h-8 w-8"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="font-bold w-8 text-center">
                            {quantity}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleAdd(item)}
                            className="h-8 w-8"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Floating Cart Button */}
      {itemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg">
          <div className="container px-4 py-3">
            <Link href="/cart">
              <button className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-lg py-4 px-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="font-semibold">{itemCount} items</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold">${total.toFixed(2)}</span>
                  <span className="text-sm">View Cart →</span>
                </div>
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MenuPage() {
  return (
    <RoleGuard allowedRoles={["CUSTOMER"]}>
      <MenuPageContent />
    </RoleGuard>
  );
}
