import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
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

    // Get orders within date range
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
        status: {
          not: "CANCELLED",
        },
      },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Calculate statistics
    const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    const paidOrders = orders.filter((o) => o.paid).length;
    const unpaidOrders = totalOrders - paidOrders;

    // Group by date for chart
    const salesByDate: { [key: string]: number } = {};
    const ordersByDate: { [key: string]: number } = {};

    orders.forEach((order) => {
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

    // Convert to array for charts
    const chartData = Object.keys(salesByDate).map((date) => ({
      date,
      sales: salesByDate[date],
      orders: ordersByDate[date],
    }));

    // Top selling items
    const itemCounts: { [key: string]: { count: number; revenue: number } } =
      {};

    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (!itemCounts[item.name]) {
          itemCounts[item.name] = { count: 0, revenue: 0 };
        }
        itemCounts[item.name].count += item.quantity;
        itemCounts[item.name].revenue += item.price * item.quantity;
      });
    });

    const topItems = Object.entries(itemCounts)
      .map(([name, data]) => ({
        name,
        quantity: data.count,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return NextResponse.json({
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
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
