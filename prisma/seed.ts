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

  // Create menu items with real food images from Unsplash
  const menuItems = [
    {
      name: "Margherita Pizza",
      description:
        "Fresh mozzarella, tomatoes, and basil on a crispy thin crust",
      price: 12.99,
      category: "PIZZA" as const,
      image:
        "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80",
      rating: 4.8,
      prepTime: "20-25 min",
    },
    {
      name: "Pepperoni Pizza",
      description: "Classic pepperoni with extra cheese and Italian herbs",
      price: 14.99,
      category: "PIZZA" as const,
      image:
        "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&q=80",
      rating: 4.9,
      prepTime: "20-25 min",
    },
    {
      name: "Beef Burger",
      description: "Angus beef patty, lettuce, tomato, and special sauce",
      price: 14.99,
      category: "BURGERS" as const,
      image:
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80",
      rating: 4.7,
      prepTime: "15-20 min",
    },
    {
      name: "Chicken Burger",
      description: "Grilled chicken breast with mayo and crispy lettuce",
      price: 12.99,
      category: "BURGERS" as const,
      image:
        "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800&q=80",
      rating: 4.6,
      prepTime: "15-20 min",
    },
    {
      name: "Pasta Carbonara",
      description: "Creamy sauce with bacon, parmesan, and black pepper",
      price: 13.99,
      category: "PASTA" as const,
      image:
        "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=80",
      rating: 4.6,
      prepTime: "20-25 min",
    },
    {
      name: "Spaghetti Bolognese",
      description: "Traditional meat sauce with fresh tomatoes and herbs",
      price: 12.99,
      category: "PASTA" as const,
      image:
        "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80",
      rating: 4.7,
      prepTime: "20-25 min",
    },
    {
      name: "Grilled Salmon",
      description: "Atlantic salmon with lemon butter and vegetables",
      price: 18.99,
      category: "SEAFOOD" as const,
      image:
        "https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=800&q=80",
      rating: 4.9,
      prepTime: "25-30 min",
    },
    {
      name: "Sushi Platter",
      description: "Assorted nigiri and maki rolls with wasabi and ginger",
      price: 24.99,
      category: "SEAFOOD" as const,
      image:
        "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80",
      rating: 4.8,
      prepTime: "25-30 min",
    },
    {
      name: "Caesar Salad",
      description: "Romaine lettuce, parmesan, croutons, and Caesar dressing",
      price: 8.99,
      category: "SALADS" as const,
      image:
        "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800&q=80",
      rating: 4.5,
      prepTime: "10-15 min",
    },
    {
      name: "Greek Salad",
      description: "Feta cheese, olives, tomatoes, and olive oil dressing",
      price: 9.99,
      category: "SALADS" as const,
      image:
        "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80",
      rating: 4.6,
      prepTime: "10-15 min",
    },
    {
      name: "Chocolate Cake",
      description: "Rich chocolate layer cake with chocolate frosting",
      price: 6.99,
      category: "DESSERTS" as const,
      image:
        "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80",
      rating: 4.9,
      prepTime: "5 min",
    },
    {
      name: "Ice Cream Sundae",
      description: "Vanilla ice cream with chocolate sauce and nuts",
      price: 5.99,
      category: "DESSERTS" as const,
      image:
        "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80",
      rating: 4.7,
      prepTime: "5 min",
    },
    {
      name: "Chicken Wings",
      description: "Spicy buffalo wings served with ranch dressing",
      price: 11.99,
      category: "APPETIZERS" as const,
      image:
        "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=800&q=80",
      rating: 4.4,
      prepTime: "15-20 min",
    },
    {
      name: "French Fries",
      description: "Crispy golden fries with ketchup and mayo",
      price: 4.99,
      category: "APPETIZERS" as const,
      image:
        "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=800&q=80",
      rating: 4.5,
      prepTime: "10-15 min",
    },
    {
      name: "Coca Cola",
      description: "Classic refreshing Coca Cola (330ml)",
      price: 2.99,
      category: "DRINKS" as const,
      image:
        "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&q=80",
      rating: 4.8,
      prepTime: "2 min",
    },
    {
      name: "Fresh Orange Juice",
      description: "Freshly squeezed orange juice (500ml)",
      price: 4.99,
      category: "DRINKS" as const,
      image:
        "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&q=80",
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
