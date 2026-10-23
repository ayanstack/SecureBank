import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { resetPassword } from '../../features/auth/authSlice';
import { addToast } from '../../features/ui/uiSlice';
import Logo from '../../components/common/Logo';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import DemoBanner from '../../components/common/DemoBanner';
import { Lock, KeyRound, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, AlertCircle, AlertTriangle } from 'lucide-react';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const tokenFromUrl = searchParams.get('token') || '';
  const [resetToken, setResetToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(!tokenFromUrl);

  useEffect(() => {
    const t = searchParams.get('token');
    if (t) {
      setResetToken(t);
      setShowTokenInput(false);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!resetToken.trim()) {
      setError('Password reset token is required. Please use the link from your email or paste the token below.');
      setShowTokenInput(true);
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await dispatch(
      resetPassword({
        resetToken: resetToken.trim(),
        newPassword,
      })
    );
    setIsLoading(false);

    if (resetPassword.fulfilled.match(result)) {
      setIsSuccess(true);
      dispatch(
        addToast({
          type: 'success',
          title: 'Password Updated',
          message: 'Your password has been reset successfully. Please log in.',
        })
      );
    } else {
      setError(result.payload || 'Failed to reset password. The token may be expired or invalid.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg select-none">
      <DemoBanner />
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-panel border border-brand-border p-6 sm:p-10">
          <div className="text-center mb-6">
            <div className="inline-block mb-3">
              <Logo size="default" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-800 border border-amber-500/30 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              Demo Simulation Flow
            </div>
            <h2 className="text-2xl font-bold text-brand-dark">Set Demo Password</h2>
            <p className="text-xs text-brand-muted mt-1">
              Choose a mock password for this demo banking account.
            </p>
          </div>

        {isSuccess ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-green-50 text-brand-success flex items-center justify-center mx-auto mb-4 border border-green-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-brand-dark mb-2">Password Reset Successful</h3>
            <p className="text-xs text-brand-muted mb-6">
              Your password has been updated. You can now sign in using your new password.
            </p>
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => navigate('/login')}
              icon={ArrowRight}
              iconPosition="right"
            >
              Go to Sign In
            </Button>
          </div>
        ) : (
          <>
            {/* Token status indicator */}
            {resetToken && !showTokenInput && (
              <div className="mb-5 p-3 rounded-xl bg-green-50 border border-green-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-success flex-shrink-0" />
                <span className="text-xs text-green-800 font-medium">
                  Reset token verified — enter your new password below
                </span>
              </div>
            )}

            {/* Educational Simulation Warning */}
            <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-300 text-[11px] text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-950">Educational Environment Notice</p>
                <p className="text-amber-800 leading-snug">
                  Never use passwords from your real personal, banking, or corporate accounts. Use a dummy test password.
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-brand-accent/20 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-brand-accent flex-shrink-0 mt-0.5" />
                <span className="text-xs text-brand-accent font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Only show token input if no token in URL or user explicitly requests it */}
              {showTokenInput && (
                <Input
                  label="Reset Token"
                  placeholder="Paste your reset token from email"
                  value={resetToken}
                  onChange={(e) => {
                    setResetToken(e.target.value);
                    setError('');
                  }}
                  icon={KeyRound}
                  helperText="Check your email for the password reset token"
                  required
                />
              )}

              <Input
                label="New Password"
                type="password"
                placeholder="Minimum 8 characters"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError('');
                }}
                icon={Lock}
                helperText="Use a mix of letters, numbers, and symbols"
                required
              />

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError('');
                }}
                icon={Lock}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isLoading}
              >
                Update Password & Secure Account
              </Button>
            </form>

            {/* Link to manually enter token if navigated without one */}
            {!showTokenInput && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setShowTokenInput(true)}
                  className="text-[11px] text-brand-muted hover:text-brand-blue hover:underline"
                >
                  Enter a different reset token
                </button>
              </div>
            )}

            <div className="mt-6 pt-5 border-t border-brand-border flex items-center justify-between">
              <Link
                to="/forgot-password"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Request New Token
              </Link>
              <Link to="/login" className="text-xs font-bold text-brand-blue hover:underline">
                Back to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
