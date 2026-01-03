import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Category } from "@prisma/client";

// GET all menu items
export async function GET() {
  try {
    const menuItems = await prisma.menuItem.findMany({
      orderBy: {
        category: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: menuItems,
    });
  } catch (error) {
    console.error("Get menu items error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch menu items" },
      { status: 500 }
    );
  }
}

// POST - Create new menu item
export async function POST(req: NextRequest) {
  try {
    const {
      name,
      description,
      price,
      category,
      image,
      rating,
      prepTime,
      available,
    } = await req.json();

    // Validate required fields
    if (!name || !description || !price || !category || !image || !prepTime) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate category is valid enum value
    if (!Object.values(Category).includes(category as Category)) {
      return NextResponse.json(
        { success: false, error: "Invalid category" },
        { status: 400 }
      );
    }

    // Check if item with same name already exists
    const existing = await prisma.menuItem.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Menu item with this name already exists" },
        { status: 400 }
      );
    }

    // Create menu item
    const menuItem = await prisma.menuItem.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        category: category as Category,
        image,
        rating: rating ? parseFloat(rating) : 4.5,
        prepTime,
        available: available !== undefined ? available : true,
      },
    });

    return NextResponse.json({
      success: true,
      data: menuItem,
    });
  } catch (error) {
    console.error("Create menu item error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create menu item" },
      { status: 500 }
    );
  }
}
