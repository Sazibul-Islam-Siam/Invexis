import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import auditService from '../services/auditService';
import {
  HiOutlineClipboardList,
  HiOutlineCube,
  HiOutlineShoppingCart,
  HiOutlineTruck,
  HiOutlineExclamation,
  HiOutlineUserCircle,
  HiOutlineKey,
  HiOutlineSearch,
  HiOutlineCalendar,
  HiOutlineFilter,
} from 'react-icons/hi';

const actionConfig = {
  CREATE: { label: 'Created', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  UPDATE: { label: 'Updated', className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  DELETE: { label: 'Deleted', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
  STATUS_CHANGE: { label: 'Status Change', className: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  LOGIN: { label: 'Login', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
};

const entityIcons = {
  Product: HiOutlineCube,
  Sale: HiOutlineShoppingCart,
  RestockRequest: HiOutlineTruck,
  StockAdjustment: HiOutlineExclamation,
  User: HiOutlineUserCircle,
  Category: HiOutlineCube,
  Auth: HiOutlineKey,
};

const entityColors = {
  Product: 'text-indigo-400 bg-indigo-500/15',
  Sale: 'text-emerald-400 bg-emerald-500/15',
  RestockRequest: 'text-blue-400 bg-blue-500/15',
  StockAdjustment: 'text-amber-400 bg-amber-500/15',
  User: 'text-purple-400 bg-purple-500/15',
  Category: 'text-pink-400 bg-pink-500/15',
  Auth: 'text-amber-400 bg-amber-500/15',
};

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({
    action: '',
    entity: '',
    search: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, filters.action, filters.entity, filters.startDate, filters.endDate]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = { page: pagination.page, limit: 20 };
      if (filters.action) params.action = filters.action;
      if (filters.entity) params.entity = filters.entity;
      if (filters.search) params.search = filters.search;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const res = await auditService.getAuditLogs(params);
      setLogs(res.data);
      setPagination((p) => ({ ...p, pages: res.pages, total: res.total }));
    } catch {
      toast.error('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((p) => ({ ...p, page: 1 }));
    fetchLogs();
  };

  const clearFilters = () => {
    setFilters({ action: '', entity: '', search: '', startDate: '', endDate: '' });
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const hasFilters = filters.action || filters.entity || filters.search || filters.startDate || filters.endDate;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <HiOutlineClipboardList className="text-primary-400" />
          Audit Logs
        </h1>
        <p className="text-dark-400 mt-1">Track all system activity and changes</p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2">
            <HiOutlineFilter className="text-dark-400 text-lg shrink-0" />
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px]">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input
              type="text"
              placeholder="Search details..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="input-field pl-9 text-sm"
            />
          </form>

          {/* Action */}
          <select
            value={filters.action}
            onChange={(e) => {
              setFilters({ ...filters, action: e.target.value });
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="input-field w-auto text-sm"
          >
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="STATUS_CHANGE">Status Change</option>
            <option value="LOGIN">Login</option>
          </select>

          {/* Entity */}
          <select
            value={filters.entity}
            onChange={(e) => {
              setFilters({ ...filters, entity: e.target.value });
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="input-field w-auto text-sm"
          >
            <option value="">All Entities</option>
            <option value="Product">Product</option>
            <option value="Sale">Sale</option>
            <option value="RestockRequest">Restock</option>
            <option value="StockAdjustment">Adjustment</option>
            <option value="User">User</option>
            <option value="Auth">Auth</option>
          </select>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <HiOutlineCalendar className="text-dark-400 shrink-0" />
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => {
                setFilters({ ...filters, startDate: e.target.value });
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="input-field w-auto text-sm"
            />
            <span className="text-dark-500 text-sm">to</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => {
                setFilters({ ...filters, endDate: e.target.value });
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="input-field w-auto text-sm"
            />
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-primary-400 hover:text-primary-300 whitespace-nowrap"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-dark-400">
          {pagination.total} log{pagination.total !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Logs Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16">
            <HiOutlineClipboardList className="text-5xl text-dark-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-dark-300">No audit logs</h3>
            <p className="text-dark-500 mt-1">System activity will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase">User</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Action</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Entity</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Details</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/50">
                {logs.map((log) => {
                  const actionStyle = actionConfig[log.action] || actionConfig.CREATE;
                  const EntityIcon = entityIcons[log.entity] || HiOutlineCube;
                  const entityColor = entityColors[log.entity] || 'text-dark-400 bg-dark-700';

                  return (
                    <tr key={log._id} className="hover:bg-dark-800/50 transition-colors">
                      {/* User */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0">
                            {log.user?.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{log.user?.name || 'Unknown'}</p>
                            <p className="text-xs text-dark-500 capitalize">{log.user?.role}</p>
                          </div>
                        </div>
                      </td>

                      {/* Action badge */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${actionStyle.className}`}>
                          {actionStyle.label}
                        </span>
                      </td>

                      {/* Entity */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center ${entityColor}`}>
                            <EntityIcon className="text-xs" />
                          </div>
                          <span className="text-sm text-dark-300">{log.entity}</span>
                        </div>
                      </td>

                      {/* Details */}
                      <td className="py-3.5 px-4">
                        <p className="text-sm text-dark-300 max-w-xs truncate" title={log.details}>
                          {log.details}
                        </p>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-sm text-dark-400 whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-dark-700">
            <p className="text-sm text-dark-400">
              Page {pagination.page} of {pagination.pages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page <= 1}
                className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-30"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page >= pagination.pages}
                className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
