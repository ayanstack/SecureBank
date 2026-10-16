import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeToast } from '../../features/ui/uiSlice';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastItem = ({ toast }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => {
        dispatch(removeToast(toast.id));
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast, dispatch]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-brand-success flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-brand-accent flex-shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-[#F59E0B] flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-brand-blue flex-shrink-0" />,
  };

  const borders = {
    success: 'border-l-4 border-l-brand-success',
    error: 'border-l-4 border-l-brand-accent',
    warning: 'border-l-4 border-l-[#F59E0B]',
    info: 'border-l-4 border-l-brand-blue',
  };

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 w-full max-w-sm rounded-xl bg-white p-4 shadow-xl border border-brand-border ${
        borders[toast.type] || borders.info
      } animate-slide-in transition-all`}
      role="alert"
    >
      {icons[toast.type] || icons.info}
      <div className="flex-1 min-w-0">
        {toast.title && <h4 className="text-sm font-bold text-brand-dark leading-tight">{toast.title}</h4>}
        {toast.message && <p className="text-xs text-brand-muted mt-0.5 leading-relaxed break-words">{toast.message}</p>}
      </div>
      <button
        onClick={() => dispatch(removeToast(toast.id))}
        className="text-brand-muted hover:text-brand-dark p-1 rounded-md transition-colors"
        aria-label="Dismiss toast"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ToastContainer = () => {
  const toasts = useSelector((state) => state.ui.toasts);

  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      aria-live="assertive"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
};

export default ToastContainer;
