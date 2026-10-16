import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const Input = ({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  icon: Icon,
  className = '',
  autoComplete,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
  const inputId = id || `input_${label?.toLowerCase().replace(/\s+/g, '_') || Math.random().toString(36).substring(2, 7)}`;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-[#94B4DB] mb-1.5 uppercase tracking-wide">
          {label} {required && <span className="text-[#D62839]">*</span>}
        </label>
      )}

      <div className="relative rounded-lg shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#628CBF]">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          id={inputId}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`block w-full text-sm rounded-lg border transition-colors duration-150 py-2.5 bg-[#081526] text-[#F7FAFF] placeholder-[#628CBF] focus:outline-none focus:ring-2 focus:ring-[#D62839]/40 focus:border-[#D62839] disabled:bg-[#060F1C] disabled:cursor-not-allowed ${
            Icon ? 'pl-9' : 'pl-3.5'
          } ${isPassword ? 'pr-10' : 'pr-3.5'} ${
            error ? 'border-[#D62839] focus:ring-[#D62839]/40 focus:border-[#D62839]' : 'border-[#1E4578]'
          }`}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-brand-muted hover:text-brand-text focus:outline-none"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>

      {error ? (
        <p className="mt-1 text-xs text-brand-accent font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-brand-muted">{helperText}</p>
      ) : null}
    </div>
  );
};

export default Input;
