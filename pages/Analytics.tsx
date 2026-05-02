import { useState } from 'react';
import { Card, Button, Badge } from '../components/ui/Base';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { Zap } from 'lucide-react';
import { cn } from '../utils';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export default function Analytics() {
  const [timeframe, setTimeframe] = useState('24h');

  const { data: analyticsRes } = useQuery({
    queryKey: ['analytics', timeframe],
    queryFn: () => api.get(`/analytics/usage?timeframe=${timeframe}`).then(r => r.data.data ?? null),
  });

  const { data: endpointsRes } = useQuery({
    queryKey: ['top-endpoints'],
    queryFn: () => api.get('/analytics/endpoints').then(r => r.data.data ?? []),
  });

  const dailyUsage = analyticsRes?.dailyUsage || [];

  const avgLatency = endpointsRes?.length
    ? Math.round(
        endpointsRes.reduce((s: number, e: any) => s + (Number(e.avg_latency) || 0), 0) /
        endpointsRes.length
      )
    : 0;

  return (
    <div className="space-y-6 text-slate-200">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">System Pulse</h1>
          <p className="text-slate-400 mt-1">Deep dive into your API performance and consumption patterns.</p>
        </div>
        <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-700/50">
          {['24h', '7d', '30d'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={cn(
                "px-4 py-2 text-xs font-bold uppercase rounded-lg transition-all",
                timeframe === tf ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20" : "text-slate-500 hover:text-slate-300"
              )}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#1E2130]/40 border-purple-500/10">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold text-white">Latency (P99)</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Measured in milliseconds</p>
            </div>
            <div className="flex items-center gap-2 text-teal-400 font-mono text-sm font-bold bg-teal-400/10 px-3 py-1 rounded-lg">
              <Zap className="w-3 h-3" />
              avg: {avgLatency > 0 ? `${avgLatency}ms` : '0ms'}
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyUsage}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" vertical={false} />
                <XAxis dataKey="name" stroke="#4A5568" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#4A5568" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#141721', border: '1px solid #7C3AED33', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="requests" stroke="#7C3AED" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="bg-[#1E2130]/40 border-purple-500/10">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold text-white">Status Distribution</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Response codes over time</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyUsage}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" vertical={false} />
                <XAxis dataKey="name" stroke="#4A5568" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#4A5568" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#141721', border: '1px solid #7C3AED33', borderRadius: '12px' }}
                />
                <Bar dataKey="requests" fill="#7C3AED" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-[#1E2130]/40 border-purple-500/10 p-0 overflow-hidden">
          <div className="p-6 border-b border-purple-500/10">
            <h3 className="text-lg font-bold text-white">Top Endpoints</h3>
            <p className="text-xs text-slate-500">Most consumed API resources by request volume.</p>
          </div>
          <div className="divide-y divide-purple-500/10">
            {(endpointsRes || []).map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 px-6 hover:bg-white/5 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="text-xs font-mono bg-slate-900 border border-slate-700/50 px-2 py-1 rounded text-purple-400">{i + 1}</div>
                  <div>
                    <p className="text-sm font-mono text-white group-hover:text-purple-400 transition-colors">{item.endpoint}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Latency avg: {item.avg_latency != null ? Number(item.avg_latency).toFixed(0) : 'N/A'}ms</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white font-mono">{item.request_count}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="bg-[#1E2130]/40 border-purple-500/10">
          <h3 className="text-lg font-bold text-white mb-6">Request Summary</h3>
          <div className="space-y-5">
            {[
              {
                label: 'Total Requests',
                value: analyticsRes?.summary?.totalRequests ?? 0,
                color: 'bg-purple-500',
              },
              {
                label: 'Successful (2xx)',
                value: analyticsRes?.summary?.successCount ?? 0,
                color: 'bg-teal-400',
              },
              {
                label: 'Client Errors (4xx+)',
                value: analyticsRes?.summary?.errorCount ?? 0,
                color: 'bg-amber-500',
              },
            ].map((item) => {
              const total = analyticsRes?.summary?.totalRequests || 1;
              const pct = Math.min(100, Math.round((item.value / total) * 100));
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-400 font-medium">{item.label}</span>
                    <span className="text-white font-bold font-mono">
                      {item.value.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-black/30 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${item.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="pt-2 border-t border-purple-500/10">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-medium">Error Rate</span>
                <span className="text-amber-400 font-bold font-mono">
                  {(analyticsRes?.summary?.errorRate ?? 0).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
