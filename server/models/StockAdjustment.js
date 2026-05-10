const mongoose = require('mongoose');

const stockAdjustmentSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Please select a product'],
    },
    adjustedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['damaged', 'lost', 'expired', 'correction'],
      required: [true, 'Please select adjustment type'],
    },
    quantity: {
      type: Number,
      required: [true, 'Please add adjustment quantity'],
    },
    reason: {
      type: String,
      required: [true, 'Please add a reason for adjustment'],
      trim: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('StockAdjustment', stockAdjustmentSchema);
