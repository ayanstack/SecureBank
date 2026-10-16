import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  Send,
  CreditCard,
  FileText,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  KeyRound,
  CheckCircle2,
  Users,
  Bell,
  Smartphone,
  Award,
  Wallet,
  ShieldAlert,
} from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import PublicFooter from '../../components/layout/PublicFooter';

export const HomePage = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [openFaq, setOpenFaq] = useState(0);

  const faqs = [
    {
      q: 'How do I open an account with SecureBank?',
      a: 'Opening an account takes less than 2 minutes. Click on "Open Account", provide your basic legal name, email, phone number, and choose your password. Once registered, verify your email with the provided token to immediately activate full banking privileges.',
    },
    {
      q: 'How does SecureBank protect my transactions?',
      a: 'All money transfers require a dedicated 4-digit Transaction PIN hashed with bcrypt. Each transfer is validated on the server with atomicity, idempotency key guarantees against double debits, and verified balance deduction before crediting the beneficiary.',
    },
    {
      q: 'What types of bank accounts are supported?',
      a: 'SecureBank supports primary Savings Accounts with high liquidity, Current Accounts for commercial transactions, and Fixed Deposit accounts. You can also freeze or unfreeze your accounts instantly from your dashboard.',
    },
    {
      q: 'Can I download official account statements?',
      a: 'Yes. SecureBank generates instant cryptographic statements for any custom date range. You can download statements in CSV format or formatted PDF, or request the server to deliver them directly to your verified email.',
    },
    {
      q: 'What if I forget my password or PIN?',
      a: 'We provide an automated, tokenized Forgot Password and Reset Password recovery pipeline. You can also update your Transaction PIN securely using your current PIN or reset it via your profile security settings.',
    },
  ];

  return (
    <div className="min-h-screen bg-brand-bg text-brand-dark flex flex-col font-sans">
      <PublicNavbar />

      {/* Hero Section — High impact HDFC-style banking banner with quick action card */}
      <section className="relative bg-gradient-to-br from-[#002b59] via-[#003b7a] to-[#001f3f] text-white overflow-hidden py-16 lg:py-24 border-b border-[#002042]">
        {/* Subtle decorative background grids */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Col: Main Marketing Copy */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-white tracking-wide shadow-sm">
                <span className="w-2 h-2 rounded-full bg-brand-success animate-pulse"></span>
                Next-Generation Digital Retail Banking
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
                Banking Designed for <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-white to-blue-200">
                  Trust, Speed & Security.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-white/80 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Experience seamless 24x7 instant fund transfers, end-to-end encrypted retail accounts, real-time live transaction alerts, and automated official bank statements.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                {isAuthenticated ? (
                  <Link
                    to="/dashboard"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-white text-brand-dark hover:bg-brand-light font-bold text-base transition-all duration-150 shadow-lg"
                  >
                    <span>Go to My Dashboard ({user?.firstName})</span>
                    <ArrowRight className="w-5 h-5 text-brand-blue" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-brand-blue hover:bg-[#0759af] text-white font-bold text-base transition-all duration-150 shadow-lg border border-blue-400/30"
                    >
                      <span>Open Instant Account</span>
                      <ArrowRight className="w-5 h-5" />
                    </Link>

                    <Link
                      to="/login"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-base transition-all duration-150 border border-white/20"
                    >
                      <Lock className="w-4 h-4 text-blue-300" />
                      <span>NetBanking Sign In</span>
                    </Link>
                  </>
                )}
              </div>

              {/* Trust Badges */}
              <div className="pt-6 border-t border-white/15 grid grid-cols-3 gap-4 text-left max-w-lg mx-auto lg:mx-0">
                <div>
                  <p className="text-2xl font-black text-white">256-Bit</p>
                  <p className="text-xs text-white/70">AES Data Encryption</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-white">0% Fees</p>
                  <p className="text-xs text-white/70">On Internal Transfers</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-white">&lt; 1s</p>
                  <p className="text-xs text-white/70">Real-time Settlement</p>
                </div>
              </div>
            </div>

            {/* Right Col: Instant NetBanking Access Box */}
            <div className="lg:col-span-5">
              <div className="bg-[#0D274D] rounded-2xl p-6 sm:p-8 text-[#F7FAFF] shadow-2xl border border-[#1E4578] relative">
                {/* Header Badge */}
                <div className="flex items-center justify-between pb-5 border-b border-[#1E4578]">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-[#12325E] text-white">
                      <Lock className="w-5 h-5 text-[#D62839]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[#F7FAFF] leading-tight">NetBanking Access</h3>
                      <p className="text-xs text-[#94B4DB]">Secure Customer Gateway</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded text-[11px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                    Online & Active
                  </span>
                </div>

                {/* Content */}
                <div className="py-6 space-y-4">
                  <div className="p-4 rounded-xl bg-[#081526] border border-[#1E4578] space-y-2">
                    <div className="flex items-center justify-between text-xs text-[#94B4DB]">
                      <span>Supported Services</span>
                      <span className="font-bold text-[#F7FAFF]">24x7 Real-Time</span>
                    </div>
                    <ul className="text-xs space-y-1.5 text-[#F7FAFF] font-medium">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> Instant IMPS/NEFT Money Transfer
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> Live Account Freeze & PIN Security
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> Official PDF & CSV E-Statements
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> Multi-Session Device Management
                      </li>
                    </ul>
                  </div>

                  {isAuthenticated ? (
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-lg bg-[#12325E] border border-[#1E4578] text-xs text-[#F7FAFF]">
                        Signed in as <strong>{user?.firstName} {user?.lastName}</strong> ({user?.email})
                      </div>
                      <Link
                        to="/dashboard"
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#D62839] hover:bg-[#BA1E2E] text-white font-bold text-sm transition-colors shadow-glow-red"
                      >
                        <span>Open Banking Dashboard</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Link
                        to="/login"
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#D62839] hover:bg-[#BA1E2E] text-white font-bold text-sm transition-colors shadow-glow-red"
                      >
                        <Lock className="w-4 h-4" />
                        <span>Sign In with Email & Password</span>
                      </Link>

                      <div className="text-center">
                        <span className="text-xs text-[#94B4DB]">New customer? </span>
                        <Link to="/register" className="text-xs font-bold text-[#D62839] hover:underline">
                          Register your account now
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Advisory */}
                <div className="pt-4 border-t border-brand-border flex items-center gap-2 text-[11px] text-brand-muted">
                  <ShieldCheck className="w-4 h-4 text-brand-success flex-shrink-0" />
                  <span>Never share your Password, PIN, or OTP with anyone. SecureBank will never call requesting credentials.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Service Cards — Grid */}
      <section className="py-12 bg-[#081526] border-b border-[#1E4578]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-xs font-bold text-[#D62839] tracking-wider uppercase">Everyday Banking</h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#F7FAFF] mt-1">Core Banking Products & Highlights</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Savings */}
            <div className="p-6 rounded-2xl bg-[#0D274D] hover:bg-[#12325E] border border-[#1E4578] hover:border-[#D62839]/50 transition-all duration-200 shadow-card group text-[#F7FAFF]">
              <div className="w-12 h-12 rounded-xl bg-[#D62839]/15 text-[#D62839] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-[#F7FAFF] mb-1">Savings Account</h3>
              <p className="text-xs text-[#94B4DB] leading-relaxed mb-4">
                Instant digital savings account with zero minimum balance requirement and daily interest compounding.
              </p>
              <Link to={isAuthenticated ? '/accounts' : '/register'} className="text-xs font-bold text-[#D62839] inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                <span>{isAuthenticated ? 'View Accounts' : 'Apply Now'}</span> <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 2: Instant Transfers */}
            <div className="p-6 rounded-2xl bg-[#0D274D] hover:bg-[#12325E] border border-[#1E4578] hover:border-[#D62839]/50 transition-all duration-200 shadow-card group text-[#F7FAFF]">
              <div className="w-12 h-12 rounded-xl bg-[#10B981]/15 text-[#10B981] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-[#F7FAFF] mb-1">Instant Transfers</h3>
              <p className="text-xs text-[#94B4DB] leading-relaxed mb-4">
                Send money to registered beneficiaries via IMPS and NEFT. Protected by 4-digit PIN verification.
              </p>
              <Link to={isAuthenticated ? '/transfer' : '/login'} className="text-xs font-bold text-[#D62839] inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                <span>{isAuthenticated ? 'Send Money' : 'Sign In to Transfer'}</span> <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 3: E-Statements */}
            <div className="p-6 rounded-2xl bg-[#0D274D] hover:bg-[#12325E] border border-[#1E4578] hover:border-[#D62839]/50 transition-all duration-200 shadow-card group text-[#F7FAFF]">
              <div className="w-12 h-12 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-[#F7FAFF] mb-1">E-Statements</h3>
              <p className="text-xs text-[#94B4DB] leading-relaxed mb-4">
                Download verified transaction statements in PDF and CSV format, or send directly to your inbox.
              </p>
              <Link to={isAuthenticated ? '/statements' : '/login'} className="text-xs font-bold text-[#D62839] inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                <span>{isAuthenticated ? 'Download Statements' : 'Access Statements'}</span> <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 4: Security Shield */}
            <div className="p-6 rounded-2xl bg-[#0D274D] hover:bg-[#12325E] border border-[#1E4578] hover:border-[#D62839]/50 transition-all duration-200 shadow-card group text-[#F7FAFF]">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-[#F7FAFF] mb-1">Instant Account Freeze</h3>
              <p className="text-xs text-[#94B4DB] leading-relaxed mb-4">
                Freeze or unfreeze your debit accounts in one click to prevent unauthorized debit transactions anytime.
              </p>
              <Link to="/security" className="text-xs font-bold text-[#D62839] inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                <span>Learn Security Rules</span> <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Customer Protection Section */}
      <section className="py-16 bg-[#F5F8FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Graphic Security Matrix */}
            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-white border border-brand-border shadow-sm flex items-start gap-4">
                <div className="p-3 rounded-xl bg-brand-dark text-white flex-shrink-0">
                  <KeyRound className="w-6 h-6 text-brand-blue" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-brand-dark">Transaction PIN Authorization</h4>
                  <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                    Every outgoing transfer is protected by a dedicated cryptographic PIN separate from your login password, ensuring double security.
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-brand-border shadow-sm flex items-start gap-4">
                <div className="p-3 rounded-xl bg-brand-dark text-white flex-shrink-0">
                  <Bell className="w-6 h-6 text-brand-success" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-brand-dark">Real-Time Socket Gateway Notifications</h4>
                  <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                    Instant alerts pushed through real-time Socket.IO gateways the exact millisecond any deposit, withdrawal, or transfer occurs.
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-brand-border shadow-sm flex items-start gap-4">
                <div className="p-3 rounded-xl bg-brand-dark text-white flex-shrink-0">
                  <ShieldAlert className="w-6 h-6 text-brand-accent" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-brand-dark">Session Protection & Revocation</h4>
                  <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                    Monitor all active logins and terminate unrecognized devices remotely from your security dashboard at any time.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Security Narrative */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-brand-blue text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" /> Enterprise Security
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-dark tracking-tight leading-snug">
                Your Money is Guarded by Bank-Grade Protections
              </h2>

              <p className="text-sm sm:text-base text-brand-muted leading-relaxed">
                SecureBank combines strict data validation, JWT session rotation, rate-limited endpoints, and multi-tier database isolation to provide financial safety without compromising convenience.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-white border border-brand-border">
                  <span className="block text-2xl font-black text-brand-dark">100%</span>
                  <span className="text-xs text-brand-muted">Idempotent Transfer Guarantee</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-brand-border">
                  <span className="block text-2xl font-black text-brand-dark">0-Delay</span>
                  <span className="text-xs text-brand-muted">Instant Beneficiary Activation</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/security"
                  className="inline-flex items-center gap-2 text-sm font-bold text-brand-blue hover:text-brand-dark transition-colors"
                >
                  <span>Explore Security Architecture & Phishing Guidelines</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Digital Onboarding */}
      <section className="py-16 bg-white border-t border-brand-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold text-brand-blue tracking-wider uppercase">Simple Onboarding</h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-brand-dark mt-1">Get Started with SecureBank in 3 Steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="relative p-6 rounded-2xl bg-brand-bg border border-brand-border text-center">
              <div className="w-12 h-12 rounded-full bg-brand-dark text-white font-black text-lg flex items-center justify-center mx-auto mb-4 shadow-sm">
                1
              </div>
              <h3 className="font-bold text-lg text-brand-dark mb-2">Create Account</h3>
              <p className="text-xs text-brand-muted leading-relaxed">
                Fill in your legal details, registered phone number, and a secure password in less than 2 minutes.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative p-6 rounded-2xl bg-brand-bg border border-brand-border text-center">
              <div className="w-12 h-12 rounded-full bg-brand-blue text-white font-black text-lg flex items-center justify-center mx-auto mb-4 shadow-sm">
                2
              </div>
              <h3 className="font-bold text-lg text-brand-dark mb-2">Verify Email</h3>
              <p className="text-xs text-brand-muted leading-relaxed">
                Receive an authentication token to verify your ownership and securely activate your bank portal access.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative p-6 rounded-2xl bg-brand-bg border border-brand-border text-center">
              <div className="w-12 h-12 rounded-full bg-brand-success text-white font-black text-lg flex items-center justify-center mx-auto mb-4 shadow-sm">
                3
              </div>
              <h3 className="font-bold text-lg text-brand-dark mb-2">Setup PIN & Transact</h3>
              <p className="text-xs text-brand-muted leading-relaxed">
                Configure your 4-digit transaction PIN, deposit initial funds, and transfer money instantly with zero friction.
              </p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link
              to={isAuthenticated ? "/dashboard" : "/register"}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-brand-dark hover:bg-brand-blue text-white font-bold text-sm transition-colors shadow-md"
            >
              <span>{isAuthenticated ? "Go to My Dashboard" : "Begin Digital Registration"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="py-16 bg-[#F5F8FC] border-t border-brand-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-xs font-bold text-brand-blue tracking-wider uppercase">Customer Support</h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-brand-dark mt-1">Frequently Asked Questions</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-xl border border-brand-border bg-white overflow-hidden transition-all duration-150"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 font-bold text-sm text-brand-dark hover:text-brand-blue focus:outline-none"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-brand-blue flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-brand-muted flex-shrink-0" />}
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-4 text-xs text-brand-muted leading-relaxed border-t border-brand-border/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default HomePage;
