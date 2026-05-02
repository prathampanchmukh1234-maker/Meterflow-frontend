import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { supabase } from '../services/supabase';
import { isDemoMode } from '../services/demo';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let active = true;

    if (isDemoMode()) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session || !active) return;

      const socket = io('/', {
        path: '/socket.io',
        auth: { token: session.access_token },
      });

      socket.on('connect', () => setIsConnected(true));
      socket.on('disconnect', () => setIsConnected(false));
      socket.emit('subscribe', session.user.id);
      socketRef.current = socket;
    });

    return () => {
      active = false;
      socketRef.current?.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, []);

  return { socketRef, isConnected };
}
