import React, { useState } from 'react';
import { Card, Button, Badge } from '../components/ui/Base';
import { Key as KeyIcon, Eye, EyeOff, RotateCcw, Copy, Trash2, Plus, ShieldAlert, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { cn } from '../utils';
import { Toast, ToastState } from '../components/ui/Feedback';

export default function APIKeys() {
  const queryClient = useQueryClient();
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedApiId, setSelectedApiId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  const { data: apis = [] } = useQuery({
    queryKey: ['apis'],
    queryFn: () => api.get('/apis').then(r => r.data.data ?? []),
  });

  const { data: keys = [], isLoading } = useQuery({
    queryKey: ['keys'],
    queryFn: () => api.get('/keys').then(r => r.data.data ?? []),
  });

  const createMutation = useMutation({
    mutationFn: (newKey: any) => api.post('/keys', newKey),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['keys'] });
      setRevealedKey(res.data.data.raw_key);
      setIsCreating(false);
      setNewKeyName('');
    }
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => api.post(`/keys/${id}/revoke`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['keys'] })
  });

  const rotateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/keys/${id}/rotate`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['keys'] });
      setRevealedKey(res.data.data.raw_key);
    }
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ name: newKeyName, api_id: selectedApiId });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast({ type: 'success', title: 'Copied to clipboard', message: 'The secret key is ready to paste.' });
    } catch {
      setToast({ type: 'error', title: 'Copy failed', message: 'Select the key text and copy it manually.' });
    }
  };

  return (
    <div className="space-y-6">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-sans text-white tracking-tight">API Integrity Keys</h1>
          <p className="text-slate-400 mt-1">Manage and rotate your live authentication secrets.</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="gap-2 bg-purple-600">
          <Plus className="w-4 h-4" />
          Generate New Key
        </Button>
      </div>

      {isCreating && (
        <Card className="bg-[#1E2130]-40 border-purple-500/20 shadow-xl">
          <form onSubmit={handleCreate} className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Key Label</label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g. Staging Server"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-4 text-white"
                required
              />
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Assign to API</label>
              <select
                value={selectedApiId}
                onChange={(e) => setSelectedApiId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-4 text-white"
                required
              >
                <option value="">Select API...</option>
                {apis.map((api: any) => (
                  <option key={api.id} value={api.id}>{api.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="animate-spin" /> : 'CREATE KEY'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setIsCreating(false)}>CANCEL</Button>
            </div>
          </form>
        </Card>
      )}

      {revealedKey && (
        <Card className="bg-teal-500/10 border-teal-500/20 p-6">
          <h3 className="text-teal-400 font-bold mb-2 uppercase tracking-widest text-xs">New API Key Generated</h3>
          <p className="text-slate-400 text-sm mb-4">Copy this secret now. You won't be able to see it again for security reasons.</p>
          <div className="flex gap-2">
            <div className="flex-1 bg-black/40 border border-teal-500/20 p-3 rounded-xl font-mono text-white break-all">
              {revealedKey}
            </div>
            <Button onClick={() => copyToClipboard(revealedKey)}><Copy className="w-4 h-4" /></Button>
            <Button variant="secondary" onClick={() => setRevealedKey(null)}>DONE</Button>
          </div>
        </Card>
      )}

      <Card className="bg-[#1E2130]/40 border-purple-500/10 p-0 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-[10px] uppercase tracking-wider bg-white/5">
                <th className="py-4 px-6 font-semibold">Name / Label</th>
                <th className="py-4 font-semibold">Key Prefix</th>
                <th className="py-4 font-semibold">Status</th>
                <th className="py-4 font-semibold">Last Used</th>
                <th className="py-4 font-semibold text-right pr-6">Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-500/10">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-purple-500" /></td>
                </tr>
              ) : keys.map((key: any) => (
                <tr key={key.id} className="group hover:bg-white/5 transition-colors">
                  <td className="py-5 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center">
                        <KeyIcon className="w-4 h-4 text-purple-400" />
                      </div>
                      <span className="font-semibold text-white">{key.name || 'Unnamed Key'}</span>
                    </div>
                  </td>
                  <td className="py-5 font-mono text-xs text-slate-400">{key.key_prefix}••••••</td>
                  <td className="py-5"><Badge status={key.status} /></td>
                  <td className="py-5 text-slate-500 text-xs font-mono">{key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}</td>
                  <td className="py-5 pr-6">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" className="p-2" onClick={() => rotateMutation.mutate(key.id)} title="Rotate Key">
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                      <Button variant="danger" className="p-2" onClick={() => revokeMutation.mutate(key.id)} title="Revoke Access">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="border-amber-500/20 bg-amber-500/[0.02] shadow-xl">
        <div className="flex gap-4">
          <div className="bg-amber-500/10 p-3 rounded-xl h-fit">
            <ShieldAlert className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-amber-500">Security Best Practices</h3>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl leading-relaxed">
              Never expose your secret keys in client-side code (e.g., React, Vue). 
              Always use an environment variable on your server and implement an API proxy layer 
              to ensure your MeterFlow credentials remain secure.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
