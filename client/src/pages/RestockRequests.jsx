import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import restockService from '../services/restockService';
import productService from '../services/productService';
import userService from '../services/userService';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineTruck,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineX,
  HiOutlineCheck,
  HiOutlineBan,
  HiOutlineCube,
  HiOutlineInboxIn,
} from 'react-icons/hi';

const statusConfig = {
  pending: { label: 'Pending', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  accepted: { label: 'Accepted', className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  rejected: { label: 'Rejected', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
  shipped: { label: 'Shipped', className: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  delivered: { label: 'Delivered', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
};

const RestockRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const [formData, setFormData] = useState({
    product: '',
    supplier: '',
    quantity: 1,
    notes: '',
  });

  useEffect(() => {
    fetchRequests();
    if (user?.role === 'admin') {
      fetchProducts();
      fetchSuppliers();
    }
  }, [pagination.page, statusFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = { page: pagination.page, limit: 15 };
      if (statusFilter) params.status = statusFilter;
      const res = await restockService.getRestockRequests(params);
      setRequests(res.data);
      setPagination((p) => ({ ...p, pages: res.pages, total: res.total }));
    } catch {
      toast.error('Failed to fetch restock requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await productService.getProducts({ limit: 200 });
      setProducts(res.data);
    } catch { /* silent */ }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await userService.getUsers({ role: 'supplier', limit: 100 });
      setSuppliers(res.data);
    } catch { /* silent */ }
  };

  const openModal = () => {
    setFormData({ product: '', supplier: '', quantity: 1, notes: '' });
    setShowModal(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await restockService.createRestockRequest(formData);
      toast.success('Restock request created');
      setShowModal(false);
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await restockService.updateRestockRequest(id, { status });
      toast.success(`Request ${status}`);
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this restock request?')) return;
    try {
      await restockService.deleteRestockRequest(id);
      toast.success('Request deleted');
      fetchRequests();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <HiOutlineTruck className="text-primary-400" />
            Restock Requests
          </h1>
          <p className="text-dark-400 mt-1">Manage supplier restock orders</p>
        </div>
        {user?.role === 'admin' && (
          <button onClick={openModal} className="btn-primary flex items-center gap-2">
            <HiOutlinePlus className="text-lg" />
            New Request
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="card mb-6">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className="input-field w-auto"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16">
            <HiOutlineTruck className="text-5xl text-dark-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-dark-300">No restock requests</h3>
            <p className="text-dark-500 mt-1">Create a request to restock products</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Product</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Supplier</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Qty</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Date</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/50">
                {requests.map((r) => {
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
                      <td className="py-3.5 px-4 text-dark-400 text-sm">{r.supplier?.name}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="bg-dark-700 px-2.5 py-1 rounded-lg text-sm font-medium text-white">
                          {r.quantity}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-dark-400 text-sm">
                        {new Date(r.createdAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-end gap-1">
                          {/* Supplier actions */}
                          {user?.role === 'supplier' && r.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(r._id, 'accepted')}
                                className="p-2 text-dark-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
                                title="Accept"
                              >
                                <HiOutlineCheck className="text-lg" />
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(r._id, 'rejected')}
                                className="p-2 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                title="Reject"
                              >
                                <HiOutlineBan className="text-lg" />
                              </button>
                            </>
                          )}
                          {user?.role === 'supplier' && r.status === 'accepted' && (
                            <button
                              onClick={() => handleStatusUpdate(r._id, 'shipped')}
                              className="px-3 py-1.5 text-xs font-medium bg-purple-500/15 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/25 transition-colors flex items-center gap-1.5"
                            >
                              <HiOutlineTruck className="text-sm" /> Mark Shipped
                            </button>
                          )}
                          {/* Admin: Confirm Receipt when supplier has shipped */}
                          {user?.role === 'admin' && r.status === 'shipped' && (
                            <button
                              onClick={() => {
                                if (window.confirm(
                                  `Confirm receipt of ${r.quantity} × ${r.product?.name}?\n\nThis will mark the shipment as Delivered and add ${r.quantity} units to inventory.`
                                )) {
                                  handleStatusUpdate(r._id, 'delivered');
                                }
                              }}
                              className="px-3 py-1.5 text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/25 transition-colors flex items-center gap-1.5"
                            >
                              <HiOutlineInboxIn className="text-sm" /> Confirm Receipt
                            </button>
                          )}
                          {user?.role === 'admin' && (
                            <button
                              onClick={() => handleDelete(r._id)}
                              className="p-2 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                              title="Delete"
                            >
                              <HiOutlineTrash className="text-lg" />
                            </button>
                          )}
                        </div>
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
              >Previous</button>
              <button
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page >= pagination.pages}
                className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-30"
              >Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-dark-800 border border-dark-600 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">New Restock Request</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-all">
                <HiOutlineX className="text-xl" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Product <span className="text-red-400">*</span></label>
                <select required value={formData.product} onChange={(e) => setFormData({ ...formData, product: e.target.value })} className="input-field">
                  <option value="">Select product</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>{p.name} (Stock: {p.quantity})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Supplier <span className="text-red-400">*</span></label>
                <select required value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} className="input-field">
                  <option value="">Select supplier</option>
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>{s.name} ({s.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Quantity <span className="text-red-400">*</span></label>
                <input type="number" required min="1" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="input-field" rows="2" placeholder="Optional notes..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {submitting ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div> : 'Create Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestockRequests;
