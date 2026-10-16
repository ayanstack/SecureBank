import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getAccessToken } from '../services/api';

export const AdminRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, user, isInitializing } = useSelector((state) => state.auth);

  if (isInitializing && getAccessToken()) {
    return <LoadingSpinner fullScreen message="Authenticating administrative credentials..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-rose-200 p-8 text-center shadow-lg space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-9 h-9" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-brand-dark">403 — Administrative Access Restricted</h1>
            <p className="text-xs text-brand-muted leading-relaxed">
              Your account is registered with role <strong>CUSTOMER</strong>. You do not hold administrative privileges required to view or execute operations within this portal.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-dark hover:bg-brand-blue text-white text-xs font-bold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Customer Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminRoute;
