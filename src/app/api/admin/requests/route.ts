import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/auth";

// GET - List pending action requests for admin
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req, { roles: ["ADMIN"] });

    const requests = await prisma.actionRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
      },
    });

    // Enrich with item and order details
    const enriched = await Promise.all(
      requests.map(async (req) => {
        const item = await prisma.orderItem.findUnique({
          where: { id: req.orderItemId },
          include: {
            set: { select: { id: true, setNumber: true, status: true } },
          },
        });

        const order = await prisma.order.findUnique({
          where: { id: req.orderId },
          select: {
            id: true,
            orderNumber: true,
            orderType: true,
            tableNumber: true,
            status: true,
          },
        });

        let newMenuItem = null;
        if (req.newMenuItemId) {
          newMenuItem = await prisma.menuItem.findUnique({
            where: { id: req.newMenuItemId },
            select: { id: true, name: true, price: true },
          });
        }

        return {
          ...req,
          item,
          order,
          newMenuItem,
        };
      })
    );

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      return handleAuthError(error);
    }
    console.error("List admin requests error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to list requests" },
      { status: 500 }
    );
  }
}
