const mongoose = require('mongoose');

const inventoryBatchSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    unitCost: {
      type: Number,
      required: [true, 'Unit cost is required'],
      min: [0, 'Unit cost cannot be negative'],
    },
    initialQty: {
      type: Number,
      required: [true, 'Initial quantity is required'],
      min: [1, 'Initial quantity must be at least 1'],
    },
    remainingQty: {
      type: Number,
      required: true,
      min: [0, 'Remaining quantity cannot be negative'],
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    restockRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RestockRequest',
    },
    receivedAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient FIFO queries: find oldest batches with remaining stock
inventoryBatchSchema.index({ product: 1, company: 1, receivedAt: 1 });

module.exports = mongoose.model('InventoryBatch', inventoryBatchSchema);
