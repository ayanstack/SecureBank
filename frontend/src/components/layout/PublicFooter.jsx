import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import Logo from '../common/Logo';

export const PublicFooter = () => {
  return (
    <footer className="bg-[#081526] text-[#94B4DB] pt-16 pb-12 border-t-4 border-[#D62839] select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#1E4578]">
          {/* Col 1 & 2: Brand & Security Overview */}
          <div className="lg:col-span-2 space-y-4">
            <Logo variant="light" size="lg" />
            <p className="text-sm text-[#94B4DB] max-w-sm leading-relaxed">
              SecureBank is an educational MERN full-stack banking simulation built for portfolio evaluation and technical interviews. Not a real bank or financial repository.
            </p>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 max-w-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Simulation Security Architecture</span>
              </div>
              <p className="text-xs text-white/60">
                Implements production-grade patterns: bcrypt salt hashing, 4-digit PIN verification, idempotent transfers, and JWT session lifecycle rotation.
              </p>
            </div>
          </div>

          {/* Col 3: Accounts & Services */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Banking Services</h4>
            <ul className="space-y-2.5 text-sm text-white/70">
              <li>
                <Link to="/services" className="hover:text-white transition-colors">Instant Savings Account</Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors">Commercial Current Account</Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors">IMPS / NEFT Money Transfers</Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors">Automated PDF / CSV Statements</Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors">Real-time Socket Notifications</Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Trust & Governance */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Security & Trust</h4>
            <ul className="space-y-2.5 text-sm text-white/70">
              <li>
                <Link to="/security" className="hover:text-white transition-colors">Safe NetBanking Guidelines</Link>
              </li>
              <li>
                <Link to="/security" className="hover:text-white transition-colors">Transaction PIN Protection</Link>
              </li>
              <li>
                <Link to="/security" className="hover:text-white transition-colors">Session Multi-Factor Controls</Link>
              </li>
              <li>
                <Link to="/security" className="hover:text-white transition-colors">Phishing & Fraud Advisory</Link>
              </li>
              <li>
                <Link to="/security" className="hover:text-white transition-colors">Report Compromised Device</Link>
              </li>
            </ul>
          </div>

          {/* Col 5: Help & Emergency */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">24x7 Helpdesk</h4>
            <div className="space-y-3 text-sm text-white/70">
              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-brand-blue flex-shrink-0 mt-0.5" />
                <div>
                  <a href="tel:+916267239091" className="block text-white font-semibold hover:text-brand-blue transition-colors">
                    +91 6267239091
                  </a>
                  <span className="text-xs text-white/50">24x7 Customer Helpline</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-brand-blue flex-shrink-0 mt-0.5" />
                <div>
                  <a href="mailto:ayanshaikh15082007@gmail.com" className="block text-white font-semibold hover:text-brand-blue transition-colors break-all">
                    ayanshaikh15082007@gmail.com
                  </a>
                  <span className="text-xs text-white/50">Dedicated Customer Desk</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue hover:text-white transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" /> Access Customer NetBanking
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Regulatory & Copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <p>
            &copy; {new Date().getFullYear()} SecureBank Demo — Educational Portfolio Project. Developed for technical demonstration only. Not a licensed or chartered financial institution.
          </p>

          <div className="flex items-center gap-6">
            <Link to="/security" className="hover:text-white transition-colors">Security Architecture</Link>
            <Link to="/about" className="hover:text-white transition-colors">About Project</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Developer Contact</Link>
            <span className="text-brand-success font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-brand-success animate-pulse"></span>
              Simulation Platform Active
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
