import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/auth";
import { createOrderLog } from "@/lib/order-log";
import type { Prisma } from "@prisma/client";

interface ChangeAdd {
  type: "add";
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

interface ChangeRemove {
  type: "remove";
  itemId: string;
}

interface ChangeUpdateQty {
  type: "updateQty";
  itemId: string;
  quantity: number;
}

interface ChangeSwap {
  type: "swap";
  itemId: string;
  newMenuItemId: string;
  newName: string;
  newPrice: number;
  newQuantity: number;
}

type ItemChange = ChangeAdd | ChangeRemove | ChangeUpdateQty | ChangeSwap;

interface EditBody {
  changes: ItemChange[];
  reason?: string;
}

// PATCH - Edit items in a set (DRAFT: free, PENDING: with reason)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; setId: string }> }
) {
  try {
    const authUser = await requireAuth(req, { roles: ["SERVER", "ADMIN"] });
    const { id: orderId, setId } = await params;
    const body: EditBody = await req.json();
    const { changes, reason } = body;

    if (!changes || changes.length === 0) {
      return NextResponse.json(
        { success: false, error: "No changes provided" },
        { status: 400 }
      );
    }

    // Fetch the set
    const orderSet = await prisma.orderSet.findFirst({
      where: { id: setId, orderId },
      include: { items: true },
    });

    if (!orderSet) {
      return NextResponse.json(
        { success: false, error: "Set not found for this order" },
        { status: 404 }
      );
    }

    // Check status
    if (orderSet.status === "PREPARING" || orderSet.status === "READY" || orderSet.status === "SERVED") {
      return NextResponse.json(
        { success: false, error: `Cannot directly edit items in a ${orderSet.status} set. Use a modification request instead.` },
        { status: 400 }
      );
    }

    if (orderSet.status === "CANCELLED" || orderSet.status === "WASTED") {
      return NextResponse.json(
        { success: false, error: "Cannot edit items in a cancelled or wasted set" },
        { status: 400 }
      );
    }

    // PENDING requires reason
    if (orderSet.status === "PENDING" && (!reason || !reason.trim())) {
      return NextResponse.json(
        { success: false, error: "Reason is required when editing a PENDING set" },
        { status: 400 }
      );
    }

    // Apply changes in a transaction
    let totalDelta = 0;

    const updatedOrder = await prisma.$transaction(async (tx) => {
      for (const change of changes) {
        switch (change.type) {
          case "add": {
            await tx.orderItem.create({
              data: {
                orderId,
                setId,
                menuItemId: change.menuItemId || null,
                name: change.name,
                quantity: change.quantity,
                price: change.price,
              },
            });
            totalDelta += change.price * change.quantity;
            break;
          }

          case "remove": {
            const item = orderSet.items.find((i) => i.id === change.itemId);
            if (!item) break;
            await tx.orderItem.delete({ where: { id: change.itemId } });
            totalDelta -= item.price * item.quantity;
            break;
          }

          case "updateQty": {
            const item = orderSet.items.find((i) => i.id === change.itemId);
            if (!item) break;
            const qtyDelta = change.quantity - item.quantity;
            await tx.orderItem.update({
              where: { id: change.itemId },
              data: { quantity: change.quantity },
            });
            totalDelta += item.price * qtyDelta;
            break;
          }

          case "swap": {
            const item = orderSet.items.find((i) => i.id === change.itemId);
            if (!item) break;
            // Mark old item as CHANGED
            const newItem = await tx.orderItem.create({
              data: {
                orderId,
                setId,
                menuItemId: change.newMenuItemId || null,
                name: change.newName,
                quantity: change.newQuantity,
                price: change.newPrice,
                changedFromId: item.id,
              },
            });
            await tx.orderItem.update({
              where: { id: change.itemId },
              data: {
                itemStatus: "CHANGED",
                changedToId: newItem.id,
              },
            });
            totalDelta -= item.price * item.quantity;
            totalDelta += change.newPrice * change.newQuantity;
            break;
          }
        }
      }

      // Update order totals
      if (totalDelta !== 0) {
        await tx.order.update({
          where: { id: orderId },
          data: {
            subtotal: { increment: totalDelta },
            total: { increment: totalDelta },
          },
        });
      }

      return tx.order.findUniqueOrThrow({
        where: { id: orderId },
        include: {
          items: true,
          sets: {
            include: { items: true },
            orderBy: { setNumber: "asc" },
          },
        },
      });
    });

    // Audit log
    const logDetails: Record<string, unknown> = {
      setId,
      setNumber: orderSet.setNumber,
      setStatus: orderSet.status,
      changeCount: changes.length,
      totalDelta,
    };

    await createOrderLog({
      orderId,
      action: orderSet.status === "PENDING" ? "SET_ITEMS_MODIFIED_PENDING" : "SET_ITEMS_MODIFIED_DRAFT",
      performedById: authUser.id,
      details: logDetails as Prisma.InputJsonValue,
      reason: reason?.trim(),
    });

    return NextResponse.json({ success: true, data: updatedOrder });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      return handleAuthError(error);
    }
    console.error("Edit set items error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to edit set items" },
      { status: 500 }
    );
  }
}
