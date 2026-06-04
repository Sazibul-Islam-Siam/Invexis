const mongoose = require('mongoose');

const restockRequestSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Please select a product'],
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    quantity: {
      type: Number,
      min: [1, 'Quantity must be at least 1'],
    },
    unitCost: {
      type: Number,
      min: [0, 'Unit cost cannot be negative'],
    },
    status: {
      type: String,
      enum: ['pending_admin', 'pending', 'accepted', 'rejected', 'shipped', 'delivered', 'rejected_shipment'],
      default: 'pending',
    },
    estimatedDelivery: {
      type: Date,
    },
    notes: {
      type: String,
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

module.exports = mongoose.model('RestockRequest', restockRequestSchema);
