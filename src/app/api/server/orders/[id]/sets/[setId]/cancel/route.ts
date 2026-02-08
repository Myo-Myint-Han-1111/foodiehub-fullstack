import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/auth";
import { createOrderLog } from "@/lib/order-log";
import type { Prisma } from "@prisma/client";

// PATCH - Cancel an entire set
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; setId: string }> }
) {
  try {
    const authUser = await requireAuth(req, { roles: ["SERVER", "ADMIN"] });
    const { id: orderId, setId } = await params;

    const body = await req.json().catch(() => ({}));
    const reason: string = body.reason || "";

    const orderSet = await prisma.orderSet.findFirst({
      where: { id: setId, orderId },
      include: { items: { where: { itemStatus: "ACTIVE" } } },
    });

    if (!orderSet) {
      return NextResponse.json(
        { success: false, error: "Set not found for this order" },
        { status: 404 }
      );
    }

    if (orderSet.status === "CANCELLED" || orderSet.status === "WASTED") {
      return NextResponse.json(
        { success: false, error: "Set is already cancelled" },
        { status: 400 }
      );
    }

    // Non-DRAFT sets require a reason
    if (orderSet.status !== "DRAFT" && !reason.trim()) {
      return NextResponse.json(
        { success: false, error: "Reason is required to cancel a non-draft set" },
        { status: 400 }
      );
    }

    // Determine item status based on set status
    const wasFoodStarted = ["PREPARING", "READY", "SERVED"].includes(orderSet.status);
    const newItemStatus = wasFoodStarted ? "WASTED" : "CANCELLED";

    // Calculate total to deduct
    const totalToDeduct = orderSet.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    await prisma.$transaction(async (tx) => {
      // Mark all active items
      await tx.orderItem.updateMany({
        where: { setId, itemStatus: "ACTIVE" },
        data: {
          itemStatus: newItemStatus,
          cancelReason: reason.trim() || null,
        },
      });

      // Cancel the set
      await tx.orderSet.update({
        where: { id: setId },
        data: { status: "CANCELLED" },
      });

      // Adjust order totals
      if (totalToDeduct > 0) {
        await tx.order.update({
          where: { id: orderId },
          data: {
            subtotal: { decrement: totalToDeduct },
            total: { decrement: totalToDeduct },
          },
        });
      }
    });

    await createOrderLog({
      orderId,
      action: wasFoodStarted ? "SET_CANCELLED_WITH_WASTE" : "SET_CANCELLED",
      performedById: authUser.id,
      details: {
        setId,
        setNumber: orderSet.setNumber,
        previousStatus: orderSet.status,
        itemCount: orderSet.items.length,
        itemStatus: newItemStatus,
        totalDeducted: totalToDeduct,
      } as Prisma.InputJsonValue,
      reason: reason.trim() || undefined,
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
    console.error("Cancel set error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to cancel set" },
      { status: 500 }
    );
  }
}
