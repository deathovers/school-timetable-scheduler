import React, { useEffect } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: () => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 4500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const styleConfig = {
    success: {
      bg: "bg-white",
      border: "border-emerald-200",
      iconBg: "bg-emerald-50 text-emerald-600 border-emerald-100",
      titleColor: "text-emerald-950",
      msgColor: "text-emerald-800",
      icon: CheckCircle2,
    },
    error: {
      bg: "bg-white",
      border: "border-rose-200",
      iconBg: "bg-rose-50 text-rose-600 border-rose-100",
      titleColor: "text-rose-950",
      msgColor: "text-rose-800",
      icon: AlertTriangle,
    },
    info: {
      bg: "bg-white",
      border: "border-indigo-200",
      iconBg: "bg-indigo-50 text-indigo-600 border-indigo-100",
      titleColor: "text-indigo-950",
      msgColor: "text-indigo-800",
      icon: Info,
    },
  }[toast.type];

  const Icon = styleConfig.icon;

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border ${styleConfig.border} ${styleConfig.bg} shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2 duration-200`}
    >
      <div
        className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${styleConfig.iconBg}`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={`text-xs font-bold ${styleConfig.titleColor}`}>{toast.title}</h4>
        {toast.message && (
          <p className={`text-[11px] mt-0.5 leading-snug break-words ${styleConfig.msgColor}`}>
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors cursor-pointer"
        aria-label="Close notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

