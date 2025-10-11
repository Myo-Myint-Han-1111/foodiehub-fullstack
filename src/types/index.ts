import type { MenuItem, Order, OrderItem, User, Address } from "@prisma/client";

export type { MenuItem, Order, OrderItem, User, Address };

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface OrderWithItems extends Order {
  items: (OrderItem & {
    menuItem: MenuItem;
  })[];
  address: Address;
}

export interface UserWithOrders extends User {
  orders: OrderWithItems[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CartContextType {
  items: CartItem[];
  addItem: (item: MenuItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  itemCount: number;
}
