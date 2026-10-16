import React, { useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  X,
  LayoutDashboard,
  CreditCard,
  Send,
  Users,
  Receipt,
  FileText,
  Bell,
  UserCheck,
  LogOut,
  ShieldAlert,
} from 'lucide-react';
import { setMobileSidebarOpen } from '../../features/ui/uiSlice';
import { logoutUser } from '../../features/auth/authSlice';
import Logo from '../common/Logo';
import { getInitials } from '../../utils/formatters';

export const MobileNav = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const isOpen = useSelector((state) => state.ui.isMobileSidebarOpen);
  const user = useSelector((state) => state.auth.user);
  const unreadCount = useSelector((state) => state.notifications.unreadCount);

  // Close mobile nav on route change
  useEffect(() => {
    if (isOpen) {
      dispatch(setMobileSidebarOpen(false));
    }
  }, [location.pathname, dispatch]);

  if (!isOpen) return null;

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Accounts', path: '/accounts', icon: CreditCard },
    { label: 'Fund Transfer', path: '/transfer', icon: Send },
    { label: 'Beneficiaries', path: '/beneficiaries', icon: Users },
    { label: 'Transactions', path: '/transactions', icon: Receipt },
    { label: 'Statements', path: '/statements', icon: FileText },
    {
      label: 'Notifications',
      path: '/notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : null,
    },
    { label: 'Profile & Security', path: '/profile', icon: UserCheck },
    ...(isAdmin ? [{ label: 'Admin Portal', path: '/admin', icon: ShieldAlert, isAdmin: true }] : []),
  ];

  const handleLogout = async () => {
    dispatch(setMobileSidebarOpen(false));
    await dispatch(logoutUser());
    navigate('/login');
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm transition-opacity"
        onClick={() => dispatch(setMobileSidebarOpen(false))}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-brand-dark text-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/10">
          <Logo variant="light" size="default" />
          <button
            type="button"
            onClick={() => dispatch(setMobileSidebarOpen(false))}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 focus:outline-none"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-blue flex items-center justify-center text-sm font-bold text-white shadow-sm flex-shrink-0">
              {getInitials(user?.firstName, user?.lastName)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Customer'}
              </p>
              <p className="text-xs text-white/60 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-blue text-white shadow-md'
                      : 'text-white/75 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto px-1.5 py-0.5 min-w-[20px] text-center font-bold text-[10px] rounded-full bg-brand-accent text-white">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-brand-accent/20 text-red-200 hover:bg-brand-accent hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileNav;
