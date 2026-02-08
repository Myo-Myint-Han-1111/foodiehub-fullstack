import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/auth";
import { createOrderLog } from "@/lib/order-log";
import type { Prisma } from "@prisma/client";

// PATCH - Cancel an entire order
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(req, { roles: ["SERVER", "ADMIN"] });
    const { id: orderId } = await params;

    const body = await req.json().catch(() => ({}));
    const reason: string = body.reason || "";

    if (!reason.trim()) {
      return NextResponse.json(
        { success: false, error: "Reason is required to cancel an order" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        sets: {
          include: { items: { where: { itemStatus: "ACTIVE" } } },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.status === "CANCELLED" || order.status === "CLOSED") {
      return NextResponse.json(
        { success: false, error: `Order is already ${order.status}` },
        { status: 400 }
      );
    }

    if (order.status === "PAID") {
      return NextResponse.json(
        { success: false, error: "Cannot cancel a paid order. Use refund flow instead." },
        { status: 400 }
      );
    }

    let totalWasted = 0;
    let totalCancelled = 0;

    await prisma.$transaction(async (tx) => {
      for (const set of order.sets) {
        // Skip already terminal sets
        if (set.status === "CANCELLED" || set.status === "WASTED") continue;

        const wasFoodStarted = ["PREPARING", "READY", "SERVED"].includes(set.status);
        const newItemStatus = wasFoodStarted ? "WASTED" : "CANCELLED";

        const setItemTotal = set.items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        if (wasFoodStarted) {
          totalWasted += setItemTotal;
        } else {
          totalCancelled += setItemTotal;
        }

        // Mark all active items in this set
        await tx.orderItem.updateMany({
          where: { setId: set.id, itemStatus: "ACTIVE" },
          data: {
            itemStatus: newItemStatus,
            cancelReason: reason.trim(),
          },
        });

        // Cancel the set
        await tx.orderSet.update({
          where: { id: set.id },
          data: { status: "CANCELLED" },
        });
      }

      // Cancel the order
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "CANCELLED",
          subtotal: 0,
          total: 0,
        },
      });
    });

    await createOrderLog({
      orderId,
      action: "ORDER_CANCELLED",
      performedById: authUser.id,
      details: {
        previousStatus: order.status,
        setsCount: order.sets.length,
        totalWasted,
        totalCancelled,
      } as Prisma.InputJsonValue,
      reason: reason.trim(),
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
    console.error("Cancel order error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to cancel order" },
      { status: 500 }
    );
  }
}
