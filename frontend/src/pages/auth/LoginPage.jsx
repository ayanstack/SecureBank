import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearAuthError } from '../../features/auth/authSlice';
import { addToast } from '../../features/ui/uiSlice';
import Logo from '../../components/common/Logo';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import DemoBanner from '../../components/common/DemoBanner';
import { Mail, Lock, ShieldCheck, ArrowRight, CheckCircle2, Shield, Sparkles, AlertCircle, AlertTriangle } from 'lucide-react';

export const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { isLoading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: location.state?.email || '',
    password: '',
  });

  const [formErrors, setFormErrors] = useState({});

  const fillDemoAccount = (email, password) => {
    setFormData({ email, password });
    setFormErrors({});
    if (error) {
      dispatch(clearAuthError());
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (error) {
      dispatch(clearAuthError());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const resultAction = await dispatch(
      loginUser({
        email: formData.email.trim(),
        password: formData.password,
      })
    );

    if (loginUser.fulfilled.match(resultAction)) {
      dispatch(
        addToast({
          type: 'success',
          title: 'Authentication Successful',
          message: `Welcome back, ${resultAction.payload.user?.firstName || 'Customer'}!`,
        })
      );
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg select-none">
      {/* Top Persistent Educational Demo Banner */}
      <DemoBanner />

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Branding Hero Panel */}
        <div className="lg:w-1/2 bg-brand-dark text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle background graphics */}
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-brand-blue/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-brand-blue/15 blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <Logo variant="light" size="lg" />
            <div className="mt-12 sm:mt-16">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-200 border border-amber-500/30 mb-4">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Educational Banking Simulation • Demo Only
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                MERN Full-Stack Digital Banking Simulation
              </h2>
              <p className="mt-4 text-sm sm:text-base text-white/80 max-w-lg leading-relaxed">
                An open-source portfolio demonstration showcasing secure architecture: bcrypt password & PIN hashing, JWT session rotation, idempotent transfers, and real-time socket events.
              </p>
            </div>
          </div>

          {/* Feature bullets */}
          <div className="relative z-10 mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-8 border-t border-white/10">
            <div className="flex items-center gap-2.5 text-xs text-white/90">
              <CheckCircle2 className="w-4 h-4 text-brand-blue flex-shrink-0" />
              <span>Simulated 2-Factor & PIN Transfers</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-white/90">
              <CheckCircle2 className="w-4 h-4 text-brand-blue flex-shrink-0" />
              <span>256-Bit SSL End-to-End Encryption</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-white/90">
              <CheckCircle2 className="w-4 h-4 text-brand-blue flex-shrink-0" />
              <span>Sample PDF & CSV Statement Generation</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-white/90">
              <CheckCircle2 className="w-4 h-4 text-brand-blue flex-shrink-0" />
              <span>Real-time Socket.IO Alert Notifications</span>
            </div>
          </div>

          <div className="relative z-10 mt-8 text-xs text-amber-300/80">
            © {new Date().getFullYear()} SecureBank Demo — Educational simulation portfolio project. Not a licensed bank.
          </div>
        </div>

        {/* Right Login Form */}
        <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-panel border border-brand-border p-6 sm:p-10">
            <div className="text-left mb-6">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> Demo Banking Sign In
              </div>
              <h3 className="text-2xl font-bold text-brand-dark">Sign in to Demo Portal</h3>
              <p className="text-xs text-brand-muted mt-1">
                Enter simulated credentials or choose a 1-click test profile below.
              </p>
            </div>

            {/* Credential harvesting warning alert */}
            <div className="mb-6 p-3 rounded-xl bg-amber-50 border border-amber-300 text-[11px] text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-950">Educational Environment Notice</p>
                <p className="text-amber-800 leading-snug">
                  Never enter real passwords from your personal or real-world bank accounts. Use the pre-filled demo accounts below for instant testing.
                </p>
              </div>
            </div>

          {/* Quick Demo Credentials Card */}
          <div className="mb-6 p-3.5 rounded-xl bg-brand-light border border-brand-border text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-brand-dark flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-blue" />
                Quick Access Channels (1-Click Fill)
              </span>
              <span className="text-[10px] text-brand-muted font-mono">Password: Password123!</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemoAccount('retail.client@securebank.com', 'Password123!')}
                className="p-2.5 rounded-lg bg-white border border-brand-border text-left hover:border-brand-blue hover:shadow-sm transition-all group"
              >
                <p className="font-bold text-brand-blue group-hover:underline truncate text-xs">Retail Banking (Savings)</p>
                <p className="text-[10px] text-brand-muted truncate">retail.client@securebank.com</p>
                <span className="inline-block mt-1 text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">₹45,000 • PIN 1234</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('corporate.client@securebank.com', 'Password123!')}
                className="p-2.5 rounded-lg bg-white border border-brand-border text-left hover:border-brand-blue hover:shadow-sm transition-all group"
              >
                <p className="font-bold text-brand-blue group-hover:underline truncate text-xs">Corporate Banking (Current)</p>
                <p className="text-[10px] text-brand-muted truncate">corporate.client@securebank.com</p>
                <span className="inline-block mt-1 text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">₹1,25,000 • PIN 1234</span>
              </button>
            </div>
          </div>

          {/* Backend Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-brand-accent/20 text-xs text-brand-accent flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-brand-accent flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">
                  {error.toLowerCase().includes('invalid email or password')
                    ? 'Authentication Failed (401 Unauthorized)'
                    : 'Sign In Notice'}
                </p>
                <p className="font-medium mt-0.5">{error}</p>
                {error.toLowerCase().includes('invalid email or password') && (
                  <div className="mt-2.5 space-y-1.5 text-[11px] text-brand-accent/90">
                    <p>• Check that your password is typed accurately (passwords are case-sensitive).</p>
                    <p>• If you registered previously, use the exact password you chose during registration.</p>
                    <div className="pt-1 flex items-center gap-3">
                      <Link
                        to="/forgot-password"
                        className="font-bold underline hover:text-red-950 inline-flex items-center gap-1"
                      >
                        Reset Password <ArrowRight className="w-3 h-3" />
                      </Link>
                      <span className="text-brand-accent/40">|</span>
                      <button
                        type="button"
                        onClick={() => fillDemoAccount('retail.client@securebank.com', 'Password123!')}
                        className="font-bold underline hover:text-red-950"
                      >
                        Autofill Demo Login
                      </button>
                    </div>
                  </div>
                )}
                {error.toLowerCase().includes('verify') && (
                  <Link
                    to="/verify-email"
                    className="inline-block mt-2 font-bold underline hover:text-red-950"
                  >
                    Click here to verify your email address
                  </Link>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              name="email"
              type="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              error={formErrors.email}
              icon={Mail}
              required
              autoComplete="email"
            />

            <div>
              <Input
                label="Password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                error={formErrors.password}
                icon={Lock}
                required
                autoComplete="current-password"
              />
              <div className="flex justify-end mt-1.5">
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-brand-blue hover:text-brand-dark hover:underline transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-4"
              isLoading={isLoading}
              icon={ArrowRight}
              iconPosition="right"
            >
              Sign In to Demo Portal
            </Button>
          </form>

          {/* Register Prompt */}
          <div className="mt-8 pt-6 border-t border-brand-border text-center">
            <p className="text-xs text-brand-muted">
              New to this simulation?{' '}
              <Link
                to="/register"
                className="font-bold text-brand-blue hover:text-brand-dark hover:underline"
              >
                Create a Demo Profile
              </Link>
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default LoginPage;
