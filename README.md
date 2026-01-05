# 🍽️ FoodieHub - Restaurant QR Ordering System

A modern, full-stack restaurant ordering system that enables customers to order food by scanning QR codes at their tables or at the counter for takeaway. Built with Next.js 15, React 19, TypeScript, and PostgreSQL.

## 📋 Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [User Roles & Access](#user-roles--access)
- [Demo Accounts](#demo-accounts)
- [Key Features by Role](#key-features-by-role)
- [QR Code System](#qr-code-system)
- [Deployment](#deployment)
- [License](#license)

## ✨ Features

### Core Functionality

- **QR Code Ordering**: Customers scan table QR codes for dine-in or counter QR for takeaway
- **Real-time Order Management**: Orders flow instantly from customers to kitchen to counter
- **Role-Based Access Control**: Four distinct user roles (Customer, Kitchen, Counter, Admin)
- **Secure Sessions**: Token-based QR codes with expiration and single-use validation
- **Myanmar Cuisine Menu**: Authentic Myanmar dishes with Thai Baht pricing
- **Payment Tracking**: Comprehensive payment status monitoring
- **Analytics Dashboard**: Sales tracking, top items, and revenue reports

### Customer Experience

- Browse menu with images, descriptions, and prices
- Add items to cart with quantity adjustment
- Real-time order status tracking
- View order history (2-hour window for active sessions)
- No login required - just scan and order

### Kitchen Operations

- Live order display with pending/delivered status
- Order preparation tracking (24-hour view)
- One-click order completion
- Table number identification

### Counter/Payment

- Payment collection interface
- Search orders by table or order number
- Unpaid orders tracking (30-day view)
- Daily sales summary

### Admin Panel

- User management (create, edit, delete users)
- QR code generator for tables and takeaway
- Complete order history with filters
- Analytics by day, month, or year
- Export data to CSV

## 🛠️ Technology Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI component library

### Backend

- **Next.js API Routes** - Serverless API
- **Prisma ORM** - Database ORM
- **PostgreSQL** - Database (via Supabase)
- **bcryptjs** - Password hashing
- **jsonwebtoken** - Authentication

### Deployment

- **Vercel** - Hosting platform
- **Supabase** - PostgreSQL database hosting

## 📁 Project Structure

```
foodiehub/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── (auth)/
│   │   │   └── login/           # Login page
│   │   ├── admin/               # Admin dashboard
│   │   │   ├── qr-codes/       # QR code generator
│   │   │   ├── orders/         # Order management
│   │   │   └── analytics/      # Admin analytics
│   │   ├── analytics/          # Counter analytics
│   │   ├── api/                # API routes
│   │   │   ├── auth/           # Authentication
│   │   │   ├── users/          # User management
│   │   │   ├── menu/           # Menu items
│   │   │   ├── orders/         # Order management
│   │   │   ├── kitchen/        # Kitchen operations
│   │   │   ├── counter/        # Counter operations
│   │   │   └── analytics/      # Analytics data
│   │   ├── cart/               # Shopping cart
│   │   ├── counter/            # Counter dashboard
│   │   ├── kitchen/            # Kitchen display
│   │   ├── menu/               # Menu browsing
│   │   ├── order/              # QR order entry
│   │   └── orders/             # Order history
│   ├── components/
│   │   ├── layout/             # Header, Footer
│   │   └── ui/                 # UI components
│   ├── context/
│   │   ├── AuthContext.tsx     # Authentication state
│   │   └── CartContext.tsx     # Shopping cart state
│   ├── lib/
│   │   ├── prisma.ts           # Prisma client
│   │   ├── utils.ts            # Utilities
│   │   └── validations.ts      # Zod schemas
│   └── types/
│       └── index.ts            # TypeScript types
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Database seeding
└── public/                     # Static assets
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or Supabase account)
- Git

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd foodiehub
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**
   Create a `.env` file in the root directory:

```env
# Database URLs
DATABASE_URL="postgresql://user:password@host:6543/database?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://user:password@host:5432/database"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Environment
NODE_ENV="development"
```

4. **Set up the database**

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed the database with sample data
npx prisma db seed
```

5. **Run the development server**

```bash
npm run dev
```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 🔐 Environment Variables

| Variable              | Description                                 | Example                           |
| --------------------- | ------------------------------------------- | --------------------------------- |
| `DATABASE_URL`        | PostgreSQL connection string with pooling   | Connection pooler URL (port 6543) |
| `DIRECT_URL`          | Direct PostgreSQL connection for migrations | Direct connection URL (port 5432) |
| `JWT_SECRET`          | Secret key for JWT tokens                   | Random secure string              |
| `NEXT_PUBLIC_APP_URL` | Application base URL                        | http://localhost:3000             |
| `NODE_ENV`            | Environment mode                            | development/production            |

## 💾 Database Setup

### Using Supabase (Recommended)

1. Create a Supabase account at https://supabase.com
2. Create a new project
3. Go to Project Settings → Database
4. Copy the "Connection pooling" URL (port 6543) for `DATABASE_URL`
5. Copy the "Direct connection" URL (port 5432) for `DIRECT_URL`

### Local PostgreSQL

1. Install PostgreSQL
2. Create a database: `createdb foodiehub`
3. Update `.env` with your local connection strings

### Database Schema

The application uses Prisma ORM with the following models:

- **User** - System users with roles
- **MenuItem** - Restaurant menu items
- **Order** - Customer orders
- **OrderItem** - Individual items in orders
- **Address** - Customer delivery addresses (future use)

## 👥 User Roles & Access

| Role         | Access             | Primary Function                      |
| ------------ | ------------------ | ------------------------------------- |
| **CUSTOMER** | Menu, Cart, Orders | Browse menu and place orders via QR   |
| **KITCHEN**  | Kitchen Display    | View and complete food orders         |
| **COUNTER**  | Counter, Analytics | Process payments and view sales       |
| **ADMIN**    | Full System Access | Manage users, QR codes, and analytics |

## 🎯 Key Features by Role

### Customer (No Login Required)

1. Scan QR code at table or counter
2. Browse Myanmar cuisine menu
3. Add items to cart with quantity selection
4. Place order (sent directly to kitchen)
5. Track order status in real-time
6. View recent orders (2-hour window)

### Kitchen Staff

1. View all pending orders (24-hour view)
2. See table numbers and order details
3. Mark orders as delivered with one click
4. Real-time order updates every 30 seconds
5. Organized display by pending/delivered status

### Counter Staff

1. View all delivered orders awaiting payment (30-day view)
2. Search orders by table number or order ID
3. Mark orders as paid
4. View daily sales analytics
5. Track paid vs unpaid revenue

### Admin

1. **User Management**

   - Create, edit, and delete users
   - Assign roles (Customer, Kitchen, Counter, Admin)
   - View user statistics

2. **QR Code Generator**

   - Generate table QR codes (1-100 tables)
   - Generate takeaway QR code
   - Download individual or all QR codes
   - Print-friendly QR sheet

3. **Order Management**

   - View all orders with advanced filtering
   - Search by order number, table, or items
   - Filter by status (Pending, Delivered, Cancelled)
   - Filter by time (All time, 30 days, 24 hours, 2 hours)
   - Export orders to CSV

4. **Analytics**
   - Daily, monthly, and yearly reports
   - Total sales and revenue tracking
   - Paid vs unpaid order analysis
   - Top-selling items
   - Sales and order trends

## 📱 QR Code System

### How It Works

1. **Admin generates QR codes** with unique URLs:

   - Dine-in: `https://yourapp.com/order?type=dine-in&table=1`
   - Takeaway: `https://yourapp.com/order?type=takeaway`

2. **Customer scans QR code**:

   - Automatic table detection (for dine-in)
   - Session data stored in browser
   - No login required

3. **Security Features**:
   - QR codes can only be used on-site
   - Session validation on order submission
   - Order type verification (dine-in requires table number)

### Generating QR Codes

1. Login as Admin
2. Navigate to "QR Codes" page
3. Set number of tables (default: 20)
4. Download options:
   - Individual table QR codes
   - All table QR codes at once
   - Takeaway QR code
   - Print all QR codes on one sheet

### QR Code Placement

- **Table QR Codes**: Print and laminate, place one on each table
- **Takeaway QR Code**: Place at counter or entrance
- **Size Recommendation**: 10cm x 10cm minimum for easy scanning

## 🌐 Deployment

### Deploy to Vercel

1. **Push to GitHub**

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

2. **Import to Vercel**

   - Go to https://vercel.com
   - Click "Import Project"
   - Select your GitHub repository
   - Add environment variables from `.env`
   - Click "Deploy"

3. **Update Environment Variables**
   - After deployment, update `NEXT_PUBLIC_APP_URL` to your Vercel URL
   - Example: `https://your-app.vercel.app`

### Post-Deployment

1. **Generate QR Codes**

   - Login as admin
   - Navigate to QR Codes page
   - Generate and download QR codes for your tables

2. **Test the System**
   - Scan a QR code with your phone
   - Place a test order
   - Verify order appears in kitchen display
   - Process payment at counter

## 🔧 Maintenance

### Database Management

```bash
# View database in Prisma Studio
npx prisma studio

# Create a new migration
npx prisma migrate dev --name migration_name

# Reset database (⚠️ WARNING: Deletes all data)
npx prisma migrate reset

# Re-seed database
npx prisma db seed
```

### Common Issues

**Issue**: Orders not appearing in kitchen

- **Solution**: Check database connection, verify order status is "PENDING"

**Issue**: QR code scan not working

- **Solution**: Ensure NEXT_PUBLIC_APP_URL matches your deployment URL

**Issue**: Payment not updating

- **Solution**: Check order status is "DELIVERED" before marking as paid

## 📊 Menu Customization

The menu features authentic Myanmar cuisine. To customize:

1. Edit `prisma/seed.ts`
2. Modify the `menuItems` array
3. Update prices, names, descriptions, and images
4. Run `npx prisma db seed` to update database

### Menu Categories

- **PASTA** - Noodles & Rice dishes (Mohinga, Shan Noodles, etc.)
- **BURGERS** - Curries (Chicken, Pork, Mutton)
- **SEAFOOD** - Fish and Prawn curries
- **SALADS** - Myanmar salads (Lahpet Thoke, Ginger Salad)
- **APPETIZERS** - Starters (Samosa Thoke, Spring Rolls)
- **PIZZA** - Snacks (Mont Lin Mayar, Palata)
- **DESSERTS** - Sweet dishes (Shwe Yin Aye, Sanwin Makin)
- **DRINKS** - Beverages (Myanmar Tea, Fresh Juices)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the MIT License.

## 🆘 Support

For issues and questions:

- Create an issue on GitHub
- Check existing documentation
- Review the demo accounts section

## 🎉 Acknowledgments

- Built with Next.js, React, and Prisma
- UI components from shadcn/ui
- Inspired by modern restaurant QR ordering systems
- Myanmar cuisine menu inspired by authentic restaurants

---

**Built with ❤️ for modern restaurants**

_Last Updated: December 2024_
