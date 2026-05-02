import React, { useState } from 'react';
import { Card, Button, Badge } from '../components/ui/Base';
import { CreditCard, History, Zap, Download, Loader2 } from 'lucide-react';
import { formatCurrency, formatNumber } from '../utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getApiErrorMessage } from '../services/api';
import { Toast, ToastState } from '../components/ui/Feedback';
import { useNavigate } from 'react-router-dom';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Billing() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [toast, setToast] = useState<ToastState>(null);
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);

  const { data: usageRes } = useQuery({
    queryKey: ['billing-current'],
    queryFn: () => api.get('/billing/current').then(r => r.data.data ?? null),
  });

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['billing-history'],
    queryFn: () => api.get('/billing').then(r => r.data.data ?? []),
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.get('/plans').then(r => r.data.data ?? []),
  });

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const payMutation = useMutation({
    mutationFn: async (billing: any) => {
      setActiveInvoiceId(billing.id);
      const res = await loadRazorpay();
      if (!res) {
        throw new Error('Razorpay SDK failed to load. Are you online?');
      }

      const orderRes = await api.post('/payments/create-order', {
        billing_id: billing.id,
      });

      return new Promise((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: (import.meta as any).env.VITE_RAZORPAY_KEY_ID,
          amount: orderRes.data.data.amount,
          currency: 'INR',
          name: 'MeterFlow',
          description: `Invoice ${billing.id}`,
          order_id: orderRes.data.data.id,
          handler: async (response: any) => {
            try {
              const verifyRes = await api.post('/payments/verify', {
                ...response,
                billing_id: billing.id,
              });
              await queryClient.invalidateQueries({ queryKey: ['billing-history'] });
              await queryClient.invalidateQueries({ queryKey: ['billing-current'] });
              await queryClient.invalidateQueries({ queryKey: ['notifications'] });
              navigate('/billing/success', {
                state: {
                  kind: 'invoice',
                  title: 'Invoice paid successfully',
                  message: 'Your invoice has been marked paid and billing history is updated.',
                  amount: Number(billing.amount_inr || 0),
                  invoiceId: billing.id,
                  paymentId: response.razorpay_payment_id,
                },
              });
              resolve(verifyRes);
            } catch (error) {
              reject(error);
            }
          },
          modal: {
            ondismiss: () => reject(new Error('Payment cancelled')),
          },
          theme: { color: '#7C3AED' },
        });
        rzp.open();
      });
    },
    onError: (error: any) => {
      if (error?.message !== 'Payment cancelled') {
        setToast({ type: 'error', title: 'Payment failed', message: getApiErrorMessage(error, 'Payment failed.') });
      }
    },
    onSettled: () => setActiveInvoiceId(null),
  });

  const changePlanMutation = useMutation({
    mutationFn: async (plan: any) => {
      setActivePlanId(plan.id);
      const monthlyPrice = Number(plan.monthly_price_inr || 0);
      if (monthlyPrice <= 0) {
        return api.post('/billing/change-plan', { plan_id: plan.id });
      }

      const sdkLoaded = await loadRazorpay();
      if (!sdkLoaded) throw new Error('Razorpay SDK failed to load. Are you online?');

      const orderRes = await api.post('/payments/create-plan-order', { plan_id: plan.id });
      const { order } = orderRes.data.data;

      return new Promise((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: (import.meta as any).env.VITE_RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: 'INR',
          name: 'MeterFlow',
          description: `${plan.name} plan subscription`,
          order_id: order.id,
          handler: async (response: any) => {
            try {
              const verifyRes = await api.post('/payments/verify-plan', {
                ...response,
                plan_id: plan.id,
              });
              navigate('/billing/success', {
                state: {
                  kind: 'plan',
                  title: 'Plan switched successfully',
                  message: `${plan.name} is now active for this account.`,
                  planName: plan.name,
                  amount: monthlyPrice,
                  paymentId: response.razorpay_payment_id,
                },
              });
              resolve(verifyRes);
            } catch (error) {
              reject(error);
            }
          },
          modal: {
            ondismiss: () => reject(new Error('Payment cancelled')),
          },
          theme: { color: '#7C3AED' },
        });
        rzp.open();
      });
    },
    onSuccess: async (_res, plan) => {
      await queryClient.invalidateQueries({ queryKey: ['billing-current'] });
      await queryClient.invalidateQueries({ queryKey: ['plans'] });
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
      if (Number(plan.monthly_price_inr || 0) <= 0) {
        setToast({ type: 'success', title: 'Plan updated', message: `${plan.name} is now active for this account.` });
      }
    },
    onError: (error: any) => {
      if (error?.message !== 'Payment cancelled') {
        setToast({ type: 'error', title: 'Plan update failed', message: getApiErrorMessage(error, 'Plan update failed.') });
      }
    },
    onSettled: () => setActivePlanId(null),
  });

  const generateInvoiceMutation = useMutation({
    mutationFn: () => api.post('/billing/generate-current'),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['billing-history'] });
      queryClient.invalidateQueries({ queryKey: ['billing-current'] });
      setToast({ type: 'success', title: 'Invoice generated', message: res.data?.message || 'Current invoice generated.' });
    },
    onError: (error: any) => setToast({ type: 'error', title: 'Invoice generation failed', message: getApiErrorMessage(error, 'Invoice generation failed.') }),
  });

  const downloadInvoice = (invoice: any) => {
    const lines = [
      'MeterFlow Invoice',
      `Invoice ID: ${invoice.id}`,
      `Period: ${new Date(invoice.period_start).toLocaleDateString()} - ${new Date(invoice.period_end).toLocaleDateString()}`,
      `Total requests: ${formatNumber(invoice.total_requests || 0)}`,
      `Free quota used: ${formatNumber(invoice.free_quota_used || 0)}`,
      `Billable requests: ${formatNumber(invoice.billable_requests || 0)}`,
      `Amount: ${formatCurrency(invoice.amount_inr || 0)}`,
      `Status: ${invoice.status}`,
      invoice.invoice_id ? `Payment ID: ${invoice.invoice_id}` : '',
    ].filter(Boolean);
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `meterflow-invoice-${invoice.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const used = usageRes?.requests_this_month || 0;
  const progress = usageRes
    ? (usageRes.plan?.free_quota === 0 ? 100 : Math.min(100, Math.round((used / (usageRes.plan?.free_quota || 1)) * 100)))
    : 0;

  return (
    <div className="space-y-6">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Billing & Usage</h1>
          <p className="text-slate-400 mt-1">Manage your subscriptions, plan tiers, and invoice history.</p>
        </div>
        <Button
          className="gap-2 bg-purple-600"
          onClick={() => generateInvoiceMutation.mutate()}
          disabled={generateInvoiceMutation.isPending}
        >
          <Zap className="w-4 h-4" />
          Generate Current Invoice
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan: any) => {
          const isCurrent = usageRes?.plan_id === plan.id;
          const isSwitchingThisPlan = activePlanId === plan.id && changePlanMutation.isPending;
          return (
            <Card key={plan.id} className={`bg-[#1E2130]/40 ${isCurrent ? 'border-teal-500/40' : 'border-purple-500/10'}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-500 uppercase tracking-widest">{formatNumber(plan.free_quota)} free req/mo</p>
                </div>
                {isCurrent && <Badge status="active" />}
              </div>
              <p className="text-2xl font-black text-teal-400 font-mono mb-1">{formatCurrency(plan.monthly_price_inr || 0)}/mo</p>
              <p className="text-xs text-slate-500 mb-1">Overage: {formatCurrency(plan.price_per_100_requests)}/100 requests.</p>
              <p className="text-xs text-slate-500 mb-4">Rate limit: {formatNumber(plan.rate_limit_per_minute)} req/min.</p>
              <Button
                className="w-full"
                variant={isCurrent ? 'secondary' : 'primary'}
                disabled={isCurrent || changePlanMutation.isPending}
                onClick={() => changePlanMutation.mutate(plan)}
              >
                {isSwitchingThisPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : isCurrent ? 'CURRENT PLAN' : Number(plan.monthly_price_inr || 0) > 0 ? 'PAY & SWITCH' : 'SWITCH PLAN'}
              </Button>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 relative overflow-hidden bg-[#1E2130]/40 border-purple-500/10">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <CreditCard className="w-48 h-48" />
          </div>
          <div className="relative z-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-8">
              <div>
                <p className="text-[#06B6D4] text-[10px] font-bold uppercase tracking-widest mb-1">Current Plan</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{usageRes?.plan?.name || 'Loading...'}</h2>
              </div>
              <Badge status="active" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-wide">
                    <span className="text-slate-400">Monthly Usage</span>
                    <span className="text-white">{progress}% used</span>
                  </div>
                  <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-700">
                    <div 
                      className="bg-gradient-to-r from-purple-600 to-teal-400 h-full transition-all duration-1000" 
                      style={{ width: `${progress}%` }} 
                    />
                  </div>
                </div>
                {usageRes ? (
                  <p className="text-xs text-slate-500">
                    <span className="text-white font-bold">{formatNumber(used)}</span> of{' '}
                    <span className="text-white font-bold">{formatNumber(usageRes.plan?.free_quota || 0)}</span> free requests used.
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 italic animate-pulse">Loading usage data...</p>
                )}
              </div>

              <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-700/50 space-y-4">
                 <div className="flex justify-between items-end">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pricing Model</p>
                    <p className="text-sm font-bold text-white font-mono">{formatCurrency(usageRes?.plan?.price_per_100_requests || 0)}/100 Over</p>
                 </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col bg-[#1E2130]/40 border-purple-500/10">
          <h2 className="text-lg font-bold text-white mb-6 uppercase tracking-tight">Payment Method</h2>
          <div className="flex-1 space-y-6">
            <div className="p-4 rounded-xl border border-slate-700 bg-slate-900/50 flex flex-wrap items-center gap-4">
               <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-slate-500" />
               </div>
               <div>
                  <p className="font-bold text-sm text-white font-mono">RAZORPAY GATEWAY</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Immediate Settlements</p>
               </div>
               <Badge status="active" className="ml-auto" />
            </div>
          </div>
          <Button
            variant="secondary"
            className="w-full mt-6"
            onClick={() => setToast({
              type: 'info',
              title: 'Payment contacts',
              message: 'Razorpay manages payment contact details during checkout. Open a pending invoice or paid plan checkout to update them.',
            })}
          >
            Manage Contacts
          </Button>
        </Card>
      </div>

      <Card className="bg-[#1E2130]/40 border-purple-500/10 p-0 overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-purple-500/10">
          <h2 className="text-lg font-bold flex items-center gap-2 text-white">
            <History className="w-5 h-5 text-slate-500" />
            Invoicing History
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full text-left">
            <thead>
              <tr className="text-slate-500 text-[10px] font-bold border-b border-purple-500/10 uppercase tracking-widest bg-white/5">
                <th className="py-4 px-6">Invoice ID</th>
                <th className="py-4">Period</th>
                <th className="py-4">Usage volume</th>
                <th className="py-4">Amount</th>
                <th className="py-4">Status</th>
                <th className="py-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-500/10">
              {isLoading ? (
                <tr><td colSpan={6} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-purple-500" /></td></tr>
              ) : history.length === 0 ? (
                <tr><td colSpan={6} className="py-20 text-center text-slate-500 italic">No invoices found.</td></tr>
              ) : history.map((inv: any) => (
                <tr key={inv.id} className="group hover:bg-white/5 transition-colors font-mono text-sm leading-relaxed">
                  <td className="py-5 px-6 text-white truncate max-w-[120px]">{inv.id}</td>
                  <td className="py-5 text-slate-400 text-xs">
                    {new Date(inv.period_start).toLocaleDateString()} - {new Date(inv.period_end).toLocaleDateString()}
                  </td>
                  <td className="py-5 text-slate-300 text-xs">{formatNumber(inv.total_requests)}/mo</td>
                  <td className="py-5 font-bold text-teal-400">{formatCurrency(inv.amount_inr)}</td>
                  <td className="py-5"><Badge status={inv.status} /></td>
                  <td className="py-5 text-right pr-6">
                    {inv.status === 'pending' ? (
                      <Button 
                        onClick={() => payMutation.mutate(inv)}
                        disabled={payMutation.isPending}
                        className="bg-purple-600 text-[10px] px-3 py-1 font-black"
                      >
                        {activeInvoiceId === inv.id && payMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'PAY NOW'}
                      </Button>
                    ) : (
                      <div className="flex justify-end gap-2">
                         <Button variant="ghost" className="p-2 h-auto rounded-lg" onClick={() => downloadInvoice(inv)}><Download className="w-4 h-4 text-slate-500" /></Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
