import { Link } from 'react-router-dom';
import { Card, Button } from '../components/ui/Base';
import { Play, Shield, KeyRound } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export default function ConsumerHome() {
  const { data: profile } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/me').then((r) => r.data.data),
  });

  return (
    <div className="space-y-8">
      <div className="max-w-5xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Consumer Console</h1>
            <p className="text-slate-400 mt-1">Use API keys provided by an API owner and test gateway requests.</p>
          </div>
          <div className="px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold uppercase">
            {profile?.role || 'consumer'}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-[#1E2130]/40 border-purple-500/10">
            <Shield className="w-8 h-8 text-purple-400 mb-4" />
            <h2 className="text-lg font-bold text-white">Authenticated Access</h2>
            <p className="text-sm text-slate-400 mt-2">Consumer accounts can test APIs without managing owner billing or keys.</p>
          </Card>
          <Card className="bg-[#1E2130]/40 border-purple-500/10">
            <KeyRound className="w-8 h-8 text-teal-400 mb-4" />
            <h2 className="text-lg font-bold text-white">Use Provided Keys</h2>
            <p className="text-sm text-slate-400 mt-2">Paste a full API key from an owner into the playground to call the gateway.</p>
          </Card>
          <Card className="bg-[#1E2130]/40 border-purple-500/10">
            <Play className="w-8 h-8 text-amber-400 mb-4" />
            <h2 className="text-lg font-bold text-white">Gateway Playground</h2>
            <p className="text-sm text-slate-400 mt-2">Exercise GET, POST, PUT, and DELETE calls through MeterFlow.</p>
          </Card>
        </div>

        <Link to="/playground">
          <Button className="bg-purple-600 gap-2">
            <Play className="w-4 h-4" />
            Open Playground
          </Button>
        </Link>
      </div>
    </div>
  );
}
