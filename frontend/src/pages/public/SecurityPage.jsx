import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, AlertTriangle, KeyRound, Smartphone, EyeOff, ShieldAlert, CheckCircle2 } from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import PublicFooter from '../../components/layout/PublicFooter';

export const SecurityPage = () => {
  return (
    <div className="min-h-screen bg-brand-bg text-brand-dark flex flex-col font-sans">
      <PublicNavbar />

      <section className="bg-gradient-to-r from-[#002b59] to-[#003b7a] text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-[#001f3f]">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" /> Security & Trust Center
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Security & Safe Banking Guidelines</h1>
          <p className="text-sm sm:text-base text-white/80 max-w-2xl">
            Learn how SecureBank protects your assets through multi-layer cryptography, and review safe NetBanking practices to keep your account immune to phishing.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Anti-Phishing Advisory */}
          <div className="p-6 sm:p-8 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col md:flex-row items-start gap-5">
            <div className="p-3 rounded-xl bg-amber-100 text-amber-800 flex-shrink-0">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-amber-900">Official Anti-Fraud & Phishing Advisory</h2>
              <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
                SecureBank will <strong>never</strong> ask for your login password, 4-digit transaction PIN, or email verification tokens via phone calls, SMS, WhatsApp, or emails. Never share these credentials with any individual, representative, or third-party website.
              </p>
            </div>
          </div>

          {/* 4 Pillars of Architecture */}
          <div>
            <h3 className="text-xl font-bold text-brand-dark mb-6">Our Platform Protections</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 rounded-2xl bg-white border border-brand-border shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-brand-blue flex items-center justify-center font-bold">
                  <Lock className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-base text-brand-dark">256-Bit SSL/TLS 1.3</h4>
                <p className="text-xs text-brand-muted leading-relaxed">
                  All HTTP and WebSocket communications are encrypted over high-grade TLS protocols with strict transport security.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-brand-border shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-base text-brand-dark">Transaction PIN</h4>
                <p className="text-xs text-brand-muted leading-relaxed">
                  Bcrypt-hashed 4-digit PIN is strictly required for outgoing transfers, isolating authorization from web session tokens.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-brand-border shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-brand-success flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-base text-brand-dark">Instant Freeze Switch</h4>
                <p className="text-xs text-brand-muted leading-relaxed">
                  Customers can freeze any account in real-time with one click from their accounts dashboard if a compromise is suspected.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-brand-border shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <EyeOff className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-base text-brand-dark">NoSQL Injection Defense</h4>
                <p className="text-xs text-brand-muted leading-relaxed">
                  Sanitized database inputs and validated query parameters prevent parameter tampering and data leaks.
                </p>
              </div>
            </div>
          </div>

          {/* Customer Best Practices Checklist */}
          <div className="p-8 rounded-2xl bg-white border border-brand-border shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-brand-dark">Customer Best Practices for Safe NetBanking</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-brand-bg border border-brand-border">
                <CheckCircle2 className="w-5 h-5 text-brand-success flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-xs text-brand-dark">Verify the Browser Address Bar</h5>
                  <p className="text-xs text-brand-muted mt-0.5">Ensure you are connected to the official SecureBank portal domain with a valid HTTPS lock icon.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-brand-bg border border-brand-border">
                <CheckCircle2 className="w-5 h-5 text-brand-success flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-xs text-brand-dark">Use Strong, Unique Passwords</h5>
                  <p className="text-xs text-brand-muted mt-0.5">Maintain at least 8 characters with a combination of uppercase, lowercase, numbers, and symbols.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-brand-bg border border-brand-border">
                <CheckCircle2 className="w-5 h-5 text-brand-success flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-xs text-brand-dark">Always Log Out on Shared Devices</h5>
                  <p className="text-xs text-brand-muted mt-0.5">Click the "Sign Out" button in your dashboard rather than simply closing your browser tab.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-brand-bg border border-brand-border">
                <CheckCircle2 className="w-5 h-5 text-brand-success flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-xs text-brand-dark">Review Active Sessions Periodically</h5>
                  <p className="text-xs text-brand-muted mt-0.5">Check your Profile &gt; Active Sessions tab and immediately terminate any unrecognized login instances.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default SecurityPage;
