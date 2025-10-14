"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Menu, X, LogOut } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

export default function Header() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Don't show header on login page
  if (pathname === "/login") {
    return null;
  }

  // Define navigation based on role
  const getNavLinks = () => {
    if (!user) return [];

    switch (user.role) {
      case "CUSTOMER":
        return [
          { href: "/menu", label: "Menu" },
          { href: "/orders", label: "My Orders" },
        ];
      case "KITCHEN":
        return [
          { href: "/kitchen", label: "Kitchen" },
          { href: "/orders", label: "All Orders" },
        ];
      case "COUNTER":
        return [
          { href: "/counter", label: "Counter" },
          { href: "/analytics", label: "Analytics" },
          { href: "/orders", label: "All Orders" },
        ];
      case "ADMIN":
        return [
          { href: "/admin", label: "User Management" },
          { href: "/admin/qr-codes", label: "QR Codes" },
          { href: "/admin/orders", label: "Orders" },
          { href: "/admin/analytics", label: "Analytics" },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link
          href={
            user?.role === "CUSTOMER"
              ? "/menu"
              : user?.role === "KITCHEN"
              ? "/kitchen"
              : user?.role === "COUNTER"
              ? "/counter"
              : "/admin"
          }
          className="flex items-center space-x-2"
        >
          <span className="text-2xl">🍽️</span>
          <span className="font-bold text-xl">FoodieHub</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === link.href
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-4">
          {user?.role === "CUSTOMER" && (
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                    {itemCount}
                  </Badge>
                )}
              </Button>
            </Link>
          )}

          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {user.name}
                <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                  {user.role}
                </span>
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block py-2 text-sm font-medium ${
                  pathname === link.href
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {user?.role === "CUSTOMER" && (
              <Link
                href="/cart"
                className="flex items-center justify-between py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="text-sm font-medium">Cart</span>
                {itemCount > 0 && <Badge>{itemCount}</Badge>}
              </Link>
            )}

            {user && (
              <div className="pt-3 border-t">
                <p className="text-sm text-gray-600 mb-2">
                  {user.name}
                  <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                    {user.role}
                  </span>
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="w-full"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
