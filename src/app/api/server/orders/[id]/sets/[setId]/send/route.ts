import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/auth";
import { createOrderLog } from "@/lib/order-log";

// PATCH - Send a draft set to the kitchen
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; setId: string }> }
) {
  try {
    const authUser = await requireAuth(req, { roles: ["SERVER", "ADMIN"] });
    const { id: orderId, setId } = await params;

    // Validate set belongs to order and is in DRAFT status
    const orderSet = await prisma.orderSet.findFirst({
      where: {
        id: setId,
        orderId: orderId,
      },
    });

    if (!orderSet) {
      return NextResponse.json(
        { success: false, error: "Set not found for this order" },
        { status: 404 }
      );
    }

    if (orderSet.status !== "DRAFT") {
      return NextResponse.json(
        { success: false, error: "Set is not in DRAFT status" },
        { status: 400 }
      );
    }

    // Update set to PENDING
    await prisma.orderSet.update({
      where: { id: setId },
      data: {
        status: "PENDING",
        sentAt: new Date(),
      },
    });

    // Create audit log
    await createOrderLog({
      orderId,
      action: "SET_SENT_TO_KITCHEN",
      performedById: authUser.id,
      details: { setNumber: orderSet.setNumber, setId },
    });

    // Return updated order with sets
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
    console.error("Send set to kitchen error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send set to kitchen" },
      { status: 500 }
    );
  }
}
