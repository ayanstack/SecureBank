import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { forgotPassword } from '../../features/auth/authSlice';
import { addToast } from '../../features/ui/uiSlice';
import Logo from '../../components/common/Logo';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import DemoBanner from '../../components/common/DemoBanner';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, AlertTriangle } from 'lucide-react';

export const ForgotPasswordPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please provide a valid registered email address');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await dispatch(forgotPassword({ email: email.trim() }));
    setIsLoading(false);

    if (forgotPassword.fulfilled.match(result)) {
      // If the backend returns a token (dev/testing mode), auto-redirect to reset page
      const token = result.payload?.resetToken;
      if (token) {
        navigate(`/reset-password?token=${encodeURIComponent(token)}`);
        return;
      }

      // Production mode: show "check your email" message
      setIsSubmitted(true);
      dispatch(
        addToast({
          type: 'success',
          title: 'Reset Link Sent',
          message: 'If your email is registered, you will receive password reset instructions.',
        })
      );
    } else {
      setError(result.payload || 'Failed to process password reset request');
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
              Demo Account Recovery
            </div>
            <h2 className="text-2xl font-bold text-brand-dark">Reset Demo Password</h2>
            <p className="text-xs text-brand-muted mt-1">
              Educational simulation recovery flow for testing purposes.
            </p>
          </div>

        {isSubmitted ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-green-50 text-brand-success flex items-center justify-center mx-auto mb-4 border border-green-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-brand-dark mb-2">Check Your Email</h3>
            <p className="text-xs text-brand-muted mb-2">
              If <span className="font-semibold text-brand-dark">{email}</span> is registered with SecureBank, you will receive a password reset link shortly.
            </p>
            <div className="p-3.5 rounded-xl bg-brand-light border border-brand-border text-left mb-6">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-blue mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[11px] font-bold text-brand-dark mb-0.5">Security Notice</p>
                  <p className="text-[11px] text-brand-muted leading-relaxed">
                    The reset link expires in 15 minutes. If you don't see the email, check your spam folder. Never share your reset link with anyone.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => navigate('/reset-password')}
                icon={ArrowRight}
                iconPosition="right"
              >
                I Have My Reset Token
              </Button>
              <button
                type="button"
                onClick={() => {
                  setIsSubmitted(false);
                  setEmail('');
                }}
                className="text-xs font-bold text-brand-blue hover:underline"
              >
                Try a different email
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Simulation Advisory */}
            <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-300 text-[11px] text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-950">Educational Portfolio Demo</p>
                <p className="text-amber-800 leading-snug">
                  Only reset passwords for accounts created within this simulation. Never use real financial account emails or credentials.
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-brand-accent/20 text-xs text-brand-accent font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Registered Email Address"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                icon={Mail}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isLoading}
              >
                Send Password Reset Link
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-brand-border text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
