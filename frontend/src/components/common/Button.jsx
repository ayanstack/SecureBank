import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  icon: Icon,
  iconPosition = 'left',
  onClick,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed select-none active:scale-[0.99]';

  const variants = {
    primary: 'bg-[#D62839] hover:bg-[#BA1E2E] active:bg-[#8A1420] text-white focus:ring-[#D62839] shadow-md transition-transform duration-150',
    dark: 'bg-[#0B1F3A] hover:bg-[#12325E] text-white focus:ring-[#1E4578] border border-[#1E4578] shadow-sm',
    secondary: 'bg-[#12325E] hover:bg-[#1A437C] text-[#F7FAFF] focus:ring-[#D62839] border border-[#1E4578]',
    outline: 'border border-[#1E4578] hover:bg-[#12325E] text-[#F7FAFF] focus:ring-[#D62839] bg-[#0D274D]',
    danger: 'bg-[#D62839] hover:bg-[#BA1E2E] text-white focus:ring-[#D62839] shadow-sm',
    ghost: 'hover:bg-[#12325E] text-[#94B4DB] hover:text-[#F7FAFF] focus:ring-[#D62839]',
    success: 'bg-[#10B981] hover:bg-[#059669] text-white focus:ring-[#10B981] shadow-sm',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3 gap-2.5 font-semibold',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
        </>
      )}
    </button>
  );
};

export default Button;
