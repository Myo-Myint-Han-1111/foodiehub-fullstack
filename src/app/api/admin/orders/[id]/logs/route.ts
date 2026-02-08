import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/auth";

// GET - Fetch audit logs for a specific order
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(req, { roles: ["ADMIN"] });
    const { id: orderId } = await params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, orderNumber: true },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    const logs = await prisma.orderLog.findMany({
      where: { orderId },
      include: {
        performedBy: { select: { id: true, name: true, role: true } },
        approvedBy: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        logs: logs.map((log) => ({
          id: log.id,
          action: log.action,
          details: log.details,
          reason: log.reason,
          performedBy: log.performedBy,
          approvedBy: log.approvedBy,
          createdAt: log.createdAt,
        })),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      return handleAuthError(error);
    }
    console.error("Fetch order logs error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch order logs" },
      { status: 500 }
    );
  }
}
