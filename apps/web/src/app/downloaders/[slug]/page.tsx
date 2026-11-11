import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PLATFORMS, getPlatform } from '@pd/shared';
import { UniversalDownloader } from '../../../components/UniversalDownloader';
import { ShieldCheck, ArrowLeft, Check, AlertCircle, Info } from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return PLATFORMS.map((p) => ({ slug: p.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const platform = getPlatform(slug);
  if (!platform) return {};

  return {
    title: `${platform.name} Media Downloader — Fast, Free & Private`,
    description: `Download video and audio from ${platform.name}. Direct download with real quality selection, audio extraction, and zero permanent storage.`,
    alternates: {
      canonical: `https://perfectdownloader.com/downloaders/${platform.id}`,
    },
    openGraph: {
      title: `${platform.name} Downloader — Perfect Downloader`,
      description: `Fast and secure ${platform.name} media inspection and downloading tool.`,
    },
  };
}

export default async function PlatformPage({ params }: Props) {
  const { slug } = await params;
  const platform = getPlatform(slug);

  if (!platform) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      {/* Back Link */}
      <Link
        href="/#platforms"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to all platforms</span>
      </Link>

      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: platform.color }}
          />
          <span className="text-white">{platform.name} Downloader</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Download Media from {platform.name}
        </h1>

        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          Inspect available resolutions, formats, and audio tracks from {platform.name}.
          Processed with high-speed ephemeral delivery and zero retention.
        </p>
      </div>

      {/* Downloader Input */}
      <div className="pt-4">
        <UniversalDownloader />
      </div>

      {/* Capabilities & Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            Supported Media Operations
          </h3>
          <ul className="space-y-2 text-xs text-slate-300">
            {platform.operations.map((op) => (
              <li key={op} className="flex items-center gap-2 capitalize">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                {op.replace('_', ' ')}
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400" />
            Known Limitations & Terms
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {platform.termsNote || 'Please ensure you have permission to download this media.'}
          </p>
          {platform.limitations.length > 0 && (
            <div className="pt-2 border-t border-slate-800/80 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Limitations</span>
              <ul className="text-xs text-slate-400 space-y-1">
                {platform.limitations.map((lim, i) => (
                  <li key={i}>• {lim}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
