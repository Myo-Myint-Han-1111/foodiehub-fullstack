import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  console.log("Deleting existing data...");
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.address.deleteMany({});
  await prisma.menuItem.deleteMany({});
  await prisma.user.deleteMany({});
  console.log("✅ Existing data cleared");

  // Create Admin user
  await prisma.user.create({
    data: {
      email: "admin@myanmarfoodhub.com",
      password: await bcrypt.hash("admin2024", 10),
      name: "Zaw Min Oo",
      phone: "+66-81-234-5678",
      role: "ADMIN",
    },
  });

  // Create Customer users
  await prisma.user.create({
    data: {
      email: "thandar@gmail.com",
      password: await bcrypt.hash("customer123", 10),
      name: "Thandar Aung",
      phone: "+66-82-345-6789",
      role: "CUSTOMER",
    },
  });

  await prisma.user.create({
    data: {
      email: "kyaw.soe@gmail.com",
      password: await bcrypt.hash("customer123", 10),
      name: "Kyaw Soe Win",
      phone: "+66-83-456-7890",
      role: "CUSTOMER",
    },
  });

  // Create Kitchen staff
  await prisma.user.create({
    data: {
      email: "kitchen@myanmarfoodhub.com",
      password: await bcrypt.hash("kitchen123", 10),
      name: "Myo Min Thu",
      phone: "+66-84-567-8901",
      role: "KITCHEN",
    },
  });

  await prisma.user.create({
    data: {
      email: "chef.win@myanmarfoodhub.com",
      password: await bcrypt.hash("kitchen123", 10),
      name: "Win Htut Aung",
      phone: "+66-85-678-9012",
      role: "KITCHEN",
    },
  });

  // Create Counter staff
  await prisma.user.create({
    data: {
      email: "counter@myanmarfoodhub.com",
      password: await bcrypt.hash("counter123", 10),
      name: "Su Myat Mon",
      phone: "+66-86-789-0123",
      role: "COUNTER",
    },
  });

  console.log("✅ Users created");

  // Myanmar Menu Items with Baht currency
  const menuItems = [
    // Main Dishes (PASTA category used for rice/noodle dishes)
    {
      name: "Mohinga",
      description:
        "Traditional Myanmar fish noodle soup with lemongrass, banana stem, and crispy fritters",
      price: 85,
      category: "PASTA" as const,
      image:
        "https://images.unsplash.com/photo-1569562211093-4ed0d0758f12?w=800&q=80",
      rating: 4.9,
      prepTime: "15-20 min",
    },
    {
      name: "Shan Noodles (Khao Swe)",
      description:
        "Shan-style rice noodles with chicken or pork, peanuts, and spicy sauce",
      price: 95,
      category: "PASTA" as const,
      image:
        "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&q=80",
      rating: 4.8,
      prepTime: "15-20 min",
    },
    {
      name: "Coconut Chicken Noodles (Ohn No Khao Swe)",
      description:
        "Creamy coconut curry noodles with tender chicken and egg noodles",
      price: 105,
      category: "PASTA" as const,
      image:
        "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=80",
      rating: 4.9,
      prepTime: "20-25 min",
    },
    {
      name: "Myanmar Fried Rice",
      description:
        "Fragrant fried rice with vegetables, egg, and choice of chicken or prawns",
      price: 90,
      category: "PASTA" as const,
      image:
        "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80",
      rating: 4.7,
      prepTime: "15-20 min",
    },
    {
      name: "Mandalay Meeshay",
      description:
        "Rice noodles with savory sauce, pickled vegetables, and chicken",
      price: 85,
      category: "PASTA" as const,
      image:
        "https://images.unsplash.com/photo-1569562211093-4ed0d0758f12?w=800&q=80",
      rating: 4.6,
      prepTime: "15-20 min",
    },

    // Curries (BURGERS category repurposed)
    {
      name: "Chicken Curry (Kyet Thar Hin)",
      description:
        "Traditional Myanmar chicken curry with onions, tomatoes, and aromatic spices",
      price: 120,
      category: "BURGERS" as const,
      image:
        "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80",
      rating: 4.8,
      prepTime: "25-30 min",
    },
    {
      name: "Pork Curry (Wet Thar Hin)",
      description:
        "Spicy pork curry cooked with tamarind and traditional Myanmar spices",
      price: 125,
      category: "BURGERS" as const,
      image:
        "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80",
      rating: 4.7,
      prepTime: "25-30 min",
    },
    {
      name: "Fish Curry (Nga Hin)",
      description:
        "Fresh fish cooked in tangy tamarind curry with tomatoes and herbs",
      price: 135,
      category: "SEAFOOD" as const,
      image:
        "https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=800&q=80",
      rating: 4.8,
      prepTime: "25-30 min",
    },
    {
      name: "Prawn Curry (Pazun Hin)",
      description: "Succulent prawns in rich curry sauce with coconut milk",
      price: 155,
      category: "SEAFOOD" as const,
      image:
        "https://images.unsplash.com/photo-1633504581786-316c8002b1b9?w=800&q=80",
      rating: 4.9,
      prepTime: "20-25 min",
    },
    {
      name: "Mutton Curry (Sate Thar Hin)",
      description: "Tender mutton slow-cooked with Myanmar spices and herbs",
      price: 145,
      category: "BURGERS" as const,
      image:
        "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80",
      rating: 4.7,
      prepTime: "30-35 min",
    },

    // Salads (SALADS category)
    {
      name: "Tea Leaf Salad (Lahpet Thoke)",
      description:
        "Famous Myanmar fermented tea leaf salad with peanuts, sesame, fried garlic, and lime",
      price: 75,
      category: "SALADS" as const,
      image:
        "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800&q=80",
      rating: 4.9,
      prepTime: "10-15 min",
    },
    {
      name: "Ginger Salad (Gyin Thoke)",
      description:
        "Refreshing salad with pickled ginger, peanuts, sesame seeds, and fried beans",
      price: 65,
      category: "SALADS" as const,
      image:
        "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80",
      rating: 4.6,
      prepTime: "10-15 min",
    },
    {
      name: "Tomato Salad (Kha Yan Chin Thee Thoke)",
      description:
        "Fresh tomato salad with onions, dried shrimp, and peanut oil dressing",
      price: 55,
      category: "SALADS" as const,
      image:
        "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80",
      rating: 4.5,
      prepTime: "10-15 min",
    },

    // Appetizers (APPETIZERS category)
    {
      name: "Samosa Thoke",
      description:
        "Myanmar-style samosa salad with chickpeas, cabbage, and tamarind sauce",
      price: 45,
      category: "APPETIZERS" as const,
      image:
        "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80",
      rating: 4.7,
      prepTime: "10-15 min",
    },
    {
      name: "Shan Tofu Fritters",
      description:
        "Crispy chickpea tofu fritters served with sweet and sour sauce",
      price: 55,
      category: "APPETIZERS" as const,
      image:
        "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=800&q=80",
      rating: 4.6,
      prepTime: "15-20 min",
    },
    {
      name: "Spring Rolls (Kawpyan Kyaw)",
      description:
        "Crispy vegetable spring rolls served with sweet chili sauce",
      price: 50,
      category: "APPETIZERS" as const,
      image:
        "https://images.unsplash.com/photo-1593759608136-45c2f4548cce?w=800&q=80",
      rating: 4.5,
      prepTime: "15-20 min",
    },
    {
      name: "Buthi Kyaw",
      description: "Deep-fried gourd fritters with chickpea flour coating",
      price: 40,
      category: "APPETIZERS" as const,
      image:
        "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=800&q=80",
      rating: 4.4,
      prepTime: "15-20 min",
    },

    // Snacks (PIZZA category repurposed)
    {
      name: "Mont Lin Mayar",
      description:
        "Myanmar savory pancake with quail eggs, spring onions, and crispy texture",
      price: 60,
      category: "PIZZA" as const,
      image:
        "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80",
      rating: 4.8,
      prepTime: "15-20 min",
    },
    {
      name: "Palata (Flaky Bread)",
      description: "Flaky layered flatbread served with curry dipping sauce",
      price: 35,
      category: "PIZZA" as const,
      image:
        "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&q=80",
      rating: 4.7,
      prepTime: "10-15 min",
    },

    // Desserts (DESSERTS category)
    {
      name: "Shwe Yin Aye",
      description:
        "Traditional Myanmar dessert with coconut milk, jelly, sago, and crushed ice",
      price: 45,
      category: "DESSERTS" as const,
      image:
        "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80",
      rating: 4.9,
      prepTime: "5-10 min",
    },
    {
      name: "Mont Lone Yay Paw",
      description:
        "Sticky rice balls with palm sugar filling served in coconut milk",
      price: 40,
      category: "DESSERTS" as const,
      image:
        "https://images.unsplash.com/photo-1582103928939-daf5e1f55b2c?w=800&q=80",
      rating: 4.8,
      prepTime: "5-10 min",
    },
    {
      name: "Sanwin Makin",
      description:
        "Rich semolina cake with coconut milk, raisins, and poppy seeds",
      price: 50,
      category: "DESSERTS" as const,
      image:
        "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80",
      rating: 4.7,
      prepTime: "5-10 min",
    },

    // Drinks (DRINKS category)
    {
      name: "Myanmar Milk Tea (Laphet Yay)",
      description: "Strong black tea with condensed milk, served hot or cold",
      price: 35,
      category: "DRINKS" as const,
      image:
        "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&q=80",
      rating: 4.8,
      prepTime: "5 min",
    },
    {
      name: "Sugarcane Juice (Kyan Yay)",
      description: "Freshly pressed sugarcane juice with lime",
      price: 30,
      category: "DRINKS" as const,
      image:
        "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&q=80",
      rating: 4.7,
      prepTime: "5 min",
    },
    {
      name: "Coconut Water",
      description: "Fresh young coconut water served chilled",
      price: 40,
      category: "DRINKS" as const,
      image:
        "https://images.unsplash.com/photo-1582630368216-e78d92a5bddf?w=800&q=80",
      rating: 4.6,
      prepTime: "3 min",
    },
    {
      name: "Lime Juice (Thanat Yay)",
      description: "Freshly squeezed lime juice with sugar",
      price: 30,
      category: "DRINKS" as const,
      image:
        "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=800&q=80",
      rating: 4.7,
      prepTime: "5 min",
    },
    {
      name: "Myanmar Coffee",
      description: "Strong filtered coffee with condensed milk",
      price: 40,
      category: "DRINKS" as const,
      image:
        "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80",
      rating: 4.8,
      prepTime: "5 min",
    },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.create({ data: { ...item, available: true } });
  }

  console.log("✅ Menu items created");
  console.log("\n🎉 Database seeded successfully!");
  console.log("👑 Admin: admin@myanmarfoodhub.com / admin2024");
  console.log("📧 Customers:");
  console.log("   - thandar@gmail.com / customer123");
  console.log("   - kyaw.soe@gmail.com / customer123");
  console.log("👨‍🍳 Kitchen Staff:");
  console.log("   - kitchen@myanmarfoodhub.com / kitchen123");
  console.log("   - chef.win@myanmarfoodhub.com / kitchen123");
  console.log("💰 Counter: counter@myanmarfoodhub.com / counter123");
  console.log("\n💵 All prices in Thai Baht (THB)");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
