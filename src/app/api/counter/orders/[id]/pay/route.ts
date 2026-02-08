import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/auth";
import { createOrderLog } from "@/lib/order-log";
import type { Prisma } from "@prisma/client";

// PATCH - Mark order as paid (with transaction to prevent double-payment)
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

    const newStatus = autoClose ? "CLOSED" : "PAID";

    // Wrap in transaction with re-fetch to prevent race condition
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw Object.assign(new Error("Order not found"), { statusCode: 404 });
      }

      if (order.paid) {
        throw Object.assign(new Error("Order is already paid"), { statusCode: 400 });
      }

      if (order.status !== "READY_TO_PAY") {
        throw Object.assign(
          new Error(`Cannot pay — order status is ${order.status}`),
          { statusCode: 400 }
        );
      }

      const result = await tx.order.update({
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

      await tx.orderLog.create({
        data: {
          orderId,
          action: "ORDER_PAID",
          performedById: authUser.id,
          details: {
            paymentMethod,
            total: order.total,
            autoClose,
            newStatus,
          } as Prisma.InputJsonValue,
        },
      });

      return result;
    });

    return NextResponse.json({ success: true, data: updatedOrder });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      return handleAuthError(error);
    }
    const statusCode = (error as { statusCode?: number }).statusCode;
    if (statusCode) {
      return NextResponse.json(
        { success: false, error: (error as Error).message },
        { status: statusCode }
      );
    }
    console.error("Payment error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process payment" },
      { status: 500 }
    );
  }
}
