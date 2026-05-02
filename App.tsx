import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PageWrapper } from './components/layout/PageWrapper';
import Dashboard from './pages/Dashboard';
import APIKeys from './pages/APIKeys';
import Analytics from './pages/Analytics';
import Billing from './pages/Billing';
import Playground from './pages/Playground';
import Login from './pages/Login';
import AuthGuard from './components/auth/AuthGuard';
import RoleGuard from './components/auth/RoleGuard';
import Settings from './pages/Settings';
import Activity from './pages/Activity';
import Webhooks from './pages/Webhooks';
import ConsumerHome from './pages/ConsumerHome';
import BillingSuccess from './pages/BillingSuccess';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/consumer" element={<AuthGuard><RoleGuard roles={['consumer']}><PageWrapper><ConsumerHome /></PageWrapper></RoleGuard></AuthGuard>} />
          <Route path="/dashboard" element={<AuthGuard><RoleGuard roles={['api_owner', 'admin']}><PageWrapper><Dashboard /></PageWrapper></RoleGuard></AuthGuard>} />
          <Route path="/keys" element={<AuthGuard><RoleGuard roles={['api_owner', 'admin']}><PageWrapper><APIKeys /></PageWrapper></RoleGuard></AuthGuard>} />
          <Route path="/analytics" element={<AuthGuard><RoleGuard roles={['api_owner', 'admin']}><PageWrapper><Analytics /></PageWrapper></RoleGuard></AuthGuard>} />
          <Route path="/billing" element={<AuthGuard><RoleGuard roles={['api_owner', 'admin']}><PageWrapper><Billing /></PageWrapper></RoleGuard></AuthGuard>} />
          <Route path="/billing/success" element={<AuthGuard><RoleGuard roles={['api_owner', 'admin']}><PageWrapper><BillingSuccess /></PageWrapper></RoleGuard></AuthGuard>} />
          <Route path="/playground" element={<AuthGuard><PageWrapper><Playground /></PageWrapper></AuthGuard>} />
          <Route path="/activity" element={<AuthGuard><RoleGuard roles={['api_owner', 'admin']}><PageWrapper><Activity /></PageWrapper></RoleGuard></AuthGuard>} />
          <Route path="/webhooks" element={<AuthGuard><RoleGuard roles={['api_owner', 'admin']}><PageWrapper><Webhooks /></PageWrapper></RoleGuard></AuthGuard>} />
          <Route path="/settings" element={<AuthGuard><PageWrapper><Settings /></PageWrapper></AuthGuard>} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
