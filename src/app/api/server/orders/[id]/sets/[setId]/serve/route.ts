import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/auth";
import { createOrderLog } from "@/lib/order-log";

// PATCH - Mark a READY set as SERVED
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; setId: string }> }
) {
  try {
    const authUser = await requireAuth(req, { roles: ["SERVER", "ADMIN"] });
    const { id: orderId, setId } = await params;

    const orderSet = await prisma.orderSet.findFirst({
      where: { id: setId, orderId },
    });

    if (!orderSet) {
      return NextResponse.json(
        { success: false, error: "Set not found for this order" },
        { status: 404 }
      );
    }

    if (orderSet.status !== "READY") {
      return NextResponse.json(
        { success: false, error: "Set is not in READY status" },
        { status: 400 }
      );
    }

    await prisma.orderSet.update({
      where: { id: setId },
      data: {
        status: "SERVED",
        servedAt: new Date(),
      },
    });

    await createOrderLog({
      orderId,
      action: "SET_MARKED_SERVED",
      performedById: authUser.id,
      details: { setNumber: orderSet.setNumber, setId },
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
    console.error("Mark set served error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to mark set as served" },
      { status: 500 }
    );
  }
}
