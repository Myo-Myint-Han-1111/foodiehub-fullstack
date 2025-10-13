"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import type { MenuItem } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Plus, Minus } from "lucide-react";
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

  const { items, addItem, updateQuantity, itemCount, total } = useCart();
  const { toast } = useToast();

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

  if (loading) {
    return (
      <div className="container py-10">
        <div className="text-center">Loading menu...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container px-4 py-4">
          <h1 className="text-2xl font-bold text-center">Menu</h1>
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
                    {/* Image - CHANGED FROM EMOJI TO REAL IMAGE */}
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
