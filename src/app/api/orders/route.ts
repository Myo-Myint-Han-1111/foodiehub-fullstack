import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { qrOrderSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    // Rate limit order creation (3 per minute per IP)
    const ip = getClientIp(req);
    const rateLimited = checkRateLimit(`order:${ip}`, {
      windowMs: 60 * 1000,
      maxAttempts: 3,
    });
    if (!rateLimited.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many orders. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Validate with Zod schema
    const parsed = qrOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid order data" },
        { status: 400 }
      );
    }

    const { orderType, tableNumber, items } = parsed.data;

    // Validate table number for dine-in
    if (orderType === "dine-in" && !tableNumber) {
      return NextResponse.json(
        { success: false, error: "Table number required for dine-in" },
        { status: 400 }
      );
    }

    // Convert order type to enum format
    const orderTypeEnum = orderType === "dine-in" ? "DINEIN" : "TAKEAWAY";

    // Look up menu item prices from DB (server-side total calculation)
    const menuItemIds = items.map((item) => item.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      select: { id: true, name: true, price: true, available: true },
    });

    const menuItemMap = new Map(menuItems.map((mi) => [mi.id, mi]));

    // Validate all menu items exist and are available
    for (const item of items) {
      const menuItem = menuItemMap.get(item.menuItemId);
      if (!menuItem) {
        return NextResponse.json(
          { success: false, error: `Menu item not found: ${item.menuItemId}` },
          { status: 400 }
        );
      }
      if (!menuItem.available) {
        return NextResponse.json(
          { success: false, error: `Menu item is not available: ${menuItem.name}` },
          { status: 400 }
        );
      }
    }

    // Calculate total server-side (ignore client-sent total/prices)
    const serverTotal = items.reduce((sum, item) => {
      const menuItem = menuItemMap.get(item.menuItemId)!;
      return sum + menuItem.price * item.quantity;
    }, 0);

    // Create order with set in a transaction (QR orders start as DRAFT)
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderType: orderTypeEnum,
          tableNumber: orderType === "dine-in" ? tableNumber : null,
          total: serverTotal,
          subtotal: serverTotal,
        },
      });

      const orderSet = await tx.orderSet.create({
        data: {
          orderId: newOrder.id,
          setNumber: 1,
          status: "DRAFT",
        },
      });

      await tx.orderItem.createMany({
        data: items.map((item) => {
          const menuItem = menuItemMap.get(item.menuItemId)!;
          return {
            orderId: newOrder.id,
            setId: orderSet.id,
            menuItemId: item.menuItemId,
            name: menuItem.name,
            quantity: item.quantity,
            price: menuItem.price,
          };
        }),
      });

      return tx.order.findUniqueOrThrow({
        where: { id: newOrder.id },
        include: {
          items: true,
          sets: { include: { items: true } },
        },
      });
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const timeFilter = searchParams.get("timeFilter");
    const tableNumber = searchParams.get("tableNumber");
    const orderType = searchParams.get("orderType");

    // Allow unauthenticated access only when tableNumber is present (QR customers)
    if (!tableNumber) {
      const user = await getAuthUser(req);
      if (!user) {
        return NextResponse.json(
          { success: false, error: "Authentication required" },
          { status: 401 }
        );
      }
    }

    // Build where clause
    const whereClause: {
      createdAt?: { gte?: Date; lte?: Date };
      tableNumber?: string;
      orderType?: "DINEIN" | "TAKEAWAY";
    } = {};

    if (startDateParam && endDateParam) {
      const startDate = new Date(startDateParam);
      const endDate = new Date(endDateParam);

      whereClause.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    } else if (timeFilter) {
      const now = new Date();
      let createdAfter: Date | undefined;

      switch (timeFilter) {
        case "2h":
          createdAfter = new Date(now.getTime() - 2 * 60 * 60 * 1000);
          break;
        case "24h":
          createdAfter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case "30d":
          createdAfter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "all":
        default:
          createdAfter = undefined;
          break;
      }

      if (createdAfter) {
        whereClause.createdAt = {
          gte: createdAfter,
        };
      }
    }

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
