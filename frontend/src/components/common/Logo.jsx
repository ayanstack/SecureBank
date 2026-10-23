import React from 'react';
import { Coins } from 'lucide-react';

export const Logo = ({ variant = 'default', size = 'default', className = '' }) => {
  const isLight = variant === 'light'; // For dark backgrounds (sidebar, login hero, navbar)
  
  const iconSizes = {
    sm: 'w-6 h-6',
    default: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-lg',
    default: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2.5 font-bold tracking-tight select-none ${className}`}>
      <div className={`relative flex items-center justify-center rounded-lg p-1.5 transition-transform duration-200 hover:scale-105 ${
        isLight ? 'bg-white/10 text-white border border-white/20' : 'bg-[#0D274D] text-white shadow-sm border border-[#1E4578]'
      }`}>
        <Coins className={`${iconSizes[size] || iconSizes.default} text-[#D62839]`} />
      </div>
      <div className="flex flex-col leading-none">
        <span className={`${textSizes[size] || textSizes.default} font-extrabold ${isLight ? 'text-[#F7FAFF]' : 'text-slate-900'}`}>
          Coin<span className="text-[#D62839]">Craft</span>
        </span>
        <span className={`text-[9px] uppercase tracking-wider font-semibold ${isLight ? 'text-[#94B4DB]' : 'text-slate-500'}`}>
          Digital Banking
        </span>
      </div>
    </div>
  );
};

export default Logo;
