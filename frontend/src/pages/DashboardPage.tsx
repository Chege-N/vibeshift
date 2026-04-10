import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Zap, FileText, BarChart2, CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react";
import { useJobs, useStats } from "@/hooks/useQueries";
import { useAuthStore } from "@/hooks/useAuthStore";
import { PLATFORM_LABELS, PLATFORM_ICONS, type Job, type JobStatus } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { clsx } from "clsx";

const STATUS_CONFIG: Record<JobStatus, { label: string; icon: typeof Clock; color: string }> = {
  pending:      { label: "Queued",       icon: Clock,        color: "text-amber-600 bg-amber-50 border-amber-200" },
  transcribing: { label: "Transcribing", icon: Loader2,      color: "text-blue-600 bg-blue-50 border-blue-200" },
  processing:   { label: "Processing",   icon: Loader2,      color: "text-purple-600 bg-purple-50 border-purple-200" },
  completed:    { label: "Done",         icon: CheckCircle2, color: "text-green-700 bg-green-50 border-green-200" },
  failed:       { label: "Failed",       icon: AlertCircle,  color: "text-red-600 bg-red-50 border-red-200" },
};

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-ink-500 font-medium">{label}</p>
        <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center", color)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="font-display text-3xl font-bold text-ink-950">{value}</p>
    </div>
  );
}

function JobRow({ job }: { job: Job }) {
  const cfg = STATUS_CONFIG[job.status];
  const Icon = cfg.icon;
  const isSpinning = ["processing", "transcribing"].includes(job.status);

  return (
    <Link
      to={`/dashboard/jobs/${job.id}`}
      className="flex items-center gap-4 p-4 hover:bg-ink-50 transition-colors rounded-xl group"
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium text-ink-900 text-sm truncate group-hover:text-brand-600 transition-colors">
          {job.title || `Job #${job.id}`}
        </p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-ink-400">
            {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
          </span>
          <span className="text-ink-200">·</span>
          <div className="flex items-center gap-1">
            {job.platforms.slice(0, 4).map((p) => (
              <span key={p} className="text-xs" title={PLATFORM_LABELS[p as keyof typeof PLATFORM_LABELS]}>
                {PLATFORM_ICONS[p as keyof typeof PLATFORM_ICONS]}
              </span>
            ))}
            {job.platforms.length > 4 && (
              <span className="text-xs text-ink-400">+{job.platforms.length - 4}</span>
            )}
          </div>
        </div>
      </div>
      <span className={clsx("badge", cfg.color)}>
        <Icon className={clsx("w-3 h-3", isSpinning && "animate-spin")} />
        {cfg.label}
      </span>
    </Link>
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-950">
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-ink-500 text-sm mt-1">
            {stats
              ? `You've created ${stats.total_outputs} pieces of content so far.`
              : "Let's repurpose some content today."}
          </p>
        </div>
        <Link to="/dashboard/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          New job
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5">
              <div className="skeleton h-4 w-24 mb-3" />
              <div className="skeleton h-8 w-12" />
            </div>
          ))
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
              <StatCard label="Total jobs"     value={stats?.total_jobs ?? 0}      icon={FileText}    color="bg-blue-50 text-blue-600" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <StatCard label="Pieces created" value={stats?.total_outputs ?? 0}   icon={Zap}         color="bg-brand-50 text-brand-600" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <StatCard label="Credits used"   value={stats?.credits_used ?? 0}    icon={BarChart2}   color="bg-amber-50 text-amber-600" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <StatCard label="Remaining"      value={stats?.credits_remaining ?? 0} icon={CheckCircle2} color="bg-green-50 text-green-600" />
            </motion.div>
          </>
        )}
      </div>

      {/* Quick start CTA if no jobs */}
      {!jobsLoading && jobs?.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card p-10 text-center mb-8 border-dashed"
        >
          <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
            <Zap className="w-7 h-7 text-brand-500" />
          </div>
          <h2 className="font-display text-xl font-bold text-ink-900 mb-2">Create your first job</h2>
          <p className="text-ink-500 text-sm max-w-sm mx-auto mb-6">
            Paste a blog post, upload a podcast, or drop a URL — and get 10 platform-ready pieces in under a minute.
          </p>
          <Link to="/dashboard/new" className="btn-primary">
            <Plus className="w-4 h-4" /> Start repurposing
          </Link>
        </motion.div>
      )}

      {/* Recent jobs */}
      {(jobs?.length ?? 0) > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between">
            <h2 className="font-display font-bold text-ink-900">Recent jobs</h2>
            <span className="text-xs text-ink-400">{jobs?.length} total</span>
          </div>
          <div className="divide-y divide-ink-50 p-2">
            {jobsLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 flex items-center gap-4">
                    <div className="flex-1">
                      <div className="skeleton h-4 w-48 mb-2" />
                      <div className="skeleton h-3 w-32" />
                    </div>
                    <div className="skeleton h-6 w-20 rounded-full" />
                  </div>
                ))
              : jobs?.slice(0, 10).map((job) => <JobRow key={job.id} job={job} />)}
          </div>
        </div>
      )}
    </div>
  );
}
