import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { auth } from '../config/firebase';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import {
  HiOutlineUserCircle,
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineShieldCheck,
  HiOutlineCamera,
} from 'react-icons/hi';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', email: user.email || '' });
    }
  }, [user]);

  const getAuthConfig = () => ({
    headers: { Authorization: `Bearer ${user?.firebaseToken}` },
  });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.put('/api/profile', form, getAuthConfig());
      const updated = {
        ...user,
        name: res.data.data.name,
        email: res.data.data.email,
        profilePicture: res.data.data.profilePicture || user.profilePicture,
      };
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      return toast.error('Image must be smaller than 2MB');
    }

    const formData = new FormData();
    formData.append('avatar', file);

    setUploadingAvatar(true);
    try {
      const res = await axios.post('/api/profile/avatar', formData, {
        headers: {
          Authorization: `Bearer ${user?.firebaseToken}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      const updated = { ...user, profilePicture: res.data.data.profilePicture };
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      toast.success('Profile picture updated!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload picture');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    if (passwordForm.newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setChangingPassword(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Re-authenticate user first before changing password
      const credential = EmailAuthProvider.credential(user.email, passwordForm.currentPassword);
      await reauthenticateWithCredential(currentUser, credential);

      // Update password
      await updatePassword(currentUser, passwordForm.newPassword);
      
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Password change error:', error);
      let message = 'Failed to change password';
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = 'Incorrect current password';
      } else if (error.message) {
        message = error.message;
      }
      toast.error(message);
    } finally {
      setChangingPassword(false);
    }
  };

  const roleBadge = {
    admin: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    staff: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    supplier: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    super_admin: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  };

  const roleLabel = {
    admin: 'Admin', staff: 'Staff', supplier: 'Supplier', super_admin: 'Super Admin',
  };

  const avatarUrl = user?.profilePicture
    ? (user.profilePicture.startsWith('http') ? user.profilePicture : `${API_BASE}${user.profilePicture}`)
    : null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <HiOutlineUserCircle className="text-primary-400" />
          My Profile
        </h1>
        <p className="text-dark-400 mt-1">Manage your account settings</p>
      </div>

      {/* Profile Card */}
      <div className="card mb-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-dark-700">
          {/* Avatar with upload */}
          <div className="relative group">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user?.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-dark-600"
              />
            ) : (
              <div className="w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              {uploadingAvatar ? (
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
              ) : (
                <HiOutlineCamera className="text-2xl text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{user?.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-dark-400">{user?.email}</span>
              <span className={`px-2 py-0.5 rounded-lg text-xs font-medium border ${roleBadge[user?.role] || ''}`}>
                {roleLabel[user?.role] || user?.role}
              </span>
            </div>
            <p className="text-xs text-dark-500 mt-1">Click on avatar to change photo</p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5 flex items-center gap-1.5">
              <HiOutlineUserCircle className="text-dark-400" /> Full Name
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5 flex items-center gap-1.5">
              <HiOutlineMail className="text-dark-400" /> Email
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5 flex items-center gap-1.5">
              <HiOutlineShieldCheck className="text-dark-400" /> Role
            </label>
            <input
              type="text"
              disabled
              value={roleLabel[user?.role] || user?.role}
              className="input-field opacity-50 cursor-not-allowed capitalize"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center justify-center gap-2 w-full"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              'Save Changes'
            )}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <HiOutlineLockClosed className="text-primary-400" />
          Change Password
        </h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Current Password</label>
            <input
              type="password"
              required
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="input-field"
              placeholder="Enter current password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="input-field"
              placeholder="Min 6 characters"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Confirm New Password</label>
            <input
              type="password"
              required
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="input-field"
              placeholder="Re-enter new password"
            />
          </div>
          <button
            type="submit"
            disabled={changingPassword}
            className="btn-secondary flex items-center justify-center gap-2 w-full"
          >
            {changingPassword ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-400"></div>
            ) : (
              'Change Password'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
