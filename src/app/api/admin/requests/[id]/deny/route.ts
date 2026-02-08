import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/auth";
import { createOrderLog } from "@/lib/order-log";
import type { Prisma } from "@prisma/client";

// PATCH - Deny an action request
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(req, { roles: ["ADMIN"] });
    const { id: requestId } = await params;

    const body = await req.json().catch(() => ({}));
    const denyReason = body.reason || "";

    const actionRequest = await prisma.actionRequest.findUnique({
      where: { id: requestId },
    });

    if (!actionRequest) {
      return NextResponse.json(
        { success: false, error: "Request not found" },
        { status: 404 }
      );
    }

    if (actionRequest.status !== "PENDING") {
      return NextResponse.json(
        { success: false, error: `Request is already ${actionRequest.status}` },
        { status: 400 }
      );
    }

    await prisma.actionRequest.update({
      where: { id: requestId },
      data: {
        status: "DENIED",
        approvedById: authUser.id,
        resolvedAt: new Date(),
      },
    });

    const item = await prisma.orderItem.findUnique({
      where: { id: actionRequest.orderItemId },
    });

    await createOrderLog({
      orderId: actionRequest.orderId,
      action: actionRequest.type === "CANCELLATION" ? "CANCEL_REQUEST_DENIED" : "MODIFY_REQUEST_DENIED",
      performedById: authUser.id,
      details: {
        requestId,
        itemId: actionRequest.orderItemId,
        itemName: item?.name || "Unknown",
        type: actionRequest.type,
        denyReason,
      } as Prisma.InputJsonValue,
    });

    return NextResponse.json({ success: true, data: { requestId, status: "DENIED" } });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      return handleAuthError(error);
    }
    console.error("Deny request error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to deny request" },
      { status: 500 }
    );
  }
}
