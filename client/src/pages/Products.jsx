import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import productService from '../services/productService';
import categoryService from '../services/categoryService';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineCube,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineX,
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineExclamation,
} from 'react-icons/hi';

const Products = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(searchParams.get('lowStock') === 'true');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const emptyForm = {
    name: '',
    sku: '',
    category: '',
    price: '',
    costPrice: '',
    quantity: '',
    minStockThreshold: '10',
    description: '',
    status: 'active',
  };

  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [search, filterCategory, filterStatus, filterLowStock, pagination.page]);

  const fetchCategories = async () => {
    try {
      const res = await categoryService.getCategories();
      setCategories(res.data);
    } catch {
      // Categories will just be empty
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = { page: pagination.page, limit: 15 };
      if (search) params.search = search;
      if (filterCategory) params.category = filterCategory;
      if (filterStatus) params.status = filterStatus;
      if (filterLowStock) params.lowStock = 'true';

      const res = await productService.getProducts(params);
      setProducts(res.data);
      setPagination((prev) => ({
        ...prev,
        pages: res.pages,
        total: res.total,
      }));
    } catch {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        sku: product.sku,
        category: product.category?._id || '',
        price: product.price,
        costPrice: product.costPrice,
        quantity: product.quantity,
        minStockThreshold: product.minStockThreshold,
        description: product.description || '',
        status: product.status,
      });
    } else {
      setEditingProduct(null);
      setFormData(emptyForm);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        costPrice: Number(formData.costPrice),
        quantity: Number(formData.quantity),
        minStockThreshold: Number(formData.minStockThreshold),
      };

      if (editingProduct) {
        await productService.updateProduct(editingProduct._id, payload);
        toast.success('Product updated successfully');
      } else {
        await productService.createProduct(payload);
        toast.success('Product created successfully');
      }
      closeModal();
      fetchProducts();
    } catch (error) {
      const msg = error.response?.data?.message || 'Something went wrong';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await productService.deleteProduct(id);
      toast.success('Product deleted');
      fetchProducts();
    } catch {
      toast.error('Failed to delete product');
    }
  };

  const handleToggleStatus = async (product) => {
    try {
      const newStatus = product.status === 'active' ? 'discontinued' : 'active';
      await productService.updateProduct(product._id, { status: newStatus });
      toast.success(`Product marked as ${newStatus}`);
      fetchProducts();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <HiOutlineCube className="text-primary-400" />
            Products
          </h1>
          <p className="text-dark-400 mt-1">
            Manage your inventory products ({pagination.total} total)
          </p>
        </div>
        {user?.role === 'admin' && (
          <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
            <HiOutlinePlus className="text-lg" />
            Add Product
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="input-field pl-10"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="input-field w-auto min-w-[160px]"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="input-field w-auto min-w-[140px]"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="discontinued">Discontinued</option>
          </select>
          <button
            onClick={() => {
              setFilterLowStock(!filterLowStock);
              setPagination((prev) => ({ ...prev, page: 1 }));
              // Update URL
              if (!filterLowStock) {
                setSearchParams({ lowStock: 'true' });
              } else {
                setSearchParams({});
              }
            }}
            className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all flex items-center gap-1.5 ${
              filterLowStock
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                : 'bg-dark-800 text-dark-400 border-dark-700 hover:border-dark-600'
            }`}
          >
            <HiOutlineExclamation className="text-base" />
            Low Stock
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <HiOutlineCube className="text-5xl text-dark-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-dark-300">No products found</h3>
            <p className="text-dark-500 mt-1">
              {search || filterCategory || filterStatus
                ? 'Try adjusting your filters'
                : 'Create your first product to get started'}
            </p>
            {!search && !filterCategory && !filterStatus && (
              <button
                onClick={() => openModal()}
                className="btn-primary mt-4 inline-flex items-center gap-2"
              >
                <HiOutlinePlus />
                Add Product
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-700">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700/50">
                  {products.map((product) => (
                    <tr
                      key={product._id}
                      className="hover:bg-dark-800/50 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-dark-700 rounded-lg flex items-center justify-center shrink-0">
                            <HiOutlineCube className="text-dark-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{product.name}</p>
                            {product.isLowStock && (
                              <span className="text-xs text-amber-400 flex items-center gap-1">
                                <HiOutlineExclamation className="text-sm" />
                                Low stock
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <code className="text-sm text-dark-300 bg-dark-700 px-2 py-0.5 rounded">
                          {product.sku}
                        </code>
                      </td>
                      <td className="py-3.5 px-4 text-dark-400 text-sm">
                        {product.category?.name || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <p className="text-white font-medium">
                          ৳{product.price?.toLocaleString()}
                        </p>
                        <p className="text-xs text-dark-500">
                          Cost: ৳{product.costPrice?.toLocaleString()}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`font-semibold ${
                            product.isLowStock
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {product.quantity}
                        </span>
                        <p className="text-xs text-dark-500">
                          Min: {product.minStockThreshold}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(product)}
                          className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                            product.status === 'active'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25'
                              : 'bg-dark-600/50 text-dark-400 border border-dark-500/20 hover:bg-dark-600'
                          }`}
                          title="Click to toggle status"
                        >
                          {product.status}
                        </button>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openModal(product)}
                            className="p-2 text-dark-400 hover:text-primary-400 hover:bg-primary-600/10 rounded-lg transition-all"
                            title="Edit"
                          >
                            <HiOutlinePencil className="text-lg" />
                          </button>
                          <button
                            onClick={() => handleDelete(product._id, product.name)}
                            className="p-2 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Delete"
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
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-dark-700">
                <p className="text-sm text-dark-400">
                  Page {pagination.page} of {pagination.pages} ({pagination.total} items)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                    }
                    disabled={pagination.page <= 1}
                    className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-30"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                    }
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          ></div>
          <div className="relative bg-dark-800 border border-dark-600 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                {editingProduct ? 'Edit Product' : 'New Product'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-all"
              >
                <HiOutlineX className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">
                  Product Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g. Wireless Mouse"
                />
              </div>

              {/* SKU + Category row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">
                    SKU <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="sku"
                    required
                    value={formData.sku}
                    onChange={handleChange}
                    className="input-field uppercase"
                    placeholder="e.g. WM-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">
                    Category <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">
                    Selling Price (৳) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">
                    Cost Price (৳) {!editingProduct && <span className="text-red-400">*</span>}
                  </label>
                  {editingProduct ? (
                    <div>
                      <input
                        type="number"
                        name="costPrice"
                        value={formData.costPrice}
                        readOnly
                        className="input-field opacity-60 cursor-not-allowed"
                      />
                      <p className="text-xs text-amber-400/80 mt-1 flex items-center gap-1">
                        <HiOutlineExclamation className="text-sm" />
                        Auto-calculated from batch costs
                      </p>
                    </div>
                  ) : (
                    <input
                      type="number"
                      name="costPrice"
                      required
                      min="0"
                      step="0.01"
                      value={formData.costPrice}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="0.00"
                    />
                  )}
                </div>
              </div>

              {/* Quantity row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">
                    Quantity {!editingProduct && <span className="text-red-400">*</span>}
                  </label>
                  {editingProduct ? (
                    <div>
                      <input
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        readOnly
                        className="input-field opacity-60 cursor-not-allowed"
                      />
                      <p className="text-xs text-amber-400/80 mt-1 flex items-center gap-1">
                        <HiOutlineExclamation className="text-sm" />
                        Managed through restocks & sales
                      </p>
                    </div>
                  ) : (
                    <input
                      type="number"
                      name="quantity"
                      required
                      min="0"
                      value={formData.quantity}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="0"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">
                    Min Stock Threshold
                  </label>
                  <input
                    type="number"
                    name="minStockThreshold"
                    min="0"
                    value={formData.minStockThreshold}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="10"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="active">Active</option>
                  <option value="discontinued">Discontinued</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="input-field resize-none"
                  rows={3}
                  placeholder="Optional product description"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : editingProduct ? (
                    'Update Product'
                  ) : (
                    'Create Product'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
