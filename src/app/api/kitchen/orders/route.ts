import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/auth";

// GET - Get sets for kitchen display (KITCHEN/ADMIN only)
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req, { roles: ["KITCHEN", "ADMIN"] });

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const sets = await prisma.orderSet.findMany({
      where: {
        status: { in: ["PENDING", "PREPARING", "READY"] },
        order: {
          createdAt: { gte: twentyFourHoursAgo },
          status: { notIn: ["CANCELLED", "CLOSED"] },
        },
      },
      include: {
        items: true,
        order: {
          select: {
            id: true,
            orderNumber: true,
            orderType: true,
            tableNumber: true,
            total: true,
            status: true,
            createdAt: true,
            createdById: true,
          },
        },
      },
      orderBy: { sentAt: "asc" },
    });

    const response = NextResponse.json({
      success: true,
      data: sets,
    });
    response.headers.set("Cache-Control", "private, max-age=2");
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      return handleAuthError(error);
    }
    console.error("Fetch kitchen sets error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch kitchen sets" },
      { status: 500 }
    );
  }
}
