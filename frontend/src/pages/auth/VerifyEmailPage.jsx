import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { verifyEmail, resendVerification } from '../../features/auth/authSlice';
import { addToast } from '../../features/ui/uiSlice';
import Logo from '../../components/common/Logo';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { CheckCircle2, Mail, KeyRound, ArrowRight } from 'lucide-react';

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [token, setToken] = useState(searchParams.get('token') || '');
  const [resendEmail, setResendEmail] = useState('');
  const [showResend, setShowResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const autoVerifiedRef = React.useRef(false);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [searchParams]);

  // Auto-verify when token comes from registration flow (via URL)
  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam && !autoVerifiedRef.current && !isVerified) {
      autoVerifiedRef.current = true;
      (async () => {
        setIsLoading(true);
        setErrorMessage('');
        const result = await dispatch(verifyEmail({ verificationToken: tokenParam.trim() }));
        setIsLoading(false);

        if (verifyEmail.fulfilled.match(result)) {
          setIsVerified(true);
          dispatch(
            addToast({
              type: 'success',
              title: 'Email Verified',
              message: 'Your email has been verified successfully! Redirecting to login...',
            })
          );
          // Auto-redirect to login after a short delay
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setErrorMessage(result.payload || 'Verification failed. The token may be invalid or expired.');
        }
      })();
    }
  }, [searchParams, dispatch, navigate, isVerified]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!token.trim()) {
      setErrorMessage('Please enter your verification token');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    const result = await dispatch(verifyEmail({ verificationToken: token.trim() }));
    setIsLoading(false);

    if (verifyEmail.fulfilled.match(result)) {
      setIsVerified(true);
      dispatch(
        addToast({
          type: 'success',
          title: 'Email Verified',
          message: 'Your email has been verified successfully! Redirecting to login...',
        })
      );
      setTimeout(() => navigate('/login'), 2000);
    } else {
      setErrorMessage(result.payload || 'Verification failed. The token may be invalid or expired.');
    }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail.trim()) {
      setErrorMessage('Please enter your email to resend verification token');
      return;
    }

    setIsResending(true);
    setErrorMessage('');

    const result = await dispatch(resendVerification({ email: resendEmail.trim() }));
    setIsResending(false);

    if (resendVerification.fulfilled.match(result)) {
      const newToken = result.payload.verificationToken;
      if (newToken) {
        setToken(newToken);
      }
      dispatch(
        addToast({
          type: 'success',
          title: 'Token Resent',
          message: 'A new verification token has been generated.',
        })
      );
      setShowResend(false);
    } else {
      setErrorMessage(result.payload || 'Failed to resend verification token');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg p-4 sm:p-6 select-none">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-panel border border-brand-border p-6 sm:p-10">
        <div className="text-center mb-6">
          <div className="inline-block mb-3">
            <Logo size="default" />
          </div>
          <h2 className="text-2xl font-bold text-brand-dark">Email Verification</h2>
          <p className="text-xs text-brand-muted mt-1">
            Activate your SecureBank NetBanking profile to access your accounts.
          </p>
        </div>

        {isVerified ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-green-50 text-brand-success flex items-center justify-center mx-auto mb-4 border border-green-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-brand-dark mb-2">Account Activated!</h3>
            <p className="text-xs text-brand-muted mb-6">
              Your email address has been verified successfully. You may now sign in to your banking dashboard.
            </p>
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => navigate('/login')}
              icon={ArrowRight}
              iconPosition="right"
            >
              Sign In Now
            </Button>
          </div>
        ) : (
          <>
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-brand-accent/20 text-xs text-brand-accent font-medium">
                {errorMessage}
              </div>
            )}

            {!showResend ? (
              <form onSubmit={handleVerify} className="space-y-4">
                <Input
                  label="Verification Token"
                  placeholder="Paste your verification token here"
                  value={token}
                  onChange={(e) => {
                    setToken(e.target.value);
                    setErrorMessage('');
                  }}
                  icon={KeyRound}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={isLoading}
                >
                  Verify & Activate Account
                </Button>

                <div className="text-center pt-3">
                  <button
                    type="button"
                    onClick={() => setShowResend(true)}
                    className="text-xs font-semibold text-brand-blue hover:underline"
                  >
                    Didn't receive a token? Resend verification
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResend} className="space-y-4">
                <Input
                  label="Registered Email"
                  type="email"
                  placeholder="Enter your registered email address"
                  value={resendEmail}
                  onChange={(e) => {
                    setResendEmail(e.target.value);
                    setErrorMessage('');
                  }}
                  icon={Mail}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={isResending}
                >
                  Resend Verification Token
                </Button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setShowResend(false)}
                    className="text-xs font-medium text-brand-muted hover:text-brand-dark"
                  >
                    ← Back to Token Verification
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 pt-5 border-t border-brand-border text-center">
              <Link to="/login" className="text-xs font-bold text-brand-blue hover:underline">
                Return to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
