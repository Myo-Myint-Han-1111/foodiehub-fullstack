"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

type UserRole = "CUSTOMER" | "KITCHEN" | "COUNTER" | "ADMIN";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (!allowedRoles.includes(user.role)) {
        // Redirect to their default page based on role
        if (user.role === "CUSTOMER") {
          router.push("/menu");
        } else if (user.role === "KITCHEN") {
          router.push("/kitchen");
        } else if (user.role === "COUNTER") {
          router.push("/counter");
        } else if (user.role === "ADMIN") {
          router.push("/admin");
        }
      }
    }
  }, [user, isLoading, allowedRoles, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
