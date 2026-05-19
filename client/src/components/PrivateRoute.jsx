import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect super_admin away from company-internal routes
  if (user?.role === 'super_admin') {
    const allowedPaths = ['/super-admin', '/profile'];
    const isAllowed = allowedPaths.some((p) => location.pathname.startsWith(p));
    if (!isAllowed) {
      return <Navigate to="/super-admin" replace />;
    }
  }

  // Redirect super_admin if they try to access /dashboard
  if (user?.role === 'super_admin' && location.pathname === '/dashboard') {
    return <Navigate to="/super-admin" replace />;
  }

  return children;
};

export default PrivateRoute;
