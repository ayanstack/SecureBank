import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { CreditCard, Send, FileText, Bell, KeyRound, ShieldCheck, ArrowRight, Check } from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import PublicFooter from '../../components/layout/PublicFooter';

export const ServicesPage = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  const services = [
    {
      title: 'Digital Savings Accounts',
      desc: 'High-liquidity savings accounts with daily interest calculation, instant account generation, and full digital control.',
      icon: CreditCard,
      authPath: '/accounts?new=true',
      features: ['Zero account opening fees', 'Instant IBAN/Account Number generation', 'Instant Freeze / Unfreeze switch', 'Multi-account support under single login'],
    },
    {
      title: 'Commercial Current Accounts',
      desc: 'Designed for high-frequency business payments, multi-party transfers, and enterprise cash flow management.',
      icon: CreditCard,
      authPath: '/accounts?new=true',
      features: ['Higher transaction allowances', 'Dedicated beneficiary directory', 'Detailed debit/credit categorization', 'Batch CSV export for accounting'],
    },
    {
      title: 'Real-Time IMPS / NEFT Transfers',
      desc: 'Send money instantly to verified beneficiaries with bank-level verification and zero transaction fees.',
      icon: Send,
      authPath: '/transfers',
      features: ['Cryptographic Transaction PIN security', 'Idempotency key prevents double debit', 'Instant confirmation reference', 'Instant refund on transfer reversal'],
    },
    {
      title: 'Automated Account Statements',
      desc: 'Generate official bank statements on demand for visa applications, tax filing, or personal record-keeping.',
      icon: FileText,
      authPath: '/statements',
      features: ['Formatted PDF downloads', 'Machine-readable CSV format', 'Direct email delivery to verified inbox', 'Custom date range filtering'],
    },
    {
      title: 'Real-Time Socket Alerts',
      desc: 'Stay informed with instant push notifications over secure web socket channels the moment your balance updates.',
      icon: Bell,
      authPath: '/notifications',
      features: ['Instant deposit & withdrawal notifications', 'Beneficiary addition confirmations', 'Security login alerts', 'One-click mark all as read'],
    },
    {
      title: 'Multi-Session Device Control',
      desc: 'Total transparency over which browsers and devices are authorized to access your banking profile.',
      icon: ShieldCheck,
      authPath: '/profile',
      features: ['View IP address & user agent for every login', 'Active session timestamp tracking', 'Remote session termination', 'Automatic token revocation'],
    },
  ];

  return (
    <div className="min-h-screen bg-brand-bg text-brand-dark flex flex-col font-sans">
      <PublicNavbar />

      <section className="bg-gradient-to-r from-[#002b59] to-[#003b7a] text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-[#001f3f]">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-300 uppercase tracking-wider">
            <CreditCard className="w-3.5 h-3.5" /> Retail & Corporate Solutions
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Our Banking Services</h1>
          <p className="text-sm sm:text-base text-white/80 max-w-2xl">
            A comprehensive suite of modern digital financial services built for speed, transparency, and uncompromised security.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <div
                  key={index}
                  className="p-7 rounded-2xl bg-white border border-brand-border hover:border-brand-blue/40 shadow-sm hover:shadow-card transition-all duration-200 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center font-bold">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-brand-dark">{service.title}</h3>
                    <p className="text-xs text-brand-muted leading-relaxed">{service.desc}</p>

                    <div className="pt-2 border-t border-brand-border space-y-2">
                      {service.features.map((feat, fidx) => (
                        <div key={fidx} className="flex items-center gap-2 text-xs text-brand-dark font-medium">
                          <Check className="w-3.5 h-3.5 text-brand-success flex-shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6">
                    <Link
                      to={isAuthenticated ? (service.authPath || '/dashboard') : '/register'}
                      className="text-xs font-bold text-brand-blue hover:text-brand-dark inline-flex items-center gap-1.5 transition-colors"
                    >
                      <span>{isAuthenticated ? 'Access this Service' : 'Get Started with this Service'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
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

export default ServicesPage;
