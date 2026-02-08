import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/auth";
import { createOrderLog } from "@/lib/order-log";

interface AddSetItemInput {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
}

interface AddSetBody {
  items: AddSetItemInput[];
  sendToKitchen: boolean;
}

// POST - Add a new set to an existing order
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(req, { roles: ["SERVER", "ADMIN"] });
    const { id: orderId } = await params;
    const body: AddSetBody = await req.json();
    const { items, sendToKitchen } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Items are required" },
        { status: 400 }
      );
    }

    // Verify order exists and is open
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { sets: { orderBy: { setNumber: "desc" }, take: 1 } },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.status === "CANCELLED" || order.status === "CLOSED") {
      return NextResponse.json(
        { success: false, error: "Cannot add sets to a cancelled or closed order" },
        { status: 400 }
      );
    }

    const nextSetNumber = (order.sets[0]?.setNumber ?? 0) + 1;
    const setStatus = sendToKitchen ? "PENDING" : "DRAFT";
    const additionalTotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Create the new set
      const newSet = await tx.orderSet.create({
        data: {
          orderId,
          setNumber: nextSetNumber,
          status: setStatus,
          sentAt: sendToKitchen ? new Date() : null,
        },
      });

      // Create items linked to order + set
      await tx.orderItem.createMany({
        data: items.map((item) => ({
          orderId,
          setId: newSet.id,
          menuItemId: item.menuItemId || null,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
      });

      // Update order totals
      await tx.order.update({
        where: { id: orderId },
        data: {
          subtotal: { increment: additionalTotal },
          total: { increment: additionalTotal },
        },
      });

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

    await createOrderLog({
      orderId,
      action: "SET_ADDED",
      performedById: authUser.id,
      details: {
        setNumber: nextSetNumber,
        itemCount: items.length,
        sendToKitchen,
        additionalTotal,
      },
    });

    if (sendToKitchen) {
      await createOrderLog({
        orderId,
        action: "SET_SENT_TO_KITCHEN",
        performedById: authUser.id,
        details: { setNumber: nextSetNumber },
      });
    }

    return NextResponse.json({ success: true, data: updatedOrder });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      return handleAuthError(error);
    }
    console.error("Add set to order error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add set to order" },
      { status: 500 }
    );
  }
}
