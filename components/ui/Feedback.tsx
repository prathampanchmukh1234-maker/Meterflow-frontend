import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '../../utils';
import { Button } from './Base';

export type ToastState = {
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
} | null;

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const toastStyles = {
  success: {
    icon: CheckCircle2,
    className: 'border-teal-500/30 bg-teal-500/10 text-teal-300',
  },
  error: {
    icon: XCircle,
    className: 'border-red-500/30 bg-red-500/10 text-red-300',
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  },
  info: {
    icon: Info,
    className: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
  },
};

export function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  if (!toast) return null;
  const styles = toastStyles[toast.type];
  const Icon = styles.icon;

  return (
    <div className="fixed left-4 right-4 top-20 z-[120] sm:left-auto sm:right-6 sm:w-96 sm:max-w-[calc(100vw-2rem)] animate-in slide-in-from-top-2 fade-in duration-200">
      <div className={cn('rounded-xl border p-4 shadow-2xl backdrop-blur-md', styles.className)}>
        <div className="flex items-start gap-3">
          <Icon className="w-5 h-5 mt-0.5 flex-none" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white">{toast.title}</p>
            {toast.message && <p className="text-xs text-slate-300 mt-1 leading-relaxed">{toast.message}</p>}
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'info',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;
  const isDanger = tone === 'danger';
  const isWarning = tone === 'warning';

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-purple-500/20 bg-[#171A25] p-4 sm:p-6 shadow-2xl animate-in zoom-in-95 fade-in duration-200">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'rounded-xl p-3',
              isDanger && 'bg-red-500/10 text-red-400',
              isWarning && 'bg-amber-500/10 text-amber-400',
              !isDanger && !isWarning && 'bg-purple-500/10 text-purple-400'
            )}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button type="button" variant={isDanger ? 'danger' : 'primary'} onClick={onConfirm} disabled={isLoading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
