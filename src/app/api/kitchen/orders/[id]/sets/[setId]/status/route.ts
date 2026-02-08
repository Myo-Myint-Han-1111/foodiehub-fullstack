import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SetStatus } from "@prisma/client";
import { requireAuth, handleAuthError } from "@/lib/auth";
import { createOrderLog } from "@/lib/order-log";

const VALID_TRANSITIONS: Record<string, SetStatus[]> = {
  PENDING: ["PREPARING"],
  PREPARING: ["READY"],
};

// PATCH - Update set status (kitchen workflow: PENDING → PREPARING → READY)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; setId: string }> }
) {
  try {
    const authUser = await requireAuth(req, { roles: ["KITCHEN", "ADMIN"] });
    const { id: orderId, setId } = await params;
    const body = await req.json();
    const { status: newStatus } = body;

    // Validate the set
    const orderSet = await prisma.orderSet.findFirst({
      where: { id: setId, orderId },
    });

    if (!orderSet) {
      return NextResponse.json(
        { success: false, error: "Set not found for this order" },
        { status: 404 }
      );
    }

    // Validate transition
    const allowed = VALID_TRANSITIONS[orderSet.status];
    if (!allowed || !allowed.includes(newStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot transition from ${orderSet.status} to ${newStatus}`,
        },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: { status: SetStatus; readyAt?: Date } = {
      status: newStatus as SetStatus,
    };
    if (newStatus === "READY") {
      updateData.readyAt = new Date();
    }

    // Update set
    await prisma.orderSet.update({
      where: { id: setId },
      data: updateData,
    });

    // Audit log
    const actionMap: Record<string, string> = {
      PREPARING: "SET_STARTED_PREPARING",
      READY: "SET_MARKED_READY",
    };

    await createOrderLog({
      orderId,
      action: actionMap[newStatus] || `SET_STATUS_${newStatus}`,
      performedById: authUser.id,
      details: { setId, setNumber: orderSet.setNumber, from: orderSet.status, to: newStatus },
    });

    // Return updated set with order context
    const updatedSet = await prisma.orderSet.findUniqueOrThrow({
      where: { id: setId },
      include: {
        items: true,
        order: {
          select: {
            id: true,
            orderNumber: true,
            orderType: true,
            tableNumber: true,
            total: true,
            status: true,
            createdAt: true,
            createdById: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: updatedSet });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      return handleAuthError(error);
    }
    console.error("Update set status error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update set status" },
      { status: 500 }
    );
  }
}
