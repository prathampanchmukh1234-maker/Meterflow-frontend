import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Search, Bell, LogOut, CheckCheck, Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { cn } from '../../utils';
import { useSocket } from '../../hooks/useSocket';
import { isDemoMode, stopDemoMode } from '../../services/demo';

type NotificationItem = {
  id: string;
  type: 'account' | 'api' | 'billing' | 'security' | 'usage';
  title: string;
  message: string;
  created_at: string;
  severity: 'info' | 'success' | 'warning' | 'danger';
};

function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export const PageWrapper = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [lastReadAt, setLastReadAt] = useState('');
  const [demoMode, setDemoMode] = useState(false);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { socketRef } = useSocket();

  useEffect(() => {
    const demo = isDemoMode();
    setDemoMode(demo);
    if (demo) {
      setUser({
        email: 'demo@meterflow.app',
        user_metadata: { name: 'Demo Viewer' },
      });
      return;
    }
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    setLastReadAt(localStorage.getItem(`meterflow.notifications.read.${user.id}`) || '');
  }, [user?.id]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const refreshNotifications = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };
    socket.on('usage_event', refreshNotifications);
    return () => {
      socket.off('usage_event', refreshNotifications);
    };
  }, [queryClient, socketRef.current]);

  const { data: notifications = [], isLoading: notificationsLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then((r) => r.data.data ?? []),
    enabled: Boolean(user),
    refetchInterval: 60 * 1000,
  });

  const handleLogout = async () => {
    if (demoMode) {
      stopDemoMode();
      navigate('/login');
      return;
    }
    await supabase.auth.signOut();
    navigate('/login');
  };

  const markNotificationsRead = () => {
    if (!user?.id) return;
    const timestamp = new Date().toISOString();
    localStorage.setItem(`meterflow.notifications.read.${user.id}`, timestamp);
    setLastReadAt(timestamp);
  };

  const unreadCount = useMemo(() => {
    const lastRead = lastReadAt ? new Date(lastReadAt).getTime() : 0;
    return notifications.filter((item: NotificationItem) => new Date(item.created_at).getTime() > lastRead).length;
  }, [lastReadAt, notifications]);

  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#0F1117] text-slate-200 flex">
      <Sidebar />
      <main className="flex-1 md:ml-60 flex min-w-0 flex-col h-screen overflow-hidden">
        <header className="min-h-16 border-b border-purple-500/10 px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between gap-3 bg-[#0F1117]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="relative hidden sm:block w-full max-w-xs lg:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search APIs or logs..."
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-purple-500/50 transition-all"
            />
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-between sm:justify-end gap-3 sm:gap-6">
            <div className="sm:hidden flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center">
                <span className="text-sm font-black text-white">M</span>
              </div>
              <span className="truncate text-base font-bold text-white">MeterFlow</span>
            </div>
            {demoMode && (
              <div className="hidden lg:block rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-300">
                Read-only demo
              </div>
            )}
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={() => setNotificationsOpen((open) => !open)}
                className="relative text-slate-400 hover:text-white transition-colors"
                aria-label="Open notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-4 h-4 px-1 bg-red-500 rounded-full border-2 border-[#0F1117] text-[9px] leading-3 text-white font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="fixed left-4 right-4 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-10 sm:w-96 sm:max-w-[calc(100vw-2rem)] bg-[#171A25] border border-purple-500/20 rounded-xl shadow-2xl overflow-hidden z-[60]">
                  <div className="px-4 py-3 border-b border-purple-500/10 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">Notifications</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">{unreadCount} unread</p>
                    </div>
                    <button
                      type="button"
                      onClick={markNotificationsRead}
                      className="p-2 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-white/5 transition-colors"
                      title="Mark all as read"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notificationsLoading ? (
                      <div className="p-8 text-center text-slate-500">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3 text-purple-400" />
                        <p className="text-xs font-bold uppercase tracking-widest">Loading notifications</p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-sm">No notifications yet.</div>
                    ) : (
                      notifications.map((item: NotificationItem) => {
                        const isUnread = !lastReadAt || new Date(item.created_at).getTime() > new Date(lastReadAt).getTime();
                        return (
                          <div key={item.id} className="px-4 py-3 border-b border-purple-500/10 last:border-b-0 hover:bg-white/[0.03]">
                            <div className="flex items-start gap-3">
                              <span
                                className={cn(
                                  'mt-1 w-2 h-2 rounded-full flex-none',
                                  item.severity === 'success' && 'bg-teal-400',
                                  item.severity === 'warning' && 'bg-amber-400',
                                  item.severity === 'danger' && 'bg-red-400',
                                  item.severity === 'info' && 'bg-purple-400',
                                  !isUnread && 'opacity-30'
                                )}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-sm font-semibold text-white truncate">{item.title}</p>
                                  <span className="text-[10px] text-slate-500 whitespace-nowrap">{timeAgo(item.created_at)}</span>
                                </div>
                                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.message}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-3 sm:pl-6 sm:border-l border-purple-500/10">
              <div className="hidden md:block text-right min-w-0">
                <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                <p className="max-w-44 truncate text-[10px] text-teal-400 font-mono tracking-tighter uppercase">{user?.email}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 text-slate-400 hover:text-red-400 transition-colors group"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-purple-500/50 p-0.5 bg-gradient-to-tr from-purple-600 to-teal-500">
                  <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center font-bold text-sm text-white">
                    {initials}
                  </div>
                </div>
                <LogOut className="hidden sm:block w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-5 pb-28 sm:px-6 lg:p-8 lg:pb-8">
          {children}
        </div>
      </main>
    </div>
  );
};
