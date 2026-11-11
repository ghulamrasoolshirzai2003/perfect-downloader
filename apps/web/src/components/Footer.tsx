import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Heart, Terminal, FileText } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400 text-sm mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1 */}
          <div className="space-y-4">
            <span className="font-bold text-base text-white tracking-tight">
              Perfect Downloader
            </span>
            <p className="text-xs text-slate-400 leading-relaxed">
              Universal online media toolkit engineered for speed, privacy, and reliability.
              No user accounts required. Zero permanent storage.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>100% Stateless & Ephemeral</span>
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider">
              Downloaders
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/downloaders/archive" className="hover:text-white transition-colors">
                  Internet Archive Downloader
                </Link>
              </li>
              <li>
                <Link href="/downloaders/wikimedia" className="hover:text-white transition-colors">
                  Wikimedia Commons Downloader
                </Link>
              </li>
              <li>
                <Link href="/downloaders/youtube" className="hover:text-white transition-colors">
                  YouTube Downloader
                </Link>
              </li>
              <li>
                <Link href="/downloaders/tiktok" className="hover:text-white transition-colors">
                  TikTok Downloader
                </Link>
              </li>
              <li>
                <Link href="/downloaders/instagram" className="hover:text-white transition-colors">
                  Instagram Downloader
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider">
              Media Tools
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/tools/video/convert" className="hover:text-white transition-colors">
                  Video Converter
                </Link>
              </li>
              <li>
                <Link href="/tools/video/compress" className="hover:text-white transition-colors">
                  Video Compressor
                </Link>
              </li>
              <li>
                <Link href="/tools/audio/convert" className="hover:text-white transition-colors">
                  MP3 / Audio Converter
                </Link>
              </li>
              <li>
                <Link href="/tools/image/compress" className="hover:text-white transition-colors">
                  Image Compressor
                </Link>
              </li>
              <li>
                <Link href="/tools/pdf/merge" className="hover:text-white transition-colors">
                  PDF Merger
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider">
              Legal & System
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/status" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  API & Health Status
                </Link>
              </li>
              <li>
                <Link href="/#privacy" className="hover:text-white transition-colors">
                  Privacy & Retention Policy
                </Link>
              </li>
              <li>
                <span className="text-slate-500">
                  Respect creator rights. Do not download copyrighted works without authorization.
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800/80 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Perfect Downloader. Built with Next.js, Fastify, FFmpeg, and Sharp.</p>
          <div className="flex items-center gap-4">
            <span>Production v0.1.0</span>
            <span>•</span>
            <span>All temporary data discarded in 15m</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
