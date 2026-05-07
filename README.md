# RestroPro - Restaurant Management System

A full-featured Restaurant POS (Point of Sale) and Management System built with Node.js, Express, React, SQLite, and Socket.io.

![RestroPro Dashboard](https://via.placeholder.com/800x400?text=RestroPro)

## Features

### 🍽️ POS (Point of Sale)
- Visual table selection with availability status
- Multiple order types: Dine-in, Takeaway, Delivery
- Real-time cart management
- Product search with filtering
- Customer selection for non-dine-in orders
- Discount application (percentage/flat)
- Multiple payment modes (Cash, Card, UPI)
- Product images support

### 👨‍🍳 Kitchen Display System (KDS)
- Real-time order updates via Socket.io
- Order status workflow: Pending → Preparing → Ready → Completed
- Visual alerts for urgent orders
- Order cards with item details and timestamps

### 📊 Dashboard
- Today's revenue with trend indicator
- Active orders count
- Completed orders today
- Low stock alerts
- Sales chart visualization

### 🧾 Order Management
- Order list with status filtering
- Real-time updates via Socket.io
- Add/remove items from orders
- Apply discounts
- Process payments
- Print receipts

### 🍕 Menu Management
- Category management
- Menu item CRUD operations
- Price management
- Availability toggle
- Product images

### 🪑 Table Management
- Visual table layout
- Table status: Available, Occupied
- Quick order creation from tables
- Real-time table status updates

### 👥 Customer Management
- Customer database
- Search customers
- Add new customers from POS

### 💳 Payment Settings
- Multiple payment gateway support
- Configure: Stripe, Razorpay, PayPal, PayU
- Admin configuration panel

### 📦 Inventory & Recipes
- Inventory item management
- Recipe management with ingredients
- Low stock alerts
- Purchase orders

### ⚙️ Settings
- Restaurant profile
- Market configuration (India, US, UK, UAE, Europe)
- Currency settings
- Theme preferences

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite with Prisma ORM
- **Real-time**: Socket.io
- **Authentication**: JWT
- **Password**: bcryptjs

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Icons**: Lucide React
- **Animations**: Framer Motion

## Project Structure

```
RestroPro/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── lib/           # Utilities, API, stores
│   │   ├── pages/         # Page components
│   │   └── App.tsx        # Main app component
│   ├── package.json
│   └── vite.config.ts
│
├── server/                # Express backend
│   ├── src/
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Auth middleware
│   │   └── index.ts      # Server entry point
│   ├── package.json
│   └── tsconfig.json
│
├── prisma/                # Database schema
│   ├── schema.prisma
│   ├── seed.ts
│   └── dev.db
│
└── package.json          # Root package.json
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd RestroPro
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**

Create `.env` file in root directory:
```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# JWT Secret (change in production)
JWT_SECRET="your-super-secret-jwt-key"

# Server Port
PORT=3001
```

4. **Initialize database**
```bash
npm run db:push
npm run db:seed
```

5. **Start development servers**
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

### Default Login Credentials
- **Email**: owner@spice.com
- **Password**: password123

## Building for Production

### Backend Build
```bash
cd server
npm run build
```

### Frontend Build
```bash
cd client
npm run build
```

The production files will be in `client/dist/` directory.

## Deployment

### Option 1: Render (Recommended)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set environment variables:
   - `DATABASE_URL`: Point to persistent storage
   - `JWT_SECRET`: Generate a secure key
   - `PORT`: 10000 (Render default)
4. Build command: `npm install && npx prisma db push`
5. Start command: `npm run start`

See `render.yaml` for configuration.

### Option 2: VPS/Server

1. Build both frontend and backend
2. Set up Nginx for static files
3. Use PM2 to run the Node.js server
4. Configure environment variables
5. Point domain to your server

### Option 3: Docker

Create `Dockerfile` for backend:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3001
CMD ["npm", "run", "start"]
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register user

### Tenants
- `GET /api/tenants` - Get tenant info
- `PUT /api/tenants` - Update tenant

### Menu
- `GET /api/menu/categories` - List categories
- `POST /api/menu/categories` - Create category
- `GET /api/menu/items` - List menu items
- `POST /api/menu/items` - Create item
- `PATCH /api/menu/items/:id/availability` - Toggle availability

### Tables
- `GET /api/tables` - List tables
- `POST /api/tables` - Create table
- `PATCH /api/tables/:id/status` - Update status

### Orders
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order
- `PATCH /api/orders/:id/status` - Update status
- `POST /api/orders/:id/payment` - Process payment

### Customers
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer

### Reports
- `GET /api/reports/sales` - Sales report
- `GET /api/reports/items` - Item sales report

## Socket Events

### Client Listens
- `order-updated` - Order details changed
- `order-status-changed` - Order status updated
- `new-order` - New order created

### Client Emits
- `join-kitchen` - Join kitchen room
- `join-tenant` - Join tenant room

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (Owner, Manager, Cashier)
- Tenant isolation
- Input validation with Zod

## License

MIT License - feel free to use this project for your own purposes.

## Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Contact the development team