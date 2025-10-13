"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-black mb-6 text-gray-900">
            Welcome to FoodieHub
          </h1>

          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            No waiting for waiters. Browse our menu on your phone, add items to
            cart, and send your order directly to the kitchen.
          </p>

          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white text-xl px-12 py-8 font-bold shadow-lg"
          >
            <Link href="/menu">Start Ordering Now</Link>
          </Button>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto bg-gradient-to-r from-orange-600 to-red-600 rounded-3xl p-12 text-center text-white shadow-2xl">
          <h2 className="text-4xl font-bold mb-4">Ready to Order?</h2>
          <p className="text-xl mb-8 opacity-90">
            Start browsing our menu and place your order now
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="text-lg px-10 py-7 font-bold"
            >
              <Link href="/menu">View Menu</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
