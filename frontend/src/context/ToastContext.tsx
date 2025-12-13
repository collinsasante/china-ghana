import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, message: string, duration?: number) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (type: ToastType, title: string, message: string, duration: number = 5000) => {
    const id = Date.now().toString();
    const toast = { id, type, title, message };

    setToasts((prev) => [...prev, toast]);

    // Auto-hide after duration
    setTimeout(() => {
      hideToast(id);
    }, duration);
  };

  const hideToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const getToastClass = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-success';
      case 'error':
        return 'bg-danger';
      case 'warning':
        return 'bg-warning';
      case 'info':
        return 'bg-info';
      default:
        return 'bg-primary';
    }
  };

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bi-check-circle-fill';
      case 'error':
        return 'bi-x-circle-fill';
      case 'warning':
        return 'bi-exclamation-triangle-fill';
      case 'info':
        return 'bi-info-circle-fill';
      default:
        return 'bi-bell-fill';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}

      {/* Toast Container */}
      <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 9999 }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast show ${getToastClass(toast.type)} text-white mb-2`}
            role="alert"
            style={{ minWidth: '300px' }}
          >
            <div className="toast-header text-white" style={{ background: 'inherit', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
              <i className={`${getToastIcon(toast.type)} me-2`}></i>
              <strong className="me-auto">{toast.title}</strong>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => hideToast(toast.id)}
              ></button>
            </div>
            <div className="toast-body">
              {toast.message}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
