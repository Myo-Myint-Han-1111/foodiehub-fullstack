"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Menu, X, LogOut } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";

export default function Header() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasQRSession, setHasQRSession] = useState(false);

  useEffect(() => {
    const orderType = sessionStorage.getItem("orderType");
    setHasQRSession(!!orderType);
  }, [pathname]);

  if (pathname === "/login") {
    return null;
  }

  const getNavLinks = () => {
    if (!user) {
      return hasQRSession ? [] : [];
    }

    // Staff always sees their nav, even if QR session exists
    if (hasQRSession && user.role === "CUSTOMER") {
      return [];
    }

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
          { href: "/orders", label: "All Orders" },
        ];
      case "SERVER":
        return [
          { href: "/server", label: "Dashboard" },
          { href: "/orders", label: "Orders" },
        ];
      case "ADMIN":
        return [
          { href: "/admin", label: "Staff" },
          { href: "/admin/menu", label: "Menu" }, // ✅ ADDED
          { href: "/admin/qr-codes", label: "QR Codes" },
          { href: "/admin/orders", label: "Orders" },
          { href: "/admin/analytics", label: "Analytics" },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  const getLogoLink = () => {
    if (!user) return hasQRSession ? "/menu" : "/";

    switch (user.role) {
      case "CUSTOMER":
        return "/menu";
      case "KITCHEN":
        return "/kitchen";
      case "COUNTER":
        return "/counter";
      case "SERVER":
        return "/server";
      case "ADMIN":
        return "/admin";
      default:
        return "/";
    }
  };

  const isStaff = user && user.role !== "CUSTOMER";

  const shouldShowCart = () => {
    if (isStaff) return false;
    if (pathname === "/orders") return false;
    return hasQRSession || user?.role === "CUSTOMER";
  };

  const shouldShowMobileMenu = () => {
    if (hasQRSession && !isStaff) return false;
    if (user) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 sm:h-16 items-center justify-between px-4 max-w-7xl mx-auto">
        {/* Logo with Image - ✅ ROUNDED */}
        <Link href={getLogoLink()} className="flex items-center space-x-2">
          <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-blue-pond-500">
            <Image
              src="/foodiehub.png"
              alt="Foodie Hub"
              fill
              className="object-cover"
              priority
            />
          </div>
          <span className="font-bold text-base sm:text-xl">FoodieHub</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-4 xl:space-x-6">
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

        {/* Right-side Actions */}
        <div className="flex items-center gap-2">
          {shouldShowCart() && (
            <Link href="/cart">
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 sm:h-10 sm:w-10"
              >
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                {itemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {itemCount}
                  </Badge>
                )}
              </Button>
            </Link>
          )}

          {user && (isStaff || !hasQRSession) && (
            <>
              <div className="text-right hidden lg:block">
                <span className="text-sm font-medium block">{user.name}</span>
                <span className="text-xs bg-blue-pond-100 text-blue-pond-700 px-2 py-0.5 rounded">
                  {user.role}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                title="Logout"
                className="h-9 w-9 sm:h-10 sm:w-10"
              >
                <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </>
          )}

          {shouldShowMobileMenu() && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Mobile/Tablet Menu */}
      {mobileMenuOpen && user && !hasQRSession && (
        <div className="lg:hidden border-t bg-background">
          <nav className="container px-4 py-4 space-y-3 max-w-7xl mx-auto">
            {navLinks.length > 0 && (
              <>
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
              </>
            )}

            <div className={navLinks.length > 0 ? "pt-3 border-t" : ""}>
              <div className="mb-3">
                <p className="text-sm font-medium">{user.name}</p>
                <span className="text-xs bg-blue-pond-100 text-blue-pond-700 px-2 py-1 rounded inline-block mt-1">
                  {user.role}
                </span>
              </div>
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
          </nav>
        </div>
      )}
    </header>
  );
}
