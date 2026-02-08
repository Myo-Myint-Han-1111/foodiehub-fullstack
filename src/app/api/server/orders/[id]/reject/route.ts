import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/auth";
import { createOrderLog } from "@/lib/order-log";

// PATCH - Reject a QR order
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(req, { roles: ["SERVER", "ADMIN"] });
    const { id: orderId } = await params;
    const body = await req.json();
    const { reason } = body;

    if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Reason is required" },
        { status: 400 }
      );
    }

    // Validate order exists and is a QR order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        sets: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.createdById !== null) {
      return NextResponse.json(
        { success: false, error: "This is not a QR order" },
        { status: 400 }
      );
    }

    // Cancel all DRAFT sets and the order itself
    await prisma.$transaction(async (tx) => {
      // Cancel all DRAFT sets
      await tx.orderSet.updateMany({
        where: {
          orderId,
          status: "DRAFT",
        },
        data: {
          status: "CANCELLED",
        },
      });

      // Cancel the order
      await tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });
    });

    // Create audit log
    await createOrderLog({
      orderId,
      action: "QR_ORDER_REJECTED",
      performedById: authUser.id,
      reason: reason.trim(),
    });

    // Return updated order
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
    console.error("Reject QR order error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to reject order" },
      { status: 500 }
    );
  }
}
