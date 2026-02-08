import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/auth";

// GET - Get today's orders for counter (READY_TO_PAY + PAID)
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req, { roles: ["COUNTER", "ADMIN"] });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startOfDay },
        status: { in: ["READY_TO_PAY", "PAID", "CLOSED"] },
      },
      include: {
        sets: {
          include: {
            items: true,
          },
          orderBy: { setNumber: "asc" },
        },
        items: true,
        createdBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const response = NextResponse.json({ success: true, data: orders });
    response.headers.set("Cache-Control", "private, max-age=2");
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      return handleAuthError(error);
    }
    console.error("Fetch counter orders error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
