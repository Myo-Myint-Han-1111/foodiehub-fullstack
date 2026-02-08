import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/auth";
import { createOrderLog } from "@/lib/order-log";
import type { Prisma } from "@prisma/client";

// PATCH - Approve an action request
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(req, { roles: ["ADMIN"] });
    const { id: requestId } = await params;

    const actionRequest = await prisma.actionRequest.findUnique({
      where: { id: requestId },
    });

    if (!actionRequest) {
      return NextResponse.json(
        { success: false, error: "Request not found" },
        { status: 404 }
      );
    }

    if (actionRequest.status !== "PENDING") {
      return NextResponse.json(
        { success: false, error: `Request is already ${actionRequest.status}` },
        { status: 400 }
      );
    }

    const item = await prisma.orderItem.findUnique({
      where: { id: actionRequest.orderItemId },
      include: { set: true },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: "Associated item not found" },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      if (actionRequest.type === "CANCELLATION") {
        // Mark item as WASTED (food was being prepared)
        await tx.orderItem.update({
          where: { id: item.id },
          data: { itemStatus: "WASTED", cancelReason: actionRequest.reason },
        });

        // Reduce order totals
        await tx.order.update({
          where: { id: actionRequest.orderId },
          data: {
            subtotal: { decrement: item.price * item.quantity },
            total: { decrement: item.price * item.quantity },
          },
        });
      } else if (actionRequest.type === "MODIFICATION") {
        // Get the new menu item details
        const newMenuItem = await tx.menuItem.findUnique({
          where: { id: actionRequest.newMenuItemId! },
        });

        if (!newMenuItem) {
          throw new Error("New menu item not found");
        }

        // Create replacement item
        const newItem = await tx.orderItem.create({
          data: {
            orderId: actionRequest.orderId,
            setId: item.setId,
            menuItemId: newMenuItem.id,
            name: newMenuItem.name,
            quantity: item.quantity,
            price: newMenuItem.price,
            changedFromId: item.id,
          },
        });

        // Mark old item as CHANGED
        await tx.orderItem.update({
          where: { id: item.id },
          data: {
            itemStatus: "CHANGED",
            changedToId: newItem.id,
          },
        });

        // Adjust order totals
        const priceDelta = (newMenuItem.price * item.quantity) - (item.price * item.quantity);
        if (priceDelta !== 0) {
          await tx.order.update({
            where: { id: actionRequest.orderId },
            data: {
              subtotal: { increment: priceDelta },
              total: { increment: priceDelta },
            },
          });
        }
      }

      // Mark request as approved
      await tx.actionRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          approvedById: authUser.id,
          resolvedAt: new Date(),
        },
      });
    });

    // Audit log
    await createOrderLog({
      orderId: actionRequest.orderId,
      action: actionRequest.type === "CANCELLATION" ? "CANCEL_REQUEST_APPROVED" : "MODIFY_REQUEST_APPROVED",
      performedById: authUser.id,
      approvedById: authUser.id,
      details: {
        requestId,
        itemId: item.id,
        itemName: item.name,
        type: actionRequest.type,
      } as Prisma.InputJsonValue,
      reason: actionRequest.reason,
    });

    return NextResponse.json({ success: true, data: { requestId, status: "APPROVED" } });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      return handleAuthError(error);
    }
    console.error("Approve request error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to approve request" },
      { status: 500 }
    );
  }
}
