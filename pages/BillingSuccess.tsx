import { Link, useLocation } from 'react-router-dom';
import { Card, Button, Badge } from '../components/ui/Base';
import { CheckCircle2, CreditCard, FileText, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../utils';

type SuccessState = {
  kind?: 'plan' | 'invoice';
  title?: string;
  message?: string;
  planName?: string;
  amount?: number;
  paymentId?: string;
  invoiceId?: string;
};

export default function BillingSuccess() {
  const location = useLocation();
  const state = (location.state || {}) as SuccessState;
  const kind = state.kind || 'invoice';

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
      <Card className="w-full max-w-2xl bg-[#1E2130]/50 border-teal-500/20 text-center">
        <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
          <CheckCircle2 className="w-9 h-9 text-teal-400" />
        </div>

        <Badge status="paid" className="mb-4" />
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          {state.title || (kind === 'plan' ? 'Plan switched successfully' : 'Payment successful')}
        </h1>
        <p className="text-slate-400 mt-3">
          {state.message || 'Your billing workspace has been refreshed.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 text-left">
          <div className="rounded-xl bg-slate-900/60 border border-slate-700/60 p-4">
            <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">
              {kind === 'plan' ? <CreditCard className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
              {kind === 'plan' ? 'Active Plan' : 'Invoice'}
            </div>
            <p className="text-white font-bold truncate">{state.planName || state.invoiceId || 'Updated'}</p>
          </div>

          <div className="rounded-xl bg-slate-900/60 border border-slate-700/60 p-4">
            <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">
              <CreditCard className="w-4 h-4" />
              Payment
            </div>
            <p className="text-teal-400 font-bold font-mono">
              {typeof state.amount === 'number' ? formatCurrency(state.amount) : 'Verified'}
            </p>
          </div>
        </div>

        {state.paymentId && (
          <div className="mt-4 rounded-xl bg-black/30 border border-purple-500/10 p-4 text-left">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Payment ID</p>
            <p className="font-mono text-xs text-slate-300 break-all">{state.paymentId}</p>
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
          <Link to="/billing" className="w-full sm:w-auto">
            <Button className="w-full gap-2 bg-purple-600 sm:w-auto">
              Back to Billing
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/dashboard" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full sm:w-auto">View Dashboard</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
