'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Zap,
  Lock,
  Trash2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  FileCheck2,
} from 'lucide-react';

const FAQS = [
  {
    q: 'Do I need to create an account to download media or use media tools?',
    a: 'No. Guest access is fully supported for all basic downloads and media processing tools. We do not require registration, email addresses, or phone numbers.',
  },
  {
    q: 'How long are my uploaded and converted files kept on your servers?',
    a: 'Temporary files are kept only for the duration of processing and up to 15 minutes so you can download them. After 15 minutes, automated sweeps delete them from disk. We do not operate a permanent media library.',
  },
  {
    q: 'Why are some platforms marked "Restricted" or disabled?',
    a: 'We respect platform terms of service and creator rights. Platforms whose terms prohibit third-party automated downloading are disabled until the operator completes a legal review. Users must confirm content ownership or permission before downloading.',
  },
  {
    q: 'Can you download videos at 4K and 1080p resolutions?',
    a: 'Yes! When the source platform provides 4K, 1440p, or 1080p streams, we display them directly with their exact codecs and estimated file sizes.',
  },
  {
    q: 'What is the maximum upload file size for the media tools?',
    a: 'The free media tools support files up to 200MB. Larger files can be processed using our desktop utilities or dedicated worker queues.',
  },
  {
    q: 'Can I install Perfect Downloader as an app on my phone?',
    a: 'Yes. Perfect Downloader is a Progressive Web App (PWA). In Safari on iOS, tap "Share > Add to Home Screen". In Chrome on Android, tap "Install App" or "Add to Home screen".',
  },
];

export function EducationalSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="mt-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-28">
      {/* 1. How It Works */}
      <section>
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            How It Works
          </h2>
          <p className="text-sm text-slate-400">
            Engineered for frictionless speed without dark patterns or deceptive download buttons.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3 relative overflow-hidden">
            <span className="text-4xl font-extrabold text-blue-500/20 absolute top-4 right-4">01</span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h3 className="font-bold text-base text-white">Paste Media URL or Drop File</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Paste a link from supported platforms or drop your videos, images, audio, or PDFs
              directly into our toolkit.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3 relative overflow-hidden">
            <span className="text-4xl font-extrabold text-indigo-500/20 absolute top-4 right-4">02</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h3 className="font-bold text-base text-white">Inspect Real Streams & Options</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              See verified resolutions, codecs, audio bitrates, and accurate file sizes. Choose
              your preferred format.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3 relative overflow-hidden">
            <span className="text-4xl font-extrabold text-purple-500/20 absolute top-4 right-4">03</span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h3 className="font-bold text-base text-white">High-Speed Ephemeral Delivery</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Our native processing engines convert and deliver your file instantly. All temporary
              job data is discarded automatically.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Privacy & Zero-Retention Guarantee */}
      <section id="privacy" className="glass-panel rounded-3xl border border-slate-800 p-8 sm:p-12 relative overflow-hidden">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Zero-Retention Policy</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Built for Privacy. No Permanent Storage.
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed">
            Most online downloaders secretly harvest your media or sell your data. Perfect Downloader
            is designed from the ground up to be <strong>stateless and privacy-conscious</strong>:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400 shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-xs text-white">Automatic 15-Min Purge</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Temporary files are wiped from disk immediately after download or within 15 minutes.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-blue-400 shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-xs text-white">No User Tracking</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Guest access by default. We do not log full URLs with private tokens or query parameters.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-purple-400 shrink-0">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-xs text-white">No Database of Media</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  We never index, aggregate, or build public catalogs of files processed through our service.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-amber-400 shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-xs text-white">Direct Stream Delivery</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Whenever possible, media is delivered straight through without caching to disk.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FAQ Accordion */}
      <section className="max-w-3xl mx-auto">
        <div className="text-center mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-400">
            Clear answers about supported platforms, formats, legal policies, and tools.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => {
            const isOpen = openFaq === i;
            return (
              <div
                key={i}
                className="glass-panel rounded-2xl border border-slate-800 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(i)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between text-white font-semibold text-sm hover:text-blue-400 transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-5 pt-1 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
