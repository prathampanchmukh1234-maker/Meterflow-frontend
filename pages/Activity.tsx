import React, { useState } from 'react';
import { Card, Button, Badge } from '../components/ui/Base';
import { Activity as ActivityIcon, Calendar, Filter, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { cn } from '../utils';

export default function Activity() {
  const [timeframe, setTimeframe] = useState('24h');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  
  const { data: logsRes, isLoading } = useQuery({
    queryKey: ['activity-logs', page, timeframe, statusFilter],
    queryFn: () => api.get(`/analytics/logs`, {
      params: { page, timeframe, status: statusFilter }
    }).then(r => r.data.data ?? null),
  });

  const logs = logsRes?.logs || [];
  const total = logsRes?.total || 0;
  const totalPages = Math.ceil(total / 50);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">API Logs</h1>
          <p className="text-slate-400 mt-1">Real-time audit trail of every request passing through the gateway.</p>
        </div>
        <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-700/50">
          {['24h', '7d', '30d'].map((tf) => (
            <button
              key={tf}
              onClick={() => { setTimeframe(tf); setPage(1); }}
              className={cn(
                "px-4 py-2 text-xs font-bold uppercase rounded-lg transition-all",
                timeframe === tf ? "bg-purple-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
              )}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <Card className="bg-[#1E2130]/40 border-purple-500/10 p-0 overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-purple-500/10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-slate-900 border border-slate-700 text-slate-300 text-xs font-bold rounded-lg px-3 py-1.5 outline-none focus:border-purple-500"
            >
              <option value="">All Statuses</option>
              <option value="200">200 OK</option>
              <option value="401">401 Unauth</option>
              <option value="429">429 Rate Limited</option>
              <option value="502">502 Bad Gateway</option>
            </select>
          </div>
          <div className="text-xs text-slate-500 font-bold font-mono uppercase tracking-widest">
            {total} Total Requests
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Timestamp</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Method</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Endpoint</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Latency</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Key</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-500/10">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-500 mb-2" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fetching data from gateway...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-500 italic">No logs found for this period.</td>
                </tr>
              ) : (
                logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors font-mono text-sm leading-relaxed">
                    <td className="px-6 py-4 text-slate-400 text-xs whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-black uppercase border",
                        log.method === 'GET' ? "bg-teal-500/10 text-teal-400 border-teal-500/20" : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                      )}>
                        {log.method}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white truncate max-w-xs">{log.endpoint}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        'px-2.5 py-0.5 rounded-full text-xs font-semibold border font-mono',
                        log.response_status < 300
                          ? 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                          : log.response_status < 500
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      )}>
                        {log.response_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">{log.latency_ms}ms</td>
                    <td className="px-6 py-4 text-slate-500 text-xs">••••{log.api_keys?.key_prefix}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-purple-500/10 flex justify-center items-center gap-3 sm:gap-4 bg-white/[0.02]">
          <Button
            variant="secondary"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 h-auto rounded-lg"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Page {page} of {totalPages || 1}</span>
          <Button
            variant="secondary"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || totalPages === 0}
            className="p-2 h-auto rounded-lg"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
