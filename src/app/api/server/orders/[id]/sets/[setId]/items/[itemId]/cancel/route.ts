import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/auth";
import { createOrderLog } from "@/lib/order-log";
import type { Prisma } from "@prisma/client";

// PATCH - Cancel a single item in a set
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; setId: string; itemId: string }> }
) {
  try {
    const authUser = await requireAuth(req, { roles: ["SERVER", "ADMIN"] });
    const { id: orderId, setId, itemId } = await params;

    const body = await req.json().catch(() => ({}));
    const reason: string = body.reason || "";

    const item = await prisma.orderItem.findFirst({
      where: { id: itemId, setId, orderId },
      include: { set: true },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }

    if (item.itemStatus !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: `Item is already ${item.itemStatus}` },
        { status: 400 }
      );
    }

    if (!item.set) {
      return NextResponse.json(
        { success: false, error: "Item has no associated set" },
        { status: 400 }
      );
    }

    // Non-DRAFT sets require reason
    if (item.set.status !== "DRAFT" && !reason.trim()) {
      return NextResponse.json(
        { success: false, error: "Reason is required to cancel an item in a non-draft set" },
        { status: 400 }
      );
    }

    const wasFoodStarted = ["PREPARING", "READY", "SERVED"].includes(item.set.status);
    const newItemStatus = wasFoodStarted ? "WASTED" : "CANCELLED";
    const itemTotal = item.price * item.quantity;

    await prisma.$transaction(async (tx) => {
      // Cancel the item
      await tx.orderItem.update({
        where: { id: itemId },
        data: {
          itemStatus: newItemStatus,
          cancelReason: reason.trim() || null,
        },
      });

      // Adjust order totals
      await tx.order.update({
        where: { id: orderId },
        data: {
          subtotal: { decrement: itemTotal },
          total: { decrement: itemTotal },
        },
      });

      // Check if all items in the set are now cancelled/wasted — if so, cancel the set too
      const remainingActive = await tx.orderItem.count({
        where: { setId, itemStatus: "ACTIVE" },
      });

      if (remainingActive === 0) {
        await tx.orderSet.update({
          where: { id: setId },
          data: { status: "CANCELLED" },
        });
      }
    });

    await createOrderLog({
      orderId,
      action: wasFoodStarted ? "ITEM_CANCELLED_WASTED" : "ITEM_CANCELLED",
      performedById: authUser.id,
      details: {
        itemId,
        itemName: item.name,
        quantity: item.quantity,
        price: item.price,
        setId,
        setNumber: item.set.setNumber,
        setStatus: item.set.status,
        itemStatus: newItemStatus,
        totalDeducted: itemTotal,
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
    console.error("Cancel item error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to cancel item" },
      { status: 500 }
    );
  }
}
