const InventoryBatch = require('../models/InventoryBatch');
const Product = require('../models/Product');

/**
 * Allocate stock using FIFO (First-In, First-Out).
 * Finds the oldest batches with remaining stock and deducts the requested quantity.
 *
 * @param {ObjectId} productId - The product to allocate from
 * @param {ObjectId} companyId - Company scope
 * @param {Number} quantity - Total quantity to allocate
 * @returns {Array} Array of { batch, quantity, unitCost } allocations
 * @throws {Error} If insufficient stock across all batches
 */
const allocateFIFO = async (productId, companyId, quantity) => {
  // Get batches sorted by receivedAt (oldest first) — this is the FIFO order
  const batches = await InventoryBatch.find({
    product: productId,
    company: companyId,
    remainingQty: { $gt: 0 },
  }).sort({ receivedAt: 1 });

  const totalAvailable = batches.reduce((sum, b) => sum + b.remainingQty, 0);
  if (totalAvailable < quantity) {
    throw new Error(
      `Insufficient stock. Available: ${totalAvailable}, Requested: ${quantity}`
    );
  }

  const allocations = [];
  let remaining = quantity;

  for (const batch of batches) {
    if (remaining <= 0) break;

    const take = Math.min(batch.remainingQty, remaining);
    batch.remainingQty -= take;
    await batch.save();

    allocations.push({
      batch: batch._id,
      quantity: take,
      unitCost: batch.unitCost,
    });

    remaining -= take;
  }

  return allocations;
};

/**
 * Recalculate and sync a product's cached quantity and costPrice
 * from its inventory batches.
 *
 * @param {ObjectId} productId - The product to sync
 * @param {ObjectId} companyId - Company scope
 */
const syncProductFromBatches = async (productId, companyId) => {
  const batches = await InventoryBatch.find({
    product: productId,
    company: companyId,
    remainingQty: { $gt: 0 },
  });

  const totalQty = batches.reduce((sum, b) => sum + b.remainingQty, 0);
  const totalValue = batches.reduce(
    (sum, b) => sum + b.remainingQty * b.unitCost,
    0
  );
  const weightedAvgCost = totalQty > 0 ? totalValue / totalQty : 0;

  await Product.findByIdAndUpdate(productId, {
    quantity: totalQty,
    costPrice: Math.round(weightedAvgCost * 100) / 100, // Round to 2 decimal places
  });
};

/**
 * Create a new inventory batch and sync the product's cached fields.
 *
 * @param {Object} params - Batch parameters
 * @param {ObjectId} params.product - Product ID
 * @param {ObjectId} params.company - Company ID
 * @param {Number} params.unitCost - Cost per unit
 * @param {Number} params.initialQty - Quantity received
 * @param {ObjectId} [params.supplier] - Supplier ID
 * @param {ObjectId} [params.restockRequest] - RestockRequest ID
 * @param {String} [params.notes] - Notes
 * @param {Date} [params.receivedAt] - When received (defaults to now)
 * @returns {Object} The created InventoryBatch document
 */
const createBatch = async ({
  product,
  company,
  unitCost,
  initialQty,
  supplier,
  restockRequest,
  notes,
  receivedAt,
}) => {
  const batch = await InventoryBatch.create({
    product,
    company,
    unitCost,
    initialQty,
    remainingQty: initialQty,
    supplier,
    restockRequest,
    notes,
    receivedAt: receivedAt || new Date(),
  });

  // Sync the product's cached quantity and costPrice
  await syncProductFromBatches(product, company);

  return batch;
};

module.exports = { allocateFIFO, syncProductFromBatches, createBatch };
