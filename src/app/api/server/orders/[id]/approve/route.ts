import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/auth";
import { createOrderLog } from "@/lib/order-log";

// PATCH - Approve a QR order (send its DRAFT set to kitchen)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(req, { roles: ["SERVER", "ADMIN"] });
    const { id: orderId } = await params;

    // Validate order exists and is a QR order (createdById is null)
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        sets: { orderBy: { setNumber: "asc" } },
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

    // Find first DRAFT set
    const draftSet = order.sets.find((s) => s.status === "DRAFT");
    if (!draftSet) {
      return NextResponse.json(
        { success: false, error: "No draft set to approve" },
        { status: 400 }
      );
    }

    // Update set to PENDING
    await prisma.orderSet.update({
      where: { id: draftSet.id },
      data: {
        status: "PENDING",
        sentAt: new Date(),
      },
    });

    // Create audit log
    await createOrderLog({
      orderId,
      action: "QR_ORDER_APPROVED",
      performedById: authUser.id,
      details: { setNumber: draftSet.setNumber, setId: draftSet.id },
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
    console.error("Approve QR order error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to approve order" },
      { status: 500 }
    );
  }
}
