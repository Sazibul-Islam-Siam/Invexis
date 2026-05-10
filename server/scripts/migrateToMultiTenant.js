/**
 * One-time migration script: Adds a default company to all existing data.
 * 
 * Run with: node scripts/migrateToMultiTenant.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const Company = require('../models/Company');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Sale = require('../models/Sale');
const RestockRequest = require('../models/RestockRequest');
const StockAdjustment = require('../models/StockAdjustment');
const AuditLog = require('../models/AuditLog');

const migrate = async () => {
  await connectDB();
  console.log('🔄 Starting multi-tenant migration...\n');

  // 1. Create default company
  let company = await Company.findOne({ slug: 'default-company' });
  if (!company) {
    company = await Company.create({ name: 'Default Company' });
    console.log(`✅ Created default company: ${company.name} (${company._id})`);
  } else {
    console.log(`ℹ️  Default company already exists: ${company._id}`);
  }

  const companyId = company._id;

  // 2. Update all users
  const userResult = await User.updateMany(
    { company: { $exists: false } },
    { $set: { company: companyId } }
  );
  console.log(`✅ Users updated: ${userResult.modifiedCount}`);

  // Set first admin as company owner
  const adminUser = await User.findOne({ role: 'admin', company: companyId });
  if (adminUser && !company.owner) {
    company.owner = adminUser._id;
    await company.save();
    console.log(`✅ Set company owner: ${adminUser.name}`);
  }

  // 3. Update all products
  const productResult = await Product.updateMany(
    { company: { $exists: false } },
    { $set: { company: companyId } }
  );
  console.log(`✅ Products updated: ${productResult.modifiedCount}`);

  // 4. Update all categories
  const categoryResult = await Category.updateMany(
    { company: { $exists: false } },
    { $set: { company: companyId } }
  );
  console.log(`✅ Categories updated: ${categoryResult.modifiedCount}`);

  // 5. Update all sales
  const saleResult = await Sale.updateMany(
    { company: { $exists: false } },
    { $set: { company: companyId } }
  );
  console.log(`✅ Sales updated: ${saleResult.modifiedCount}`);

  // 6. Update all restock requests
  const restockResult = await RestockRequest.updateMany(
    { company: { $exists: false } },
    { $set: { company: companyId } }
  );
  console.log(`✅ Restock requests updated: ${restockResult.modifiedCount}`);

  // 7. Update all stock adjustments
  const adjustmentResult = await StockAdjustment.updateMany(
    { company: { $exists: false } },
    { $set: { company: companyId } }
  );
  console.log(`✅ Stock adjustments updated: ${adjustmentResult.modifiedCount}`);

  // 8. Update all audit logs
  const auditResult = await AuditLog.updateMany(
    { company: { $exists: false } },
    { $set: { company: companyId } }
  );
  console.log(`✅ Audit logs updated: ${auditResult.modifiedCount}`);

  // Drop old unique indexes that are now compound indexes
  try {
    await mongoose.connection.collection('products').dropIndex('sku_1');
    console.log('✅ Dropped old SKU unique index');
  } catch { console.log('ℹ️  SKU index already dropped or not found'); }

  try {
    await mongoose.connection.collection('categories').dropIndex('name_1');
    console.log('✅ Dropped old category name unique index');
  } catch { console.log('ℹ️  Category name index already dropped or not found'); }

  try {
    await mongoose.connection.collection('sales').dropIndex('invoiceNo_1');
    console.log('✅ Dropped old invoiceNo unique index');
  } catch { console.log('ℹ️  InvoiceNo index already dropped or not found'); }

  console.log('\n🎉 Migration complete! All data is now scoped to "Default Company".');
  process.exit(0);
};

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
