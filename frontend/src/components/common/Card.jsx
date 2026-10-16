import React from 'react';

export const Card = ({ children, className = '', hover = false, ...props }) => {
  return (
    <div
      className={`bg-[#0D274D] rounded-xl border border-[#1E4578] shadow-card overflow-hidden transition-all duration-200 text-[#F7FAFF] ${
        hover ? 'hover:shadow-card-hover hover:border-[#D62839]/50' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', ...props }) => {
  return (
    <div className={`px-5 py-4 border-b border-[#1E4578] flex items-center justify-between ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardTitle = ({ children, className = '', ...props }) => {
  return (
    <h3 className={`text-base font-bold text-[#F7FAFF] tracking-tight ${className}`} {...props}>
      {children}
    </h3>
  );
};

export const CardDescription = ({ children, className = '', ...props }) => {
  return (
    <p className={`text-xs text-[#94B4DB] mt-0.5 ${className}`} {...props}>
      {children}
    </p>
  );
};

export const CardContent = ({ children, className = '', ...props }) => {
  return (
    <div className={`p-5 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter = ({ children, className = '', ...props }) => {
  return (
    <div className={`px-5 py-3.5 bg-[#081526]/60 border-t border-[#1E4578] flex items-center justify-between ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;
