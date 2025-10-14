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

export default function MenuPage() {
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
    fetchMenuItems();
  }, [fetchMenuItems]);

  useEffect(() => {
    filterItems();
  }, [filterItems]);

  function handleAdd(item: MenuItem) {
    addItem(item);
    toast({
      title: "Added to cart",
      description: `${item.name} added to your order`,
    });
  }

  function handleDecrease(itemId: string) {
    const cartItem = items.find((i) => i.id === itemId);
    if (cartItem) {
      if (cartItem.quantity > 1) {
        updateQuantity(itemId, cartItem.quantity - 1);
      } else {
        updateQuantity(itemId, 0);
      }
    }
  }

  function getItemQuantity(itemId: string): number {
    const cartItem = items.find((i) => i.id === itemId);
    return cartItem?.quantity || 0;
  }

  // Show warning if no valid QR session
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
              Please scan a QR code from the restaurant to start ordering.
            </p>
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="w-full"
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg sticky top-0 z-10">
        <div className="container px-4 py-6">
          <h1 className="text-3xl font-bold">Our Menu</h1>
          <p className="text-orange-100 mt-1">Choose your favorite dishes</p>
        </div>
      </div>

      <div className="container px-4 py-6">
        {/* Category Filters */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex gap-3 pb-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? "bg-orange-600 text-white shadow-lg scale-105"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const quantity = getItemQuantity(item.id);

            return (
              <Card
                key={item.id}
                className="overflow-hidden hover:shadow-xl transition-shadow"
              >
                <CardContent className="p-0">
                  <div className="relative h-48 bg-gray-200">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    {!item.available && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge variant="destructive" className="text-lg">
                          Unavailable
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg line-clamp-1">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div>
                        <p className="text-2xl font-black text-orange-600">
                          ${item.price.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          âš¡ {item.prepTime}
                        </p>
                      </div>

                      {quantity === 0 ? (
                        <Button
                          onClick={() => handleAdd(item)}
                          disabled={!item.available}
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
