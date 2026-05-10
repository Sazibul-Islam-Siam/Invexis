const StockAdjustment = require('../models/StockAdjustment');
const Product = require('../models/Product');
const logAudit = require('../utils/logger');

const getStockAdjustments = async (req, res, next) => {
  try {
    const { type, product, page = 1, limit = 20 } = req.query;
    const query = { company: req.user.company };

    if (type) query.type = type;
    if (product) query.product = product;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [adjustments, total] = await Promise.all([
      StockAdjustment.find(query)
        .populate('product', 'name sku quantity')
        .populate('adjustedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      StockAdjustment.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: adjustments.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: adjustments,
    });
  } catch (error) {
    next(error);
  }
};

const createStockAdjustment = async (req, res, next) => {
  try {
    const { product: productId, type, quantity, reason } = req.body;

    const product = await Product.findOne({ _id: productId, company: req.user.company });
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    const adjustQty = Math.abs(quantity);

    if (['damaged', 'lost', 'expired'].includes(type)) {
      if (product.quantity < adjustQty) {
        res.status(400);
        throw new Error(`Cannot remove ${adjustQty} units. Current stock: ${product.quantity}`);
      }
      product.quantity -= adjustQty;
    } else if (type === 'correction') {
      product.quantity += quantity;
      if (product.quantity < 0) {
        res.status(400);
        throw new Error('Correction would result in negative stock');
      }
    }

    await product.save();

    const adjustment = await StockAdjustment.create({
      product: productId,
      type,
      quantity: type === 'correction' ? quantity : -adjustQty,
      reason,
      adjustedBy: req.user._id,
      company: req.user.company,
    });

    const populated = await StockAdjustment.findById(adjustment._id)
      .populate('product', 'name sku quantity')
      .populate('adjustedBy', 'name');

    logAudit(req.user._id, 'CREATE', 'StockAdjustment', adjustment._id, `Stock ${type}: ${Math.abs(adjustment.quantity)} × ${populated.product?.name}`, req.user.company);

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

module.exports = { getStockAdjustments, createStockAdjustment };
