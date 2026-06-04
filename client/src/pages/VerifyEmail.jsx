import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineMail } from 'react-icons/hi';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await axios.get(`/api/auth/verify-email/${token}`);
        setStatus('success');
        setMessage(res.data.message || 'Email verified successfully!');
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Verification failed. Link may be expired.');
      }
    };
    if (token) verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-100/50 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-200/40 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        <div className="card text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500 mx-auto mb-6"></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying your email...</h2>
              <p className="text-gray-500">Please wait a moment.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <HiOutlineCheckCircle className="text-5xl text-emerald-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Email Verified!</h2>
              <p className="text-gray-500 mb-6">{message}</p>
              <button
                onClick={() => navigate('/login')}
                className="btn-primary w-full"
              >
                Go to Login
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <HiOutlineXCircle className="text-5xl text-red-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Verification Failed</h2>
              <p className="text-gray-500 mb-6">{message}</p>
              <button
                onClick={() => navigate('/login')}
                className="btn-secondary w-full"
              >
                Back to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
