const mongoose = require('mongoose');

const companySupplierSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// A supplier can only be linked to a company once
companySupplierSchema.index({ company: 1, supplier: 1 }, { unique: true });
companySupplierSchema.index({ supplier: 1 });
companySupplierSchema.index({ company: 1 });

module.exports = mongoose.model('CompanySupplier', companySupplierSchema);
