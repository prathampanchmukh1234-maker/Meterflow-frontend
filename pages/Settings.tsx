import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../components/ui/Base';
import { User, Shield, Info, CreditCard, Loader2, Save, Trash2, Bell } from 'lucide-react';
import { formatCurrency } from '../utils';
import { supabase } from '../services/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { ConfirmDialog, Toast, ToastState } from '../components/ui/Feedback';

export default function Settings() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setName(user.user_metadata.name || '');
        setEmail(user.email || '');
      }
    });
  }, []);

  const { data: profile } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/me').then(r => r.data.data),
  });

  const { data: usageData } = useQuery({
    queryKey: ['billing-current'],
    queryFn: () => api.get('/billing/current').then(r => r.data.data),
    enabled: Boolean(profile) && profile?.role !== 'consumer',
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      email,
      data: { name }
    });
    setLoading(false);
    if (error) setMessage({ type: 'error', text: error.message });
    else setMessage({ type: 'success', text: 'Profile updated!' });
  };

  const handleDeleteAccount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setDeleteDialogOpen(false);
    if (!user) return;
    // Note: Admin delete requires service role, normally we'd call a backend endpoint.
    setToast({
      type: 'warning',
      title: 'Deletion request noted',
      message: 'Please contact support@meterflow.com to finalize account removal.',
    });
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Account System</h1>
        <p className="text-slate-400 mt-1">Manage your identity, developer plan, and security preferences.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border text-sm font-bold text-center ${message.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-teal-500/10 border-teal-500/20 text-teal-400'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <User className="w-4 h-4" /> Personal Identity
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">Your profile information is used for billing invoices and account security notifications.</p>
        </div>
        <Card className="md:col-span-2 bg-[#1E2130]/40 border-purple-500/10">
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-4 text-white focus:border-purple-500 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Email (Primary)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-4 text-white focus:border-purple-500 transition-colors"
                />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-purple-600">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : <span className="flex items-center justify-center gap-2 font-bold uppercase text-xs"><Save className="w-3 h-3" /> Save Profile</span>}
            </Button>
          </form>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Developer Plan
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">Your current quota and usage limits per billing cycle.</p>
        </div>
        <Card className="md:col-span-2 bg-[#1E2130]/40 border-purple-500/10">
          <div className="flex items-center justify-between p-4 bg-purple-600/5 border border-purple-500/10 rounded-2xl mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-600 p-3 rounded-2xl shadow-lg shadow-purple-900/40">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-white text-lg leading-tight uppercase tracking-tight">{profile?.role === 'consumer' ? 'Consumer' : usageData?.plan?.name || 'Loading...'}</p>
                <p className="text-xs text-slate-400">Current active subscription</p>
              </div>
            </div>
            <Badge status="active" />
          </div>
          <div className="grid grid-cols-2 gap-6 p-2">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Monthly Quota</p>
              <p className="text-xl font-bold text-white font-mono">{profile?.role === 'consumer' ? 'N/A' : `${usageData?.plan?.free_quota?.toLocaleString() || 0} reqs`}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Overage Pricing</p>
              <p className="text-xl font-bold text-teal-400 font-mono">{profile?.role === 'consumer' ? 'N/A' : `${formatCurrency(usageData?.plan?.price_per_100_requests || 0)}/100`}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Bell className="w-4 h-4" /> Notifications
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">Configure how you want to be notified about API events.</p>
        </div>
        <Card className="md:col-span-2 bg-[#1E2130]/40 border-purple-500/10 space-y-4">
          {[
            { id: 'billing', label: 'Billing Alerts', desc: 'When you approach your monthly quota' },
            { id: 'rate', label: 'Rate Limit Warnings', desc: 'When your keys hit usage limits' },
            { id: 'error', label: 'System Errors', desc: 'Weekly summary of API 5xx spikes' }
          ].map(opt => (
            <label key={opt.id} className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-700/50 rounded-2xl cursor-pointer hover:bg-slate-800 transition-colors">
              <div>
                <p className="text-sm font-bold text-white">{opt.label}</p>
                <p className="text-[10px] text-slate-500">{opt.desc}</p>
              </div>
              <input type="checkbox" className="w-5 h-5 rounded border-slate-700 text-purple-600 bg-slate-900 focus:ring-purple-500" defaultChecked />
            </label>
          ))}
        </Card>
      </div>

      <div className="border-t border-red-500/10 pt-8">
        <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-8 flex items-center justify-between">
          <div>
            <h4 className="text-lg font-bold text-red-500 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Danger Zone
            </h4>
            <p className="text-sm text-slate-500 mt-2">Permanently delete your account and all associated data.</p>
          </div>
          <Button variant="danger" onClick={() => setDeleteDialogOpen(true)} className="bg-red-600 shadow-xl shadow-red-900/20">DELETE ACCOUNT</Button>
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete account?"
        message="This will permanently delete your account and all API data after support verification. This cannot be undone."
        confirmLabel="Request Deletion"
        tone="danger"
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
}
