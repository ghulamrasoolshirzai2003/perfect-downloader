'use client';

import React, { useState, useEffect } from 'react';
import {
  Download,
  Link as LinkIcon,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Video,
  Music,
  FileText,
  Clock,
  User,
  ShieldAlert,
  ArrowRight,
  Clipboard,
} from 'lucide-react';
import {
  detectPlatform,
  type InspectResult,
  type MediaStreamFormat,
  type JobState,
} from '@pd/shared';

export function UniversalDownloader({ initialUrl = '' }: { initialUrl?: string }) {
  const [url, setUrl] = useState(initialUrl);
  const [detectedPlatform, setDetectedPlatform] = useState<any>(null);
  const [inspecting, setInspecting] = useState(false);
  const [inspectResult, setInspectResult] = useState<InspectResult | null>(null);
  const [inspectError, setInspectError] = useState<string | null>(null);

  // Download options
  const [selectedFormatId, setSelectedFormatId] = useState<string>('');
  const [targetConversion, setTargetConversion] = useState<string>('original');
  const [attestationAccepted, setAttestationAccepted] = useState(false);
  const [activeTab, setActiveTab] = useState<'video' | 'audio' | 'subtitles'>('video');

  // Job progress
  const [activeJob, setActiveJob] = useState<JobState | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);

  // Real-time syntactic detection
  useEffect(() => {
    if (!url.trim()) {
      setDetectedPlatform(null);
      return;
    }
    try {
      const res = detectPlatform(url);
      setDetectedPlatform(res.platform || null);
    } catch {
      setDetectedPlatform(null);
    }
  }, [url]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
    } catch {
      // clipboard access denied
    }
  };

  const handleInspect = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;

    setInspecting(true);
    setInspectError(null);
    setInspectResult(null);
    setActiveJob(null);
    setJobError(null);

    try {
      const res = await fetch('/api/v1/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error?.message || 'Could not inspect media URL');
      }

      const data: InspectResult = body.data;
      setInspectResult(data);

      // Select default format
      if (data.bestVideo) {
        setSelectedFormatId(data.bestVideo.formatId);
        setActiveTab('video');
      } else if (data.bestAudio) {
        setSelectedFormatId(data.bestAudio.formatId);
        setActiveTab('audio');
      } else if (data.formats[0]) {
        setSelectedFormatId(data.formats[0].formatId);
      }
    } catch (err: any) {
      setInspectError(err.message);
    } finally {
      setInspecting(false);
    }
  };

  const handleStartDownload = async () => {
    if (!inspectResult || !selectedFormatId) return;

    if (inspectResult.platform.requiresAttestation && !attestationAccepted) {
      setJobError('Please confirm the attestation checkbox before downloading.');
      return;
    }

    setJobError(null);

    try {
      const payload: any = {
        url: inspectResult.url,
        formatId: selectedFormatId,
        attestation: attestationAccepted,
      };
      if (targetConversion === 'mp3') {
        payload.targetFormat = 'mp3';
      }

      const res = await fetch('/api/v1/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error?.message || 'Failed to start download');
      }

      const job: JobState = body.job;
      setActiveJob(job);
      pollJob(job.id);
    } catch (err: any) {
      setJobError(err.message);
    }
  };

  const pollJob = (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/v1/jobs/${jobId}`);
        if (!res.ok) {
          clearInterval(interval);
          setJobError('Failed to check download status');
          return;
        }

        const body = await res.json();
        const job: JobState = body.job;
        setActiveJob(job);

        if (job.status === 'completed') {
          clearInterval(interval);
          // Trigger browser download automatically
          if (job.downloadUrl) {
            window.location.href = job.downloadUrl;
          }
        } else if (job.status === 'failed') {
          clearInterval(interval);
          setJobError(job.error?.message || 'Download processing failed');
        }
      } catch {
        clearInterval(interval);
      }
    }, 800);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return null;
    const mb = bytes / (1024 * 1024);
    if (mb < 1) return `${Math.round(bytes / 1024)} KB`;
    return `${mb.toFixed(1)} MB`;
  };

  const formatDuration = (sec?: number) => {
    if (!sec || sec <= 0) return null;
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const videoFormats = inspectResult?.formats.filter((f) => f.hasVideo) || [];
  const audioFormats = inspectResult?.formats.filter((f) => f.isAudioOnly) || [];

  return (
    <div id="downloader" className="w-full max-w-4xl mx-auto">
      {/* Search / Input Box */}
      <form onSubmit={handleInspect} className="relative group">
        <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center bg-slate-900/90 border border-slate-700/80 rounded-2xl p-2 shadow-2xl backdrop-blur-xl transition-all focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/20">
          <div className="flex items-center flex-1 px-3 py-2">
            <LinkIcon className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste media link (e.g. archive.org, wikimedia, youtube, vimeo)..."
              className="w-full bg-transparent text-white placeholder-slate-500 text-sm sm:text-base focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 px-2 pb-2 sm:pb-0">
            {!url && (
              <button
                type="button"
                onClick={handlePaste}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
              >
                <Clipboard className="w-3.5 h-3.5" />
                Paste
              </button>
            )}

            <button
              type="submit"
              disabled={inspecting || !url.trim()}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
            >
              {inspecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Inspecting...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Inspect Media</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Real-time detected platform pill */}
        {detectedPlatform && (
          <div className="mt-2.5 flex items-center gap-2 px-2 text-xs text-slate-400">
            <span>Detected:</span>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium"
              style={{
                backgroundColor: `${detectedPlatform.color}15`,
                color: detectedPlatform.color,
                border: `1px solid ${detectedPlatform.color}40`,
              }}
            >
              {detectedPlatform.name}
              {detectedPlatform.policy === 'open' && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-semibold">
                  Open
                </span>
              )}
              {detectedPlatform.policy === 'restricted' && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-semibold">
                  Restricted
                </span>
              )}
            </span>
          </div>
        )}
      </form>

      {/* Error Banner */}
      {inspectError && (
        <div className="mt-6 p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold block">Inspection Notice</span>
            <p className="text-xs text-red-300 leading-relaxed">{inspectError}</p>
          </div>
        </div>
      )}

      {/* Inspection Results Card */}
      {inspectResult && (
        <div className="mt-8 glass-panel rounded-2xl border border-slate-800 p-6 space-y-6 shadow-2xl">
          {/* Header & Meta */}
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {inspectResult.thumbnail ? (
              <div className="relative w-full md:w-56 h-36 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
                <img
                  src={inspectResult.thumbnail}
                  alt={inspectResult.title}
                  className="w-full h-full object-cover"
                />
                {inspectResult.duration && (
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-white text-[11px] font-mono">
                    {formatDuration(inspectResult.duration)}
                  </span>
                )}
              </div>
            ) : (
              <div className="w-full md:w-48 h-32 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 text-slate-500">
                <Video className="w-8 h-8" />
              </div>
            )}

            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {inspectResult.platform.name}
                </span>
                {inspectResult.uploadDate && (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {inspectResult.uploadDate}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-lg text-white leading-snug line-clamp-2">
                {inspectResult.title}
              </h3>
              {inspectResult.uploader && (
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  {inspectResult.uploader}
                </p>
              )}
            </div>
          </div>

          {/* Formats Selector Tabs */}
          <div className="border-t border-slate-800 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => setActiveTab('video')}
                className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  activeTab === 'video'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                Video Formats ({videoFormats.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('audio')}
                className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  activeTab === 'audio'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                Audio Only ({audioFormats.length})
              </button>
              {inspectResult.subtitles.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('subtitles')}
                  className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    activeTab === 'subtitles'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Subtitles ({inspectResult.subtitles.length})
                </button>
              )}
            </div>

            {/* Quality list */}
            {activeTab === 'video' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {videoFormats.map((f) => {
                  const isSelected = selectedFormatId === f.formatId;
                  const size = formatFileSize(f.filesize || f.filesizeApprox);
                  return (
                    <button
                      key={f.formatId}
                      type="button"
                      onClick={() => setSelectedFormatId(f.formatId)}
                      className={`text-left p-3 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-white">
                          {f.qualityLabel || f.resolution || 'Standard'}
                        </span>
                        <span className="text-[11px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {f.ext}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                        <span>{f.vcodec?.split('.')[0] || 'video'}</span>
                        {size && <span>{size}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {activeTab === 'audio' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {audioFormats.map((f) => {
                  const isSelected = selectedFormatId === f.formatId;
                  const size = formatFileSize(f.filesize || f.filesizeApprox);
                  return (
                    <button
                      key={f.formatId}
                      type="button"
                      onClick={() => setSelectedFormatId(f.formatId)}
                      className={`text-left p-3 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-white">
                          {f.qualityLabel || 'Audio Stream'}
                        </span>
                        <span className="text-[11px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {f.ext}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                        <span>{f.acodec?.split('.')[0] || 'audio'}</span>
                        {size && <span>{size}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {activeTab === 'subtitles' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {inspectResult.subtitles.map((sub, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-sm text-white block">{sub.name}</span>
                      <span className="text-xs text-slate-400 uppercase font-mono">{sub.ext}</span>
                    </div>
                    {sub.url && (
                      <a
                        href={sub.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white"
                      >
                        Download
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Attestation & Transcode Options */}
          <div className="border-t border-slate-800 pt-6 space-y-4">
            {inspectResult.platform.requiresAttestation && (
              <label className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={attestationAccepted}
                  onChange={(e) => setAttestationAccepted(e.target.checked)}
                  className="mt-1 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-amber-200/90 leading-relaxed">
                  <strong className="block text-amber-300 mb-0.5">Content Authorization Confirmation</strong>
                  I confirm that I own this media or have explicit permission from the creator/rights holder to download it.
                </span>
              </label>
            )}

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Transcode to:</span>
                <select
                  value={targetConversion}
                  onChange={(e) => setTargetConversion(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
                >
                  <option value="original">Original Format</option>
                  <option value="mp3">Convert to MP3 (Audio)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleStartDownload}
                disabled={Boolean(activeJob && activeJob.status === 'processing')}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Process & Download</span>
              </button>
            </div>
          </div>

          {/* Active Job Progress View */}
          {activeJob && (
            <div className="border-t border-slate-800 pt-6 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white flex items-center gap-2">
                  {activeJob.status === 'processing' && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />}
                  {activeJob.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  {activeJob.progress?.stage || 'Preparing download...'}
                </span>
                <span className="text-slate-400 font-mono">
                  {activeJob.progress?.percent !== undefined ? `${activeJob.progress.percent}%` : ''}
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300 rounded-full"
                  style={{ width: `${activeJob.progress?.percent || (activeJob.status === 'completed' ? 100 : 15)}%` }}
                />
              </div>

              {activeJob.progress?.speed && (
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Speed: {activeJob.progress.speed}</span>
                  {activeJob.progress.eta && <span>ETA: {activeJob.progress.eta}</span>}
                </div>
              )}

              {activeJob.status === 'completed' && (
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-emerald-400">Download complete!</span>
                  <a
                    href={activeJob.downloadUrl}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Save File Again
                  </a>
                </div>
              )}
            </div>
          )}

          {jobError && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{jobError}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
