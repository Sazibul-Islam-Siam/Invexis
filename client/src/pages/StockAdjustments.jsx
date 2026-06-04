import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import stockAdjustmentService from '../services/stockAdjustmentService';
import productService from '../services/productService';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineAdjustments,
  HiOutlinePlus,
  HiOutlineX,
  HiOutlineCube,
  HiOutlineExclamation,
} from 'react-icons/hi';

const typeConfig = {
  damaged: { label: 'Damaged', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
  lost: { label: 'Lost', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  expired: { label: 'Expired', className: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  correction: { label: 'Correction', className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
};

const StockAdjustments = () => {
  const { user } = useAuth();
  const [adjustments, setAdjustments] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const [formData, setFormData] = useState({
    product: '',
    type: 'damaged',
    quantity: 1,
    reason: '',
  });

  useEffect(() => {
    fetchAdjustments();
    fetchProducts();
  }, [pagination.page, typeFilter]);

  const fetchAdjustments = async () => {
    try {
      setLoading(true);
      const params = { page: pagination.page, limit: 15 };
      if (typeFilter) params.type = typeFilter;
      const res = await stockAdjustmentService.getStockAdjustments(params);
      setAdjustments(res.data);
      setPagination((p) => ({ ...p, pages: res.pages, total: res.total }));
    } catch {
      toast.error('Failed to fetch adjustments');
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

  const openModal = () => {
    setFormData({ product: '', type: 'damaged', quantity: 1, reason: '' });
    setShowModal(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = { ...formData, quantity: Number(formData.quantity) };
      await stockAdjustmentService.createStockAdjustment(data);
      toast.success('Stock adjustment recorded');
      setShowModal(false);
      fetchAdjustments();
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create adjustment');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProduct = products.find((p) => p._id === formData.product);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-dark-50 flex items-center gap-2">
            <HiOutlineAdjustments className="text-primary-400" />
            Stock Adjustments
          </h1>
          <p className="text-dark-400 mt-1">Track damaged, lost, expired, and corrected stock</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'staff') && (
          <button onClick={openModal} className="btn-primary flex items-center gap-2">
            <HiOutlinePlus className="text-lg" />
            New Adjustment
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="card mb-6">
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className="input-field w-auto"
        >
          <option value="">All Types</option>
          <option value="damaged">Damaged</option>
          <option value="lost">Lost</option>
          <option value="expired">Expired</option>
          <option value="correction">Correction</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : adjustments.length === 0 ? (
          <div className="text-center py-16">
            <HiOutlineAdjustments className="text-5xl text-dark-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-dark-300">No stock adjustments</h3>
            <p className="text-dark-500 mt-1">Record adjustments for damaged, lost, or expired stock</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Product</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Type</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Qty Change</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Reason</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Adjusted By</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/50">
                {adjustments.map((a) => {
                  const badge = typeConfig[a.type] || typeConfig.damaged;
                  return (
                    <tr key={a._id} className="hover:bg-dark-800/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-primary-600/15 rounded-lg flex items-center justify-center shrink-0">
                            <HiOutlineCube className="text-primary-400" />
                          </div>
                          <div>
                            <p className="font-medium text-dark-50">{a.product?.name}</p>
                            <code className="text-xs text-dark-500">{a.product?.sku}</code>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`font-bold text-sm ${a.quantity < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                          {a.quantity > 0 ? '+' : ''}{a.quantity}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-dark-400 text-sm max-w-[200px] truncate">
                        {a.reason}
                      </td>
                      <td className="py-3.5 px-4 text-dark-400 text-sm">{a.adjustedBy?.name}</td>
                      <td className="py-3.5 px-4 text-dark-400 text-sm">
                        {new Date(a.createdAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-dark-700">
            <p className="text-sm text-dark-400">Page {pagination.page} of {pagination.pages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))} disabled={pagination.page <= 1} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-30">Previous</button>
              <button onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))} disabled={pagination.page >= pagination.pages} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-30">Next</button>
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
              <h2 className="text-xl font-semibold text-dark-50">New Stock Adjustment</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-dark-400 hover:text-dark-50 hover:bg-dark-700 rounded-lg transition-all">
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
                {selectedProduct && (
                  <p className="text-xs text-dark-500 mt-1">Current stock: {selectedProduct.quantity}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Type <span className="text-red-400">*</span></label>
                <select required value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="input-field">
                  <option value="damaged">Damaged</option>
                  <option value="lost">Lost</option>
                  <option value="expired">Expired</option>
                  <option value="correction">Correction (+/-)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">
                  Quantity <span className="text-red-400">*</span>
                  {formData.type === 'correction' && (
                    <span className="text-dark-500 text-xs ml-1">(use negative to reduce)</span>
                  )}
                </label>
                <input
                  type="number"
                  required
                  min={formData.type === 'correction' ? undefined : '1'}
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Reason <span className="text-red-400">*</span></label>
                <textarea required value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} className="input-field" rows="2" placeholder="Why is this adjustment needed?" />
              </div>

              {selectedProduct && formData.type !== 'correction' && (
                <div className="bg-dark-900/50 border border-dark-600 rounded-xl p-3 flex items-center gap-3">
                  <HiOutlineExclamation className="text-amber-400 text-lg shrink-0" />
                  <p className="text-xs text-dark-400">
                    This will reduce <strong className="text-dark-50">{selectedProduct.name}</strong> stock from <strong className="text-dark-50">{selectedProduct.quantity}</strong> to <strong className="text-amber-400">{Math.max(0, selectedProduct.quantity - Math.abs(Number(formData.quantity) || 0))}</strong>
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {submitting ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div> : 'Record Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockAdjustments;
