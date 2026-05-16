import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import reportService from '../services/reportService';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  HiOutlineDocumentReport,
  HiOutlineCash,
  HiOutlineShoppingCart,
  HiOutlineCube,
  HiOutlineExclamation,
  HiOutlineCalendar,
  HiOutlineDownload,
} from 'react-icons/hi';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Tooltip, Legend, Filler
);

const downloadCSV = (rows, filename) => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
};

const TABS = [
  { key: 'sales', label: 'Sales Report', icon: HiOutlineCash },
  { key: 'inventory', label: 'Inventory Report', icon: HiOutlineCube },
];

const Reports = () => {
  const [activeTab, setActiveTab] = useState('sales');
  const [salesData, setSalesData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('daily');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    if (activeTab === 'sales') fetchSalesReport();
    else fetchInventoryReport();
  }, [activeTab, period, dateRange.startDate, dateRange.endDate]);

  const fetchSalesReport = async () => {
    try {
      setLoading(true);
      const params = { period };
      if (dateRange.startDate) params.startDate = dateRange.startDate;
      if (dateRange.endDate) params.endDate = dateRange.endDate;
      const res = await reportService.getSalesReport(params);
      setSalesData(res.data);
    } catch {
      toast.error('Failed to fetch sales report');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryReport = async () => {
    try {
      setLoading(true);
      const res = await reportService.getInventoryReport();
      setInventoryData(res.data);
    } catch {
      toast.error('Failed to fetch inventory report');
    } finally {
      setLoading(false);
    }
  };

  // Chart colors
  const colors = {
    purple: { border: '#818cf8', bg: 'rgba(129, 140, 248, 0.15)' },
    emerald: { border: '#34d399', bg: 'rgba(52, 211, 153, 0.15)' },
    amber: { border: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)' },
    red: { border: '#f87171', bg: 'rgba(248, 113, 113, 0.15)' },
    blue: { border: '#60a5fa', bg: 'rgba(96, 165, 250, 0.15)' },
  };

  const chartBaseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        borderColor: '#334155',
        borderWidth: 1,
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 11 } }, border: { display: false } },
      y: { grid: { color: 'rgba(51,65,85,0.3)' }, ticks: { color: '#64748b', font: { size: 11 } }, border: { display: false }, beginAtZero: true },
    },
  };

  // Revenue line chart
  const revenueChart = salesData?.revenueTimeline?.length
    ? {
        labels: salesData.revenueTimeline.map((d) => d.date),
        datasets: [{
          label: 'Revenue',
          data: salesData.revenueTimeline.map((d) => d.revenue),
          borderColor: colors.purple.border,
          backgroundColor: colors.purple.bg,
          tension: 0.4, fill: true,
          pointBackgroundColor: colors.purple.border,
          pointBorderColor: '#1e1b4b',
          pointBorderWidth: 2, pointRadius: 4,
        },
        {
          label: 'Profit',
          data: salesData.revenueTimeline.map((d) => d.profit),
          borderColor: colors.emerald.border,
          backgroundColor: 'transparent',
          tension: 0.4, fill: false,
          pointBackgroundColor: colors.emerald.border,
          pointBorderColor: '#064e3b',
          pointBorderWidth: 2, pointRadius: 3,
        }],
      }
    : null;

  // Top products bar chart
  const topProductsChart = salesData?.topProducts?.length
    ? {
        labels: salesData.topProducts.map((p) => p.name),
        datasets: [{
          label: 'Revenue',
          data: salesData.topProducts.map((p) => p.totalRevenue),
          backgroundColor: [
            colors.purple.bg, colors.emerald.bg, colors.amber.bg,
            colors.blue.bg, colors.red.bg, colors.purple.bg,
            colors.emerald.bg, colors.amber.bg, colors.blue.bg, colors.red.bg,
          ],
          borderColor: [
            colors.purple.border, colors.emerald.border, colors.amber.border,
            colors.blue.border, colors.red.border, colors.purple.border,
            colors.emerald.border, colors.amber.border, colors.blue.border, colors.red.border,
          ],
          borderWidth: 1,
          borderRadius: 6,
        }],
      }
    : null;

  // Category doughnut chart
  const categoryChart = inventoryData?.categoryDistribution?.length
    ? {
        labels: inventoryData.categoryDistribution.map((c) => c.name),
        datasets: [{
          data: inventoryData.categoryDistribution.map((c) => c.count),
          backgroundColor: [
            colors.purple.bg, colors.emerald.bg, colors.amber.bg,
            colors.blue.bg, colors.red.bg,
          ],
          borderColor: [
            colors.purple.border, colors.emerald.border, colors.amber.border,
            colors.blue.border, colors.red.border,
          ],
          borderWidth: 2,
        }],
      }
    : null;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <HiOutlineDocumentReport className="text-primary-400" />
          Reports
        </h1>
        <p className="text-dark-400 mt-1">Analytics and business intelligence</p>
      </div>

      {/* Tabs + Export */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                : 'bg-dark-800 text-dark-400 border border-dark-700 hover:text-white hover:border-dark-600'
            }`}
          >
            <tab.icon className="text-lg" />
            {tab.label}
          </button>
        ))}
        </div>
        {!loading && (
          <button
            onClick={() => {
              if (activeTab === 'sales' && salesData) {
                const rows = (salesData.topProducts || []).map((p) => ({ Product: p.name, SKU: p.sku, Quantity_Sold: p.totalQty, Revenue: p.totalRevenue }));
                downloadCSV(rows, 'sales_report');
              } else if (inventoryData) {
                const rows = (inventoryData.lowStockItems || []).map((p) => ({ Product: p.name, SKU: p.sku, Category: p.category, Stock: p.quantity, Threshold: p.minStockThreshold }));
                if (!rows.length && inventoryData.categoryDistribution) {
                  downloadCSV(inventoryData.categoryDistribution.map((c) => ({ Category: c.name, Products: c.count, Quantity: c.qty, Value: c.value })), 'inventory_report');
                } else {
                  downloadCSV(rows, 'inventory_report');
                }
              }
              toast.success('CSV downloaded!');
            }}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <HiOutlineDownload className="text-lg" />
            Export CSV
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : activeTab === 'sales' ? (
        /* ==================== SALES REPORT ==================== */
        <div>
          {/* Date filters */}
          <div className="card mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <HiOutlineCalendar className="text-dark-400 text-lg" />
              <div className="flex items-center gap-2">
                <label className="text-sm text-dark-400">From:</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="input-field w-auto text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-dark-400">To:</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="input-field w-auto text-sm"
                />
              </div>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="input-field w-auto text-sm"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              {(dateRange.startDate || dateRange.endDate) && (
                <button
                  onClick={() => setDateRange({ startDate: '', endDate: '' })}
                  className="text-sm text-primary-400 hover:text-primary-300"
                >Clear</button>
              )}
            </div>
          </div>

          {/* Summary Cards */}
          {salesData?.summary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-6">
              <div className="card border border-emerald-500/20">
                <p className="text-sm text-dark-400">Total Revenue</p>
                <p className="text-2xl font-bold text-white mt-1">৳{salesData.summary.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="card border border-emerald-500/20">
                <p className="text-sm text-dark-400">Total Profit</p>
                <p className="text-2xl font-bold text-white mt-1">৳{salesData.summary.totalProfit.toLocaleString()}</p>
              </div>
              <div className="card border border-purple-500/20">
                <p className="text-sm text-dark-400">Transactions</p>
                <p className="text-2xl font-bold text-white mt-1">{salesData.summary.totalTransactions}</p>
              </div>
              <div className="card border border-blue-500/20">
                <p className="text-sm text-dark-400">Items Sold</p>
                <p className="text-2xl font-bold text-white mt-1">{salesData.summary.totalItemsSold}</p>
              </div>
              <div className="card border border-amber-500/20">
                <p className="text-sm text-dark-400">Avg Order Value</p>
                <p className="text-2xl font-bold text-white mt-1">৳{Math.round(salesData.summary.avgOrderValue).toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Revenue Timeline */}
            <div className="card">
              <h3 className="text-base font-semibold text-white mb-4">Revenue Over Time</h3>
              {revenueChart ? (
                <div className="h-64">
                  <Line data={revenueChart} options={{
                    ...chartBaseOptions,
                    plugins: {
                      ...chartBaseOptions.plugins,
                      tooltip: {
                        ...chartBaseOptions.plugins.tooltip,
                        callbacks: { 
                          label: (ctx) => `${ctx.dataset.label}: ৳${ctx.parsed.y.toLocaleString()}` 
                        },
                      },
                    },
                  }} />
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-dark-500 border border-dashed border-dark-700 rounded-xl">
                  <p className="text-sm">No revenue data for this period</p>
                </div>
              )}
            </div>

            {/* Top Products */}
            <div className="card">
              <h3 className="text-base font-semibold text-white mb-4">Top Products by Revenue</h3>
              {topProductsChart ? (
                <div className="h-64">
                  <Bar data={topProductsChart} options={{
                    ...chartBaseOptions,
                    plugins: {
                      ...chartBaseOptions.plugins,
                      tooltip: {
                        ...chartBaseOptions.plugins.tooltip,
                        callbacks: { label: (ctx) => `৳${ctx.parsed.y.toLocaleString()}` },
                      },
                    },
                  }} />
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-dark-500 border border-dashed border-dark-700 rounded-xl">
                  <p className="text-sm">No product data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Staff & Top Products Table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Staff Performance */}
            <div className="card">
              <h3 className="text-base font-semibold text-white mb-4">Sales by Staff</h3>
              {salesData?.salesByStaff?.length ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-700">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-dark-400 uppercase">Staff</th>
                      <th className="text-center py-2 px-3 text-xs font-semibold text-dark-400 uppercase">Orders</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-dark-400 uppercase">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700/50">
                    {salesData.salesByStaff.map((s, i) => (
                      <tr key={i} className="hover:bg-dark-800/50">
                        <td className="py-2.5 px-3 text-sm text-white">{s.name}</td>
                        <td className="py-2.5 px-3 text-center text-sm text-dark-400">{s.transactions}</td>
                        <td className="py-2.5 px-3 text-right text-sm font-medium text-emerald-400">৳{s.revenue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-dark-500 text-center py-8">No staff data</p>
              )}
            </div>

            {/* Top Products Table */}
            <div className="card">
              <h3 className="text-base font-semibold text-white mb-4">Top Products</h3>
              {salesData?.topProducts?.length ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-700">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-dark-400 uppercase">Product</th>
                      <th className="text-center py-2 px-3 text-xs font-semibold text-dark-400 uppercase">Sold</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-dark-400 uppercase">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700/50">
                    {salesData.topProducts.map((p, i) => (
                      <tr key={i} className="hover:bg-dark-800/50">
                        <td className="py-2.5 px-3 text-sm text-white">{p.name}</td>
                        <td className="py-2.5 px-3 text-center text-sm text-dark-400">{p.totalQty}</td>
                        <td className="py-2.5 px-3 text-right text-sm font-medium text-emerald-400">৳{p.totalRevenue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-dark-500 text-center py-8">No product data</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ==================== INVENTORY REPORT ==================== */
        <div>
          {/* Summary Cards */}
          {inventoryData?.summary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
              <div className="card border border-blue-500/20">
                <p className="text-sm text-dark-400">Total Products</p>
                <p className="text-2xl font-bold text-white mt-1">{inventoryData.summary.totalProducts}</p>
                <p className="text-xs text-dark-500 mt-0.5">{inventoryData.summary.inStock} in stock</p>
              </div>
              <div className="card border border-amber-500/20">
                <p className="text-sm text-dark-400">Low Stock</p>
                <p className="text-2xl font-bold text-amber-400 mt-1">{inventoryData.summary.lowStock}</p>
              </div>
              <div className="card border border-red-500/20">
                <p className="text-sm text-dark-400">Out of Stock</p>
                <p className="text-2xl font-bold text-red-400 mt-1">{inventoryData.summary.outOfStock}</p>
              </div>
              <div className="card border border-emerald-500/20">
                <p className="text-sm text-dark-400">Inventory Value</p>
                <p className="text-2xl font-bold text-white mt-1">৳{inventoryData.summary.totalValue.toLocaleString()}</p>
                <p className="text-xs text-dark-500 mt-0.5">Retail: ৳{inventoryData.summary.totalRetailValue.toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Category Distribution */}
            <div className="card">
              <h3 className="text-base font-semibold text-white mb-4">Products by Category</h3>
              {categoryChart ? (
                <div className="h-64 flex items-center justify-center">
                  <Doughnut
                    data={categoryChart}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'right',
                          labels: { color: '#94a3b8', padding: 16, font: { size: 12 } },
                        },
                      },
                      cutout: '65%',
                    }}
                  />
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-dark-500">
                  <p className="text-sm">No category data</p>
                </div>
              )}
            </div>

            {/* Category Value Table */}
            <div className="card">
              <h3 className="text-base font-semibold text-white mb-4">Category Breakdown</h3>
              {inventoryData?.categoryDistribution?.length ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-700">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-dark-400 uppercase">Category</th>
                      <th className="text-center py-2 px-3 text-xs font-semibold text-dark-400 uppercase">Products</th>
                      <th className="text-center py-2 px-3 text-xs font-semibold text-dark-400 uppercase">Total Qty</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-dark-400 uppercase">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700/50">
                    {inventoryData.categoryDistribution.map((c, i) => (
                      <tr key={i} className="hover:bg-dark-800/50">
                        <td className="py-2.5 px-3 text-sm text-white font-medium">{c.name}</td>
                        <td className="py-2.5 px-3 text-center text-sm text-dark-400">{c.count}</td>
                        <td className="py-2.5 px-3 text-center text-sm text-dark-400">{c.qty}</td>
                        <td className="py-2.5 px-3 text-right text-sm font-medium text-emerald-400">৳{c.value.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-dark-500 text-center py-8">No data</p>
              )}
            </div>
          </div>

          {/* Low Stock Alert */}
          {inventoryData?.lowStockItems?.length > 0 && (
            <div className="card border border-red-500/20">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <HiOutlineExclamation className="text-red-400" />
                Low Stock Items ({inventoryData.lowStockItems.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-700">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-dark-400 uppercase">Product</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-dark-400 uppercase">SKU</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-dark-400 uppercase">Category</th>
                      <th className="text-center py-2 px-3 text-xs font-semibold text-dark-400 uppercase">Stock</th>
                      <th className="text-center py-2 px-3 text-xs font-semibold text-dark-400 uppercase">Threshold</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700/50">
                    {inventoryData.lowStockItems.map((p, i) => (
                      <tr key={i} className="hover:bg-dark-800/50">
                        <td className="py-2.5 px-3 text-sm text-white font-medium">{p.name}</td>
                        <td className="py-2.5 px-3"><code className="text-xs text-dark-400">{p.sku}</code></td>
                        <td className="py-2.5 px-3 text-sm text-dark-400">{p.category}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`font-bold text-sm ${p.quantity === 0 ? 'text-red-400' : 'text-amber-400'}`}>{p.quantity}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-sm text-dark-500">{p.minStockThreshold}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
