import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Category } from "@prisma/client";
import { requireAuth, handleAuthError } from "@/lib/auth";

// GET single menu item
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Await params in Next.js 15
    const { id } = await context.params;

    const menuItem = await prisma.menuItem.findUnique({
      where: { id },
    });

    if (!menuItem) {
      return NextResponse.json(
        { success: false, error: "Menu item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: menuItem,
    });
  } catch (error) {
    console.error("GET menu item error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch menu item" },
      { status: 500 }
    );
  }
}

// PATCH (update) menu item (ADMIN only)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(request, { roles: ["ADMIN"] });

    // ✅ Await params in Next.js 15
    const { id } = await context.params;

    const body = await request.json();
    const {
      name,
      description,
      price,
      category,
      available,
      image,
      rating,
      prepTime,
    } = body;

    // Check if menu item exists
    const existing = await prisma.menuItem.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Menu item not found" },
        { status: 404 }
      );
    }

    // If updating name, check for duplicates
    if (name && name !== existing.name) {
      const duplicate = await prisma.menuItem.findUnique({
        where: { name },
      });

      if (duplicate) {
        return NextResponse.json(
          { success: false, error: "Menu item with this name already exists" },
          { status: 400 }
        );
      }
    }

    // Build update data object (only include provided fields)
    const updateData: {
      name?: string;
      description?: string;
      price?: number;
      category?: Category;
      available?: boolean;
      image?: string;
      rating?: number;
      prepTime?: string;
    } = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price.toString());
    if (category !== undefined) {
      // Validate category
      if (!Object.values(Category).includes(category as Category)) {
        return NextResponse.json(
          { success: false, error: "Invalid category" },
          { status: 400 }
        );
      }
      updateData.category = category as Category;
    }
    if (available !== undefined) updateData.available = available;
    if (image !== undefined) updateData.image = image;
    if (rating !== undefined) updateData.rating = parseFloat(rating.toString());
    if (prepTime !== undefined) updateData.prepTime = prepTime;

    const updatedItem = await prisma.menuItem.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updatedItem,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      return handleAuthError(error);
    }
    console.error("PATCH menu item error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update menu item" },
      { status: 500 }
    );
  }
}

// DELETE menu item (ADMIN only)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(request, { roles: ["ADMIN"] });

    // ✅ Await params in Next.js 15
    const { id } = await context.params;

    // Check if menu item exists
    const menuItem = await prisma.menuItem.findUnique({
      where: { id },
    });

    if (!menuItem) {
      return NextResponse.json(
        { success: false, error: "Menu item not found" },
        { status: 404 }
      );
    }

    // Delete the menu item
    await prisma.menuItem.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Menu item deleted successfully",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      return handleAuthError(error);
    }
    console.error("DELETE menu item error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete menu item" },
      { status: 500 }
    );
  }
}
