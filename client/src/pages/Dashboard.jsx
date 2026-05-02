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
          borderColor: '#818cf8',
          backgroundColor: 'rgba(129, 140, 248, 0.1)',
          tension: 0.4, fill: true,
          pointBackgroundColor: '#818cf8',
          pointBorderColor: '#1e1b4b',
          pointBorderWidth: 2, pointRadius: 5, pointHoverRadius: 7,
        }],
      }
    : null;

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1,
        titleColor: '#f8fafc', bodyColor: '#cbd5e1', padding: 12, cornerRadius: 8,
        displayColors: false,
        callbacks: { label: (ctx) => `Revenue: ৳${ctx.parsed.y.toLocaleString()}` },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 11 } }, border: { display: false } },
      y: {
        grid: { color: 'rgba(51,65,85,0.3)' },
        ticks: { color: '#64748b', font: { size: 11 }, callback: (v) => '৳' + v.toLocaleString() },
        border: { display: false }, beginAtZero: true,
      },
    },
  };

  const statCards = stats ? [
    { title: 'Total Products', value: stats.totalProducts, sub: `${stats.activeProducts} active`, icon: HiOutlineCube, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-500/20', link: '/products' },
    { title: 'Total Revenue', value: `৳${stats.totalRevenue.toLocaleString()}`, sub: `${stats.totalItemsSold} items sold`, icon: HiOutlineCash, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-500/20', link: '/reports' },
    { title: 'Total Sales', value: stats.totalSales, sub: `${stats.totalCategories} categories`, icon: HiOutlineShoppingCart, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-500/20', link: '/sales' },
    { title: 'Low Stock', value: stats.lowStockCount, sub: stats.lowStockCount > 0 ? 'Needs attention' : 'All stocked', icon: HiOutlineExclamation, color: stats.lowStockCount > 0 ? 'text-red-400' : 'text-amber-400', bg: stats.lowStockCount > 0 ? 'bg-red-400/10' : 'bg-amber-400/10', border: stats.lowStockCount > 0 ? 'border-red-500/20' : 'border-amber-500/20', link: '/products?lowStock=true' },
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
            className={`card hover:border-dark-600 hover:scale-[1.02] transition-all duration-200 group cursor-pointer border ${stat.border}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-400 font-medium">{stat.title}</p>
                <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                <p className="text-xs text-dark-500 mt-1">{stat.sub}</p>
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
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <HiOutlineChartBar className="text-primary-400" /> Sales Overview
            </h3>
            <select value={chartDays} onChange={(e) => setChartDays(Number(e.target.value))} className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-1.5 text-sm text-dark-300 focus:outline-none focus:ring-2 focus:ring-primary-500/50">
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 3 months</option>
            </select>
          </div>
          {chartConfig && chartData?.some((d) => d.revenue > 0) ? (
            <div className="h-64"><Line data={chartConfig} options={chartOptions} /></div>
          ) : (
            <div className="h-64 flex items-center justify-center text-dark-500 border border-dashed border-dark-700 rounded-xl">
              <div className="text-center">
                <HiOutlineChartBar className="text-4xl mx-auto mb-2 text-dark-600" />
                <p className="text-sm">No sales data for this period</p>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <HiOutlineClock className="text-primary-400" /> Recent Activity
          </h3>
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <HiOutlineClock className="text-3xl text-dark-600 mx-auto mb-2" />
              <p className="text-sm text-dark-500">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin">
              {activities.map((a) => {
                const typeStyles = {
                  sale: { bg: 'bg-emerald-500/15', color: 'text-emerald-400', Icon: HiOutlineCash },
                  delivery: { bg: 'bg-blue-500/15', color: 'text-blue-400', Icon: HiOutlineTruck },
                  user: { bg: 'bg-purple-500/15', color: 'text-purple-400', Icon: HiOutlineUserCircle },
                  adjustment: { bg: 'bg-amber-500/15', color: 'text-amber-400', Icon: HiOutlineExclamation },
                  product: { bg: 'bg-indigo-500/15', color: 'text-indigo-400', Icon: HiOutlineCube },
                };
                const style = typeStyles[a.type] || typeStyles.sale;
                return (
                  <div key={`${a.type}-${a._id}`} className="flex items-start gap-3 p-3 rounded-lg bg-dark-800/50 border border-dark-700/50 hover:border-dark-600 transition-colors">
                    <div className={`w-8 h-8 rounded-full ${style.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                      <style.Icon className={`text-sm ${style.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{a.description}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {a.detail && <span className="text-xs text-primary-400">{a.detail}</span>}
                        {a.amount && (
                          <>
                            <span className="text-xs text-dark-500">•</span>
                            <span className="text-xs text-emerald-400 font-medium">৳{a.amount?.toLocaleString()}</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-dark-500 mt-0.5">
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
        <div className="card mt-6 border border-red-500/20">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <HiOutlineExclamation className="text-red-400" /> Low Stock Alerts
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
                {stats.lowStockProducts.map((p) => (
                  <tr key={p._id} className="hover:bg-dark-800/50">
                    <td className="py-2.5 px-3 text-sm text-white font-medium">{p.name}</td>
                    <td className="py-2.5 px-3"><code className="text-xs text-dark-400">{p.sku}</code></td>
                    <td className="py-2.5 px-3 text-sm text-dark-400">{p.category?.name}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-sm font-bold ${p.quantity === 0 ? 'text-red-400' : 'text-amber-400'}`}>{p.quantity}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-sm text-dark-500">{p.minStockThreshold}</td>
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
  pending: { label: 'Pending', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30', icon: HiOutlineClock },
  accepted: { label: 'Accepted', className: 'bg-blue-500/15 text-blue-400 border-blue-500/30', icon: HiOutlineCheck },
  shipped: { label: 'Shipped', className: 'bg-purple-500/15 text-purple-400 border-purple-500/30', icon: HiOutlineTruck },
  delivered: { label: 'Delivered', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: HiOutlineCheck },
  rejected: { label: 'Rejected', className: 'bg-red-500/15 text-red-400 border-red-500/30', icon: HiOutlineBan },
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
    { title: 'Total Requests', value: data.totalRequests, icon: HiOutlineInboxIn, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-500/20' },
    { title: 'Pending', value: data.pending, icon: HiOutlineClock, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-500/20' },
    { title: 'Accepted / Shipped', value: data.accepted + data.shipped, icon: HiOutlineTruck, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-500/20' },
    { title: 'Delivered', value: data.delivered, icon: HiOutlineCheck, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-500/20' },
  ] : [];

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statCards.map((stat, i) => (
          <div key={i} className={`card hover:border-dark-600 transition-all duration-200 group cursor-default border ${stat.border}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-400 font-medium">{stat.title}</p>
                <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
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
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <HiOutlineInboxIn className="text-primary-400" /> Recent Restock Requests
        </h3>
        {data?.recentRequests?.length === 0 ? (
          <div className="text-center py-12">
            <HiOutlineInboxIn className="text-5xl text-dark-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-dark-300">No requests yet</h3>
            <p className="text-dark-500 mt-1">Restock requests from the admin will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Product</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Qty</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Requested By</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/50">
                {data.recentRequests.map((r) => {
                  const badge = statusConfig[r.status] || statusConfig.pending;
                  return (
                    <tr key={r._id} className="hover:bg-dark-800/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-primary-600/15 rounded-lg flex items-center justify-center shrink-0">
                            <HiOutlineCube className="text-primary-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{r.product?.name}</p>
                            <code className="text-xs text-dark-500">{r.product?.sku}</code>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="bg-dark-700 px-2.5 py-1 rounded-lg text-sm font-medium text-white">{r.quantity}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${badge.className}`}>
                          <badge.icon className="text-sm" />
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-dark-400 text-sm">{r.requestedBy?.name}</td>
                      <td className="py-3.5 px-4 text-dark-400 text-sm">
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
    { title: "Today's Sales", value: data.todaySales, sub: `৳${data.todayRevenue.toLocaleString()} today`, icon: HiOutlineChartBar, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-500/20' },
    { title: 'Total Sales', value: data.totalSales, sub: `${data.totalItemsSold} items sold`, icon: HiOutlineShoppingCart, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-500/20' },
    { title: 'My Revenue', value: `৳${data.totalRevenue.toLocaleString()}`, sub: 'All time', icon: HiOutlineCash, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-500/20' },
    { title: 'Low Stock', value: data.lowStockCount, sub: `${data.totalProducts} products`, icon: HiOutlineExclamation, color: data.lowStockCount > 0 ? 'text-red-400' : 'text-amber-400', bg: data.lowStockCount > 0 ? 'bg-red-400/10' : 'bg-amber-400/10', border: data.lowStockCount > 0 ? 'border-red-500/20' : 'border-amber-500/20' },
  ] : [];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statCards.map((stat, i) => (
          <div key={i} className={`card hover:border-dark-600 transition-all duration-200 group cursor-default border ${stat.border}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-400 font-medium">{stat.title}</p>
                <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                <p className="text-xs text-dark-500 mt-1">{stat.sub}</p>
              </div>
              <div className={`w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`text-2xl ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <HiOutlineCash className="text-primary-400" /> My Recent Sales
        </h3>
        {data?.recentSales?.length === 0 ? (
          <div className="text-center py-12">
            <HiOutlineShoppingCart className="text-5xl text-dark-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-dark-300">No sales yet</h3>
            <p className="text-dark-500 mt-1">Your sales transactions will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Invoice</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Items</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Amount</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/50">
                {data.recentSales.map((s) => (
                  <tr key={s._id} className="hover:bg-dark-800/50 transition-colors">
                    <td className="py-3 px-4"><code className="text-sm text-primary-400">{s.invoiceNo}</code></td>
                    <td className="py-3 px-4 text-sm text-dark-300">
                      {s.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')}
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-medium text-emerald-400">৳{s.totalAmount?.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-dark-400">
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
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {user?.name?.split(' ')[0] || 'User'} 👋
        </h1>
        <p className="text-dark-400 mt-1">
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

