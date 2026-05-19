/**
 * Migrate Existing Suppliers to Shared Supplier System
 *
 * Usage: node scripts/migrateSuppliers.js
 *
 * This script migrates existing suppliers from the old single-company model
 * to the new CompanySupplier junction model:
 *   1. For each supplier with a company set → create a CompanySupplier entry
 *   2. Set supplier's company field to null
 *
 * ⚠️  Safe to run multiple times — it skips already-migrated suppliers.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const CompanySupplier = require('../models/CompanySupplier');
const connectDB = require('../config/db');

const migrate = async () => {
  try {
    await connectDB();

    // Find suppliers that still have a company set (not yet migrated)
    const suppliers = await User.find({ role: 'supplier', company: { $ne: null } });

    if (suppliers.length === 0) {
      console.log('✅ No suppliers to migrate. All suppliers are already on the new system.');
      process.exit(0);
    }

    console.log(`Found ${suppliers.length} supplier(s) to migrate...\n`);

    let migrated = 0;
    let skipped = 0;

    for (const supplier of suppliers) {
      // Check if CompanySupplier link already exists
      const existing = await CompanySupplier.findOne({
        company: supplier.company,
        supplier: supplier._id,
      });

      if (existing) {
        console.log(`  ⏭️  ${supplier.name} (${supplier.email}) — link already exists, clearing company field`);
        skipped++;
      } else {
        // Create the junction entry
        await CompanySupplier.create({
          company: supplier.company,
          supplier: supplier._id,
        });
        console.log(`  ✅ ${supplier.name} (${supplier.email}) — created CompanySupplier link`);
        migrated++;
      }

      // Clear the company field on the supplier user
      supplier.company = undefined;
      await supplier.save({ validateBeforeSave: false });
    }

    console.log('\n──────────────────────────────────');
    console.log(`Migration complete!`);
    console.log(`  Migrated: ${migrated}`);
    console.log(`  Skipped:  ${skipped}`);
    console.log('──────────────────────────────────');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
};

migrate();
