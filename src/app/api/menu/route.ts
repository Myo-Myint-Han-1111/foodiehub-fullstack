import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Category } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const items = await prisma.menuItem.findMany({
      where: {
        ...(category &&
          category !== "ALL" && { category: category as Category }),
        available: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ success: true, data: items });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch menu items" },
      { status: 500 }
    );
  }
}
