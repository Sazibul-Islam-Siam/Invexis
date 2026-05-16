import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword, signOut, sendEmailVerification } from 'firebase/auth';
import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineUser,
  HiOutlineOfficeBuilding,
  HiOutlineEye,
  HiOutlineEyeOff,
} from 'react-icons/hi';

const Register = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    try {
      // 1. Register company + user on the backend
      await axios.post('/api/auth/register-company', {
        companyName: formData.companyName,
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      // 2. Sign in temporarily to send Firebase's built-in verification email
      //    (this uses Google's servers — no SMTP needed on our backend)
      const credential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      await sendEmailVerification(credential.user);
      await signOut(auth); // sign out immediately — they can't use the app until verified

      toast.success('Company registered! Check your email for the verification link.');
      navigate('/login');
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const inputFields = [
    { name: 'companyName', label: 'Company Name', icon: HiOutlineOfficeBuilding, type: 'text', placeholder: 'Your Company Inc.' },
    { name: 'name', label: 'Your Full Name', icon: HiOutlineUser, type: 'text', placeholder: 'John Doe' },
    { name: 'email', label: 'Email Address', icon: HiOutlineMail, type: 'email', placeholder: 'john@company.com' },
    { name: 'password', label: 'Password', icon: HiOutlineLockClosed, type: showPassword ? 'text' : 'password', placeholder: '••••••••', hasToggle: true },
    { name: 'confirmPassword', label: 'Confirm Password', icon: HiOutlineLockClosed, type: showPassword ? 'text' : 'password', placeholder: '••••••••' },
  ];

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600/20 rounded-2xl mb-4 border border-primary-500/30">
            <svg className="w-7 h-7 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Create Your Company</h1>
          <p className="text-dark-400 mt-1">Start managing your inventory today</p>
        </div>

        {/* Form */}
        <div className="bg-dark-900/50 backdrop-blur-xl rounded-2xl p-8 border border-dark-800/50 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {inputFields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">{field.label}</label>
                <div className="relative">
                  <field.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-dark-800/50 border border-dark-700/50 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
                  />
                  {field.hasToggle && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300"
                    >
                      {showPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {isLoading ? 'Creating Company...' : 'Register Company'}
            </button>
          </form>

          <p className="text-center text-dark-400 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
