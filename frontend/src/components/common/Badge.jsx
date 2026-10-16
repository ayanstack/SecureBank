import React from 'react';

export const Badge = ({ children, variant = 'neutral', size = 'sm', className = '' }) => {
  const variants = {
    success: 'bg-[#E6F7F2] text-brand-success border-[#A3E5D4]',
    danger: 'bg-[#FDE8E9] text-brand-accent border-[#F8B3B6]',
    warning: 'bg-[#FFF8E6] text-[#B45309] border-[#FDE68A]',
    info: 'bg-brand-light text-brand-blue border-[#BFDBFE]',
    dark: 'bg-brand-dark text-white border-transparent',
    neutral: 'bg-slate-100 text-brand-muted border-slate-200',
  };

  const sizes = {
    xs: 'text-[10px] px-2 py-0.5 font-semibold',
    sm: 'text-xs px-2.5 py-0.5 font-medium',
    md: 'text-sm px-3 py-1 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border tracking-wide uppercase ${
        variants[variant] || variants.neutral
      } ${sizes[size] || sizes.sm} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
