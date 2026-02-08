"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode, UtensilsCrossed } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
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
          <Card className="max-w-2xl mx-auto shadow-xl border-2 border-blue-pond-200">
            <CardHeader className="bg-gradient-to-r from-blue-pond-500 to-blue-pond-700 text-white">
              <CardTitle className="text-2xl flex items-center justify-center gap-3">
                <QrCode className="h-8 w-8" />
                How to Order
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8 pb-8">
              <div className="space-y-6">
                {/* Dine-In Instructions */}
                <div className="flex items-start gap-4 text-left">
                  <div className="bg-blue-pond-100 text-blue-pond-700 rounded-full w-12 h-12 flex items-center justify-center font-bold flex-shrink-0 text-xl">
                    1
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                      <UtensilsCrossed className="h-5 w-5 text-blue-pond-600" />
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
              </div>
            </CardContent>
          </Card>

          {/* Notice */}
          <div className="mt-12 p-6 bg-blue-50 border-2 border-blue-200 rounded-xl">
            <p className="text-blue-800 font-medium">
              <strong>Notice:</strong> Online ordering is only available
              in-store via QR code. Please visit our restaurant to place an
              order.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
