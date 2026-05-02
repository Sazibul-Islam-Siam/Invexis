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
} from 'react-icons/hi';

const TopBar = ({ isCollapsed, isMobile, mobileOpen, setMobileOpen }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const notifRef = useRef(null);
  const searchRef = useRef(null);

  const getAuthConfig = () => ({
    headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('user'))?.token}` },
  });

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchNotifications = async () => {
    try {
      if (user?.role !== 'admin' && user?.role !== 'staff') return;
      const res = await axios.get('/api/dashboard/stats', getAuthConfig());
      const data = res.data.data;
      const notifs = [];

      if (data.lowStockCount > 0) {
        notifs.push({
          id: 'low-stock',
          type: 'warning',
          title: 'Low Stock Alert',
          message: `${data.lowStockCount} product${data.lowStockCount > 1 ? 's' : ''} below threshold`,
          icon: HiOutlineExclamation,
          color: 'text-amber-400',
          bg: 'bg-amber-500/15',
          action: () => navigate('/reports'),
        });
      }

      // Check pending restocks (admin only)
      if (user?.role === 'admin') {
        try {
          const restockRes = await axios.get('/api/restock-requests?status=pending&limit=1', getAuthConfig());
          if (restockRes.data.total > 0) {
            notifs.push({
              id: 'pending-restock',
              type: 'info',
              title: 'Pending Restocks',
              message: `${restockRes.data.total} restock request${restockRes.data.total > 1 ? 's' : ''} pending`,
              icon: HiOutlineClock,
              color: 'text-blue-400',
              bg: 'bg-blue-500/15',
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
              color: 'text-emerald-400',
              bg: 'bg-emerald-500/15',
              action: () => navigate('/restock-requests'),
            });
          }
        } catch { /* silent */ }
      }

      setNotifications(notifs);
    } catch { /* silent */ }
  };

  const handleSearch = async (query) => {
    setSearch(query);
    if (query.length < 2) {
      setSearchResults([]);
      setShowSearch(false);
      return;
    }
    try {
      const res = await axios.get(`/api/products?search=${query}&limit=5`, getAuthConfig());
      setSearchResults(res.data.data || []);
      setShowSearch(true);
    } catch {
      setSearchResults([]);
    }
  };

  const getRoleLabel = (role) => ({ admin: 'Admin', supplier: 'Supplier', staff: 'Staff' }[role] || role);
  const getRoleBadgeColor = (role) => ({
    admin: 'bg-primary-600/20 text-primary-300 border-primary-500/30',
    supplier: 'bg-amber-600/20 text-amber-300 border-amber-500/30',
    staff: 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30',
  }[role] || '');

  return (
    <header className="h-16 bg-dark-900/80 backdrop-blur-md border-b border-dark-700 sticky top-0 z-30 flex items-center px-4 md:px-6">
      {/* Mobile Hamburger */}
      {isMobile && (
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 mr-3 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-all"
        >
          {mobileOpen ? <HiOutlineX className="text-xl" /> : <HiOutlineMenuAlt2 className="text-xl" />}
        </button>
      )}

      {/* Search Bar */}
      <div className="relative max-w-md w-full" ref={searchRef}>
        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 text-lg" />
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => search.length >= 2 && setShowSearch(true)}
          className="w-full bg-dark-800 border border-dark-700 rounded-lg pl-10 pr-4 py-2 text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-200"
        />
        {showSearch && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-dark-800 border border-dark-600 rounded-xl shadow-2xl overflow-hidden z-50">
            {searchResults.map((p) => (
              <button
                key={p._id}
                onClick={() => {
                  navigate('/products');
                  setShowSearch(false);
                  setSearch('');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-700/50 transition-colors text-left"
              >
                <div className="w-8 h-8 bg-primary-600/15 rounded-lg flex items-center justify-center shrink-0">
                  <HiOutlineCube className="text-primary-400 text-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{p.name}</p>
                  <p className="text-xs text-dark-500">{p.sku} • Stock: {p.quantity}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 md:gap-4 ml-auto">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="relative p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-all duration-200"
          >
            <HiOutlineBell className="text-xl" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full ring-2 ring-dark-900 text-[10px] text-white flex items-center justify-center font-bold">
                {notifications.length}
              </span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-dark-800 border border-dark-600 rounded-xl shadow-2xl z-50">
              <div className="px-4 py-3 border-b border-dark-700">
                <p className="text-sm font-semibold text-white">Notifications</p>
              </div>
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <HiOutlineBell className="text-2xl text-dark-600 mx-auto mb-2" />
                  <p className="text-sm text-dark-500">All clear!</p>
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
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-dark-700/50 transition-colors text-left"
                    >
                      <div className={`w-8 h-8 ${n.bg} rounded-full flex items-center justify-center shrink-0 mt-0.5`}>
                        <n.icon className={`text-sm ${n.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{n.title}</p>
                        <p className="text-xs text-dark-400 mt-0.5">{n.message}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-dark-700"></div>

        {/* User info — clickable to profile */}
        <div
          onClick={() => navigate('/profile')}
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          title="Go to Profile"
        >
          <div className="text-right">
            <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${getRoleBadgeColor(user?.role)}`}>
              {getRoleLabel(user?.role)}
            </span>
          </div>
          {user?.profilePicture ? (
            <img
              src={user.profilePicture.startsWith('http') ? user.profilePicture : `http://localhost:5000${user.profilePicture}`}
              alt={user?.name}
              className="w-9 h-9 rounded-full object-cover border-2 border-dark-600"
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
