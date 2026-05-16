const Sale = require('../models/Sale');
const Product = require('../models/Product');
const StockAdjustment = require('../models/StockAdjustment');

const getSalesReport = async (req, res, next) => {
  try {
    const co = req.user.company;
    const { startDate, endDate, period = 'daily' } = req.query;
    const query = { company: co };

    if (startDate || endDate) {
      query.saleDate = {};
      if (startDate) query.saleDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate); end.setHours(23, 59, 59, 999);
        query.saleDate.$lte = end;
      }
    }

    if (req.user.role === 'staff') query.soldBy = req.user._id;

    const sales = await Sale.find(query)
      .populate('items.product', 'name sku category price')
      .populate('soldBy', 'name');

    const revenueByPeriod = {};
    sales.forEach((sale) => {
      const d = new Date(sale.saleDate);
      let key;
      if (period === 'daily') key = d.toISOString().split('T')[0];
      else if (period === 'weekly') {
        const ws = new Date(d); ws.setDate(d.getDate() - d.getDay());
        key = ws.toISOString().split('T')[0];
      } else key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      if (!revenueByPeriod[key]) revenueByPeriod[key] = { revenue: 0, profit: 0, transactions: 0, items: 0 };
      revenueByPeriod[key].revenue += sale.totalAmount || 0;
      revenueByPeriod[key].profit += sale.totalProfit || 0;
      revenueByPeriod[key].transactions += 1;
      revenueByPeriod[key].items += (sale.items || []).reduce((s, i) => s + i.quantity, 0);
    });

    const revenueTimeline = Object.entries(revenueByPeriod)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date, ...data }));

    const productSales = {};
    sales.forEach((sale) => {
      (sale.items || []).forEach((item) => {
        const pid = item.product?._id?.toString();
        if (!pid) return;
        if (!productSales[pid]) productSales[pid] = { name: item.product.name, sku: item.product.sku, totalQty: 0, totalRevenue: 0, totalProfit: 0 };
        productSales[pid].totalQty += item.quantity;
        productSales[pid].totalRevenue += item.totalPrice || 0;
        productSales[pid].totalProfit += (item.totalPrice || 0) - (item.totalCost || 0);
      });
    });

    const topProducts = Object.values(productSales).sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10);

    const staffSales = {};
    sales.forEach((sale) => {
      const name = sale.soldBy?.name || 'Unknown';
      if (!staffSales[name]) staffSales[name] = { transactions: 0, revenue: 0, profit: 0 };
      staffSales[name].transactions += 1;
      staffSales[name].revenue += sale.totalAmount || 0;
      staffSales[name].profit += sale.totalProfit || 0;
    });

    const salesByStaff = Object.entries(staffSales)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue);

    const totalRevenue = sales.reduce((s, sale) => s + (sale.totalAmount || 0), 0);
    const totalProfit = sales.reduce((s, sale) => s + (sale.totalProfit || 0), 0);
    const totalTransactions = sales.length;
    const totalItemsSold = sales.reduce((s, sale) => s + (sale.items || []).reduce((is, i) => is + i.quantity, 0), 0);
    const avgOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    res.json({
      success: true,
      data: {
        summary: { totalRevenue, totalProfit, totalTransactions, totalItemsSold, avgOrderValue },
        revenueTimeline, topProducts, salesByStaff,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getInventoryReport = async (req, res, next) => {
  try {
    const co = req.user.company;
    const products = await Product.find({ company: co }).populate('category', 'name');

    const totalProducts = products.length;
    const inStock = products.filter((p) => p.quantity > p.minStockThreshold).length;
    const lowStock = products.filter((p) => p.quantity > 0 && p.quantity <= p.minStockThreshold).length;
    const outOfStock = products.filter((p) => p.quantity === 0).length;

    const totalValue = products.reduce((sum, p) => sum + (p.costPrice || p.price) * p.quantity, 0);
    const totalRetailValue = products.reduce((sum, p) => sum + p.price * p.quantity, 0);

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

    const lowStockItems = products
      .filter((p) => p.quantity <= p.minStockThreshold && p.status === 'active')
      .map((p) => ({ name: p.name, sku: p.sku, quantity: p.quantity, minStockThreshold: p.minStockThreshold, category: p.category?.name }))
      .sort((a, b) => a.quantity - b.quantity);

    res.json({
      success: true,
      data: {
        summary: { totalProducts, inStock, lowStock, outOfStock, totalValue, totalRetailValue },
        categoryDistribution, lowStockItems,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getStockMovementReport = async (req, res, next) => {
  try {
    const co = req.user.company;
    const { startDate, endDate } = req.query;
    const query = { company: co };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate); end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const adjustments = await StockAdjustment.find(query)
      .populate('product', 'name sku').populate('adjustedBy', 'name');

    const typeSummary = { damaged: 0, lost: 0, expired: 0, correction: 0 };
    adjustments.forEach((a) => { typeSummary[a.type] = (typeSummary[a.type] || 0) + Math.abs(a.quantity); });

    res.json({
      success: true,
      data: {
        total: adjustments.length,
        byType: Object.entries(typeSummary).map(([type, qty]) => ({ type, qty })),
        adjustments: adjustments.slice(0, 50),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSalesReport, getInventoryReport, getStockMovementReport };
