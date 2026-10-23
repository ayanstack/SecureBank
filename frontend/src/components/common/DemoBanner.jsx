import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

export const DemoBanner = ({ variant = 'banner', className = '' }) => {
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs font-medium ${className}`}>
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
        <span>Educational Simulation • Not a Real Bank</span>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 px-4 py-2 text-xs font-semibold shadow-inner ${className}`}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 text-center sm:text-left">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/15 text-[11px] font-black uppercase tracking-wider text-slate-950 flex-shrink-0">
          <AlertTriangle className="w-3.5 h-3.5" />
          Educational Portfolio Demo
        </span>
        <span className="text-slate-950 leading-tight">
          SecureBank is a software engineering portfolio simulation. <strong>It is NOT a real bank.</strong> Never submit real banking passwords, ATM/UPI PINs, or sensitive financial data.
        </span>
      </div>
    </div>
  );
};

export default DemoBanner;
