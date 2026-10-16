import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Bell,
  CheckCheck,
  Trash2,
  CheckCircle2,
  ShieldAlert,
  Info,
  CreditCard,
  Send,
  AlertTriangle,
} from 'lucide-react';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '../../features/notifications/notificationSlice';
import { addToast } from '../../features/ui/uiSlice';
import { formatDateTime } from '../../utils/formatters';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const NotificationsPage = () => {
  const dispatch = useDispatch();
  const { notifications, unreadCount, isLoading } = useSelector(
    (state) => state.notifications
  );

  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'unread' | 'read'

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleMarkAsRead = (id) => {
    dispatch(markNotificationAsRead(id));
  };

  const handleMarkAllRead = async () => {
    const result = await dispatch(markAllNotificationsAsRead());
    if (markAllNotificationsAsRead.fulfilled.match(result)) {
      dispatch(
        addToast({
          type: 'success',
          title: 'All Caught Up',
          message: 'All notifications marked as read.',
        })
      );
    }
  };

  const handleDelete = (id) => {
    dispatch(deleteNotification(id));
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'unread') return !n.isRead;
    if (activeFilter === 'read') return n.isRead;
    return true;
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'SECURITY':
      case 'AUTH':
        return <ShieldAlert className="w-5 h-5 text-amber-500" />;
      case 'TRANSFER':
        return <Send className="w-5 h-5 text-brand-blue" />;
      case 'ACCOUNT':
        return <CreditCard className="w-5 h-5 text-brand-dark" />;
      default:
        return <Info className="w-5 h-5 text-brand-blue" />;
    }
  };

  return (
    <div className="space-y-6 select-none max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold text-brand-dark tracking-tight">
              Security & Banking Alerts
            </h2>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-accent text-white">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-xs text-brand-muted mt-0.5">
            Real-time updates regarding your account activities, logins, and transfers.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            icon={CheckCheck}
            className="text-xs"
          >
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1 bg-white rounded-xl border border-brand-border w-fit shadow-sm">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeFilter === 'all'
              ? 'bg-brand-blue text-white shadow-sm'
              : 'text-brand-muted hover:text-brand-dark'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('unread')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeFilter === 'unread'
              ? 'bg-brand-blue text-white shadow-sm'
              : 'text-brand-muted hover:text-brand-dark'
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('read')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeFilter === 'read'
              ? 'bg-brand-blue text-white shadow-sm'
              : 'text-brand-muted hover:text-brand-dark'
          }`}
        >
          Read ({Math.max(0, notifications.length - unreadCount)})
        </button>
      </div>

      {/* Notification Items List */}
      <Card>
        <CardContent className="p-0">
          {isLoading && notifications.length === 0 ? (
            <LoadingSpinner message="Checking for alerts..." />
          ) : filteredNotifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title={
                activeFilter === 'unread'
                  ? 'No unread alerts'
                  : 'You have no alerts'
              }
              description={
                activeFilter === 'unread'
                  ? 'You are all caught up with your banking notifications.'
                  : 'Security alerts and transaction updates will appear here in real time.'
              }
              className="m-6"
            />
          ) : (
            <div className="divide-y divide-brand-border">
              {filteredNotifications.map((notif) => {
                const notifId = notif.id || notif._id;
                return (
                  <div
                    key={notifId}
                    className={`p-4 sm:p-5 flex items-start gap-4 transition-colors ${
                      !notif.isRead ? 'bg-blue-50/50 hover:bg-blue-50/80' : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="p-2.5 rounded-xl bg-white border border-brand-border shadow-sm flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notif.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-brand-dark truncate">
                          {notif.title}
                        </h4>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-brand-blue flex-shrink-0" />
                        )}
                        <span className="ml-auto text-[10px] text-brand-muted whitespace-nowrap">
                          {formatDateTime(notif.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs text-brand-text/90 mt-1 leading-relaxed">
                        {notif.message}
                      </p>

                      <div className="flex items-center gap-3 mt-3">
                        {!notif.isRead && (
                          <button
                            type="button"
                            onClick={() => handleMarkAsRead(notifId)}
                            className="text-[11px] font-bold text-brand-blue hover:underline inline-flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Mark as Read
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(notifId)}
                          className="text-[11px] font-medium text-brand-muted hover:text-brand-accent hover:underline inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsPage;
