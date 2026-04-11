import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plus, Zap, FileText, BarChart2, CheckCircle2,
  Clock, AlertCircle, Loader2, ArrowUpRight, Sparkles,
} from "lucide-react";
import { useJobs, useStats } from "@/hooks/useQueries";
import { useAuthStore } from "@/hooks/useAuthStore";
import { PLATFORM_LABELS, PLATFORM_ICONS, type Job, type JobStatus } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { clsx } from "clsx";

const STATUS_CONFIG: Record<JobStatus, { label: string; icon: any; color: string }> = {
  pending:      { label: "Queued",       icon: Clock,        color: "text-amber-600 bg-amber-50 border-amber-200"   },
  transcribing: { label: "Transcribing", icon: Loader2,      color: "text-blue-600 bg-blue-50 border-blue-200"     },
  processing:   { label: "Processing",   icon: Loader2,      color: "text-purple-600 bg-purple-50 border-purple-200" },
  completed:    { label: "Done",         icon: CheckCircle2, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  failed:       { label: "Failed",       icon: AlertCircle,  color: "text-red-600 bg-red-50 border-red-200"         },
};

const STAT_CARDS = (stats: any) => [
  { label: "Total jobs",      value: stats?.total_jobs ?? 0,      icon: FileText,    bg: "bg-blue-50",   icon_c: "text-blue-500",    border: "border-blue-100"   },
  { label: "Pieces created",  value: stats?.total_outputs ?? 0,   icon: Zap,         bg: "bg-brand-50",  icon_c: "text-brand-500",   border: "border-brand-100"  },
  { label: "Credits used",    value: stats?.credits_used ?? 0,    icon: BarChart2,   bg: "bg-amber-50",  icon_c: "text-amber-500",   border: "border-amber-100"  },
  { label: "Credits left",    value: stats?.credits_remaining ?? 0, icon: CheckCircle2, bg: "bg-emerald-50", icon_c: "text-emerald-500", border: "border-emerald-100" },
];

function StatCard({ label, value, icon: Icon, bg, icon_c, border }: any) {
  return (
    <div className={clsx("card p-5 border", border)}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide">{label}</p>
        <div className={clsx("w-8 h-8 rounded-xl flex items-center justify-center", bg)}>
          <Icon className={clsx("w-4 h-4", icon_c)} />
        </div>
      </div>
      <p className="font-display text-3xl font-extrabold text-ink-950 tracking-tight">{value}</p>
    </div>
  );
}

function JobRow({ job, index }: { job: Job; index: number }) {
  const cfg = STATUS_CONFIG[job.status];
  const Icon = cfg.icon;
  const spinning = ["processing", "transcribing"].includes(job.status);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <Link
        to={`/dashboard/jobs/${job.id}`}
        className="flex items-center gap-4 px-4 py-3.5 hover:bg-surface rounded-xl transition-all group"
      >
        {/* Content type icon */}
        <div className="w-9 h-9 rounded-xl bg-surface border border-ink-100 flex items-center justify-center shrink-0 text-base group-hover:border-brand-200 group-hover:bg-brand-50 transition-colors">
          {job.content_type === "audio" ? "🎙️" : job.content_type === "video" ? "🎬" : job.content_type === "url" ? "🔗" : "📝"}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-ink-900 text-sm truncate group-hover:text-brand-600 transition-colors">
            {job.title || `Job #${job.id}`}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-ink-400">
              {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
            </span>
            <span className="text-ink-200 text-xs">·</span>
            <div className="flex items-center gap-0.5">
              {job.platforms.slice(0, 5).map((p) => (
                <span key={p} className="text-xs leading-none" title={PLATFORM_LABELS[p as keyof typeof PLATFORM_LABELS]}>
                  {PLATFORM_ICONS[p as keyof typeof PLATFORM_ICONS]}
                </span>
              ))}
              {job.platforms.length > 5 && (
                <span className="text-[10px] text-ink-400 ml-1">+{job.platforms.length - 5}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span className={clsx("badge text-[11px]", cfg.color)}>
            <Icon className={clsx("w-3 h-3", spinning && "animate-spin")} />
            {cfg.label}
          </span>
          <ArrowUpRight className="w-3.5 h-3.5 text-ink-300 group-hover:text-brand-400 transition-colors" />
        </div>
      </Link>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: jobs, isLoading: jobsLoading } = useJobs();

  const firstName = user?.full_name?.split(" ")[0] || "Creator";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-2xl font-extrabold text-ink-950 tracking-tight"
          >
            {greeting}, {firstName} 👋
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-ink-500 text-sm mt-1"
          >
            {stats?.total_outputs
              ? `You've generated ${stats.total_outputs} pieces of content so far. Keep going!`
              : "Ready to repurpose your content? Create your first job below."}
          </motion.p>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }}>
          <Link to="/dashboard/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            New job
          </Link>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statsLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card p-5">
                <div className="skeleton h-3 w-20 mb-4" />
                <div className="skeleton h-8 w-14" />
              </div>
            ))
          : STAT_CARDS(stats).map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <StatCard {...card} />
              </motion.div>
            ))
        }
      </div>

      {/* Empty state */}
      {!jobsLoading && jobs?.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card border-dashed border-2 p-14 text-center mb-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-5 animate-float">
            <Sparkles className="w-8 h-8 text-brand-500" />
          </div>
          <h2 className="font-display text-xl font-bold text-ink-900 mb-2">No jobs yet</h2>
          <p className="text-ink-500 text-sm max-w-sm mx-auto mb-7 leading-relaxed">
            Paste a blog post, drop a YouTube URL, or upload an audio file — get 10 platform-ready pieces in under 60 seconds.
          </p>
          <Link to="/dashboard/new" className="btn-primary">
            <Zap className="w-4 h-4" /> Create your first job
          </Link>
        </motion.div>
      )}

      {/* Job list */}
      {(jobs?.length ?? 0) > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between">
            <h2 className="font-display font-bold text-ink-900">Recent jobs</h2>
            <span className="text-xs text-ink-400 bg-surface px-2.5 py-1 rounded-full border border-ink-100">
              {jobs?.length} total
            </span>
          </div>
          <div className="p-2 divide-y divide-ink-50">
            {jobsLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4">
                    <div className="skeleton w-9 h-9 rounded-xl" />
                    <div className="flex-1">
                      <div className="skeleton h-3.5 w-44 mb-2" />
                      <div className="skeleton h-3 w-28" />
                    </div>
                    <div className="skeleton h-6 w-20 rounded-full" />
                  </div>
                ))
              : jobs?.slice(0, 12).map((job, i) => <JobRow key={job.id} job={job} index={i} />)
            }
          </div>
        </motion.div>
      )}
    </div>
  );
}
