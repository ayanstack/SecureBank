import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Shield,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  KeyRound,
} from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { useDispatch, useSelector } from 'react-redux';
import { addToast } from '../../features/ui/uiSlice';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDateTime } from '../../utils/formatters';

export const AdminUsersPage = () => {
  const dispatch = useDispatch();
  const currentAdmin = useSelector((state) => state.auth.user);

  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'fraud'
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [isFraudLoading, setIsFraudLoading] = useState(false);
  const [reviewModalAlert, setReviewModalAlert] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    limit: 15,
    totalUsers: 0,
    totalPages: 1,
  });

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Detail Modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const fetchUsers = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('limit', pagination.limit);
      if (search.trim()) params.set('search', search.trim());
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter) params.set('isActive', statusFilter);

      const res = await api.get(`/admin/users?${params.toString()}`);
      if (res.data?.success) {
        setUsers(res.data.users || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Failed to Fetch Users',
          message: getErrorMessage(err),
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFraudAlerts = async () => {
    setIsFraudLoading(true);
    try {
      const res = await api.get('/admin/fraud-alerts');
      if (res.data?.success) {
        setFraudAlerts(res.data.alerts || []);
      }
    } catch (err) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Failed to Fetch Fraud Alerts',
          message: getErrorMessage(err),
        })
      );
    } finally {
      setIsFraudLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'fraud') {
      fetchFraudAlerts();
    }
  }, [activeTab]);

  const handleReviewFraudAlert = async (status) => {
    if (!reviewModalAlert) return;
    setIsSubmittingReview(true);
    try {
      const res = await api.patch(`/admin/fraud-alerts/${reviewModalAlert._id}`, {
        status,
        resolutionNotes: reviewNotes.trim() || `Reviewed and marked as ${status} by Admin`,
      });
      if (res.data?.success) {
        dispatch(
          addToast({
            type: 'success',
            title: 'Fraud Alert Updated',
            message: `Alert marked as ${status}`,
          })
        );
        setReviewModalAlert(null);
        setReviewNotes('');
        fetchFraudAlerts();
      }
    } catch (err) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Review Action Failed',
          message: getErrorMessage(err),
        })
      );
    } finally {
      setIsSubmittingReview(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const handleToggleStatus = async (user) => {
    const isActivating = user.isActive === false;
    const actionText = isActivating ? 'reactivate' : 'deactivate';

    if (!window.confirm(`Are you sure you want to ${actionText} the account for ${user.firstName} ${user.lastName}?`)) {
      return;
    }

    setActionLoadingId(user.id);
    try {
      const endpoint = isActivating
        ? `/admin/users/${user.id}/reactivate`
        : `/admin/users/${user.id}/deactivate`;

      const res = await api.patch(endpoint);
      if (res.data?.success) {
        dispatch(
          addToast({
            type: 'success',
            title: `User ${isActivating ? 'Reactivated' : 'Deactivated'}`,
            message: res.data.message || 'Status updated successfully.',
          })
        );
        // Refresh table
        fetchUsers(pagination.currentPage);
      }
    } catch (err) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Operation Failed',
          message: getErrorMessage(err),
        })
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleViewDetails = async (userId) => {
    setIsLoadingDetails(true);
    setSelectedUser(null);
    try {
      const res = await api.get(`/admin/users/${userId}`);
      if (res.data?.success) {
        setSelectedUser(res.data.user);
      }
    } catch (err) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Failed to Load User Details',
          message: getErrorMessage(err),
        })
      );
    } finally {
      setIsLoadingDetails(false);
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header with Module Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Admin Security & Operational Governance</h1>
          <p className="text-xs text-slate-400 mt-1">
            Review live accounts, investigate rule-based fraud anomalies, and configure user permissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Module Selector Tabs */}
          <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'users'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Customer Directory
            </button>
            <button
              onClick={() => setActiveTab('fraud')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'fraud'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Suspicious Activity ({fraudAlerts.length})</span>
            </button>
          </div>

          <button
            onClick={() => (activeTab === 'users' ? fetchUsers(pagination.currentPage) : fetchFraudAlerts())}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {activeTab === 'fraud' ? (
        /* Fraud Alerts Review View */
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#1E293B] border border-slate-700/60 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Rule-Based Anomaly & Risk Detection Alerts</h2>
              <p className="text-xs text-slate-400">
                Explainable security checks: High-value transfers (₹50k+), velocity spikes, and repeated PIN failures.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {fraudAlerts.filter((a) => a.status === 'PENDING_REVIEW').length} Pending Reviews
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#1E293B] border border-slate-700/60 shadow-sm overflow-hidden">
            {isFraudLoading ? (
              <div className="py-12">
                <LoadingSpinner message="Scanning fraud alerts..." />
              </div>
            ) : fraudAlerts.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
                <p className="text-sm font-semibold">No fraud alerts detected</p>
                <p className="text-xs text-slate-500">All customer fund transfers are within normal risk parameters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="pb-3 px-3 font-semibold">Risk Alert</th>
                      <th className="pb-3 px-3 font-semibold">Target User</th>
                      <th className="pb-3 px-3 font-semibold">Severity</th>
                      <th className="pb-3 px-3 font-semibold">Anomaly Details</th>
                      <th className="pb-3 px-3 font-semibold">Review Status</th>
                      <th className="pb-3 px-3 font-semibold">Detected At</th>
                      <th className="pb-3 px-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {fraudAlerts.map((alert) => (
                      <tr key={alert._id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-3 font-semibold text-white">
                          <span className="font-mono text-xs text-rose-400">{alert.alertType}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-200">
                          {alert.user ? `${alert.user.firstName} ${alert.user.lastName}` : 'System / External'}
                          <span className="block text-[10px] text-slate-400">{alert.user?.email}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              alert.severity === 'CRITICAL'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : alert.severity === 'HIGH'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {alert.severity}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-300 max-w-xs">{alert.description}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              alert.status === 'PENDING_REVIEW'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : alert.status === 'CONFIRMED_FRAUD'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {alert.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400 text-[11px]">{formatDateTime(alert.createdAt)}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              setReviewModalAlert(alert);
                              setReviewNotes(alert.resolutionNotes || '');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
                          >
                            Review Alert
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Customer Directory View */
        <div className="space-y-4">
      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-[#1E293B] border border-slate-700/60 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="w-full md:w-80 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Roles</option>
            <option value="CUSTOMER">Customer</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Deactivated Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="p-4 rounded-2xl bg-[#1E293B] border border-slate-700/60 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-12">
            <LoadingSpinner message="Querying customer database..." />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <Users className="w-8 h-8 mx-auto text-slate-500" />
            <p className="text-sm font-semibold">No matching customer records found</p>
            <p className="text-xs text-slate-500">Try adjusting your search criteria or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 px-3 font-semibold">Customer</th>
                  <th className="pb-3 px-3 font-semibold">Contact Email</th>
                  <th className="pb-3 px-3 font-semibold">Phone</th>
                  <th className="pb-3 px-3 font-semibold">Role</th>
                  <th className="pb-3 px-3 font-semibold">Status</th>
                  <th className="pb-3 px-3 font-semibold">Email Verified</th>
                  <th className="pb-3 px-3 font-semibold text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {users.map((u) => {
                  const isCurrentAdmin = u.id === currentAdmin?.id || u.email === currentAdmin?.email;
                  const isLoadingAction = actionLoadingId === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-semibold text-white">
                        {u.firstName} {u.lastName}
                      </td>
                      <td className="py-3 px-3 text-slate-300">{u.email}</td>
                      <td className="py-3 px-3 text-slate-400">{u.phone || 'N/A'}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-3">
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
                      <td className="py-3 px-3">
                        {u.isEmailVerified ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                          </span>
                        ) : (
                          <span className="text-amber-400 font-semibold">Unverified</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right space-x-2">
                        <button
                          onClick={() => handleViewDetails(u.id)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                          title="View Full Profile Details"
                        >
                          Details
                        </button>

                        {!isCurrentAdmin ? (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={isLoadingAction}
                            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors disabled:opacity-50 ${
                              u.isActive !== false
                                ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30'
                                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {isLoadingAction
                              ? 'Saving...'
                              : u.isActive !== false
                              ? 'Deactivate'
                              : 'Reactivate'}
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">Self</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="pt-4 border-t border-slate-700 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalUsers} total records)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchUsers(pagination.currentPage - 1)}
                disabled={!pagination.hasPreviousPage}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchUsers(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <Modal
          isOpen={Boolean(selectedUser)}
          onClose={() => setSelectedUser(null)}
          title={`Customer Profile: ${selectedUser.firstName} ${selectedUser.lastName}`}
          size="md"
        >
          <div className="space-y-4 text-xs text-brand-dark">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-brand-bg border border-brand-border">
              <div>
                <span className="text-brand-muted block font-semibold">Customer ID</span>
                <span className="font-mono">{selectedUser._id}</span>
              </div>
              <div>
                <span className="text-brand-muted block font-semibold">Email Address</span>
                <span>{selectedUser.email}</span>
              </div>
              <div>
                <span className="text-brand-muted block font-semibold">Registered Phone</span>
                <span>{selectedUser.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-brand-muted block font-semibold">Assigned Role</span>
                <span className="font-bold text-brand-blue">{selectedUser.role}</span>
              </div>
              <div>
                <span className="text-brand-muted block font-semibold">Transaction PIN</span>
                <span>{selectedUser.isTransactionPinSet ? 'Configured' : 'Not Set'}</span>
              </div>
              <div>
                <span className="text-brand-muted block font-semibold">Registration Date</span>
                <span>{formatDateTime(selectedUser.createdAt)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 rounded-xl bg-brand-dark text-white text-xs font-bold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Review Fraud Alert Modal */}
      {reviewModalAlert && (
        <Modal
          isOpen={Boolean(reviewModalAlert)}
          onClose={() => setReviewModalAlert(null)}
          title={`Review Anomaly: ${reviewModalAlert.alertType}`}
          size="md"
        >
          <div className="space-y-4 text-xs text-brand-dark">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-400">Severity: {reviewModalAlert.severity}</span>
                <span className="text-[10px] text-slate-400">{formatDateTime(reviewModalAlert.createdAt)}</span>
              </div>
              <p className="text-xs text-slate-300">{reviewModalAlert.description}</p>
              {reviewModalAlert.user && (
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  Target Account Owner: <strong className="text-white">{reviewModalAlert.user.firstName} {reviewModalAlert.user.lastName}</strong> ({reviewModalAlert.user.email})
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Resolution & Audit Notes</label>
              <textarea
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Enter investigation findings, rationale, or officer notes..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-rose-600"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => handleReviewFraudAlert('DISMISSED')}
                disabled={isSubmittingReview}
                className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs"
              >
                Dismiss False Positive
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleReviewFraudAlert('CLEARED')}
                  disabled={isSubmittingReview}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  Clear & Authorize
                </button>
                <button
                  type="button"
                  onClick={() => handleReviewFraudAlert('CONFIRMED_FRAUD')}
                  disabled={isSubmittingReview}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                >
                  Confirm Fraud
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminUsersPage;
