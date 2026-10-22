import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearAuthError } from '../../features/auth/authSlice';
import { addToast } from '../../features/ui/uiSlice';
import Logo from '../../components/common/Logo';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import DemoBanner from '../../components/common/DemoBanner';
import { Mail, Lock, User, Phone, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';

export const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isLoading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [createdToken, setCreatedToken] = useState(null);

  const validate = () => {
    const errors = {};
    if (!formData.firstName.trim() || formData.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    }
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.password || formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }
    if (!formData.phone.trim() || !/^\+?[0-9]{7,15}$/.test(formData.phone.trim())) {
      errors.phone = 'Valid phone number is required (7-15 digits)';
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
      registerUser({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
      })
    );

    if (registerUser.fulfilled.match(resultAction)) {
      const token = resultAction.payload.verificationToken;
      setCreatedToken(token);
      dispatch(
        addToast({
          type: 'success',
          title: 'Account Registered',
          message: 'Your registration was successful. Please verify your email.',
        })
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg select-none">
      {/* Top Persistent Educational Demo Banner */}
      <DemoBanner />

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Branding Hero */}
        <div className="lg:w-1/2 bg-brand-dark text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-brand-blue/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-brand-blue/15 blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <Logo variant="light" size="lg" />
            <div className="mt-12 sm:mt-16">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-200 border border-amber-500/30 mb-4">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Educational Simulation Account
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                Open a Simulated Banking Account (Demo Mode).
              </h2>
              <p className="mt-4 text-sm sm:text-base text-white/80 max-w-lg leading-relaxed">
                Explore full-stack banking features in an educational simulation built for portfolio demonstrations and technical interviews.
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-8 border-t border-white/10">
            <div className="flex items-center gap-2.5 text-xs text-white/90">
              <CheckCircle2 className="w-4 h-4 text-brand-blue flex-shrink-0" />
              <span>Simulated Instant Onboarding</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-white/90">
              <CheckCircle2 className="w-4 h-4 text-brand-blue flex-shrink-0" />
              <span>Dedicated Mock Savings Account</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-white/90">
              <CheckCircle2 className="w-4 h-4 text-brand-blue flex-shrink-0" />
              <span>Sample Statement Exports</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-white/90">
              <CheckCircle2 className="w-4 h-4 text-brand-blue flex-shrink-0" />
              <span>Simulated IMPS / NEFT Support</span>
            </div>
          </div>

          <div className="relative z-10 mt-8 text-xs text-amber-300/80">
            © {new Date().getFullYear()} SecureBank Demo — Educational simulation portfolio project. Not a licensed bank.
          </div>
        </div>

        {/* Right Registration Form */}
        <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-panel border border-brand-border p-6 sm:p-10">
            {createdToken ? (
              /* Success & Verification Prompt */
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-green-50 text-brand-success flex items-center justify-center mx-auto mb-4 border border-green-200">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-brand-dark mb-2">Registration Complete!</h3>
                <p className="text-xs text-brand-muted max-w-sm mx-auto mb-6 leading-relaxed">
                  Your SecureBank profile has been created successfully. Please verify your email address to activate your account and start banking.
                </p>

                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-left mb-6">
                  <div className="flex items-start gap-2.5">
                    <Mail className="w-4 h-4 text-brand-blue flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-brand-dark mb-0.5">Check your inbox</p>
                      <p className="text-xs text-brand-muted leading-relaxed">
                        We've sent a verification link to your registered email. Click the button below to complete verification.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full"
                    onClick={() => navigate(`/verify-email?token=${encodeURIComponent(createdToken)}`)}
                  >
                    Verify Email Address
                  </Button>

                  <Button
                    variant="outline"
                    size="md"
                    className="w-full"
                    onClick={() => navigate('/login')}
                  >
                    Return to Sign In
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-left mb-6">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" /> Educational Simulation
                  </div>
                  <h3 className="text-2xl font-bold text-brand-dark">Create Demo Profile</h3>
                  <p className="text-xs text-brand-muted mt-1">
                    Set up a test profile to explore the MERN banking simulation.
                  </p>
                </div>

                {/* Simulation Safety Warning */}
                <div className="mb-6 p-3 rounded-xl bg-amber-50 border border-amber-300 text-[11px] text-amber-900 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-950">Never Submit Real Banking Data</p>
                    <p className="text-amber-800 leading-snug">
                      This is an educational prototype. Do NOT submit real bank passwords, card PINs, or real personal phone numbers.
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-bold text-amber-950">
                          {error.toLowerCase().includes('already registered')
                            ? 'Account Already Exists (409 Conflict)'
                            : 'Registration Notice'}
                        </p>
                        <p className="mt-1 text-amber-800 leading-relaxed">{error}</p>
                        {error.toLowerCase().includes('already registered') && (
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => navigate('/login', { state: { email: formData.email } })}
                              className="px-3 py-1.5 rounded-lg bg-brand-blue text-white font-semibold text-[11px] hover:bg-brand-dark transition-colors inline-flex items-center gap-1 shadow-sm"
                            >
                              Sign In With This Email <ArrowRight className="w-3 h-3" />
                            </button>
                            <Link
                              to="/forgot-password"
                              className="px-2.5 py-1.5 rounded-lg border border-amber-300 text-amber-900 hover:bg-amber-100 font-semibold text-[11px] transition-colors"
                            >
                              Forgot Password?
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="First Name"
                      name="firstName"
                      placeholder="e.g. Ayan"
                      value={formData.firstName}
                      onChange={handleChange}
                      error={formErrors.firstName}
                      icon={User}
                      required
                    />
                    <Input
                      label="Last Name"
                      name="lastName"
                      placeholder="e.g. Shaikh"
                      value={formData.lastName}
                      onChange={handleChange}
                      error={formErrors.lastName}
                      required
                    />
                  </div>

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
                  />

                  <Input
                    label="Mobile Phone"
                    name="phone"
                    type="tel"
                    placeholder="9876543210"
                    value={formData.phone}
                    onChange={handleChange}
                    error={formErrors.phone}
                    icon={Phone}
                    helperText="Use a dummy/test 10-digit number. Do not enter personal numbers."
                    required
                  />

                  <Input
                    label="Password"
                    name="password"
                    type="password"
                    placeholder="Minimum 8 characters"
                    value={formData.password}
                    onChange={handleChange}
                    error={formErrors.password}
                    icon={Lock}
                    helperText="Simulation password. Never reuse real bank passwords."
                    required
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full mt-4"
                    isLoading={isLoading}
                    icon={ArrowRight}
                    iconPosition="right"
                  >
                    Create Demo Profile
                  </Button>
                </form>

                <div className="mt-6 pt-5 border-t border-brand-border text-center">
                  <p className="text-xs text-brand-muted">
                    Already have an account?{' '}
                    <Link
                      to="/login"
                      className="font-bold text-brand-blue hover:text-brand-dark hover:underline"
                    >
                      Sign In to Demo
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
