import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/auth";
import { createOrderLog } from "@/lib/order-log";
import type { Prisma } from "@prisma/client";

interface CreateRequestBody {
  type: "CANCELLATION" | "MODIFICATION";
  itemId: string;
  orderId: string;
  reason: string;
  newMenuItemId?: string;
}

// POST - Create an action request for items in PREPARING sets
export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req, { roles: ["SERVER", "ADMIN"] });
    const body: CreateRequestBody = await req.json();
    const { type, itemId, orderId, reason, newMenuItemId } = body;

    if (!type || !itemId || !orderId || !reason?.trim()) {
      return NextResponse.json(
        { success: false, error: "type, itemId, orderId, and reason are required" },
        { status: 400 }
      );
    }

    if (type !== "CANCELLATION" && type !== "MODIFICATION") {
      return NextResponse.json(
        { success: false, error: "type must be CANCELLATION or MODIFICATION" },
        { status: 400 }
      );
    }

    if (type === "MODIFICATION" && !newMenuItemId) {
      return NextResponse.json(
        { success: false, error: "newMenuItemId is required for MODIFICATION requests" },
        { status: 400 }
      );
    }

    // Validate the item exists and is in a PREPARING set
    const item = await prisma.orderItem.findFirst({
      where: { id: itemId, orderId },
      include: { set: true },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }

    if (item.itemStatus !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "Item is not active" },
        { status: 400 }
      );
    }

    if (!item.set || item.set.status !== "PREPARING") {
      return NextResponse.json(
        { success: false, error: "Item must be in a PREPARING set to create a request" },
        { status: 400 }
      );
    }

    // Check for existing pending request on this item
    const existingRequest = await prisma.actionRequest.findFirst({
      where: { orderItemId: itemId, status: "PENDING" },
    });

    if (existingRequest) {
      return NextResponse.json(
        { success: false, error: "There is already a pending request for this item" },
        { status: 409 }
      );
    }

    const actionRequest = await prisma.actionRequest.create({
      data: {
        type,
        orderItemId: itemId,
        orderId,
        reason: reason.trim(),
        newMenuItemId: type === "MODIFICATION" ? newMenuItemId : null,
        createdById: authUser.id,
      },
    });

    await createOrderLog({
      orderId,
      action: type === "CANCELLATION" ? "CANCEL_REQUEST_CREATED" : "MODIFY_REQUEST_CREATED",
      performedById: authUser.id,
      details: {
        requestId: actionRequest.id,
        itemId,
        itemName: item.name,
        type,
        newMenuItemId: newMenuItemId || null,
      } as Prisma.InputJsonValue,
      reason: reason.trim(),
    });

    return NextResponse.json({ success: true, data: actionRequest });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      return handleAuthError(error);
    }
    console.error("Create action request error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create request" },
      { status: 500 }
    );
  }
}

// GET - List action requests (for current server user)
export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req, { roles: ["SERVER", "ADMIN"] });

    const requests = await prisma.actionRequest.findMany({
      where: authUser.role === "ADMIN" ? {} : { createdById: authUser.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ success: true, data: requests });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      return handleAuthError(error);
    }
    console.error("List requests error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to list requests" },
      { status: 500 }
    );
  }
}
