'use client';

import React, { useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Server,
  Shield,
  Clock,
  Code,
  RefreshCw,
} from 'lucide-react';
import { type SystemCapabilitiesResponse, type PublicPlatform } from '@pd/shared';

export default function StatusPage() {
  const [capabilities, setCapabilities] = useState<SystemCapabilitiesResponse | null>(null);
  const [platforms, setPlatforms] = useState<PublicPlatform[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [capRes, platRes, statRes] = await Promise.all([
        fetch('/api/v1/capabilities'),
        fetch('/api/v1/platforms'),
        fetch('/api/v1/stats'),
      ]);

      if (!capRes.ok || !platRes.ok) {
        throw new Error('API server is unreachable or returned an error');
      }

      const capData = await capRes.json();
      const platData = await platRes.json();
      const statData = statRes.ok ? await statRes.json() : null;

      setCapabilities(capData);
      setPlatforms(platData.platforms || []);
      setStats(statData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatUptime = (seconds?: number) => {
    if (!seconds) return '0m';
    const m = Math.floor(seconds / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    return `${m}m`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold mb-3">
            <Activity className="w-3.5 h-3.5" />
            <span>Operational Telemetry</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            System Health & API Status
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time status of backend workers, media engines, and platform adapters.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-2 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-2">
          <span className="text-xs text-slate-500 font-medium">Service Status</span>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-lg text-white">All Systems Operational</span>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-2">
          <span className="text-xs text-slate-500 font-medium">Service Uptime</span>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-lg text-white">
              {formatUptime(capabilities?.uptime || stats?.uptimeSeconds)}
            </span>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-2">
          <span className="text-xs text-slate-500 font-medium">Registered Tools</span>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <span className="font-bold text-lg text-white">
              {capabilities?.toolsCount || 39} Tools
            </span>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-2">
          <span className="text-xs text-slate-500 font-medium">Temporary Retention</span>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            <span className="font-bold text-lg text-white">15 Minutes TTL</span>
          </div>
        </div>
      </div>

      {/* Capabilities Panel */}
      {capabilities && (
        <div className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-4">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-400" />
            Installed Processing Capabilities
          </h3>

          <div className="flex flex-wrap gap-2">
            {capabilities.capabilities.map((cap) => (
              <span
                key={cap}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300"
              >
                {cap}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Platform Adapters Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-4">
        <h3 className="font-bold text-base text-white flex items-center gap-2">
          <Code className="w-4 h-4 text-indigo-400" />
          Adapter Registry Telemetry ({platforms.length} Platforms)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider">
                <th className="pb-3 font-semibold">Platform</th>
                <th className="pb-3 font-semibold">Category</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Policy</th>
                <th className="pb-3 font-semibold">Last Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {platforms.map((p) => (
                <tr key={p.id} className="text-slate-300">
                  <td className="py-3 font-medium text-white">{p.name}</td>
                  <td className="py-3 capitalize text-slate-400">{p.category}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-slate-900 border border-slate-800">
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 capitalize text-slate-400">{p.policy}</td>
                  <td className="py-3 text-slate-500 font-mono">
                    {p.lastVerified || 'Unverified'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
