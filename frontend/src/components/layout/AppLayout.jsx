import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import MobileNav from './MobileNav';
import ToastContainer from '../common/ToastContainer';
import { fetchCurrentUser } from '../../features/auth/authSlice';
import { fetchAccounts } from '../../features/accounts/accountSlice';
import { fetchNotifications, addLiveNotification } from '../../features/notifications/notificationSlice';
import { addToast } from '../../features/ui/uiSlice';
import { initializeSocket, disconnectSocket } from '../../services/socket';

export const AppLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // Initial data hydration on login / app load
  useEffect(() => {
    if (isAuthenticated) {
      if (!user) {
        dispatch(fetchCurrentUser());
      }
      dispatch(fetchAccounts());
      dispatch(fetchNotifications());

      // Initialize Socket.IO connection for real-time alerts
      initializeSocket((notificationData) => {
        dispatch(addLiveNotification(notificationData));
        dispatch(
          addToast({
            type: 'info',
            title: notificationData.title || 'New Banking Alert',
            message: notificationData.message,
          })
        );
      });
    }

    return () => {
      disconnectSocket();
    };
  }, [dispatch, isAuthenticated, user]);

  // Global listener for session expired event from api.js interceptor
  useEffect(() => {
    const handleSessionExpired = () => {
      dispatch(
        addToast({
          type: 'warning',
          title: 'Session Expired',
          message: 'Your banking session has expired. Please sign in again.',
        })
      );
      navigate('/login');
    };

    window.addEventListener('sb:session_expired', handleSessionExpired);
    return () => window.removeEventListener('sb:session_expired', handleSessionExpired);
  }, [dispatch, navigate]);

  return (
    <div className="flex h-screen bg-[#081526] overflow-hidden text-[#F7FAFF]">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Navigation Drawer */}
      <MobileNav />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Toast Container */}
      <ToastContainer />
    </div>
  );
};

export default AppLayout;
