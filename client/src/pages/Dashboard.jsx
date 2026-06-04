import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import dashboardService from '../services/dashboardService';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import {
  HiOutlineCube,
  HiOutlineChartBar,
  HiOutlineShoppingCart,
  HiOutlineExclamation,
  HiOutlineCash,
  HiOutlineTruck,
  HiOutlineCheck,
  HiOutlineClock,
  HiOutlineBan,
  HiOutlineInboxIn,
  HiOutlineUserCircle,
} from 'react-icons/hi';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Tooltip, Legend, Filler
);

// ==================== ADMIN / STAFF DASHBOARD ====================
const AdminDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartDays, setChartDays] = useState(7);

  useEffect(() => { fetchDashboard(); }, []);
  useEffect(() => { fetchChart(); }, [chartDays]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [statsRes, chartRes, activityRes] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getSalesChart(chartDays),
        dashboardService.getRecentActivity(),
      ]);
      setStats(statsRes.data);
      setChartData(chartRes.data);
      setActivities(activityRes.data);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChart = async () => {
    try {
      const res = await dashboardService.getSalesChart(chartDays);
      setChartData(res.data);
    } catch { /* silent */ }
  };

  const chartConfig = chartData
    ? {
      labels: chartData.map((d) => d.label),
      datasets: [{
        label: 'Revenue (৳)',
        data: chartData.map((d) => d.revenue),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.08)',
        tension: 0.4, fill: true,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2, pointRadius: 5, pointHoverRadius: 7,
      },
      {
        label: 'Profit (৳)',
        data: chartData.map((d) => d.profit),
        borderColor: '#10b981',
        backgroundColor: 'transparent',
        tension: 0.4, fill: false,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 6,
      }],
    }
    : null;

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderWidth: 1,
        titleColor: '#1f2937', bodyColor: '#6b7280', padding: 12, cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ৳${ctx.parsed.y.toLocaleString()}`
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#9ca3af', font: { size: 11 } }, border: { display: false } },
      y: {
        grid: { color: 'rgba(229,231,235,0.5)' },
        ticks: { color: '#9ca3af', font: { size: 11 }, callback: (v) => '৳' + v.toLocaleString() },
        border: { display: false }, beginAtZero: true,
      },
    },
  };

  const statCards = stats ? [
    { title: 'Total Products', value: stats.totalProducts, sub: `${stats.activeProducts} active`, icon: HiOutlineCube, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', link: '/products' },
    { title: 'Total Revenue', value: `৳${stats.totalRevenue.toLocaleString()}`, sub: `${stats.totalItemsSold} items sold`, icon: HiOutlineCash, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', link: '/reports' },
    { title: 'Total Profit', value: `৳${stats.totalProfit.toLocaleString()}`, sub: `${stats.totalSales} transactions`, icon: HiOutlineChartBar, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', link: '/reports' },
    { title: 'Low Stock', value: stats.lowStockCount, sub: stats.lowStockCount > 0 ? 'Needs attention' : 'All stocked', icon: HiOutlineExclamation, color: stats.lowStockCount > 0 ? 'text-red-600' : 'text-amber-600', bg: stats.lowStockCount > 0 ? 'bg-red-50' : 'bg-amber-50', border: stats.lowStockCount > 0 ? 'border-red-200' : 'border-amber-200', link: '/products?lowStock=true' },
  ] : [];

  if (loading) {
    return <div className="flex items-center justify-center py-24"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div></div>;
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statCards.map((stat, i) => (
          <div
            key={i}
            onClick={() => navigate(stat.link)}
            className={`card hover:border-gray-300 hover:scale-[1.02] transition-all duration-200 group cursor-pointer border ${stat.border}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
              </div>
              <div className={`w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`text-2xl ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <HiOutlineChartBar className="text-primary-600" /> Sales Overview
            </h3>
            <select value={chartDays} onChange={(e) => setChartDays(Number(e.target.value))} className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50">
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 3 months</option>
            </select>
          </div>
          {chartConfig && chartData?.some((d) => d.revenue > 0) ? (
            <div className="h-64"><Line data={chartConfig} options={chartOptions} /></div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400 border border-dashed border-gray-300 rounded-xl">
              <div className="text-center">
                <HiOutlineChartBar className="text-4xl mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No sales data for this period</p>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <HiOutlineClock className="text-primary-600" /> Recent Activity
          </h3>
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <HiOutlineClock className="text-3xl text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin">
              {activities.map((a) => {
                const typeStyles = {
                  sale: { bg: 'bg-emerald-50', color: 'text-emerald-600', Icon: HiOutlineCash },
                  delivery: { bg: 'bg-blue-50', color: 'text-blue-600', Icon: HiOutlineTruck },
                  user: { bg: 'bg-purple-50', color: 'text-purple-600', Icon: HiOutlineUserCircle },
                  adjustment: { bg: 'bg-amber-50', color: 'text-amber-600', Icon: HiOutlineExclamation },
                  product: { bg: 'bg-indigo-50', color: 'text-indigo-600', Icon: HiOutlineCube },
                };
                const style = typeStyles[a.type] || typeStyles.sale;
                return (
                  <div key={`${a.type}-${a._id}`} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className={`w-8 h-8 rounded-full ${style.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                      <style.Icon className={`text-sm ${style.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">{a.description}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {a.detail && <span className="text-xs text-primary-600">{a.detail}</span>}
                        {a.amount && (
                          <>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-emerald-600 font-medium">৳{a.amount?.toLocaleString()}</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {a.user} • {new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {stats?.lowStockProducts?.length > 0 && (
        <div className="card mt-6 border border-red-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <HiOutlineExclamation className="text-red-500" /> Low Stock Alerts
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Product</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">SKU</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Stock</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Threshold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.lowStockProducts.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="py-2.5 px-3 text-sm text-gray-900 font-medium">{p.name}</td>
                    <td className="py-2.5 px-3"><code className="text-xs text-gray-500">{p.sku}</code></td>
                    <td className="py-2.5 px-3 text-sm text-gray-500">{p.category?.name}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-sm font-bold ${p.quantity === 0 ? 'text-red-500' : 'text-amber-500'}`}>{p.quantity}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-sm text-gray-400">{p.minStockThreshold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};

// ==================== SUPPLIER DASHBOARD ====================
const statusConfig = {
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: HiOutlineClock },
  accepted: { label: 'Accepted', className: 'bg-blue-50 text-blue-700 border-blue-200', icon: HiOutlineCheck },
  shipped: { label: 'Shipped', className: 'bg-purple-50 text-purple-700 border-purple-200', icon: HiOutlineTruck },
  delivered: { label: 'Delivered', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: HiOutlineCheck },
  rejected: { label: 'Rejected', className: 'bg-red-50 text-red-700 border-red-200', icon: HiOutlineBan },
};

const SupplierDashboard = ({ user }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getSupplierStats();
      setData(res.data);
    } catch (error) {
      console.error('Supplier dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-24"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div></div>;
  }

  const statCards = data ? [
    { title: 'Total Requests', value: data.totalRequests, icon: HiOutlineInboxIn, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { title: 'Pending', value: data.pending, icon: HiOutlineClock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    { title: 'Accepted / Shipped', value: data.accepted + data.shipped, icon: HiOutlineTruck, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    { title: 'Delivered', value: data.delivered, icon: HiOutlineCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  ] : [];

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statCards.map((stat, i) => (
          <div key={i} className={`card hover:border-gray-300 transition-all duration-200 group cursor-default border ${stat.border}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`text-2xl ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Requests */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <HiOutlineInboxIn className="text-primary-600" /> Recent Restock Requests
        </h3>
        {data?.recentRequests?.length === 0 ? (
          <div className="text-center py-12">
            <HiOutlineInboxIn className="text-5xl text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-600">No requests yet</h3>
            <p className="text-gray-400 mt-1">Restock requests from the admin will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Product</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Qty</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Requested By</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.recentRequests.map((r) => {
                  const badge = statusConfig[r.status] || statusConfig.pending;
                  return (
                    <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center shrink-0">
                            <HiOutlineCube className="text-primary-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{r.product?.name}</p>
                            <code className="text-xs text-gray-400">{r.product?.sku}</code>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="bg-gray-100 px-2.5 py-1 rounded-lg text-sm font-medium text-gray-900">{r.quantity}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${badge.className}`}>
                          <badge.icon className="text-sm" />
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 text-sm">{r.requestedBy?.name}</td>
                      <td className="py-3.5 px-4 text-gray-500 text-sm">
                        {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

// ==================== STAFF DASHBOARD ====================
const StaffDashboard = ({ user }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getStaffStats();
      setData(res.data);
    } catch (error) {
      console.error('Staff dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-24"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div></div>;
  }

  const statCards = data ? [
    { title: "Today's Sales", value: data.todaySales, sub: `৳${data.todayRevenue.toLocaleString()} today`, icon: HiOutlineChartBar, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { title: 'Total Sales', value: data.totalSales, sub: `${data.totalItemsSold} items sold`, icon: HiOutlineShoppingCart, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    { title: 'My Revenue', value: `৳${data.totalRevenue.toLocaleString()}`, sub: 'All time', icon: HiOutlineCash, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { title: 'Low Stock', value: data.lowStockCount, sub: `${data.totalProducts} products`, icon: HiOutlineExclamation, color: data.lowStockCount > 0 ? 'text-red-600' : 'text-amber-600', bg: data.lowStockCount > 0 ? 'bg-red-50' : 'bg-amber-50', border: data.lowStockCount > 0 ? 'border-red-200' : 'border-amber-200' },
  ] : [];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statCards.map((stat, i) => (
          <div key={i} className={`card hover:border-gray-300 transition-all duration-200 group cursor-default border ${stat.border}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
              </div>
              <div className={`w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`text-2xl ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <HiOutlineCash className="text-primary-600" /> My Recent Sales
        </h3>
        {data?.recentSales?.length === 0 ? (
          <div className="text-center py-12">
            <HiOutlineShoppingCart className="text-5xl text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-600">No sales yet</h3>
            <p className="text-gray-400 mt-1">Your sales transactions will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Invoice</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Items</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.recentSales.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4"><code className="text-sm text-primary-600">{s.invoiceNo}</code></td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {s.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')}
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-medium text-emerald-600">৳{s.totalAmount?.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

// ==================== MAIN DASHBOARD ====================
const Dashboard = () => {
  const { user } = useAuth();

  const subtitle = {
    admin: "Here's an overview of your inventory system.",
    staff: 'Your sales performance at a glance.',
    supplier: 'Manage your incoming restock requests.',
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0] || 'User'} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          {subtitle[user?.role] || subtitle.admin}
        </p>
      </div>

      {user?.role === 'supplier' ? (
        <SupplierDashboard user={user} />
      ) : user?.role === 'staff' ? (
        <StaffDashboard user={user} />
      ) : (
        <AdminDashboard user={user} />
      )}
    </div>
  );
};

export default Dashboard;

