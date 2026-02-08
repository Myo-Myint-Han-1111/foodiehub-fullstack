import type {
  MenuItem,
  Order,
  OrderItem,
  User,
  Address,
  OrderSet,
  OrderLog,
  ActionRequest,
  SetStatus,
  ItemStatus,
  ActionRequestType,
  ActionRequestStatus,
  OrderStatus,
  Role,
} from "@prisma/client";

export type {
  MenuItem,
  Order,
  OrderItem,
  User,
  Address,
  OrderSet,
  OrderLog,
  ActionRequest,
  SetStatus,
  ItemStatus,
  ActionRequestType,
  ActionRequestStatus,
  OrderStatus,
  Role,
};

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: Omit<User, "password">;
  error?: string;
}

export interface OrderWithItems extends Order {
  items: (OrderItem & {
    menuItem: MenuItem;
  })[];
  address: Address;
  sets?: (OrderSet & {
    items: (OrderItem & {
      menuItem: MenuItem;
    })[];
  })[];
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
