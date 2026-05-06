# RestroPro - Premium Restaurant Management System

## Project Overview

**Project Name:** RestroPro
**Type:** Multi-tenant SaaS Restaurant POS & Management System
**Core Functionality:** Complete restaurant operating system with POS billing, kitchen display, inventory management, CRM, and analytics
**Target Users:** Restaurant owners, managers, cashiers, kitchen staff

---

## Tech Stack

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **ORM:** Prisma with SQLite (PostgreSQL-ready schema)
- **Auth:** JWT + Refresh Tokens
- **Real-time:** Socket.io
- **Validation:** Zod

### Frontend
- **Framework:** React 18 with Vite
- **Styling:** Tailwind CSS + custom CSS for glassmorphism
- **Animations:** Framer Motion
- **State:** Zustand
- **Data:** React Query (TanStack Query)
- **Charts:** Recharts
- **Components:** Custom ShadCN-style components

---

## Multi-Tenant Architecture

### Tenant Isolation
- Every table includes `tenant_id` column
- JWT contains `tenantId` claim
- Middleware enforces tenant context

### Subscription Model
- **trial:** 14-day free trial
- **active:** Paid subscription
- **expired:** Access limited

---

## Database Schema (Prisma)

### Core Entities
- **Tenant:** Restaurant/brand info, subscription
- **User:** Staff accounts with roles
- **Category:** Menu categories
- **MenuItem:** Individual dishes
- **Table:** Restaurant tables
- **Order:** Customer orders
- **OrderItem:** Items in orders
- **KOT:** Kitchen order tickets
- **InventoryItem:** Raw materials
- **Recipe:** Ingredient mappings
- **Customer:** CRM data
- **Payment:** Transaction records

---

## UI/UX Specification

### Color Palette
```
Primary: #6366F1 (Indigo)
Primary Light: #818CF8
Secondary: #10B981 (Emerald)
Accent: #F59E0B (Amber)
Background: #0F172A (Dark) / #F8FAFC (Light)
Surface: rgba(255,255,255,0.1) (Glass)
Text Primary: #1E293B
Text Secondary: #64748B
Success: #22C55E
Warning: #EAB308
Error: #EF4444
```

### Typography
- **Headings:** Inter (700, 600)
- **Body:** Inter (400, 500)
- **Monospace:** JetBrains Mono (for numbers/codes)

### Design System
- Glassmorphism cards with backdrop-blur
- Gradient backgrounds (subtle mesh gradients)
- Animated transitions (200ms ease-out)
- Micro-interactions on hover/click
- Smooth page transitions

### Layouts
1. **Sidebar Navigation** - Collapsible, icon-based
2. **POS Screen** - Grid-based menu, quick actions
3. **Kitchen Display** - Kanban-style order cards
4. **Dashboard** - Widget-based analytics

---

## Core Features

### 1. Authentication System
- JWT access tokens (15min expiry)
- Refresh tokens (7 days)
- Role-based permissions (Owner, Manager, Cashier, Kitchen)
- Session management

### 2. POS Billing (3-Click Flow)
- Select table → Add items → Generate bill
- Split/merge orders
- Discounts (flat/percentage)
- Payment modes: Cash, UPI, Card
- Print invoice (PDF generation)
- Auto-KOT generation

### 3. Table Management
- Visual floor plan grid
- Status indicators (Available/Occupied/Reserved)
- Waiter assignment
- Table merging

### 4. Kitchen Display System (KDS)
- Real-time order feed via Socket.io
- Order cards with items
- Status: Pending → Preparing → Ready
- Timer显示 (order age)
- Bump functionality

### 5. Inventory Management
- Raw material tracking
- Recipe-to-ingredient mapping
- Auto-deduction on order
- Low-stock alerts
- Purchase orders

### 6. Menu Management
- Categories with ordering
- Item variants (size, add-ons)
- Combo meals
- Dynamic pricing
- Availability toggle

### 7. Analytics Dashboard
- Sales charts (daily/weekly/monthly)
- Top items
- Revenue insights
- Inventory reports

### 8. CRM & Loyalty
- Customer database
- Order history
- Points system
- Coupons

### 9. Online Orders (Mock)
- Simulated Swiggy/Zomato integration
- Auto-flow to POS

---

## Page Structure

### Public
- `/login` - Staff login
- `/register` - Restaurant registration

### Protected (Role-based)
- `/dashboard` - Analytics overview
- `/pos` - Main POS screen
- `/orders` - Order list/management
- `/kitchen` - KDS screen
- `/tables` - Table floor plan
- `/menu` - Menu management
- `/inventory` - Stock management
- `/customers` - CRM
- `/reports` - Analytics
- `/settings` - Restaurant config

---

## API Endpoints

### Auth
- POST /api/auth/login
- POST /api/auth/register
- POST /api/auth/refresh
- POST /api/auth/logout

### Tenants
- GET /api/tenants/me
- PUT /api/tenants/settings

### Users
- GET /api/users
- POST /api/users
- PUT /api/users/:id
- DELETE /api/users/:id

### Menu
- GET /api/menu/categories
- POST /api/menu/categories
- GET /api/menu/items
- POST /api/menu/items
- PUT /api/menu/items/:id
- DELETE /api/menu/items/:id

### Orders
- GET /api/orders
- POST /api/orders
- PUT /api/orders/:id/status
- POST /api/orders/:id/items

### Tables
- GET /api/tables
- POST /api/tables
- PUT /api/tables/:id

### Inventory
- GET /api/inventory
- POST /api/inventory
- PUT /api/inventory/:id
- GET /api/inventory/alerts

### Reports
- GET /api/reports/sales
- GET /api/reports/items
- GET /api/reports/staff

---

## Acceptance Criteria

1. ✅ Multi-tenant registration and login works
2. ✅ Role-based access control enforced
3. ✅ POS screen allows 3-click billing flow
4. ✅ Orders sync to kitchen in real-time
5. ✅ Table floor plan displays status correctly
6. ✅ Inventory auto-deducts on order
7. ✅ Analytics charts render with data
8. ✅ UI feels premium with glassmorphism & animations
9. ✅ Responsive on tablet and mobile
10. ✅ Real-time sync via Socket.io works

---

## Demo Data

### Restaurant: "Spice Garden"
- 3 categories: Starters, Main Course, Beverages
- 15 menu items with prices
- 10 tables (2-8 seats)
- 3 staff: Owner, Manager, Cashier
- Sample orders and customers

---

## File Structure

```
/Restro
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Route pages
│   │   ├── stores/        # Zustand stores
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilities
│   │   └── styles/        # Global styles
│   └── index.html
├── server/                 # Node backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Auth, tenant
│   │   ├── services/      # Business logic
│   │   ├── socket/        # Socket.io handlers
│   │   └── index.ts       # Entry point
│   └── package.json
├── prisma/
│   ├── schema.prisma      # DB schema
│   └── seed.ts            # Demo data
└── package.json           # Root workspace
```