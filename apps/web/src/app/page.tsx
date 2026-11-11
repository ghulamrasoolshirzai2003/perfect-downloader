import React from 'react';
import { UniversalDownloader } from '../components/UniversalDownloader';
import { ToolkitSection } from '../components/ToolkitSection';
import { PlatformGrid } from '../components/PlatformGrid';
import { EducationalSection } from '../components/EducationalSection';
import { ShieldCheck, Zap, Sparkles, Cpu } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="relative pb-20">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-600/10 via-purple-600/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="pt-16 sm:pt-24 pb-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        {/* Badges */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs font-medium text-slate-300 shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Next-Generation Universal Media Platform</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
          Download, Convert & Process Media{' '}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            Without Limits.
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-400 leading-relaxed">
          The all-in-one privacy-first platform. Download videos, extract pristine audio, convert
          images, compress files, and merge PDFs directly in your browser. No account needed.
        </p>

        {/* Value props */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Zero-Retention Privacy
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-blue-400" />
            No Account Required
          </span>
          <span className="flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-indigo-400" />
            Native FFmpeg & Sharp
          </span>
        </div>

        {/* Universal URL Downloader Component */}
        <div className="pt-6">
          <UniversalDownloader />
        </div>
      </section>

      {/* Media Toolkit (Workflow B) */}
      <ToolkitSection />

      {/* Platform Registry */}
      <PlatformGrid />

      {/* How it works, Privacy Guarantee, FAQ */}
      <EducationalSection />
    </div>
  );
}
