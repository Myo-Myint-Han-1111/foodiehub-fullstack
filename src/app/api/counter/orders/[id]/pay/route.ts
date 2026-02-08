import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/auth";
import { createOrderLog } from "@/lib/order-log";
import type { Prisma } from "@prisma/client";

// PATCH - Mark order as paid
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(req, { roles: ["COUNTER", "ADMIN"] });
    const { id: orderId } = await params;

    const body = await req.json().catch(() => ({}));
    const paymentMethod: string = body.paymentMethod || "CASH";
    const autoClose: boolean = body.autoClose ?? true;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.paid) {
      return NextResponse.json(
        { success: false, error: "Order is already paid" },
        { status: 400 }
      );
    }

    if (order.status !== "READY_TO_PAY") {
      return NextResponse.json(
        { success: false, error: `Cannot pay — order status is ${order.status}` },
        { status: 400 }
      );
    }

    const newStatus = autoClose ? "CLOSED" : "PAID";

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paid: true,
        paymentMethod,
        paidAt: new Date(),
        status: newStatus,
      },
      include: {
        items: true,
        sets: {
          include: { items: true },
          orderBy: { setNumber: "asc" },
        },
      },
    });

    await createOrderLog({
      orderId,
      action: "ORDER_PAID",
      performedById: authUser.id,
      details: {
        paymentMethod,
        total: order.total,
        autoClose,
        newStatus,
      } as Prisma.InputJsonValue,
    });

    return NextResponse.json({ success: true, data: updatedOrder });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      return handleAuthError(error);
    }
    console.error("Payment error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process payment" },
      { status: 500 }
    );
  }
}
