'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PLATFORMS, type PlatformDefinition, type PlatformCategory } from '@pd/shared';
import { ExternalLink, Check, AlertTriangle, ShieldAlert, Sparkles } from 'lucide-react';

export function PlatformGrid() {
  const [selectedFilter, setSelectedFilter] = useState<'all' | PlatformCategory>('all');

  const filtered = PLATFORMS.filter(
    (p) => selectedFilter === 'all' || p.category === selectedFilter,
  );

  return (
    <section id="platforms" className="mt-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Platform Coverage & Status
        </h2>
        <p className="text-sm text-slate-400">
          We believe in honest, transparent platform support. We never pretend unsupported
          platforms work or remove creator attribution without authorization.
        </p>
      </div>

      {/* Category filter pills */}
      <div className="flex items-center justify-center flex-wrap gap-2 mb-8">
        {(['all', 'archive', 'video', 'social', 'music', 'image'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedFilter(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
              selectedFilter === cat
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {cat === 'all' ? 'All Platforms' : cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filtered.map((p) => {
          return (
            <div
              key={p.id}
              className="glass-panel rounded-2xl border border-slate-800/80 p-4 flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="font-bold text-sm text-white">{p.name}</span>
                  </div>

                  {/* Status chip */}
                  {p.baseStatus === 'available' && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" />
                      Available
                    </span>
                  )}
                  {p.baseStatus === 'limited' && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      Limited
                    </span>
                  )}
                  {p.baseStatus === 'restricted' || p.policy === 'restricted' ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                      <ShieldAlert className="w-2.5 h-2.5" />
                      Restricted
                    </span>
                  ) : null}
                  {p.baseStatus === 'planned' && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                      Planned
                    </span>
                  )}
                  {p.baseStatus === 'unavailable' && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                      Unavailable
                    </span>
                  )}
                </div>

                {p.limitations.length > 0 && (
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {p.limitations[0]}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[11px]">
                  {p.lastVerified ? `Tested ${p.lastVerified}` : 'Roadmap'}
                </span>
                <Link
                  href={`/downloaders/${p.id}`}
                  className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                >
                  <span>Guide</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
