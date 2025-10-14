"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle } from "lucide-react";

export default function OrderPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const orderType = searchParams.get("type");
    const tableNumber = searchParams.get("table");

    // Validate QR code parameters
    if (!orderType || (orderType !== "dine-in" && orderType !== "takeaway")) {
      setError(
        "Invalid QR code. Please scan a valid QR code from the restaurant."
      );
      setValidating(false);
      return;
    }

    if (orderType === "dine-in" && !tableNumber) {
      setError("Table number missing. Please scan the QR code on your table.");
      setValidating(false);
      return;
    }

    // Valid QR code - save to session storage
    sessionStorage.setItem("orderType", orderType);
    if (tableNumber) {
      sessionStorage.setItem("tableNumber", tableNumber);
    } else {
      sessionStorage.removeItem("tableNumber");
    }

    setValidating(false);
  }, [searchParams]);

  const orderType = searchParams.get("type");
  const tableNumber = searchParams.get("table");

  if (validating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Validating QR code...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-2 border-red-200">
          <CardContent className="pt-12 pb-12 text-center">
            <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              Invalid QR Code
            </h2>
            <p className="text-gray-600 mb-8">{error}</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-xl border-2 border-green-200">
        <CardContent className="pt-12 pb-12 text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-2 text-gray-900">Welcome! 🎉</h2>

          {orderType === "dine-in" ? (
            <>
              <div className="my-6 p-4 bg-orange-100 rounded-lg">
                <p className="text-sm text-orange-700 font-medium mb-1">
                  You are ordering for:
                </p>
                <p className="text-3xl font-black text-orange-900">
                  🪑 Table {tableNumber}
                </p>
              </div>
              <p className="text-gray-600 mb-8">
                Your food will be delivered to your table when ready
              </p>
            </>
          ) : (
            <>
              <div className="my-6 p-4 bg-blue-100 rounded-lg">
                <p className="text-sm text-blue-700 font-medium mb-1">
                  You are ordering for:
                </p>
                <p className="text-3xl font-black text-blue-900">📦 Takeaway</p>
              </div>
              <p className="text-gray-600 mb-8">
                Pick up your order at the counter when ready
              </p>
            </>
          )}

          <Button
            onClick={() => router.push("/menu")}
            className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white py-6 text-lg font-bold"
          >
            Start Ordering →
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
