import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import LazyToaster from "@/components/ui/lazy-toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FoodieHub - Restaurant Ordering System",
  description: "Order delicious food from the best restaurants",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <CartProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <LazyToaster />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
