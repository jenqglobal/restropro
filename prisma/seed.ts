import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create demo tenant (Spice Garden Restaurant)
  const tenant = await prisma.tenant.upsert({
    where: { email: 'spicegarden@demo.com' },
    update: {},
    create: {
      name: 'Spice Garden',
      email: 'spicegarden@demo.com',
      phone: '+91 9876543210',
      address: '123 Food Street, Mumbai',
      subscription: 'active',
    },
  });

  // Create users with roles
  const password = await bcrypt.hash('password123', 10);

  const owner = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'owner@spice.com' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'owner@spice.com',
      password,
      name: 'Rajesh Kumar',
      role: 'owner',
      phone: '+91 9876543211',
    },
  });

  const manager = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'manager@spice.com' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'manager@spice.com',
      password,
      name: 'Priya Sharma',
      role: 'manager',
      phone: '+91 9876543212',
    },
  });

  const cashier = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'cashier@spice.com' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'cashier@spice.com',
      password,
      name: 'Amit Patel',
      role: 'cashier',
      phone: '+91 9876543213',
    },
  });

  const kitchen = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'kitchen@spice.com' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'kitchen@spice.com',
      password,
      name: 'Chef Ramesh',
      role: 'kitchen',
      phone: '+91 9876543214',
    },
  });

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Starters' } },
      update: {},
      create: { tenantId: tenant.id, name: 'Starters', description: 'Appetizers & Starters', sortOrder: 1 },
    }),
    prisma.category.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Main Course' } },
      update: {},
      create: { tenantId: tenant.id, name: 'Main Course', description: 'Main dishes & Entrees', sortOrder: 2 },
    }),
    prisma.category.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Sides' } },
      update: {},
      create: { tenantId: tenant.id, name: 'Sides', description: 'Side dishes & Accompaniments', sortOrder: 3 },
    }),
    prisma.category.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Beverages' } },
      update: {},
      create: { tenantId: tenant.id, name: 'Beverages', description: 'Drinks & Mocktails', sortOrder: 4 },
    }),
    prisma.category.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Desserts' } },
      update: {},
      create: { tenantId: tenant.id, name: 'Desserts', description: 'Sweet treats', sortOrder: 5 },
    }),
  ]);

  // Create menu items - US & UK Continental
  const menuItems = await Promise.all([
    // Starters
    prisma.menuItem.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Caesar Salad' } },
      update: {},
      create: { tenantId: tenant.id, categoryId: categories[0].id, name: 'Caesar Salad', description: 'Romaine lettuce, croutons, parmesan, caesar dressing', price: 12.99 },
    }),
    prisma.menuItem.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Garlic Bread' } },
      update: {},
      create: { tenantId: tenant.id, categoryId: categories[0].id, name: 'Garlic Bread', description: 'Toasted bread with garlic butter and herbs', price: 6.99 },
    }),
    prisma.menuItem.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Soup of the Day' } },
      update: {},
      create: { tenantId: tenant.id, categoryId: categories[0].id, name: 'Soup of the Day', description: 'Ask your server for today\'s selection', price: 7.99 },
    }),
    prisma.menuItem.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Mozzarella Sticks' } },
      update: {},
      create: { tenantId: tenant.id, categoryId: categories[0].id, name: 'Mozzarella Sticks', description: 'Breaded mozzarella with marinara sauce', price: 9.99 },
    }),
    prisma.menuItem.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Wings Basket' } },
      update: {},
      create: { tenantId: tenant.id, categoryId: categories[0].id, name: 'Wings Basket', description: 'Crispy chicken wings with choice of sauce', price: 13.99 },
    }),
    prisma.menuItem.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Nachos Supreme' } },
      update: {},
      create: { tenantId: tenant.id, categoryId: categories[0].id, name: 'Nachos Supreme', description: 'Tortilla chips, cheese, jalapeños, sour cream', price: 11.99 },
    }),
    // Main Course
    prisma.menuItem.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Fish & Chips' } },
      update: {},
      create: { tenantId: tenant.id, categoryId: categories[1].id, name: 'Fish & Chips', description: 'Beer-battered cod, chips, mushy peas, tartare sauce', price: 18.99 },
    }),
    prisma.menuItem.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Beef Burger' } },
      update: {},
      create: { tenantId: tenant.id, categoryId: categories[1].id, name: 'Beef Burger', description: 'Angus beef patty, cheddar, lettuce, tomato, pickles', price: 15.99 },
    }),
    prisma.menuItem.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Grilled Salmon' } },
      update: {},
      create: { tenantId: tenant.id, categoryId: categories[1].id, name: 'Grilled Salmon', description: 'Atlantic salmon, roasted potatoes, seasonal vegetables', price: 24.99 },
    }),
    prisma.menuItem.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Shepherd\'s Pie' } },
      update: {},
      create: { tenantId: tenant.id, categoryId: categories[1].id, name: 'Shepherd\'s Pie', description: 'Lamb and vegetable pie with mashed potato topping', price: 17.99 },
    }),
    prisma.menuItem.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Chicken Parmesan' } },
      update: {},
      create: { tenantId: tenant.id, categoryId: categories[1].id, name: 'Chicken Parmesan', description: 'Breaded chicken, marinara, mozzarella, spaghetti', price: 19.99 },
    }),
    prisma.menuItem.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Steak & Ale Pie' } },
      update: {},
      create: { tenantId: tenant.id, categoryId: categories[1].id, name: 'Steak & Ale Pie', description: 'Tender beef in rich ale gravy, puff pastry', price: 16.99 },
    }),
    // Sides
    prisma.menuItem.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Mashed Potatoes' } },
      update: {},
      create: { tenantId: tenant.id, categoryId: categories[2].id, name: 'Mashed Potatoes', description: 'Creamy buttered mashed potatoes', price: 5.99 },
    }),
    prisma.menuItem.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Chips' } },
      update: {},
      create: { tenantId: tenant.id, categoryId: categories[2].id, name: 'Chips', description: 'Hand-cut fries with sea salt', price: 5.99 },
    }),
    prisma.menuItem.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Coleslaw' } },
      update: {},
      create: { tenantId: tenant.id, categoryId: categories[2].id, name: 'Coleslaw', description: 'Creamy homemade coleslaw', price: 3.99 },
    }),
    prisma.menuItem.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Garden Salad' } },
      update: {},
      create: { tenantId: tenant.id, categoryId: categories[2].id, name: 'Garden Salad', description: 'Mixed greens, cucumber, tomato, vinaigrette', price: 6.99 },
    }),
    // Beverages
    prisma.menuItem.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'English Breakfast Tea' } },
      update: {},
      create: { tenantId: tenant.id, categoryId: categories[3].id, name: 'English Breakfast Tea', description: 'Classic black tea with milk', price: 3.99 },
    }),
    prisma.menuItem.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Americano' } },
      update: {},
      create: { tenantId: tenant.id, categoryId: categories[3].id, name: 'Americano', description: 'Espresso with hot water', price: 4.49 },
    }),
    prisma.menuItem.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Cappuccino' } },
      update: {},
      create: { tenantId: tenant.id, categoryId: categories[3].id, name: 'Cappuccino', description: 'Espresso with steamed milk and foam', price: 5.49 },
    }),
    prisma.menuItem.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Fresh Lemonade' } },
      update: {},
      create: { tenantId: tenant.id, categoryId: categories[3].id, name: 'Fresh Lemonade', description: 'House-made lemonade with fresh lemons', price: 4.99 },
    }),
    prisma.menuItem.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Craft Beer' } },
      update: {},
      create: { tenantId: tenant.id, categoryId: categories[3].id, name: 'Craft Beer', description: 'Selection of local craft beers', price: 7.99 },
    }),
    // Desserts
    prisma.menuItem.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Sticky Toffee Pudding' } },
      update: {},
      create: { tenantId: tenant.id, categoryId: categories[4].id, name: 'Sticky Toffee Pudding', description: 'Warm sponge cake with toffee sauce and custard', price: 8.99 },
    }),
    prisma.menuItem.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Chocolate Brownie' } },
      update: {},
      create: { tenantId: tenant.id, categoryId: categories[4].id, name: 'Chocolate Brownie', description: 'Rich chocolate brownie with vanilla ice cream', price: 9.99 },
    }),
    prisma.menuItem.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Apple Pie' } },
      update: {},
      create: { tenantId: tenant.id, categoryId: categories[4].id, name: 'Apple Pie', description: 'Warm apple pie with cinnamon and ice cream', price: 7.99 },
    }),
    prisma.menuItem.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Cheesecake' } },
      update: {},
      create: { tenantId: tenant.id, categoryId: categories[4].id, name: 'Cheesecake', description: 'New York style cheesecake with berry compote', price: 8.99 },
    }),
  ]);

  // Create tables
  const tables = await Promise.all([
    prisma.table.upsert({
      where: { tenantId_number: { tenantId: tenant.id, number: 'T1' } },
      update: {},
      create: { tenantId: tenant.id, number: 'T1', capacity: 4, positionX: 0, positionY: 0, section: 'A' },
    }),
    prisma.table.upsert({
      where: { tenantId_number: { tenantId: tenant.id, number: 'T2' } },
      update: {},
      create: { tenantId: tenant.id, number: 'T2', capacity: 4, positionX: 1, positionY: 0, section: 'A' },
    }),
    prisma.table.upsert({
      where: { tenantId_number: { tenantId: tenant.id, number: 'T3' } },
      update: {},
      create: { tenantId: tenant.id, number: 'T3', capacity: 6, positionX: 2, positionY: 0, section: 'A' },
    }),
    prisma.table.upsert({
      where: { tenantId_number: { tenantId: tenant.id, number: 'T4' } },
      update: {},
      create: { tenantId: tenant.id, number: 'T4', capacity: 2, positionX: 0, positionY: 1, section: 'B' },
    }),
    prisma.table.upsert({
      where: { tenantId_number: { tenantId: tenant.id, number: 'T5' } },
      update: {},
      create: { tenantId: tenant.id, number: 'T5', capacity: 2, positionX: 1, positionY: 1, section: 'B' },
    }),
    prisma.table.upsert({
      where: { tenantId_number: { tenantId: tenant.id, number: 'T6' } },
      update: {},
      create: { tenantId: tenant.id, number: 'T6', capacity: 8, positionX: 2, positionY: 1, section: 'B' },
    }),
    prisma.table.upsert({
      where: { tenantId_number: { tenantId: tenant.id, number: 'T7' } },
      update: {},
      create: { tenantId: tenant.id, number: 'T7', capacity: 4, positionX: 0, positionY: 2, section: 'C' },
    }),
    prisma.table.upsert({
      where: { tenantId_number: { tenantId: tenant.id, number: 'T8' } },
      update: {},
      create: { tenantId: tenant.id, number: 'T8', capacity: 4, positionX: 1, positionY: 2, section: 'C' },
    }),
    prisma.table.upsert({
      where: { tenantId_number: { tenantId: tenant.id, number: 'T9' } },
      update: {},
      create: { tenantId: tenant.id, number: 'T9', capacity: 6, positionX: 2, positionY: 2, section: 'C' },
    }),
    prisma.table.upsert({
      where: { tenantId_number: { tenantId: tenant.id, number: 'T10' } },
      update: {},
      create: { tenantId: tenant.id, number: 'T10', capacity: 10, positionX: 1, positionY: 3, section: 'VIP' },
    }),
  ]);

  // Create customers
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { tenantId_phone: { tenantId: tenant.id, phone: '+919876543210' } },
      update: {},
      create: { tenantId: tenant.id, name: 'Vikram Singh', phone: '+919876543210', email: 'vikram@email.com', loyaltyPoints: 150 },
    }),
    prisma.customer.upsert({
      where: { tenantId_phone: { tenantId: tenant.id, phone: '+919876543211' } },
      update: {},
      create: { tenantId: tenant.id, name: 'Sneha Reddy', phone: '+919876543211', email: 'sneha@email.com', loyaltyPoints: 85 },
    }),
    prisma.customer.upsert({
      where: { tenantId_phone: { tenantId: tenant.id, phone: '+919876543212' } },
      update: {},
      create: { tenantId: tenant.id, name: 'Arjun Kapoor', phone: '+919876543212', email: 'arjun@email.com', loyaltyPoints: 220 },
    }),
  ]);

  // Create inventory items
  const inventory = await Promise.all([
    prisma.inventoryItem.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Paneer' } },
      update: {},
      create: { tenantId: tenant.id, name: 'Paneer', unit: 'kg', currentStock: 15, minStock: 5, costPerUnit: 200 },
    }),
    prisma.inventoryItem.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Chicken' } },
      update: {},
      create: { tenantId: tenant.id, name: 'Chicken', unit: 'kg', currentStock: 25, minStock: 10, costPerUnit: 180 },
    }),
    prisma.inventoryItem.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Rice' } },
      update: {},
      create: { tenantId: tenant.id, name: 'Rice', unit: 'kg', currentStock: 50, minStock: 20, costPerUnit: 50 },
    }),
    prisma.inventoryItem.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Wheat Flour' } },
      update: {},
      create: { tenantId: tenant.id, name: 'Wheat Flour', unit: 'kg', currentStock: 30, minStock: 10, costPerUnit: 35 },
    }),
    prisma.inventoryItem.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Milk' } },
      update: {},
      create: { tenantId: tenant.id, name: 'Milk', unit: 'L', currentStock: 20, minStock: 5, costPerUnit: 45 },
    }),
    prisma.inventoryItem.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Sugar' } },
      update: {},
      create: { tenantId: tenant.id, name: 'Sugar', unit: 'kg', currentStock: 8, minStock: 3, costPerUnit: 40 },
    }),
    prisma.inventoryItem.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Ghee' } },
      update: {},
      create: { tenantId: tenant.id, name: 'Ghee', unit: 'L', currentStock: 5, minStock: 2, costPerUnit: 450 },
    }),
    prisma.inventoryItem.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Tomatoes' } },
      update: {},
      create: { tenantId: tenant.id, name: 'Tomatoes', unit: 'kg', currentStock: 12, minStock: 5, costPerUnit: 30 },
    }),
  ]);

  // Create settings
  await prisma.settings.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      currency: '£',
      taxRate: 18,
      timeZone: 'Asia/Kolkata',
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('\n📋 Demo Credentials:');
  console.log('   Owner: owner@spice.com / password123');
  console.log('   Manager: manager@spice.com / password123');
  console.log('   Cashier: cashier@spice.com / password123');
  console.log('   Kitchen: kitchen@spice.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });