const RestockRequest = require('../models/RestockRequest');
const Product = require('../models/Product');
const User = require('../models/User');
const logAudit = require('../utils/logger');
const sendEmail = require('../utils/sendEmail');
const { restockNotifySupplier, shipmentNotifyAdmin, deliveryNotifySupplier } = require('../utils/emailTemplates');

// @desc    Get all restock requests
// @route   GET /api/restock-requests
// @access  Private
const getRestockRequests = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { company: req.user.company };

    if (status) query.status = status;

    if (req.user.role === 'supplier') {
      query.supplier = req.user._id;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [requests, total] = await Promise.all([
      RestockRequest.find(query)
        .populate('product', 'name sku quantity minStockThreshold')
        .populate('supplier', 'name email')
        .populate('requestedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      RestockRequest.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: requests.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create restock request
// @route   POST /api/restock-requests
// @access  Private (Admin)
const createRestockRequest = async (req, res, next) => {
  try {
    const { product, supplier, quantity, notes } = req.body;

    const request = await RestockRequest.create({
      product,
      supplier,
      quantity,
      notes,
      requestedBy: req.user._id,
      company: req.user.company,
    });

    const populated = await RestockRequest.findById(request._id)
      .populate('product', 'name sku')
      .populate('supplier', 'name email')
      .populate('requestedBy', 'name');

    logAudit(req.user._id, 'CREATE', 'RestockRequest', request._id, `Created restock request for ${populated.product?.name} (qty: ${quantity})`, req.user.company);

    if (populated.supplier?.email) {
      sendEmail({
        to: populated.supplier.email,
        subject: `New Restock Request — ${populated.product?.name}`,
        html: restockNotifySupplier(populated.supplier.name, populated.product?.name, quantity, populated.requestedBy?.name),
      });
    }

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Update restock request status
// @route   PUT /api/restock-requests/:id
// @access  Private
const updateRestockRequest = async (req, res, next) => {
  try {
    const { status, estimatedDelivery, notes } = req.body;
    const request = await RestockRequest.findOne({ _id: req.params.id, company: req.user.company });

    if (!request) {
      res.status(404);
      throw new Error('Restock request not found');
    }

    if (req.user.role === 'supplier') {
      if (request.supplier.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized');
      }
      if (!['accepted', 'rejected', 'shipped'].includes(status)) {
        res.status(400);
        throw new Error('Suppliers cannot mark shipments as delivered. Admin must confirm receipt.');
      }
    }

    if (status === 'delivered' && request.status !== 'delivered') {
      await Product.findByIdAndUpdate(request.product, {
        $inc: { quantity: request.quantity },
      });
    }

    request.status = status || request.status;
    if (estimatedDelivery) request.estimatedDelivery = estimatedDelivery;
    if (notes) request.notes = notes;

    await request.save();

    const populated = await RestockRequest.findById(request._id)
      .populate('product', 'name sku quantity')
      .populate('supplier', 'name email')
      .populate('requestedBy', 'name');

    logAudit(req.user._id, 'STATUS_CHANGE', 'RestockRequest', request._id, `Restock ${populated.product?.name} status changed to "${status}"`, req.user.company);

    if (status === 'shipped' && populated.supplier?.name) {
      const admins = await User.find({ role: 'admin', isActive: true, company: req.user.company });
      for (const admin of admins) {
        sendEmail({
          to: admin.email,
          subject: `Shipment Shipped — ${populated.product?.name}`,
          html: shipmentNotifyAdmin(admin.name, populated.product?.name, request.quantity, populated.supplier.name),
        });
      }
    }

    if (status === 'delivered' && populated.supplier?.email) {
      sendEmail({
        to: populated.supplier.email,
        subject: `Delivery Confirmed — ${populated.product?.name}`,
        html: deliveryNotifySupplier(populated.supplier.name, populated.product?.name, request.quantity),
      });
    }

    res.json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete restock request
// @route   DELETE /api/restock-requests/:id
// @access  Private (Admin)
const deleteRestockRequest = async (req, res, next) => {
  try {
    const request = await RestockRequest.findOne({ _id: req.params.id, company: req.user.company });
    if (!request) {
      res.status(404);
      throw new Error('Restock request not found');
    }
    await request.deleteOne();
    logAudit(req.user._id, 'DELETE', 'RestockRequest', req.params.id, `Deleted restock request`, req.user.company);
    res.json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRestockRequests,
  createRestockRequest,
  updateRestockRequest,
  deleteRestockRequest,
};
