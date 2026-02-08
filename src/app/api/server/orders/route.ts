import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/auth";
import { createOrderLog } from "@/lib/order-log";

interface OrderItemInput {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
}

interface CreateOrderBody {
  tableNumber?: string;
  orderType: "DINEIN" | "TAKEAWAY";
  items: OrderItemInput[];
  sendToKitchen: boolean;
}

// GET - Fetch today's orders for server dashboard
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req, { roles: ["SERVER", "ADMIN"] });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: todayStart },
      },
      include: {
        items: true,
        sets: {
          include: { items: true },
          orderBy: { setNumber: "asc" },
        },
        createdBy: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const response = NextResponse.json({ success: true, data: orders });
    response.headers.set("Cache-Control", "private, max-age=2");
    return response;
  } catch (error) {
    return handleAuthError(error);
  }
}

// POST - Create a new order (server-created)
export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req, { roles: ["SERVER", "ADMIN"] });
    const body: CreateOrderBody = await req.json();
    const { tableNumber, orderType, items, sendToKitchen } = body;

    // Validate
    if (!orderType || !["DINEIN", "TAKEAWAY"].includes(orderType)) {
      return NextResponse.json(
        { success: false, error: "Invalid order type" },
        { status: 400 }
      );
    }

    if (orderType === "DINEIN" && !tableNumber) {
      return NextResponse.json(
        { success: false, error: "Table number required for dine-in" },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Order must contain at least one item" },
        { status: 400 }
      );
    }

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const total = subtotal;

    const setStatus = sendToKitchen ? "PENDING" : "DRAFT";

    const order = await prisma.$transaction(async (tx) => {
      // 1. Create order with createdById (server-created)
      const newOrder = await tx.order.create({
        data: {
          orderType,
          tableNumber: orderType === "DINEIN" ? tableNumber : null,
          subtotal,
          total,
          createdById: authUser.id,
        },
      });

      // 2. Create OrderSet
      const orderSet = await tx.orderSet.create({
        data: {
          orderId: newOrder.id,
          setNumber: 1,
          status: setStatus,
          sentAt: sendToKitchen ? new Date() : null,
        },
      });

      // 3. Create OrderItems linked to order and set
      await tx.orderItem.createMany({
        data: items.map((item) => ({
          orderId: newOrder.id,
          setId: orderSet.id,
          menuItemId: item.menuItemId || null,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
      });

      // 4. Return full order
      return tx.order.findUniqueOrThrow({
        where: { id: newOrder.id },
        include: {
          items: true,
          sets: {
            include: { items: true },
            orderBy: { setNumber: "asc" },
          },
        },
      });
    });

    // Create audit logs (outside transaction is fine)
    await createOrderLog({
      orderId: order.id,
      action: "ORDER_CREATED",
      performedById: authUser.id,
      details: { orderType, tableNumber, itemCount: items.length, sendToKitchen },
    });

    if (sendToKitchen) {
      await createOrderLog({
        orderId: order.id,
        action: "SET_SENT_TO_KITCHEN",
        performedById: authUser.id,
        details: { setNumber: 1 },
      });
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      return handleAuthError(error);
    }
    console.error("Create server order error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create order" },
      { status: 500 }
    );
  }
}
