// prisma/seed.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding SproutBae database...');

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sproutbae.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@sproutbae.com',
      password: await bcrypt.hash('sproutbae@123', 12),
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Business settings
  await prisma.businessSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      name: 'SproutBae Wholesale',
      gstin: '27AABCS1429B1ZB',
      address: '123, Market Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      phone: '+91 98765 43210',
      email: 'billing@sproutbae.com',
      invoicePrefix: 'SB',
      nextInvoiceNo: 1,
    },
  });
  console.log('✅ Business settings created');

  // Sample products
  const products = [
    { name: 'Basmati Rice (25kg)', sku: 'RICE-BAS-25', hsnCode: '1006', unit: 'BAG', salePrice: 1850, gstRate: 5, stockQty: 200, minStockQty: 20, category: 'Grains' },
    { name: 'Toor Dal (50kg)', sku: 'DAL-TOOR-50', hsnCode: '0713', unit: 'BAG', salePrice: 4200, gstRate: 5, stockQty: 80, minStockQty: 10, category: 'Pulses' },
    { name: 'Sunflower Oil (15L)', sku: 'OIL-SF-15', hsnCode: '1512', unit: 'CAN', salePrice: 1650, gstRate: 5, stockQty: 120, minStockQty: 15, category: 'Oils' },
    { name: 'Sugar (50kg)', sku: 'SUG-50', hsnCode: '1701', unit: 'BAG', salePrice: 2100, gstRate: 5, stockQty: 50, minStockQty: 10, category: 'Sugar' },
    { name: 'Salt Iodised (1kg)', sku: 'SALT-IOD-1', hsnCode: '2501', unit: 'PCS', salePrice: 18, gstRate: 0, stockQty: 500, minStockQty: 50, category: 'Spices' },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku }, update: {}, create: p,
    });
  }
  console.log('✅ Sample products created');

  // Sample customers
  const customers = [
    { name: 'Sharma General Store', contactName: 'Ravi Sharma', phone: '9876543210', gstin: '27AABCS1429B1ZB', city: 'Mumbai', state: 'Maharashtra', creditLimit: 50000 },
    { name: 'Patel Kirana Mart', contactName: 'Suresh Patel', phone: '9765432109', city: 'Pune', state: 'Maharashtra', creditLimit: 30000 },
    { name: 'Gupta Brothers', contactName: 'Vijay Gupta', phone: '9654321098', gstin: '07AAACG2115R1ZN', city: 'Delhi', state: 'Delhi', creditLimit: 100000 },
  ];

  for (const c of customers) {
    await prisma.customer.create({ data: c }).catch(() => {});
  }
  console.log('✅ Sample customers created');

  console.log('\n🎉 Seed complete!');
  console.log('📧 Login: admin@sproutbae.com');
  console.log('🔑 Password: sproutbae@123');
  console.log('⚠️  Change password immediately after first login!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
