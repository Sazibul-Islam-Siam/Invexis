import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineViewGrid,
  HiOutlineCube,
  HiOutlineTag,
  HiOutlineShoppingCart,
  HiOutlineTruck,
  HiOutlineClipboardList,
  HiOutlineChartBar,
  HiOutlineUsers,
  HiOutlineLogout,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineInboxIn,
  HiOutlineDocumentReport,
  HiOutlineShieldCheck,
} from 'react-icons/hi';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { user, logout, getActiveCompanyInfo } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Navigation items based on user role
  const getNavItems = () => {
    const commonItems = [
      {
        label: 'Dashboard',
        icon: HiOutlineViewGrid,
        path: '/dashboard',
      },
    ];

    const adminItems = [
      ...commonItems,
      {
        label: 'Products',
        icon: HiOutlineCube,
        path: '/products',
      },
      {
        label: 'Categories',
        icon: HiOutlineTag,
        path: '/categories',
      },
      {
        label: 'Sales',
        icon: HiOutlineShoppingCart,
        path: '/sales',
      },
      {
        label: 'Restock Requests',
        icon: HiOutlineTruck,
        path: '/restock-requests',
      },
      {
        label: 'Stock Adjustments',
        icon: HiOutlineClipboardList,
        path: '/stock-adjustments',
      },
      {
        label: 'Reports',
        icon: HiOutlineChartBar,
        path: '/reports',
      },
      {
        label: 'Users',
        icon: HiOutlineUsers,
        path: '/users',
      },
      {
        label: 'Audit Logs',
        icon: HiOutlineDocumentReport,
        path: '/audit-logs',
      },
    ];

    const supplierItems = [
      ...commonItems,
      {
        label: 'Restock Requests',
        icon: HiOutlineInboxIn,
        path: '/restock-requests',
      },
      {
        label: 'My Reports',
        icon: HiOutlineDocumentReport,
        path: '/reports',
      },
    ];

    const staffItems = [
      ...commonItems,
      {
        label: 'Products',
        icon: HiOutlineCube,
        path: '/products',
      },
      {
        label: 'Sales',
        icon: HiOutlineShoppingCart,
        path: '/sales',
      },
      {
        label: 'Restock Requests',
        icon: HiOutlineTruck,
        path: '/restock-requests',
      },
      {
        label: 'Stock Updates',
        icon: HiOutlineClipboardList,
        path: '/stock-adjustments',
      },
      {
        label: 'My Reports',
        icon: HiOutlineDocumentReport,
        path: '/reports',
      },
    ];

    const superAdminItems = [
      {
        label: 'Platform Manager',
        icon: HiOutlineShieldCheck,
        path: '/super-admin',
      },
    ];

    switch (user?.role) {
      case 'admin':
        return adminItems;
      case 'supplier':
        return supplierItems;
      case 'staff':
        return staffItems;
      case 'super_admin':
        return superAdminItems;
      default:
        return commonItems;
    }
  };

  const navItems = getNavItems();

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 z-40 flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? 'w-[72px]' : 'w-64'
        }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center shrink-0 border border-primary-200">
            <svg
              className="w-5 h-5 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          {!isCollapsed && (
            <div className="whitespace-nowrap overflow-hidden">
              <span className="text-lg font-bold text-gray-900 block leading-tight">Invexis</span>
              {(user?.company?.name || getActiveCompanyInfo()?.name) && (
                <span className="text-[11px] text-gray-500 block truncate">{user?.company?.name || getActiveCompanyInfo()?.name}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive
                    ? 'bg-primary-50 text-primary-600 border border-primary-200'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-transparent'
                  }`
                }
                title={isCollapsed ? item.label : ''}
              >
                <item.icon className="text-xl shrink-0" />
                {!isCollapsed && (
                  <span className="whitespace-nowrap">{item.label}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom section — User info + Collapse button */}
      <div className="border-t border-gray-200 p-3 shrink-0">
        {/* User info */}
        <NavLink
          to="/profile"
          className={`flex items-center gap-3 px-2 py-2 mb-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer ${isCollapsed ? 'justify-center' : ''
            }`}
          title="My Profile"
        >
          {user?.profilePicture ? (
            <img
              src={user.profilePicture.startsWith('http') ? user.profilePicture : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${user.profilePicture}`}
              alt={user?.name}
              className="w-9 h-9 rounded-full object-cover border-2 border-gray-200 shrink-0"
            />
          ) : (
            <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500">{{ admin: 'Admin', supplier: 'Supplier', staff: 'Staff', super_admin: 'Super Admin' }[user?.role] || user?.role}</p>
            </div>
          )}
        </NavLink>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 ${isCollapsed ? 'justify-center' : ''
            }`}
          title="Logout"
        >
          <HiOutlineLogout className="text-xl shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 mt-1 ${isCollapsed ? 'justify-center' : ''
            }`}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <HiOutlineChevronRight className="text-xl shrink-0" />
          ) : (
            <>
              <HiOutlineChevronLeft className="text-xl shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
