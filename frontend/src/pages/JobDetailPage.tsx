import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Copy, Check, Download, Loader2,
  AlertCircle, Clock, CheckCircle2, Sparkles, BarChart2,
} from "lucide-react";
import { clsx } from "clsx";
import { useJob } from "@/hooks/useQueries";
import {
  PLATFORM_LABELS, PLATFORM_ICONS, PLATFORM_COLORS,
  type Platform, type RepurposeOutput,
} from "@/types";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied!");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 text-xs font-medium text-ink-500 hover:text-ink-900 transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function DownloadButton({ content, platform }: { content: string; platform: string }) {
  const download = () => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${platform}-output.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded!");
  };
  return (
    <button
      onClick={download}
      className="flex items-center gap-1.5 text-xs font-medium text-ink-500 hover:text-ink-900 transition-colors"
    >
      <Download className="w-3.5 h-3.5" />
      Download
    </button>
  );
}

function OutputCard({ output }: { output: RepurposeOutput }) {
  const [expanded, setExpanded] = useState(true);
  const colorClass = PLATFORM_COLORS[output.platform] || "bg-ink-50 text-ink-700 border-ink-200";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card overflow-hidden"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-ink-50 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{PLATFORM_ICONS[output.platform]}</span>
          <div>
            <span className={clsx("badge text-xs", colorClass)}>
              {PLATFORM_LABELS[output.platform]}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-ink-400 ml-2">
            <span>{output.word_count} words</span>
            {output.seo_score != null && (
              <span className="flex items-center gap-1">
                <BarChart2 className="w-3 h-3" />
                SEO {Math.round(output.seo_score)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <CopyButton text={output.content} />
          <DownloadButton content={output.content} platform={output.platform} />
          <span className={clsx("text-ink-300 transition-transform duration-200", !expanded && "rotate-180")}>
            ▲
          </span>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-ink-100 px-5 py-4">
              <pre className="output-prose text-sm leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                {output.content}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StatusBanner({ status, error }: { status: string; error: string | null }) {
  if (status === "completed") return null;

  const configs: Record<string, { icon: any; msg: string; color: string; spin: boolean }> = {
    pending:      { icon: Clock,        msg: "Job is queued and will start shortly…",         color: "bg-amber-50 border-amber-200 text-amber-800",  spin: false },
    transcribing: { icon: Loader2,      msg: "Transcribing your audio/video with AI…",        color: "bg-blue-50 border-blue-200 text-blue-800",     spin: true  },
    processing:   { icon: Sparkles,     msg: "Claude is generating your platform content…",   color: "bg-purple-50 border-purple-200 text-purple-800", spin: true },
    failed:       { icon: AlertCircle,  msg: error || "Something went wrong. Please retry.",  color: "bg-red-50 border-red-200 text-red-800",        spin: false },
  };

  const cfg = configs[status] || configs.pending;
  const Icon = cfg.icon;

  return (
    <div className={clsx("flex items-center gap-3 p-4 rounded-xl border mb-6", cfg.color)}>
      <Icon className={clsx("w-5 h-5 shrink-0", cfg.spin && "animate-spin")} />
      <div>
        <p className="text-sm font-medium">{cfg.msg}</p>
        {["pending", "transcribing", "processing"].includes(status) && (
          <p className="text-xs opacity-70 mt-0.5">This page refreshes automatically.</p>
        )}
      </div>
    </div>
  );
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: job, isLoading } = useJob(Number(id));

  if (isLoading) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="skeleton h-6 w-32 mb-6" />
        <div className="skeleton h-8 w-64 mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-32 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-8 text-center">
        <p className="text-ink-500">Job not found.</p>
        <Link to="/dashboard" className="btn-ghost mt-4">← Back to dashboard</Link>
      </div>
    );
  }

  const copyAll = async () => {
    const all = job.outputs.map((o) =>
      `=== ${PLATFORM_LABELS[o.platform]} ===\n\n${o.content}`
    ).join("\n\n\n");
    await navigator.clipboard.writeText(all);
    toast.success(`Copied all ${job.outputs.length} outputs!`);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Back */}
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to dashboard
      </Link>

      {/* Job header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-950 mb-1">
            {job.title || `Job #${job.id}`}
          </h1>
          <div className="flex items-center gap-3 text-xs text-ink-400">
            <span className="capitalize">{job.content_type}</span>
            <span>·</span>
            <span>{formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
            {job.processing_time_seconds && (
              <>
                <span>·</span>
                <span>Processed in {job.processing_time_seconds.toFixed(1)}s</span>
              </>
            )}
          </div>
        </div>

        {job.status === "completed" && job.outputs.length > 0 && (
          <button onClick={copyAll} className="btn-outline text-xs">
            <Copy className="w-3.5 h-3.5" />
            Copy all ({job.outputs.length})
          </button>
        )}
      </div>

      {/* Status banner */}
      <StatusBanner status={job.status} error={job.error_message} />

      {/* Outputs */}
      {job.outputs.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display font-bold text-ink-900">
              {job.outputs.length} platform{job.outputs.length !== 1 ? "s" : ""} ready
            </h2>
            <span className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Ready to publish
            </span>
          </div>
          {job.outputs.map((output) => (
            <OutputCard key={output.id} output={output} />
          ))}
        </div>
      ) : (
        job.status !== "failed" && (
          <div className="card p-10 text-center">
            <Loader2 className="w-8 h-8 text-brand-400 animate-spin mx-auto mb-4" />
            <p className="text-ink-500 text-sm">Generating your content… check back in a moment.</p>
          </div>
        )
      )}
    </div>
  );
}
