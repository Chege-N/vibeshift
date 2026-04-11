import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Copy, Check, Download, Loader2, AlertCircle,
  Clock, CheckCircle2, Sparkles, BarChart2, ChevronDown,
  RefreshCw, RotateCcw, FileText,
} from "lucide-react";
import { clsx } from "clsx";
import { useJob } from "@/hooks/useQueries";
import { jobsApi } from "@/utils/api";
import {
  PLATFORM_LABELS, PLATFORM_ICONS, PLATFORM_COLORS,
  type Platform, type RepurposeOutput,
} from "@/types";
import { formatDistanceToNow, format } from "date-fns";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

/* ── Copy button ─────────────────────────────────── */
function CopyBtn({ text, size = "sm" }: { text: string; size?: "sm" | "xs" }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className={clsx("btn-ghost gap-1.5", size === "xs" ? "px-2.5 py-1.5 text-xs" : "px-3 py-1.5 text-xs")}>
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

/* ── SEO score pill ──────────────────────────────── */
function SeoScore({ score }: { score: number }) {
  const color = score >= 70 ? "text-emerald-700 bg-emerald-50 border-emerald-200"
              : score >= 40 ? "text-amber-700 bg-amber-50 border-amber-200"
              :               "text-red-700 bg-red-50 border-red-200";
  return (
    <span className={clsx("badge text-[11px]", color)}>
      <BarChart2 className="w-3 h-3" />
      SEO {Math.round(score)}
    </span>
  );
}

/* ── Output card ─────────────────────────────────── */
function OutputCard({ output, jobId }: { output: RepurposeOutput; jobId: number }) {
  const [open, setOpen] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const queryClient = useQueryClient();

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await jobsApi.regenerateOutput(jobId, output.id);
      queryClient.invalidateQueries({ queryKey: ["jobs", jobId] });
      toast.success(`${PLATFORM_LABELS[output.platform]} regenerated!`);
    } catch {
      toast.error("Regeneration failed — try again");
    } finally {
      setRegenerating(false);
    }
  };

  const download = () => {
    const blob = new Blob([output.content], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${output.platform}-repurposed.txt`;
    a.click();
    toast.success("Downloaded!");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-surface/70 transition-colors text-left"
      >
        <span className="text-xl shrink-0">{PLATFORM_ICONS[output.platform]}</span>
        <div className="flex-1 min-w-0 flex items-center gap-2.5 flex-wrap">
          <span className={clsx("badge text-[11px]", PLATFORM_COLORS[output.platform])}>
            {PLATFORM_LABELS[output.platform]}
          </span>
          <span className="text-xs text-ink-400">{output.word_count} words</span>
          {output.seo_score != null && output.seo_score > 0 && (
            <SeoScore score={output.seo_score} />
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <CopyBtn text={output.content} size="xs" />
          <button onClick={download} className="btn-ghost px-2.5 py-1.5 text-xs gap-1.5">
            <Download className="w-3.5 h-3.5" /> Save
          </button>
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="btn-ghost px-2.5 py-1.5 text-xs gap-1.5 text-purple-600 hover:bg-purple-50"
            title="Regenerate with Claude"
          >
            {regenerating
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <RefreshCw className="w-3.5 h-3.5" />}
            {regenerating ? "..." : "Redo"}
          </button>
        </div>
        <ChevronDown className={clsx("w-4 h-4 text-ink-300 transition-transform shrink-0 ml-1", open && "rotate-180")} />
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="border-t border-ink-100 px-5 py-4 bg-surface/40">
              <pre className="output-prose max-h-[500px] overflow-y-auto">
                {output.content}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Status banner ───────────────────────────────── */
function StatusBanner({ status, error }: { status: string; error: string | null }) {
  if (status === "completed") return null;
  const map: Record<string, { icon: any; msg: string; color: string; spin: boolean }> = {
    pending:      { icon: Clock,       msg: "Job is queued and will start shortly…",       color: "bg-amber-50 border-amber-200 text-amber-800",    spin: false },
    transcribing: { icon: Loader2,     msg: "Transcribing your audio/video…",              color: "bg-blue-50 border-blue-200 text-blue-800",        spin: true  },
    processing:   { icon: Sparkles,    msg: "Claude is generating your platform content…", color: "bg-purple-50 border-purple-200 text-purple-800",  spin: true  },
    failed:       { icon: AlertCircle, msg: error || "Something went wrong. Try retrying.", color: "bg-red-50 border-red-200 text-red-800",           spin: false },
  };
  const cfg = map[status] || map.pending;
  const Icon = cfg.icon;
  return (
    <div className={clsx("flex items-start gap-3 p-4 rounded-2xl border mb-6", cfg.color)}>
      <Icon className={clsx("w-5 h-5 shrink-0 mt-0.5", cfg.spin && "animate-spin")} />
      <div>
        <p className="text-sm font-semibold">{cfg.msg}</p>
        {["pending","transcribing","processing"].includes(status) && (
          <p className="text-xs opacity-70 mt-0.5">This page auto-refreshes every few seconds.</p>
        )}
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────── */
export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: job, isLoading } = useJob(Number(id));
  const queryClient = useQueryClient();
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await jobsApi.retry(Number(id));
      queryClient.invalidateQueries({ queryKey: ["jobs", Number(id)] });
      toast.success("Job re-queued!");
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Retry failed");
    } finally {
      setRetrying(false);
    }
  };

  const copyAll = async () => {
    if (!job?.outputs.length) return;
    const all = job.outputs
      .map((o) => `=== ${PLATFORM_LABELS[o.platform]} ===\n\n${o.content}`)
      .join("\n\n\n---\n\n\n");
    await navigator.clipboard.writeText(all);
    toast.success(`Copied all ${job.outputs.length} outputs!`);
  };

  if (isLoading) return (
    <div className="p-8 max-w-3xl mx-auto space-y-4">
      <div className="skeleton h-5 w-28 mb-2" />
      <div className="skeleton h-8 w-64 mb-6" />
      {Array.from({length: 3}).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
    </div>
  );

  if (!job) return (
    <div className="p-8 text-center">
      <p className="text-ink-500 mb-4">Job not found.</p>
      <Link to="/dashboard" className="btn-outline">← Back to dashboard</Link>
    </div>
  );

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Back */}
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-900 mb-6 transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to dashboard
      </Link>

      {/* Job header */}
      <div className="flex items-start justify-between mb-2 gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-extrabold text-ink-950 tracking-tight truncate">
            {job.title || `Job #${job.id}`}
          </h1>
          <div className="flex items-center flex-wrap gap-2 mt-2 text-xs text-ink-400">
            <span className="capitalize flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> {job.content_type}
            </span>
            <span>·</span>
            <span>{formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
            {job.processing_time_seconds && (
              <><span>·</span><span>Generated in {job.processing_time_seconds.toFixed(1)}s</span></>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {job.status === "failed" && (
            <button onClick={handleRetry} disabled={retrying} className="btn-outline text-xs gap-1.5">
              {retrying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              Retry
            </button>
          )}
          {job.status === "completed" && job.outputs.length > 0 && (
            <button onClick={copyAll} className="btn-outline text-xs gap-1.5">
              <Copy className="w-3.5 h-3.5" />
              Copy all ({job.outputs.length})
            </button>
          )}
        </div>
      </div>

      {/* Status banner */}
      <StatusBanner status={job.status} error={job.error_message} />

      {/* Outputs */}
      {job.outputs.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-display font-bold text-ink-900 text-lg">
              {job.outputs.length} platform{job.outputs.length !== 1 ? "s" : ""} ready
            </h2>
            <span className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Ready to publish
            </span>
          </div>
          {job.outputs.map((output) => (
            <OutputCard key={output.id} output={output} jobId={job.id} />
          ))}
        </div>
      )}

      {/* Waiting state */}
      {job.outputs.length === 0 && job.status !== "failed" && (
        <div className="card p-14 text-center">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Sparkles className="w-7 h-7 text-purple-500" />
          </div>
          <p className="text-ink-600 font-medium">Generating your content…</p>
          <p className="text-ink-400 text-sm mt-1">This usually takes 15–30 seconds.</p>
        </div>
      )}
    </div>
  );
}
