import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Activity, 
  Key, 
  BarChart3, 
  CreditCard, 
  Play, 
  Webhook, 
  Settings,
  Zap,
  UserRound
} from 'lucide-react';
import { cn } from '../../utils';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

const ownerNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Activity, label: 'Activity', path: '/activity' },
  { icon: Key, label: 'API Keys', path: '/keys' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: CreditCard, label: 'Billing', path: '/billing' },
  { icon: Play, label: 'Playground', path: '/playground' },
  { icon: Webhook, label: 'Webhooks', path: '/webhooks' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

const consumerNavItems = [
  { icon: UserRound, label: 'Consumer', path: '/consumer' },
  { icon: Play, label: 'Playground', path: '/playground' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export const Sidebar = () => {
  const location = useLocation();

  const { data: profile } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/me').then(r => r.data.data),
  });

  const { data: usageData, isLoading: usageLoading } = useQuery({
    queryKey: ['billing-current'],
    queryFn: () => api.get('/billing/current').then(r => r.data.data),
    enabled: Boolean(profile) && profile?.role !== 'consumer',
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const navItems = profile?.role === 'consumer' ? consumerNavItems : ownerNavItems;

  const planName = usageData?.plan?.name || 'Free';
  const quota = Number(usageData?.plan?.free_quota || 0);
  const used = usageData?.requests_this_month || 0;
  const pct = quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0;
  const isConsumer = profile?.role === 'consumer';

  return (
    <div className="w-60 h-screen bg-[#141721] border-r border-purple-500/20 flex flex-col fixed left-0 top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.4)]">
          <Zap className="text-white w-5 h-5 fill-current" />
        </div>
        <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
          MeterFlow
        </span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
              location.pathname === item.path
                ? "bg-purple-500/10 border border-purple-500/30 text-purple-400 shadow-[0_0_20px_rgba(124,58,237,0.1)]"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            <item.icon className={cn("w-5 h-5", location.pathname === item.path ? "text-purple-400" : "text-slate-500 group-hover:text-slate-300")} />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-6 text-slate-200">
        <div className="rounded-2xl bg-gradient-to-br from-[#7C3AED]/20 to-[#06B6D4]/20 border border-purple-500/30 p-4">
          <p className="text-[10px] font-bold text-purple-300 uppercase tracking-widest mb-1">Current Plan</p>
          <p className="text-white font-bold mb-3 text-lg">{isConsumer ? 'Consumer' : usageLoading ? 'Loading...' : `${planName} Tier`}</p>
          {!isConsumer ? (
            <>
              <div className="w-full bg-black/40 h-1.5 rounded-full mb-2 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-1000',
                    pct >= 90 ? 'bg-red-400' : pct >= 75 ? 'bg-amber-400' : 'bg-teal-400'
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400">
                {usageLoading ? 'Syncing usage...' : `${used.toLocaleString()} / ${quota.toLocaleString()} reqs`}
              </p>
            </>
          ) : (
            <p className="text-[10px] text-slate-400 leading-relaxed">Use keys shared by API owners in the playground.</p>
          )}
        </div>
      </div>
    </div>
  );
};
