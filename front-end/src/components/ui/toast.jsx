/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import formatFrenchTypography from '../../utils/frenchTypography';

const ToastContext = createContext(null);

const TYPE_STYLES = {
  success: {
    container: 'border-emerald-200 bg-emerald-50',
    icon: 'text-emerald-600',
    Icon: CheckCircle2,
  },
  error: {
    container: 'border-rose-200 bg-rose-50',
    icon: 'text-rose-600',
    Icon: AlertCircle,
  },
  info: {
    container: 'border-blue-200 bg-blue-50',
    icon: 'text-blue-600',
    Icon: Info,
  },
};

const ToastItem = ({ toast, onClose }) => {
  React.useEffect(() => {
    if (toast.duration === 0) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      onClose(toast.id);
    }, toast.duration);

    return () => window.clearTimeout(timeout);
  }, [toast, onClose]);

  const style = TYPE_STYLES[toast.type] || TYPE_STYLES.info;
  const Icon = style.Icon;

  return (
    <div
      className={[
        'pointer-events-auto w-full rounded-xl border p-4 shadow-lg',
        'animate-[toast-in_180ms_ease-out]',
        style.container,
      ].join(' ')}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <Icon className={style.icon} size={18} />
        <div className="min-w-0 flex-1">
          {toast.title ? (
            <p className="text-sm font-semibold text-text">{formatFrenchTypography(toast.title)}</p>
          ) : null}
          {toast.message ? (
            <p className="mt-1 text-sm text-muted">{formatFrenchTypography(toast.message)}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => onClose(toast.id)}
          className="rounded-md p-1 text-muted transition hover:bg-background hover:text-text"
          aria-label="Fermer la notification"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export const ToastProvider = ({ children, maxToasts = 5 }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const pushToast = useCallback((input) => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const toast = {
      id,
      title: input.title || '',
      message: input.message || '',
      type: input.type || 'info',
      duration: Number.isFinite(input.duration) ? input.duration : 3500,
    };

    setToasts((prev) => [toast, ...prev].slice(0, maxToasts));
    return id;
  }, [maxToasts]);

  const api = useMemo(() => ({
    toast: (message, options = {}) => pushToast({ message, ...options }),
    success: (message, options = {}) => pushToast({ message, type: 'success', ...options }),
    error: (message, options = {}) => pushToast({ message, type: 'error', ...options }),
    info: (message, options = {}) => pushToast({ message, type: 'info', ...options }),
    removeToast,
    clear: () => setToasts([]),
  }), [pushToast, removeToast]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-2">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }

  return context;
};

export default ToastItem;
