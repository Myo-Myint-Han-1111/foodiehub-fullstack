import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/auth";
import { createOrderLog } from "@/lib/order-log";

// PATCH - Mark order as Ready to Pay
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(req, { roles: ["SERVER", "ADMIN"] });
    const { id: orderId } = await params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.status !== "OPEN") {
      return NextResponse.json(
        { success: false, error: `Cannot mark as ready to pay — order is ${order.status}` },
        { status: 400 }
      );
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status: "READY_TO_PAY" },
    });

    await createOrderLog({
      orderId,
      action: "ORDER_READY_TO_PAY",
      performedById: authUser.id,
    });

    const updatedOrder = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: {
        items: true,
        sets: {
          include: { items: true },
          orderBy: { setNumber: "asc" },
        },
      },
    });

    return NextResponse.json({ success: true, data: updatedOrder });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      return handleAuthError(error);
    }
    console.error("Ready to pay error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to mark order as ready to pay" },
      { status: 500 }
    );
  }
}
