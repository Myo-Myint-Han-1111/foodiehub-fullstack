"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode, Users, UtensilsCrossed } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-6">🍽️</div>
          <h1 className="text-5xl md:text-6xl font-black mb-6 text-gray-900">
            Welcome to FoodieHub
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Order delicious food directly from your table or for takeaway
          </p>

          {/* QR Code Instructions */}
          <Card className="max-w-2xl mx-auto shadow-xl border-2 border-orange-200">
            <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
              <CardTitle className="text-2xl flex items-center justify-center gap-3">
                <QrCode className="h-8 w-8" />
                How to Order
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8 pb-8">
              <div className="space-y-6">
                {/* Dine-In Instructions */}
                <div className="flex items-start gap-4 text-left">
                  <div className="bg-orange-100 text-orange-700 rounded-full w-12 h-12 flex items-center justify-center font-bold flex-shrink-0 text-xl">
                    1
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                      <UtensilsCrossed className="h-5 w-5 text-orange-600" />
                      For Dine-In
                    </h3>
                    <p className="text-gray-600">
                      Scan the <strong>QR code on your table</strong> to start
                      ordering. Your table number will be automatically
                      detected.
                    </p>
                  </div>
                </div>

                {/* Takeaway Instructions */}
                <div className="flex items-start gap-4 text-left">
                  <div className="bg-blue-100 text-blue-700 rounded-full w-12 h-12 flex items-center justify-center font-bold flex-shrink-0 text-xl">
                    2
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                      📦 For Takeaway
                    </h3>
                    <p className="text-gray-600">
                      Scan the <strong>QR code at the counter</strong> to order
                      for pickup. We wll notify you when your order is ready!
                    </p>
                  </div>
                </div>

                {/* Staff Login */}
                <div className="flex items-start gap-4 text-left border-t pt-6 mt-6">
                  <div className="bg-purple-100 text-purple-700 rounded-full w-12 h-12 flex items-center justify-center font-bold flex-shrink-0 text-xl">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Staff Access</h3>
                    <p className="text-gray-600 mb-3">
                      Kitchen, counter, and admin staff can access the system
                      here:
                    </p>
                    <Link href="/login">
                      <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                        Staff Login →
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info Section */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-4xl mb-3">⚡</div>
                <h3 className="font-bold text-lg mb-2">Fast & Easy</h3>
                <p className="text-gray-600 text-sm">
                  Order in seconds without waiting for a waiter
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-4xl mb-3">🔒</div>
                <h3 className="font-bold text-lg mb-2">Secure</h3>
                <p className="text-gray-600 text-sm">
                  QR code verification ensures authentic orders
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-4xl mb-3">✨</div>
                <h3 className="font-bold text-lg mb-2">Contactless</h3>
                <p className="text-gray-600 text-sm">
                  Safe and hygienic ordering experience
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Notice */}
          <div className="mt-12 p-6 bg-amber-50 border-2 border-amber-200 rounded-xl">
            <p className="text-amber-800 font-medium">
              ⚠️ <strong>Notice:</strong> Online ordering is only available
              in-store via QR code. Please visit our restaurant to place an
              order.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
