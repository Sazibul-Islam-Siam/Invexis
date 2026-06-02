const Product = require('../models/Product');
const InventoryBatch = require('../models/InventoryBatch');
const logAudit = require('../utils/logger');
const { createBatch } = require('../utils/batchHelper');

// @desc    Get all products
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      status,
      lowStock,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 20,
    } = req.query;

    const query = { company: req.user.company };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) query.category = category;
    if (status) query.status = status;

    const sortOrder = order === 'asc' ? 1 : -1;

    // Low stock filter: compare two fields in JS since $expr is unreliable
    if (lowStock === 'true') {
      const allProducts = await Product.find(query)
        .populate('category', 'name')
        .populate('supplier', 'name email')
        .sort({ [sortBy]: sortOrder });

      const filtered = allProducts.filter(p => p.quantity <= p.minStockThreshold);
      const total = filtered.length;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const paginated = filtered.slice(skip, skip + parseInt(limit));

      return res.json({
        success: true,
        count: paginated.length,
        total,
        pages: Math.ceil(total / parseInt(limit)),
        currentPage: parseInt(page),
        data: paginated,
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name')
        .populate('supplier', 'name email')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit)),
      Product.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: products.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, company: req.user.company })
      .populate('category', 'name')
      .populate('supplier', 'name email');

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Create product (auto-creates initial batch if quantity > 0)
// @route   POST /api/products
// @access  Private (Admin)
const createProduct = async (req, res, next) => {
  try {
    const initialQty = Number(req.body.quantity) || 0;
    const initialCostPrice = Number(req.body.costPrice) || 0;

    const product = await Product.create({ ...req.body, company: req.user.company });

    // Create initial inventory batch if product starts with stock
    if (initialQty > 0) {
      await createBatch({
        product: product._id,
        company: req.user.company,
        unitCost: initialCostPrice,
        initialQty: initialQty,
        notes: 'Initial stock batch',
      });
    }

    const populated = await product.populate([
      { path: 'category', select: 'name' },
      { path: 'supplier', select: 'name email' },
    ]);

    logAudit(req.user._id, 'CREATE', 'Product', product._id, `Created product "${product.name}"`, req.user.company);

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product (quantity and costPrice are read-only — managed via batches)
// @route   PUT /api/products/:id
// @access  Private (Admin)
const updateProduct = async (req, res, next) => {
  try {
    // Strip batch-managed fields — these should only change through restocks/sales
    const updateData = { ...req.body };
    delete updateData.quantity;
    delete updateData.costPrice;

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company },
      updateData,
      { new: true, runValidators: true }
    )
      .populate('category', 'name')
      .populate('supplier', 'name email');

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    logAudit(req.user._id, 'UPDATE', 'Product', product._id, `Updated product "${product.name}"`, req.user.company);

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product (also removes all associated batches)
// @route   DELETE /api/products/:id
// @access  Private (Admin)
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, company: req.user.company });

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    // Delete all associated inventory batches
    await InventoryBatch.deleteMany({ product: product._id, company: req.user.company });

    const productName = product.name;
    await product.deleteOne();

    logAudit(req.user._id, 'DELETE', 'Product', req.params.id, `Deleted product "${productName}"`, req.user.company);

    res.json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};
