const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Category = require('../models/Category');
const RestockRequest = require('../models/RestockRequest');
const User = require('../models/User');
const StockAdjustment = require('../models/StockAdjustment');

const getStats = async (req, res, next) => {
  try {
    const co = req.user.company;

    const totalProducts = await Product.countDocuments({ company: co });
    const activeProducts = await Product.countDocuments({ company: co, status: 'active' });

    const lowStockProducts = await Product.find({
      company: co,
      status: 'active',
    })
      .populate('category', 'name')
      .select('name sku quantity minStockThreshold category');

    const filteredLowStock = lowStockProducts
      .filter(p => p.quantity <= p.minStockThreshold)
      .slice(0, 10);

    const allSales = await Sale.find({ company: co });
    const totalSales = allSales.length;
    const totalRevenue = allSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const totalProfit = allSales.reduce((sum, s) => sum + (s.totalProfit || 0), 0);
    const totalItemsSold = allSales.reduce(
      (sum, s) => sum + (s.items || []).reduce((iSum, item) => iSum + item.quantity, 0), 0
    );

    const totalCategories = await Category.countDocuments({ company: co });

    res.json({
      success: true,
      data: {
        totalProducts, activeProducts, totalSales, totalRevenue, totalProfit, totalItemsSold,
        totalCategories, lowStockCount: filteredLowStock.length, lowStockProducts: filteredLowStock,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getSalesChart = async (req, res, next) => {
  try {
    const co = req.user.company;
    const { days = 7 } = req.query;
    const numDays = parseInt(days);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - numDays + 1);
    startDate.setHours(0, 0, 0, 0);

    const sales = await Sale.find({ company: co, saleDate: { $gte: startDate } });

    const dailyData = [];
    for (let i = 0; i < numDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);

      const daySales = sales.filter(
        (s) => new Date(s.saleDate) >= dayStart && new Date(s.saleDate) <= dayEnd
      );

      dailyData.push({
        date: dayStart.toISOString().split('T')[0],
        label: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: daySales.reduce((sum, s) => sum + (s.totalAmount || 0), 0),
        profit: daySales.reduce((sum, s) => sum + (s.totalProfit || 0), 0),
        transactions: daySales.length,
      });
    }

    res.json({ success: true, data: dailyData });
  } catch (error) {
    next(error);
  }
};

const getRecentActivity = async (req, res, next) => {
  try {
    const co = req.user.company;
    const activities = [];

    const recentSales = await Sale.find({ company: co })
      .populate('items.product', 'name')
      .populate('soldBy', 'name')
      .sort({ createdAt: -1 }).limit(5);

    recentSales.forEach((sale) => {
      const itemNames = (sale.items || []).map((i) => i.product?.name || 'Unknown').join(', ');
      activities.push({
        _id: sale._id, type: 'sale',
        description: `Sold ${itemNames}`, detail: sale.invoiceNo,
        amount: sale.totalAmount, user: sale.soldBy?.name || 'Unknown', date: sale.createdAt,
      });
    });

    const deliveredRestocks = await RestockRequest.find({ company: co, status: 'delivered' })
      .populate('product', 'name').populate('supplier', 'name')
      .sort({ updatedAt: -1 }).limit(5);

    deliveredRestocks.forEach((r) => {
      activities.push({
        _id: r._id, type: 'delivery',
        description: `Received ${r.quantity} × ${r.product?.name || 'Unknown'}`,
        detail: `From ${r.supplier?.name || 'Unknown'}`,
        user: r.supplier?.name || 'Unknown', date: r.updatedAt,
      });
    });

    const newUsers = await User.find({ company: co })
      .select('name role createdAt').sort({ createdAt: -1 }).limit(5);

    newUsers.forEach((u) => {
      activities.push({
        _id: u._id, type: 'user',
        description: `New ${u.role} account created`, detail: u.name,
        user: u.name, date: u.createdAt,
      });
    });

    const adjustments = await StockAdjustment.find({ company: co })
      .populate('product', 'name').populate('adjustedBy', 'name')
      .sort({ createdAt: -1 }).limit(5);

    adjustments.forEach((a) => {
      activities.push({
        _id: a._id, type: 'adjustment',
        description: `${a.type.charAt(0).toUpperCase() + a.type.slice(1)}: ${Math.abs(a.quantity)} × ${a.product?.name || 'Unknown'}`,
        detail: a.reason, user: a.adjustedBy?.name || 'Unknown', date: a.createdAt,
      });
    });

    const newProducts = await Product.find({ company: co })
      .select('name sku createdAt').sort({ createdAt: -1 }).limit(5);

    newProducts.forEach((p) => {
      activities.push({
        _id: p._id, type: 'product',
        description: `New product added`, detail: p.name,
        user: 'System', date: p.createdAt,
      });
    });

    activities.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json({ success: true, data: activities.slice(0, 10) });
  } catch (error) {
    next(error);
  }
};

const getSupplierStats = async (req, res, next) => {
  try {
    const supplierId = req.user._id;
    const co = req.user.company;

    const allRequests = await RestockRequest.find({ supplier: supplierId, company: co })
      .populate('product', 'name sku').populate('requestedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        totalRequests: allRequests.length,
        pending: allRequests.filter((r) => r.status === 'pending').length,
        accepted: allRequests.filter((r) => r.status === 'accepted').length,
        shipped: allRequests.filter((r) => r.status === 'shipped').length,
        delivered: allRequests.filter((r) => r.status === 'delivered').length,
        rejected: allRequests.filter((r) => r.status === 'rejected').length,
        recentRequests: allRequests.slice(0, 10),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getStaffStats = async (req, res, next) => {
  try {
    const staffId = req.user._id;
    const co = req.user.company;

    const mySales = await Sale.find({ soldBy: staffId, company: co })
      .populate('items.product', 'name').sort({ createdAt: -1 });

    const totalSales = mySales.length;
    const totalRevenue = mySales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const totalItemsSold = mySales.reduce(
      (sum, s) => sum + (s.items || []).reduce((is, i) => is + i.quantity, 0), 0
    );

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todaySales = mySales.filter((s) => new Date(s.saleDate) >= today);
    const todayRevenue = todaySales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);

    const totalProducts = await Product.countDocuments({ company: co, status: 'active' });
    const activeForLowStock = await Product.find({ company: co, status: 'active' }).select('quantity minStockThreshold');
    const lowStockCount = activeForLowStock.filter(p => p.quantity <= p.minStockThreshold).length;

    res.json({
      success: true,
      data: {
        totalSales, totalRevenue, totalItemsSold,
        todaySales: todaySales.length, todayRevenue, totalProducts, lowStockCount,
        recentSales: mySales.slice(0, 8).map((s) => ({
          _id: s._id, invoiceNo: s.invoiceNo, totalAmount: s.totalAmount,
          items: (s.items || []).map((i) => ({ name: i.product?.name || 'Unknown', quantity: i.quantity })),
          date: s.createdAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getStats, getSalesChart, getRecentActivity, getSupplierStats, getStaffStats };
