const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Category = require('../models/Category');
const RestockRequest = require('../models/RestockRequest');
const User = require('../models/User');
const StockAdjustment = require('../models/StockAdjustment');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private
const getStats = async (req, res, next) => {
  try {
    // Total products
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ status: 'active' });

    // Low stock items (quantity <= minStockThreshold)
    const lowStockProducts = await Product.find({
      $expr: { $lte: ['$quantity', '$minStockThreshold'] },
      status: 'active',
    })
      .populate('category', 'name')
      .select('name sku quantity minStockThreshold category')
      .limit(10);

    // Total sales & revenue
    const allSales = await Sale.find();
    const totalSales = allSales.length;
    const totalRevenue = allSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const totalItemsSold = allSales.reduce(
      (sum, s) => sum + (s.items || []).reduce((iSum, item) => iSum + item.quantity, 0),
      0
    );

    // Total categories
    const totalCategories = await Category.countDocuments();

    res.json({
      success: true,
      data: {
        totalProducts,
        activeProducts,
        totalSales,
        totalRevenue,
        totalItemsSold,
        totalCategories,
        lowStockCount: lowStockProducts.length,
        lowStockProducts,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get sales chart data (daily sales for last N days)
// @route   GET /api/dashboard/sales-chart
// @access  Private
const getSalesChart = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const numDays = parseInt(days);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - numDays + 1);
    startDate.setHours(0, 0, 0, 0);

    const sales = await Sale.find({
      saleDate: { $gte: startDate },
    });

    // Build daily buckets
    const dailyData = [];
    for (let i = 0; i < numDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const daySales = sales.filter(
        (s) => new Date(s.saleDate) >= dayStart && new Date(s.saleDate) <= dayEnd
      );

      const revenue = daySales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
      const transactions = daySales.length;

      dailyData.push({
        date: dayStart.toISOString().split('T')[0],
        label: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue,
        transactions,
      });
    }

    res.json({
      success: true,
      data: dailyData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recent activity (multi-type)
// @route   GET /api/dashboard/recent-activity
// @access  Private
const getRecentActivity = async (req, res, next) => {
  try {
    const activities = [];

    // Recent sales
    const recentSales = await Sale.find()
      .populate('items.product', 'name')
      .populate('soldBy', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    recentSales.forEach((sale) => {
      const itemNames = (sale.items || [])
        .map((i) => i.product?.name || 'Unknown')
        .join(', ');
      activities.push({
        _id: sale._id,
        type: 'sale',
        description: `Sold ${itemNames}`,
        detail: sale.invoiceNo,
        amount: sale.totalAmount,
        user: sale.soldBy?.name || 'Unknown',
        date: sale.createdAt,
      });
    });

    // Recent delivered restocks
    const deliveredRestocks = await RestockRequest.find({ status: 'delivered' })
      .populate('product', 'name')
      .populate('supplier', 'name')
      .sort({ updatedAt: -1 })
      .limit(5);

    deliveredRestocks.forEach((r) => {
      activities.push({
        _id: r._id,
        type: 'delivery',
        description: `Received ${r.quantity} × ${r.product?.name || 'Unknown'}`,
        detail: `From ${r.supplier?.name || 'Unknown'}`,
        user: r.supplier?.name || 'Unknown',
        date: r.updatedAt,
      });
    });

    // Recent new users
    const newUsers = await User.find()
      .select('name role createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    newUsers.forEach((u) => {
      activities.push({
        _id: u._id,
        type: 'user',
        description: `New ${u.role} account created`,
        detail: u.name,
        user: u.name,
        date: u.createdAt,
      });
    });

    // Recent stock adjustments
    const adjustments = await StockAdjustment.find()
      .populate('product', 'name')
      .populate('adjustedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    adjustments.forEach((a) => {
      activities.push({
        _id: a._id,
        type: 'adjustment',
        description: `${a.type.charAt(0).toUpperCase() + a.type.slice(1)}: ${Math.abs(a.quantity)} × ${a.product?.name || 'Unknown'}`,
        detail: a.reason,
        user: a.adjustedBy?.name || 'Unknown',
        date: a.createdAt,
      });
    });

    // Recent products added
    const newProducts = await Product.find()
      .select('name sku createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    newProducts.forEach((p) => {
      activities.push({
        _id: p._id,
        type: 'product',
        description: `New product added`,
        detail: p.name,
        user: 'System',
        date: p.createdAt,
      });
    });

    // Sort all by date descending, take top 10
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      data: activities.slice(0, 10),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get supplier dashboard stats
// @route   GET /api/dashboard/supplier-stats
// @access  Private (Supplier)
const getSupplierStats = async (req, res, next) => {
  try {
    const supplierId = req.user._id;

    const allRequests = await RestockRequest.find({ supplier: supplierId })
      .populate('product', 'name sku')
      .populate('requestedBy', 'name')
      .sort({ createdAt: -1 });

    const pending = allRequests.filter((r) => r.status === 'pending');
    const accepted = allRequests.filter((r) => r.status === 'accepted');
    const shipped = allRequests.filter((r) => r.status === 'shipped');
    const delivered = allRequests.filter((r) => r.status === 'delivered');
    const rejected = allRequests.filter((r) => r.status === 'rejected');

    res.json({
      success: true,
      data: {
        totalRequests: allRequests.length,
        pending: pending.length,
        accepted: accepted.length,
        shipped: shipped.length,
        delivered: delivered.length,
        rejected: rejected.length,
        recentRequests: allRequests.slice(0, 10),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get staff dashboard stats
// @route   GET /api/dashboard/staff-stats
// @access  Private (Staff)
const getStaffStats = async (req, res, next) => {
  try {
    const staffId = req.user._id;

    // Staff's own sales
    const mySales = await Sale.find({ soldBy: staffId })
      .populate('items.product', 'name')
      .sort({ createdAt: -1 });

    const totalSales = mySales.length;
    const totalRevenue = mySales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const totalItemsSold = mySales.reduce(
      (sum, s) => sum + (s.items || []).reduce((is, i) => is + i.quantity, 0), 0
    );

    // Today's sales
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySales = mySales.filter((s) => new Date(s.saleDate) >= today);
    const todayRevenue = todaySales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);

    // Product count
    const totalProducts = await Product.countDocuments({ status: 'active' });

    // Low stock
    const lowStockCount = await Product.countDocuments({
      $expr: { $lte: ['$quantity', '$minStockThreshold'] },
      status: 'active',
    });

    res.json({
      success: true,
      data: {
        totalSales,
        totalRevenue,
        totalItemsSold,
        todaySales: todaySales.length,
        todayRevenue,
        totalProducts,
        lowStockCount,
        recentSales: mySales.slice(0, 8).map((s) => ({
          _id: s._id,
          invoiceNo: s.invoiceNo,
          totalAmount: s.totalAmount,
          items: (s.items || []).map((i) => ({
            name: i.product?.name || 'Unknown',
            quantity: i.quantity,
          })),
          date: s.createdAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  getSalesChart,
  getRecentActivity,
  getSupplierStats,
  getStaffStats,
};
