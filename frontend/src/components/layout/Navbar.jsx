import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Menu,
  Bell,
  User,
  Shield,
  LogOut,
  ChevronDown,
  CheckCircle2,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { toggleMobileSidebar } from '../../features/ui/uiSlice';
import { logoutUser } from '../../features/auth/authSlice';
import { markNotificationAsRead } from '../../features/notifications/notificationSlice';
import { getInitials, formatDateTime } from '../../utils/formatters';

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const user = useSelector((state) => state.auth.user);
  const { notifications, unreadCount } = useSelector((state) => state.notifications);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute page title from route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'Dashboard Overview';
    if (path.startsWith('/accounts')) return 'My Bank Accounts';
    if (path.startsWith('/transfer')) return 'Funds Transfer (IMPS/NEFT)';
    if (path.startsWith('/beneficiaries')) return 'Manage Beneficiaries';
    if (path.startsWith('/transactions')) return 'Transaction Activity';
    if (path.startsWith('/statements')) return 'Account Statements';
    if (path.startsWith('/notifications')) return 'Security & Alerts';
    if (path.startsWith('/profile')) return 'Profile & Security Settings';
    return 'SecureBank Online';
  };

  const handleLogout = async () => {
    setIsProfileOpen(false);
    await dispatch(logoutUser());
    navigate('/login');
  };

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) {
      dispatch(markNotificationAsRead(notif.id || notif._id));
    }
    setIsNotifOpen(false);
    navigate('/notifications');
  };

  return (
    <header className="h-16 bg-[#0B1F3A] border-b border-[#1E4578] sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 shadow-md text-[#F7FAFF]">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => dispatch(toggleMobileSidebar())}
          className="lg:hidden p-2 rounded-lg text-[#94B4DB] hover:text-[#F7FAFF] hover:bg-[#12325E] focus:outline-none"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-[#F7FAFF] leading-tight">
            {getPageTitle()}
          </h1>
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#94B4DB]">
            <Shield className="w-3 h-3 text-[#10B981]" />
            <span>256-Bit SSL Encrypted Banking Session</span>
          </div>
        </div>
      </div>

      {/* Right: Notifications & Profile Dropdown */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-xl text-[#94B4DB] hover:text-[#F7FAFF] hover:bg-[#12325E] transition-colors focus:outline-none"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#D62839] text-[9px] font-bold text-white ring-2 ring-[#0B1F3A]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#0D274D] shadow-2xl border border-[#1E4578] py-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-[#F7FAFF]">
              <div className="px-4 py-2.5 border-b border-[#1E4578] flex items-center justify-between">
                <span className="text-sm font-bold text-[#F7FAFF]">Alerts & Notifications</span>
                <span className="text-[11px] text-[#D62839] font-bold">
                  {unreadCount} Unread
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-[#1E4578]">
                {notifications && notifications.length > 0 ? (
                  notifications.slice(0, 5).map((notif) => (
                    <div
                      key={notif.id || notif._id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3.5 hover:bg-[#12325E] cursor-pointer transition-colors ${
                        !notif.isRead ? 'bg-[#163B6E]/40' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-[#F7FAFF]">{notif.title}</p>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#D62839] flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-[#94B4DB] mt-0.5 line-clamp-2">{notif.message}</p>
                      <span className="text-[10px] text-[#628CBF] mt-1 block">
                        {formatDateTime(notif.createdAt)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-[#94B4DB]">
                    No new notifications
                  </div>
                )}
              </div>

              <div className="p-2 border-t border-[#1E4578] bg-[#081526]/60 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsNotifOpen(false);
                    navigate('/notifications');
                  }}
                  className="text-xs font-semibold text-[#D62839] hover:underline inline-flex items-center gap-1"
                >
                  View All Notifications <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[#12325E] transition-colors focus:outline-none"
            aria-label="User menu"
          >
            <div className="w-8 h-8 rounded-full bg-[#D62839] flex items-center justify-center text-xs font-bold text-white shadow-sm">
              {getInitials(user?.firstName, user?.lastName)}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-[#F7FAFF] leading-none">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Customer'}
              </p>
              <p className="text-[10px] text-[#94B4DB] mt-0.5">{user?.role || 'Customer'}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-[#94B4DB] hidden sm:block" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0D274D] shadow-2xl border border-[#1E4578] py-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-[#F7FAFF]">
              <div className="px-4 py-2.5 border-b border-[#1E4578]">
                <p className="text-xs font-bold text-[#F7FAFF] truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[11px] text-[#94B4DB] truncate">{user?.email}</p>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/profile');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#F7FAFF] hover:bg-[#12325E]"
                >
                  <User className="w-4 h-4 text-[#94B4DB]" />
                  <span>My Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/profile?tab=security');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#F7FAFF] hover:bg-[#12325E]"
                >
                  <Lock className="w-4 h-4 text-[#94B4DB]" />
                  <span>Security & PIN</span>
                </button>

                {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate('/admin');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-[#D62839] hover:bg-[#12325E]"
                  >
                    <Shield className="w-4 h-4 text-[#D62839]" />
                    <span>Admin Console</span>
                  </button>
                )}
              </div>

              <div className="border-t border-[#1E4578] pt-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-[#D62839] hover:bg-[#D62839]/10"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
