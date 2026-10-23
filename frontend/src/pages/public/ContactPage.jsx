import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, ShieldCheck, Send, CheckCircle2 } from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import PublicFooter from '../../components/layout/PublicFooter';

export const ContactPage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-dark flex flex-col font-sans">
      <PublicNavbar />

      <section className="bg-gradient-to-r from-[#002b59] to-[#003b7a] text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-[#001f3f]">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 uppercase tracking-wider">
            <Phone className="w-3.5 h-3.5" /> Customer Contact Desk
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Customer Support & Contact</h1>
          <p className="text-sm sm:text-base text-white/80 max-w-2xl">
            Reach out regarding technical assistance, account inquiries, or service feedback. Our team is available 24x7.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left 5 Cols: Contact Channels */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 rounded-2xl bg-white border border-brand-border shadow-sm space-y-4">
                <h3 className="font-bold text-lg text-brand-dark">Official Communication Channels</h3>

                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-blue-50 text-brand-blue flex-shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-brand-dark block">24x7 Customer Helpline</span>
                      <a href="tel:+916267239091" className="text-brand-blue font-bold text-base hover:underline">
                        +91 6267239091
                      </a>
                      <p className="text-xs text-brand-muted mt-0.5">Available 24x7 for urgent account lock and banking support</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 flex-shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-brand-dark block">Dedicated Support Email</span>
                      <a href="mailto:ayanshaikh15082007@gmail.com" className="text-brand-dark font-medium hover:text-brand-blue transition-colors break-all">
                        ayanshaikh15082007@gmail.com
                      </a>
                      <p className="text-xs text-brand-muted mt-0.5">Response typically within 4 business hours</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 flex-shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-brand-dark block">Operational Hours</span>
                      <span className="text-brand-dark font-medium">Digital Banking: 24x7x365</span>
                      <p className="text-xs text-brand-muted mt-0.5">Helpline Support: 24 Hours / 7 Days</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-brand-dark text-white shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" /> Immediate Compromise Response
                </div>
                <h4 className="font-bold text-base">Suspect unauthorized activity?</h4>
                <p className="text-xs text-white/70 leading-relaxed">
                  Log into your account immediately to toggle your account status to <strong>FROZEN</strong> from your dashboard, or call <a href="tel:+916267239091" className="text-emerald-400 font-bold underline">+91 6267239091</a> to freeze all operations instantly.
                </p>
              </div>
            </div>

            {/* Right 7 Cols: Inquiry Message Form */}
            <div className="lg:col-span-7">
              <div className="p-8 rounded-2xl bg-white border border-brand-border shadow-sm space-y-6">
                <div>
                  <h3 className="font-bold text-xl text-brand-dark">Send a Message to Support</h3>
                  <p className="text-xs text-brand-muted mt-1">Please do not include sensitive information like passwords or PINs in your message.</p>
                </div>

                {submitted ? (
                  <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-brand-success flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-base text-emerald-900">Message Received</h4>
                    <p className="text-xs text-emerald-800 max-w-md mx-auto">
                      Thank you for contacting CoinCraft. Your inquiry ticket #CC-{Math.floor(100000 + Math.random() * 900000)} has been logged. An officer will respond to your registered email shortly.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSubmitted(false);
                        setForm({ name: '', email: '', subject: '', message: '' });
                      }}
                      className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                    >
                      Submit Another Query
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-brand-dark mb-1.5">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder="Your legal name"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm focus:outline-none focus:border-brand-blue"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-brand-dark mb-1.5">Email Address *</label>
                        <input
                          type="email"
                          required
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          placeholder="name@example.com"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm focus:outline-none focus:border-brand-blue"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-brand-dark mb-1.5">Subject *</label>
                      <input
                        type="text"
                        required
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        placeholder="Nature of inquiry (e.g., Transfer status, Statement request)"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm focus:outline-none focus:border-brand-blue"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-brand-dark mb-1.5">Message / Details *</label>
                      <textarea
                        required
                        rows={4}
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        placeholder="Describe your inquiry or feedback..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm focus:outline-none focus:border-brand-blue resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-dark hover:bg-brand-blue text-white font-bold text-sm transition-colors shadow-sm"
                    >
                      <Send className="w-4 h-4" />
                      <span>Transmit Message to Support</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default ContactPage;
