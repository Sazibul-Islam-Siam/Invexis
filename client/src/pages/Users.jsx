import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import userService from '../services/userService';
import {
  HiOutlineUsers,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineX,
  HiOutlineSearch,
  HiOutlineShieldCheck,
  HiOutlineTruck,
  HiOutlineUserCircle,
} from 'react-icons/hi';

const roleBadge = {
  admin: { label: 'Admin', className: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  staff: { label: 'Staff', className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  supplier: { label: 'Supplier', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
};

const roleIcon = {
  admin: HiOutlineShieldCheck,
  staff: HiOutlineUserCircle,
  supplier: HiOutlineTruck,
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [supplierCreationStep, setSupplierCreationStep] = useState(1);

  const emptyForm = { name: '', email: '', password: '', role: 'staff', isActive: true };
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, search, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = { page: pagination.page, limit: 15 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;

      const res = await userService.getUsers(params);
      setUsers(res.data);
      setPagination((prev) => ({
        ...prev,
        pages: res.pages,
        total: res.total,
      }));
    } catch {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setFormData(emptyForm);
    setSupplierCreationStep(1);
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      isActive: user.isActive,
    });
    setSupplierCreationStep(1);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setSupplierCreationStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Standard email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!editing && formData.role === 'supplier' && supplierCreationStep === 1) {
      setSubmitting(true);
      try {
        const res = await userService.checkEmail(formData.email);
        if (res.data.exists) {
          if (res.data.role === 'supplier') {
            const linkRes = await userService.createUser({ email: formData.email, role: 'supplier' });
            toast.success(linkRes.message || 'Supplier linked successfully');
            closeModal();
            fetchUsers();
          } else {
            toast.error('A user with this email already exists with a different role');
          }
        } else {
          setSupplierCreationStep(2);
        }
      } catch (error) {
        console.error('Check email error:', error);
        toast.error(error.response?.data?.message || error.message || 'Failed to check email');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    setSubmitting(true);

    try {
      if (editing) {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        await userService.updateUser(editing._id, updateData);
        toast.success('User updated successfully');
      } else {
        const res = await userService.createUser(formData);
        toast.success(res.message || 'User created successfully');
      }
      closeModal();
      fetchUsers();
    } catch (error) {
      const msg = error.response?.data?.message || 'Operation failed';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await userService.deleteUser(id);
      toast.success(res.message || 'User deleted');
      fetchUsers();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to delete user';
      toast.error(msg);
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await userService.updateUser(user._id, { isActive: !user.isActive });
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
      fetchUsers();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to update user';
      toast.error(msg);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <HiOutlineUsers className="text-primary-400" />
            Users
          </h1>
          <p className="text-dark-400 mt-1">Manage staff, supplier, and admin accounts</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <HiOutlinePlus className="text-lg" />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="input-field pl-10"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="input-field w-auto"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
            <option value="supplier">Supplier</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <HiOutlineUsers className="text-5xl text-dark-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-dark-300">No users found</h3>
            <p className="text-dark-500 mt-1">Create your first user to get started</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-700">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">User</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">Email</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">Role</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">Joined</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700/50">
                  {users.map((u) => {
                    const RoleIcon = roleIcon[u.role] || HiOutlineUserCircle;
                    const badge = roleBadge[u.role] || roleBadge.staff;
                    return (
                      <tr key={u._id} className="hover:bg-dark-800/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-primary-600/15 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-primary-400 uppercase">
                              {u.name?.charAt(0)}
                            </div>
                            <span className="font-medium text-white">{u.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-dark-400 text-sm">{u.email}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${badge.className}`}>
                            <RoleIcon className="text-sm" />
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleToggleActive(u)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                              u.isActive
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                                : 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25'
                            }`}
                          >
                            {u.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-dark-400 text-sm">
                          {new Date(u.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEdit(u)}
                              className="p-2 text-dark-400 hover:text-primary-400 hover:bg-primary-600/10 rounded-lg transition-all"
                              title="Edit user"
                            >
                              <HiOutlinePencil className="text-lg" />
                            </button>
                            <button
                              onClick={() => handleDelete(u._id)}
                              className="p-2 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                              title="Delete user"
                            >
                              <HiOutlineTrash className="text-lg" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-dark-700">
                <p className="text-sm text-dark-400">
                  Page {pagination.page} of {pagination.pages} ({pagination.total} users)
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="relative bg-dark-800 border border-dark-600 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                {editing ? 'Edit User' : 'Create New User'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-all"
              >
                <HiOutlineX className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Supplier link hint */}
              {!editing && formData.role === 'supplier' && supplierCreationStep === 1 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                  <p className="text-xs text-amber-400">
                    Enter the supplier's email first. If they exist on the platform, we'll link their account. Otherwise, we'll ask for their name and password to create a new one.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => {
                    setFormData({ ...formData, role: e.target.value });
                    setSupplierCreationStep(1);
                  }}
                  className="input-field"
                  disabled={editing || (formData.role === 'supplier' && supplierCreationStep === 2)}
                >
                  <option value="staff">Staff</option>
                  <option value="supplier">Supplier</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                  placeholder="user@invexis.com"
                  disabled={!editing && formData.role === 'supplier' && supplierCreationStep === 2}
                />
              </div>

              {(editing || formData.role !== 'supplier' || supplierCreationStep === 2) && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1.5">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-field"
                      placeholder="e.g. John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1.5">
                      Password {!editing && <span className="text-red-400">*</span>}
                      {editing && <span className="text-dark-500 text-xs ml-1">(leave blank to keep current)</span>}
                    </label>
                    <input
                      type="password"
                      required={!editing}
                      minLength={6}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="input-field"
                      placeholder={editing ? '••••••••' : 'Min 6 characters'}
                    />
                  </div>
                </>
              )}

              {editing && (
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-dark-600 peer-focus:ring-2 peer-focus:ring-primary-500/30 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-dark-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600 peer-checked:after:bg-white"></div>
                    <span className="ml-3 text-sm text-dark-300">
                      Account {formData.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </label>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : editing ? (
                    'Update User'
                  ) : !editing && formData.role === 'supplier' && supplierCreationStep === 1 ? (
                    'Check & Continue'
                  ) : (
                    'Create User'
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

export default Users;
