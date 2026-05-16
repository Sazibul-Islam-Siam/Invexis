const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
  },
  unitPrice: {
    type: Number,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  unitCost: {
    type: Number,
    default: 0,
  },
  totalCost: {
    type: Number,
    default: 0,
  },
});

const saleSchema = new mongoose.Schema(
  {
    invoiceNo: {
      type: String,
    },
    items: {
      type: [saleItemSchema],
      required: true,
      validate: {
        validator: function (v) {
          return v.length > 0;
        },
        message: 'A sale must have at least one item',
      },
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    totalCost: {
      type: Number,
      default: 0,
    },
    totalProfit: {
      type: Number,
      default: 0,
    },
    soldBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    saleDate: {
      type: Date,
      default: Date.now,
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

// Invoice number unique per company
saleSchema.index({ invoiceNo: 1, company: 1 }, { unique: true });

// Auto-generate invoice number scoped to company
saleSchema.pre('save', async function () {
  if (!this.invoiceNo) {
    const count = await mongoose.model('Sale').countDocuments({ company: this.company });
    const padded = String(count + 1).padStart(5, '0');
    this.invoiceNo = `INV-${padded}`;
  }
});

module.exports = mongoose.model('Sale', saleSchema);
