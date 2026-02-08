import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req, { roles: ["ADMIN"] });

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "daily"; // daily, monthly, yearly

    const now = new Date();
    let startDate: Date;

    // Calculate date range based on period
    switch (period) {
      case "daily":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "yearly":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    const dateFilter = {
      createdAt: { gte: startDate },
      status: { not: "CANCELLED" as const },
    };

    // Run all queries in parallel
    const [salesAgg, totalOrders, paidOrders, topItemsRaw, chartOrders] =
      await Promise.all([
        // Total sales via DB aggregation
        prisma.order.aggregate({
          where: dateFilter,
          _sum: { total: true },
        }),
        // Total order count
        prisma.order.count({ where: dateFilter }),
        // Paid order count
        prisma.order.count({
          where: { ...dateFilter, paid: true },
        }),
        // Top items via groupBy
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
        // Minimal data for chart
        prisma.order.findMany({
          where: dateFilter,
          select: { createdAt: true, total: true },
          orderBy: { createdAt: "asc" },
        }),
      ]);

    const totalSales = salesAgg._sum.total || 0;
    const unpaidOrders = totalOrders - paidOrders;

    // Group by date for chart
    const salesByDate: { [key: string]: number } = {};
    const ordersByDate: { [key: string]: number } = {};

    chartOrders.forEach((order) => {
      let dateKey: string;

      if (period === "daily") {
        dateKey = order.createdAt.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });
      } else if (period === "monthly") {
        dateKey = order.createdAt.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      } else {
        dateKey = order.createdAt.toLocaleDateString("en-US", {
          month: "short",
        });
      }

      salesByDate[dateKey] = (salesByDate[dateKey] || 0) + order.total;
      ordersByDate[dateKey] = (ordersByDate[dateKey] || 0) + 1;
    });

    const chartData = Object.keys(salesByDate).map((date) => ({
      date,
      sales: salesByDate[date],
      orders: ordersByDate[date],
    }));

    const topItems = topItemsRaw.map((item) => ({
      name: item.name,
      quantity: item._sum.quantity || 0,
      revenue: 0, // Revenue requires a separate query; quantity ranking is sufficient
    }));

    const response = NextResponse.json({
      success: true,
      data: {
        summary: {
          totalSales,
          totalOrders,
          paidOrders,
          unpaidOrders,
          averageOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,
        },
        chartData,
        topItems,
        period,
      },
    });
    response.headers.set("Cache-Control", "private, max-age=30");
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      return handleAuthError(error);
    }
    console.error("Analytics error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
