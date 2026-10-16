import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  LayoutDashboard,
  CreditCard,
  Send,
  Users,
  Receipt,
  FileText,
  Bell,
  UserCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  BarChart3,
  Target,
  LifeBuoy,
} from 'lucide-react';
import { toggleSidebar } from '../../features/ui/uiSlice';
import { logoutUser } from '../../features/auth/authSlice';
import Logo from '../common/Logo';
import { getInitials } from '../../utils/formatters';

export const Sidebar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isCollapsed = useSelector((state) => state.ui.isSidebarCollapsed);
  const unreadCount = useSelector((state) => state.notifications.unreadCount);
  const user = useSelector((state) => state.auth.user);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Accounts', path: '/accounts', icon: CreditCard },
    { label: 'Fund Transfer', path: '/transfer', icon: Send },
    { label: 'Beneficiaries', path: '/beneficiaries', icon: Users },
    { label: 'Transactions', path: '/transactions', icon: Receipt },
    { label: 'Statements', path: '/statements', icon: FileText },
    { label: 'AI Assistant', path: '/ai-assistant', icon: Sparkles },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Smart Savings', path: '/savings', icon: Target },
    { label: '24x7 Support', path: '/support', icon: LifeBuoy },
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
    await dispatch(logoutUser());
    navigate('/login');
  };

  return (
    <aside
      className={`hidden lg:flex flex-col bg-[#0B1F3A] text-[#F7FAFF] border-r border-[#1E4578] transition-all duration-300 select-none z-30 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#1E4578]">
        {!isCollapsed ? (
          <Logo variant="light" size="default" />
        ) : (
          <div className="mx-auto">
            <Logo variant="light" size="sm" className="[&>div:last-child]:hidden" />
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 group relative ${
                  isActive
                    ? 'bg-[#D62839] text-white shadow-glow-red font-semibold'
                    : 'text-[#94B4DB] hover:bg-[#12325E] hover:text-[#F7FAFF]'
                } ${isCollapsed ? 'justify-center px-0' : ''}`
              }
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}

              {/* Unread badge */}
              {item.badge && (
                <span
                  className={`flex items-center justify-center font-bold text-[10px] rounded-full bg-[#D62839] text-white ${
                    isCollapsed
                      ? 'absolute top-1.5 right-2 w-4 h-4'
                      : 'ml-auto px-1.5 py-0.5 min-w-[20px]'
                  }`}
                >
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Status & Logout */}
      <div className="p-3 border-t border-white/10 bg-black/10">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 mb-2">
            <div className="w-9 h-9 rounded-full bg-brand-blue flex items-center justify-center text-xs font-bold text-white shadow-sm flex-shrink-0">
              {getInitials(user?.firstName, user?.lastName)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Customer'}
              </p>
              <p className="text-[10px] text-white/60 truncate">{user?.email || 'Secure User'}</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center mb-2">
            <div
              className="w-9 h-9 rounded-full bg-brand-blue flex items-center justify-center text-xs font-bold text-white shadow-sm"
              title={`${user?.firstName || ''} ${user?.lastName || ''}`}
            >
              {getInitials(user?.firstName, user?.lastName)}
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-white/75 hover:bg-brand-accent/20 hover:text-white transition-colors duration-150 ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
          title="Sign Out"
        >
          <LogOut className="w-4 h-4 text-brand-accent flex-shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>

        {/* Sidebar Collapse Toggle */}
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="w-full mt-2 flex items-center justify-center py-1 text-white/40 hover:text-white transition-colors text-xs"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
