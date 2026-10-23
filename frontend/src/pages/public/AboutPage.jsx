import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ShieldCheck, Award, Users, CheckCircle2, ArrowRight, Lock, Server, Landmark } from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import PublicFooter from '../../components/layout/PublicFooter';

export const AboutPage = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  return (
    <div className="min-h-screen bg-brand-bg text-brand-dark flex flex-col font-sans">
      <PublicNavbar />

      {/* Header Banner */}
      <section className="bg-gradient-to-r from-[#002b59] to-[#003b7a] text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-[#001f3f]">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 uppercase tracking-wider">
            <Landmark className="w-3.5 h-3.5" /> Platform Overview & Architecture
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">About CoinCraft</h1>
          <p className="text-sm sm:text-base text-white/80 max-w-2xl">
            A modern digital banking platform engineered to provide reliable, enterprise-grade fintech solutions: bcrypt PIN hashing, JWT session rotation, atomic MongoDB transactions, and defensive input validation.
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Mission & Vision */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl bg-white border border-brand-border shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-brand-blue flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-brand-dark">Our Engineering Philosophy</h2>
              <p className="text-sm text-brand-muted leading-relaxed">
                CoinCraft was designed to eliminate the vulnerabilities of legacy financial infrastructure. Every endpoint is strictly validated, every transaction enforces database-level idempotency to prevent double-debits, and every user session is actively monitored for token reuse.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white border border-brand-border shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-brand-success flex items-center justify-center font-bold">
                <Award className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-brand-dark">Security-First Banking Architecture</h2>
              <p className="text-sm text-brand-muted leading-relaxed">
                We deliver defensive security without compromise: 256-bit AES encryption, bcrypt cryptographic salting, Transaction PIN authorization, and instant account freezing capabilities.
              </p>
            </div>
          </div>

          {/* Core Pillars */}
          <div className="bg-white rounded-2xl p-8 border border-brand-border shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-brand-dark">Our Core Banking Architectural Pillars</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-2">
                <span className="text-brand-blue font-bold text-sm block">1. Cryptographic Isolation</span>
                <p className="text-xs text-brand-muted leading-relaxed">
                  Financial transactions and authorization tokens are strictly isolated. A stolen login token cannot authorize a transfer without the offline 4-digit PIN.
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-brand-blue font-bold text-sm block">2. Real-Time Telemetry</span>
                <p className="text-xs text-brand-muted leading-relaxed">
                  Socket.IO gateways stream live audit logs and transaction alerts to customers instantaneously, allowing immediate detection of anomalous activity.
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-brand-blue font-bold text-sm block">3. Transparent Auditing</span>
                <p className="text-xs text-brand-muted leading-relaxed">
                  Every credit, debit, transfer, and session event is recorded permanently in our audit logs, supporting downloadable CSV and PDF statements anytime.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Box */}
          <div className="p-8 rounded-2xl bg-brand-dark text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
            <div>
              <h3 className="text-xl font-bold">Experience CoinCraft Digital Banking</h3>
              <p className="text-xs sm:text-sm text-white/70 mt-1">Create an account in under 2 minutes and experience next-gen financial management.</p>
            </div>
            <Link
              to={isAuthenticated ? "/dashboard" : "/register"}
              className="px-6 py-3 rounded-xl bg-brand-blue hover:bg-[#0759af] text-white font-bold text-sm inline-flex items-center gap-2 flex-shrink-0"
            >
              <span>{isAuthenticated ? "Go to My Dashboard" : "Open Account"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default AboutPage;
