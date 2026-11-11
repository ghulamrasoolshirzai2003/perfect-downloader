'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Download, Menu, X, Shield, Activity, Sparkles } from 'lucide-react';

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
              Perfect Downloader
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                PRO
              </span>
            </span>
            <span className="text-xs text-slate-400 block -mt-0.5">Universal Media & Toolkit</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <Link href="/#downloader" className="hover:text-white transition-colors">
            Universal Downloader
          </Link>
          <Link href="/#tools" className="hover:text-white transition-colors">
            Media Tools
          </Link>
          <Link href="/#platforms" className="hover:text-white transition-colors">
            Platforms
          </Link>
          <Link href="/#privacy" className="hover:text-white transition-colors flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            Zero-Retention
          </Link>
          <Link href="/status" className="hover:text-white transition-colors flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            System Health
          </Link>
        </nav>

        {/* Mobile menu toggle */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950/95 px-4 pt-2 pb-6 space-y-3 text-sm">
          <Link
            href="/#downloader"
            onClick={() => setMobileOpen(false)}
            className="block py-2 text-slate-300 hover:text-white"
          >
            Universal Downloader
          </Link>
          <Link
            href="/#tools"
            onClick={() => setMobileOpen(false)}
            className="block py-2 text-slate-300 hover:text-white"
          >
            Media Tools
          </Link>
          <Link
            href="/#platforms"
            onClick={() => setMobileOpen(false)}
            className="block py-2 text-slate-300 hover:text-white"
          >
            Platforms
          </Link>
          <Link
            href="/#privacy"
            onClick={() => setMobileOpen(false)}
            className="block py-2 text-emerald-400"
          >
            Zero-Retention Guarantee
          </Link>
          <Link
            href="/status"
            onClick={() => setMobileOpen(false)}
            className="block py-2 text-blue-400"
          >
            System Health & APIs
          </Link>
        </div>
      )}
    </header>
  );
}
