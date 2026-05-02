import React, { useState } from 'react';
import { Card, Button } from '../components/ui/Base';
import { Play, Send, Terminal, Loader2, Code2, Download } from 'lucide-react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { cn } from '../utils';

export default function Playground() {
  const [method, setMethod] = useState('GET');
  const [endpoint, setEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [body, setBody] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const handleSend = async () => {
    if (!apiKey || !endpoint) return;

    // Validate JSON body before attempting the request
    if (method !== 'GET' && method !== 'HEAD' && body.trim()) {
      try {
        JSON.parse(body);
      } catch {
        setResponse({
          status: 400,
          statusText: 'Invalid JSON',
          latency: '0ms',
          data: { error: 'Request body contains invalid JSON. Check your syntax and try again.' }
        });
        return;
      }
    }

    setIsLoading(true);
    setResponse(null);
    const start = Date.now();

    try {
      const res = await axios({
        method,
        url: `/api/gateway/${endpoint}`,
        data: method !== 'GET' ? JSON.parse(body || '{}') : undefined,
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });
      setResponse({
        status: res.status,
        statusText: res.statusText,
        latency: `${Date.now() - start}ms`,
        data: res.data
      });
    } catch (err: any) {
      setResponse({
        status: err.response?.status || 500,
        statusText: err.response?.statusText || 'Error',
        latency: `${Date.now() - start}ms`,
        data: err.response?.data || { error: err.message }
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">API Playground</h1>
        <p className="text-slate-400 mt-1">Test your configured endpoints through the MeterFlow secure gateway.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 text-slate-200">
        <div className="space-y-6">
          <Card className="bg-[#1E2130]/40 border-purple-500/10">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-white">
              <Terminal className="w-5 h-5 text-[#7C3AED]" />
              Request Configuration
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider ml-1">API Key (paste your full secret key)</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={apiKey} 
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Paste your full API key here..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-4 text-sm font-mono focus:border-purple-500 outline-none text-white"
                  />
                </div>
                <p className="text-[9px] text-slate-500 ml-1 italic">
                  Your key was shown once on creation. Check API Keys page if you need to rotate it.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <select 
                  value={method} 
                  onChange={(e) => setMethod(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 font-bold text-xs focus:border-[#7C3AED] outline-none text-white"
                >
                  <option>GET</option>
                  <option>POST</option>
                  <option>PUT</option>
                  <option>DELETE</option>
                </select>
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono">/gateway/</span>
                  <input 
                    type="text" 
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    placeholder="v1/resource"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 pl-20 pr-4 text-sm font-mono focus:border-purple-500/50 outline-none text-white"
                  />
                </div>
              </div>

              {method !== 'GET' && (
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider ml-1">Request Body (JSON)</label>
                  <textarea 
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-[11px] font-mono h-48 focus:border-purple-500/50 outline-none resize-none text-white"
                    placeholder="{ ... }"
                  />
                </div>
              )}

              <Button onClick={handleSend} disabled={isLoading || !apiKey || !endpoint} className="w-full py-4 gap-2 bg-purple-600">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : <span className="flex items-center gap-2"><Send className="w-5 h-5" /> Execute</span>}
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="h-full flex flex-col bg-[#1E2130]/40 border-purple-500/10 min-h-[500px]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                <Code2 className="w-5 h-5 text-teal-400" />
                Response Viewer
              </h2>
              {response && (
                <div className="flex flex-wrap gap-3">
                   <div className={cn("flex items-center gap-1.5 text-xs font-bold", response.status < 300 ? "text-teal-400" : "text-red-400")}>
                     <div className={cn("w-1.5 h-1.5 rounded-full", response.status < 300 ? "bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.5)]" : "bg-red-400 shadow-[0_0_8px_rgba(244,63,94,0.5)]")} />
                     {response.status} {response.statusText}
                   </div>
                   <div className="text-xs text-slate-500 font-bold font-mono">{response.latency}</div>
                </div>
              )}
            </div>

            <div className="flex-1 bg-black/30 border border-purple-500/10 rounded-xl overflow-y-auto p-4 sm:p-6">
              {!response && !isLoading && (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
                  <Play className="w-12 h-12 opacity-10" />
                  <p className="text-xs font-bold tracking-widest uppercase">Select key and endpoint...</p>
                </div>
              )}

              {isLoading && (
                <div className="space-y-4 animate-pulse">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-2 bg-white/5 rounded-full w-full" style={{ width: `${Math.random() * 40 + 60}%` }} />
                  ))}
                </div>
              )}

              {response && (
                <pre className="text-[11px] font-mono leading-relaxed overflow-x-auto text-slate-300">
                  <code>
                    {JSON.stringify(response.data, null, 2)}
                  </code>
                </pre>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
