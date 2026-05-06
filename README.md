# RestroPro - Premium Restaurant Management System

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.0.0-brightgreen" alt="Version">
  <img src="https://img.shields.io/badge/Node-20%2B-blue" alt="Node">
  <img src="https://img.shields.io/badge/React-18-brightblue" alt="React">
</p>

RestroPro is a comprehensive multi-tenant SaaS restaurant POS and management system built with modern technologies. It provides a complete solution for restaurant operations including POS billing, kitchen display, inventory management, CRM, and analytics.

---

## Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js 20+ | Runtime |
| Express.js | Web Framework |
| Prisma | ORM (SQLite/PostgreSQL) |
| JWT + Refresh Tokens | Authentication |
| Socket.io | Real-time updates |
| Zod | Validation |

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| Vite | Build Tool |
| Tailwind CSS | Styling |
| Framer Motion | Animations |
| Zustand | State Management |
| React Query | Data Fetching |
| Recharts | Charts |

---

## Features

### Core Features
- **Multi-tenant Architecture** - Isolated data per restaurant with subscription management
- **Authentication System** - JWT access tokens + refresh tokens with role-based access control
- **POS Billing** - 3-click billing flow (Select table → Add items → Generate bill)
- **Table Management** - Visual floor plan with status indicators (Available/Occupied/Reserved)
- **Kitchen Display System (KDS)** - Real-time order feed with bump functionality
- **Inventory Management** - Raw material tracking, auto-deduction, low-stock alerts
- **Menu Management** - Categories, items, variants, combo meals, dynamic pricing
- **Analytics Dashboard** - Sales charts, top items, revenue insights
- **CRM & Loyalty** - Customer database, order history, points system, coupons

### Additional Features
- Split/merge orders
- Discounts (flat/percentage)
- Multiple payment modes (Cash, UPI, Card)
- Invoice generation (PDF)
- Auto-KOT generation
- Waiter assignment
- Recipe-to-ingredient mapping
- Purchase orders
- Day-end reports
- Expense tracking
- Online orders (mock integration)

---

## Project Structure

```
RestroPro/
├── client/                      # React Frontend
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── Layout.tsx       # Main layout with sidebar
│   │   │   └── PrintModal.tsx   # Invoice printing
│   │   ├── pages/               # Route pages
│   │   │   ├── Login.tsx        # Authentication
│   │   │   ├── Dashboard.tsx    # Analytics overview
│   │   │   ├── POS.tsx          # Main POS screen
│   │   │   ├── Orders.tsx       # Order management
│   │   │   ├── Kitchen.tsx      # Kitchen display
│   │   │   ├── Tables.tsx       # Table floor plan
│   │   │   ├── Menu.tsx         # Menu management
│   │   │   ├── Inventory.tsx    # Stock management
│   │   │   ├── Customers.tsx    # CRM
│   │   │   ├── Reports.tsx      # Analytics
│   │   │   ├── Expenses.tsx     # Expense tracking
│   │   │   ├── Settings.tsx     # Restaurant config
│   │   │   └── PurchaseOrders.tsx
│   │   ├── lib/                 # Utilities
│   │   │   ├── api.ts           # API client
│   │   │   ├── socket.ts        # Socket.io client
│   │   │   ├── stores/          # Zustand stores
│   │   │   └── utils/           # Helper functions
│   │   ├── index.css            # Global styles
│   │   ├── App.tsx              # App component
│   │   └── main.tsx             # Entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
├── server/                      # Node Backend
│   ├── src/
│   │   ├── routes/              # API routes
│   │   │   ├── auth.ts          # Authentication
│   │   │   ├── tenant.ts        # Tenant management
│   │   │   ├── users.ts         # Staff management
│   │   │   ├── menu.ts          # Menu API
│   │   │   ├── orders.ts        # Orders API
│   │   │   ├── tables.ts        # Tables API
│   │   │   ├── inventory.ts     # Inventory API
│   │   │   ├── customers.ts     # CRM API
│   │   │   ├── expenses.ts      # Expenses API
│   │   │   ├── purchaseOrders.tsx
│   │   │   ├── recipes.ts       # Recipe management
│   │   │   ├── reports.ts       # Analytics API
│   │   │   └── paymentSettings.ts
│   │   ├── middleware/          # Middleware
│   │   │   └── auth.ts          # JWT authentication
│   │   ├── types/               # TypeScript types
│   │   │   └── express.d.ts
│   │   └── index.ts             # Server entry point
│   ├── package.json
│   └── tsconfig.json
│
├── prisma/                      # Database
│   ├── schema.prisma            # Database schema
│   └── seed.ts                  # Demo data seeder
│
├── package.json                 # Root workspace
├── SPEC.md                      # Full specification
└── README.md                    # This file
```

