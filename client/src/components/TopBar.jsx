import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  HiOutlineBell,
  HiOutlineSearch,
  HiOutlineExclamation,
  HiOutlineClock,
  HiOutlineCube,
  HiOutlineMenuAlt2,
  HiOutlineX,
  HiOutlineInboxIn,
  HiOutlineTruck,
  HiOutlineOfficeBuilding,
} from 'react-icons/hi';
import CompanySwitcher from './CompanySwitcher';

const TopBar = ({ isCollapsed, isMobile, mobileOpen, setMobileOpen }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef(null);

  const getAuthConfig = () => ({
    headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('user'))?.firebaseToken}` },
  });

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // refresh every minute
    window.addEventListener('refresh-notifications', fetchNotifications);
    return () => {
      clearInterval(interval);
      window.removeEventListener('refresh-notifications', fetchNotifications);
    };
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchNotifications = async () => {
    try {
      if (!user) return;
      // Super admin has no company — skip all company-scoped notifications
      if (user?.role === 'super_admin') { setNotifications([]); return; }
      const notifs = [];

      if (user?.role === 'admin' || user?.role === 'staff') {
        try {
          const res = await axios.get('/api/dashboard/stats', getAuthConfig());
          const data = res.data.data;
          if (data.lowStockCount > 0) {
            notifs.push({
              id: 'low-stock',
              type: 'warning',
              title: 'Low Stock Alert',
              message: `${data.lowStockCount} product${data.lowStockCount > 1 ? 's' : ''} below threshold`,
              icon: HiOutlineExclamation,
              color: 'text-amber-600',
              bg: 'bg-amber-50',
              action: () => navigate('/products?lowStock=true'),
            });
          }
        } catch { /* silent */ }
      }

      // Check staff restock requests awaiting admin approval
      if (user?.role === 'admin') {
        try {
          const staffReqRes = await axios.get('/api/restock-requests?status=pending_admin&limit=1', getAuthConfig());
          if (staffReqRes.data.total > 0) {
            notifs.push({
              id: 'staff-restock',
              type: 'info',
              title: 'Staff Restock Requests',
              message: `${staffReqRes.data.total} request${staffReqRes.data.total > 1 ? 's' : ''} from staff awaiting your approval`,
              icon: HiOutlineClock,
              color: 'text-orange-600',
              bg: 'bg-orange-50',
              action: () => navigate('/restock-requests'),
            });
          }
        } catch { /* silent */ }

        // Check pending restocks (sent to supplier)
        try {
          const restockRes = await axios.get('/api/restock-requests?status=pending&limit=1', getAuthConfig());
          if (restockRes.data.total > 0) {
            notifs.push({
              id: 'pending-restock',
              type: 'info',
              title: 'Pending Restocks',
              message: `${restockRes.data.total} restock request${restockRes.data.total > 1 ? 's' : ''} pending`,
              icon: HiOutlineClock,
              color: 'text-blue-600',
              bg: 'bg-blue-50',
              action: () => navigate('/restock-requests'),
            });
          }
        } catch { /* silent */ }

        // Check shipped restocks awaiting admin receipt confirmation
        try {
          const shippedRes = await axios.get('/api/restock-requests?status=shipped&limit=1', getAuthConfig());
          if (shippedRes.data.total > 0) {
            notifs.push({
              id: 'shipped-restock',
              type: 'warning',
              title: 'Shipments Arrived',
              message: `${shippedRes.data.total} shipment${shippedRes.data.total > 1 ? 's' : ''} awaiting your receipt confirmation`,
              icon: HiOutlineInboxIn,
              color: 'text-emerald-600',
              bg: 'bg-emerald-50',
              action: () => navigate('/restock-requests'),
            });
          }
        } catch { /* silent */ }
      }

      // Cross-company alerts for suppliers (checks ALL linked companies)
      if (user?.role === 'supplier') {
        try {
          const alertsRes = await axios.get('/api/restock-requests/cross-company-alerts', getAuthConfig());
          const alerts = alertsRes.data.data || [];
          alerts.forEach((alert) => {
            if (alert.pendingCount > 0) {
              notifs.push({
                id: `pending-${alert.company._id}`,
                type: 'info',
                title: alert.company.name,
                message: `${alert.pendingCount} new request${alert.pendingCount > 1 ? 's' : ''} awaiting your review`,
                icon: HiOutlineOfficeBuilding,
                color: 'text-blue-600',
                bg: 'bg-blue-50',
                action: () => {
                  localStorage.setItem('activeCompany', alert.company._id);
                  navigate('/restock-requests');
                  window.location.reload();
                },
              });
            }
            if (alert.acceptedCount > 0) {
              notifs.push({
                id: `accepted-${alert.company._id}`,
                type: 'warning',
                title: alert.company.name,
                message: `${alert.acceptedCount} accepted request${alert.acceptedCount > 1 ? 's' : ''} ready to ship`,
                icon: HiOutlineTruck,
                color: 'text-amber-600',
                bg: 'bg-amber-50',
                action: () => {
                  localStorage.setItem('activeCompany', alert.company._id);
                  navigate('/restock-requests');
                  window.location.reload();
                },
              });
            }
          });
        } catch { /* silent */ }
      }

      setNotifications(notifs);
    } catch { /* silent */ }
  };


  const getRoleLabel = (role) => ({ admin: 'Admin', supplier: 'Supplier', staff: 'Staff', super_admin: 'Super Admin' }[role] || role);
  const getRoleBadgeColor = (role) => ({
    admin: 'bg-primary-50 text-primary-700 border-primary-200',
    supplier: 'bg-amber-50 text-amber-700 border-amber-200',
    staff: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    super_admin: 'bg-violet-50 text-violet-700 border-violet-200',
  }[role] || '');

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-30 flex items-center px-4 md:px-6">
      {/* Mobile Hamburger */}
      {isMobile && (
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 mr-3 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
        >
          {mobileOpen ? <HiOutlineX className="text-xl" /> : <HiOutlineMenuAlt2 className="text-xl" />}
        </button>
      )}


      {/* Right side */}
      <div className="flex items-center gap-2 md:gap-4 ml-auto">
        {/* Company Switcher (suppliers with multiple companies) */}
        <CompanySwitcher />
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            <HiOutlineBell className="text-xl" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full ring-2 ring-white text-[10px] text-white flex items-center justify-center font-bold">
                {notifications.length}
              </span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50">
              <div className="px-4 py-3 border-b border-gray-200">
                <p className="text-sm font-semibold text-gray-900">Notifications</p>
              </div>
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <HiOutlineBell className="text-2xl text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">All clear!</p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        n.action();
                        setShowNotif(false);
                      }}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className={`w-8 h-8 ${n.bg} rounded-full flex items-center justify-center shrink-0 mt-0.5`}>
                        <n.icon className={`text-sm ${n.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{n.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-gray-200"></div>

        {/* User info — clickable to profile */}
        <div
          onClick={() => navigate('/profile')}
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          title="Go to Profile"
        >
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${getRoleBadgeColor(user?.role)}`}>
              {getRoleLabel(user?.role)}
            </span>
          </div>
          {user?.profilePicture ? (
            <img
              src={user.profilePicture.startsWith('http') ? user.profilePicture : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${user.profilePicture}`}
              alt={user?.name}
              className="w-9 h-9 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
