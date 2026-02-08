import { z } from "zod";

// Auth Schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
});

// Address Schema
export const addressSchema = z.object({
  street: z.string().min(5, "Street address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zipCode: z.string().min(5, "ZIP code is required"),
  isDefault: z.boolean().optional(),
});

// Order Schema
export const createOrderSchema = z.object({
  items: z.array(
    z.object({
      menuItemId: z.string(),
      quantity: z.number().min(1),
      price: z.number(),
    })
  ),
  addressId: z.string(),
});

// QR Order Schema (public-facing orders from QR code)
export const qrOrderSchema = z.object({
  orderType: z.enum(["dine-in", "takeaway"]),
  tableNumber: z.string().optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1, "Menu item ID is required"),
        name: z.string().min(1),
        quantity: z.number().int().min(1).max(100),
      })
    )
    .min(1, "Order must contain at least one item"),
});

// Menu Item Schema
export const menuItemSchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.number().positive("Price must be positive"),
  category: z.enum([
    "PIZZA",
    "BURGERS",
    "PASTA",
    "SEAFOOD",
    "SALADS",
    "DESSERTS",
    "APPETIZERS",
    "DRINKS",
  ]),
  image: z.string(),
  prepTime: z.string(),
  available: z.boolean().optional(),
});

// User management schemas (admin)
export const userCreateSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  role: z.enum(["CUSTOMER", "SERVER", "KITCHEN", "COUNTER", "ADMIN"]).optional(),
});

export const userUpdateSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  phone: z.string().nullable().optional(),
  role: z.enum(["CUSTOMER", "SERVER", "KITCHEN", "COUNTER", "ADMIN"]).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type MenuItemInput = z.infer<typeof menuItemSchema>;
export type QrOrderInput = z.infer<typeof qrOrderSchema>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
