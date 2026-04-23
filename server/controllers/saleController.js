const Sale = require('../models/Sale');
const Product = require('../models/Product');
const logAudit = require('../utils/logger');

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private
const getSales = async (req, res, next) => {
  try {
    const {
      startDate,
      endDate,
      sortBy = 'saleDate',
      order = 'desc',
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    // Date range filter
    if (startDate || endDate) {
      query.saleDate = {};
      if (startDate) query.saleDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.saleDate.$lte = end;
      }
    }

    // Staff can only see their own sales
    if (req.user.role === 'staff') {
      query.soldBy = req.user._id;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    const [sales, total] = await Promise.all([
      Sale.find(query)
        .populate('items.product', 'name sku price')
        .populate('soldBy', 'name email')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit)),
      Sale.countDocuments(query),
    ]);

    // Calculate summary stats
    const allSales = await Sale.find(query);
    const totalRevenue = allSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const totalItems = allSales.reduce(
      (sum, s) => sum + (s.items || []).reduce((iSum, item) => iSum + item.quantity, 0),
      0
    );

    res.json({
      success: true,
      count: sales.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      summary: {
        totalRevenue,
        totalItems,
        totalTransactions: total,
      },
      data: sales,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single sale
// @route   GET /api/sales/:id
// @access  Private
const getSale = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('items.product', 'name sku price category')
      .populate('soldBy', 'name email');

    if (!sale) {
      res.status(404);
      throw new Error('Sale not found');
    }

    res.json({
      success: true,
      data: sale,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record a new sale (multi-product)
// @route   POST /api/sales
// @access  Private (Admin, Staff)
const createSale = async (req, res, next) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400);
      throw new Error('Please add at least one item to the sale');
    }

    // Validate all products and stock
    const saleItems = [];
    for (const item of items) {
      const product = await Product.findById(item.product);

      if (!product) {
        res.status(404);
        throw new Error(`Product not found: ${item.product}`);
      }

      if (product.status === 'discontinued') {
        res.status(400);
        throw new Error(`Cannot sell discontinued product: ${product.name}`);
      }

      if (product.quantity < item.quantity) {
        res.status(400);
        throw new Error(
          `Insufficient stock for "${product.name}". Available: ${product.quantity}, Requested: ${item.quantity}`
        );
      }

      saleItems.push({
        product: product._id,
        quantity: item.quantity,
        unitPrice: product.price,
        totalPrice: product.price * item.quantity,
      });
    }

    const totalAmount = saleItems.reduce((sum, item) => sum + item.totalPrice, 0);

    // Create the sale
    const sale = await Sale.create({
      items: saleItems,
      totalAmount,
      soldBy: req.user._id,
    });

    // Deduct stock for all items
    for (const item of saleItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { quantity: -item.quantity },
      });
    }

    // Populate and return
    const populated = await Sale.findById(sale._id)
      .populate('items.product', 'name sku price')
      .populate('soldBy', 'name email');

    logAudit(req.user._id, 'CREATE', 'Sale', sale._id, `Recorded sale ${populated.invoiceNo} — ৳${totalAmount}`);

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a sale (reverses stock for all items)
// @route   DELETE /api/sales/:id
// @access  Private (Admin)
const deleteSale = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      res.status(404);
      throw new Error('Sale not found');
    }

    // Reverse stock for all items
    for (const item of sale.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { quantity: item.quantity },
      });
    }

    const invoiceNo = sale.invoiceNo;
    await sale.deleteOne();

    logAudit(req.user._id, 'DELETE', 'Sale', req.params.id, `Deleted sale ${invoiceNo} (stock restored)`);

    res.json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSales,
  getSale,
  createSale,
  deleteSale,
};
