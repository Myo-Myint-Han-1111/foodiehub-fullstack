import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/auth";

// GET - Admin reports with aggregated statistics
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req, { roles: ["ADMIN"] });

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "today"; // today, week, month, all, custom
    const customDate = searchParams.get("date"); // YYYY-MM-DD for single day

    // Calculate date range
    const now = new Date();
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (period === "custom" && customDate) {
      startDate = new Date(customDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(customDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      switch (period) {
        case "today":
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "all":
          startDate = undefined;
          break;
      }
    }

    const dateFilter = startDate
      ? endDate
        ? { createdAt: { gte: startDate, lte: endDate } }
        : { createdAt: { gte: startDate } }
      : {};

    // Run all queries in parallel
    const [
      orders,
      wastedItems,
      cancelledOrders,
      popularItems,
      recentLogs,
    ] = await Promise.all([
      // All orders in period
      prisma.order.findMany({
        where: dateFilter,
        include: {
          items: true,
          sets: { include: { items: true } },
        },
      }),

      // Wasted items in period
      prisma.orderItem.findMany({
        where: {
          itemStatus: "WASTED",
          order: dateFilter,
        },
      }),

      // Cancelled orders in period
      prisma.order.count({
        where: {
          ...dateFilter,
          status: "CANCELLED",
        },
      }),

      // Popular items (top 10 by quantity)
      prisma.orderItem.groupBy({
        by: ["name"],
        where: {
          itemStatus: "ACTIVE",
          order: dateFilter,
        },
        _sum: { quantity: true },
        _count: { id: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 10,
      }),

      // Recent audit logs
      prisma.orderLog.findMany({
        where: dateFilter,
        include: {
          performedBy: { select: { id: true, name: true, role: true } },
          order: { select: { id: true, orderNumber: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    // Compute stats
    const totalOrders = orders.length;
    const paidOrders = orders.filter((o) => o.paid);
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
    const avgOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

    // Order status breakdown
    const statusBreakdown: Record<string, number> = {};
    for (const order of orders) {
      statusBreakdown[order.status] = (statusBreakdown[order.status] || 0) + 1;
    }

    // Payment method breakdown
    const paymentBreakdown: Record<string, number> = {};
    for (const order of paidOrders) {
      const method = order.paymentMethod || "CASH";
      paymentBreakdown[method] = (paymentBreakdown[method] || 0) + 1;
    }

    // Payment method revenue
    const paymentRevenue: Record<string, number> = {};
    for (const order of paidOrders) {
      const method = order.paymentMethod || "CASH";
      paymentRevenue[method] = (paymentRevenue[method] || 0) + order.total;
    }

    // Order type breakdown
    const orderTypeBreakdown: Record<string, number> = {};
    for (const order of orders) {
      orderTypeBreakdown[order.orderType] = (orderTypeBreakdown[order.orderType] || 0) + 1;
    }

    // Hourly order volume (for today or custom single day)
    const hourlyVolume: { hour: number; label: string; count: number; revenue: number }[] = [];
    if (period === "today" || period === "custom") {
      for (let h = 0; h < 24; h++) {
        const hourOrders = orders.filter((o) => {
          const orderHour = new Date(o.createdAt).getHours();
          return orderHour === h;
        });
        const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        const ampm = h < 12 ? "AM" : "PM";
        hourlyVolume.push({
          hour: h,
          label: `${hour12}${ampm}`,
          count: hourOrders.length,
          revenue: hourOrders.filter((o) => o.paid).reduce((s, o) => s + o.total, 0),
        });
      }
    }

    // Waste summary
    const wasteTotal = wastedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const wasteCount = wastedItems.length;

    // Popular items formatted
    const topItems = popularItems.map((item) => ({
      name: item.name,
      totalQuantity: item._sum.quantity || 0,
      orderCount: item._count.id,
    }));

    return NextResponse.json({
      success: true,
      data: {
        period,
        summary: {
          totalOrders,
          paidOrders: paidOrders.length,
          cancelledOrders,
          totalRevenue,
          avgOrderValue,
        },
        statusBreakdown,
        paymentBreakdown,
        paymentRevenue,
        orderTypeBreakdown,
        hourlyVolume,
        waste: {
          count: wasteCount,
          total: wasteTotal,
          items: wastedItems.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            price: i.price,
            loss: i.price * i.quantity,
          })),
        },
        topItems,
        recentLogs: recentLogs.map((log) => ({
          id: log.id,
          action: log.action,
          orderNumber: log.order.orderNumber,
          orderId: log.orderId,
          performedBy: log.performedBy.name,
          performerRole: log.performedBy.role,
          details: log.details,
          reason: log.reason,
          createdAt: log.createdAt,
        })),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      return handleAuthError(error);
    }
    console.error("Admin reports error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate reports" },
      { status: 500 }
    );
  }
}
