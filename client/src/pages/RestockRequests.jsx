import { useState, useEffect, useRef } from 'react';
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
  HiOutlineClipboardCheck,
} from 'react-icons/hi';

const statusConfig = {
  pending_admin: { label: 'Awaiting Approval', className: 'bg-orange-50 text-orange-600 border-orange-500/30' },
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-600 border-amber-200' },
  accepted: { label: 'Accepted', className: 'bg-blue-50 text-blue-600 border-blue-200' },
  rejected: { label: 'Rejected', className: 'bg-red-50 text-red-500 border-red-200' },
  shipped: { label: 'Shipped', className: 'bg-purple-50 text-purple-600 border-purple-200' },
  delivered: { label: 'Delivered', className: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  rejected_shipment: { label: 'Shipment Rejected', className: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
};

const RestockRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approvingRequest, setApprovingRequest] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const [formData, setFormData] = useState({
    product: '',
    supplier: '',
    quantity: 1,
    unitCost: '',
    notes: '',
  });

  const [approveData, setApproveData] = useState({
    supplier: '',
    quantity: 1,
    unitCost: '',
  });

  useEffect(() => {
    fetchRequests();
    if (user?.role === 'admin') {
      fetchProducts();
      fetchSuppliers();
    }
    if (user?.role === 'staff') {
      fetchProducts();
    }
  }, [pagination.page, statusFilter]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      const sortedProducts = res.data.sort((a, b) => {
        const aIsLow = a.quantity <= (a.minStockThreshold || 10);
        const bIsLow = b.quantity <= (b.minStockThreshold || 10);
        if (aIsLow && !bIsLow) return -1;
        if (!aIsLow && bIsLow) return 1;
        return a.name.localeCompare(b.name);
      });
      setProducts(sortedProducts);
    } catch { /* silent */ }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await userService.getUsers({ role: 'supplier', limit: 100 });
      setSuppliers(res.data);
    } catch { /* silent */ }
  };

  const openModal = () => {
    setFormData({ product: '', supplier: '', quantity: 1, unitCost: '', notes: '' });
    setSearchQuery('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSearchQuery('');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (user?.role === 'staff') {
        // Staff only sends product + notes
        await restockService.createRestockRequest({
          product: formData.product,
          notes: formData.notes,
        });
        toast.success('Restock request submitted for admin approval');
      } else {
        await restockService.createRestockRequest(formData);
        toast.success('Restock request created');
      }
      closeModal();
      fetchRequests();
      window.dispatchEvent(new Event('refresh-notifications'));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create request');
    } finally {
      setSubmitting(false);
    }
  };

  const openApproveModal = (request) => {
    setApprovingRequest(request);
    setApproveData({ supplier: '', quantity: 1, unitCost: request.product?.costPrice || '' });
    setShowApproveModal(true);
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await restockService.approveRestockRequest(approvingRequest._id, approveData);
      toast.success('Request approved and sent to supplier');
      setShowApproveModal(false);
      setApprovingRequest(null);
      fetchRequests();
      window.dispatchEvent(new Event('refresh-notifications'));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id, status, notes) => {
    try {
      const payload = { status };
      if (notes) payload.notes = notes;
      await restockService.updateRestockRequest(id, payload);
      toast.success(`Request ${status === 'rejected_shipment' ? 'shipment rejected' : status}`);
      fetchRequests();
      window.dispatchEvent(new Event('refresh-notifications'));
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
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <HiOutlineTruck className="text-primary-600" />
            Restock Requests
          </h1>
          <p className="text-gray-500 mt-1">Manage supplier restock orders</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'staff') && (
          <button onClick={openModal} className="btn-primary flex items-center gap-2">
            <HiOutlinePlus className="text-lg" />
            {user?.role === 'staff' ? 'Request Restock' : 'New Request'}
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
          {user?.role === 'admin' && <option value="pending_admin">Awaiting Approval</option>}
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="rejected">Rejected</option>
          <option value="rejected_shipment">Shipment Rejected</option>
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
            <HiOutlineTruck className="text-5xl text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-600">No restock requests</h3>
            <p className="text-gray-400 mt-1">Create a request to restock products</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Product</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Supplier</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Qty</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Unit Cost</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Requested By</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((r) => {
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
                      <td className="py-3.5 px-4 text-gray-500 text-sm">
                        {r.supplier?.name || <span className="text-gray-400 italic">Not assigned</span>}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {r.quantity ? (
                          <span className="bg-gray-100 px-2.5 py-1 rounded-lg text-sm font-medium text-gray-900">
                            {r.quantity}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-sm">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right text-sm">
                        {r.unitCost != null ? (
                          <span className="text-gray-700 font-medium">৳{r.unitCost.toLocaleString()}</span>
                        ) : (
                          <span className="text-gray-400 italic">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 text-sm">{r.requestedBy?.name}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 text-sm">
                        {new Date(r.createdAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-end gap-1">
                          {/* Admin: Approve/Reject staff requests */}
                          {user?.role === 'admin' && r.status === 'pending_admin' && (
                            <>
                              <button
                                onClick={() => openApproveModal(r)}
                                className="px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
                                title="Approve & Assign Supplier"
                              >
                                <HiOutlineClipboardCheck className="text-sm" /> Approve
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(r._id, 'rejected')}
                                className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="Reject"
                              >
                                <HiOutlineBan className="text-lg" />
                              </button>
                            </>
                          )}
                          {/* Supplier actions */}
                          {user?.role === 'supplier' && r.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(r._id, 'accepted')}
                                className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-500/10 rounded-lg transition-all"
                                title="Accept"
                              >
                                <HiOutlineCheck className="text-lg" />
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(r._id, 'rejected')}
                                className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="Reject"
                              >
                                <HiOutlineBan className="text-lg" />
                              </button>
                            </>
                          )}
                          {user?.role === 'supplier' && r.status === 'accepted' && (
                            <button
                              onClick={() => handleStatusUpdate(r._id, 'shipped')}
                              className="px-3 py-1.5 text-xs font-medium bg-purple-50 text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-500/25 transition-colors flex items-center gap-1.5"
                            >
                              <HiOutlineTruck className="text-sm" /> Mark Shipped
                            </button>
                          )}
                          {/* Admin: Confirm Receipt when supplier has shipped */}
                          {user?.role === 'admin' && r.status === 'shipped' && (
                            <>
                              <button
                                onClick={() => {
                                  if (window.confirm(
                                    `Confirm receipt of ${r.quantity} × ${r.product?.name}?\n\nThis will mark the shipment as Delivered and add ${r.quantity} units to inventory.`
                                  )) {
                                    handleStatusUpdate(r._id, 'delivered');
                                  }
                                }}
                                className="px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
                              >
                                <HiOutlineInboxIn className="text-sm" /> Confirm Receipt
                              </button>
                              <button
                                onClick={() => {
                                  const reason = window.prompt(
                                    `Reject shipment of ${r.quantity} × ${r.product?.name}?\n\nOptionally provide a reason for the supplier:`
                                  );
                                  if (reason !== null) {
                                    handleStatusUpdate(r._id, 'rejected_shipment', reason);
                                  }
                                }}
                                className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-500 border border-red-200 rounded-lg hover:bg-red-500/25 transition-colors flex items-center gap-1.5"
                                title="Reject Shipment"
                              >
                                <HiOutlineBan className="text-sm" /> Reject
                              </button>
                            </>
                          )}
                          {user?.role === 'admin' && (
                            <button
                              onClick={() => handleDelete(r._id)}
                              className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">
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

      {/* ==================== CREATE MODAL ==================== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="relative bg-white border border-gray-300 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {user?.role === 'staff' ? 'Request Restock' : 'New Restock Request'}
              </h2>
              <button onClick={closeModal} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all">
                <HiOutlineX className="text-xl" />
              </button>
            </div>

            {user?.role === 'staff' && (
              <div className="bg-blue-500/10 border border-blue-200 rounded-xl p-3 mb-4">
                <p className="text-xs text-blue-600">
                  Your request will be reviewed by an Admin who will assign a supplier and quantity before forwarding it.
                </p>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Product selector (searchable) */}
              <div className="relative" ref={dropdownRef}>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Product <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required={!formData.product}
                  placeholder="Search and select a product..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsDropdownOpen(true);
                    if (!e.target.value) setFormData({ ...formData, product: '' });
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  className="input-field w-full"
                />
                {isDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-2xl max-h-56 overflow-y-auto">
                    {products
                      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())))
                      .map(p => (
                        <div
                          key={p._id}
                          onClick={() => {
                            setFormData({ ...formData, product: p._id });
                            setSearchQuery(p.name);
                            setIsDropdownOpen(false);
                          }}
                          className={`px-3 py-2 cursor-pointer transition-colors text-sm ${
                            formData.product === p._id
                              ? 'bg-primary-50 text-primary-600'
                              : 'text-gray-800 hover:bg-gray-100'
                          }`}
                        >
                          {p.name} <span className="text-gray-500">— Stock: {p.quantity}</span>
                        </div>
                    ))}
                    {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))).length === 0 && (
                      <div className="px-3 py-4 text-gray-500 text-sm text-center">No products found</div>
                    )}
                  </div>
                )}
              </div>

              {/* Supplier + Quantity only for Admin */}
              {user?.role === 'admin' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Supplier <span className="text-red-500">*</span></label>
                    <select required value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} className="input-field">
                      <option value="">Select supplier</option>
                      {suppliers.map((s) => (
                        <option key={s._id} value={s._id}>{s.name} ({s.email})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Quantity <span className="text-red-500">*</span></label>
                    <input type="number" required min="1" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Unit Cost (৳)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.unitCost}
                      onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                      className="input-field"
                      placeholder={`Default: product's current cost price`}
                    />
                    <p className="text-xs text-gray-400 mt-1">Leave blank to use product's current cost price</p>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="input-field" rows="2" placeholder="Optional notes..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {submitting ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div> : (user?.role === 'staff' ? 'Submit Request' : 'Create Request')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== APPROVE MODAL (Admin assigns supplier + qty) ==================== */}
      {showApproveModal && approvingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowApproveModal(false)}></div>
          <div className="relative bg-white border border-gray-300 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Approve Restock Request</h2>
              <button onClick={() => setShowApproveModal(false)} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all">
                <HiOutlineX className="text-xl" />
              </button>
            </div>

            {/* Request Info */}
            <div className="bg-white border border-gray-300 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center shrink-0">
                  <HiOutlineCube className="text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{approvingRequest.product?.name}</p>
                  <p className="text-xs text-gray-400">Current Stock: {approvingRequest.product?.quantity} | Min: {approvingRequest.product?.minStockThreshold}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Requested by <span className="text-gray-700">{approvingRequest.requestedBy?.name}</span>
                {approvingRequest.notes && <> — "{approvingRequest.notes}"</>}
              </p>
            </div>

            <form onSubmit={handleApprove} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Supplier <span className="text-red-500">*</span></label>
                <select required value={approveData.supplier} onChange={(e) => setApproveData({ ...approveData, supplier: e.target.value })} className="input-field">
                  <option value="">Select supplier</option>
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>{s.name} ({s.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Quantity <span className="text-red-500">*</span></label>
                <input type="number" required min="1" value={approveData.quantity} onChange={(e) => setApproveData({ ...approveData, quantity: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Unit Cost (৳)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={approveData.unitCost}
                  onChange={(e) => setApproveData({ ...approveData, unitCost: e.target.value })}
                  className="input-field"
                  placeholder={`Default: ৳${approvingRequest.product?.costPrice || 0}`}
                />
                <p className="text-xs text-gray-400 mt-1">Purchase price per unit for this delivery</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowApproveModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {submitting ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div> : 'Approve & Send to Supplier'}
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
