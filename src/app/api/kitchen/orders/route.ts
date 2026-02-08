import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Get sets for kitchen display (set-based, last 24 hours)
// Returns sets in PENDING/PREPARING/READY status with parent order context
export async function GET() {
  try {
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
      orderBy: { sentAt: "asc" }, // FIFO: oldest first
    });

    return NextResponse.json({
      success: true,
      data: sets,
    });
  } catch (error) {
    console.error("Fetch kitchen sets error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch kitchen sets" },
      { status: 500 }
    );
  }
}
