import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";

// PATCH - Update user
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { email, password, name, phone, role } = body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // If email is being changed, check if new email already exists
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return NextResponse.json(
          { success: false, error: "Email already exists" },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: {
      email?: string;
      name?: string;
      phone?: string | null;
      role?: Role;
      password?: string;
    } = {};

    if (email) updateData.email = email;
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (role) updateData.role = role as Role;

    // If password is provided, hash it
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Delete user
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