---

## Prerequisites

- Node.js 20 or higher
- npm or yarn
- Git

---

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd RestroPro
```

### 2. Install dependencies
```bash
# Install root dependencies
npm install

# Install client and server dependencies (workspaces)
npm install
```

### 3. Initialize database
```bash
# Push schema to database
npm run db:push

# Seed with demo data
npm run db:seed
```

---

## Running the Application

### Development Mode
```bash
# Run both client and server concurrently
npm run dev
```

### Running individually
```bash
# Run server only
npm run dev:server

# Run client only
npm run dev:client
```

### Build for production
```bash
# Build client
npm run build
```

---

## Access

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |

---

## Demo Data

The seed script creates a demo restaurant "Spice Garden" with:

- **3 Categories:** Starters, Main Course, Beverages
- **15+ Menu Items:** With prices and descriptions
- **10 Tables:** 2-8 seats each
- **3 Staff Members:**
  - Owner (full access)
  - Manager (manage orders/inventory)
  - Cashier (POS only)
- **Sample Orders and Customers**

### Default Login Credentials
```
Email: owner@spicegarden.com
Password: password123
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Staff login |
| POST | /api/auth/register | Restaurant registration |
| POST | /api/auth/refresh | Refresh token |
| POST | /api/auth/logout | Logout |

### Tenants
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/tenants/me | Get current tenant |
| PUT | /api/tenants/settings | Update settings |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/users | List staff |
| POST | /api/users | Create staff |
| PUT | /api/users/:id | Update staff |
| DELETE | /api/users/:id | Delete staff |

### Menu
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/menu/categories | List categories |
| POST | /api/menu/categories | Create category |
| GET | /api/menu/items | List menu items |
| POST | /api/menu/items | Create item |
| PUT | /api/menu/items/:id | Update item |
| DELETE | /api/menu/items/:id | Delete item |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/orders | List orders |
| POST | /api/orders | Create order |
| PUT | /api/orders/:id/status | Update status |
| POST | /api/orders/:id/items | Add items |

### Tables
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/tables | List tables |
| POST | /api/tables | Create table |
| PUT | /api/tables/:id | Update table |

### Inventory
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/inventory | List inventory |
| POST | /api/inventory | Add item |
| PUT | /api/inventory/:id | Update item |
| GET | /api/inventory/alerts | Low stock alerts |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/reports/sales | Sales report |
| GET | /api/reports/items | Top items |
| GET | /api/reports/staff | Staff performance |

---

## User Roles & Permissions

| Role | Access |
|------|--------|
| Owner | Full access (manage staff, settings, reports) |
| Manager | Manage orders, inventory, view reports |
| Cashier | POS only |
| Kitchen | Kitchen display only |

---

## Design System

### Color Palette
| Color | Hex Code | Usage |
|-------|----------|-------|
| Primary | #6366F1 | Main actions |
| Primary Light | #818CF8 | Hover states |
| Secondary | #10B981 | Success states |
| Accent | #F59E0B | Warnings |
| Background Dark | #0F172A | Dark mode |
| Background Light | #F8FAFC | Light mode |
| Surface | rgba(255,255,255,0.1) | Glassmorphism |
| Success | #22C55E | Positive feedback |
| Warning | #EAB308 | Caution |
| Error | #EF4444 | Errors |

### Typography
- **Headings:** Inter (700, 600)
- **Body:** Inter (400, 500)
- **Monospace:** JetBrains Mono (numbers, codes)

### UI Elements
- Glassmorphism cards with backdrop-blur
- Gradient backgrounds
- Animated transitions (200ms ease-out)
- Micro-interactions on hover/click

---

## Technology Highlights

### Real-time Updates
- Socket.io connection for kitchen display
- Instant order status updates
- Table status synchronization

### State Management
- Zustand for global state (auth, cart, settings)
- React Query for server state caching

### Security
- JWT access tokens (15min expiry)
- Refresh tokens (7 days)
- Tenant isolation at database level

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

## License

Private - All rights reserved

---

## Support

For issues and questions, please open an issue on the repository.