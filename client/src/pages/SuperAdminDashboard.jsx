import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import superAdminService from '../services/superAdminService';
import { toast } from 'react-toastify';
import {
  HiOutlineOfficeBuilding,
  HiOutlineUsers,
  HiOutlineCheckCircle,
  HiOutlineBan,
  HiOutlineSearch,
  HiOutlineTrash,
  HiOutlineShieldCheck,
  HiOutlineExclamation,
  HiOutlineRefresh,
  HiOutlineGlobe,
} from 'react-icons/hi';

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteModal, setDeleteModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [search, statusFilter, currentPage]);

  const fetchStats = async () => {
    try {
      const res = await superAdminService.getPlatformStats();
      setStats(res.data);
    } catch (error) {
      console.error('Stats fetch error:', error);
    }
  };

  const fetchCompanies = async () => {
    try {
      setCompaniesLoading(true);
      const params = { page: currentPage, limit: 10 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await superAdminService.getCompanies(params);
      setCompanies(res.data);
      setTotalPages(res.pages);
      setTotal(res.total);
    } catch (error) {
      console.error('Companies fetch error:', error);
    } finally {
      setCompaniesLoading(false);
      setLoading(false);
    }
  };

  const handleToggleStatus = async (companyId, companyName, currentStatus) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} "${companyName}"?\n\nThis will ${currentStatus ? 'disable' : 'enable'} all users in this company.`)) return;

    try {
      setActionLoading(companyId);
      const res = await superAdminService.toggleCompanyStatus(companyId);
      toast.success(res.message);
      fetchStats();
      fetchCompanies();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${action} company`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      setActionLoading(deleteModal._id);
      const res = await superAdminService.deleteCompany(deleteModal._id);
      toast.success(res.message);
      setDeleteModal(null);
      fetchStats();
      fetchCompanies();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete company');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const statCards = stats
    ? [
      {
        title: 'Total Companies',
        value: stats.totalCompanies,
        icon: HiOutlineOfficeBuilding,
        color: 'text-indigo-400',
        bg: 'bg-indigo-400/10',
        border: 'border-indigo-500/20',
      },
      {
        title: 'Active Companies',
        value: stats.activeCompanies,
        icon: HiOutlineCheckCircle,
        color: 'text-emerald-400',
        bg: 'bg-emerald-400/10',
        border: 'border-emerald-500/20',
      },
      {
        title: 'Inactive Companies',
        value: stats.inactiveCompanies,
        icon: HiOutlineBan,
        color: 'text-red-400',
        bg: 'bg-red-400/10',
        border: 'border-red-500/20',
      },
      {
        title: 'Total Users',
        value: stats.totalUsers,
        sub: `${stats.activeUsers} active`,
        icon: HiOutlineUsers,
        color: 'text-blue-400',
        bg: 'bg-blue-400/10',
        border: 'border-blue-500/20',
      },
    ]
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-violet-600/20 rounded-xl flex items-center justify-center">
            <HiOutlineShieldCheck className="text-xl text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Platform Management
            </h1>
            <p className="text-dark-400 text-sm">
              Manage all companies on the Invexis platform
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statCards.map((stat, i) => (
          <div
            key={i}
            className={`card hover:border-dark-600 hover:scale-[1.02] transition-all duration-200 group cursor-default border ${stat.border}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-400 font-medium">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-white mt-2">
                  {stat.value}
                </p>
                {stat.sub && (
                  <p className="text-xs text-dark-500 mt-1">{stat.sub}</p>
                )}
              </div>
              <div
                className={`w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
              >
                <stat.icon className={`text-2xl ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Companies Table */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <HiOutlineGlobe className="text-primary-400" />
            All Companies
            <span className="text-sm font-normal text-dark-500 ml-2">
              ({total})
            </span>
          </h3>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:flex-initial">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
              <input
                type="text"
                placeholder="Search companies..."
                value={search}
                onChange={handleSearchChange}
                className="w-full sm:w-64 pl-10 pr-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-sm text-dark-200 placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={handleFilterChange}
              className="bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-dark-300 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Refresh */}
            <button
              onClick={() => {
                fetchStats();
                fetchCompanies();
              }}
              className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
              title="Refresh"
            >
              <HiOutlineRefresh className="text-lg" />
            </button>
          </div>
        </div>

        {/* Table */}
        {companiesLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-16">
            <HiOutlineOfficeBuilding className="text-5xl text-dark-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-dark-300">
              No companies found
            </h3>
            <p className="text-dark-500 mt-1">
              {search || statusFilter
                ? 'Try adjusting your filters'
                : 'Companies will appear here once they register'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-700">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase">
                      Company
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase">
                      Owner
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-dark-400 uppercase">
                      Users
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-dark-400 uppercase">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase">
                      Created
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-dark-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700/50">
                  {companies.map((company) => (
                    <tr
                      key={company._id}
                      className="hover:bg-dark-800/50 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-600/15 rounded-xl flex items-center justify-center shrink-0">
                            <HiOutlineOfficeBuilding className="text-primary-400 text-lg" />
                          </div>
                          <div>
                            <p className="font-medium text-white">
                              {company.name}
                            </p>
                            <code className="text-xs text-dark-500">
                              {company.slug}
                            </code>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {company.owner ? (
                          <div>
                            <p className="text-sm text-dark-200">
                              {company.owner.name}
                            </p>
                            <p className="text-xs text-dark-500">
                              {company.owner.email}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-dark-500 italic">
                            No owner
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="bg-dark-700 px-3 py-1 rounded-lg text-sm font-medium text-white">
                          {company.userCount}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${company.isActive
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-red-500/15 text-red-400 border-red-500/30'
                            }`}
                        >
                          {company.isActive ? (
                            <HiOutlineCheckCircle className="text-sm" />
                          ) : (
                            <HiOutlineBan className="text-sm" />
                          )}
                          {company.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-sm text-dark-400">
                        {new Date(company.createdAt).toLocaleDateString(
                          'en-US',
                          {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          }
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* Toggle Status */}
                          <button
                            onClick={() =>
                              handleToggleStatus(
                                company._id,
                                company.name,
                                company.isActive
                              )
                            }
                            disabled={actionLoading === company._id}
                            className={`p-2 rounded-lg text-sm font-medium transition-all duration-200 ${company.isActive
                                ? 'text-amber-400 hover:bg-amber-500/10 hover:text-amber-300'
                                : 'text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300'
                              } disabled:opacity-50`}
                            title={
                              company.isActive ? 'Deactivate' : 'Activate'
                            }
                          >
                            {company.isActive ? (
                              <HiOutlineBan className="text-lg" />
                            ) : (
                              <HiOutlineCheckCircle className="text-lg" />
                            )}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeleteModal(company)}
                            disabled={actionLoading === company._id}
                            className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 disabled:opacity-50"
                            title="Delete Company"
                          >
                            <HiOutlineTrash className="text-lg" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-dark-700">
                <p className="text-sm text-dark-500">
                  Page {currentPage} of {totalPages} ({total} companies)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm rounded-lg bg-dark-700 text-dark-300 hover:bg-dark-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm rounded-lg bg-dark-700 text-dark-300 hover:bg-dark-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Privacy Notice */}
      <div className="mt-6 card border border-violet-500/20 bg-violet-900/5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 bg-violet-500/15 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
            <HiOutlineShieldCheck className="text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-violet-300">
              Privacy Protected
            </p>
            <p className="text-xs text-dark-400 mt-1">
              As a Super Admin, you can manage companies and their active status, but you cannot view any internal company data such as products, sales, categories, reports, or user details. This ensures complete data privacy for each company.
            </p>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 border border-dark-600 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-500/15 rounded-xl flex items-center justify-center">
                <HiOutlineExclamation className="text-2xl text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Delete Company
                </h3>
                <p className="text-sm text-dark-400">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <div className="bg-dark-900/50 border border-dark-700 rounded-xl p-4 mb-6">
              <p className="text-sm text-dark-300">
                You are about to permanently delete{' '}
                <span className="text-white font-semibold">
                  "{deleteModal.name}"
                </span>{' '}
                and all its associated data:
              </p>
              <ul className="mt-3 space-y-1.5 text-sm text-dark-400">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                  All {deleteModal.userCount} user account(s) (Firebase + Database)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                  Company profile and settings
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-dark-300 bg-dark-700 rounded-xl hover:bg-dark-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading === deleteModal._id}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading === deleteModal._id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                ) : (
                  <>
                    <HiOutlineTrash className="text-lg" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
