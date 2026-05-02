import axios from 'axios';
import { supabase } from './supabase';
import { demoAdapter, isDemoMode } from './demo';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use(async (config) => {
  if (isDemoMode()) {
    config.adapter = demoAdapter;
    return config;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

export function getApiErrorMessage(error: any, fallback = 'Request failed. Please try again.') {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

export default api;
