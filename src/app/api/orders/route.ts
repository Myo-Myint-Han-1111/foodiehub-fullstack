import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Define the type for order items
interface OrderItemInput {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
}

interface OrderRequestBody {
  orderType: string;
  tableNumber?: string;
  items: OrderItemInput[];
  total: number;
}

export async function POST(req: NextRequest) {
  try {
    const { orderType, tableNumber, items, total }: OrderRequestBody =
      await req.json();

    // Validate order type
    if (!orderType || (orderType !== "dine-in" && orderType !== "takeaway")) {
      return NextResponse.json(
        { success: false, error: "Invalid order type" },
        { status: 400 }
      );
    }

    // Validate table number for dine-in
    if (orderType === "dine-in" && !tableNumber) {
      return NextResponse.json(
        { success: false, error: "Table number required for dine-in" },
        { status: 400 }
      );
    }

    // Validate items
    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Order must contain at least one item" },
        { status: 400 }
      );
    }

    // Convert order type to enum format
    const orderTypeEnum = orderType === "dine-in" ? "DINEIN" : "TAKEAWAY";

    // Create order
    const order = await prisma.order.create({
      data: {
        orderType: orderTypeEnum,
        tableNumber: orderType === "dine-in" ? tableNumber : null,
        total: total,
        subtotal: total,
        items: {
          create: items.map((item: OrderItemInput) => ({
            menuItemId: item.menuItemId,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create order" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Get orders error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
