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
      image: "https://mitziemee.com/wp-content/uploads/2023/01/mohinga-g.jpg",
      rating: 4.9,
      prepTime: "15-20 min",
    },
    {
      name: "Shan Noodles (Shan Khao Swe)",
      description:
        "Shan-style rice noodles with chicken or pork, peanuts, and spicy sauce",
      price: 95,
      category: "PASTA" as const,
      image: "https://images.deliveryhero.io/image/fd-mm/LH/s2zw-listing.jpg",
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
        "https://lionmartjp.com/cdn/shop/files/FullSizeRender_a8e4e55d-8087-4371-8839-d74d3437b0cd.jpg?v=1733552912&width=1445",
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
      image: "https://images.deliveryhero.io/image/fd-mm/LH/s180-listing.jpg",
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
        "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.foodpanda.com.mm%2Frestaurant%2Fhkq0%2Fmng-saa-k-ii-hkq0&psig=AOvVaw2EtmZUwEh9oUxnVMtzQCSE&ust=1762361708718000&source=images&cd=vfe&opi=89978449&ved=0CBUQjRxqFwoTCJjjyJH72JADFQAAAAAdAAAAABAE",
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
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ5c-i4Hyz_Q8vFUuvIttQFuthWh4QIgNNMKg&s",
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
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSR-m7nW4yTSZK9-JcEoZCN8ynaBM5WBEwLYQ&s",
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
        "https://i0.wp.com/www.wutyeefoodhouse.com/wp-content/uploads/2014/11/Mutton_Curry4.jpg",
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
        "https://www.saveur.com/uploads/2022/03/23/DJH_SaveurDutchess_BurmeseTeaLeaf_0122_2-scaled.jpg?auto=webp",
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
        "https://shop.shwebiz.com/cdn/shop/products/291971815_460143849274717_8438372039424217000_n.jpg?v=1660562893&width=1445",
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
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRFotwhg2e4kZOIaI4cKVUSkxwvKZJKsg94GQ&s",
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
        "https://smartcdn.gprod.postmedia.digital/nationalpost/wp-content/uploads/2020/01/chickpeafritters.jpg",
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
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQETLCp959EST1LS9XbQTXmgm4li9I74QZufg&s",
      rating: 4.5,
      prepTime: "15-20 min",
    },
    {
      name: "Buthi Kyaw",
      description: "Deep-fried gourd fritters with chickpea flour coating",
      price: 40,
      category: "APPETIZERS" as const,
      image:
        "https://www.google.com/url?sa=i&url=https%3A%2F%2Fmy.wikipedia.org%2Fwiki%2F%25E1%2580%2598%25E1%2580%25B0%25E1%2580%25B8%25E1%2580%259E%25E1%2580%25AE%25E1%2580%25B8%25E1%2580%2580%25E1%2580%25BC%25E1%2580%25B1%25E1%2580%25AC%25E1%2580%25BA&psig=AOvVaw3eezluCL6H34wuH637HfpL&ust=1762361643332000&source=images&cd=vfe&opi=89978449&ved=0CBUQjRxqFwoTCMjlpfH62JADFQAAAAAdAAAAABAE",
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
        "https://images.squarespace-cdn.com/content/v1/604fca2357feb3489dacff9b/1615924700184-F30O4VTOLWKHIF9NUSIQ/image-asset.jpeg",
      rating: 4.8,
      prepTime: "15-20 min",
    },
    {
      name: "Palata (Flaky Bread)",
      description: "Flaky layered flatbread served with curry dipping sauce",
      price: 35,
      category: "PIZZA" as const,
      image:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTNq0gSVh_d5yObo6Jt6Z50RP_vEvbxJQd2TA&s",
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
        "https://cdn.tasteatlas.com/images/dishes/c79e5fd832b24dc791b19d02af952060.jpg?m=facebook",
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
        "https://myanmarmix.com/sites/myanmarmix.com/files/news-images/thingyan_snack-min.jpg",
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
        "https://i0.wp.com/cookiecompanion.com/blog/wp-content/uploads/2015/06/sanwin-makin-3177-klein-recht.jpg",
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
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQPjHPJsJSTP5XYlhNEwWEsWn55Aggf-OCeEw&s",
      rating: 4.8,
      prepTime: "5 min",
    },
    {
      name: "Sugarcane Juice (Kyan Yay)",
      description: "Freshly pressed sugarcane juice with lime",
      price: 30,
      category: "DRINKS" as const,
      image:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQjKuN90z8c_rQCkJyfnJk_rG6Fy5kwAiOwEg&s",
      rating: 4.7,
      prepTime: "5 min",
    },
    {
      name: "Coconut Water",
      description: "Fresh young coconut water served chilled",
      price: 40,
      category: "DRINKS" as const,
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Coconut_Drink%2C_Pangandaran.JPG/1200px-Coconut_Drink%2C_Pangandaran.JPG",
      rating: 4.6,
      prepTime: "3 min",
    },
    {
      name: "Lime Juice (Thanat Yay)",
      description: "Freshly squeezed lime juice with sugar",
      price: 30,
      category: "DRINKS" as const,
      image:
        "https://www.seingayhar.com/image/cache/catalog/Product/Fruit%20Juice/111%20Ve%20Ve%20Fresh%20Lime%20Juice%20With%20Pulp%20260ml-1000x1000.jpg",
      rating: 4.7,
      prepTime: "5 min",
    },
    {
      name: "Myanmar Coffee",
      description: "Strong filtered coffee with condensed milk",
      price: 40,
      category: "DRINKS" as const,
      image:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT-Mb-yXLquRdSQiYaaCzw7Srt9RzHzl0uSCg&s",
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
