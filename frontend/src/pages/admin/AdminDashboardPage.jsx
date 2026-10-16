import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserX,
  ShieldAlert,
  Trash2,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Activity,
  AlertCircle,
} from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { useDispatch } from 'react-redux';
import { addToast } from '../../features/ui/uiSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const AdminDashboardPage = () => {
  const dispatch = useDispatch();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    deactivatedUsers: 0,
    customerCount: 0,
    adminCount: 0,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurging, setIsPurging] = useState(false);

  const fetchAdminStats = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/users?limit=50');
      if (res.data?.success) {
        const users = res.data.users || [];
        const total = res.data.pagination?.totalUsers || users.length;
        const active = users.filter((u) => u.isActive !== false).length;
        const deactivated = users.filter((u) => u.isActive === false).length;
        const customers = users.filter((u) => u.role === 'CUSTOMER').length;
        const admins = users.filter((u) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length;

        setStats({
          totalUsers: total,
          activeUsers: active,
          deactivatedUsers: deactivated,
          customerCount: customers,
          adminCount: admins,
        });
        setRecentUsers(users.slice(0, 5));
      }
    } catch (err) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Admin Sync Failed',
          message: getErrorMessage(err),
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const handlePurgeSessions = async () => {
    if (!window.confirm('Are you sure you want to purge all expired and revoked sessions from the database?')) {
      return;
    }

    setIsPurging(true);
    try {
      const res = await api.delete('/admin/sessions/purge');
      if (res.data?.success) {
        dispatch(
          addToast({
            type: 'success',
            title: 'Sessions Purged',
            message: `Cleaned up ${res.data.deletedCount ?? 0} expired/revoked sessions from database.`,
          })
        );
      }
    } catch (err) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Purge Failed',
          message: getErrorMessage(err),
        })
      );
    } finally {
      setIsPurging(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingSpinner message="Loading administrative metrics..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 select-none">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Security & Administration Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time audit telemetry, user status governance, and session health.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAdminStats}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Telemetry</span>
          </button>

          <button
            onClick={handlePurgeSessions}
            disabled={isPurging}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>{isPurging ? 'Purging...' : 'Purge Dead Sessions'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-2xl bg-[#1E293B] border border-slate-700/60 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Total Registered Users</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-3xl font-extrabold text-white tracking-tight">{stats.totalUsers}</p>
          <p className="text-[11px] text-slate-400">Authenticated customer database</p>
        </div>

        <div className="p-6 rounded-2xl bg-[#1E293B] border border-slate-700/60 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Active Accounts</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-400 tracking-tight">{stats.activeUsers}</p>
          <p className="text-[11px] text-slate-400">Clear to perform debit/credit</p>
        </div>

        <div className="p-6 rounded-2xl bg-[#1E293B] border border-slate-700/60 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Deactivated Accounts</span>
            <UserX className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-3xl font-extrabold text-rose-400 tracking-tight">{stats.deactivatedUsers}</p>
          <p className="text-[11px] text-slate-400">Restricted from banking login</p>
        </div>

        <div className="p-6 rounded-2xl bg-[#1E293B] border border-slate-700/60 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Admin Officers</span>
            <ShieldAlert className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-3xl font-extrabold text-purple-400 tracking-tight">{stats.adminCount}</p>
          <p className="text-[11px] text-slate-400">Hold administrative credentials</p>
        </div>
      </div>

      {/* Quick Recent Users Table */}
      <div className="p-6 rounded-2xl bg-[#1E293B] border border-slate-700/60 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Recent Customer Registrations</h2>
            <p className="text-xs text-slate-400">Latest active users in database</p>
          </div>
          <Link
            to="/admin/users"
            className="text-xs font-bold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
          >
            <span>View All Users</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="pb-3 font-semibold">User</th>
                <th className="pb-3 font-semibold">Email</th>
                <th className="pb-3 font-semibold">Phone</th>
                <th className="pb-3 font-semibold">Role</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {recentUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40">
                  <td className="py-3 font-semibold text-white">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="py-3 text-slate-300">{u.email}</td>
                  <td className="py-3 text-slate-400">{u.phone || 'N/A'}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3">
                    {u.isActive !== false ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        DEACTIVATED
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
