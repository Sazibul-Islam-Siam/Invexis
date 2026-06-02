const StockAdjustment = require('../models/StockAdjustment');
const Product = require('../models/Product');
const logAudit = require('../utils/logger');
const { allocateFIFO, syncProductFromBatches, createBatch } = require('../utils/batchHelper');

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
      // FIFO: Deduct from oldest batches first
      await allocateFIFO(product._id, req.user.company, adjustQty);
      await syncProductFromBatches(product._id, req.user.company);
    } else if (type === 'correction') {
      if (quantity > 0) {
        // Positive correction: Create a new batch at current average costPrice
        await createBatch({
          product: product._id,
          company: req.user.company,
          unitCost: product.costPrice || 0,
          initialQty: quantity,
          notes: `Stock correction: +${quantity} (${reason || 'manual correction'})`,
        });
      } else if (quantity < 0) {
        // Negative correction: Deduct from oldest batches (FIFO)
        await allocateFIFO(product._id, req.user.company, adjustQty);
        await syncProductFromBatches(product._id, req.user.company);
      }
    }

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
