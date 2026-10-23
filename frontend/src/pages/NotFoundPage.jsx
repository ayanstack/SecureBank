import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import Button from '../components/common/Button';
import Logo from '../components/common/Logo';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-bg p-6 text-center select-none">
      <div className="mb-8">
        <Logo size="lg" />
      </div>

      <div className="w-20 h-20 rounded-3xl bg-red-50 text-brand-accent flex items-center justify-center mb-6 shadow-sm border border-red-100">
        <ShieldAlert className="w-10 h-10" />
      </div>

      <h1 className="text-4xl font-extrabold text-brand-dark tracking-tight mb-2">
        404 — Page Not Found
      </h1>
      <p className="text-sm text-brand-muted max-w-md mb-8 leading-relaxed">
        The requested digital banking page or resource does not exist or has been relocated to maintain bank security.
      </p>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="md" onClick={() => navigate(-1)} icon={ArrowLeft}>
          Go Back
        </Button>
        <Button variant="primary" size="md" onClick={() => navigate('/dashboard')} icon={Home}>
          Dashboard
        </Button>
      </div>

      <div className="mt-12 text-xs text-brand-muted">
        CoinCraft NetBanking Infrastructure • Protected by 256-bit SSL
      </div>
    </div>
  );
};

export default NotFoundPage;
