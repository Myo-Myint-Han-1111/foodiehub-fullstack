"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Minus, Plus, Trash2, ArrowLeft } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/ui/use-toast";

export default function CartPage() {
  const [tableNumber, setTableNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const { items, removeItem, updateQuantity, subtotal, total, clearCart } =
    useCart();

  async function handleConfirmOrder() {
    if (!tableNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter your table number",
        variant: "destructive",
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Your cart is empty",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tableNumber: tableNumber.trim(),
          items: items.map((item) => ({
            menuItemId: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          total: total,
        }),
      });

      const data = await response.json();

      if (data.success) {
        clearCart();
        toast({
          title: "Success!",
          description: "Your order has been sent to the kitchen",
        });
        router.push("/orders");
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to place order",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to place order",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="container py-16">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-16 pb-16 text-center">
            <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">
              Add some items to get started!
            </p>
            <Link href="/menu">
              <Button>Browse Menu</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container px-4 py-4 flex items-center gap-4">
          <Link href="/menu">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Your Cart</h1>
        </div>
      </div>

      <div className="container px-4 py-6 max-w-2xl mx-auto">
        {/* Table Number Input */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <Label
              htmlFor="tableNumber"
              className="text-lg font-bold mb-2 block"
            >
              Table Number *
            </Label>
            <Input
              id="tableNumber"
              type="text"
              placeholder="Enter your table number (e.g., 5)"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="text-lg"
            />
          </CardContent>
        </Card>

        {/* Cart Items */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">Order Items</h2>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id}>
                  <div className="flex items-start gap-4">
                    <div className="text-4xl flex-shrink-0">{item.image}</div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold">{item.name}</h3>
                      <p className="text-sm text-gray-600">
                        ${item.price.toFixed(2)} each
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        className="h-8 w-8"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="font-bold w-8 text-center">
                        {item.quantity}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className="h-8 w-8"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-lg font-bold text-orange-600">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>

                  <Separator className="mt-4" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-lg">
                <span>Subtotal</span>
                <span className="font-semibold">${subtotal.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-orange-600">${total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Confirm Button */}
        <Button
          onClick={handleConfirmOrder}
          disabled={loading || !tableNumber.trim()}
          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-6 text-lg font-bold"
        >
          {loading ? "Sending to Kitchen..." : "Confirm Order"}
        </Button>

        <Link href="/menu">
          <Button variant="outline" className="w-full mt-3 py-6 text-lg">
            Add More Items
          </Button>
        </Link>
      </div>
    </div>
  );
}
