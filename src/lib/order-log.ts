import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

interface CreateOrderLogParams {
  orderId: string;
  action: string;
  performedById: string;
  details?: Prisma.InputJsonValue;
  approvedById?: string;
  reason?: string;
}

export async function createOrderLog({
  orderId,
  action,
  performedById,
  details,
  approvedById,
  reason,
}: CreateOrderLogParams) {
  return prisma.orderLog.create({
    data: {
      orderId,
      action,
      performedById,
      details: details ?? undefined,
      approvedById: approvedById ?? undefined,
      reason: reason ?? undefined,
    },
  });
}
