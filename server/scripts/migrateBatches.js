/**
 * Migration Script: Create legacy InventoryBatch records for existing products.
 *
 * This one-time script should be run after deploying the FIFO batch tracking feature.
 * It creates a single "legacy" batch per product using the product's current
 * quantity and costPrice, so that FIFO allocation works for existing inventory.
 *
 * Usage:
 *   node server/scripts/migrateBatches.js
 *
 * Safe to run multiple times — it skips products that already have batches.
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Product = require('../models/Product');
const InventoryBatch = require('../models/InventoryBatch');

const MONGO_URI = process.env.MONGO_URI;

const migrateBatches = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all products with quantity > 0
    const products = await Product.find({ quantity: { $gt: 0 } });
    console.log(`📦 Found ${products.length} products with stock > 0\n`);

    let migrated = 0;
    let skipped = 0;

    for (const product of products) {
      // Check if this product already has batches (idempotent)
      const existingBatchCount = await InventoryBatch.countDocuments({
        product: product._id,
        company: product.company,
      });

      if (existingBatchCount > 0) {
        console.log(`  ⏭  Skipping "${product.name}" (${product.sku}) — already has ${existingBatchCount} batch(es)`);
        skipped++;
        continue;
      }

      // Create a legacy batch
      await InventoryBatch.create({
        product: product._id,
        company: product.company,
        unitCost: product.costPrice || 0,
        initialQty: product.quantity,
        remainingQty: product.quantity,
        supplier: product.supplier || undefined,
        notes: 'Legacy migration batch',
        receivedAt: product.createdAt || new Date(),
      });

      console.log(`  ✅ Migrated "${product.name}" (${product.sku}) — qty: ${product.quantity}, costPrice: ৳${product.costPrice || 0}`);
      migrated++;
    }

    console.log('\n' + '='.repeat(50));
    console.log(`📊 Migration Summary:`);
    console.log(`   Migrated: ${migrated} product(s)`);
    console.log(`   Skipped:  ${skipped} product(s) (already had batches)`);
    console.log(`   Total:    ${products.length} product(s) with stock`);
    console.log('='.repeat(50));

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

migrateBatches();
