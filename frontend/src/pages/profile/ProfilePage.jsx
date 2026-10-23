import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  User,
  Shield,
  KeyRound,
  Lock,
  Smartphone,
  LogOut,
  Laptop,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import {
  updateProfile,
  changePassword,
  setTransactionPin,
  changeTransactionPin,
} from '../../features/auth/authSlice';
import { addToast } from '../../features/ui/uiSlice';
import { formatDateTime, getInitials } from '../../utils/formatters';
import api, { getErrorMessage } from '../../services/api';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';

export const ProfilePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((state) => state.auth.user);

  const initialTab = searchParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState(initialTab); // 'profile' | 'security' | 'pin' | 'sessions'

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // PIN Form State
  const [pinForm, setPinForm] = useState({
    pin: '',
    currentPin: '',
    newPin: '',
    confirmPin: '',
  });
  const [isUpdatingPin, setIsUpdatingPin] = useState(false);

  // Sessions State
  const [sessions, setSessions] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isRevokingSessions, setIsRevokingSessions] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      });
    }
  }, [user]);

  const loadSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const res = await api.get('/sessions');
      if (res.data?.success) {
        setSessions(res.data.sessions || []);
      }
    } catch {
      // Graceful fallback
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'sessions') {
      loadSessions();
    }
  }, [activeTab]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.firstName.trim()) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Validation Error',
          message: 'First name is required.',
        })
      );
      return;
    }

    setIsUpdatingProfile(true);
    const result = await dispatch(
      updateProfile({
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
      })
    );
    setIsUpdatingProfile(false);

    if (updateProfile.fulfilled.match(result)) {
      dispatch(
        addToast({
          type: 'success',
          title: 'Profile Updated',
          message: 'Your personal information was updated.',
        })
      );
    } else {
      dispatch(
        addToast({
          type: 'error',
          title: 'Update Failed',
          message: result.payload,
        })
      );
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Current Password Required',
          message: 'Please provide your current password.',
        })
      );
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Password Too Short',
          message: 'New password must be at least 8 characters long.',
        })
      );
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Mismatch',
          message: 'New passwords do not match.',
        })
      );
      return;
    }

    setIsUpdatingPassword(true);
    const result = await dispatch(
      changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
    );
    setIsUpdatingPassword(false);

    if (changePassword.fulfilled.match(result)) {
      dispatch(
        addToast({
          type: 'success',
          title: 'Password Changed',
          message: 'Your NetBanking password has been changed. Please sign in again with your new password.',
        })
      );
      // Backend invalidates all sessions on password change, redirect to login
      setTimeout(() => navigate('/login'), 1500);
    } else {
      dispatch(
        addToast({
          type: 'error',
          title: 'Password Change Failed',
          message: result.payload,
        })
      );
    }
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    const isPinSet = user?.isTransactionPinSet;

    if (!isPinSet) {
      if (!/^\d{4}$/.test(pinForm.pin)) {
        dispatch(
          addToast({
            type: 'error',
            title: 'Invalid PIN',
            message: 'Transaction PIN must be exactly 4 numeric digits.',
          })
        );
        return;
      }

      setIsUpdatingPin(true);
      const result = await dispatch(setTransactionPin({ pin: pinForm.pin }));
      setIsUpdatingPin(false);

      if (setTransactionPin.fulfilled.match(result)) {
        dispatch(
          addToast({
            type: 'success',
            title: 'PIN Activated',
            message: 'Your 4-digit Transaction PIN is now active for transfers.',
          })
        );
        setPinForm({ pin: '', currentPin: '', newPin: '', confirmPin: '' });
      } else {
        dispatch(
          addToast({
            type: 'error',
            title: 'Failed to Set PIN',
            message: result.payload,
          })
        );
      }
    } else {
      if (!/^\d{4}$/.test(pinForm.currentPin) || !/^\d{4}$/.test(pinForm.newPin)) {
        dispatch(
          addToast({
            type: 'error',
            title: 'Invalid PIN',
            message: 'Both current and new PIN must be 4 digits.',
          })
        );
        return;
      }
      if (pinForm.newPin !== pinForm.confirmPin) {
        dispatch(
          addToast({
            type: 'error',
            title: 'PIN Mismatch',
            message: 'New PIN entries do not match.',
          })
        );
        return;
      }

      setIsUpdatingPin(true);
      const result = await dispatch(
        changeTransactionPin({
          currentPin: pinForm.currentPin,
          newPin: pinForm.newPin,
        })
      );
      setIsUpdatingPin(false);

      if (changeTransactionPin.fulfilled.match(result)) {
        dispatch(
          addToast({
            type: 'success',
            title: 'PIN Changed',
            message: 'Your transaction PIN has been updated successfully.',
          })
        );
        setPinForm({ pin: '', currentPin: '', newPin: '', confirmPin: '' });
      } else {
        dispatch(
          addToast({
            type: 'error',
            title: 'PIN Change Failed',
            message: result.payload,
          })
        );
      }
    }
  };

  const handleRevokeOtherSessions = async () => {
    setIsRevokingSessions(true);
    try {
      const res = await api.delete('/sessions/others');
      if (res.data?.success) {
        dispatch(
          addToast({
            type: 'success',
            title: 'Sessions Terminated',
            message: `${res.data.revokedCount || 'All'} other active sessions have been signed out.`,
          })
        );
        loadSessions();
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
      setIsRevokingSessions(false);
    }
  };

  const handleRevokeSingleSession = async (sessionId) => {
    try {
      const res = await api.delete(`/sessions/${sessionId}`);
      if (res.data?.success) {
        setSessions((prev) => prev.filter((s) => (s.id || s._id) !== sessionId));
        dispatch(
          addToast({
            type: 'info',
            title: 'Session Revoked',
            message: 'The selected device session was terminated.',
          })
        );
      }
    } catch (err) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Revocation Failed',
          message: getErrorMessage(err),
        })
      );
    }
  };

  return (
    <div className="space-y-6 select-none max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-brand-dark tracking-tight">
          Profile & Security Settings
        </h2>
        <p className="text-xs text-brand-muted mt-0.5">
          Manage your personal information, authorization PIN, passwords, and active devices.
        </p>
      </div>

      {/* Profile Overview Card */}
      <Card className="p-5 bg-gradient-to-r from-brand-dark to-[#002B5A] text-white">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
          <div className="w-16 h-16 rounded-2xl bg-brand-blue flex items-center justify-center text-xl font-bold text-white shadow-md flex-shrink-0">
            {getInitials(user?.firstName, user?.lastName)}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white">
              {user?.firstName} {user?.lastName}
            </h3>
            <p className="text-xs text-white/70 mt-0.5">{user?.email}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/20 text-white font-medium">
                Customer ID: {user?.id?.slice(-8) || 'VERIFIED'}
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 font-semibold border border-emerald-500/30">
                Email Verified
              </span>
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border ${
                  user?.isTransactionPinSet
                    ? 'bg-blue-500/20 text-blue-200 border-blue-500/30'
                    : 'bg-amber-500/20 text-amber-200 border-amber-500/30'
                }`}
              >
                {user?.isTransactionPinSet ? 'PIN Enabled' : 'PIN Not Set'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 p-1 bg-white rounded-xl border border-brand-border overflow-x-auto shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'profile'
              ? 'bg-brand-blue text-white shadow-sm'
              : 'text-brand-muted hover:text-brand-dark'
          }`}
        >
          <User className="w-4 h-4" /> Personal Details
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pin')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'pin'
              ? 'bg-brand-blue text-white shadow-sm'
              : 'text-brand-muted hover:text-brand-dark'
          }`}
        >
          <KeyRound className="w-4 h-4" /> Transaction PIN
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'security'
              ? 'bg-brand-blue text-white shadow-sm'
              : 'text-brand-muted hover:text-brand-dark'
          }`}
        >
          <Lock className="w-4 h-4" /> Password
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sessions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'sessions'
              ? 'bg-brand-blue text-white shadow-sm'
              : 'text-brand-muted hover:text-brand-dark'
          }`}
        >
          <Laptop className="w-4 h-4" /> Active Devices
        </button>
      </div>

      {/* Tab 1: Profile Information */}
      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Personal Details</CardTitle>
              <CardDescription>Update your contact profile information</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-lg">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="First Name"
                  value={profileForm.firstName}
                  onChange={(e) =>
                    setProfileForm((p) => ({ ...p, firstName: e.target.value }))
                  }
                  required
                />
                <Input
                  label="Last Name"
                  value={profileForm.lastName}
                  onChange={(e) =>
                    setProfileForm((p) => ({ ...p, lastName: e.target.value }))
                  }
                />
              </div>

              <Input
                label="Registered Email (Read-Only)"
                value={user?.email || ''}
                disabled
                helperText="Email changes require branch verification"
              />

              <Input
                label="Registered Phone (Read-Only)"
                value={user?.phone || ''}
                disabled
                helperText="Primary phone used for OTP authorization"
              />

              <div className="pt-2">
                <Button type="submit" variant="primary" size="md" isLoading={isUpdatingProfile}>
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Transaction PIN */}
      {activeTab === 'pin' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>
                {user?.isTransactionPinSet ? 'Change Transaction PIN' : 'Set Transaction PIN'}
              </CardTitle>
              <CardDescription>
                4-digit security PIN used to authorize IMPS & NEFT transfers.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePinSubmit} className="space-y-4 max-w-md">
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
                <p className="font-bold flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-brand-blue" /> Transaction Authorization Security</p>
                <p className="mt-0.5 text-blue-800">
                  Your 4-digit PIN is cryptographically hashed with bcrypt and required for all outgoing fund transfers.
                </p>
              </div>

              {!user?.isTransactionPinSet ? (
                <>
                  <Input
                    label="Choose 4-Digit Transaction PIN"
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={pinForm.pin}
                    onChange={(e) =>
                      setPinForm((p) => ({
                        ...p,
                        pin: e.target.value.replace(/\D/g, '').slice(0, 4),
                      }))
                    }
                    helperText="Enter 4 numeric digits for transfer authorization"
                    required
                  />

                  <Button type="submit" variant="primary" size="md" isLoading={isUpdatingPin}>
                    Activate Transaction PIN
                  </Button>
                </>
              ) : (
                <>
                  <Input
                    label="Current 4-Digit PIN"
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={pinForm.currentPin}
                    onChange={(e) =>
                      setPinForm((p) => ({
                        ...p,
                        currentPin: e.target.value.replace(/\D/g, '').slice(0, 4),
                      }))
                    }
                    required
                  />

                  <Input
                    label="New 4-Digit PIN"
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={pinForm.newPin}
                    onChange={(e) =>
                      setPinForm((p) => ({
                        ...p,
                        newPin: e.target.value.replace(/\D/g, '').slice(0, 4),
                      }))
                    }
                    required
                  />

                  <Input
                    label="Confirm New 4-Digit PIN"
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={pinForm.confirmPin}
                    onChange={(e) =>
                      setPinForm((p) => ({
                        ...p,
                        confirmPin: e.target.value.replace(/\D/g, '').slice(0, 4),
                      }))
                    }
                    required
                  />

                  <Button type="submit" variant="primary" size="md" isLoading={isUpdatingPin}>
                    Update Transaction PIN
                  </Button>
                </>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Password Update */}
      {activeTab === 'security' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Change NetBanking Password</CardTitle>
              <CardDescription>
                Regular password changes enhance your account security
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
              <Input
                label="Current Password"
                type="password"
                placeholder="••••••••"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))
                }
                required
              />

              <Input
                label="New Password"
                type="password"
                placeholder="Minimum 8 characters"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))
                }
                helperText="Must be at least 8 characters long"
                required
              />

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Re-enter new password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))
                }
                required
              />

              <div className="pt-2">
                <Button type="submit" variant="primary" size="md" isLoading={isUpdatingPassword}>
                  Update Password
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tab 4: Active Login Sessions */}
      {activeTab === 'sessions' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Active NetBanking Sessions</CardTitle>
              <CardDescription>
                Devices and IP addresses currently authenticated with your account
              </CardDescription>
            </div>
            {sessions.length > 1 && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleRevokeOtherSessions}
                isLoading={isRevokingSessions}
                icon={LogOut}
                className="text-xs"
              >
                Log Out All Other Devices
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingSessions && sessions.length === 0 ? (
              <div className="p-8 text-center text-xs text-brand-muted">
                Inspecting active sessions...
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-8 text-center text-xs text-brand-muted">
                No session records found.
              </div>
            ) : (
              <div className="divide-y divide-brand-border">
                {sessions.map((sess) => {
                  const sId = sess.id || sess._id;
                  return (
                    <div
                      key={sId}
                      className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-brand-bg/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-brand-light text-brand-blue flex-shrink-0">
                          <Laptop className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-brand-dark">
                              {sess.ipAddress || '127.0.0.1'}
                            </span>
                            {sess.isCurrentSession && (
                              <Badge variant="success" size="xs">
                                Current Device
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-brand-muted mt-0.5 truncate max-w-xs sm:max-w-md">
                            {sess.userAgent || 'Web Browser'}
                          </p>
                          <span className="text-[10px] text-brand-muted/80 block mt-1">
                            Logged in {formatDateTime(sess.createdAt)}
                          </span>
                        </div>
                      </div>

                      {!sess.isCurrentSession && (
                        <button
                          type="button"
                          onClick={() => handleRevokeSingleSession(sId)}
                          className="text-xs font-semibold text-brand-accent hover:underline flex items-center gap-1"
                        >
                          <LogOut className="w-3.5 h-3.5" /> Terminate
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfilePage;
