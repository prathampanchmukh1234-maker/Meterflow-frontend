import type { AxiosResponse } from 'axios';

export const DEMO_STORAGE_KEY = 'meterflow.demo';

export function isDemoMode() {
  return localStorage.getItem(DEMO_STORAGE_KEY) === 'true';
}

export function startDemoMode() {
  localStorage.setItem(DEMO_STORAGE_KEY, 'true');
}

export function stopDemoMode() {
  localStorage.removeItem(DEMO_STORAGE_KEY);
}

const profile = {
  id: 'demo-user',
  email: 'demo@meterflow.app',
  name: 'Demo Viewer',
  role: 'api_owner',
  plan_id: 'plan-pro',
  created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  plans: {
    name: 'Pro',
    free_quota: 10000,
    price_per_100_requests: 0.4,
    rate_limit_per_minute: 500,
    monthly_price_inr: 999,
  },
};

const plans = [
  { id: 'plan-free', name: 'Free', free_quota: 1000, price_per_100_requests: 0.5, rate_limit_per_minute: 60, monthly_price_inr: 0 },
  { id: 'plan-pro', name: 'Pro', free_quota: 10000, price_per_100_requests: 0.4, rate_limit_per_minute: 500, monthly_price_inr: 999 },
  { id: 'plan-enterprise', name: 'Enterprise', free_quota: 100000, price_per_100_requests: 0.2, rate_limit_per_minute: 5000, monthly_price_inr: 4999 },
];

const apis = [
  { id: 'api-products', name: 'Products API', description: 'Product catalog upstream', base_url: 'https://api.example.com/v1', is_active: true, created_at: new Date().toISOString() },
  { id: 'api-orders', name: 'Orders API', description: 'Order processing upstream', base_url: 'https://orders.example.com', is_active: true, created_at: new Date().toISOString() },
  { id: 'api-legacy', name: 'Legacy Reports', description: 'Read-only reports service', base_url: 'https://reports.example.com', is_active: false, created_at: new Date().toISOString() },
];

const keys = [
  { id: 'key-live', api_id: 'api-products', user_id: 'demo-user', key_prefix: 'mf9A2x', name: 'Production Web', status: 'active', last_used_at: new Date().toISOString(), apis: { name: 'Products API' } },
  { id: 'key-staging', api_id: 'api-orders', user_id: 'demo-user', key_prefix: 's7Qp11', name: 'Staging Server', status: 'active', last_used_at: new Date(Date.now() - 3600000).toISOString(), apis: { name: 'Orders API' } },
  { id: 'key-old', api_id: 'api-legacy', user_id: 'demo-user', key_prefix: 'k0Ld22', name: 'Old Integration', status: 'rotated', last_used_at: null, apis: { name: 'Legacy Reports' } },
];

const usageLogs = Array.from({ length: 18 }, (_, index) => {
  const statuses = [200, 200, 200, 201, 400, 429, 502];
  const methods = ['GET', 'POST', 'GET', 'PUT'];
  const endpoints = ['/gateway/products', '/gateway/orders/42', '/gateway/reports/monthly', '/gateway/products/search'];
  return {
    id: `log-${index}`,
    api_key_id: keys[index % keys.length].id,
    api_id: apis[index % apis.length].id,
    user_id: 'demo-user',
    endpoint: endpoints[index % endpoints.length],
    method: methods[index % methods.length],
    response_status: statuses[index % statuses.length],
    latency_ms: 80 + index * 13,
    timestamp: new Date(Date.now() - index * 24 * 60 * 60000).toISOString(),
    api_keys: { key_prefix: keys[index % keys.length].key_prefix },
  };
});

function dailyUsage() {
  return Array.from({ length: 12 }, (_, index) => ({
    name: `${index * 2}:00`,
    requests: 140 + Math.round(Math.sin(index / 2) * 45) + index * 18,
  }));
}

function response<T>(url: string, data: T): AxiosResponse {
  return {
    data: { success: true, message: 'Demo data', data },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: { url } as any,
  };
}

export async function demoAdapter(config: any): Promise<AxiosResponse> {
  const method = String(config.method || 'get').toLowerCase();
  const rawUrl = String(config.url || '');
  const url = rawUrl.replace(/^\/api/, '');

  if (method !== 'get') {
    return Promise.reject({
      response: {
        status: 403,
        statusText: 'Demo Mode',
        data: {
          success: false,
          message: 'Demo mode is read-only. Sign up to create APIs, keys, invoices, or payments.',
        },
      },
    });
  }

  if (url.startsWith('/me')) return response(url, profile);
  if (url.startsWith('/plans')) return response(url, plans);
  if (url.startsWith('/apis')) return response(url, apis);
  if (url.startsWith('/keys')) return response(url, keys);
  if (url.startsWith('/webhooks')) return response(url, [
    { id: 'hook-1', endpoint_url: 'https://hooks.example.com/meterflow', events: ['usage.limit_reached', 'billing.invoice_ready'], secret: 'demo_secret_12345678', is_active: true },
  ]);
  if (url.startsWith('/billing/current')) return response(url, {
    requests_this_month: 6420,
    plan_id: 'plan-pro',
    plan: profile.plans,
  });
  if (url.startsWith('/billing')) return response(url, [
    { id: 'inv-demo-paid', period_start: new Date(Date.now() - 35 * 86400000).toISOString(), period_end: new Date(Date.now() - 5 * 86400000).toISOString(), total_requests: 18400, free_quota_used: 10000, billable_requests: 8400, amount_inr: 33.6, status: 'paid', invoice_id: 'pay_demo_123' },
    { id: 'inv-demo-pending', period_start: new Date(Date.now() - 5 * 86400000).toISOString(), period_end: new Date().toISOString(), total_requests: 6420, free_quota_used: 6420, billable_requests: 0, amount_inr: 0, status: 'paid' },
  ]);
  if (url.startsWith('/analytics/usage')) return response(url, {
    dailyUsage: dailyUsage(),
    summary: {
      totalRequests: 6420,
      successCount: 6034,
      errorCount: 386,
      errorRate: 6.01,
      growth: 18,
    },
  });
  if (url.startsWith('/analytics/endpoints')) return response(url, [
    { endpoint: '/gateway/products', requests: 2840, avg_latency: 118 },
    { endpoint: '/gateway/orders/42', requests: 1900, avg_latency: 164 },
    { endpoint: '/gateway/products/search', requests: 1120, avg_latency: 132 },
  ]);
  if (url.startsWith('/analytics/logs')) return response(url, { logs: usageLogs, total: usageLogs.length, page: 1, limit: 50 });
  if (url.startsWith('/notifications')) return response(url, [
    { id: 'n1', type: 'billing', title: 'Plan active', message: 'Pro plan is active for this demo workspace.', created_at: new Date().toISOString(), severity: 'success' },
    { id: 'n2', type: 'usage', title: 'Traffic spike', message: 'Products API traffic is up 18% today.', created_at: new Date(Date.now() - 3600000).toISOString(), severity: 'info' },
  ]);

  return response(url, null);
}
