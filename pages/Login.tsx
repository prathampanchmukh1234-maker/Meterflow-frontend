import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Card, Button } from '../components/ui/Base';
import { Key, Mail, Lock, Loader2, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { startDemoMode, stopDemoMode } from '../services/demo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState<'api_owner' | 'consumer'>('api_owner');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleDemoPreview = async () => {
    await supabase.auth.signOut();
    startDemoMode();
    navigate('/dashboard');
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      stopDemoMode();
      if (isSignUp) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name, role },
            emailRedirectTo: `${(import.meta as any).env.VITE_APP_URL || window.location.origin}/login`,
          }
        });
        if (signUpError) throw signUpError;
        if (signUpData.session) {
          const profile = await api.get('/me').then((r) => r.data.data).catch(() => null);
          navigate(profile?.role === 'consumer' ? '/consumer' : '/dashboard');
          return;
        }
        setSuccessMsg("Account created. If email confirmation is enabled in Supabase, use the confirmation link sent to your inbox before signing in.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInError) throw signInError;
        const profile = await api.get('/me').then((r) => r.data.data).catch(() => null);
        navigate(profile?.role === 'consumer' ? '/consumer' : '/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1117] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-purple-600/20 p-4 rounded-3xl border border-purple-500/30">
              <Rocket className="w-10 h-10 sm:w-12 sm:h-12 text-purple-500" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter">METERFLOW</h1>
          <p className="text-slate-500 font-mono text-xs uppercase tracking-widest mt-2">API Metering & Billing Platform</p>
        </div>

        <Card className="bg-[#1E2130]/60 border-purple-500/20 backdrop-blur-xl p-4 sm:p-8 shadow-2xl">
          <form onSubmit={handleAuth} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl text-center font-bold">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm p-4 rounded-xl text-center font-bold">
                {successMsg}
              </div>
            )}

            {isSignUp && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>
            )}

            {isSignUp && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Account Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'api_owner', label: 'API Owner' },
                    { value: 'consumer', label: 'Consumer' },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setRole(item.value as 'api_owner' | 'consumer')}
                      className={`rounded-xl border px-4 py-3 text-xs font-bold uppercase transition-colors ${
                        role === item.value
                          ? 'bg-purple-600 text-white border-purple-400'
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:border-purple-500 transition-colors"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:border-purple-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-900/40 relative overflow-hidden group"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Key className="w-4 h-4" />
                  {isSignUp ? 'CREATE ACCOUNT' : 'SECURE SIGN IN'}
                </span>
              )}
            </Button>

            {!isSignUp && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleDemoPreview}
                className="w-full py-3 border-teal-500/20 text-teal-300 hover:text-white"
              >
                Preview Demo Workspace
              </Button>
            )}
          </form>

          <div className="mt-8 text-center pt-6 border-t border-white/5">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-slate-400 hover:text-purple-400 text-sm font-medium transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </Card>

        <p className="text-center text-slate-600 text-xs">
          By continuing, you agree to our Terms of Service.
        </p>
      </div>
    </div>
  );
}
