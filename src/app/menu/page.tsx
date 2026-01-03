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
  { id: "PASTA", label: "Noodles & Rice" },
  { id: "BURGERS", label: "Curries" },
  { id: "SEAFOOD", label: "Seafood" },
  { id: "SALADS", label: "Salads" },
  { id: "APPETIZERS", label: "Appetizers" },
  { id: "PIZZA", label: "Snacks" },
  { id: "DESSERTS", label: "Desserts" },
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-2 border-blue-pond-200">
          <CardContent className="pt-12 pb-12 text-center">
            <AlertCircle className="h-12 w-12 sm:h-16 sm:w-16 text-blue-pond-600 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-900">
              QR Code Required
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-8">
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
      <div className="container py-10 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-pond-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Hero Header - Updated to blue */}
      <div className="bg-gradient-to-br from-blue-pond-500 via-blue-pond-600 to-blue-pond-700 text-white">
        <div className="container px-4 py-8 sm:py-12 max-w-7xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">
            Myanmar Menu
          </h1>
          <p className="text-blue-50 text-base sm:text-lg max-w-2xl mx-auto">
            Authentic Myanmar Cuisine • Fresh & Delicious
          </p>
        </div>
      </div>

      <div className="container px-4 py-4 sm:py-6 max-w-7xl mx-auto">
        {/* Category Filters - Updated to blue */}
        <div className="sticky top-14 sm:top-16 bg-gray-50 pt-2 pb-4 mb-4 sm:mb-6 z-10">
          <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  selectedCategory === cat.id
                    ? "bg-blue-pond-500 text-white shadow-md"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
          {filteredItems.map((item) => {
            const quantity = getItemQuantity(item.id);

            return (
              <Card
                key={item.id}
                className="overflow-hidden hover:shadow-xl transition-shadow"
              >
                <CardContent className="p-0">
                  {/* Image - Responsive height */}
                  <div className="relative h-40 sm:h-48 lg:h-52 bg-gray-200">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    {!item.available && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge
                          variant="destructive"
                          className="text-base sm:text-lg"
                        >
                          Unavailable
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Content - Responsive padding and text */}
                  <div className="p-3 sm:p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-base sm:text-lg line-clamp-1">
                          {item.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mt-1">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {/* Price and Actions - Updated to blue */}
                    <div className="flex items-center justify-between mt-3 sm:mt-4">
                      <div>
                        <p className="text-xl sm:text-2xl font-black text-blue-pond-600">
                          ฿{item.price.toFixed(0)}
                        </p>
                        <p className="text-xs text-gray-500">
                          ⚡ {item.prepTime}
                        </p>
                      </div>

                      {quantity === 0 ? (
                        <Button
                          onClick={() => handleAdd(item)}
                          disabled={!item.available}
                          className="bg-blue-pond-500 hover:bg-blue-pond-600 h-9 w-9 sm:h-10 sm:w-10 p-0"
                          size="icon"
                        >
                          <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>
                      ) : (
                        <div className="flex items-center gap-1 sm:gap-2 bg-gray-100 rounded-lg p-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDecrease(item.id)}
                            className="h-7 w-7 sm:h-8 sm:w-8"
                          >
                            <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <span className="font-bold w-6 sm:w-8 text-center text-sm sm:text-base">
                            {quantity}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleAdd(item)}
                            className="h-7 w-7 sm:h-8 sm:w-8"
                          >
                            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
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

      {/* Floating Cart Button - Updated to blue */}
      {itemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg">
          <div className="container px-4 py-3 max-w-7xl mx-auto">
            <Link href="/cart">
              <button className="w-full bg-gradient-to-r from-blue-pond-500 to-blue-pond-700 hover:from-blue-pond-600 hover:to-blue-pond-800 text-white rounded-lg py-3 sm:py-4 px-4 sm:px-6 flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="font-semibold text-sm sm:text-base">
                    {itemCount} {itemCount === 1 ? "item" : "items"}
                  </span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-lg sm:text-xl font-bold">
                    ฿{total.toFixed(0)}
                  </span>
                  <span className="text-xs sm:text-sm">View Cart →</span>
                </div>
              </button>
            </Link>
          </div>
        </div>
      )}

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
