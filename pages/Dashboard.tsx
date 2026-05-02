import React, { useEffect, useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Card, Button, Badge } from '../components/ui/Base';
import { ArrowUpRight, ArrowDownRight, Globe, Zap, ShieldAlert, Cpu, Plus, Edit3, Trash2, X, Loader2 } from 'lucide-react';
import { formatNumber, cn } from '../utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { ConfirmDialog, Toast, ToastState } from '../components/ui/Feedback';

const StatsCard = ({ title, value, change, icon: Icon, color }: any) => (
  <Card className="flex-1 relative overflow-hidden group">
    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
       <Icon className={cn("w-12 h-12", color)} />
    </div>
    <p className="text-slate-400 text-xs font-semibold mb-1">{title}</p>
    <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{value}</h3>
    {change !== undefined && (
      <p className={cn("text-xs mt-2 flex items-center gap-1 font-medium", change >= 0 ? "text-teal-400" : "text-red-400")}>
        {change >= 0 ? 
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd"/></svg> : 
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 112 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
        }
        {Math.abs(change)}% vs yesterday
      </p>
    )}
  </Card>
);

export default function Dashboard() {
  const { socketRef, isConnected } = useSocket();
  const queryClient = useQueryClient();
  const [chartData, setChartData] = useState<any[]>([]);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [editingApi, setEditingApi] = useState<any>(null);
  const [apiForm, setApiForm] = useState({ name: '', description: '', base_url: '' });
  const [apiToDelete, setApiToDelete] = useState<any>(null);
  const [toast, setToast] = useState<ToastState>(null);

  const { data: statsRes } = useQuery({
    queryKey: ['usage-stats', '24h'],
    queryFn: () => api.get('/analytics/usage?timeframe=24h').then(r => r.data.data ?? null),
    refetchInterval: 30000,
  });

  const { data: apisRes } = useQuery({
    queryKey: ['apis'],
    queryFn: () => api.get('/apis').then(r => r.data.data ?? []),
  });

  const { data: keysRes } = useQuery({
    queryKey: ['keys'],
    queryFn: () => api.get('/keys').then(r => r.data.data ?? []),
  });

  const { data: endpointsRes } = useQuery({
    queryKey: ['top-endpoints'],
    queryFn: () => api.get('/analytics/endpoints').then(r => r.data.data ?? []),
  });

  const createApiMutation = useMutation({
    mutationFn: (data: any) => api.post('/apis', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apis'] });
      setIsApiModalOpen(false);
      setApiForm({ name: '', description: '', base_url: '' });
    }
  });

  const updateApiMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => api.put(`/apis/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apis'] });
      setIsApiModalOpen(false);
      setEditingApi(null);
    }
  });

  const deleteApiMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/apis/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apis'] });
      setToast({ type: 'success', title: 'API deleted', message: 'Related keys were revoked with it.' });
      setApiToDelete(null);
    },
    onError: () => setToast({ type: 'error', title: 'Delete failed', message: 'The API could not be deleted. Please try again.' })
  });

  useEffect(() => {
    if (statsRes?.dailyUsage) {
      setChartData(statsRes.dailyUsage);
    }
  }, [statsRes]);

  useEffect(() => {
    if (!isConnected || !socketRef.current) return;
    socketRef.current.on('usage_event', (event: any) => {
      setChartData(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last) last.requests = (last.requests || 0) + 1;
        return [...updated];
      });
    });
    return () => { socketRef.current?.off('usage_event'); };
  }, [isConnected]);

  const summary = statsRes?.summary ?? { totalRequests: 0, errorRate: 0, successCount: 0, errorCount: 0 };
  const safeErrorRate = summary.errorRate ?? 0;
  const activeKeys = (keysRes || []).filter((k: any) => k.status === 'active').length;
  const avgLatency = endpointsRes?.length
    ? Math.round(endpointsRes.reduce((s: number, e: any) => s + (Number(e.avg_latency) || 0), 0) / endpointsRes.length)
    : 0;

  const handleApiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingApi) {
      updateApiMutation.mutate({ id: editingApi.id, ...apiForm });
    } else {
      createApiMutation.mutate(apiForm);
    }
  };

  const openEditModal = (api: any) => {
    setEditingApi(api);
    setApiForm({ name: api.name, description: api.description, base_url: api.base_url });
    setIsApiModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">System Pulse</h1>
          <p className="text-slate-400 mt-1">Real-time health monitoring and traffic metrics.</p>
        </div>
        <Button onClick={() => { setEditingApi(null); setApiForm({ name: '', description: '', base_url: '' }); setIsApiModalOpen(true); }} className="gap-2 bg-purple-600">
          <Plus className="w-4 h-4" />
          New API
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Requests (24h)" value={formatNumber(summary.totalRequests)} change={summary.growth || 0} icon={Zap} color="text-purple-400" />
        <StatsCard title="Error Rate" value={`${safeErrorRate.toFixed(1)}%`} change={0} icon={ShieldAlert} color="text-amber-400" />
        <StatsCard title="Active API Keys" value={activeKeys} icon={Cpu} color="text-teal-400" />
        <StatsCard title="Avg Latency" value={`${avgLatency}ms`} icon={Globe} color="text-purple-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-[#1E2130]/40 border-purple-500/10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
            <h4 className="font-bold text-white">Usage Traffic (Requests/segment)</h4>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E2130', border: 'none', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="requests" stroke="#7C3AED" strokeWidth={3} fillOpacity={1} fill="url(#colorRequests)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="bg-[#1E2130]/40 border-purple-500/10">
           <h4 className="font-bold mb-6 text-white">Success Distribution</h4>
           <div className="flex-1 flex flex-col items-center justify-center relative">
              <svg viewBox="0 0 100 100" className="w-32 h-32 -rotate-90">
                <circle cx="50" cy="50" r="40" stroke="#141721" strokeWidth="12" fill="transparent"/>
                <circle cx="50" cy="50" r="40" stroke="#7C3AED" strokeWidth="12" fill="transparent" strokeDasharray="251" strokeDashoffset={251 - (251 * (100 - safeErrorRate) / 100)}/>
              </svg>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-white">
                <p className="text-2xl font-bold">{(100 - safeErrorRate).toFixed(1)}%</p>
                <p className="text-[8px] text-slate-500 uppercase font-bold tracking-tighter">Success Rate</p>
              </div>
           </div>
        </Card>
      </div>

      <Card className="bg-[#1E2130]/40 border-purple-500/10 p-0 overflow-hidden shadow-2xl">
        <div className="px-4 py-4 sm:px-6 border-b border-purple-500/10 flex justify-between items-center bg-white/5">
          <h4 className="font-bold text-white uppercase tracking-widest text-xs">API Management Infrastructure</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[680px] w-full text-sm text-left">
            <thead>
              <tr className="text-slate-500 text-[10px] uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">API Name</th>
                <th className="px-6 py-4 font-semibold">Base Upstream URL</th>
                <th className="px-6 py-4 text-right">Status</th>
                <th className="px-6 py-4 text-right px-10">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-500/10">
              {(apisRes || []).map((api: any) => (
                <tr key={api.id} className="hover:bg-white/5 cursor-pointer group transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <span className="font-semibold text-white">{api.name}</span>
                  </td>
                  <td className="px-6 py-4 font-mono text-[11px] text-slate-400 group-hover:text-purple-400 transition-colors uppercase tracking-tighter">
                    {api.base_url}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Badge status={api.is_active ? 'active' : 'revoked'} />
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity pr-10">
                    <Button variant="ghost" className="p-2" onClick={() => openEditModal(api)}><Edit3 className="w-4 h-4" /></Button>
                    <Button
                      variant="danger"
                      className="p-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setApiToDelete(api);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create/Edit API Modal */}
      {isApiModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg max-h-[calc(100vh-2rem)] overflow-y-auto bg-[#1E2130] border border-purple-500/20 rounded-3xl p-4 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">{editingApi ? 'Edit API Configuration' : 'Onboard New API'}</h3>
              <button onClick={() => setIsApiModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleApiSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">API Identifier Name</label>
                <input 
                  type="text"
                  required
                  value={apiForm.name}
                  onChange={(e) => setApiForm({ ...apiForm, name: e.target.value })}
                  placeholder="e.g. Products Gateway"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white focus:border-purple-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">Description</label>
                <textarea 
                  value={apiForm.description}
                  onChange={(e) => setApiForm({ ...apiForm, description: e.target.value })}
                  placeholder="The primary upstream for product metadata..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white focus:border-purple-500 outline-none h-24 resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">Upstream Base URL</label>
                <input 
                  type="url"
                  required
                  value={apiForm.base_url}
                  onChange={(e) => setApiForm({ ...apiForm, base_url: e.target.value })}
                  placeholder="https://api.yourdomain.com/v1"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white focus:border-purple-500 outline-none font-mono text-sm"
                />
              </div>

              <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:gap-4">
                <Button 
                  type="submit" 
                  className="flex-1 py-4 font-bold"
                  disabled={createApiMutation.isPending || updateApiMutation.isPending}
                >
                  {createApiMutation.isPending || updateApiMutation.isPending ? <Loader2 className="animate-spin mx-auto w-5 h-5" /> : (editingApi ? 'SAVE UPDATES' : 'PROVISION GATEWAY')}
                </Button>
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => setIsApiModalOpen(false)}
                  className="sm:px-8"
                >
                  CANCEL
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(apiToDelete)}
        title="Delete API?"
        message={`Delete "${apiToDelete?.name || 'this API'}"? This will also revoke all its API keys and cannot be undone.`}
        confirmLabel="Delete API"
        tone="danger"
        isLoading={deleteApiMutation.isPending}
        onCancel={() => setApiToDelete(null)}
        onConfirm={() => apiToDelete && deleteApiMutation.mutate(apiToDelete.id)}
      />
    </div>
  );
}
