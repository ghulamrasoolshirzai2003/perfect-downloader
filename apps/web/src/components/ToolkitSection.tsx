'use client';

import React, { useState } from 'react';
import {
  TOOLS,
  type ToolDefinition,
  type ToolCategory,
  CATEGORY_LABELS,
  defaultOptions,
  isFieldVisible,
} from '@pd/shared';
import {
  Video,
  Music,
  Image as ImageIcon,
  Film,
  FileText,
  Upload,
  ArrowRight,
  Loader2,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  File,
} from 'lucide-react';

const CATEGORY_ICONS: Record<ToolCategory, any> = {
  video: Video,
  audio: Music,
  image: ImageIcon,
  gif: Film,
  pdf: FileText,
};

export function ToolkitSection() {
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>('video');
  const [activeTool, setActiveTool] = useState<ToolDefinition | null>(null);

  // Active tool state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [formOptions, setFormOptions] = useState<Record<string, any>>({});
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<{ percent?: number; stage?: string } | null>(null);
  const [resultJob, setResultJob] = useState<any>(null);
  const [resultData, setResultData] = useState<Record<string, unknown> | null>(null);
  const [toolError, setToolError] = useState<string | null>(null);

  const categories: ToolCategory[] = ['video', 'audio', 'image', 'gif', 'pdf'];
  const categoryTools = TOOLS.filter((t) => t.category === selectedCategory);

  const openToolModal = (t: ToolDefinition) => {
    setActiveTool(t);
    setSelectedFiles([]);
    setFormOptions(defaultOptions(t));
    setProcessing(false);
    setProgress(null);
    setResultJob(null);
    setResultData(null);
    setToolError(null);
  };

  const closeToolModal = () => {
    setActiveTool(null);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files);
      setSelectedFiles(files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
    }
  };

  const handleExecute = async () => {
    if (!activeTool) return;
    if (selectedFiles.length < activeTool.minFiles) {
      setToolError(`Please select at least ${activeTool.minFiles} file(s).`);
      return;
    }

    setProcessing(true);
    setProgress({ stage: 'Uploading files...' });
    setToolError(null);
    setResultJob(null);
    setResultData(null);

    try {
      const formData = new FormData();
      for (const file of selectedFiles) {
        formData.append('files', file);
      }

      for (const [key, val] of Object.entries(formOptions)) {
        formData.append(key, typeof val === 'object' ? JSON.stringify(val) : String(val));
      }

      const res = await fetch(`/api/v1/tools/${activeTool.category}/${activeTool.action}`, {
        method: 'POST',
        body: formData,
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error?.message || 'Processing failed');
      }

      if (activeTool.output === 'data') {
        setResultData(body.data);
        setProcessing(false);
        return;
      }

      // Async job tracking
      const job = body.job;
      setResultJob(job);
      pollToolJob(job.id);
    } catch (err: any) {
      setToolError(err.message);
      setProcessing(false);
    }
  };

  const pollToolJob = (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/v1/jobs/${jobId}`);
        if (!res.ok) {
          clearInterval(interval);
          setToolError('Failed to check processing status');
          setProcessing(false);
          return;
        }

        const body = await res.json();
        const job = body.job;
        setResultJob(job);
        if (job.progress) {
          setProgress(job.progress);
        }

        if (job.status === 'completed') {
          clearInterval(interval);
          setProcessing(false);
        } else if (job.status === 'failed') {
          clearInterval(interval);
          setProcessing(false);
          setToolError(job.error?.message || 'Processing encountered an error');
        }
      } catch {
        clearInterval(interval);
        setProcessing(false);
      }
    }, 800);
  };

  return (
    <section id="tools" className="mt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Online Media Toolkit
        </h2>
        <p className="text-sm text-slate-400">
          Fast, browser-based media utilities powered by native FFmpeg, Sharp, and PDF-Lib.
          Drag and drop your files — all temporary data is discarded automatically.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center justify-center flex-wrap gap-2 mb-10">
        {categories.map((cat) => {
          const Icon = CATEGORY_ICONS[cat];
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{CATEGORY_LABELS[cat]}</span>
            </button>
          );
        })}
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categoryTools.map((t) => (
          <div
            key={t.id}
            onClick={() => openToolModal(t)}
            className="group glass-panel rounded-2xl border border-slate-800/80 p-5 hover:border-blue-500/50 hover:bg-slate-900/60 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-base text-white group-hover:text-blue-400 transition-colors">
                  {t.name}
                </span>
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  {t.output === 'data' ? 'Inspect' : 'Generate'}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{t.summary}</p>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-blue-400 font-medium">
              <span>Open Tool</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>

      {/* Tool Runner Modal */}
      {activeTool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl relative">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-400 uppercase tracking-wider">
                  {activeTool.category}
                </span>
                <h3 className="font-bold text-xl text-white mt-1">{activeTool.name}</h3>
              </div>
              <button
                onClick={closeToolModal}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* File Dropzone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className="border-2 border-dashed border-slate-700 rounded-2xl p-6 text-center bg-slate-900/40 hover:border-blue-500/60 transition-colors cursor-pointer relative"
            >
              <input
                type="file"
                multiple={activeTool.maxFiles > 1}
                onChange={handleFileInput}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white">
                {selectedFiles.length > 0
                  ? `${selectedFiles.length} file(s) selected`
                  : 'Drop your file here, or browse'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {activeTool.maxFiles > 1
                  ? `Select between ${activeTool.minFiles} and ${activeTool.maxFiles} files (max 200MB)`
                  : 'Select 1 file (max 200MB)'}
              </p>

              {selectedFiles.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {selectedFiles.slice(0, 5).map((f, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] text-slate-300 font-mono flex items-center gap-1"
                    >
                      <File className="w-3 h-3" />
                      {f.name.slice(0, 20)}
                    </span>
                  ))}
                  {selectedFiles.length > 5 && (
                    <span className="text-xs text-slate-400">+{selectedFiles.length - 5} more</span>
                  )}
                </div>
              )}
            </div>

            {/* Dynamic Options Form */}
            {activeTool.fields.length > 0 && (
              <div className="space-y-4 border-t border-slate-800 pt-4">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Options & Settings
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeTool.fields.map((field) => {
                    if (!isFieldVisible(field, formOptions)) return null;

                    return (
                      <div key={field.name} className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-300 block">
                          {field.label}
                        </label>

                        {field.type === 'select' && (
                          <select
                            value={formOptions[field.name] ?? field.default}
                            onChange={(e) =>
                              setFormOptions({ ...formOptions, [field.name]: e.target.value })
                            }
                            className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500"
                          >
                            {field.options.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        )}

                        {field.type === 'number' && (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={field.min}
                              max={field.max}
                              step={field.step || 1}
                              value={formOptions[field.name] ?? field.default}
                              onChange={(e) =>
                                setFormOptions({ ...formOptions, [field.name]: Number(e.target.value) })
                              }
                              className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500"
                            />
                            {field.unit && (
                              <span className="text-xs text-slate-500">{field.unit}</span>
                            )}
                          </div>
                        )}

                        {field.type === 'text' && (
                          <input
                            type="text"
                            maxLength={field.maxLength}
                            placeholder={field.placeholder}
                            value={formOptions[field.name] ?? field.default}
                            onChange={(e) =>
                              setFormOptions({ ...formOptions, [field.name]: e.target.value })
                            }
                            className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500"
                          />
                        )}

                        {field.type === 'time' && (
                          <input
                            type="text"
                            placeholder={field.placeholder || '0:00'}
                            value={formOptions[field.name] ?? field.default}
                            onChange={(e) =>
                              setFormOptions({ ...formOptions, [field.name]: e.target.value })
                            }
                            className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 font-mono"
                          />
                        )}

                        {field.type === 'toggle' && (
                          <label className="flex items-center gap-2 cursor-pointer pt-1">
                            <input
                              type="checkbox"
                              checked={Boolean(formOptions[field.name] ?? field.default)}
                              onChange={(e) =>
                                setFormOptions({ ...formOptions, [field.name]: e.target.checked })
                              }
                              className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-xs text-slate-300">Enable</span>
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Error notice */}
            {toolError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{toolError}</span>
              </div>
            )}

            {/* Progress view */}
            {processing && (
              <div className="space-y-2 p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                    {progress?.stage || 'Processing...'}
                  </span>
                  {progress?.percent !== undefined && (
                    <span className="font-mono text-slate-400">{progress.percent}%</span>
                  )}
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300 rounded-full"
                    style={{ width: `${progress?.percent || 25}%` }}
                  />
                </div>
              </div>
            )}

            {/* Completed Result File */}
            {resultJob && resultJob.status === 'completed' && (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Processing Finished
                  </span>
                  <p className="text-xs text-slate-300 mt-0.5">{resultJob.outputFileName}</p>
                </div>
                <a
                  href={resultJob.downloadUrl}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Result
                </a>
              </div>
            )}

            {/* Completed Data Result (Metadata Inspection) */}
            {resultData && (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-white block">Metadata Inspection Data</span>
                <pre className="text-[11px] font-mono text-slate-300 bg-slate-950 p-3 rounded-lg overflow-x-auto max-h-48">
                  {JSON.stringify(resultData, null, 2)}
                </pre>
              </div>
            )}

            {/* Action footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={closeToolModal}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleExecute}
                disabled={processing || selectedFiles.length < activeTool.minFiles}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Run {activeTool.name}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
