import { CheckCircle2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ToastContext } from './toastContext.js';

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const value = useMemo(
    () => ({
      showToast(message, tone = 'success') {
        const id = crypto.randomUUID();
        setToasts((current) => [...current, { id, message, tone }]);
        window.setTimeout(() => {
          setToasts((current) => current.filter((toast) => toast.id !== id));
        }, 3500);
      }
    }),
    []
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[80] grid w-[min(24rem,calc(100vw-2rem))] gap-2">
        {toasts.map((toast) => (
          <div
            className={`flex items-start gap-3 rounded-lg px-4 py-3 text-sm font-semibold shadow-lg ring-1 ${
              toast.tone === 'error' ? 'bg-red-50 text-red-800 ring-red-100' : 'bg-white text-ink ring-neutral-200'
            }`}
            key={toast.id}
            role="status"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
            <p className="flex-1">{toast.message}</p>
            <button
              className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100"
              type="button"
              aria-label="Dismiss notification"
              onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
