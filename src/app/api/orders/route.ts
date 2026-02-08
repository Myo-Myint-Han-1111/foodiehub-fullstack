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
    const body: OrderRequestBody = await req.json();
    const { orderType, tableNumber, items, total } = body;

    console.log("📥 Received order request:");
    console.log("  - Order Type:", orderType);
    console.log("  - Table Number:", tableNumber);
    console.log("  - Items Count:", items?.length);
    console.log("  - Total:", total);

    // Validate order type
    if (!orderType || (orderType !== "dine-in" && orderType !== "takeaway")) {
      console.error("❌ Invalid order type:", orderType);
      return NextResponse.json(
        { success: false, error: "Invalid order type" },
        { status: 400 }
      );
    }

    // Validate table number for dine-in
    if (orderType === "dine-in" && !tableNumber) {
      console.error("❌ Table number missing for dine-in order");
      return NextResponse.json(
        { success: false, error: "Table number required for dine-in" },
        { status: 400 }
      );
    }

    // Validate items
    if (!items || items.length === 0) {
      console.error("❌ No items in order");
      return NextResponse.json(
        { success: false, error: "Order must contain at least one item" },
        { status: 400 }
      );
    }

    // Convert order type to enum format
    const orderTypeEnum = orderType === "dine-in" ? "DINEIN" : "TAKEAWAY";

    console.log("💾 Creating order in database...");

    // Create order with set in a transaction (QR orders start as DRAFT)
    const order = await prisma.$transaction(async (tx) => {
      // 1. Create the order
      const newOrder = await tx.order.create({
        data: {
          orderType: orderTypeEnum,
          tableNumber: orderType === "dine-in" ? tableNumber : null,
          total: total,
          subtotal: total,
        },
      });

      // 2. Create OrderSet (DRAFT for QR orders — needs server approval)
      const orderSet = await tx.orderSet.create({
        data: {
          orderId: newOrder.id,
          setNumber: 1,
          status: "DRAFT",
        },
      });

      // 3. Create OrderItems linked to both order and set
      await tx.orderItem.createMany({
        data: items.map((item: OrderItemInput) => ({
          orderId: newOrder.id,
          setId: orderSet.id,
          menuItemId: item.menuItemId || null,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
      });

      // 4. Return full order with sets and items
      return tx.order.findUniqueOrThrow({
        where: { id: newOrder.id },
        include: {
          items: true,
          sets: { include: { items: true } },
        },
      });
    });

    console.log("✅ Order created successfully:", order.id);

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("❌ Create order error:", error);

    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    if (typeof error === "object" && error !== null && "code" in error) {
      const prismaError = error as { code?: string; meta?: unknown };
      console.error("Prisma error code:", prismaError.code);
      console.error("Prisma error meta:", prismaError.meta);
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create order",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // ✅ NEW: Custom date range parameters (for staff date filter)
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    // EXISTING: Quick time filters
    const timeFilter = searchParams.get("timeFilter"); // "2h", "24h", "30d", "all"
    const tableNumber = searchParams.get("tableNumber"); // For customer filtering
    const orderType = searchParams.get("orderType"); // "DINEIN" or "TAKEAWAY"

    console.log("📋 Fetching orders with filters:", {
      startDate: startDateParam,
      endDate: endDateParam,
      timeFilter,
      tableNumber,
      orderType,
    });

    // Build where clause
    const whereClause: {
      createdAt?: { gte?: Date; lte?: Date };
      tableNumber?: string;
      orderType?: "DINEIN" | "TAKEAWAY";
    } = {};

    // ✅ NEW: Handle custom date range (takes priority over timeFilter)
    if (startDateParam && endDateParam) {
      const startDate = new Date(startDateParam);
      const endDate = new Date(endDateParam);

      whereClause.createdAt = {
        gte: startDate,
        lte: endDate,
      };

      console.log("📅 Using custom date range:", {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      });
    }
    // EXISTING: Handle quick time filters (fallback)
    else if (timeFilter) {
      const now = new Date();
      let createdAfter: Date | undefined;

      switch (timeFilter) {
        case "2h":
          createdAfter = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
          break;
        case "24h":
          createdAfter = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
          break;
        case "30d":
          createdAfter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
          break;
        case "all":
        default:
          createdAfter = undefined; // No filter
          break;
      }

      if (createdAfter) {
        whereClause.createdAt = {
          gte: createdAfter,
        };
      }
    }

    // EXISTING: Customer session filters
    if (tableNumber) {
      whereClause.tableNumber = tableNumber;
      whereClause.orderType = "DINEIN";
    }

    if (orderType && !tableNumber) {
      whereClause.orderType = orderType as "DINEIN" | "TAKEAWAY";
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: true,
        sets: { include: { items: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`✅ Found ${orders.length} orders`);

    return NextResponse.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("❌ Get orders error:", error);

    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }

    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
