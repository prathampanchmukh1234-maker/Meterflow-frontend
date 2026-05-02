import React, { useState } from 'react';
import { Card, Button, Badge } from '../components/ui/Base';
import { Webhook, Plus, Trash2, Send, Loader2, Link } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { cn } from '../utils';

export default function Webhooks() {
  const queryClient = useQueryClient();
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  
  const eventsList = [
    'usage.limit_reached',
    'billing.invoice_ready',
    'key.revoked',
    'key.rotated',
  ];

  const { data: webhooks, isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => api.get('/webhooks').then(r => r.data.data ?? []),
  });

  const createMutation = useMutation({
    mutationFn: (newWebhook: any) => api.post('/webhooks', newWebhook),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      setUrl('');
      setSelectedEvents([]);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/webhooks/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['webhooks'] })
  });

  const testMutation = useMutation({
    mutationFn: (id: string) => api.post(`/webhooks/${id}/test`)
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ endpoint_url: url, events: selectedEvents });
  };

  const toggleEvent = (event: string) => {
    setSelectedEvents(prev => 
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Webhooks</h1>
          <p className="text-slate-400 mt-1">Receive real-time notifications for system events.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 bg-[#1E2130]/40 border-purple-500/10">
          <h3 className="text-lg font-bold text-white mb-6">Register Endpoint</h3>
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Destination URL</label>
              <div className="relative">
                <Link className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://your-api.com/webhooks"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Events to subscribe</label>
              <div className="space-y-2">
                {eventsList.map(event => (
                  <label key={event} className="flex items-center gap-3 p-3 bg-slate-900/50 border border-slate-700/50 rounded-xl cursor-pointer hover:bg-slate-800 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(event)}
                      onChange={() => toggleEvent(event)}
                      className="w-4 h-4 rounded border-slate-700 text-purple-600 bg-slate-900 focus:ring-purple-500"
                    />
                    <span className="text-sm font-mono text-slate-300">{event}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              disabled={createMutation.isPending || !url || selectedEvents.length === 0}
              className="w-full bg-purple-600 text-white font-bold py-4 rounded-xl"
            >
              {createMutation.isPending ? <Loader2 className="animate-spin" /> : 'ADD WEBHOOK'}
            </Button>
          </form>
        </Card>

        <Card className="lg:col-span-2 bg-[#1E2130]/40 border-purple-500/10 p-0 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-purple-500/10">
            <h3 className="text-lg font-bold text-white uppercase tracking-wider">Active Deliveries</h3>
          </div>
          <div className="divide-y divide-purple-500/10">
            {isLoading ? (
              <div className="p-12 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
              </div>
            ) : !webhooks || webhooks.length === 0 ? (
              <div className="p-12 text-center text-slate-500 italic">No webhooks registered.</div>
            ) : (
              webhooks.map((webhook: any) => (
                <div key={webhook.id} className="p-4 sm:p-6 group">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="bg-slate-900 p-3 rounded-2xl border border-slate-700">
                        <Webhook className="w-5 h-5 text-teal-400" />
                      </div>
                      <div>
                        <p className="font-mono text-white text-sm break-all sm:truncate sm:max-w-xs">{webhook.endpoint_url}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Secret: ••••••••{webhook.secret.slice(-8)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => testMutation.mutate(webhook.id)}
                        disabled={testMutation.isPending}
                        variant="secondary"
                        className="p-2 h-auto rounded-lg"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => deleteMutation.mutate(webhook.id)}
                        disabled={deleteMutation.isPending}
                        variant="danger"
                        className="p-2 h-auto rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {webhook.events.map((ev: string) => (
                      <span key={ev} className="px-2 py-0.5 bg-slate-900 border border-slate-700 text-[10px] font-mono text-purple-400 rounded">
                        {ev}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
