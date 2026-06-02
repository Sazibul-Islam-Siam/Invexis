import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import saleService from '../services/saleService';
import productService from '../services/productService';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineShoppingCart,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineX,
  HiOutlineCash,
  HiOutlineCube,
  HiOutlineCalendar,
  HiOutlineReceiptTax,
  HiOutlineEye,
  HiOutlineMinus,
  HiOutlinePrinter,
} from 'react-icons/hi';

const Sales = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState({ totalRevenue: 0, totalItems: 0, totalTransactions: 0 });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [showReceipt, setShowReceipt] = useState(null);
  const [showDetails, setShowDetails] = useState(null);

  // Cart state for multi-product sale
  const [cart, setCart] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const printInvoice = (sale) => {
    const itemsHtml = (sale.items || []).map((i) =>
      `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i.product?.name || 'Unknown'}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">৳${i.unitPrice?.toLocaleString()}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">৳${i.totalPrice?.toLocaleString()}</td></tr>`
    ).join('');
    const html = `<!DOCTYPE html><html><head><title>Invoice ${sale.invoiceNo}</title><style>body{font-family:Arial,sans-serif;max-width:400px;margin:40px auto;color:#333}h2{text-align:center;margin-bottom:4px}table{width:100%;border-collapse:collapse;margin:16px 0}th{text-align:left;padding:8px;border-bottom:2px solid #333;font-size:13px}td{font-size:13px}.total{font-size:18px;font-weight:bold;text-align:right;margin-top:8px}.meta{font-size:12px;color:#666;margin:4px 0}.center{text-align:center}@media print{body{margin:0}}</style></head><body><h2>INVEXIS</h2><p class="center" style="margin:0;color:#666;font-size:13px">Smart Inventory Management</p><hr style="margin:16px 0"><p class="meta"><strong>Invoice:</strong> ${sale.invoiceNo}</p><p class="meta"><strong>Date:</strong> ${new Date(sale.saleDate).toLocaleString()}</p><p class="meta"><strong>Cashier:</strong> ${sale.soldBy?.name || 'N/A'}</p><table><thead><tr><th>Product</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr></thead><tbody>${itemsHtml}</tbody></table><p class="total">Grand Total: ৳${sale.totalAmount?.toLocaleString()}</p><hr style="margin:16px 0"><p class="center" style="font-size:11px;color:#999">Thank you for your purchase!</p></body></html>`;
    const win = window.open('', '_blank', 'width=450,height=600');
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchSales();
  }, [pagination.page, dateFilter.startDate, dateFilter.endDate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await productService.getProducts({ limit: 200, status: 'active' });
      setProducts(res.data);
    } catch {
      // silent
    }
  };

  const fetchSales = async () => {
    try {
      setLoading(true);
      const params = { page: pagination.page, limit: 15 };
      if (dateFilter.startDate) params.startDate = dateFilter.startDate;
      if (dateFilter.endDate) params.endDate = dateFilter.endDate;

      const res = await saleService.getSales(params);
      setSales(res.data);
      setSummary(res.summary);
      setPagination((prev) => ({
        ...prev,
        pages: res.pages,
        total: res.total,
      }));
    } catch {
      toast.error('Failed to fetch sales');
    } finally {
      setLoading(false);
    }
  };

  // --- Cart Logic ---
  const addToCart = () => {
    if (!selectedProductId) return;

    const product = products.find((p) => p._id === selectedProductId);
    if (!product) return;

    const qty = Number(selectedQty);
    if (qty < 1) return;

    // Check if already in cart
    const existingIndex = cart.findIndex((item) => item.product._id === product._id);
    if (existingIndex >= 0) {
      const updated = [...cart];
      const newQty = updated[existingIndex].quantity + qty;
      if (newQty > product.quantity) {
        toast.error(`Only ${product.quantity} available for "${product.name}"`);
        return;
      }
      updated[existingIndex].quantity = newQty;
      updated[existingIndex].totalPrice = product.price * newQty;
      setCart(updated);
    } else {
      if (qty > product.quantity) {
        toast.error(`Only ${product.quantity} available for "${product.name}"`);
        return;
      }
      setCart([
        ...cart,
        {
          product,
          quantity: qty,
          unitPrice: product.price,
          totalPrice: product.price * qty,
        },
      ]);
    }

    setSelectedProductId('');
    setSearchQuery('');
    setSelectedQty(1);
  };

  const updateCartQty = (index, newQty) => {
    const updated = [...cart];
    const max = updated[index].product.quantity;
    const qty = Math.min(Math.max(1, newQty), max);
    updated[index].quantity = qty;
    updated[index].totalPrice = updated[index].unitPrice * qty;
    setCart(updated);
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  const openModal = () => {
    setCart([]);
    setSelectedProductId('');
    setSelectedQty(1);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setCart([]);
    setSearchQuery('');
    setSelectedProductId('');
  };

  const handleSubmit = async () => {
    if (cart.length === 0) {
      toast.error('Add at least one product to the cart');
      return;
    }
    setSubmitting(true);
    try {
      const items = cart.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
      }));
      const result = await saleService.createSale({ items });
      toast.success('Sale recorded successfully!');
      setShowReceipt(result.data);
      closeModal();
      fetchSales();
      fetchProducts();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to record sale';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this sale? Stock will be restored for all items.')) return;
    try {
      await saleService.deleteSale(id);
      toast.success('Sale deleted & stock restored');
      fetchSales();
      fetchProducts();
    } catch {
      toast.error('Failed to delete sale');
    }
  };

  // Products not already in cart (for the dropdown)
  const availableProducts = products.filter(
    (p) => p.quantity > 0 && !cart.find((c) => c.product._id === p._id)
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <HiOutlineShoppingCart className="text-primary-400" />
            Sales
          </h1>
          <p className="text-dark-400 mt-1">Record and track sales transactions</p>
        </div>
        <button onClick={openModal} className="btn-primary flex items-center gap-2">
          <HiOutlinePlus className="text-lg" />
          New Sale
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
        <div className="card border border-emerald-500/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-400/10 rounded-2xl flex items-center justify-center">
              <HiOutlineCash className="text-2xl text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-dark-400">Total Revenue</p>
              <p className="text-2xl font-bold text-white">৳{summary.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="card border border-blue-500/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-400/10 rounded-2xl flex items-center justify-center">
              <HiOutlineCube className="text-2xl text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-dark-400">Items Sold</p>
              <p className="text-2xl font-bold text-white">{summary.totalItems.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="card border border-purple-500/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-400/10 rounded-2xl flex items-center justify-center">
              <HiOutlineReceiptTax className="text-2xl text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-dark-400">Transactions</p>
              <p className="text-2xl font-bold text-white">{summary.totalTransactions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Date Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <HiOutlineCalendar className="text-dark-400 text-lg" />
          <div className="flex items-center gap-2">
            <label className="text-sm text-dark-400">From:</label>
            <input
              type="date"
              value={dateFilter.startDate}
              onChange={(e) => {
                setDateFilter({ ...dateFilter, startDate: e.target.value });
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="input-field w-auto text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-dark-400">To:</label>
            <input
              type="date"
              value={dateFilter.endDate}
              onChange={(e) => {
                setDateFilter({ ...dateFilter, endDate: e.target.value });
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="input-field w-auto text-sm"
            />
          </div>
          {(dateFilter.startDate || dateFilter.endDate) && (
            <button
              onClick={() => {
                setDateFilter({ startDate: '', endDate: '' });
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Sales Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : sales.length === 0 ? (
          <div className="text-center py-16">
            <HiOutlineShoppingCart className="text-5xl text-dark-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-dark-300">No sales recorded</h3>
            <p className="text-dark-500 mt-1">Record your first sale to get started</p>
            <button onClick={openModal} className="btn-primary mt-4 inline-flex items-center gap-2">
              <HiOutlinePlus />
              New Sale
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-700">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">Invoice</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">Items</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">Total</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">Profit</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">Sold By</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">Date</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700/50">
                  {sales.map((sale) => (
                    <tr key={sale._id} className="hover:bg-dark-800/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <code className="text-sm font-semibold text-primary-400 bg-primary-600/10 px-2.5 py-1 rounded-lg">
                          {sale.invoiceNo}
                        </code>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {sale.items?.map((item, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <span className="text-white">{item.product?.name || 'Deleted Product'}</span>
                              <span className="text-dark-500">×{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-semibold text-emerald-400">
                          ৳{sale.totalAmount?.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-semibold text-emerald-400">
                          ৳{sale.totalProfit?.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-dark-400 text-sm">{sale.soldBy?.name || '—'}</td>
                      <td className="py-3.5 px-4 text-dark-400 text-sm">
                        {new Date(sale.saleDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setShowDetails(sale)}
                            className="p-2 text-dark-400 hover:text-primary-400 hover:bg-primary-600/10 rounded-lg transition-all"
                            title="View details"
                          >
                            <HiOutlineEye className="text-lg" />
                          </button>
                          {user?.role === 'admin' && (
                            <button
                              onClick={() => handleDelete(sale._id)}
                              className="p-2 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                              title="Delete (restores stock)"
                            >
                              <HiOutlineTrash className="text-lg" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-dark-700">
                <p className="text-sm text-dark-400">
                  Page {pagination.page} of {pagination.pages} ({pagination.total} sales)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page <= 1}
                    className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-30"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page >= pagination.pages}
                    className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ==================== NEW SALE MODAL ==================== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="relative bg-dark-800 border border-dark-600 rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Record New Sale</h2>
              <button
                onClick={closeModal}
                className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-all"
              >
                <HiOutlineX className="text-xl" />
              </button>
            </div>

            {/* Add Product to Cart */}
            <div className="bg-dark-900/50 border border-dark-600 rounded-xl p-4 mb-4">
              <p className="text-sm font-medium text-dark-300 mb-3">Add Products</p>
              <div className="flex gap-3">
                <div className="relative flex-1" ref={dropdownRef}>
                  <input
                    type="text"
                    placeholder="Search and select a product..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                      if (!e.target.value) setSelectedProductId('');
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    className="input-field w-full"
                  />
                  {isDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-dark-800 border border-dark-600 rounded-lg shadow-2xl max-h-56 overflow-y-auto">
                      {availableProducts
                        .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map(p => (
                          <div
                            key={p._id}
                            onClick={() => {
                              setSelectedProductId(p._id);
                              setSearchQuery(p.name);
                              setIsDropdownOpen(false);
                            }}
                            className={`px-3 py-2 cursor-pointer transition-colors text-sm ${selectedProductId === p._id
                              ? 'bg-primary-600/20 text-primary-400'
                              : 'text-dark-100 hover:bg-dark-700'
                              }`}
                          >
                            <p className="font-medium">{p.name}</p>
                            <p className="text-xs text-dark-400 mt-0.5">
                              {p.sku} • Stock: {p.quantity} • ৳{p.price.toLocaleString()}
                            </p>
                          </div>
                        ))}
                      {availableProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                        <div className="px-3 py-4 text-dark-400 text-sm text-center">No products found</div>
                      )}
                    </div>
                  )}
                </div>
                <input
                  type="number"
                  min="1"
                  value={selectedQty}
                  onChange={(e) => setSelectedQty(e.target.value)}
                  className="input-field w-20 text-center"
                  placeholder="Qty"
                />
                <button
                  type="button"
                  onClick={addToCart}
                  disabled={!selectedProductId}
                  className="btn-primary px-4 shrink-0 disabled:opacity-40"
                >
                  <HiOutlinePlus className="text-lg" />
                </button>
              </div>
            </div>

            {/* Cart Items */}
            {cart.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-dark-600 rounded-xl">
                <HiOutlineShoppingCart className="text-3xl text-dark-600 mx-auto mb-2" />
                <p className="text-sm text-dark-500">No items added yet</p>
                <p className="text-xs text-dark-600">Select a product above to begin</p>
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                {cart.map((item, index) => (
                  <div
                    key={item.product._id}
                    className="flex items-center gap-3 bg-dark-900/50 border border-dark-600 rounded-xl px-4 py-3"
                  >
                    <div className="w-9 h-9 bg-primary-600/15 rounded-lg flex items-center justify-center shrink-0">
                      <HiOutlineCube className="text-primary-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{item.product.name}</p>
                      <p className="text-xs text-dark-500">
                        ৳{item.unitPrice.toLocaleString()} × {item.quantity}
                      </p>
                    </div>
                    {/* Qty controls */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateCartQty(index, item.quantity - 1)}
                        className="p-1 text-dark-400 hover:text-white hover:bg-dark-700 rounded transition-all"
                      >
                        <HiOutlineMinus className="text-sm" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={item.product.quantity}
                        value={item.quantity}
                        onChange={(e) => updateCartQty(index, Number(e.target.value))}
                        className="w-14 bg-dark-700 border border-dark-600 rounded text-center text-sm text-white py-1 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                      <button
                        onClick={() => updateCartQty(index, item.quantity + 1)}
                        className="p-1 text-dark-400 hover:text-white hover:bg-dark-700 rounded transition-all"
                      >
                        <HiOutlinePlus className="text-sm" />
                      </button>
                    </div>
                    <p className="text-sm font-semibold text-emerald-400 w-24 text-right">
                      ৳{item.totalPrice.toLocaleString()}
                    </p>
                    <button
                      onClick={() => removeFromCart(index)}
                      className="p-1.5 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <HiOutlineTrash className="text-base" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Cart Summary & Submit */}
            {cart.length > 0 && (
              <div className="bg-dark-900/50 border border-dark-600 rounded-xl p-4 mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-dark-400">Total Items</span>
                  <span className="text-dark-200">
                    {cart.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-dark-700 pt-2 mt-2">
                  <span className="font-semibold text-white">Grand Total</span>
                  <span className="font-bold text-xl text-emerald-400">
                    ৳{cartTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || cart.length === 0}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <>
                    <HiOutlineShoppingCart />
                    Record Sale ({cart.length} item{cart.length !== 1 ? 's' : ''})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== RECEIPT MODAL ==================== */}
      {showReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowReceipt(null)}></div>
          <div className="relative bg-dark-800 border border-dark-600 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-3">
                <HiOutlineReceiptTax className="text-3xl text-emerald-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Sale Receipt</h2>
              <code className="text-primary-400 text-sm">{showReceipt.invoiceNo}</code>
            </div>

            <div className="bg-dark-900/50 border border-dark-600 rounded-xl p-4 space-y-2 mb-4">
              {showReceipt.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-dark-300">
                    {item.product?.name} × {item.quantity}
                  </span>
                  <span className="text-dark-200">৳{item.totalPrice?.toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t border-dark-700 pt-2 flex justify-between">
                <span className="font-semibold text-white">Total</span>
                <span className="font-bold text-lg text-emerald-400">
                  ৳{showReceipt.totalAmount?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-xs pt-1">
                <span className="text-dark-500">Sold By</span>
                <span className="text-dark-400">{showReceipt.soldBy?.name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-dark-500">Date</span>
                <span className="text-dark-400">{new Date(showReceipt.saleDate).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => printInvoice(showReceipt)} className="btn-secondary flex-1 flex items-center justify-center gap-2">
                <HiOutlinePrinter className="text-lg" /> Print
              </button>
              <button onClick={() => setShowReceipt(null)} className="btn-primary flex-1">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SALE DETAILS MODAL ==================== */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDetails(null)}></div>
          <div className="relative bg-dark-800 border border-dark-600 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white">Sale Details</h2>
                <code className="text-primary-400 text-sm">{showDetails.invoiceNo}</code>
              </div>
              <button
                onClick={() => setShowDetails(null)}
                className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-all"
              >
                <HiOutlineX className="text-xl" />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {showDetails.items?.map((item, i) => (
                <div
                  key={i}
                  className="bg-dark-900/50 border border-dark-600 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{item.product?.name || 'Deleted Product'}</p>
                      <p className="text-xs text-dark-500">
                        ৳{item.unitPrice?.toLocaleString()} × {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-emerald-400">
                        ৳{item.totalPrice?.toLocaleString()}
                      </p>
                      {user?.role === 'admin' && item.totalCost > 0 && (
                        <p className="text-xs text-dark-500">Cost: ৳{item.totalCost?.toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                  {/* Batch allocation breakdown for admin */}
                  {user?.role === 'admin' && item.batchAllocations?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-dark-700">
                      <p className="text-xs font-medium text-dark-400 mb-1">Batch Allocations (FIFO)</p>
                      <div className="space-y-0.5">
                        {item.batchAllocations.map((alloc, j) => (
                          <div key={j} className="flex justify-between text-xs">
                            <span className="text-dark-500">
                              Batch #{String(alloc.batch).slice(-6)} — {alloc.quantity} unit{alloc.quantity !== 1 ? 's' : ''}
                            </span>
                            <span className="text-dark-400">
                              @ ৳{alloc.unitCost?.toLocaleString()} = ৳{(alloc.quantity * alloc.unitCost).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-dark-900/50 border border-dark-600 rounded-xl p-4 space-y-2">
              <div className="flex justify-between border-b border-dark-700 pb-2">
                <span className="font-semibold text-white">Grand Total</span>
                <span className="font-bold text-lg text-emerald-400">
                  ৳{showDetails.totalAmount?.toLocaleString()}
                </span>
              </div>
              {user?.role === 'admin' && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-500">Total Cost (FIFO)</span>
                    <span className="text-dark-300">৳{showDetails.totalCost?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-500">Profit</span>
                    <span className={`font-medium ${(showDetails.totalProfit || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      ৳{showDetails.totalProfit?.toLocaleString()}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-dark-500">Sold By</span>
                <span className="text-dark-300">{showDetails.soldBy?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-500">Date</span>
                <span className="text-dark-300">
                  {new Date(showDetails.saleDate).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button onClick={() => printInvoice(showDetails)} className="btn-secondary flex-1 flex items-center justify-center gap-2">
                <HiOutlinePrinter className="text-lg" /> Print Invoice
              </button>
              <button onClick={() => setShowDetails(null)} className="btn-secondary flex-1">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
