import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { TOOLS, getToolByRoute } from '@pd/shared';
import { ToolkitSection } from '../../../../components/ToolkitSection';
import { ArrowLeft, CheckCircle2, ShieldCheck, Cpu } from 'lucide-react';

interface Props {
  params: Promise<{ category: string; tool: string }>;
}

export async function generateStaticParams() {
  return TOOLS.map((t) => ({ category: t.category, tool: t.action }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, tool } = await params;
  const toolDef = getToolByRoute(category, tool);
  if (!toolDef) return {};

  return {
    title: `${toolDef.name} — Online, Free & Fast`,
    description: `${toolDef.summary} Free, secure, in-browser media tool powered by native FFmpeg and Sharp with zero permanent storage.`,
    alternates: {
      canonical: `https://perfectdownloader.com/tools/${category}/${tool}`,
    },
  };
}

export default async function ToolPage({ params }: Props) {
  const { category, tool } = await params;
  const toolDef = getToolByRoute(category, tool);

  if (!toolDef) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <Link
        href="/#tools"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to all tools</span>
      </Link>

      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-400 uppercase tracking-wider">
          {toolDef.category} tool
        </span>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          {toolDef.name}
        </h1>

        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          {toolDef.summary}
        </p>

        <div className="flex items-center justify-center gap-6 text-xs text-slate-400 pt-2">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            No account required
          </span>
          <span className="flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            Runs on high-speed native workers
          </span>
        </div>
      </div>

      <div className="pt-4">
        <ToolkitSection />
      </div>
    </div>
  );
}
