import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Delete in correct order (respecting foreign key constraints)
  console.log("Deleting existing data...");
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.address.deleteMany({});
  await prisma.menuItem.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("✅ Existing data cleared");

  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 10);
  await prisma.user.create({
    data: {
      email: "admin@foodiehub.com",
      password: hashedPassword,
      name: "Admin User",
      role: "ADMIN",
    },
  });

  // Create regular user
  const userPassword = await bcrypt.hash("user123", 10);
  await prisma.user.create({
    data: {
      email: "user@foodiehub.com",
      password: userPassword,
      name: "John Doe",
      phone: "555-0123",
      role: "USER",
    },
  });

  console.log("✅ Users created");

  // Create menu items
  const menuItems = [
    {
      name: "Margherita Pizza",
      description:
        "Fresh mozzarella, tomatoes, and basil on a crispy thin crust",
      price: 12.99,
      category: "PIZZA" as const,
      image: "🍕",
      rating: 4.8,
      prepTime: "20-25 min",
    },
    {
      name: "Pepperoni Pizza",
      description: "Classic pepperoni with extra cheese and Italian herbs",
      price: 14.99,
      category: "PIZZA" as const,
      image: "🍕",
      rating: 4.9,
      prepTime: "20-25 min",
    },
    {
      name: "Beef Burger",
      description: "Angus beef patty, lettuce, tomato, and special sauce",
      price: 14.99,
      category: "BURGERS" as const,
      image: "🍔",
      rating: 4.7,
      prepTime: "15-20 min",
    },
    {
      name: "Chicken Burger",
      description: "Grilled chicken breast with mayo and crispy lettuce",
      price: 12.99,
      category: "BURGERS" as const,
      image: "🍔",
      rating: 4.6,
      prepTime: "15-20 min",
    },
    {
      name: "Pasta Carbonara",
      description: "Creamy sauce with bacon, parmesan, and black pepper",
      price: 13.99,
      category: "PASTA" as const,
      image: "🍝",
      rating: 4.6,
      prepTime: "20-25 min",
    },
    {
      name: "Spaghetti Bolognese",
      description: "Traditional meat sauce with fresh tomatoes and herbs",
      price: 12.99,
      category: "PASTA" as const,
      image: "🍝",
      rating: 4.7,
      prepTime: "20-25 min",
    },
    {
      name: "Grilled Salmon",
      description: "Atlantic salmon with lemon butter and vegetables",
      price: 18.99,
      category: "SEAFOOD" as const,
      image: "🐟",
      rating: 4.9,
      prepTime: "25-30 min",
    },
    {
      name: "Sushi Platter",
      description: "Assorted nigiri and maki rolls with wasabi and ginger",
      price: 24.99,
      category: "SEAFOOD" as const,
      image: "🍣",
      rating: 4.8,
      prepTime: "25-30 min",
    },
    {
      name: "Caesar Salad",
      description: "Romaine lettuce, parmesan, croutons, and Caesar dressing",
      price: 8.99,
      category: "SALADS" as const,
      image: "🥗",
      rating: 4.5,
      prepTime: "10-15 min",
    },
    {
      name: "Greek Salad",
      description: "Feta cheese, olives, tomatoes, and olive oil dressing",
      price: 9.99,
      category: "SALADS" as const,
      image: "🥗",
      rating: 4.6,
      prepTime: "10-15 min",
    },
    {
      name: "Chocolate Cake",
      description: "Rich chocolate layer cake with chocolate frosting",
      price: 6.99,
      category: "DESSERTS" as const,
      image: "🍰",
      rating: 4.9,
      prepTime: "5 min",
    },
    {
      name: "Ice Cream Sundae",
      description: "Vanilla ice cream with chocolate sauce and nuts",
      price: 5.99,
      category: "DESSERTS" as const,
      image: "🍨",
      rating: 4.7,
      prepTime: "5 min",
    },
    {
      name: "Chicken Wings",
      description: "Spicy buffalo wings served with ranch dressing",
      price: 11.99,
      category: "APPETIZERS" as const,
      image: "🍗",
      rating: 4.4,
      prepTime: "15-20 min",
    },
    {
      name: "French Fries",
      description: "Crispy golden fries with ketchup and mayo",
      price: 4.99,
      category: "APPETIZERS" as const,
      image: "🍟",
      rating: 4.5,
      prepTime: "10-15 min",
    },
    {
      name: "Coca Cola",
      description: "Classic refreshing Coca Cola (330ml)",
      price: 2.99,
      category: "DRINKS" as const,
      image: "🥤",
      rating: 4.8,
      prepTime: "2 min",
    },
    {
      name: "Fresh Orange Juice",
      description: "Freshly squeezed orange juice (500ml)",
      price: 4.99,
      category: "DRINKS" as const,
      image: "🍊",
      rating: 4.7,
      prepTime: "5 min",
    },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.create({
      data: {
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        image: item.image,
        rating: item.rating,
        prepTime: item.prepTime,
        available: true,
      },
    });
  }

  console.log("✅ Menu items created");
  console.log("\n🎉 Database seeded successfully!");
  console.log("📧 Admin: admin@foodiehub.com / admin123");
  console.log("📧 User: user@foodiehub.com / user123");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
