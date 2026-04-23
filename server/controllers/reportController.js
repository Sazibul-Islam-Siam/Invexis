const Sale = require('../models/Sale');
const Product = require('../models/Product');
const StockAdjustment = require('../models/StockAdjustment');
const Category = require('../models/Category');

// @desc    Get sales report (revenue by period, top products, category breakdown)
// @route   GET /api/reports/sales
// @access  Private (Admin)
const getSalesReport = async (req, res, next) => {
  try {
    const { startDate, endDate, period = 'daily' } = req.query;
    const query = {};

    if (startDate || endDate) {
      query.saleDate = {};
      if (startDate) query.saleDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.saleDate.$lte = end;
      }
    }

    const sales = await Sale.find(query)
      .populate('items.product', 'name sku category price')
      .populate('soldBy', 'name');

    // Revenue over time
    const revenueByPeriod = {};
    sales.forEach((sale) => {
      const d = new Date(sale.saleDate);
      let key;
      if (period === 'daily') {
        key = d.toISOString().split('T')[0];
      } else if (period === 'weekly') {
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      }
      if (!revenueByPeriod[key]) revenueByPeriod[key] = { revenue: 0, transactions: 0, items: 0 };
      revenueByPeriod[key].revenue += sale.totalAmount || 0;
      revenueByPeriod[key].transactions += 1;
      revenueByPeriod[key].items += (sale.items || []).reduce((s, i) => s + i.quantity, 0);
    });

    const revenueTimeline = Object.entries(revenueByPeriod)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date, ...data }));

    // Top selling products
    const productSales = {};
    sales.forEach((sale) => {
      (sale.items || []).forEach((item) => {
        const pid = item.product?._id?.toString();
        if (!pid) return;
        if (!productSales[pid]) {
          productSales[pid] = {
            name: item.product.name,
            sku: item.product.sku,
            totalQty: 0,
            totalRevenue: 0,
          };
        }
        productSales[pid].totalQty += item.quantity;
        productSales[pid].totalRevenue += item.totalPrice || 0;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    // Sales by staff
    const staffSales = {};
    sales.forEach((sale) => {
      const name = sale.soldBy?.name || 'Unknown';
      if (!staffSales[name]) staffSales[name] = { transactions: 0, revenue: 0 };
      staffSales[name].transactions += 1;
      staffSales[name].revenue += sale.totalAmount || 0;
    });

    const salesByStaff = Object.entries(staffSales)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue);

    // Overall summary
    const totalRevenue = sales.reduce((s, sale) => s + (sale.totalAmount || 0), 0);
    const totalTransactions = sales.length;
    const totalItemsSold = sales.reduce(
      (s, sale) => s + (sale.items || []).reduce((is, i) => is + i.quantity, 0),
      0
    );
    const avgOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    res.json({
      success: true,
      data: {
        summary: { totalRevenue, totalTransactions, totalItemsSold, avgOrderValue },
        revenueTimeline,
        topProducts,
        salesByStaff,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get inventory report (stock levels, category distribution, value)
// @route   GET /api/reports/inventory
// @access  Private (Admin)
const getInventoryReport = async (req, res, next) => {
  try {
    const products = await Product.find().populate('category', 'name');

    // Stock levels
    const totalProducts = products.length;
    const inStock = products.filter((p) => p.quantity > p.minStockThreshold).length;
    const lowStock = products.filter(
      (p) => p.quantity > 0 && p.quantity <= p.minStockThreshold
    ).length;
    const outOfStock = products.filter((p) => p.quantity === 0).length;

    // Total inventory value (cost price * quantity)
    const totalValue = products.reduce(
      (sum, p) => sum + (p.costPrice || p.price) * p.quantity,
      0
    );
    const totalRetailValue = products.reduce((sum, p) => sum + p.price * p.quantity, 0);

    // Category distribution
    const categoryMap = {};
    products.forEach((p) => {
      const catName = p.category?.name || 'Uncategorized';
      if (!categoryMap[catName]) categoryMap[catName] = { count: 0, value: 0, qty: 0 };
      categoryMap[catName].count += 1;
      categoryMap[catName].value += (p.costPrice || p.price) * p.quantity;
      categoryMap[catName].qty += p.quantity;
    });

    const categoryDistribution = Object.entries(categoryMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.value - a.value);

    // Low stock items
    const lowStockItems = products
      .filter((p) => p.quantity <= p.minStockThreshold && p.status === 'active')
      .map((p) => ({
        name: p.name,
        sku: p.sku,
        quantity: p.quantity,
        minStockThreshold: p.minStockThreshold,
        category: p.category?.name,
      }))
      .sort((a, b) => a.quantity - b.quantity);

    res.json({
      success: true,
      data: {
        summary: { totalProducts, inStock, lowStock, outOfStock, totalValue, totalRetailValue },
        categoryDistribution,
        lowStockItems,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get stock movement report (adjustments summary)
// @route   GET /api/reports/stock-movements
// @access  Private (Admin)
const getStockMovementReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const adjustments = await StockAdjustment.find(query)
      .populate('product', 'name sku')
      .populate('adjustedBy', 'name');

    // Summary by type
    const typeSummary = { damaged: 0, lost: 0, expired: 0, correction: 0 };
    adjustments.forEach((a) => {
      typeSummary[a.type] = (typeSummary[a.type] || 0) + Math.abs(a.quantity);
    });

    const byType = Object.entries(typeSummary).map(([type, qty]) => ({ type, qty }));

    res.json({
      success: true,
      data: {
        total: adjustments.length,
        byType,
        adjustments: adjustments.slice(0, 50),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSalesReport, getInventoryReport, getStockMovementReport };
