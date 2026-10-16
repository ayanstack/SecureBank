import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ShieldCheck,
  Lock,
  Phone,
  HelpCircle,
  Menu,
  X,
  ChevronRight,
  ArrowRight,
  ExternalLink,
  Smartphone,
  Globe,
} from 'lucide-react';
import Logo from '../common/Logo';

export const PublicNavbar = () => {
  const location = useLocation();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Personal Banking', path: '/services' },
    { label: 'Security & Trust', path: '/security' },
    { label: 'About Us', path: '/about' },
    { label: 'Help & Contact', path: '/contact' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-[#0B1F3A] border-b border-[#1E4578] shadow-md text-[#F7FAFF]">
      {/* Top Utility Bar (HDFC Style) */}
      <div className="bg-[#081526] text-white/90 text-xs py-1.5 px-4 sm:px-8 border-b border-[#1E4578] hidden sm:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-white tracking-wide flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#D62839]" /> Personal Banking
            </span>
            <span className="text-white/60 hover:text-white cursor-pointer transition-colors">NRI Banking</span>
            <span className="text-white/60 hover:text-white cursor-pointer transition-colors">SME & Corporate</span>
          </div>

          <div className="flex items-center gap-5 text-white/80">
            <div className="flex items-center gap-1.5 text-white/70">
              <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Full-Stack MERN Portfolio Project</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-none">
            <Logo variant="light" size="lg" />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 font-medium text-sm text-[#F7FAFF]">
            <Link
              to="/"
              className={`transition-colors duration-150 py-1 border-b-2 ${
                isActive('/')
                  ? 'border-[#D62839] text-[#D62839] font-bold'
                  : 'border-transparent text-[#94B4DB] hover:text-[#F7FAFF]'
              }`}
            >
              Home
            </Link>

            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`transition-colors duration-150 py-1 border-b-2 ${
                  isActive(link.path)
                    ? 'border-[#D62839] text-[#D62839] font-bold'
                    : 'border-transparent text-[#94B4DB] hover:text-[#F7FAFF]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#D62839] text-white font-semibold text-sm hover:bg-[#BA1E2E] transition-all duration-150 shadow-glow-red"
              >
                <span>Dashboard ({user?.firstName || 'Portal'})</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="px-4 py-2.5 rounded-lg border border-[#1E4578] text-[#F7FAFF] hover:border-[#D62839] hover:text-[#D62839] font-semibold text-sm transition-colors duration-150"
                >
                  Open Account
                </Link>

                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#D62839] hover:bg-[#BA1E2E] text-white font-semibold text-sm transition-all duration-150 shadow-glow-red"
                >
                  <Lock className="w-4 h-4" />
                  <span>NetBanking Login</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden items-center gap-2">
            {isAuthenticated && (
              <Link
                to="/dashboard"
                className="text-xs px-3 py-1.5 bg-brand-dark text-white font-semibold rounded-lg"
              >
                Dashboard
              </Link>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-brand-dark hover:bg-brand-light focus:outline-none"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-brand-border px-4 py-5 space-y-4 shadow-xl animate-in slide-in-from-top-2">
          <nav className="flex flex-col space-y-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                isActive('/') ? 'bg-brand-light text-brand-blue' : 'text-brand-dark hover:bg-brand-bg'
              }`}
            >
              Home
            </Link>

            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                  isActive(link.path)
                    ? 'bg-brand-light text-brand-blue'
                    : 'text-brand-dark hover:bg-brand-bg'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="pt-4 border-t border-brand-border flex flex-col gap-2.5">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-brand-dark text-white font-semibold text-sm shadow-sm"
              >
                <span>Go to NetBanking Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-brand-dark text-white font-semibold text-sm shadow-sm"
                >
                  <Lock className="w-4 h-4 text-brand-blue" />
                  <span>NetBanking Login</span>
                </Link>

                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-lg border border-brand-border text-brand-dark font-semibold text-sm hover:border-brand-blue"
                >
                  Open Digital Savings Account
                </Link>
              </>
            )}
          </div>

          <div className="pt-3 border-t border-brand-border text-xs text-brand-muted flex items-center justify-between">
            <span>24x7 Customer Care: +91 6267239091</span>
            <span className="flex items-center gap-1 text-brand-success font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> 256-Bit SSL
            </span>
          </div>
        </div>
      )}
    </header>
  );
};

export default PublicNavbar;
